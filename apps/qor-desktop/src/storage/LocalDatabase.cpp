/**
 * QØЯ Local Database Implementation
 */

#include "LocalDatabase.h"
#include <QSqlError>
#include <QSqlRecord>
#include <QJsonDocument>
#include <QDateTime>
#include <QUuid>
#include <QDebug>

namespace QOR {

LocalDatabase::LocalDatabase(QObject *parent)
    : QObject(parent)
    , m_isOpen(false)
{
    // Generate unique connection name
    m_connectionName = QString("qor_db_%1").arg(QUuid::createUuid().toString());
}

LocalDatabase::~LocalDatabase()
{
    close();
}

bool LocalDatabase::open(const QString &path)
{
    if (m_isOpen) {
        close();
    }
    
    m_db = QSqlDatabase::addDatabase("QSQLITE", m_connectionName);
    m_db.setDatabaseName(path);
    
    if (!m_db.open()) {
        qCritical() << "Failed to open database:" << m_db.lastError().text();
        emit error(m_db.lastError().text());
        return false;
    }
    
    // Enable foreign keys
    QSqlQuery query(m_db);
    query.exec("PRAGMA foreign_keys = ON");
    
    // Enable WAL mode for better concurrent access
    query.exec("PRAGMA journal_mode = WAL");
    
    m_isOpen = true;
    qInfo() << "Database opened:" << path;
    
    return true;
}

void LocalDatabase::close()
{
    if (m_isOpen) {
        m_db.close();
        m_isOpen = false;
    }
    
    if (QSqlDatabase::contains(m_connectionName)) {
        QSqlDatabase::removeDatabase(m_connectionName);
    }
}

bool LocalDatabase::isOpen() const
{
    return m_isOpen && m_db.isOpen();
}

bool LocalDatabase::migrate()
{
    if (!isOpen()) {
        return false;
    }
    
    // Create base tables
    if (!createTables()) {
        return false;
    }
    
    // Check current version and run migrations
    int currentVersion = schemaVersion();
    int targetVersion = 1; // Current schema version
    
    while (currentVersion < targetVersion) {
        currentVersion++;
        if (!runMigration(currentVersion)) {
            qCritical() << "Migration failed at version" << currentVersion;
            return false;
        }
        setValue("schema_version", currentVersion);
    }
    
    return true;
}

int LocalDatabase::schemaVersion() const
{
    QSqlQuery query(m_db);
    query.prepare("SELECT value FROM settings WHERE key = 'schema_version'");
    
    if (query.exec() && query.next()) {
        return query.value(0).toInt();
    }
    
    return 0;
}

bool LocalDatabase::createTables()
{
    QSqlQuery query(m_db);
    
    // Settings table (key-value store)
    if (!exec(query)) {
        query.prepare(R"(
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at INTEGER DEFAULT (strftime('%s', 'now'))
            )
        )");
        if (!exec(query)) return false;
    }
    
    // Account table
    query.prepare(R"(
        CREATE TABLE IF NOT EXISTS account (
            address TEXT PRIMARY KEY,
            data TEXT,
            balance TEXT DEFAULT '0',
            nonce INTEGER DEFAULT 0,
            updated_at INTEGER DEFAULT (strftime('%s', 'now'))
        )
    )");
    if (!exec(query)) return false;
    
    // Pending transactions
    query.prepare(R"(
        CREATE TABLE IF NOT EXISTS pending_tx (
            tx_hash TEXT PRIMARY KEY,
            tx_data TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at INTEGER DEFAULT (strftime('%s', 'now')),
            submitted_at INTEGER,
            confirmed_at INTEGER,
            block_height INTEGER
        )
    )");
    if (!exec(query)) return false;
    
    // Media library
    query.prepare(R"(
        CREATE TABLE IF NOT EXISTS media_library (
            id TEXT PRIMARY KEY,
            path TEXT NOT NULL,
            type TEXT NOT NULL,
            metadata TEXT,
            created_at INTEGER DEFAULT (strftime('%s', 'now')),
            accessed_at INTEGER DEFAULT (strftime('%s', 'now'))
        )
    )");
    if (!exec(query)) return false;
    
