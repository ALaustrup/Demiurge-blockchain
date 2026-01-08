/**
 * MinerDaemon Implementation
 */

#include "MinerDaemon.h"

#include <QApplication>
#include <QRandomGenerator>
#include <QDebug>

MinerDaemon::MinerDaemon(QObject *parent)
    : QObject(parent)
    , m_trayIcon(nullptr)
    , m_trayMenu(nullptr)
    , m_statsTimer(new QTimer(this))
    , m_isMining(false)
    , m_hashRate(0.0)
    , m_sharesSubmitted(0)
    , m_totalEarnings(0.0)
{
    // Update stats every second when mining
    connect(m_statsTimer, &QTimer::timeout, this, &MinerDaemon::updateStats);
}

MinerDaemon::~MinerDaemon()
{
    stopMining();
}

void MinerDaemon::showTray()
{
    if (m_trayIcon) return;
    
    m_trayIcon = new QSystemTrayIcon(this);
    m_trayIcon->setIcon(QIcon(":/icons/construct.png"));
    m_trayIcon->setToolTip("Demiurge Miner - Idle");
    
    setupTrayMenu();
    
    connect(m_trayIcon, &QSystemTrayIcon::activated,
            this, &MinerDaemon::onTrayActivated);
    
    m_trayIcon->show();
    
    m_trayIcon->showMessage("Demiurge Miner",
        "The Construct is ready. Click to start mining.",
        QSystemTrayIcon::Information, 3000);
}

void MinerDaemon::onAuthenticated(const QString &token)
{
    m_sessionToken = token;
    qInfo() << "Miner authenticated via Genesis Launcher";
    
    if (m_trayIcon) {
        m_trayIcon->showMessage("Authenticated",
            "Connected to Demiurge network",
            QSystemTrayIcon::Information, 2000);
    }
}

void MinerDaemon::startMining()
{
    if (m_isMining) return;
    
    qInfo() << "Starting mining...";
    m_isMining = true;
    m_statsTimer->start(1000);
    
    if (m_trayIcon) {
        m_trayIcon->setToolTip("Demiurge Miner - Mining...");
    }
    
    emit miningStarted();
    
    // Update menu
    setupTrayMenu();
}

void MinerDaemon::stopMining()
{
    if (!m_isMining) return;
    
    qInfo() << "Stopping mining...";
    m_isMining = false;
    m_statsTimer->stop();
    
    if (m_trayIcon) {
        m_trayIcon->setToolTip("Demiurge Miner - Idle");
    }
    
    emit miningStopped();
    
    // Update menu
    setupTrayMenu();
}

void MinerDaemon::toggleMining()
{
    if (m_isMining) {
        stopMining();
    } else {
        startMining();
    }
}

void MinerDaemon::updateStats()
{
    // Simulate mining stats (replace with actual mining logic)
    if (m_isMining) {
        // Fluctuating hash rate
        m_hashRate = 1500.0 + (QRandomGenerator::global()->bounded(500));
        
        // Occasional share
        if (QRandomGenerator::global()->bounded(10) == 0) {
            m_sharesSubmitted++;
            m_totalEarnings += 0.001;  // Demo earnings
        }
        
        QString tooltip = QString("Demiurge Miner\n"
            "Hash Rate: %1 H/s\n"
            "Shares: %2\n"
            "Earnings: %3 CGT")
            .arg(m_hashRate, 0, 'f', 0)
            .arg(m_sharesSubmitted)
            .arg(m_totalEarnings, 0, 'f', 4);
        
        if (m_trayIcon) {
            m_trayIcon->setToolTip(tooltip);
        }
        
        emit statsUpdated(m_hashRate, m_sharesSubmitted, m_totalEarnings);
    }
}

void MinerDaemon::onTrayActivated(QSystemTrayIcon::ActivationReason reason)
{
    switch (reason) {
    case QSystemTrayIcon::DoubleClick:
        showDashboard();
        break;
    case QSystemTrayIcon::Trigger:
        // Show context menu on single click (default behavior)
        break;
    default:
        break;
    }
}

void MinerDaemon::showDashboard()
{
    // TODO: Show a mini dashboard window
    qInfo() << "Dashboard requested";
}

void MinerDaemon::setupTrayMenu()
{
    if (m_trayMenu) {
        delete m_trayMenu;
    }
    
    m_trayMenu = new QMenu();
    
    // Status header
    QAction *statusAction = m_trayMenu->addAction(
        m_isMining ? "⚡ Mining Active" : "⏸ Mining Paused");
    statusAction->setEnabled(false);
    
    m_trayMenu->addSeparator();
    
    // Toggle mining
    QAction *toggleAction = m_trayMenu->addAction(
        m_isMining ? "Stop Mining" : "Start Mining");
    connect(toggleAction, &QAction::triggered, this, &MinerDaemon::toggleMining);
    
    // Dashboard
    QAction *dashboardAction = m_trayMenu->addAction("Open Dashboard");
    connect(dashboardAction, &QAction::triggered, this, &MinerDaemon::showDashboard);
    
    m_trayMenu->addSeparator();
    
    // Stats (if mining)
    if (m_isMining) {
        QAction *hashAction = m_trayMenu->addAction(
            QString("Hash Rate: %1 H/s").arg(m_hashRate, 0, 'f', 0));
        hashAction->setEnabled(false);
        
        QAction *earningsAction = m_trayMenu->addAction(
            QString("Earnings: %1 CGT").arg(m_totalEarnings, 0, 'f', 4));
        earningsAction->setEnabled(false);
        
        m_trayMenu->addSeparator();
    }
    
    // Exit
    QAction *exitAction = m_trayMenu->addAction("Exit");
    connect(exitAction, &QAction::triggered, qApp, &QApplication::quit);
    
    m_trayIcon->setContextMenu(m_trayMenu);
}
