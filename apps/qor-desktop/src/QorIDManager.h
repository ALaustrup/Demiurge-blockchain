/**
 * QorIDManager - Native QorID Integration
 * 
 * Manages QorID authentication and key storage with remote server sync.
 * Connects to QorID service backend for account registration and verification.
 */

#ifndef QORIDMANAGER_H
#define QORIDMANAGER_H

#include <QObject>
#include <QString>
#include <QByteArray>
#include <QNetworkAccessManager>
#include <QNetworkReply>

class QorIDManager : public QObject
{
    Q_OBJECT
    Q_PROPERTY(bool isAuthenticated READ isAuthenticated NOTIFY authChanged)
    Q_PROPERTY(QString username READ username NOTIFY authChanged)
    Q_PROPERTY(QString apiUrl READ apiUrl WRITE setApiUrl NOTIFY apiUrlChanged)

public:
    explicit QorIDManager(QObject *parent = nullptr);
    ~QorIDManager();
    
    // API Configuration
    QString apiUrl() const { return m_apiUrl; }
    void setApiUrl(const QString &url);

    // Authentication (async with callbacks)
    Q_INVOKABLE void registerAccount(const QString &username, const QString &password);
    Q_INVOKABLE void loginWithCredentials(const QString &username, const QString &password);
    Q_INVOKABLE void checkUsernameAvailability(const QString &username);
    Q_INVOKABLE void logout();
    
    // Signing
    Q_INVOKABLE QString signMessage(const QString &message);
    
    // Getters
    Q_INVOKABLE QString getPublicKey() const;
    bool isAuthenticated() const { return m_authenticated; }
    QString username() const { return m_username; }

signals:
    void authChanged();
    void apiUrlChanged();
    void signatureRequested(const QString &message);
    void signatureCompleted(const QString &signature);
    void loginSuccess();
    void loginFailed(const QString &error);
    void registrationSuccess();
    void registrationFailed(const QString &error);
    void usernameAvailable(bool available);

private slots:
    void handleNetworkReply(QNetworkReply *reply);

private:
    void saveToKeychain();
    void loadFromKeychain();
    void generateKeyPair();
    void deriveKeysFromPassword(const QString &username, const QString &password);
    
    QString m_username;
    QByteArray m_privateKey;
    QByteArray m_publicKey;
    bool m_authenticated = false;
    
    // Network
    QNetworkAccessManager *m_networkManager;
    QString m_apiUrl = "http://51.210.209.112:8082";  // QorID service endpoint
    
    // Pending requests tracking
    enum RequestType { CheckUsername, Register, Login };
    QMap<QNetworkReply*, RequestType> m_pendingRequests;
};

#endif // QORIDMANAGER_H