    // Documents
    query.prepare(R"(
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            path TEXT NOT NULL,
            title TEXT,
            metadata TEXT,
            created_at INTEGER DEFAULT (strftime('%s', 'now')),
            accessed_at INTEGER DEFAULT (strftime('%s', 'now'))
        )
    )");
    if (!exec(query)) return false;
    
    // Chain cache
    query.prepare(R"(
        CREATE TABLE IF NOT EXISTS chain_cache (
            key TEXT PRIMARY KEY,
            value TEXT,
            expires_at INTEGER
        )
    )");
    if (!exec(query)) return false;
    
    // Bookmarks
    query.prepare(R"(
        CREATE TABLE IF NOT EXISTS bookmarks (
            id TEXT PRIMARY KEY,
            url TEXT NOT NULL,
            title TEXT,
            folder TEXT,
            favicon TEXT,
            created_at INTEGER DEFAULT (strftime('%s', 'now'))
        )
    )");
    if (!exec(query)) return false;
    
    // History
    query.prepare(R"(
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT NOT NULL,
            title TEXT,
            visited_at INTEGER DEFAULT (strftime('%s', 'now'))
        )
    )");
    if (!exec(query)) return false;
    
    // Create indexes
    query.prepare("CREATE INDEX IF NOT EXISTS idx_pending_tx_status ON pending_tx(status)");
    exec(query);
    
    query.prepare("CREATE INDEX IF NOT EXISTS idx_media_type ON media_library(type)");
    exec(query);
    
    query.prepare("CREATE INDEX IF NOT EXISTS idx_history_visited ON history(visited_at)");
    exec(query);
    
    return true;
}

bool LocalDatabase::runMigration(int version)
{
    QSqlQuery query(m_db);
    
    switch (version) {
        case 1:
            // Initial schema - already created in createTables
            return true;
            
        default:
            qWarning() << "Unknown migration version:" << version;
            return false;
    }
}

// ========== Account Operations ==========

bool LocalDatabase::saveAccount(const QString &address, const QJsonObject &data)
{
    QSqlQuery query(m_db);
    query.prepare(R"(
        INSERT OR REPLACE INTO account (address, data, updated_at)
        VALUES (?, ?, strftime('%s', 'now'))
    )");
    query.addBindValue(address);
    query.addBindValue(QString(QJsonDocument(data).toJson(QJsonDocument::Compact)));
    
    return exec(query);
}

QJsonObject LocalDatabase::loadAccount(const QString &address)
{
    QSqlQuery query(m_db);
    query.prepare("SELECT data FROM account WHERE address = ?");
    query.addBindValue(address);
    
    if (exec(query) && query.next()) {
        return QJsonDocument::fromJson(query.value(0).toString().toUtf8()).object();
    }
    
    return QJsonObject();
}

QString LocalDatabase::getCachedBalance(const QString &address)
{
    QSqlQuery query(m_db);
    query.prepare("SELECT balance FROM account WHERE address = ?");
    query.addBindValue(address);
    
    if (exec(query) && query.next()) {
        return query.value(0).toString();
    }
    
    return "0";
}

bool LocalDatabase::updateCachedBalance(const QString &address, const QString &balance)
{
    QSqlQuery query(m_db);
    query.prepare(R"(
        INSERT INTO account (address, balance, updated_at)
        VALUES (?, ?, strftime('%s', 'now'))
        ON CONFLICT(address) DO UPDATE SET
            balance = excluded.balance,
            updated_at = excluded.updated_at
    )");
    query.addBindValue(address);
    query.addBindValue(balance);
    
    return exec(query);
}

// ========== Pending Transactions ==========

bool LocalDatabase::queueTransaction(const QString &txHash, const QJsonObject &txData)
{
    QSqlQuery query(m_db);
    query.prepare(R"(
        INSERT INTO pending_tx (tx_hash, tx_data, status)
        VALUES (?, ?, 'pending')
    )");
    query.addBindValue(txHash);
    query.addBindValue(QString(QJsonDocument(txData).toJson(QJsonDocument::Compact)));
    
    return exec(query);
}

