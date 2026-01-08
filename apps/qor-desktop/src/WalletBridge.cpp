/**
 * WalletBridge Implementation
 */

#include "WalletBridge.h"
#include "AbyssIDManager.h"

#include <QNetworkAccessManager>
#include <QNetworkRequest>
#include <QNetworkReply>
#include <QJsonDocument>
#include <QJsonObject>
#include <QTimer>

WalletBridge::WalletBridge(AbyssIDManager *abyssId, QObject *parent)
    : QObject(parent)
    , m_abyssIdManager(abyssId)
    , m_networkManager(new QNetworkAccessManager(this))
{
    // Start polling chain status
    QTimer *pollTimer = new QTimer(this);
    connect(pollTimer, &QTimer::timeout, this, &WalletBridge::pollChainStatus);
    pollTimer->start(10000); // Poll every 10 seconds
    
    // Initial connection
    connectToChain();
}

WalletBridge::~WalletBridge()
{
}

void WalletBridge::connectToChain()
{
    pollChainStatus();
}

void WalletBridge::pollChainStatus()
{
    QNetworkRequest request(QUrl(m_rpcUrl));
    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
    
    QJsonObject payload;
    payload["jsonrpc"] = "2.0";
    payload["method"] = "cgt_getChainInfo";
    payload["params"] = QJsonObject();
    payload["id"] = 1;
    
    QNetworkReply *reply = m_networkManager->post(
        request, 
        QJsonDocument(payload).toJson()
    );
    
    connect(reply, &QNetworkReply::finished, [this, reply]() {
        reply->deleteLater();
        
        if (reply->error() != QNetworkReply::NoError) {
            if (m_connected) {
                m_connected = false;
                emit connectionChanged(false);
            }
            return;
        }
        
        QJsonDocument doc = QJsonDocument::fromJson(reply->readAll());
        QJsonObject result = doc.object()["result"].toObject();
        
        bool wasConnected = m_connected;
        m_connected = true;
        
        int newHeight = result["height"].toInt();
        if (newHeight != m_blockHeight) {
            m_blockHeight = newHeight;
            emit blockHeightChanged(m_blockHeight);
        }
        
        if (!wasConnected) {
            emit connectionChanged(true);
        }
    });
}

QVariantMap WalletBridge::getChainStatus()
{
    QVariantMap status;
    status["connected"] = m_connected;
    status["blockHeight"] = m_blockHeight;
    status["rpcUrl"] = m_rpcUrl;
    return status;
}

QString WalletBridge::getBalance(const QString &address)
{
    // Synchronous balance check - in production, make async
    QNetworkRequest request(QUrl(m_rpcUrl));
    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
    
    QJsonObject params;
    params["address"] = address;
    
    QJsonObject payload;
    payload["jsonrpc"] = "2.0";
    payload["method"] = "cgt_getBalance";
    payload["params"] = params;
    payload["id"] = 1;
    
    QNetworkReply *reply = m_networkManager->post(
        request, 
        QJsonDocument(payload).toJson()
    );
    
    // Wait for reply (not ideal for production)
    QEventLoop loop;
    connect(reply, &QNetworkReply::finished, &loop, &QEventLoop::quit);
    loop.exec();
    
    reply->deleteLater();
    
    if (reply->error() != QNetworkReply::NoError) {
        return "0";
    }
    
    QJsonDocument doc = QJsonDocument::fromJson(reply->readAll());
    QString balance = doc.object()["result"].toObject()["balance"].toString();
    
    emit balanceUpdated(address, balance);
    return balance;
}

QString WalletBridge::sendTransaction(const QString &to, const QString &amount)
{
    // Transaction sending would be implemented here
    // This requires proper transaction building and signing
    Q_UNUSED(to)
    Q_UNUSED(amount)
    return QString();
}
