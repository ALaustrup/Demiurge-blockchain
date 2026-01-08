/**
 * QØЯ Sync Manager Implementation
 */

#include "SyncManager.h"
#include "ChainClient.h"
#include "../storage/LocalDatabase.h"

#include <QDateTime>
#include <QDebug>

namespace QOR {

SyncManager::SyncManager(QObject *parent)
    : QObject(parent)
    , m_chainClient(nullptr)
    , m_database(nullptr)
    , m_state(SyncState::Idle)
    , m_pendingCount(0)
    , m_lastSyncTime(0)
    , m_autoSyncTimer(nullptr)
    , m_confirmationTimer(nullptr)
    , m_autoSyncEnabled(false)
{
    // Confirmation check timer
    m_confirmationTimer = new QTimer(this);
    connect(m_confirmationTimer, &QTimer::timeout, this, &SyncManager::checkConfirmations);
}

SyncManager::~SyncManager()
{
    flush();
}

void SyncManager::setChainClient(ChainClient *client)
{
    m_chainClient = client;
    
    if (m_chainClient) {
        // Listen for new blocks to check confirmations
        connect(m_chainClient, &ChainClient::newBlock, [this](qint64, const QJsonObject &) {
            checkConfirmations();
        });
        
        // Sync when connection established
        connect(m_chainClient, &ChainClient::connectionChanged, [this](bool connected) {
            if (connected) {
                startSync();
            }
        });
    }
}

void SyncManager::setDatabase(LocalDatabase *db)
{
    m_database = db;
    
    if (m_database) {
        // Count pending transactions
        auto pending = m_database->getPendingTransactions();
        m_pendingCount = pending.size();
    }
}

void SyncManager::setState(SyncState state)
{
    if (m_state != state) {
        m_state = state;
        emit stateChanged(state);
    }
}

void SyncManager::startSync()
{
    if (m_state == SyncState::Syncing) {
        qDebug() << "Sync already in progress";
        return;
    }
    
    if (!m_chainClient || !m_chainClient->isConnected()) {
        qDebug() << "Cannot sync: not connected to chain";
        return;
    }
    
    qInfo() << "Starting sync...";
    setState(SyncState::Syncing);
    
    // First sync account state, then process pending transactions
    syncAccountState();
}

void SyncManager::forceSync()
{
    // Reset state and force sync
    m_state = SyncState::Idle;
    startSync();
}

void SyncManager::flush()
{
    // Just update pending count, actual flush happens on next sync
    if (m_database) {
        auto pending = m_database->getPendingTransactions();
        m_pendingCount = pending.size();
    }
}

void SyncManager::queueTransaction(const QString &txHash, const QByteArray &signedTx)
{
    if (!m_database) {
        emit error("Database not available");
        return;
    }
    
    QJsonObject txData;
    txData["signedTx"] = QString::fromLatin1(signedTx.toHex());
    txData["queuedAt"] = QDateTime::currentSecsSinceEpoch();
    
    if (m_database->queueTransaction(txHash, txData)) {
        m_pendingCount++;
        qInfo() << "Transaction queued:" << txHash;
        
        // Try to submit immediately if online
        if (m_chainClient && m_chainClient->isConnected()) {
            processPendingTransactions();
        }
    } else {
        emit error("Failed to queue transaction");
    }
}

void SyncManager::setAutoSync(bool enabled, int intervalMs)
{
    m_autoSyncEnabled = enabled;
    
    if (enabled) {
        if (!m_autoSyncTimer) {
            m_autoSyncTimer = new QTimer(this);
            connect(m_autoSyncTimer, &QTimer::timeout, this, &SyncManager::onAutoSyncTimer);
        }
        m_autoSyncTimer->start(intervalMs);
    } else if (m_autoSyncTimer) {
        m_autoSyncTimer->stop();
    }
}

void SyncManager::syncAccountState()
{
    // This would sync the local account state with chain
    // For now, just move on to processing transactions
    processPendingTransactions();
}

void SyncManager::processPendingTransactions()
{
    if (!m_database || !m_chainClient) {
        setState(SyncState::Idle);
        return;
    }
    
    auto pending = m_database->getPendingTransactions();
    m_pendingCount = pending.size();
    
    if (pending.isEmpty()) {
        qInfo() << "No pending transactions";
        m_lastSyncTime = QDateTime::currentSecsSinceEpoch();
        setState(SyncState::Idle);
        emit syncComplete(true, 0);
        return;
    }
    
    qInfo() << "Processing" << pending.size() << "pending transactions";
    
    int submitted = 0;
    int total = pending.size();
    
    for (const auto &tx : pending) {
        QString txHash = tx["hash"].toString();
        QJsonObject txData = tx["data"].toObject();
        QString signedTxHex = txData["signedTx"].toString();
        
        QByteArray signedTx = QByteArray::fromHex(signedTxHex.toLatin1());
        
        m_chainClient->submitTransaction(signedTx, [this, txHash, &submitted, total](bool success, const QJsonObject &result) {
            if (success) {
                m_database->markTransactionSubmitted(txHash);
                submitted++;
                emit progress(submitted, total);
                qInfo() << "Transaction submitted:" << txHash;
            } else {
                qWarning() << "Failed to submit transaction:" << txHash 
                          << result["error"].toString();
            }
        });
    }
    
    m_lastSyncTime = QDateTime::currentSecsSinceEpoch();
    setState(SyncState::Idle);
    emit syncComplete(true, submitted);
    
    // Start confirmation checking
    if (!m_confirmationTimer->isActive()) {
        m_confirmationTimer->start(10000); // Check every 10 seconds
    }
}

void SyncManager::checkConfirmations()
{
    if (!m_database || !m_chainClient || !m_chainClient->isConnected()) {
        return;
    }
    
    auto pending = m_database->getPendingTransactions();
    
    // Filter to only submitted (not confirmed) transactions
    QVector<QJsonObject> submitted;
    for (const auto &tx : pending) {
        // Note: getPendingTransactions only returns status='pending', 
        // we'd need a separate query for 'submitted' status
        submitted.append(tx);
    }
    
    if (submitted.isEmpty()) {
        m_confirmationTimer->stop();
        return;
    }
    
    for (const auto &tx : submitted) {
        QString txHash = tx["hash"].toString();
        
        m_chainClient->getTransactionReceipt(txHash, [this, txHash](bool success, const QJsonObject &result) {
            if (success && result.contains("blockNumber")) {
                qint64 blockHeight = result["blockNumber"].toString().toLongLong(nullptr, 16);
                m_database->markTransactionConfirmed(txHash, blockHeight);
                m_pendingCount--;
                emit transactionConfirmed(txHash, blockHeight);
                qInfo() << "Transaction confirmed:" << txHash << "at block" << blockHeight;
            }
        });
    }
}

void SyncManager::onAutoSyncTimer()
{
    if (m_chainClient && m_chainClient->isConnected()) {
        startSync();
    }
}

} // namespace QOR
