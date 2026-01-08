/**
 * QØЯ Local Database
 * 
 * SQLite-based local storage for offline-first operation.
 * Stores account state, pending transactions, media index, and more.
 */

#ifndef QOR_LOCAL_DATABASE_H
#define QOR_LOCAL_DATABASE_H

#include <QObject>
#include <QSqlDatabase>
#include <QSqlQuery>
#include <QString>
#include <QVariant>
#include <QJsonObject>
#include <QVector>

namespace QOR {

/**
 * LocalDatabase - SQLite wrapper for local storage
 * 
 * Tables:
 * - account: AbyssID data and cached balance
 * - pending_tx: Queued transactions for offline support
 * - media_library: Local media index for NEON
 * - documents: WRYT document metadata
 * - files_index: User's filesystem index
 * - settings: App preferences
 * - chain_cache: Cached chain state
 * - bookmarks: Browser bookmarks
 * - history: Browser and app history
 */
class LocalDatabase : public QObject
{
    Q_OBJECT

public:
    explicit LocalDatabase(QObject *parent = nullptr);
    ~LocalDatabase();
    
    /**
     * Open the database
     * @param path Full path to database file
     * @return true if opened successfully
     */
    bool open(const QString &path);
    
    /**
     * Close the database
     */
    void close();
    
    /**
     * Check if database is open
     */
    bool isOpen() const;
    
    /**
     * Run database migrations
     * @return true if migrations successful
     */
    bool migrate();
    
    /**
     * Get current schema version
     */
    int schemaVersion() const;
    
    // ========== Account Operations ==========
    
    /**
     * Save account data
     */
    bool saveAccount(const QString &address, const QJsonObject &data);
    
    /**
     * Load account data
     */
    QJsonObject loadAccount(const QString &address);
    
    /**
     * Get cached balance
     */
    QString getCachedBalance(const QString &address);
    
    /**
     * Update cached balance
     */
    bool updateCachedBalance(const QString &address, const QString &balance);
    
    // ========== Pending Transactions ==========
    
    /**
     * Queue a transaction for later submission
     */
    bool queueTransaction(const QString &txHash, const QJsonObject &txData);
    
    /**
     * Get all pending transactions
     */
    QVector<QJsonObject> getPendingTransactions();
    
    /**
     * Mark transaction as submitted
     */
    bool markTransactionSubmitted(const QString &txHash);
    
    /**
     * Mark transaction as confirmed
     */
    bool markTransactionConfirmed(const QString &txHash, qint64 blockHeight);
    
    /**
     * Remove old confirmed transactions
     */
    int cleanupConfirmedTransactions(int keepDays = 30);
    
    // ========== Media Library ==========
    
    /**
     * Add media item to library
     */
    bool addMediaItem(const QString &id, const QString &path, 
                      const QString &type, const QJsonObject &metadata);
    
    /**
     * Get media items by type
     */
    QVector<QJsonObject> getMediaItems(const QString &type = QString());
    
    /**
     * Update media metadata
     */
    bool updateMediaMetadata(const QString &id, const QJsonObject &metadata);
    
    /**
     * Remove media item
     */
    bool removeMediaItem(const QString &id);
    
    // ========== Documents ==========
    
    /**
     * Save document metadata
     */
    bool saveDocument(const QString &id, const QString &path,
                      const QString &title, const QJsonObject &metadata);
    
    /**
     * Get recent documents
     */
    QVector<QJsonObject> getRecentDocuments(int limit = 20);
    
    /**
     * Update document last accessed
     */
    bool touchDocument(const QString &id);
    
    // ========== Chain Cache ==========
    
    /**
     * Cache chain state
     */
    bool cacheChainState(const QString &key, const QJsonObject &value, 
                         int ttlSeconds = 300);
    
    /**
     * Get cached chain state
     */
    QJsonObject getCachedChainState(const QString &key);
    
    /**
     * Clear expired cache entries
     */
    int cleanupCache();
    
    // ========== Generic Key-Value ==========
    
    /**
     * Set a key-value pair
     */
    bool setValue(const QString &key, const QVariant &value);
    
    /**
     * Get a value by key
     */
    QVariant getValue(const QString &key, const QVariant &defaultValue = QVariant());
    
    /**
     * Check if key exists
     */
    bool hasKey(const QString &key);
    
    /**
     * Remove a key
     */
    bool removeKey(const QString &key);

signals:
    /**
     * Emitted on database error
     */
    void error(const QString &message);

private:
    /**
     * Execute a query
     */
    bool exec(QSqlQuery &query);
    
    /**
     * Create tables if they don't exist
     */
    bool createTables();
    
    /**
     * Run a specific migration
     */
    bool runMigration(int version);

private:
    QSqlDatabase m_db;
    QString m_connectionName;
    bool m_isOpen;
};

} // namespace QOR

#endif // QOR_LOCAL_DATABASE_H
