/**
 * AuthManager - AbyssID Authentication
 * 
 * Handles login, session management, and credential verification.
 */

#ifndef GENESIS_AUTH_MANAGER_H
#define GENESIS_AUTH_MANAGER_H

#include <QObject>
#include <QString>
#include <QNetworkAccessManager>

class SessionToken;

class AuthManager : public QObject
{
    Q_OBJECT
    
    Q_PROPERTY(bool isAuthenticated READ isAuthenticated NOTIFY authStateChanged)
    Q_PROPERTY(QString username READ username NOTIFY authStateChanged)
    Q_PROPERTY(QString avatarUrl READ avatarUrl NOTIFY authStateChanged)
    Q_PROPERTY(bool isLoading READ isLoading NOTIFY loadingChanged)
    Q_PROPERTY(QString errorMessage READ errorMessage NOTIFY errorChanged)

public:
    explicit AuthManager(QObject *parent = nullptr);
    ~AuthManager();
    
    bool isAuthenticated() const { return m_authenticated; }
    QString username() const { return m_username; }
    QString avatarUrl() const { return m_avatarUrl; }
    bool isLoading() const { return m_isLoading; }
    QString errorMessage() const { return m_errorMessage; }
    
    SessionToken* sessionToken() const { return m_sessionToken; }

public slots:
    /**
     * Login with AbyssID credentials
     */
    Q_INVOKABLE void login(const QString &username, const QString &password);
    
    /**
     * Login with saved session (auto-login)
     */
    Q_INVOKABLE bool tryAutoLogin();
    
    /**
     * Logout and clear session
     */
    Q_INVOKABLE void logout();
    
    /**
     * Check if saved credentials exist
     */
    Q_INVOKABLE bool hasSavedSession() const;

signals:
    void authStateChanged();
    void loadingChanged();
    void errorChanged();
    
    void authenticated(const QString &sessionId);
    void loggedOut();
    void loginFailed(const QString &error);

private slots:
    void onLoginResponse(QNetworkReply *reply);

private:
    void setAuthenticated(bool auth);
    void setError(const QString &error);
    void saveSession();
    void clearSession();
    
    QNetworkAccessManager *m_networkManager;
    SessionToken *m_sessionToken;
    
    bool m_authenticated;
    QString m_username;
    QString m_avatarUrl;
    QString m_abyssIdAddress;
    bool m_isLoading;
    QString m_errorMessage;
    
    static const QString AUTH_ENDPOINT;
};

#endif // GENESIS_AUTH_MANAGER_H
