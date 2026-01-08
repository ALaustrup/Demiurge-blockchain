/**
 * QØЯ Chain Client Implementation
 */

#include "ChainClient.h"
#include "../storage/LocalDatabase.h"

#include <QNetworkReply>
#include <QJsonDocument>
#include <QTimer>
#include <QDebug>

namespace QOR {

ChainClient::ChainClient(QObject *parent)
    : QObject(parent)
    , m_networkManager(new QNetworkAccessManager(this))
    , m_database(nullptr)
    , m_endpoint("https://rpc.demiurge.cloud")
    , m_connected(false)
    , m_lastBlockHeight(0)
    , m_requestId(0)
    , m_pollTimer(nullptr)
{
}

ChainClient::~ChainClient()
{
    stopBlockPolling();
}

void ChainClient::setDatabase(LocalDatabase *db)
{
    m_database = db;
}

void ChainClient::setEndpoint(const QString &endpoint)
{
    m_endpoint = endpoint;
}

void ChainClient::connectToChain()
{
    healthCheck([this](bool success, const QJsonObject &result) {
        bool wasConnected = m_connected;
        m_connected = success;
        
        if (m_connected != wasConnected) {
            emit connectionChanged(m_connected);
        }
        
        if (m_connected) {
            qInfo() << "Connected to chain:" << m_endpoint;
            
            // Get initial chain info
            getChainInfo([](bool, const QJsonObject &info) {
                qInfo() << "Chain info:" << info;
            });
        } else {
            qWarning() << "Failed to connect to chain";
        }
    });
}

void ChainClient::disconnect()
{
    stopBlockPolling();
    m_connected = false;
    emit connectionChanged(false);
}

// ========== Account Operations ==========

void ChainClient::getBalance(const QString &address, Callback callback)
{
    // Check cache first
    if (m_database) {
        QJsonObject cached = m_database->getCachedChainState("balance_" + address);
        if (!cached.isEmpty()) {
            callback(true, cached);
            // Still fetch fresh data in background
        }
    }
    
    rpcCall("bank_getBalance", QJsonArray{address}, [this, address, callback](bool success, const QJsonObject &result) {
        if (success && m_database) {
            // Cache the result
            m_database->cacheChainState("balance_" + address, result, 60);
            m_database->updateCachedBalance(address, result["balance"].toString());
        }
        callback(success, result);
    });
}

void ChainClient::getNonce(const QString &address, Callback callback)
{
    rpcCall("system_getNonce", QJsonArray{address}, callback);
}

void ChainClient::getAccountState(const QString &address, Callback callback)
{
    rpcCall("system_getAccount", QJsonArray{address}, [this, address, callback](bool success, const QJsonObject &result) {
        if (success && m_database) {
            m_database->saveAccount(address, result);
        }
        callback(success, result);
    });
}

// ========== Transaction Operations ==========

void ChainClient::submitTransaction(const QByteArray &signedTx, Callback callback)
{
    QString hexTx = QString::fromLatin1(signedTx.toHex());
    rpcCall("author_submitExtrinsic", QJsonArray{hexTx}, callback);
}

void ChainClient::getTransactionStatus(const QString &txHash, Callback callback)
{
    rpcCall("author_getTransactionStatus", QJsonArray{txHash}, callback);
}

void ChainClient::getTransactionReceipt(const QString &txHash, Callback callback)
{
    rpcCall("system_getTransactionReceipt", QJsonArray{txHash}, callback);
}

// ========== Block Operations ==========

void ChainClient::getBlockHeight(Callback callback)
{
    rpcCall("chain_getHeader", QJsonArray{}, [callback](bool success, const QJsonObject &result) {
        if (success && result.contains("number")) {
            QJsonObject heightResult;
            heightResult["height"] = result["number"].toString().toLongLong(nullptr, 16);
            callback(true, heightResult);
        } else {
            callback(success, result);
        }
    });
}

void ChainClient::getBlock(qint64 height, Callback callback)
{
    QString hexHeight = QString("0x%1").arg(height, 0, 16);
    rpcCall("chain_getBlockHash", QJsonArray{hexHeight}, [this, callback](bool success, const QJsonObject &result) {
        if (success && result.contains("result")) {
            QString blockHash = result["result"].toString();
            rpcCall("chain_getBlock", QJsonArray{blockHash}, callback);
        } else {
            callback(success, result);
        }
    });
}

void ChainClient::getLatestBlock(Callback callback)
{
    rpcCall("chain_getBlock", QJsonArray{}, callback);
}

// ========== NFT Operations ==========

void ChainClient::getNFTs(const QString &address, Callback callback)
{
    rpcCall("nft_getOwned", QJsonArray{address}, callback);
}

void ChainClient::getNFTMetadata(const QString &tokenId, Callback callback)
{
    rpcCall("nft_getMetadata", QJsonArray{tokenId}, callback);
}

// ========== Chain State ==========

void ChainClient::getChainInfo(Callback callback)
{
    rpcCall("system_chain", QJsonArray{}, [this, callback](bool success, const QJsonObject &chainResult) {
        if (!success) {
            callback(false, chainResult);
            return;
        }
        
        rpcCall("system_version", QJsonArray{}, [chainResult, callback](bool success, const QJsonObject &versionResult) {
            QJsonObject combined;
            combined["chain"] = chainResult["result"];
            combined["version"] = versionResult["result"];
            callback(success, combined);
        });
    });
}

void ChainClient::healthCheck(Callback callback)
{
    rpcCall("system_health", QJsonArray{}, callback);
}

// ========== Block Polling ==========

void ChainClient::startBlockPolling(int intervalMs)
{
    if (m_pollTimer) {
        return;
    }
    
    m_pollTimer = new QTimer(this);
    connect(m_pollTimer, &QTimer::timeout, this, &ChainClient::pollBlock);
    m_pollTimer->start(intervalMs);
    
    // Poll immediately
    pollBlock();
}

void ChainClient::stopBlockPolling()
{
    if (m_pollTimer) {
        m_pollTimer->stop();
        delete m_pollTimer;
        m_pollTimer = nullptr;
    }
}

void ChainClient::pollBlock()
{
    getBlockHeight([this](bool success, const QJsonObject &result) {
        if (success && result.contains("height")) {
            qint64 height = result["height"].toVariant().toLongLong();
            
            if (height > m_lastBlockHeight) {
                m_lastBlockHeight = height;
                
                // Get full block
                getLatestBlock([this, height](bool success, const QJsonObject &block) {
                    if (success) {
                        emit newBlock(height, block);
                    }
                });
            }
        }
    });
}

// ========== RPC ==========

void ChainClient::rpcCall(const QString &method, const QJsonArray &params, Callback callback)
{
    QJsonObject request;
    request["jsonrpc"] = "2.0";
    request["id"] = ++m_requestId;
    request["method"] = method;
    request["params"] = params;
    
    QNetworkRequest netRequest(QUrl(m_endpoint));
    netRequest.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
    
    QNetworkReply *reply = m_networkManager->post(netRequest, 
        QJsonDocument(request).toJson(QJsonDocument::Compact));
    
    connect(reply, &QNetworkReply::finished, [this, reply, callback]() {
        handleResponse(reply, callback);
    });
}

void ChainClient::handleResponse(QNetworkReply *reply, Callback callback)
{
    reply->deleteLater();
    
    if (reply->error() != QNetworkReply::NoError) {
        QString errorMsg = reply->errorString();
        qWarning() << "RPC error:" << errorMsg;
        emit error(errorMsg);
        callback(false, QJsonObject{{"error", errorMsg}});
        return;
    }
    
    QByteArray data = reply->readAll();
    QJsonParseError parseError;
    QJsonDocument doc = QJsonDocument::fromJson(data, &parseError);
    
    if (parseError.error != QJsonParseError::NoError) {
        QString errorMsg = parseError.errorString();
        qWarning() << "JSON parse error:" << errorMsg;
        emit error(errorMsg);
        callback(false, QJsonObject{{"error", errorMsg}});
        return;
    }
    
    QJsonObject response = doc.object();
    
    if (response.contains("error")) {
        QJsonObject err = response["error"].toObject();
        QString errorMsg = err["message"].toString();
        qWarning() << "RPC error response:" << errorMsg;
        emit error(errorMsg);
        callback(false, err);
        return;
    }
    
    callback(true, response);
}

} // namespace QOR
