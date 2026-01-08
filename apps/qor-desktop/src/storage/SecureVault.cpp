/**
 * QØЯ Secure Vault Implementation
 * 
 * Cross-platform secure credential storage with OS keychain integration.
 */

#include "SecureVault.h"
#include <QStandardPaths>
#include <QDir>
#include <QFile>
#include <QDataStream>
#include <QCryptographicHash>
#include <QSysInfo>
#include <QDebug>

#ifdef Q_OS_WIN
#include <windows.h>
#include <wincred.h>
#pragma comment(lib, "advapi32.lib")
#endif

#ifdef Q_OS_MAC
#include <Security/Security.h>
#endif

namespace QOR {

const QString SecureVault::SERVICE_NAME = "com.demiurge.qor";
const QString SecureVault::FALLBACK_FILENAME = "vault.enc";

SecureVault::SecureVault(QObject *parent)
    : QObject(parent)
    , m_initialized(false)
    , m_nativeAvailable(false)
    , m_locked(true)
{
}

SecureVault::~SecureVault()
{
    lock();
}

bool SecureVault::initialize()
{
    if (m_initialized) {
        return true;
    }
    
    // Check if native keychain is available
#ifdef Q_OS_WIN
    m_nativeAvailable = true; // Windows always has Credential Manager
#elif defined(Q_OS_MAC)
    m_nativeAvailable = true; // macOS always has Keychain
#elif defined(Q_OS_LINUX)
    // Check for Secret Service (would need libsecret)
    m_nativeAvailable = false; // Default to fallback for now
#else
    m_nativeAvailable = false;
#endif
    
    // Initialize encryption key for fallback
    m_encryptionKey = deriveEncryptionKey();
    
    // Load fallback vault if native not available
    if (!m_nativeAvailable) {
        loadFallbackVault();
    }
    
    m_initialized = true;
    m_locked = false;
    
    qInfo() << "SecureVault initialized, native keychain:" << m_nativeAvailable;
    return true;
}

bool SecureVault::storeCredential(const QString &key, const QByteArray &value)
{
    if (!m_initialized || m_locked) {
        emit error("Vault not initialized or locked");
        return false;
    }
    
    if (m_nativeAvailable) {
#ifdef Q_OS_WIN
        return storeCredentialWindows(key, value);
#elif defined(Q_OS_MAC)
        return storeCredentialMacOS(key, value);
#elif defined(Q_OS_LINUX)
        return storeCredentialLinux(key, value);
#endif
    }
    
    return storeCredentialFallback(key, value);
}

QByteArray SecureVault::retrieveCredential(const QString &key)
{
    if (!m_initialized || m_locked) {
        emit error("Vault not initialized or locked");
        return QByteArray();
    }
    
    if (m_nativeAvailable) {
#ifdef Q_OS_WIN
        return retrieveCredentialWindows(key);
#elif defined(Q_OS_MAC)
        return retrieveCredentialMacOS(key);
#elif defined(Q_OS_LINUX)
        return retrieveCredentialLinux(key);
#endif
    }
    
    return retrieveCredentialFallback(key);
}

bool SecureVault::deleteCredential(const QString &key)
{
    if (!m_initialized) {
        return false;
    }
    
    if (m_nativeAvailable) {
#ifdef Q_OS_WIN
        return deleteCredentialWindows(key);
#elif defined(Q_OS_MAC)
        return deleteCredentialMacOS(key);
#elif defined(Q_OS_LINUX)
        return deleteCredentialLinux(key);
#endif
    }
    
    return deleteCredentialFallback(key);
}

bool SecureVault::hasCredential(const QString &key)
{
    return !retrieveCredential(key).isEmpty();
}

QStringList SecureVault::listCredentials()
{
    if (!m_nativeAvailable) {
        return m_fallbackData.keys();
    }
    
    // Native keychain enumeration is complex and varies by platform
    // For now, return empty and rely on known keys
    return QStringList();
}

bool SecureVault::storeString(const QString &key, const QString &value)
{
    return storeCredential(key, value.toUtf8());
}

QString SecureVault::retrieveString(const QString &key)
{
    return QString::fromUtf8(retrieveCredential(key));
}

bool SecureVault::clearAll()
{
    if (!m_nativeAvailable) {
        m_fallbackData.clear();
        return saveFallbackVault();
    }
    
    // Native keychain clear is complex - would need to enumerate and delete each
    qWarning() << "clearAll not fully implemented for native keychain";
    return false;
}

void SecureVault::lock()
{
    if (!m_locked) {
        // Clear memory cache
        m_fallbackData.clear();
        m_locked = true;
        emit locked();
    }
}

// ========== Platform-Specific Implementations ==========

#ifdef Q_OS_WIN
bool SecureVault::storeCredentialWindows(const QString &key, const QByteArray &value)
{
    QString targetName = QString("%1/%2").arg(SERVICE_NAME, key);
    
    CREDENTIALW cred = {0};
    cred.Type = CRED_TYPE_GENERIC;
    cred.TargetName = (LPWSTR)targetName.utf16();
    cred.CredentialBlobSize = value.size();
    cred.CredentialBlob = (LPBYTE)value.data();
    cred.Persist = CRED_PERSIST_LOCAL_MACHINE;
    
    if (!CredWriteW(&cred, 0)) {
        DWORD err = GetLastError();
        emit error(QString("Windows Credential Manager error: %1").arg(err));
        return false;
    }
    
    return true;
}

QByteArray SecureVault::retrieveCredentialWindows(const QString &key)
{
    QString targetName = QString("%1/%2").arg(SERVICE_NAME, key);
    
    PCREDENTIALW pCred = nullptr;
    if (!CredReadW((LPCWSTR)targetName.utf16(), CRED_TYPE_GENERIC, 0, &pCred)) {
        return QByteArray();
    }
    
    QByteArray result((const char*)pCred->CredentialBlob, pCred->CredentialBlobSize);
    CredFree(pCred);
    
    return result;
}

bool SecureVault::deleteCredentialWindows(const QString &key)
{
    QString targetName = QString("%1/%2").arg(SERVICE_NAME, key);
    
    if (!CredDeleteW((LPCWSTR)targetName.utf16(), CRED_TYPE_GENERIC, 0)) {
        DWORD err = GetLastError();
        if (err != ERROR_NOT_FOUND) {
            emit error(QString("Windows Credential Manager delete error: %1").arg(err));
            return false;
        }
    }
    
    return true;
}
#endif

#ifdef Q_OS_MAC
bool SecureVault::storeCredentialMacOS(const QString &key, const QByteArray &value)
{
    // First try to delete existing
    deleteCredentialMacOS(key);
    
    CFStringRef service = CFStringCreateWithCString(nullptr, SERVICE_NAME.toUtf8().constData(), kCFStringEncodingUTF8);
    CFStringRef account = CFStringCreateWithCString(nullptr, key.toUtf8().constData(), kCFStringEncodingUTF8);
    CFDataRef data = CFDataCreate(nullptr, (const UInt8*)value.constData(), value.size());
    
    CFMutableDictionaryRef attributes = CFDictionaryCreateMutable(nullptr, 0,
        &kCFTypeDictionaryKeyCallBacks, &kCFTypeDictionaryValueCallBacks);
    
    CFDictionarySetValue(attributes, kSecClass, kSecClassGenericPassword);
    CFDictionarySetValue(attributes, kSecAttrService, service);
    CFDictionarySetValue(attributes, kSecAttrAccount, account);
    CFDictionarySetValue(attributes, kSecValueData, data);
    
    OSStatus status = SecItemAdd(attributes, nullptr);
    
    CFRelease(service);
    CFRelease(account);
    CFRelease(data);
    CFRelease(attributes);
    
    if (status != errSecSuccess) {
        emit error(QString("macOS Keychain error: %1").arg(status));
        return false;
    }
    
    return true;
}

QByteArray SecureVault::retrieveCredentialMacOS(const QString &key)
{
    CFStringRef service = CFStringCreateWithCString(nullptr, SERVICE_NAME.toUtf8().constData(), kCFStringEncodingUTF8);
    CFStringRef account = CFStringCreateWithCString(nullptr, key.toUtf8().constData(), kCFStringEncodingUTF8);
    
    CFMutableDictionaryRef query = CFDictionaryCreateMutable(nullptr, 0,
        &kCFTypeDictionaryKeyCallBacks, &kCFTypeDictionaryValueCallBacks);
    
    CFDictionarySetValue(query, kSecClass, kSecClassGenericPassword);
    CFDictionarySetValue(query, kSecAttrService, service);
    CFDictionarySetValue(query, kSecAttrAccount, account);
    CFDictionarySetValue(query, kSecReturnData, kCFBooleanTrue);
    
    CFDataRef data = nullptr;
    OSStatus status = SecItemCopyMatching(query, (CFTypeRef*)&data);
    
    CFRelease(service);
    CFRelease(account);
    CFRelease(query);
    
    if (status != errSecSuccess || !data) {
        return QByteArray();
    }
    
    QByteArray result((const char*)CFDataGetBytePtr(data), CFDataGetLength(data));
    CFRelease(data);
    
    return result;
}

bool SecureVault::deleteCredentialMacOS(const QString &key)
{
    CFStringRef service = CFStringCreateWithCString(nullptr, SERVICE_NAME.toUtf8().constData(), kCFStringEncodingUTF8);
    CFStringRef account = CFStringCreateWithCString(nullptr, key.toUtf8().constData(), kCFStringEncodingUTF8);
    
    CFMutableDictionaryRef query = CFDictionaryCreateMutable(nullptr, 0,
        &kCFTypeDictionaryKeyCallBacks, &kCFTypeDictionaryValueCallBacks);
    
    CFDictionarySetValue(query, kSecClass, kSecClassGenericPassword);
    CFDictionarySetValue(query, kSecAttrService, service);
    CFDictionarySetValue(query, kSecAttrAccount, account);
    
    OSStatus status = SecItemDelete(query);
    
    CFRelease(service);
    CFRelease(account);
    CFRelease(query);
    
    return (status == errSecSuccess || status == errSecItemNotFound);
}
#endif

#ifdef Q_OS_LINUX
bool SecureVault::storeCredentialLinux(const QString &key, const QByteArray &value)
{
    // Would use libsecret here for proper Secret Service integration
    // For now, use fallback
    return storeCredentialFallback(key, value);
}

QByteArray SecureVault::retrieveCredentialLinux(const QString &key)
{
    return retrieveCredentialFallback(key);
}

bool SecureVault::deleteCredentialLinux(const QString &key)
{
    return deleteCredentialFallback(key);
}
#endif

// ========== Fallback Storage ==========

bool SecureVault::storeCredentialFallback(const QString &key, const QByteArray &value)
{
    m_fallbackData[key] = value;
    return saveFallbackVault();
}

QByteArray SecureVault::retrieveCredentialFallback(const QString &key)
{
    return m_fallbackData.value(key);
}

bool SecureVault::deleteCredentialFallback(const QString &key)
{
    m_fallbackData.remove(key);
    return saveFallbackVault();
}

QString SecureVault::vaultFilePath() const
{
    QString dataPath = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation);
    QDir().mkpath(dataPath);
    return dataPath + "/" + FALLBACK_FILENAME;
}

