/**
 * QØЯ Secure Vault
 * 
 * Encrypted credential storage using OS-native keychain:
 * - Windows: Credential Manager (DPAPI)
 * - macOS: Keychain Services
 * - Linux: Secret Service API (GNOME Keyring / KWallet)
 */

#ifndef QOR_SECURE_VAULT_H
#define QOR_SECURE_VAULT_H

#include <QObject>
#include <QString>
#include <QByteArray>
#include <QMap>

namespace QOR {

/**
 * SecureVault - Secure credential storage
 * 
 * Uses OS-native keychain APIs for secure storage of:
 * - AbyssID private keys
 * - Wallet encryption keys
 * - API tokens
 * - Other sensitive data
 */
class SecureVault : public QObject
{
    Q_OBJECT

public:
    explicit SecureVault(QObject *parent = nullptr);
    ~SecureVault();
    
    /**
     * Initialize the vault
     * @return true if OS keychain is available
     */
    bool initialize();
    
    /**
     * Check if vault is using native keychain
     * Falls back to encrypted file if not available
     */
    bool isNativeKeychainAvailable() const { return m_nativeAvailable; }
    
    /**
     * Store a credential
     * @param key Unique identifier for the credential
     * @param value The secret data to store
     * @return true if stored successfully
     */
    bool storeCredential(const QString &key, const QByteArray &value);
    
    /**
     * Retrieve a credential
     * @param key Unique identifier for the credential
     * @return The secret data, or empty if not found
     */
    QByteArray retrieveCredential(const QString &key);
    
    /**
     * Delete a credential
     * @param key Unique identifier for the credential
     * @return true if deleted (or didn't exist)
     */
    bool deleteCredential(const QString &key);
    
    /**
     * Check if a credential exists
     * @param key Unique identifier for the credential
     * @return true if the credential exists
     */
    bool hasCredential(const QString &key);
    
    /**
     * List all credential keys
     * @return List of stored credential identifiers
     */
    QStringList listCredentials();
    
    // Convenience methods for string values
    bool storeString(const QString &key, const QString &value);
    QString retrieveString(const QString &key);
    
    /**
     * Clear all credentials
     * WARNING: This is destructive!
     */
    bool clearAll();
    
    /**
     * Lock the vault (clear memory cache)
     */
    void lock();
    
    /**
     * Check if vault is locked
     */
    bool isLocked() const { return m_locked; }

signals:
    /**
     * Emitted when vault is locked
     */
    void locked();
    
    /**
     * Emitted when vault is unlocked
     */
    void unlocked();
    
    /**
     * Emitted on vault error
     */
    void error(const QString &message);

private:
    /**
     * Platform-specific implementations
     */
#ifdef Q_OS_WIN
    bool storeCredentialWindows(const QString &key, const QByteArray &value);
    QByteArray retrieveCredentialWindows(const QString &key);
    bool deleteCredentialWindows(const QString &key);
#endif

#ifdef Q_OS_MAC
    bool storeCredentialMacOS(const QString &key, const QByteArray &value);
    QByteArray retrieveCredentialMacOS(const QString &key);
    bool deleteCredentialMacOS(const QString &key);
#endif

#ifdef Q_OS_LINUX
    bool storeCredentialLinux(const QString &key, const QByteArray &value);
    QByteArray retrieveCredentialLinux(const QString &key);
    bool deleteCredentialLinux(const QString &key);
#endif

    /**
     * Fallback encrypted file storage
     */
    bool storeCredentialFallback(const QString &key, const QByteArray &value);
    QByteArray retrieveCredentialFallback(const QString &key);
    bool deleteCredentialFallback(const QString &key);
    
    /**
     * Get vault file path for fallback storage
     */
    QString vaultFilePath() const;
    
    /**
     * Load/save fallback vault
     */
    bool loadFallbackVault();
    bool saveFallbackVault();
    
    /**
     * Derive encryption key from machine ID
     */
    QByteArray deriveEncryptionKey();

private:
    bool m_initialized;
    bool m_nativeAvailable;
    bool m_locked;
    
    // Fallback storage
    QMap<QString, QByteArray> m_fallbackData;
    QByteArray m_encryptionKey;
    
    // Service identifiers
    static const QString SERVICE_NAME;
    static const QString FALLBACK_FILENAME;
};

} // namespace QOR

#endif // QOR_SECURE_VAULT_H