QVector<QJsonObject> LocalDatabase::getPendingTransactions()
{
    QVector<QJsonObject> result;
    QSqlQuery query(m_db);
    query.prepare("SELECT tx_hash, tx_data, status, created_at FROM pending_tx WHERE status = 'pending'");
    
    if (exec(query)) {
        while (query.next()) {
            QJsonObject tx;
            tx["hash"] = query.value(0).toString();
            tx["data"] = QJsonDocument::fromJson(query.value(1).toString().toUtf8()).object();
            tx["status"] = query.value(2).toString();
            tx["createdAt"] = query.value(3).toLongLong();
            result.append(tx);
        }
    }
    
    return result;
}

bool LocalDatabase::markTransactionSubmitted(const QString &txHash)
{
    QSqlQuery query(m_db);
    query.prepare(R"(
        UPDATE pending_tx 
        SET status = 'submitted', submitted_at = strftime('%s', 'now')
        WHERE tx_hash = ?
    )");
    query.addBindValue(txHash);
    
    return exec(query);
}

bool LocalDatabase::markTransactionConfirmed(const QString &txHash, qint64 blockHeight)
{
    QSqlQuery query(m_db);
    query.prepare(R"(
        UPDATE pending_tx 
        SET status = 'confirmed', confirmed_at = strftime('%s', 'now'), block_height = ?
        WHERE tx_hash = ?
    )");
    query.addBindValue(blockHeight);
    query.addBindValue(txHash);
    
    return exec(query);
}

int LocalDatabase::cleanupConfirmedTransactions(int keepDays)
{
    QSqlQuery query(m_db);
    query.prepare(R"(
        DELETE FROM pending_tx 
        WHERE status = 'confirmed' 
        AND confirmed_at < (strftime('%s', 'now') - ?)
    )");
    query.addBindValue(keepDays * 24 * 60 * 60);
    
    if (exec(query)) {
        return query.numRowsAffected();
    }
    
    return 0;
}

// ========== Media Library ==========

bool LocalDatabase::addMediaItem(const QString &id, const QString &path,
                                  const QString &type, const QJsonObject &metadata)
{
    QSqlQuery query(m_db);
    query.prepare(R"(
        INSERT OR REPLACE INTO media_library (id, path, type, metadata)
        VALUES (?, ?, ?, ?)
    )");
    query.addBindValue(id);
    query.addBindValue(path);
    query.addBindValue(type);
    query.addBindValue(QString(QJsonDocument(metadata).toJson(QJsonDocument::Compact)));
    
    return exec(query);
}

QVector<QJsonObject> LocalDatabase::getMediaItems(const QString &type)
{
    QVector<QJsonObject> result;
    QSqlQuery query(m_db);
    
    if (type.isEmpty()) {
        query.prepare("SELECT id, path, type, metadata, accessed_at FROM media_library ORDER BY accessed_at DESC");
    } else {
        query.prepare("SELECT id, path, type, metadata, accessed_at FROM media_library WHERE type = ? ORDER BY accessed_at DESC");
        query.addBindValue(type);
    }
    
    if (exec(query)) {
        while (query.next()) {
            QJsonObject item;
            item["id"] = query.value(0).toString();
            item["path"] = query.value(1).toString();
            item["type"] = query.value(2).toString();
            item["metadata"] = QJsonDocument::fromJson(query.value(3).toString().toUtf8()).object();
            item["accessedAt"] = query.value(4).toLongLong();
            result.append(item);
        }
    }
    
    return result;
}

bool LocalDatabase::updateMediaMetadata(const QString &id, const QJsonObject &metadata)
{
    QSqlQuery query(m_db);
    query.prepare("UPDATE media_library SET metadata = ? WHERE id = ?");
    query.addBindValue(QString(QJsonDocument(metadata).toJson(QJsonDocument::Compact)));
    query.addBindValue(id);
    
    return exec(query);
}

bool LocalDatabase::removeMediaItem(const QString &id)
{
    QSqlQuery query(m_db);
    query.prepare("DELETE FROM media_library WHERE id = ?");
    query.addBindValue(id);
    
    return exec(query);
}

// ========== Documents ==========

bool LocalDatabase::saveDocument(const QString &id, const QString &path,
                                  const QString &title, const QJsonObject &metadata)
{
    QSqlQuery query(m_db);
    query.prepare(R"(
        INSERT OR REPLACE INTO documents (id, path, title, metadata)
        VALUES (?, ?, ?, ?)
    )");
    query.addBindValue(id);
    query.addBindValue(path);
    query.addBindValue(title);
    query.addBindValue(QString(QJsonDocument(metadata).toJson(QJsonDocument::Compact)));
    
    return exec(query);
}

