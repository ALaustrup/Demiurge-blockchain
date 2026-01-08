/**
 * QØЯ Transaction Queue
 * 
 * In-memory queue for transaction processing with persistence backing.
 */

#ifndef QOR_TRANSACTION_QUEUE_H
#define QOR_TRANSACTION_QUEUE_H

#include <QObject>
#include <QString>
#include <QQueue>
#include <QJsonObject>
#include <QMutex>

namespace QOR {

class LocalDatabase;

/**
 * Transaction - Represents a queued transaction
 */
struct Transaction {
    QString hash;
    QByteArray signedData;
    qint64 createdAt;
    int retryCount;
    
    enum class Status {
        Pending,
        Submitted,
        Confirmed,
        Failed
    };
    Status status;
};

/**
 * TransactionQueue - Thread-safe transaction queue
 * 
 * Features:
 * - Priority ordering
 * - Retry logic
 * - Persistence to SQLite
 * - Status tracking
 */
class TransactionQueue : public QObject
{
    Q_OBJECT

public:
    explicit TransactionQueue(QObject *parent = nullptr);
    ~TransactionQueue();
    
    /**
     * Set database for persistence
     */
    void setDatabase(LocalDatabase *db);
    
    /**
     * Enqueue a transaction
     */
    bool enqueue(const QString &hash, const QByteArray &signedData);
    
    /**
     * Dequeue next transaction
     */
    Transaction dequeue();
    
    /**
     * Peek at next transaction without removing
     */
    Transaction peek() const;
    
    /**
     * Check if queue is empty
     */
    bool isEmpty() const;
    
    /**
     * Get queue size
     */
    int size() const;
    
    /**
     * Clear the queue
     */
    void clear();
    
    /**
     * Mark transaction as submitted
     */
    void markSubmitted(const QString &hash);
    
    /**
     * Mark transaction as confirmed
     */
    void markConfirmed(const QString &hash, qint64 blockHeight);
    
    /**
     * Mark transaction as failed (will retry)
     */
    void markFailed(const QString &hash, const QString &reason);
    
    /**
     * Get transaction by hash
     */
    Transaction getTransaction(const QString &hash) const;
    
    /**
     * Load from database
     */
    void loadFromDatabase();
    
    /**
     * Save to database
     */
    void saveToDatabase();

signals:
    /**
     * Emitted when transaction is added
     */
    void transactionQueued(const QString &hash);
    
    /**
     * Emitted when transaction status changes
     */
    void statusChanged(const QString &hash, Transaction::Status status);
    
    /**
     * Emitted when queue becomes non-empty
     */
    void hasTransactions();

private:
    LocalDatabase *m_database;
    QQueue<Transaction> m_queue;
    QMap<QString, Transaction> m_transactions;
    mutable QMutex m_mutex;
    
    static const int MAX_RETRIES = 3;
};

} // namespace QOR

#endif // QOR_TRANSACTION_QUEUE_H
