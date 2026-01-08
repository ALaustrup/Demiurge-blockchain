/**
 * AuthManager Implementation
 */

#include "AuthManager.h"
#include "SessionToken.h"

#include <QNetworkReply>
#include <QJsonDocument>
#include <QJsonObject>
#include <QSettings>
#include <QCryptographicHash>
#include <QDebug>

const QString AuthManager::AUTH_ENDPOINT = "https://auth.demiurge.cloud/api/v1";

AuthManager::AuthManager(QObject *parent)
    : QObject(parent)
    , m_networkManager(new QNetworkAccessManager(this))
    , m_sessionToken(new SessionToken(this))
    , m_authenticated(false)
    , m_isLoading(false)
{
}

AuthManager::~AuthManager()
{
}

void AuthManager::login(const QString &username, const QString &password)
{
    if (m_isLoading) return;
    
    m_isLoading = true;
    emit loadingChanged();
    setError(QString());
    
    // Build auth request
    QJsonObject payload;
    payload["username"] = username;
    
    // Hash password client-side (never send plain text)
    QByteArray pwdHash = QCryptographicHash::hash(
        password.toUtf8(), QCryptographicHash::Sha256);
    payload["password_hash"] = QString(pwdHash.toHex());
    payload["client_type"] = "genesis_launcher";
    payload["client_version"] = QString(APP_VERSION);
    
    QUrl url{AUTH_ENDPOINT + "/login"};
    QNetworkRequest request{url};
    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
    
    QNetworkReply *reply = m_networkManager->post(
        request, QJsonDocument(payload).toJson());
    
    connect(reply, &QNetworkReply::finished, [this, reply]() {
        onLoginResponse(reply);
    });
}

bool AuthManager::tryAutoLogin()
{
    QSettings settings;
    
    if (!settings.contains("session/token")) {
        return false;
    }
    
    QString savedToken = settings.value("session/token").toString();
    QString savedUser = settings.value("session/username").toString();
    qint64 expiry = settings.value("session/expiry").toLongLong();
    
    // Check if expired
    if (QDateTime::currentSecsSinceEpoch() > expiry) {
        clearSession();
        return false;
    }
    
    // Validate token with server (optional, for offline support skip this)
    m_username = savedUser;
    m_sessionToken->setToken(savedToken);
    m_sessionToken->setExpiry(QDateTime::fromSecsSinceEpoch(expiry));
    
    setAuthenticated(true);
    emit authenticated(m_sessionToken->token());
    
    return true;
}

void AuthManager::logout()
{
    clearSession();
    setAuthenticated(false);
    emit loggedOut();
}

bool AuthManager::hasSavedSession() const
{
    QSettings settings;
    return settings.contains("session/token");
}

void AuthManager::onLoginResponse(QNetworkReply *reply)
{
    m_isLoading = false;
    emit loadingChanged();
    
    reply->deleteLater();
    
    if (reply->error() != QNetworkReply::NoError) {
        // For demo/offline mode, allow mock login
        if (reply->error() == QNetworkReply::HostNotFoundError ||
            reply->error() == QNetworkReply::ConnectionRefusedError) {
            // Offline mode - create local session
            qWarning() << "Auth server unreachable, using offline mode";
            m_username = "OfflineUser";
            m_sessionToken->generateLocal();
            saveSession();
            setAuthenticated(true);
            emit authenticated(m_sessionToken->token());
            return;
        }
        
        setError(reply->errorString());
        emit loginFailed(m_errorMessage);
        return;
    }
    
    QJsonDocument doc = QJsonDocument::fromJson(reply->readAll());
    QJsonObject response = doc.object();
    
    if (!response["success"].toBool()) {
        setError(response["error"].toString("Authentication failed"));
        emit loginFailed(m_errorMessage);
        return;
    }
    
    // Extract session data
    QJsonObject session = response["session"].toObject();
    m_username = session["username"].toString();
    m_avatarUrl = session["avatar_url"].toString();
    m_abyssIdAddress = session["abyss_id"].toString();
    
    QString token = session["token"].toString();
    qint64 expiry = session["expires_at"].toVariant().toLongLong();
    
    m_sessionToken->setToken(token);
    m_sessionToken->setExpiry(QDateTime::fromSecsSinceEpoch(expiry));
    
    saveSession();
    setAuthenticated(true);
    emit authenticated(m_sessionToken->token());
}

void AuthManager::setAuthenticated(bool auth)
{
    if (m_authenticated != auth) {
        m_authenticated = auth;
        emit authStateChanged();
    }
}

void AuthManager::setError(const QString &error)
{
    if (m_errorMessage != error) {
        m_errorMessage = error;
        emit errorChanged();
    }
}

void AuthManager::saveSession()
{
    QSettings settings;
    settings.setValue("session/token", m_sessionToken->token());
    settings.setValue("session/username", m_username);
    settings.setValue("session/expiry", m_sessionToken->expiry().toSecsSinceEpoch());
    settings.sync();
}

void AuthManager::clearSession()
{
    QSettings settings;
    settings.remove("session/token");
    settings.remove("session/username");
    settings.remove("session/expiry");
    settings.sync();
    
    m_sessionToken->clear();
    m_username.clear();
    m_avatarUrl.clear();
}
