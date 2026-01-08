/**
 * P2PNode.h - QØЯ Peer-to-Peer Network Node
 * 
 * Manages P2P connectivity for the Demiurge desktop client.
 * Handles peer discovery, content sharing, and DHT operations.
 * 
 * Features:
 * - Peer discovery (mDNS, DHT, bootstrap nodes)
 * - Content routing and retrieval
 * - Incentivized seeding (earn CGT for hosting content)
 * - NAT traversal (STUN/TURN)
 */

#ifndef P2PNODE_H
#define P2PNODE_H

#include <QObject>
#include <QHostAddress>
#include <QUdpSocket>
#include <QTcpServer>
#include <QTcpSocket>
#include <QTimer>
#include <QCryptographicHash>
#include <QJsonObject>
#include <QMap>
#include <QSet>

namespace QOR {

/**
 * Peer information structure
 */
struct PeerInfo {
    QString peerId;
    QHostAddress address;
    quint16 port;
    QString abyssId;
    qint64 lastSeen;
    quint64 bytesShared;
    bool isValidator;
    int reputation;
};

/**
 * Content metadata for DHT
 */
struct ContentMeta {
    QString contentId;          // Hash of content
    QString name;
    quint64 size;
    QString mimeType;
    QStringList providers;      // Peer IDs that have this content
    qint64 addedAt;
};

/**
 * P2P Node - Core networking component
 */
class P2PNode : public QObject
{
    Q_OBJECT
    
    Q_PROPERTY(QString peerId READ peerId CONSTANT)
    Q_PROPERTY(bool isOnline READ isOnline NOTIFY onlineChanged)
    Q_PROPERTY(int peerCount READ peerCount NOTIFY peerCountChanged)
    Q_PROPERTY(bool isSeedingEnabled READ isSeedingEnabled WRITE setSeedingEnabled NOTIFY seedingEnabledChanged)
    Q_PROPERTY(quint64 totalBytesShared READ totalBytesShared NOTIFY statsChanged)
    Q_PROPERTY(quint64 totalBytesReceived READ totalBytesReceived NOTIFY statsChanged)
    
public:
    explicit P2PNode(QObject *parent = nullptr);
    ~P2PNode();
    
    // ========================================================================
    // INITIALIZATION
    // ========================================================================
    
    /**
     * Initialize the P2P node
     * @param port Port to listen on (0 for auto)
     * @return true if successful
     */
    bool initialize(quint16 port = 0);
    
    /**
     * Shutdown the P2P node
     */
    void shutdown();
    
    // ========================================================================
    // PROPERTIES
    // ========================================================================
    
    QString peerId() const { return m_peerId; }
    bool isOnline() const { return m_isOnline; }
    int peerCount() const { return m_peers.size(); }
    bool isSeedingEnabled() const { return m_seedingEnabled; }
    void setSeedingEnabled(bool enabled);
    quint64 totalBytesShared() const { return m_bytesShared; }
    quint64 totalBytesReceived() const { return m_bytesReceived; }
    
    // ========================================================================
    // PEER OPERATIONS
    // ========================================================================
    
    /**
     * Connect to a bootstrap node
     */
    Q_INVOKABLE void connectToBootstrap(const QString& address, quint16 port);
    
    /**
     * Connect to a specific peer
     */
    Q_INVOKABLE void connectToPeer(const QString& peerId);
    
    /**
     * Disconnect from a peer
     */
    Q_INVOKABLE void disconnectPeer(const QString& peerId);
    
    /**
     * Get list of connected peers
     */
    Q_INVOKABLE QVariantList getConnectedPeers() const;
    
    // ========================================================================
    // CONTENT OPERATIONS
    // ========================================================================
    
    /**
     * Announce that we have content available
     */
    Q_INVOKABLE void announceContent(const QString& contentId, const QJsonObject& metadata);
    
    /**
     * Find providers for content
     */
    Q_INVOKABLE void findContent(const QString& contentId);
    
    /**
     * Request content from a peer
     */
    Q_INVOKABLE void requestContent(const QString& contentId, const QString& peerId);
    
    /**
     * Start seeding a file
     */
    Q_INVOKABLE bool startSeeding(const QString& filePath);
    
    /**
     * Stop seeding a file
     */
    Q_INVOKABLE void stopSeeding(const QString& contentId);
    
    /**
     * Get seeding stats
     */
    Q_INVOKABLE QVariantMap getSeedingStats() const;
    
signals:
    void onlineChanged(bool online);
    void peerCountChanged(int count);
    void seedingEnabledChanged(bool enabled);
    void statsChanged();
    
    void peerConnected(const QString& peerId, const QJsonObject& info);
    void peerDisconnected(const QString& peerId);
    void peerDiscovered(const QString& peerId, const QString& address, quint16 port);
    
    void contentFound(const QString& contentId, const QStringList& providers);
    void contentReceived(const QString& contentId, const QByteArray& data);
    void contentRequestReceived(const QString& contentId, const QString& fromPeer);
    
    void seedingReward(const QString& contentId, quint64 amount);
    void error(const QString& message);
    
private slots:
    void onNewConnection();
    void onPeerData();
    void onPeerDisconnected();
    void onDiscoveryTimer();
    void onHeartbeatTimer();
    
private:
    // ========================================================================
    // INTERNAL METHODS
    // ========================================================================
    
    void generatePeerId();
    void startDiscovery();
    void sendMessage(QTcpSocket* socket, const QJsonObject& message);
    void handleMessage(QTcpSocket* socket, const QJsonObject& message);
    void handleHello(QTcpSocket* socket, const QJsonObject& data);
    void handleFindNode(QTcpSocket* socket, const QJsonObject& data);
    void handleAnnounce(QTcpSocket* socket, const QJsonObject& data);
    void handleFindContent(QTcpSocket* socket, const QJsonObject& data);
    void handleContentRequest(QTcpSocket* socket, const QJsonObject& data);
    
    QString hashContent(const QByteArray& data);
    
    // ========================================================================
    // MEMBER VARIABLES
    // ========================================================================
    
    QString m_peerId;
    bool m_isOnline = false;
    bool m_seedingEnabled = true;
    
    QTcpServer* m_server = nullptr;
    QMap<QString, QTcpSocket*> m_peerSockets;
    QMap<QString, PeerInfo> m_peers;
    
    // DHT-like content index
    QMap<QString, ContentMeta> m_contentIndex;
    QMap<QString, QString> m_localContent;  // contentId -> filePath
    
    // Stats
    quint64 m_bytesShared = 0;
    quint64 m_bytesReceived = 0;
    
    // Timers
    QTimer* m_discoveryTimer = nullptr;
    QTimer* m_heartbeatTimer = nullptr;
    
    // Bootstrap nodes
    QList<QPair<QString, quint16>> m_bootstrapNodes;
};

} // namespace QOR

#endif // P2PNODE_H
