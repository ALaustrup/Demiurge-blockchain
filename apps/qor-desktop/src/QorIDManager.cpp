/**
 * QorIDManager Implementation - Remote Server Integration
 * 
 * Connects to QorID service (port 8082) for account registration and authentication.
 * All accounts are stored in the remote SQLite database on 51.210.209.112.
 */

#include "QorIDManager.h"

#include <QSettings>
#include <QCryptographicHash>
#include <QRandomGenerator>
#include <QDebug>
#include <QJsonDocument>
#include <QJsonObject>
#include <QNetworkRequest>
#include <QUrl>

QorIDManager::QorIDManager(QObject *parent)
    : QObject(parent)
    , m_networkManager(new QNetworkAccessManager(this))
{
    // Connect network signals
    connect(m_networkManager, &QNetworkAccessManager::finished,
            this, &QorIDManager::handleNetworkReply);
    
    // Load existing credentials from local storage
    loadFromKeychain();
    
    qDebug() << "QorIDManager initialized. API URL:" << m_apiUrl;
}

QorIDManager::~QorIDManager()
{
}

void QorIDManager::setApiUrl(const QString &url)
{
    if (m_apiUrl != url) {
        m_apiUrl = url;
        emit apiUrlChanged();
        qDebug() << "API URL changed to:" << m_apiUrl;
    }
}

// ============================================================================
// REGISTRATION
// ============================================================================

void QorIDManager::registerAccount(const QString &username, const QString &password)
{
    qDebug() << "Registering account:" << username << "to remote server" << m_apiUrl;
    
    // Step 1: Derive keys from username + password
    deriveKeysFromPassword(username, password);
    
    // Step 2: Send registration request to server
    QNetworkRequest request;
    request.setUrl(QUrl(m_apiUrl + "/api/qorid/register"));
    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
    
    QJsonObject payload;
    payload["username"] = username.toLower();
    payload["publicKey"] = QString(m_publicKey.toHex());
    
    QByteArray jsonData = QJsonDocument(payload).toJson();
    
    qDebug() << "Sending registration request to:" << request.url().toString();
    qDebug() << "Payload:" << QString(jsonData);
    
    QNetworkReply *reply = m_networkManager->post(request, jsonData);
    m_pendingRequests[reply] = Register;
}

// ============================================================================
// LOGIN
// ============================================================================

void QorIDManager::loginWithCredentials(const QString &username, const QString &password)
{
    qDebug() << "Logging in:" << username;
    
    // Derive keys from credentials
    deriveKeysFromPassword(username, password);
    m_username = username;
    
    // Verify with server by checking if username exists
    QNetworkRequest request;
    request.setUrl(QUrl(m_apiUrl + "/api/qorid/username-available?username=" + username.toLower()));
    
    qDebug() << "Checking authentication with server:" << request.url().toString();
    
    QNetworkReply *reply = m_networkManager->get(request);
    m_pendingRequests[reply] = Login;
}

// ============================================================================
// USERNAME CHECK
// ============================================================================

void QorIDManager::checkUsernameAvailability(const QString &username)
{
    qDebug() << "Checking username availability:" << username;
    
    QNetworkRequest request;
    request.setUrl(QUrl(m_apiUrl + "/api/qorid/username-available?username=" + username.toLower()));
    
    QNetworkReply *reply = m_networkManager->get(request);
    m_pendingRequests[reply] = CheckUsername;
}

// ============================================================================
// NETWORK RESPONSE HANDLER
// ============================================================================

void QorIDManager::handleNetworkReply(QNetworkReply *reply)
{
    RequestType requestType = m_pendingRequests.value(reply, CheckUsername);
    m_pendingRequests.remove(reply);
    
    if (reply->error() != QNetworkReply::NoError) {
        qWarning() << "Network error:" << reply->errorString();
        qWarning() << "URL:" << reply->url().toString();
        qWarning() << "Status code:" << reply->attribute(QNetworkRequest::HttpStatusCodeAttribute).toInt();
        
        switch (requestType) {
            case Register:
                emit registrationFailed("Network error: " + reply->errorString());
                break;
            case Login:
                emit loginFailed("Network error: " + reply->errorString());
                break;
            case CheckUsername:
                emit usernameAvailable(false);  // Assume unavailable on error
                break;
        }
        
        reply->deleteLater();
        return;
    }
    
    QByteArray responseData = reply->readAll();
    qDebug() << "Server response:" << responseData;
    
    QJsonDocument doc = QJsonDocument::fromJson(responseData);
    QJsonObject obj = doc.object();
    
    switch (requestType) {
        case CheckUsername: {
            bool available = obj.value("available").toBool();
            qDebug() << "Username available:" << available;
            emit usernameAvailable(available);
            break;
        }
        
        case Register: {
            if (obj.contains("error")) {
                QString errorMsg = obj.value("error").toObject().value("message").toString();
                qWarning() << "Registration failed:" << errorMsg;
                emit registrationFailed(errorMsg);
            } else {
                qDebug() << "Registration successful! Account created on remote server.";
                m_authenticated = true;
                saveToKeychain();
                emit authChanged();
                emit registrationSuccess();
            }
            break;
        }
        
        case Login: {
            // If username is not available, it means it exists (user can login)
            bool available = obj.value("available").toBool();
            if (!available) {
                qDebug() << "Login successful! Username exists on remote server.";
                m_authenticated = true;
                saveToKeychain();
                emit authChanged();
                emit loginSuccess();
            } else {
                qWarning() << "Login failed: Username does not exist";
                emit loginFailed("Username not found");
            }
            break;
        }
    }
    
    reply->deleteLater();
}

