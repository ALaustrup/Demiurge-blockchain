/**
 * SystemTrayManager Implementation
 */

#include "SystemTrayManager.h"
#include "LauncherCore.h"

#include <QApplication>
#include <QSettings>
#include <QIcon>
#include <QDebug>

SystemTrayManager::SystemTrayManager(QObject *parent)
    : QObject(parent)
    , m_trayIcon(nullptr)
    , m_contextMenu(nullptr)
    , m_launcherCore(nullptr)
    , m_showAction(nullptr)
    , m_launchMinerAction(nullptr)
    , m_launchAbyssAction(nullptr)
    , m_separatorAction(nullptr)
    , m_quitAction(nullptr)
    , m_minimizeToTray(true)
    , m_startMinimized(false)
    , m_showNotifications(true)
{
    loadSettings();
}

SystemTrayManager::~SystemTrayManager()
{
    saveSettings();
    
    if (m_trayIcon) {
        m_trayIcon->hide();
        delete m_trayIcon;
    }
    
    if (m_contextMenu) {
        delete m_contextMenu;
    }
}

void SystemTrayManager::setLauncherCore(LauncherCore *core)
{
    m_launcherCore = core;
}

bool SystemTrayManager::isVisible() const
{
    return m_trayIcon && m_trayIcon->isVisible();
}

void SystemTrayManager::setMinimizeToTray(bool enabled)
{
    if (m_minimizeToTray != enabled) {
        m_minimizeToTray = enabled;
        saveSettings();
        emit settingsChanged();
    }
}

void SystemTrayManager::setStartMinimized(bool enabled)
{
    if (m_startMinimized != enabled) {
        m_startMinimized = enabled;
        saveSettings();
        emit settingsChanged();
    }
}

void SystemTrayManager::setShowNotifications(bool enabled)
{
    if (m_showNotifications != enabled) {
        m_showNotifications = enabled;
        saveSettings();
        emit settingsChanged();
    }
}

void SystemTrayManager::initialize()
{
    if (!QSystemTrayIcon::isSystemTrayAvailable()) {
        qWarning() << "System tray is not available on this platform";
        return;
    }
    
    // Create tray icon
    m_trayIcon = new QSystemTrayIcon(this);
    
    // Set icon - use app icon
    QIcon icon(":/icons/genesis.png");
    if (icon.isNull()) {
        // Fallback to application icon
        icon = QApplication::windowIcon();
    }
    m_trayIcon->setIcon(icon);
    
    // Set tooltip
    m_trayIcon->setToolTip("Genesis Launcher - Demiurge Ecosystem");
    
    // Create context menu
    createMenu();
    m_trayIcon->setContextMenu(m_contextMenu);
    
    // Connect signals
    connect(m_trayIcon, &QSystemTrayIcon::activated,
            this, &SystemTrayManager::onTrayActivated);
    
    // Show the icon
    m_trayIcon->show();
    emit visibilityChanged();
    
    qInfo() << "System tray initialized";
}

void SystemTrayManager::showWindow()
{
    emit showWindowRequested();
}

void SystemTrayManager::hideToTray()
{
    if (m_showNotifications && m_trayIcon) {
        m_trayIcon->showMessage(
            "Genesis Launcher",
            "Running in background. Click the tray icon to open.",
            QSystemTrayIcon::Information,
            2000
        );
    }
}

void SystemTrayManager::showNotification(const QString &title, const QString &message, 
                                          int msTimeout)
{
    if (!m_showNotifications || !m_trayIcon) {
        return;
    }
    
    m_trayIcon->showMessage(title, message, QSystemTrayIcon::Information, msTimeout);
}

void SystemTrayManager::updateIcon(const QString &state)
{
    if (!m_trayIcon) return;
    
    QString iconPath = ":/icons/genesis.png";
    
    // Could use different icons for different states
    // e.g., ":/icons/genesis_mining.png" for active mining
    
    if (state == "mining") {
        // iconPath = ":/icons/genesis_mining.png";
    } else if (state == "updating") {
        // iconPath = ":/icons/genesis_updating.png";
    } else if (state == "offline") {
        // iconPath = ":/icons/genesis_offline.png";
    }
    
    QIcon icon(iconPath);
    if (!icon.isNull()) {
        m_trayIcon->setIcon(icon);
    }
}

