#include "BlockchainTorrentBridge.h"
#include <QNetworkRequest>
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QTimer>
#include <QDebug>

BlockchainTorrentBridge::BlockchainTorrentBridge(QObject *parent)
    : QObject(parent)
    , m_networkManager(new QNetworkAccessManager(this))
    , m_rpcUrl("https://rpc.demiurge.cloud/rpc")
    , m_isConnected(false)
    , m_requestId(1)
{
    connect(m_networkManager, &QNetworkAccessManager::finished,
            this, &BlockchainTorrentBridge::onRpcReplyFinished);
    
    // Test connection on startup
    QTimer::singleShot(1000, this, &BlockchainTorrentBridge::testConnection);
    
    // Periodic connection check
    QTimer *checkTimer = new QTimer(this);
    checkTimer->setInterval(30000); // Check every 30 seconds
    connect(checkTimer, &QTimer::timeout, this, &BlockchainTorrentBridge::checkConnection);
    checkTimer->start();
}

BlockchainTorrentBridge::~BlockchainTorrentBridge()
{
}

void BlockchainTorrentBridge::setRpcUrl(const QString &url)
{
    if (m_rpcUrl != url) {
        m_rpcUrl = url;
        emit rpcUrlChanged();
        testConnection();
    }
}

void BlockchainTorrentBridge::registerTorrent(const QString &infoHash, const QString &name,
                                              const QString &description, const QVariantMap &metadata)
{
    QJsonObject params;
    params["module"] = "torrent_registry";
    params["method"] = "register_torrent";
    params["info_hash"] = infoHash;
    params["name"] = name;
    if (!description.isEmpty()) {
        params["description"] = description;
    }
    if (!metadata.isEmpty()) {
        params["metadata"] = QJsonObject::fromVariantMap(metadata);
    }
    
    callRPC("call_module", params, [this, infoHash](const QJsonObject &response) {
        if (response.contains("result")) {
            QString txHash = response["result"].toObject()["tx_hash"].toString();
            emit torrentRegistered(infoHash, txHash);
            qDebug() << "[TORRNT] Torrent registered on-chain:" << infoHash << "->" << txHash;
        } else if (response.contains("error")) {
            QString error = response["error"].toObject()["message"].toString();
            emit errorOccurred(QString("Failed to register torrent: %1").arg(error));
        }
    });
}

QVariantList BlockchainTorrentBridge::searchTorrents(const QString &query)
{
    QVariantList results;
    
    QJsonObject params;
    params["module"] = "torrent_registry";
    params["method"] = "search_torrents";
    params["query"] = query;
    
    // Synchronous call for search (in real implementation, use async)
    QJsonObject request;
    request["jsonrpc"] = "2.0";
    request["id"] = m_requestId++;
    request["method"] = "call_module";
    request["params"] = params;
    
    QNetworkRequest req(QUrl(m_rpcUrl));
    req.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
    
    QJsonDocument doc(request);
    QByteArray data = doc.toJson(QJsonDocument::Compact);
    
    QNetworkReply *reply = m_networkManager->post(req, data);
    
    // Wait for reply (simplified - should use async in production)
    QEventLoop loop;
    connect(reply, &QNetworkReply::finished, &loop, &QEventLoop::quit);
    loop.exec();
    
    if (reply->error() == QNetworkReply::NoError) {
        QJsonDocument responseDoc = QJsonDocument::fromJson(reply->readAll());
        QJsonObject response = responseDoc.object();
        
        if (response.contains("result")) {
            QJsonArray torrents = response["result"].toObject()["torrents"].toArray();
            for (const QJsonValue &value : torrents) {
                QJsonObject torrent = value.toObject();
                QVariantMap map;
                map["infoHash"] = torrent["info_hash"].toString();
                map["name"] = torrent["name"].toString();
                map["description"] = torrent["description"].toString();
                map["magnetUri"] = torrent["magnet_uri"].toString();
                map["registeredBy"] = torrent["registered_by"].toString();
                map["registeredAt"] = torrent["registered_at"].toString();
                map["seeders"] = torrent["seeders"].toInt();
                map["leechers"] = torrent["leechers"].toInt();
                results.append(map);
            }
        }
    }
    
    reply->deleteLater();
    return results;
}

