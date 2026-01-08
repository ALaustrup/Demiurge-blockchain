/**
 * KeyVault Implementation
 */

#include "KeyVault.h"

#include <QStandardPaths>
#include <QDir>
#include <QFile>
#include <QDataStream>
#include <QCryptographicHash>
#include <QRandomGenerator>
#include <QDebug>

#ifdef Q_OS_WIN
#include <windows.h>
#include <dpapi.h>
#pragma comment(lib, "crypt32.lib")
#endif

KeyVault::KeyVault(QObject *parent)
    : QObject(parent)
    , m_unlocked(false)
{
    loadVault();
}

KeyVault::~KeyVault()
{
    lock();
}

bool KeyVault::hasKeys() const
{
    return !m_encryptedKeys.isEmpty();
}

bool KeyVault::unlock(const QString &password)
{
    if (m_vaultSalt.isEmpty()) {
        emit vaultError(tr("Vault not initialized"));
        return false;
    }
    
    // Derive key from password
    m_masterKey = deriveKey(password, m_vaultSalt);
    
    // Try to decrypt all keys
    m_keys.clear();
    bool success = true;
    
    for (auto it = m_encryptedKeys.begin(); it != m_encryptedKeys.end(); ++it) {
        QByteArray decrypted = decrypt(it.value(), m_masterKey);
        if (decrypted.isEmpty()) {
            success = false;
            break;
        }
        m_keys[it.key()] = decrypted;
    }
    
    if (!success) {
        m_keys.clear();
        m_masterKey.clear();
        emit vaultError(tr("Invalid password"));
        return false;
    }
    
    m_unlocked = true;
    emit unlockStateChanged();
    return true;
}

bool KeyVault::unlockWithSession(const QString &sessionId)
{
    // Use session ID to derive temporary unlock key
    // In production, this would involve secure key exchange
    QByteArray sessionKey = QCryptographicHash::hash(
        sessionId.toUtf8() + "genesis_vault_key",
        QCryptographicHash::Sha256
    );
    
    // For demo purposes, use the session as the master key
    // Real implementation would use OS keychain to store the actual key
#ifdef Q_OS_WIN
    // On Windows, try to decrypt the master key from DPAPI storage
    QFile keyFile(getVaultPath() + ".dpapi");
    if (keyFile.open(QIODevice::ReadOnly)) {
        QByteArray encryptedMaster = keyFile.readAll();
        keyFile.close();
        
        m_masterKey = dpApiDecrypt(encryptedMaster);
        if (!m_masterKey.isEmpty()) {
            // Decrypt all keys with recovered master
            for (auto it = m_encryptedKeys.begin(); it != m_encryptedKeys.end(); ++it) {
                QByteArray decrypted = decrypt(it.value(), m_masterKey);
                if (!decrypted.isEmpty()) {
                    m_keys[it.key()] = decrypted;
                }
            }
            m_unlocked = true;
            emit unlockStateChanged();
            return true;
        }
    }
#endif
    
    // Fallback: session provides access (demo mode)
    m_unlocked = true;
    emit unlockStateChanged();
    return true;
}

void KeyVault::lock()
{
    // Securely clear all decrypted keys
    for (auto &key : m_keys) {
        key.fill('\0');
        key.clear();
    }
    m_keys.clear();
    
    m_masterKey.fill('\0');
    m_masterKey.clear();
    
    m_unlocked = false;
    emit unlockStateChanged();
}

bool KeyVault::storeKey(const QString &keyId, const QByteArray &keyData)
{
    if (!m_unlocked) {
        emit vaultError(tr("Vault is locked"));
        return false;
    }
    
    // Store in memory
    m_keys[keyId] = keyData;
    
    // Encrypt and store on disk
    QByteArray encrypted = encrypt(keyData, m_masterKey);
    m_encryptedKeys[keyId] = encrypted;
    
    if (!saveVault()) {
        emit vaultError(tr("Failed to save vault"));
        return false;
    }
    
    emit keysChanged();
    return true;
}

QByteArray KeyVault::getKey(const QString &keyId) const
{
    if (!m_unlocked) {
        return QByteArray();
    }
    return m_keys.value(keyId);
}

bool KeyVault::deleteKey(const QString &keyId)
{
    if (!m_unlocked) {
        emit vaultError(tr("Vault is locked"));
        return false;
    }
    
    m_keys.remove(keyId);
    m_encryptedKeys.remove(keyId);
    
    saveVault();
    emit keysChanged();
    return true;
}

QStringList KeyVault::listKeys() const
{
    return m_encryptedKeys.keys();
}

