/**
 * AuthManager - AbyssID Authentication
 * 
 * Handles login, signup, session management, and credential verification.
 * Supports offline account creation with automatic sync when online.
 */

#ifndef GENESIS_AUTH_MANAGER_H
#define GENESIS_AUTH_MANAGER_H

#include <QObject>
#include <QString>
#include <QNetworkAccessManager>
#include <QTimer>

class SessionToken;

class AuthManager : public QObject
{
    Q_OBJECT
    
    Q_PROPERTY(bool isAuthenticated READ isAuthenticated NOTIFY authStateChanged)
    Q_PROPERTY(QString username READ username NOTIFY authStateChanged)
    Q_PROPERTY(QString avatarUrl READ avatarUrl NOTIFY authStateChanged)
    Q_PROPERTY(QString publicKey READ publicKey NOTIFY authStateChanged)
    Q_PROPERTY(QString seedPhrase READ seedPhrase NOTIFY seedPhraseChanged)
    Q_PROPERTY(bool isLoading READ isLoading NOTIFY loadingChanged)
    Q_PROPERTY(QString errorMessage READ errorMessage NOTIFY errorChanged)
    Q_PROPERTY(bool isOnline READ isOnline NOTIFY onlineStateChanged)
    Q_PROPERTY(bool hasPendingSync READ hasPendingSync NOTIFY pendingSyncChanged)

public:
    explicit AuthManager(QObject *parent = nullptr);
    ~AuthManager();
    
    bool isAuthenticated() const { return m_authenticated; }
    QString username() const { return m_username; }
    QString avatarUrl() const { return m_avatarUrl; }
    QString publicKey() const { return m_publicKey; }
    QString seedPhrase() const { return m_seedPhrase; }
    bool isLoading() const { return m_isLoading; }
    QString errorMessage() const { return m_errorMessage; }
    bool isOnline() const { return m_isOnline; }
    bool hasPendingSync() const { return m_hasPendingSync; }
    
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
    
    /**
     * Check if a username is available
     */
    Q_INVOKABLE void checkUsernameAvailability(const QString &username);
    
    /**
     * Create a new AbyssID account
     * Works offline - will sync when connection is available
     */
    Q_INVOKABLE void createAccount(const QString &username);
    
    /**
     * Copy text to clipboard
     */
    Q_INVOKABLE void copyToClipboard(const QString &text);
    
    /**
     * Force a sync attempt for pending accounts
     */
    Q_INVOKABLE void syncPendingAccounts();
    
    /**
     * Check server connectivity
     */
    Q_INVOKABLE void checkConnectivity();

signals:
    void authStateChanged();
    void loadingChanged();
    void errorChanged();
    void onlineStateChanged();
    void pendingSyncChanged();
    void seedPhraseChanged();
    
    void authenticated(const QString &sessionId);
    void loggedOut();
    void loginFailed(const QString &error);
    
    // Signup signals
    void usernameAvailable(const QString &username);
    void usernameTaken(const QString &username);
    void accountCreated(const QString &username, const QString &publicKey, const QString &seedPhrase);
    void accountCreationFailed(const QString &error);
    void accountSynced(const QString &username);

private slots:
    void onLoginResponse(QNetworkReply *reply);
    void onUsernameCheckResponse(QNetworkReply *reply);
    void onCreateAccountResponse(QNetworkReply *reply);
    void onConnectivityCheckResponse(QNetworkReply *reply);
    void onConnectivityTimeout();
    void attemptAutoConnect();

private:
    void setAuthenticated(bool auth);
    void setError(const QString &error);
    void setOnline(bool online);
    void saveSession();
    void clearSession();
    void savePendingAccount(const QString &username, const QString &publicKey, 
                            const QString &privateKey, const QString &seedPhrase);
    bool loadPendingAccount();
    void generateKeyPair(QString &publicKey, QString &privateKey, QString &seedPhrase);
    QString generateSeedPhrase();
    
    QNetworkAccessManager *m_networkManager;
    SessionToken *m_sessionToken;
    QTimer *m_connectivityTimer;
    QTimer *m_syncTimer;
    
    bool m_authenticated;
    QString m_username;
    QString m_avatarUrl;
    QString m_abyssIdAddress;
    QString m_publicKey;
    QString m_seedPhrase;
    bool m_isLoading;
    QString m_errorMessage;
    bool m_isOnline;
    bool m_hasPendingSync;
    
    // For tracking current operations
    QString m_pendingUsernameCheck;
    QString m_pendingCreateUsername;
    
    static const QString AUTH_ENDPOINT;
    static const QStringList SEED_WORDS;
};

#endif // GENESIS_AUTH_MANAGER_H
