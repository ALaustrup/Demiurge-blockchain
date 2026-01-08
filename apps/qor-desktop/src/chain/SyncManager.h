/**
 * QØЯ Sync Manager
 * 
 * Manages synchronization between local state and chain.
 * Handles offline transaction queuing and state reconciliation.
 */

#ifndef QOR_SYNC_MANAGER_H
#define QOR_SYNC_MANAGER_H

#include <QObject>
#include <QString>
#include <QTimer>

namespace QOR {

class ChainClient;
class LocalDatabase;

/**
 * SyncManager - Offline-first synchronization
 * 
 * Responsibilities:
 * - Queue transactions when offline
 * - Submit queued transactions when online
 * - Sync local state with chain
 * - Handle conflict resolution
 */
class SyncManager : public QObject
{
    Q_OBJECT

public:
    enum class SyncState {
        Idle,
        Syncing,
        Error
    };
    Q_ENUM(SyncState)
    
    explicit SyncManager(QObject *parent = nullptr);
    ~SyncManager();
    
    /**
     * Set chain client
     */
    void setChainClient(ChainClient *client);
    
    /**
     * Set local database
     */
    void setDatabase(LocalDatabase *db);
    
    /**
     * Current sync state
     */
    SyncState state() const { return m_state; }
    
    /**
     * Check if currently syncing
     */
    bool isSyncing() const { return m_state == SyncState::Syncing; }
    
    /**
     * Get pending transaction count
     */
    int pendingCount() const { return m_pendingCount; }
    
    /**
     * Last sync timestamp
     */
    qint64 lastSyncTime() const { return m_lastSyncTime; }

signals:
    /**
     * Emitted when sync state changes
     */
    void stateChanged(SyncState state);
    
    /**
     * Emitted when sync completes
     */
    void syncComplete(bool success, int txSubmitted);
    
    /**
     * Emitted when a transaction is confirmed
     */
    void transactionConfirmed(const QString &txHash, qint64 blockHeight);
    
    /**
     * Emitted on sync error
     */
    void error(const QString &message);
    
    /**
     * Progress update
     */
    void progress(int current, int total);

public slots:
    /**
     * Start sync process
     */
    void startSync();
    
    /**
     * Force immediate sync
     */
    void forceSync();
    
    /**
     * Flush pending transactions
     */
    void flush();
    
    /**
     * Queue a transaction for later submission
     */
    void queueTransaction(const QString &txHash, const QByteArray &signedTx);
    
    /**
     * Enable/disable auto-sync
     */
    void setAutoSync(bool enabled, int intervalMs = 30000);

private slots:
    void processPendingTransactions();
    void checkConfirmations();
    void onAutoSyncTimer();

private:
    void setState(SyncState state);
    void syncAccountState();
    void submitNextTransaction();

private:
    ChainClient *m_chainClient;
    LocalDatabase *m_database;
    
    SyncState m_state;
    int m_pendingCount;
    qint64 m_lastSyncTime;
    
    QTimer *m_autoSyncTimer;
    QTimer *m_confirmationTimer;
    
    bool m_autoSyncEnabled;
};

} // namespace QOR

#endif // QOR_SYNC_MANAGER_H
