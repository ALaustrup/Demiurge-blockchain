/**
 * AuthManager Implementation
 * 
 * Full authentication flow with offline support and auto-sync.
 */

#include "AuthManager.h"
#include "SessionToken.h"

#include <QNetworkReply>
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QSettings>
#include <QCryptographicHash>
#include <QRandomGenerator>
#include <QClipboard>
#include <QGuiApplication>
#include <QDebug>

const QString AuthManager::AUTH_ENDPOINT = "https://auth.demiurge.cloud/api/v1";

// BIP39-inspired seed word list (subset for demo)
const QStringList AuthManager::SEED_WORDS = {
    "abyss", "cipher", "void", "flame", "shadow", "nexus", "pulse", "drift",
    "echo", "forge", "glitch", "haven", "index", "jade", "karma", "lumen",
    "matrix", "nova", "oracle", "prism", "quark", "rift", "sigil", "token",
    "unity", "vortex", "warp", "xenon", "yield", "zenith", "alpha", "beta",
    "cosmic", "delta", "epoch", "flux", "gamma", "helix", "ion", "jewel",
    "kinetic", "lattice", "meson", "neuron", "omega", "photon", "quantum", "rune"
};

AuthManager::AuthManager(QObject *parent)
    : QObject(parent)
    , m_networkManager(new QNetworkAccessManager(this))
    , m_sessionToken(new SessionToken(this))
    , m_connectivityTimer(new QTimer(this))
    , m_syncTimer(new QTimer(this))
    , m_authenticated(false)
    , m_isLoading(false)
    , m_isOnline(false)
    , m_hasPendingSync(false)
{
    // Setup connectivity check timer (every 30 seconds)
    m_connectivityTimer->setInterval(30000);
    connect(m_connectivityTimer, &QTimer::timeout, this, &AuthManager::checkConnectivity);
    
    // Setup sync timer (every 60 seconds when offline with pending)
    m_syncTimer->setInterval(60000);
    connect(m_syncTimer, &QTimer::timeout, this, &AuthManager::syncPendingAccounts);
    
    // Initial connectivity check
    QTimer::singleShot(500, this, &AuthManager::checkConnectivity);
    
    // Load any pending accounts
    loadPendingAccount();
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
    request.setTransferTimeout(10000); // 10 second timeout
    
    QNetworkReply *reply = m_networkManager->post(
        request, QJsonDocument(payload).toJson());
    
    connect(reply, &QNetworkReply::finished, [this, reply, username]() {
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
    QString savedPublicKey = settings.value("session/publicKey").toString();
    qint64 expiry = settings.value("session/expiry").toLongLong();
    
    // Check if expired
    if (QDateTime::currentSecsSinceEpoch() > expiry) {
        clearSession();
        return false;
    }
    
    // Restore session
    m_username = savedUser;
    m_publicKey = savedPublicKey;
    m_sessionToken->setToken(savedToken);
    m_sessionToken->setExpiry(QDateTime::fromSecsSinceEpoch(expiry));
    
    setAuthenticated(true);
    emit authenticated(m_sessionToken->token());
    
    // Start connectivity monitoring
    m_connectivityTimer->start();
    
    return true;
}

void AuthManager::logout()
{
    m_connectivityTimer->stop();
    m_syncTimer->stop();
    clearSession();
    setAuthenticated(false);
    m_seedPhrase.clear();
    emit seedPhraseChanged();
    emit loggedOut();
}

bool AuthManager::hasSavedSession() const
{
    QSettings settings;
    return settings.contains("session/token");
}

void AuthManager::checkUsernameAvailability(const QString &username)
{
    if (username.length() < 3) {
        emit usernameTaken(username);
        return;
    }
    
    m_pendingUsernameCheck = username;
    
    // If offline, check local records only
    if (!m_isOnline) {
        QSettings settings;
        QStringList localUsers = settings.value("local/usernames").toStringList();
        
        if (localUsers.contains(username.toLower())) {
            emit usernameTaken(username);
        } else {
            emit usernameAvailable(username);
        }
        return;
    }
    
    // Online check
    QUrl url{AUTH_ENDPOINT + "/check-username"};
    QNetworkRequest request{url};
    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
    request.setTransferTimeout(5000);
    
    QJsonObject payload;
    payload["username"] = username;
    
    QNetworkReply *reply = m_networkManager->post(
        request, QJsonDocument(payload).toJson());
    
    connect(reply, &QNetworkReply::finished, [this, reply]() {
        onUsernameCheckResponse(reply);
    });
}

void AuthManager::createAccount(const QString &username)
{
    if (m_isLoading) return;
    
    m_isLoading = true;
    emit loadingChanged();
    setError(QString());
    
    m_pendingCreateUsername = username;
    
    // Generate cryptographic keys locally
    QString publicKey, privateKey, seedPhrase;
    generateKeyPair(publicKey, privateKey, seedPhrase);
    
    m_publicKey = publicKey;
    m_seedPhrase = seedPhrase;
    emit seedPhraseChanged();
    
    // If online, register with server
    if (m_isOnline) {
        QUrl url{AUTH_ENDPOINT + "/register"};
        QNetworkRequest request{url};
        request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
        request.setTransferTimeout(10000);
        
        QJsonObject payload;
        payload["username"] = username;
        payload["public_key"] = publicKey;
        payload["client_type"] = "genesis_launcher";
        
        QNetworkReply *reply = m_networkManager->post(
            request, QJsonDocument(payload).toJson());
        
        // Store for later in case registration fails
        savePendingAccount(username, publicKey, privateKey, seedPhrase);
        
        connect(reply, &QNetworkReply::finished, [this, reply]() {
            onCreateAccountResponse(reply);
        });
    } else {
        // Offline mode - create locally and queue for sync
        savePendingAccount(username, publicKey, privateKey, seedPhrase);
        
        m_username = username;
        m_hasPendingSync = true;
        emit pendingSyncChanged();
        
        // Generate a local session token
        m_sessionToken->generateLocal();
        saveSession();
        
        m_isLoading = false;
        emit loadingChanged();
        
        setAuthenticated(true);
        emit accountCreated(username, publicKey, seedPhrase);
        emit authenticated(m_sessionToken->token());
        
        // Start sync timer
        m_syncTimer->start();
    }
}

void AuthManager::copyToClipboard(const QString &text)
{
    QClipboard *clipboard = QGuiApplication::clipboard();
    if (clipboard) {
        clipboard->setText(text);
    }
}

void AuthManager::syncPendingAccounts()
{
    if (!m_isOnline || !m_hasPendingSync) return;
    
    QSettings settings;
    
    QString pendingUser = settings.value("pending/username").toString();
    QString pendingPubKey = settings.value("pending/publicKey").toString();
    
    if (pendingUser.isEmpty()) {
        m_hasPendingSync = false;
        emit pendingSyncChanged();
        return;
    }
    
    // Try to register with server
    QUrl url{AUTH_ENDPOINT + "/register"};
    QNetworkRequest request{url};
    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
    request.setTransferTimeout(10000);
    
    QJsonObject payload;
    payload["username"] = pendingUser;
    payload["public_key"] = pendingPubKey;
    payload["client_type"] = "genesis_launcher";
    payload["is_sync"] = true;  // Indicate this is a sync operation
    
    QNetworkReply *reply = m_networkManager->post(
        request, QJsonDocument(payload).toJson());
    
    connect(reply, &QNetworkReply::finished, [this, reply, pendingUser]() {
        reply->deleteLater();
        
        if (reply->error() == QNetworkReply::NoError) {
            QJsonDocument doc = QJsonDocument::fromJson(reply->readAll());
            QJsonObject response = doc.object();
            
            if (response["success"].toBool()) {
                // Clear pending
                QSettings settings;
                settings.remove("pending/username");
                settings.remove("pending/publicKey");
                settings.remove("pending/privateKey");
                settings.remove("pending/seedPhrase");
                settings.sync();
                
                m_hasPendingSync = false;
                emit pendingSyncChanged();
                emit accountSynced(pendingUser);
                
                m_syncTimer->stop();
            }
        }
    });
}

void AuthManager::checkConnectivity()
{
    QUrl url{AUTH_ENDPOINT + "/health"};
    QNetworkRequest request{url};
    request.setTransferTimeout(5000);
    
    QNetworkReply *reply = m_networkManager->get(request);
    
    // Timeout handler
    QTimer *timeoutTimer = new QTimer(this);
    timeoutTimer->setSingleShot(true);
    connect(timeoutTimer, &QTimer::timeout, [this, reply, timeoutTimer]() {
        if (reply->isRunning()) {
            reply->abort();
        }
        timeoutTimer->deleteLater();
    });
    timeoutTimer->start(5000);
    
    connect(reply, &QNetworkReply::finished, [this, reply, timeoutTimer]() {
        timeoutTimer->stop();
        onConnectivityCheckResponse(reply);
    });
}

void AuthManager::attemptAutoConnect()
{
    checkConnectivity();
}

void AuthManager::onLoginResponse(QNetworkReply *reply)
{
    m_isLoading = false;
    emit loadingChanged();
    
    reply->deleteLater();
    
    if (reply->error() != QNetworkReply::NoError) {
        // Check if we have a saved session to fall back to
        if (reply->error() == QNetworkReply::HostNotFoundError ||
            reply->error() == QNetworkReply::ConnectionRefusedError ||
            reply->error() == QNetworkReply::TimeoutError) {
            
            setOnline(false);
            
            // Only allow offline if user has previous session
            if (hasSavedSession()) {
                if (tryAutoLogin()) {
                    qInfo() << "Server unreachable, using cached session";
                    return;
                }
            }
            
            // No cached session - must be online to login
            setError("Cannot connect to authentication server. Please check your internet connection.");
            emit loginFailed(m_errorMessage);
            return;
        }
        
        setError(reply->errorString());
        emit loginFailed(m_errorMessage);
        return;
    }
    
    setOnline(true);
    
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
    m_publicKey = session["public_key"].toString();
    
    QString token = session["token"].toString();
    qint64 expiry = session["expires_at"].toVariant().toLongLong();
    
    m_sessionToken->setToken(token);
    m_sessionToken->setExpiry(QDateTime::fromSecsSinceEpoch(expiry));
    
    saveSession();
    setAuthenticated(true);
    
    // Start connectivity monitoring
    m_connectivityTimer->start();
    
    emit authenticated(m_sessionToken->token());
}

void AuthManager::onUsernameCheckResponse(QNetworkReply *reply)
{
    reply->deleteLater();
    
    QString checkedUsername = m_pendingUsernameCheck;
    m_pendingUsernameCheck.clear();
    
    if (reply->error() != QNetworkReply::NoError) {
        // On network error, assume available (will validate on create)
        if (reply->error() == QNetworkReply::HostNotFoundError ||
            reply->error() == QNetworkReply::ConnectionRefusedError) {
            setOnline(false);
            emit usernameAvailable(checkedUsername);
            return;
        }
        emit usernameTaken(checkedUsername);
        return;
    }
    
    setOnline(true);
    
    QJsonDocument doc = QJsonDocument::fromJson(reply->readAll());
    QJsonObject response = doc.object();
    
    if (response["available"].toBool()) {
        emit usernameAvailable(checkedUsername);
    } else {
        emit usernameTaken(checkedUsername);
    }
}

void AuthManager::onCreateAccountResponse(QNetworkReply *reply)
{
    m_isLoading = false;
    emit loadingChanged();
    
    reply->deleteLater();
    
    QString createdUsername = m_pendingCreateUsername;
    m_pendingCreateUsername.clear();
    
    if (reply->error() != QNetworkReply::NoError) {
        // Network error - keep as pending sync
        if (reply->error() == QNetworkReply::HostNotFoundError ||
            reply->error() == QNetworkReply::ConnectionRefusedError ||
            reply->error() == QNetworkReply::TimeoutError) {
            
            setOnline(false);
            m_username = createdUsername;
            m_hasPendingSync = true;
            emit pendingSyncChanged();
            
            m_sessionToken->generateLocal();
            saveSession();
            
            setAuthenticated(true);
            emit accountCreated(createdUsername, m_publicKey, m_seedPhrase);
            emit authenticated(m_sessionToken->token());
            
            m_syncTimer->start();
            return;
        }
        
        setError(reply->errorString());
        emit accountCreationFailed(m_errorMessage);
        return;
    }
    
    setOnline(true);
    
    QJsonDocument doc = QJsonDocument::fromJson(reply->readAll());
    QJsonObject response = doc.object();
    
    if (!response["success"].toBool()) {
        QString error = response["error"].toString("Account creation failed");
        if (error.contains("taken") || error.contains("exists")) {
            emit usernameTaken(createdUsername);
        }
        setError(error);
        emit accountCreationFailed(error);
        return;
    }
    
    // Success - clear pending
    QSettings settings;
    settings.remove("pending/username");
    settings.remove("pending/publicKey");
    settings.remove("pending/privateKey");
    settings.remove("pending/seedPhrase");
    
    // Save to local users list
    QStringList localUsers = settings.value("local/usernames").toStringList();
    localUsers.append(createdUsername.toLower());
    settings.setValue("local/usernames", localUsers);
    settings.sync();
    
    m_hasPendingSync = false;
    emit pendingSyncChanged();
    
    // Extract session from response
    QJsonObject session = response["session"].toObject();
    m_username = createdUsername;
    m_avatarUrl = session["avatar_url"].toString();
    
    QString token = session["token"].toString();
    qint64 expiry = session["expires_at"].toVariant().toLongLong();
    
    m_sessionToken->setToken(token);
    m_sessionToken->setExpiry(QDateTime::fromSecsSinceEpoch(expiry));
    
    saveSession();
    setAuthenticated(true);
    
    m_connectivityTimer->start();
    
    emit accountCreated(createdUsername, m_publicKey, m_seedPhrase);
    emit authenticated(m_sessionToken->token());
}

void AuthManager::onConnectivityCheckResponse(QNetworkReply *reply)
{
    reply->deleteLater();
    
    bool wasOnline = m_isOnline;
    
    if (reply->error() == QNetworkReply::NoError) {
        setOnline(true);
        
        // If just came online and have pending, try sync
        if (!wasOnline && m_hasPendingSync) {
            QTimer::singleShot(1000, this, &AuthManager::syncPendingAccounts);
        }
    } else {
        setOnline(false);
    }
}

void AuthManager::onConnectivityTimeout()
{
    setOnline(false);
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

void AuthManager::setOnline(bool online)
{
    if (m_isOnline != online) {
        m_isOnline = online;
        emit onlineStateChanged();
        
        if (online) {
            qInfo() << "Connection to auth server established";
        } else {
            qWarning() << "Connection to auth server lost";
        }
    }
}

void AuthManager::saveSession()
{
    QSettings settings;
    settings.setValue("session/token", m_sessionToken->token());
    settings.setValue("session/username", m_username);
    settings.setValue("session/publicKey", m_publicKey);
    settings.setValue("session/expiry", m_sessionToken->expiry().toSecsSinceEpoch());
    settings.sync();
}

void AuthManager::clearSession()
{
    QSettings settings;
    settings.remove("session/token");
    settings.remove("session/username");
    settings.remove("session/publicKey");
    settings.remove("session/expiry");
    settings.sync();
    
    m_sessionToken->clear();
    m_username.clear();
    m_avatarUrl.clear();
    m_publicKey.clear();
}

void AuthManager::savePendingAccount(const QString &username, const QString &publicKey,
                                      const QString &privateKey, const QString &seedPhrase)
{
    QSettings settings;
    settings.setValue("pending/username", username);
    settings.setValue("pending/publicKey", publicKey);
    settings.setValue("pending/privateKey", privateKey);  // Encrypted in production
    settings.setValue("pending/seedPhrase", seedPhrase);
    settings.sync();
    
    // Also add to local users list
    QStringList localUsers = settings.value("local/usernames").toStringList();
    if (!localUsers.contains(username.toLower())) {
        localUsers.append(username.toLower());
        settings.setValue("local/usernames", localUsers);
        settings.sync();
    }
}

bool AuthManager::loadPendingAccount()
{
    QSettings settings;
    
    QString pendingUser = settings.value("pending/username").toString();
    if (!pendingUser.isEmpty()) {
        m_hasPendingSync = true;
        emit pendingSyncChanged();
        return true;
    }
    
    return false;
}

void AuthManager::generateKeyPair(QString &publicKey, QString &privateKey, QString &seedPhrase)
{
    // Generate seed phrase
    seedPhrase = generateSeedPhrase();
    
    // Derive keys from seed phrase (simplified - use proper BIP32/39 in production)
    QByteArray seedHash = QCryptographicHash::hash(
        seedPhrase.toUtf8(), QCryptographicHash::Sha256);
    
    // Generate "private key" from seed (simplified)
    privateKey = seedHash.toHex();
    
    // Generate "public key" from private key (simplified - hash of hash)
    QByteArray pubKeyHash = QCryptographicHash::hash(
        seedHash, QCryptographicHash::Sha256);
    
    // Format as Demiurge address
    publicKey = "0x" + QString(pubKeyHash.toHex()).left(40);
}

QString AuthManager::generateSeedPhrase()
{
    QStringList words;
    
    for (int i = 0; i < 8; ++i) {
        int index = QRandomGenerator::global()->bounded(SEED_WORDS.size());
        words.append(SEED_WORDS.at(index));
    }
    
    return words.join(" ");
}
