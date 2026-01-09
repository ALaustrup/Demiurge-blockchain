#include "BlockchainRPC.h"
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QNetworkRequest>
#include <QUrl>
#include <QDebug>

BlockchainRPC::BlockchainRPC(const QString &rpcUrl, QObject *parent)
    : QObject(parent)
    , m_networkManager(new QNetworkAccessManager(this))
    , m_rpcUrl(rpcUrl)
    , m_requestId(1)
{
    connect(m_networkManager, &QNetworkAccessManager::finished,
            this, &BlockchainRPC::onRpcReplyFinished);
}

void BlockchainRPC::getRecursionWorld(const QString &worldId, Callback callback)
{
    QJsonArray params;
    params.append(worldId);
    
    callRPC("recursion_getWorld", params, callback);
}

void BlockchainRPC::createRecursionWorld(const QJsonObject &worldData, Callback callback)
{
    QJsonArray params;
    params.append(worldData);
    
    callRPC("recursion_createWorld", params, callback);
}

void BlockchainRPC::listWorldsByOwner(const QString &ownerAddress, Callback callback)
{
    QJsonArray params;
    params.append(ownerAddress);
    
    callRPC("recursion_listWorldsByOwner", params, callback);
}

void BlockchainRPC::subscribeToChainEvents()
{
    // TODO: Implement WebSocket subscription for real-time chain events
    // For now, use polling
    qInfo() << "Chain event subscription not yet implemented (use polling)";
}

void BlockchainRPC::callRPC(const QString &method, const QJsonValue &params, Callback callback)
{
    sendRequest(method, params, callback);
}

void BlockchainRPC::sendRequest(const QString &method, const QJsonValue &params, Callback callback)
{
    QJsonObject request;
    request["jsonrpc"] = "2.0";
    request["method"] = method;
    request["params"] = params.toArray();
    request["id"] = m_requestId++;
    
    QJsonDocument doc(request);
    QByteArray data = doc.toJson(QJsonDocument::Compact);
    
    QUrl url(m_rpcUrl);
    QNetworkRequest req(url);
    req.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
    
    QNetworkReply *reply = m_networkManager->post(req, data);
    m_pendingRequests[reply] = callback;
}

void BlockchainRPC::onRpcReplyFinished()
{
    QNetworkReply *reply = qobject_cast<QNetworkReply*>(sender());
    if (!reply) return;
    
    Callback callback = m_pendingRequests.take(reply);
    if (!callback) {
        reply->deleteLater();
        return;
    }
    
    bool success = false;
    QJsonObject result;
    
    if (reply->error() == QNetworkReply::NoError) {
        QJsonDocument doc = QJsonDocument::fromJson(reply->readAll());
        QJsonObject response = doc.object();
        
        if (response.contains("error")) {
            QJsonObject error = response["error"].toObject();
            qWarning() << "RPC Error:" << error["message"].toString();
            result = error;
        } else if (response.contains("result")) {
            success = true;
            result = response["result"].toObject();
        }
    } else {
        qWarning() << "Network error:" << reply->errorString();
        result["error"] = reply->errorString();
    }
    
    callback(success, result);
    reply->deleteLater();
}
