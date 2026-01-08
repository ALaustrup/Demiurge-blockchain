/**
 * MinerDaemon - Mining Process Controller
 */

#ifndef MINER_DAEMON_H
#define MINER_DAEMON_H

#include <QObject>
#include <QSystemTrayIcon>
#include <QMenu>
#include <QTimer>

class MinerDaemon : public QObject
{
    Q_OBJECT

public:
    explicit MinerDaemon(QObject *parent = nullptr);
    ~MinerDaemon();
    
    void showTray();

public slots:
    void onAuthenticated(const QString &token);
    void startMining();
    void stopMining();
    void toggleMining();

signals:
    void miningStarted();
    void miningStopped();
    void statsUpdated(double hashRate, quint64 shares, double earnings);

private slots:
    void updateStats();
    void onTrayActivated(QSystemTrayIcon::ActivationReason reason);
    void showDashboard();

private:
    void setupTrayMenu();
    
    QSystemTrayIcon *m_trayIcon;
    QMenu *m_trayMenu;
    QTimer *m_statsTimer;
    
    bool m_isMining;
    double m_hashRate;
    quint64 m_sharesSubmitted;
    double m_totalEarnings;
    QString m_sessionToken;
};

#endif // MINER_DAEMON_H
