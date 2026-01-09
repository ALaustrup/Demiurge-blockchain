/**
 * BlockchainTorrentBridge - Integrates torrenting with Demiurge blockchain
 * 
 * Handles:
 * - Registering torrents on-chain
 * - Searching torrents from blockchain
 * - Tracking peer reputation
 * - On-chain payment for premium content
 */

#ifndef BLOCKCHAIN_TORRENT_BRIDGE_H
#define BLOCKCHAIN_TORRENT_BRIDGE_H

#include <QObject>
#include <QString>
#include <QUrl>
#include <QNetworkAccessManager>
#include <QNetworkReply>
#include <QVariantMap>
#include <QVariantList>

class BlockchainTorrentBridge : public QObject
{
    Q_OBJECT
    
    Q_PROPERTY(bool isConnected READ isConnected NOTIFY connectionChanged)
    Q_PROPERTY(QString rpcUrl READ rpcUrl WRITE setRpcUrl NOTIFY rpcUrlChanged)

public:
    explicit BlockchainTorrentBridge(QObject *parent = nullptr);
    ~BlockchainTorrentBridge();

    bool isConnected() const { return m_isConnected; }
    QString rpcUrl() const { return m_rpcUrl; }
    void setRpcUrl(const QString &url);

    // Register torrent on-chain
    Q_INVOKABLE void registerTorrent(const QString &infoHash, const QString &name, 
                                     const QString &description = QString(),
                                     const QVariantMap &metadata = QVariantMap());
    
    // Search torrents on-chain
    Q_INVOKABLE QVariantList searchTorrents(const QString &query);
    
    // Get torrent metadata from chain
    Q_INVOKABLE QVariantMap getTorrentMetadata(const QString &infoHash);
    
    // Report peer activity (for reputation system)
    Q_INVOKABLE void reportPeerActivity(const QString &infoHash, const QString &peerId, 
                                       qint64 bytesUploaded, qint64 bytesDownloaded);
    
    // Get peer reputation
    Q_INVOKABLE int getPeerReputation(const QString &peerId);

signals:
    void connectionChanged();
    void rpcUrlChanged();
    void torrentRegistered(const QString &infoHash, const QString &txHash);
    void errorOccurred(const QString &error);

private slots:
    void onRpcReplyFinished();
    void checkConnection();

private:
    void callRPC(const QString &method, const QJsonObject &params, 
                 std::function<void(const QJsonObject&)> callback);
    void testConnection();
    
    QNetworkAccessManager *m_networkManager;
    QHash<QNetworkReply*, std::function<void(const QJsonObject&)>> m_pendingRequests;
    
    QString m_rpcUrl;
    bool m_isConnected;
    int m_requestId;
};

#endif // BLOCKCHAIN_TORRENT_BRIDGE_H