QVariantMap BlockchainTorrentBridge::getTorrentMetadata(const QString &infoHash)
{
    QVariantMap metadata;
    
    QJsonObject params;
    params["module"] = "torrent_registry";
    params["method"] = "get_torrent";
    params["info_hash"] = infoHash;
    
    QJsonObject request;
    request["jsonrpc"] = "2.0";
    request["id"] = m_requestId++;
    request["method"] = "call_module";
    request["params"] = params;
    
    QNetworkRequest req(QUrl(m_rpcUrl));
    req.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
    
    QJsonDocument doc(request);
    QByteArray data = doc.toJson(QJsonDocument::Compact);
    
    QNetworkReply *reply = m_networkManager->post(req, data);
    
    QEventLoop loop;
    connect(reply, &QNetworkReply::finished, &loop, &QEventLoop::quit);
    loop.exec();
    
    if (reply->error() == QNetworkReply::NoError) {
        QJsonDocument responseDoc = QJsonDocument::fromJson(reply->readAll());
        QJsonObject response = responseDoc.object();
        
        if (response.contains("result")) {
            QJsonObject torrent = response["result"].toObject()["torrent"].toObject();
            metadata["infoHash"] = torrent["info_hash"].toString();
            metadata["name"] = torrent["name"].toString();
            metadata["description"] = torrent["description"].toString();
            metadata["magnetUri"] = torrent["magnet_uri"].toString();
            metadata["registeredBy"] = torrent["registered_by"].toString();
            metadata["registeredAt"] = torrent["registered_at"].toString();
            metadata["seeders"] = torrent["seeders"].toInt();
            metadata["leechers"] = torrent["leechers"].toInt();
        }
    }
    
    reply->deleteLater();
    return metadata;
}

void BlockchainTorrentBridge::reportPeerActivity(const QString &infoHash, const QString &peerId,
                                                 qint64 bytesUploaded, qint64 bytesDownloaded)
{
    QJsonObject params;
    params["module"] = "torrent_registry";
    params["method"] = "report_peer_activity";
    params["info_hash"] = infoHash;
    params["peer_id"] = peerId;
    params["bytes_uploaded"] = static_cast<qint64>(bytesUploaded);
    params["bytes_downloaded"] = static_cast<qint64>(bytesDownloaded);
    
    callRPC("call_module", params, [](const QJsonObject &response) {
        // Activity reported (fire and forget)
        Q_UNUSED(response)
    });
}

int BlockchainTorrentBridge::getPeerReputation(const QString &peerId)
{
    QJsonObject params;
    params["module"] = "torrent_registry";
    params["method"] = "get_peer_reputation";
    params["peer_id"] = peerId;
    
    int reputation = 0;
    
    QJsonObject request;
    request["jsonrpc"] = "2.0";
    request["id"] = m_requestId++;
    request["method"] = "call_module";
    request["params"] = params;
    
    QNetworkRequest req(QUrl(m_rpcUrl));
    req.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
    
    QJsonDocument doc(request);
    QByteArray data = doc.toJson(QJsonDocument::Compact);
    
    QNetworkReply *reply = m_networkManager->post(req, data);
    
    QEventLoop loop;
    connect(reply, &QNetworkReply::finished, &loop, &QEventLoop::quit);
    loop.exec();
    
    if (reply->error() == QNetworkReply::NoError) {
        QJsonDocument responseDoc = QJsonDocument::fromJson(reply->readAll());
        QJsonObject response = responseDoc.object();
        
        if (response.contains("result")) {
            reputation = response["result"].toObject()["reputation"].toInt();
        }
    }
    
    reply->deleteLater();
    return reputation;
}

void BlockchainTorrentBridge::callRPC(const QString &method, const QJsonObject &params,
                                      std::function<void(const QJsonObject&)> callback)
{
    QJsonObject request;
    request["jsonrpc"] = "2.0";
    request["id"] = m_requestId++;
    request["method"] = method;
    request["params"] = params;
    
    QNetworkRequest req(QUrl(m_rpcUrl));
    req.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
    
    QJsonDocument doc(request);
    QByteArray data = doc.toJson(QJsonDocument::Compact);
    
    QNetworkReply *reply = m_networkManager->post(req, data);
    m_pendingRequests[reply] = callback;
}

void BlockchainTorrentBridge::onRpcReplyFinished()
{
    QNetworkReply *reply = qobject_cast<QNetworkReply*>(sender());
    if (!reply || !m_pendingRequests.contains(reply)) {
        return;
    }
    
    auto callback = m_pendingRequests.take(reply);
    
    if (reply->error() == QNetworkReply::NoError) {
        QJsonDocument doc = QJsonDocument::fromJson(reply->readAll());
        callback(doc.object());
    } else {
        emit errorOccurred(reply->errorString());
    }
    
    reply->deleteLater();
}

void BlockchainTorrentBridge::testConnection()
{
    QJsonObject params;
    params["module"] = "system";
    params["method"] = "health";
    
    callRPC("call_module", params, [this](const QJsonObject &response) {
        bool wasConnected = m_isConnected;
        m_isConnected = response.contains("result");
        
        if (wasConnected != m_isConnected) {
            emit connectionChanged();
        }
    });
}

void BlockchainTorrentBridge::checkConnection()
{
    testConnection();
}
