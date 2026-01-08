/**
 * P2PNode.cpp - QØЯ Peer-to-Peer Network Node Implementation
 */

#include "P2PNode.h"
#include <QJsonDocument>
#include <QJsonArray>
#include <QFile>
#include <QFileInfo>
#include <QUuid>
#include <QDateTime>

namespace QOR {

P2PNode::P2PNode(QObject *parent)
    : QObject(parent)
{
    generatePeerId();
    
    // Default bootstrap nodes
    m_bootstrapNodes = {
        {"51.210.209.112", 26657},  // Demiurge primary node
    };
}

P2PNode::~P2PNode()
{
    shutdown();
}

void P2PNode::generatePeerId()
{
    // Generate a unique peer ID based on UUID
    QByteArray uuid = QUuid::createUuid().toByteArray();
    QByteArray hash = QCryptographicHash::hash(uuid, QCryptographicHash::Sha256);
    m_peerId = "qor-" + hash.toHex().left(32);
}

bool P2PNode::initialize(quint16 port)
{
    if (m_server) {
        qWarning() << "P2P node already initialized";
        return false;
    }
    
    m_server = new QTcpServer(this);
    connect(m_server, &QTcpServer::newConnection, this, &P2PNode::onNewConnection);
    
    // Listen on specified port or any available
    if (!m_server->listen(QHostAddress::Any, port)) {
        qWarning() << "Failed to start P2P server:" << m_server->errorString();
        delete m_server;
        m_server = nullptr;
        return false;
    }
    
    qInfo() << "P2P node started on port" << m_server->serverPort();
    qInfo() << "Peer ID:" << m_peerId;
    
    // Start discovery timer
    m_discoveryTimer = new QTimer(this);
    connect(m_discoveryTimer, &QTimer::timeout, this, &P2PNode::onDiscoveryTimer);
    m_discoveryTimer->start(30000);  // Every 30 seconds
    
    // Start heartbeat timer
    m_heartbeatTimer = new QTimer(this);
    connect(m_heartbeatTimer, &QTimer::timeout, this, &P2PNode::onHeartbeatTimer);
    m_heartbeatTimer->start(60000);  // Every minute
    
    // Initial discovery
    startDiscovery();
    
    m_isOnline = true;
    emit onlineChanged(true);
    
    return true;
}

void P2PNode::shutdown()
{
    if (!m_server) return;
    
    // Disconnect all peers
    for (auto it = m_peerSockets.begin(); it != m_peerSockets.end(); ++it) {
        it.value()->disconnectFromHost();
        it.value()->deleteLater();
    }
    m_peerSockets.clear();
    m_peers.clear();
    
    // Stop timers
    if (m_discoveryTimer) {
        m_discoveryTimer->stop();
        delete m_discoveryTimer;
        m_discoveryTimer = nullptr;
    }
    
    if (m_heartbeatTimer) {
        m_heartbeatTimer->stop();
        delete m_heartbeatTimer;
        m_heartbeatTimer = nullptr;
    }
    
    // Close server
    m_server->close();
    delete m_server;
    m_server = nullptr;
    
    m_isOnline = false;
    emit onlineChanged(false);
    emit peerCountChanged(0);
    
    qInfo() << "P2P node shutdown";
}

void P2PNode::setSeedingEnabled(bool enabled)
{
    if (m_seedingEnabled != enabled) {
        m_seedingEnabled = enabled;
        emit seedingEnabledChanged(enabled);
    }
}

void P2PNode::connectToBootstrap(const QString& address, quint16 port)
{
    QTcpSocket* socket = new QTcpSocket(this);
    
    connect(socket, &QTcpSocket::connected, this, [this, socket]() {
        // Send hello message
        QJsonObject hello;
        hello["type"] = "hello";
        hello["peerId"] = m_peerId;
        hello["version"] = "1.0.0";
        hello["port"] = m_server ? m_server->serverPort() : 0;
        sendMessage(socket, hello);
    });
    
    connect(socket, &QTcpSocket::readyRead, this, &P2PNode::onPeerData);
    connect(socket, &QTcpSocket::disconnected, this, &P2PNode::onPeerDisconnected);
    
    socket->connectToHost(address, port);
}

void P2PNode::connectToPeer(const QString& peerId)
{
    if (m_peerSockets.contains(peerId)) {
        qDebug() << "Already connected to peer:" << peerId;
        return;
    }
    
    auto it = m_peers.find(peerId);
    if (it == m_peers.end()) {
        qWarning() << "Unknown peer:" << peerId;
        return;
    }
    
    QTcpSocket* socket = new QTcpSocket(this);
    
    connect(socket, &QTcpSocket::connected, this, [this, socket, peerId]() {
        m_peerSockets[peerId] = socket;
        
        QJsonObject hello;
        hello["type"] = "hello";
        hello["peerId"] = m_peerId;
        hello["version"] = "1.0.0";
        hello["port"] = m_server ? m_server->serverPort() : 0;
        sendMessage(socket, hello);
    });
    
    connect(socket, &QTcpSocket::readyRead, this, &P2PNode::onPeerData);
    connect(socket, &QTcpSocket::disconnected, this, &P2PNode::onPeerDisconnected);
    
    socket->connectToHost(it.value().address, it.value().port);
}

void P2PNode::disconnectPeer(const QString& peerId)
{
    auto it = m_peerSockets.find(peerId);
    if (it != m_peerSockets.end()) {
        it.value()->disconnectFromHost();
        it.value()->deleteLater();
        m_peerSockets.erase(it);
        m_peers.remove(peerId);
        
        emit peerDisconnected(peerId);
        emit peerCountChanged(m_peers.size());
    }
}

QVariantList P2PNode::getConnectedPeers() const
{
    QVariantList result;
    
    for (auto it = m_peers.begin(); it != m_peers.end(); ++it) {
        QVariantMap peer;
        peer["peerId"] = it.value().peerId;
        peer["address"] = it.value().address.toString();
        peer["port"] = it.value().port;
        peer["abyssId"] = it.value().abyssId;
        peer["bytesShared"] = (qulonglong)it.value().bytesShared;
        peer["isValidator"] = it.value().isValidator;
        result.append(peer);
    }
    
    return result;
}

void P2PNode::announceContent(const QString& contentId, const QJsonObject& metadata)
{
    QJsonObject msg;
    msg["type"] = "announce";
    msg["contentId"] = contentId;
    msg["metadata"] = metadata;
    msg["peerId"] = m_peerId;
    
    // Broadcast to all connected peers
    for (auto socket : m_peerSockets) {
        sendMessage(socket, msg);
    }
}

void P2PNode::findContent(const QString& contentId)
{
    QJsonObject msg;
    msg["type"] = "find_content";
    msg["contentId"] = contentId;
    msg["peerId"] = m_peerId;
    
    // Ask all connected peers
    for (auto socket : m_peerSockets) {
        sendMessage(socket, msg);
    }
}

void P2PNode::requestContent(const QString& contentId, const QString& peerId)
{
    auto it = m_peerSockets.find(peerId);
    if (it == m_peerSockets.end()) {
        emit error("Not connected to peer: " + peerId);
        return;
    }
    
    QJsonObject msg;
    msg["type"] = "request_content";
    msg["contentId"] = contentId;
    msg["peerId"] = m_peerId;
    
    sendMessage(it.value(), msg);
}

bool P2PNode::startSeeding(const QString& filePath)
{
    QFile file(filePath);
    if (!file.exists()) {
        emit error("File not found: " + filePath);
        return false;
    }
    
    if (!file.open(QIODevice::ReadOnly)) {
        emit error("Cannot open file: " + filePath);
        return false;
    }
    
    // Calculate content hash
    QCryptographicHash hash(QCryptographicHash::Sha256);
    hash.addData(&file);
    QString contentId = hash.result().toHex();
    file.close();
    
    // Store in local content index
    m_localContent[contentId] = filePath;
    
    // Announce to network
    QFileInfo info(filePath);
    QJsonObject metadata;
    metadata["name"] = info.fileName();
    metadata["size"] = info.size();
    
    announceContent(contentId, metadata);
    
    qInfo() << "Started seeding:" << contentId << "->" << filePath;
    return true;
}

void P2PNode::stopSeeding(const QString& contentId)
{
    m_localContent.remove(contentId);
    qInfo() << "Stopped seeding:" << contentId;
}

QVariantMap P2PNode::getSeedingStats() const
{
    QVariantMap stats;
    stats["totalSeeding"] = m_localContent.size();
    stats["bytesShared"] = (qulonglong)m_bytesShared;
    stats["bytesReceived"] = (qulonglong)m_bytesReceived;
    stats["peerCount"] = m_peers.size();
    return stats;
}

// ============================================================================
// PRIVATE SLOTS
// ============================================================================

void P2PNode::onNewConnection()
{
    while (m_server->hasPendingConnections()) {
        QTcpSocket* socket = m_server->nextPendingConnection();
        
        connect(socket, &QTcpSocket::readyRead, this, &P2PNode::onPeerData);
        connect(socket, &QTcpSocket::disconnected, this, &P2PNode::onPeerDisconnected);
        
        qDebug() << "New P2P connection from" << socket->peerAddress().toString();
    }
}

void P2PNode::onPeerData()
{
    QTcpSocket* socket = qobject_cast<QTcpSocket*>(sender());
    if (!socket) return;
    
    while (socket->canReadLine()) {
        QByteArray line = socket->readLine().trimmed();
        
        QJsonDocument doc = QJsonDocument::fromJson(line);
        if (doc.isNull()) {
            qWarning() << "Invalid JSON from peer:" << line;
            continue;
        }
        
        handleMessage(socket, doc.object());
    }
}

void P2PNode::onPeerDisconnected()
{
    QTcpSocket* socket = qobject_cast<QTcpSocket*>(sender());
    if (!socket) return;
    
    // Find and remove the peer
    for (auto it = m_peerSockets.begin(); it != m_peerSockets.end(); ++it) {
        if (it.value() == socket) {
            QString peerId = it.key();
            m_peerSockets.erase(it);
            m_peers.remove(peerId);
            
            emit peerDisconnected(peerId);
            emit peerCountChanged(m_peers.size());
            break;
        }
    }
    
    socket->deleteLater();
}

void P2PNode::onDiscoveryTimer()
{
    startDiscovery();
}

void P2PNode::onHeartbeatTimer()
{
    // Send heartbeat to all connected peers
    QJsonObject heartbeat;
    heartbeat["type"] = "heartbeat";
    heartbeat["peerId"] = m_peerId;
    heartbeat["timestamp"] = QDateTime::currentSecsSinceEpoch();
    
    for (auto socket : m_peerSockets) {
        sendMessage(socket, heartbeat);
    }
}

// ============================================================================
// PRIVATE METHODS
// ============================================================================

void P2PNode::startDiscovery()
{
    // Connect to bootstrap nodes if not connected
    for (const auto& bootstrap : m_bootstrapNodes) {
        connectToBootstrap(bootstrap.first, bootstrap.second);
    }
}

void P2PNode::sendMessage(QTcpSocket* socket, const QJsonObject& message)
{
    if (!socket || socket->state() != QAbstractSocket::ConnectedState) {
        return;
    }
    
    QJsonDocument doc(message);
    socket->write(doc.toJson(QJsonDocument::Compact) + "\n");
}

void P2PNode::handleMessage(QTcpSocket* socket, const QJsonObject& message)
{
    QString type = message["type"].toString();
    
    if (type == "hello") {
        handleHello(socket, message);
    } else if (type == "find_node") {
        handleFindNode(socket, message);
    } else if (type == "announce") {
        handleAnnounce(socket, message);
    } else if (type == "find_content") {
        handleFindContent(socket, message);
    } else if (type == "request_content") {
        handleContentRequest(socket, message);
    } else if (type == "content_response") {
        QString contentId = message["contentId"].toString();
        QByteArray data = QByteArray::fromBase64(message["data"].toString().toUtf8());
        m_bytesReceived += data.size();
        emit statsChanged();
        emit contentReceived(contentId, data);
    } else if (type == "content_found") {
        QString contentId = message["contentId"].toString();
        QJsonArray providersArray = message["providers"].toArray();
        QStringList providers;
        for (const auto& p : providersArray) {
            providers.append(p.toString());
        }
        emit contentFound(contentId, providers);
    } else if (type == "heartbeat") {
        // Update last seen for peer
        QString peerId = message["peerId"].toString();
        if (m_peers.contains(peerId)) {
            m_peers[peerId].lastSeen = QDateTime::currentSecsSinceEpoch();
        }
    }
}

void P2PNode::handleHello(QTcpSocket* socket, const QJsonObject& data)
{
    QString peerId = data["peerId"].toString();
    quint16 port = data["port"].toInt();
    
    PeerInfo peer;
    peer.peerId = peerId;
    peer.address = socket->peerAddress();
    peer.port = port;
    peer.lastSeen = QDateTime::currentSecsSinceEpoch();
    
    m_peers[peerId] = peer;
    m_peerSockets[peerId] = socket;
    
    QJsonObject info;
    info["peerId"] = peerId;
    info["address"] = peer.address.toString();
    info["port"] = port;
    
    emit peerConnected(peerId, info);
    emit peerCountChanged(m_peers.size());
    
    qDebug() << "Peer connected:" << peerId;
}

void P2PNode::handleFindNode(QTcpSocket* socket, const QJsonObject& data)
{
    // Return list of known peers
    QJsonArray peersArray;
    for (auto it = m_peers.begin(); it != m_peers.end(); ++it) {
        QJsonObject p;
        p["peerId"] = it.value().peerId;
        p["address"] = it.value().address.toString();
        p["port"] = it.value().port;
        peersArray.append(p);
    }
    
    QJsonObject response;
    response["type"] = "nodes";
    response["peers"] = peersArray;
    sendMessage(socket, response);
}

void P2PNode::handleAnnounce(QTcpSocket* socket, const QJsonObject& data)
{
    QString contentId = data["contentId"].toString();
    QString peerId = data["peerId"].toString();
    QJsonObject metadata = data["metadata"].toObject();
    
    // Store in content index
    if (!m_contentIndex.contains(contentId)) {
        ContentMeta meta;
        meta.contentId = contentId;
        meta.name = metadata["name"].toString();
        meta.size = metadata["size"].toVariant().toULongLong();
        meta.addedAt = QDateTime::currentSecsSinceEpoch();
        m_contentIndex[contentId] = meta;
    }
    
    // Add provider
    if (!m_contentIndex[contentId].providers.contains(peerId)) {
        m_contentIndex[contentId].providers.append(peerId);
    }
    
    qDebug() << "Content announced:" << contentId << "by" << peerId;
}

void P2PNode::handleFindContent(QTcpSocket* socket, const QJsonObject& data)
{
    QString contentId = data["contentId"].toString();
    
    QJsonObject response;
    response["type"] = "content_found";
    response["contentId"] = contentId;
    
    if (m_localContent.contains(contentId)) {
        // We have this content
        QJsonArray providers;
        providers.append(m_peerId);
        response["providers"] = providers;
    } else if (m_contentIndex.contains(contentId)) {
        // We know who has it
        QJsonArray providers;
        for (const QString& p : m_contentIndex[contentId].providers) {
            providers.append(p);
        }
        response["providers"] = providers;
    } else {
        response["providers"] = QJsonArray();
    }
    
    sendMessage(socket, response);
}

void P2PNode::handleContentRequest(QTcpSocket* socket, const QJsonObject& data)
{
    if (!m_seedingEnabled) {
        QJsonObject response;
        response["type"] = "error";
        response["message"] = "Seeding disabled";
        sendMessage(socket, response);
        return;
    }
    
    QString contentId = data["contentId"].toString();
    QString fromPeer = data["peerId"].toString();
    
    emit contentRequestReceived(contentId, fromPeer);
    
    if (!m_localContent.contains(contentId)) {
        QJsonObject response;
        response["type"] = "error";
        response["message"] = "Content not found";
        sendMessage(socket, response);
        return;
    }
    
    QString filePath = m_localContent[contentId];
    QFile file(filePath);
    
    if (!file.open(QIODevice::ReadOnly)) {
        QJsonObject response;
        response["type"] = "error";
        response["message"] = "Cannot read file";
        sendMessage(socket, response);
        return;
    }
    
    QByteArray content = file.readAll();
    file.close();
    
    QJsonObject response;
    response["type"] = "content_response";
    response["contentId"] = contentId;
    response["data"] = QString::fromUtf8(content.toBase64());
    
    sendMessage(socket, response);
    
    m_bytesShared += content.size();
    emit statsChanged();
    
    // Emit seeding reward signal (1 CGT per MB shared)
    quint64 reward = (content.size() / (1024 * 1024)) * 100000000;
    if (reward > 0) {
        emit seedingReward(contentId, reward);
    }
}

QString P2PNode::hashContent(const QByteArray& data)
{
    return QCryptographicHash::hash(data, QCryptographicHash::Sha256).toHex();
}

} // namespace QOR
