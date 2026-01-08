/**
 * WalletBridge - Native Wallet Integration
 * 
 * Bridges between the web app and native wallet functionality.
 */

#ifndef WALLETBRIDGE_H
#define WALLETBRIDGE_H

#include <QObject>
#include <QVariantMap>

class AbyssIDManager;
class QNetworkAccessManager;

class WalletBridge : public QObject
{
    Q_OBJECT
    Q_PROPERTY(bool connected READ isConnected NOTIFY connectionChanged)
    Q_PROPERTY(int blockHeight READ blockHeight NOTIFY blockHeightChanged)

public:
    explicit WalletBridge(AbyssIDManager *abyssId, QObject *parent = nullptr);
    ~WalletBridge();

    // Chain status
    Q_INVOKABLE QVariantMap getChainStatus();
    Q_INVOKABLE bool isConnected() const { return m_connected; }
    Q_INVOKABLE int blockHeight() const { return m_blockHeight; }
    
    // Balance
    Q_INVOKABLE QString getBalance(const QString &address);
    
    // Transactions
    Q_INVOKABLE QString sendTransaction(const QString &to, const QString &amount);

signals:
    void connectionChanged(bool connected);
    void blockHeightChanged(int height);
    void balanceUpdated(const QString &address, const QString &balance);

private slots:
    void pollChainStatus();

private:
    void connectToChain();
    
    AbyssIDManager *m_abyssIdManager;
    QNetworkAccessManager *m_networkManager;
    
    QString m_rpcUrl = "https://rpc.demiurge.cloud/rpc";
    bool m_connected = false;
    int m_blockHeight = 0;
};

#endif // WALLETBRIDGE_H
