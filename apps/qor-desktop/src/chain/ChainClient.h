/**
 * QØЯ Chain Client
 * 
 * RPC client for communicating with the Demiurge blockchain.
 * Handles transaction submission, state queries, and block subscriptions.
 */

#ifndef QOR_CHAIN_CLIENT_H
#define QOR_CHAIN_CLIENT_H

#include <QObject>
#include <QString>
#include <QJsonObject>
#include <QJsonArray>
#include <QNetworkAccessManager>
#include <functional>

namespace QOR {

class LocalDatabase;

/**
 * ChainClient - Blockchain RPC client
 * 
 * Provides access to Demiurge chain operations:
 * - Account queries (balance, nonce, state)
 * - Transaction submission
 * - Block subscriptions
 * - NFT queries
 */
class ChainClient : public QObject
{
    Q_OBJECT

public:
    using Callback = std::function<void(bool success, const QJsonObject &result)>;
    
    explicit ChainClient(QObject *parent = nullptr);
    ~ChainClient();
    
    /**
     * Set the local database for caching
     */
    void setDatabase(LocalDatabase *db);
    
    /**
     * Set RPC endpoint
     */
    void setEndpoint(const QString &endpoint);
    QString endpoint() const { return m_endpoint; }
    
    /**
     * Check if connected to chain
     */
    bool isConnected() const { return m_connected; }
    
    // ========== Account Operations ==========
    
    /**
     * Get account balance
     */
    void getBalance(const QString &address, Callback callback);
    
    /**
     * Get account nonce
     */
    void getNonce(const QString &address, Callback callback);
    
    /**
     * Get full account state
     */
    void getAccountState(const QString &address, Callback callback);
    
    // ========== Transaction Operations ==========
    
    /**
     * Submit a signed transaction
     */
    void submitTransaction(const QByteArray &signedTx, Callback callback);
    
    /**
     * Get transaction status
     */
    void getTransactionStatus(const QString &txHash, Callback callback);
    
    /**
     * Get transaction receipt
     */
    void getTransactionReceipt(const QString &txHash, Callback callback);
    
    // ========== Block Operations ==========
    
    /**
     * Get current block height
     */
    void getBlockHeight(Callback callback);
    
    /**
     * Get block by height
     */
    void getBlock(qint64 height, Callback callback);
    
    /**
     * Get latest block
     */
    void getLatestBlock(Callback callback);
    
    // ========== NFT Operations ==========
    
    /**
     * Get NFTs owned by address
     */
    void getNFTs(const QString &address, Callback callback);
    
    /**
     * Get NFT metadata
     */
    void getNFTMetadata(const QString &tokenId, Callback callback);
    
    // ========== Chain State ==========
    
    /**
     * Get chain info (chain ID, version, etc.)
     */
    void getChainInfo(Callback callback);
    
    /**
     * Health check
     */
    void healthCheck(Callback callback);

signals:
    /**
     * Emitted when connection state changes
     */
    void connectionChanged(bool connected);
    
    /**
     * Emitted when new block is detected
     */
    void newBlock(qint64 height, const QJsonObject &block);
    
    /**
     * Emitted on RPC error
     */
    void error(const QString &message);

public slots:
    /**
     * Connect to chain
     */
    void connectToChain();
    
    /**
     * Disconnect from chain
     */
    void disconnect();
    
    /**
     * Start block polling
     */
    void startBlockPolling(int intervalMs = 5000);
    
    /**
     * Stop block polling
     */
    void stopBlockPolling();

private:
    /**
     * Make an RPC call
     */
    void rpcCall(const QString &method, const QJsonArray &params, Callback callback);
    
    /**
     * Handle network response
     */
    void handleResponse(QNetworkReply *reply, Callback callback);
    
    /**
     * Poll for new blocks
     */
    void pollBlock();

private:
    QNetworkAccessManager *m_networkManager;
    LocalDatabase *m_database;
    QString m_endpoint;
    bool m_connected;
    qint64 m_lastBlockHeight;
    int m_requestId;
    
    class QTimer *m_pollTimer;
};

} // namespace QOR

#endif // QOR_CHAIN_CLIENT_H
