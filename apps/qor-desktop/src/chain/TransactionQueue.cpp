/**
 * QØЯ Transaction Queue Implementation
 */

#include "TransactionQueue.h"
#include "../storage/LocalDatabase.h"

#include <QDateTime>
#include <QMutexLocker>
#include <QDebug>

namespace QOR {

TransactionQueue::TransactionQueue(QObject *parent)
    : QObject(parent)
    , m_database(nullptr)
{
}

TransactionQueue::~TransactionQueue()
{
    saveToDatabase();
}

void TransactionQueue::setDatabase(LocalDatabase *db)
{
    m_database = db;
    loadFromDatabase();
}

bool TransactionQueue::enqueue(const QString &hash, const QByteArray &signedData)
{
    QMutexLocker locker(&m_mutex);
    
    if (m_transactions.contains(hash)) {
        qWarning() << "Transaction already in queue:" << hash;
        return false;
    }
    
    Transaction tx;
    tx.hash = hash;
    tx.signedData = signedData;
    tx.createdAt = QDateTime::currentSecsSinceEpoch();
    tx.retryCount = 0;
    tx.status = Transaction::Status::Pending;
    
    m_queue.enqueue(tx);
    m_transactions[hash] = tx;
    
    // Persist to database
    if (m_database) {
        QJsonObject txData;
        txData["signedTx"] = QString::fromLatin1(signedData.toHex());
        txData["createdAt"] = tx.createdAt;
        m_database->queueTransaction(hash, txData);
    }
    
    emit transactionQueued(hash);
    
    if (m_queue.size() == 1) {
        emit hasTransactions();
    }
    
    return true;
}

Transaction TransactionQueue::dequeue()
{
    QMutexLocker locker(&m_mutex);
    
    if (m_queue.isEmpty()) {
        return Transaction();
    }
    
    return m_queue.dequeue();
}

Transaction TransactionQueue::peek() const
{
    QMutexLocker locker(&m_mutex);
    
    if (m_queue.isEmpty()) {
        return Transaction();
    }
    
    return m_queue.head();
}

bool TransactionQueue::isEmpty() const
{
    QMutexLocker locker(&m_mutex);
    return m_queue.isEmpty();
}

int TransactionQueue::size() const
{
    QMutexLocker locker(&m_mutex);
    return m_queue.size();
}

void TransactionQueue::clear()
{
    QMutexLocker locker(&m_mutex);
    m_queue.clear();
    m_transactions.clear();
}

void TransactionQueue::markSubmitted(const QString &hash)
{
    QMutexLocker locker(&m_mutex);
    
    if (m_transactions.contains(hash)) {
        m_transactions[hash].status = Transaction::Status::Submitted;
        
        if (m_database) {
            m_database->markTransactionSubmitted(hash);
        }
        
        emit statusChanged(hash, Transaction::Status::Submitted);
    }
}

void TransactionQueue::markConfirmed(const QString &hash, qint64 blockHeight)
{
    QMutexLocker locker(&m_mutex);
    
    if (m_transactions.contains(hash)) {
        m_transactions[hash].status = Transaction::Status::Confirmed;
        
        if (m_database) {
            m_database->markTransactionConfirmed(hash, blockHeight);
        }
        
        // Remove from active tracking
        m_transactions.remove(hash);
        
        emit statusChanged(hash, Transaction::Status::Confirmed);
    }
}

void TransactionQueue::markFailed(const QString &hash, const QString &reason)
{
    QMutexLocker locker(&m_mutex);
    
    if (m_transactions.contains(hash)) {
        Transaction &tx = m_transactions[hash];
        tx.retryCount++;
        
        if (tx.retryCount >= MAX_RETRIES) {
            tx.status = Transaction::Status::Failed;
            qWarning() << "Transaction failed permanently:" << hash << reason;
            emit statusChanged(hash, Transaction::Status::Failed);
        } else {
            // Re-queue for retry
            tx.status = Transaction::Status::Pending;
            m_queue.enqueue(tx);
            qInfo() << "Transaction will retry:" << hash << "attempt" << tx.retryCount;
        }
    }
}

Transaction TransactionQueue::getTransaction(const QString &hash) const
{
    QMutexLocker locker(&m_mutex);
    return m_transactions.value(hash);
}

void TransactionQueue::loadFromDatabase()
{
    if (!m_database) {
        return;
    }
    
    QMutexLocker locker(&m_mutex);
    
    auto pending = m_database->getPendingTransactions();
    
    for (const auto &txJson : pending) {
        Transaction tx;
        tx.hash = txJson["hash"].toString();
        
        QJsonObject data = txJson["data"].toObject();
        tx.signedData = QByteArray::fromHex(data["signedTx"].toString().toLatin1());
        tx.createdAt = data["createdAt"].toVariant().toLongLong();
        tx.retryCount = 0;
        tx.status = Transaction::Status::Pending;
        
        m_queue.enqueue(tx);
        m_transactions[tx.hash] = tx;
    }
    
    qInfo() << "Loaded" << m_queue.size() << "pending transactions from database";
}

void TransactionQueue::saveToDatabase()
{
    // Transactions are saved on enqueue, this is a no-op
    // Could be used to sync any in-memory state if needed
}

} // namespace QOR
