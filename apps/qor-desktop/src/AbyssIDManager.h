/**
 * AbyssIDManager - Native AbyssID Integration
 * 
 * Manages AbyssID authentication and key storage using the OS keychain.
 */

#ifndef ABYSSIDMANAGER_H
#define ABYSSIDMANAGER_H

#include <QObject>
#include <QString>
#include <QByteArray>

class AbyssIDManager : public QObject
{
    Q_OBJECT
    Q_PROPERTY(bool isAuthenticated READ isAuthenticated NOTIFY authChanged)
    Q_PROPERTY(QString username READ username NOTIFY authChanged)

public:
    explicit AbyssIDManager(QObject *parent = nullptr);
    ~AbyssIDManager();

    // Authentication
    Q_INVOKABLE bool login();
    Q_INVOKABLE bool loginWithCredentials(const QString &username, const QString &password);
    Q_INVOKABLE void logout();
    
    // Signing
    Q_INVOKABLE QString signMessage(const QString &message);
    
    // Getters
    Q_INVOKABLE QString getPublicKey() const;
    bool isAuthenticated() const { return m_authenticated; }
    QString username() const { return m_username; }

signals:
    void authChanged();
    void signatureRequested(const QString &message);
    void signatureCompleted(const QString &signature);
    void loginFailed(const QString &error);

private:
    void saveToKeychain();
    void loadFromKeychain();
    void generateKeyPair();
    
    QString m_username;
    QByteArray m_privateKey;
    QByteArray m_publicKey;
    bool m_authenticated = false;
};

#endif // ABYSSIDMANAGER_H
