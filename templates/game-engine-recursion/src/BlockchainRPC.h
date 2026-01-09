/**
 * BlockchainRPC - RPC client for Demiurge blockchain operations
 */

#ifndef BLOCKCHAIN_RPC_H
#define BLOCKCHAIN_RPC_H

#include <QObject>
#include <QNetworkAccessManager>
#include <QNetworkReply>
#include <QJsonObject>
#include <QString>
#include <functional>

class BlockchainRPC : public QObject
{
    Q_OBJECT

public:
    using Callback = std::function<void(bool success, const QJsonObject &result)>;
    
    explicit BlockchainRPC(const QString &rpcUrl, QObject *parent = nullptr);
    
    // Recursion World operations
    void getRecursionWorld(const QString &worldId, Callback callback);
    void createRecursionWorld(const QJsonObject &worldData, Callback callback);
    void listWorldsByOwner(const QString &ownerAddress, Callback callback);
    
    // Chain event subscription
    void subscribeToChainEvents();
    
    // Generic RPC call
    void callRPC(const QString &method, const QJsonValue &params, Callback callback);

signals:
    void chainEventReceived(const QString &eventType, const QJsonObject &eventData);
    void connectionChanged(bool connected);

private slots:
    void onRpcReplyFinished();

private:
    void sendRequest(const QString &method, const QJsonValue &params, Callback callback);
    
    QNetworkAccessManager *m_networkManager;
    QString m_rpcUrl;
    QMap<QNetworkReply*, Callback> m_pendingRequests;
    int m_requestId;
};

#endif // BLOCKCHAIN_RPC_H
