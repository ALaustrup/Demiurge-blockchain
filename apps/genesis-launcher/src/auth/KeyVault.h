/**
 * KeyVault - Secure Key Storage
 * 
 * Encrypts and stores private keys locally using OS-native APIs:
 * - Windows: DPAPI (Data Protection API)
 * - macOS: Keychain Services
 * - Linux: libsecret / GNOME Keyring
 */

#ifndef GENESIS_KEY_VAULT_H
#define GENESIS_KEY_VAULT_H

#include <QObject>
#include <QString>
#include <QByteArray>
#include <QMap>

class KeyVault : public QObject
{
    Q_OBJECT
    
    Q_PROPERTY(bool isUnlocked READ isUnlocked NOTIFY unlockStateChanged)
    Q_PROPERTY(bool hasKeys READ hasKeys NOTIFY keysChanged)

public:
    explicit KeyVault(QObject *parent = nullptr);
    ~KeyVault();
    
    bool isUnlocked() const { return m_unlocked; }
    bool hasKeys() const;
    
public slots:
    /**
     * Unlock the vault with user's password
     */
    Q_INVOKABLE bool unlock(const QString &password);
    
    /**
     * Unlock with session token (after auth)
     */
    Q_INVOKABLE bool unlockWithSession(const QString &sessionId);
    
    /**
     * Lock the vault (clear decrypted keys from memory)
     */
    Q_INVOKABLE void lock();
    
    /**
     * Store a new key
     */
    Q_INVOKABLE bool storeKey(const QString &keyId, const QByteArray &keyData);
    
    /**
     * Retrieve a key (vault must be unlocked)
     */
    Q_INVOKABLE QByteArray getKey(const QString &keyId) const;
    
    /**
     * Delete a key
     */
    Q_INVOKABLE bool deleteKey(const QString &keyId);
    
    /**
     * List all stored key IDs
     */
    Q_INVOKABLE QStringList listKeys() const;
    
    /**
     * Change vault password
     */
    Q_INVOKABLE bool changePassword(const QString &oldPassword, 
                                     const QString &newPassword);
    
    /**
     * Initialize vault for first time use
     */
    Q_INVOKABLE bool initializeVault(const QString &password);

signals:
    void unlockStateChanged();
    void keysChanged();
    void vaultError(const QString &error);

private:
    QByteArray encrypt(const QByteArray &data, const QByteArray &key);
    QByteArray decrypt(const QByteArray &data, const QByteArray &key);
    QByteArray deriveKey(const QString &password, const QByteArray &salt);
    QString getVaultPath() const;
    bool loadVault();
    bool saveVault();
    
#ifdef Q_OS_WIN
    QByteArray dpApiEncrypt(const QByteArray &data);
    QByteArray dpApiDecrypt(const QByteArray &data);
#endif
    
    bool m_unlocked;
    QByteArray m_masterKey;
    QByteArray m_vaultSalt;
    QMap<QString, QByteArray> m_keys;  // Decrypted keys in memory
    QMap<QString, QByteArray> m_encryptedKeys;  // Encrypted on disk
};

#endif // GENESIS_KEY_VAULT_H