void SystemTrayManager::updateTooltip(const QString &text)
{
    if (m_trayIcon) {
        m_trayIcon->setToolTip(text);
    }
}

bool SystemTrayManager::isSystemTrayAvailable() const
{
    return QSystemTrayIcon::isSystemTrayAvailable();
}

void SystemTrayManager::onTrayActivated(QSystemTrayIcon::ActivationReason reason)
{
    emit trayIconActivated(static_cast<int>(reason));
    
    switch (reason) {
        case QSystemTrayIcon::Trigger:      // Single click
        case QSystemTrayIcon::DoubleClick:  // Double click
            emit showWindowRequested();
            break;
            
        case QSystemTrayIcon::MiddleClick:
            // Could toggle mining or show quick stats
            break;
            
        default:
            break;
    }
}

void SystemTrayManager::onShowWindow()
{
    emit showWindowRequested();
}

void SystemTrayManager::onLaunchMiner()
{
    emit launchMinerRequested();
    
    if (m_launcherCore) {
        m_launcherCore->launchConstruct();
    }
}

void SystemTrayManager::onLaunchAbyss()
{
    emit launchAbyssRequested();
    
    if (m_launcherCore) {
        m_launcherCore->launchAbyss();
    }
}

void SystemTrayManager::onQuit()
{
    emit quitRequested();
    QApplication::quit();
}

void SystemTrayManager::createMenu()
{
    m_contextMenu = new QMenu();
    
    // Apply dark styling to the menu
    m_contextMenu->setStyleSheet(R"(
        QMenu {
            background-color: #0A0A0A;
            border: 1px solid #303030;
            border-radius: 8px;
            padding: 8px 4px;
        }
        QMenu::item {
            background-color: transparent;
            color: #E0E0E0;
            padding: 8px 24px;
            margin: 2px 4px;
            border-radius: 4px;
        }
        QMenu::item:selected {
            background-color: #252525;
            color: #FF3D00;
        }
        QMenu::separator {
            height: 1px;
            background-color: #252525;
            margin: 6px 12px;
        }
    )");
    
    // Show Launcher
    m_showAction = new QAction("Show Genesis Launcher", this);
    m_showAction->setIcon(QIcon(":/icons/genesis.png"));
    connect(m_showAction, &QAction::triggered, this, &SystemTrayManager::onShowWindow);
    m_contextMenu->addAction(m_showAction);
    
    m_contextMenu->addSeparator();
    
    // Quick Launch options
    m_launchMinerAction = new QAction("Launch The Construct (Miner)", this);
    m_launchMinerAction->setIcon(QIcon(":/icons/construct.png"));
    connect(m_launchMinerAction, &QAction::triggered, this, &SystemTrayManager::onLaunchMiner);
    m_contextMenu->addAction(m_launchMinerAction);
    
    m_launchAbyssAction = new QAction("Enter The Abyss (Full OS)", this);
    m_launchAbyssAction->setIcon(QIcon(":/icons/abyss.png"));
    connect(m_launchAbyssAction, &QAction::triggered, this, &SystemTrayManager::onLaunchAbyss);
    m_contextMenu->addAction(m_launchAbyssAction);
    
    m_contextMenu->addSeparator();
    
    // Quit
    m_quitAction = new QAction("Quit Genesis", this);
    connect(m_quitAction, &QAction::triggered, this, &SystemTrayManager::onQuit);
    m_contextMenu->addAction(m_quitAction);
}

void SystemTrayManager::loadSettings()
{
    QSettings settings;
    
    m_minimizeToTray = settings.value("tray/minimizeToTray", true).toBool();
    m_startMinimized = settings.value("tray/startMinimized", false).toBool();
    m_showNotifications = settings.value("tray/showNotifications", true).toBool();
}

void SystemTrayManager::saveSettings()
{
    QSettings settings;
    
    settings.setValue("tray/minimizeToTray", m_minimizeToTray);
    settings.setValue("tray/startMinimized", m_startMinimized);
    settings.setValue("tray/showNotifications", m_showNotifications);
    settings.sync();
}