QVector<QJsonObject> LocalDatabase::getRecentDocuments(int limit)
{
    QVector<QJsonObject> result;
    QSqlQuery query(m_db);
    query.prepare("SELECT id, path, title, metadata, accessed_at FROM documents ORDER BY accessed_at DESC LIMIT ?");
    query.addBindValue(limit);
    
    if (exec(query)) {
        while (query.next()) {
            QJsonObject doc;
            doc["id"] = query.value(0).toString();
            doc["path"] = query.value(1).toString();
            doc["title"] = query.value(2).toString();
            doc["metadata"] = QJsonDocument::fromJson(query.value(3).toString().toUtf8()).object();
            doc["accessedAt"] = query.value(4).toLongLong();
            result.append(doc);
        }
    }
    
    return result;
}

bool LocalDatabase::touchDocument(const QString &id)
{
    QSqlQuery query(m_db);
    query.prepare("UPDATE documents SET accessed_at = strftime('%s', 'now') WHERE id = ?");
    query.addBindValue(id);
    
    return exec(query);
}

// ========== Chain Cache ==========

bool LocalDatabase::cacheChainState(const QString &key, const QJsonObject &value, int ttlSeconds)
{
    QSqlQuery query(m_db);
    query.prepare(R"(
        INSERT OR REPLACE INTO chain_cache (key, value, expires_at)
        VALUES (?, ?, strftime('%s', 'now') + ?)
    )");
    query.addBindValue(key);
    query.addBindValue(QString(QJsonDocument(value).toJson(QJsonDocument::Compact)));
    query.addBindValue(ttlSeconds);
    
    return exec(query);
}

QJsonObject LocalDatabase::getCachedChainState(const QString &key)
{
    QSqlQuery query(m_db);
    query.prepare(R"(
        SELECT value FROM chain_cache 
        WHERE key = ? AND expires_at > strftime('%s', 'now')
    )");
    query.addBindValue(key);
    
    if (exec(query) && query.next()) {
        return QJsonDocument::fromJson(query.value(0).toString().toUtf8()).object();
    }
    
    return QJsonObject();
}

int LocalDatabase::cleanupCache()
{
    QSqlQuery query(m_db);
    query.prepare("DELETE FROM chain_cache WHERE expires_at < strftime('%s', 'now')");
    
    if (exec(query)) {
        return query.numRowsAffected();
    }
    
    return 0;
}

// ========== Generic Key-Value ==========

bool LocalDatabase::setValue(const QString &key, const QVariant &value)
{
    QSqlQuery query(m_db);
    query.prepare(R"(
        INSERT OR REPLACE INTO settings (key, value, updated_at)
        VALUES (?, ?, strftime('%s', 'now'))
    )");
    query.addBindValue(key);
    query.addBindValue(value.toString());
    
    return exec(query);
}

QVariant LocalDatabase::getValue(const QString &key, const QVariant &defaultValue)
{
    QSqlQuery query(m_db);
    query.prepare("SELECT value FROM settings WHERE key = ?");
    query.addBindValue(key);
    
    if (exec(query) && query.next()) {
        return query.value(0);
    }
    
    return defaultValue;
}

bool LocalDatabase::hasKey(const QString &key)
{
    QSqlQuery query(m_db);
    query.prepare("SELECT 1 FROM settings WHERE key = ?");
    query.addBindValue(key);
    
    return exec(query) && query.next();
}

bool LocalDatabase::removeKey(const QString &key)
{
    QSqlQuery query(m_db);
    query.prepare("DELETE FROM settings WHERE key = ?");
    query.addBindValue(key);
    
    return exec(query);
}

// ========== Private ==========

bool LocalDatabase::exec(QSqlQuery &query)
{
    if (!query.exec()) {
        QString errorMsg = QString("SQL Error: %1 - Query: %2")
            .arg(query.lastError().text())
            .arg(query.lastQuery());
        qWarning() << errorMsg;
        emit error(errorMsg);
        return false;
    }
    return true;
}

} // namespace QOR