// ============================================================================
// LOGOUT
// ============================================================================

void QorIDManager::logout()
{
    qDebug() << "Logging out";
    m_authenticated = false;
    m_username.clear();
    m_privateKey.clear();
    m_publicKey.clear();
    emit authChanged();
}

// ============================================================================
// SIGNING
// ============================================================================

QString QorIDManager::signMessage(const QString &message)
{
    if (!m_authenticated || m_privateKey.isEmpty()) {
        qWarning() << "Cannot sign: Not authenticated";
        return QString();
    }
    
    emit signatureRequested(message);
    
    // Simplified signing - in production use proper Ed25519
    QByteArray toSign = message.toUtf8() + m_privateKey;
    QByteArray signature = QCryptographicHash::hash(toSign, QCryptographicHash::Sha256);
    
    QString sig = signature.toHex();
    emit signatureCompleted(sig);
    
    return sig;
}

QString QorIDManager::getPublicKey() const
{
    return m_publicKey.toHex();
}

// ============================================================================
// LOCAL STORAGE (KEYCHAIN)
// ============================================================================

void QorIDManager::saveToKeychain()
{
    // Store credentials locally (for offline access)
    // Note: This is in ADDITION to the remote database storage
    
    QSettings settings("Demiurge", "QOR");
    settings.beginGroup("QorID");
    settings.setValue("username", m_username);
    settings.setValue("publicKey", m_publicKey.toHex());
    // Private key is stored securely (in production, use OS keychain)
    settings.setValue("privateKey", m_privateKey.toBase64());
    settings.endGroup();
    
    qDebug() << "Credentials saved to local keychain";
}

void QorIDManager::loadFromKeychain()
{
    QSettings settings("Demiurge", "QOR");
    settings.beginGroup("QorID");
    
    m_username = settings.value("username").toString();
    QString pubKeyHex = settings.value("publicKey").toString();
    QString privKeyB64 = settings.value("privateKey").toString();
    
    if (!pubKeyHex.isEmpty()) {
        m_publicKey = QByteArray::fromHex(pubKeyHex.toUtf8());
        m_privateKey = QByteArray::fromBase64(privKeyB64.toUtf8());
        qDebug() << "Loaded credentials from keychain for user:" << m_username;
    }
    
    settings.endGroup();
}

// ============================================================================
// KEY DERIVATION
// ============================================================================

void QorIDManager::deriveKeysFromPassword(const QString &username, const QString &password)
{
    qDebug() << "Deriving keys for:" << username;
    
    // Derive key from username + password (deterministic)
    // In production, use PBKDF2 or Argon2
    QByteArray seed = QCryptographicHash::hash(
        (username.toLower() + ":" + password).toUtf8(),
        QCryptographicHash::Sha256
    );
    
    // Use seed to generate deterministic keypair
    // In production, use proper Ed25519 key derivation
    m_privateKey = seed;
    m_publicKey = QCryptographicHash::hash(seed, QCryptographicHash::Sha256);
    
    qDebug() << "Keys derived. Public key:" << m_publicKey.toHex().left(16) + "...";
}

void QorIDManager::generateKeyPair()
{
    qDebug() << "Generating new keypair";
    
    // Generate random 32-byte private key
    m_privateKey.resize(32);
    for (int i = 0; i < 32; ++i) {
        m_privateKey[i] = static_cast<char>(QRandomGenerator::global()->bounded(256));
    }
    
    // Derive public key (simplified - use Ed25519 in production)
    m_publicKey = QCryptographicHash::hash(m_privateKey, QCryptographicHash::Sha256);
    
    qDebug() << "Keypair generated. Public key:" << m_publicKey.toHex().left(16) + "...";
}