bool KeyVault::changePassword(const QString &oldPassword, const QString &newPassword)
{
    // First unlock with old password
    if (!unlock(oldPassword)) {
        return false;
    }
    
    // Generate new salt
    QByteArray newSalt;
    newSalt.resize(32);
    for (int i = 0; i < 32; ++i) {
        newSalt[i] = static_cast<char>(QRandomGenerator::global()->bounded(256));
    }
    
    // Derive new key
    QByteArray newMasterKey = deriveKey(newPassword, newSalt);
    
    // Re-encrypt all keys
    m_encryptedKeys.clear();
    for (auto it = m_keys.begin(); it != m_keys.end(); ++it) {
        m_encryptedKeys[it.key()] = encrypt(it.value(), newMasterKey);
    }
    
    m_vaultSalt = newSalt;
    m_masterKey = newMasterKey;
    
    saveVault();
    return true;
}

bool KeyVault::initializeVault(const QString &password)
{
    // Generate salt
    m_vaultSalt.resize(32);
    for (int i = 0; i < 32; ++i) {
        m_vaultSalt[i] = static_cast<char>(QRandomGenerator::global()->bounded(256));
    }
    
    m_masterKey = deriveKey(password, m_vaultSalt);
    m_unlocked = true;
    
#ifdef Q_OS_WIN
    // Store master key with DPAPI for session-based unlock
    QByteArray encryptedMaster = dpApiEncrypt(m_masterKey);
    QFile keyFile(getVaultPath() + ".dpapi");
    if (keyFile.open(QIODevice::WriteOnly)) {
        keyFile.write(encryptedMaster);
        keyFile.close();
    }
#endif
    
    saveVault();
    emit unlockStateChanged();
    return true;
}

QByteArray KeyVault::encrypt(const QByteArray &data, const QByteArray &key)
{
    // Simple XOR encryption (use AES in production)
    // For real security, use QCA or OpenSSL AES-256-GCM
    QByteArray result = data;
    for (int i = 0; i < result.size(); ++i) {
        result[i] = result[i] ^ key[i % key.size()];
    }
    return result;
}

QByteArray KeyVault::decrypt(const QByteArray &data, const QByteArray &key)
{
    // XOR is symmetric
    return encrypt(data, key);
}

QByteArray KeyVault::deriveKey(const QString &password, const QByteArray &salt)
{
    // PBKDF2-like key derivation (simplified)
    // Use QPasswordDigestor in Qt 6 for real PBKDF2
    QByteArray combined = password.toUtf8() + salt;
    QByteArray key = combined;
    
    for (int i = 0; i < 10000; ++i) {
        key = QCryptographicHash::hash(key + salt, QCryptographicHash::Sha256);
    }
    
    return key;
}

QString KeyVault::getVaultPath() const
{
    QString dataPath = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation);
    QDir().mkpath(dataPath);
    return dataPath + "/vault.dat";
}

bool KeyVault::loadVault()
{
    QFile file(getVaultPath());
    if (!file.open(QIODevice::ReadOnly)) {
        return false;
    }
    
    QDataStream stream(&file);
    
    quint32 magic;
    stream >> magic;
    
    if (magic != 0x47564C54) {  // "GVLT"
        file.close();
        return false;
    }
    
    stream >> m_vaultSalt;
    stream >> m_encryptedKeys;
    
    file.close();
    return true;
}

bool KeyVault::saveVault()
{
    QFile file(getVaultPath());
    if (!file.open(QIODevice::WriteOnly)) {
        return false;
    }
    
    QDataStream stream(&file);
    
    stream << quint32(0x47564C54);  // Magic "GVLT"
    stream << m_vaultSalt;
    stream << m_encryptedKeys;
    
    file.close();
    return true;
}

#ifdef Q_OS_WIN
QByteArray KeyVault::dpApiEncrypt(const QByteArray &data)
{
    DATA_BLOB input, output;
    input.pbData = reinterpret_cast<BYTE*>(const_cast<char*>(data.data()));
    input.cbData = static_cast<DWORD>(data.size());
    
    if (!CryptProtectData(&input, L"GenesisVault", nullptr, nullptr, 
                          nullptr, 0, &output)) {
        return QByteArray();
    }
    
    QByteArray result(reinterpret_cast<char*>(output.pbData), output.cbData);
    LocalFree(output.pbData);
    return result;
}

QByteArray KeyVault::dpApiDecrypt(const QByteArray &data)
{
    DATA_BLOB input, output;
    input.pbData = reinterpret_cast<BYTE*>(const_cast<char*>(data.data()));
    input.cbData = static_cast<DWORD>(data.size());
    
    if (!CryptUnprotectData(&input, nullptr, nullptr, nullptr, 
                            nullptr, 0, &output)) {
        return QByteArray();
    }
    
    QByteArray result(reinterpret_cast<char*>(output.pbData), output.cbData);
    LocalFree(output.pbData);
    return result;
}
#endif
