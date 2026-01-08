/**
 * QØЯ Wallet Manager
 * 
 * Manages CGT wallet operations and chain integration.
 */

#ifndef QOR_WALLET_MANAGER_H
#define QOR_WALLET_MANAGER_H

#include <QObject>
#include <QString>
#include <QVariantMap>

class AbyssIDManager;

namespace QOR {

/**
 * WalletManager - CGT wallet operations
 * 
 * Provides:
 * - Balance queries
 * - Transaction history
 * - Send/receive CGT
 * - Staking operations
 */
class WalletManager : public QObject
{
    Q_OBJECT
    Q_PROPERTY(QString address READ address NOTIFY addressChanged)
    Q_PROPERTY(QString balance READ balance NOTIFY balanceChanged)
    Q_PROPERTY(bool isLoading READ isLoading NOTIFY loadingChanged)

public:
    explicit WalletManager(AbyssIDManager *abyssId, QObject *parent = nullptr);
    ~WalletManager() = default;

    QString address() const { return m_address; }
    QString balance() const { return m_balance; }
    bool isLoading() const { return m_isLoading; }

public slots:
    /**
     * Refresh balance and transaction history
     */
    void refresh();
    
    /**
     * Send CGT to recipient
     * @param recipient Target address
     * @param amount Amount in CGT
     * @return Transaction hash or empty on failure
     */
    QString sendCGT(const QString &recipient, const QString &amount);
    
    /**
     * Get transaction history
     * @return List of transactions
     */
    QVariantList getTransactionHistory();
    
    /**
     * Stake CGT
     * @param amount Amount to stake
     * @return true on success
     */
    bool stakeCGT(const QString &amount);
    
    /**
     * Unstake CGT
     * @param amount Amount to unstake
     * @return true on success
     */
    bool unstakeCGT(const QString &amount);

signals:
    void addressChanged();
    void balanceChanged();
    void loadingChanged();
    void transactionSent(const QString &txHash);
    void error(const QString &message);

private:
    AbyssIDManager *m_abyssId;
    QString m_address;
    QString m_balance;
    bool m_isLoading;
};

} // namespace QOR

#endif // QOR_WALLET_MANAGER_H
