/**
 * SystemTrayManager - System Tray Integration
 * 
 * Manages the system tray icon, context menu, and background mode
 * for the Genesis Launcher.
 * 
 * Features:
 * - Minimize to tray instead of closing
 * - Quick launch menu (Miner, Full OS)
 * - Status notifications
 * - Single instance management
 */

#ifndef GENESIS_SYSTEM_TRAY_MANAGER_H
#define GENESIS_SYSTEM_TRAY_MANAGER_H

#include <QObject>
#include <QSystemTrayIcon>
#include <QMenu>
#include <QAction>

class LauncherCore;

class SystemTrayManager : public QObject
{
    Q_OBJECT
    
    Q_PROPERTY(bool isVisible READ isVisible NOTIFY visibilityChanged)
    Q_PROPERTY(bool minimizeToTray READ minimizeToTray WRITE setMinimizeToTray NOTIFY settingsChanged)
    Q_PROPERTY(bool startMinimized READ startMinimized WRITE setStartMinimized NOTIFY settingsChanged)
    Q_PROPERTY(bool showNotifications READ showNotifications WRITE setShowNotifications NOTIFY settingsChanged)

public:
    explicit SystemTrayManager(QObject *parent = nullptr);
    ~SystemTrayManager();
    
    void setLauncherCore(LauncherCore *core);
    
    bool isVisible() const;
    bool minimizeToTray() const { return m_minimizeToTray; }
    bool startMinimized() const { return m_startMinimized; }
    bool showNotifications() const { return m_showNotifications; }
    
    void setMinimizeToTray(bool enabled);
    void setStartMinimized(bool enabled);
    void setShowNotifications(bool enabled);

public slots:
    /**
     * Initialize and show the tray icon
     */
    Q_INVOKABLE void initialize();
    
    /**
     * Show the main window
     */
    Q_INVOKABLE void showWindow();
    
    /**
     * Hide to system tray
     */
    Q_INVOKABLE void hideToTray();
    
    /**
     * Show a notification
     */
    Q_INVOKABLE void showNotification(const QString &title, const QString &message, 
                                       int msTimeout = 3000);
    
    /**
     * Update tray icon based on state
     */
    Q_INVOKABLE void updateIcon(const QString &state = "default");
    
    /**
     * Update tooltip text
     */
    Q_INVOKABLE void updateTooltip(const QString &text);
    
    /**
     * Check if system tray is available
     */
    Q_INVOKABLE bool isSystemTrayAvailable() const;

signals:
    void visibilityChanged();
    void settingsChanged();
    
    void showWindowRequested();
    void quitRequested();
    void launchMinerRequested();
    void launchAbyssRequested();
    
    void trayIconActivated(int reason);

private slots:
    void onTrayActivated(QSystemTrayIcon::ActivationReason reason);
    void onShowWindow();
    void onLaunchMiner();
    void onLaunchAbyss();
    void onQuit();

private:
    void createMenu();
    void loadSettings();
    void saveSettings();
    
    QSystemTrayIcon *m_trayIcon;
    QMenu *m_contextMenu;
    LauncherCore *m_launcherCore;
    
    // Menu actions
    QAction *m_showAction;
    QAction *m_launchMinerAction;
    QAction *m_launchAbyssAction;
    QAction *m_separatorAction;
    QAction *m_quitAction;
    
    // Settings
    bool m_minimizeToTray;
    bool m_startMinimized;
    bool m_showNotifications;
};

#endif // GENESIS_SYSTEM_TRAY_MANAGER_H