bool SecureVault::loadFallbackVault()
{
    QFile file(vaultFilePath());
    if (!file.exists()) {
        return true; // Empty vault is OK
    }
    
    if (!file.open(QIODevice::ReadOnly)) {
        emit error("Failed to open vault file");
        return false;
    }
    
    QByteArray encrypted = file.readAll();
    file.close();
    
    // Simple XOR decryption with key
    QByteArray decrypted;
    for (int i = 0; i < encrypted.size(); i++) {
        decrypted.append(encrypted[i] ^ m_encryptionKey[i % m_encryptionKey.size()]);
    }
    
    QDataStream stream(&decrypted, QIODevice::ReadOnly);
    stream >> m_fallbackData;
    
    return true;
}

bool SecureVault::saveFallbackVault()
{
    QByteArray data;
    QDataStream stream(&data, QIODevice::WriteOnly);
    stream << m_fallbackData;
    
    // Simple XOR encryption with key
    QByteArray encrypted;
    for (int i = 0; i < data.size(); i++) {
        encrypted.append(data[i] ^ m_encryptionKey[i % m_encryptionKey.size()]);
    }
    
    QFile file(vaultFilePath());
    if (!file.open(QIODevice::WriteOnly)) {
        emit error("Failed to write vault file");
        return false;
    }
    
    file.write(encrypted);
    file.close();
    
    return true;
}

QByteArray SecureVault::deriveEncryptionKey()
{
    // Derive key from machine-specific information
    QString machineId = QSysInfo::machineUniqueId();
    if (machineId.isEmpty()) {
        machineId = QSysInfo::machineHostName() + QSysInfo::productType();
    }
    
    // Add salt
    QString salted = machineId + "QOR-VAULT-SALT-2026";
    
    // Hash to get consistent key
    return QCryptographicHash::hash(salted.toUtf8(), QCryptographicHash::Sha256);
}

} // namespace QOR
