/**
 * SystemTray Implementation
 */

#include "SystemTray.h"
#include "MainWindow.h"

#include <QMenu>
#include <QAction>
#include <QApplication>

SystemTray::SystemTray(MainWindow *mainWindow)
    : QSystemTrayIcon(mainWindow)
    , m_mainWindow(mainWindow)
{
    // Set icon
    setIcon(QIcon(":/icons/app.png"));
    setToolTip(tr("Abyss Explorer"));
    
    // Create context menu
    setContextMenu(createContextMenu());
    
    // Connect activation signal
    connect(this, &QSystemTrayIcon::activated,
            this, &SystemTray::onActivated);
    
    // Show tray icon
    show();
}

QMenu* SystemTray::createContextMenu()
{
    QMenu *menu = new QMenu();
    
    QAction *showAction = menu->addAction(tr("&Show Abyss Explorer"));
    connect(showAction, &QAction::triggered, [this]() {
        m_mainWindow->show();
        m_mainWindow->raise();
        m_mainWindow->activateWindow();
    });
    
    menu->addSeparator();
    
    QAction *quitAction = menu->addAction(tr("&Quit"));
    connect(quitAction, &QAction::triggered, qApp, &QApplication::quit);
    
    return menu;
}

void SystemTray::onActivated(QSystemTrayIcon::ActivationReason reason)
{
    switch (reason) {
        case QSystemTrayIcon::DoubleClick:
        case QSystemTrayIcon::Trigger:
            m_mainWindow->show();
            m_mainWindow->raise();
            m_mainWindow->activateWindow();
            break;
        default:
            break;
    }
}

void SystemTray::showNotification(const QString &title, const QString &message)
{
    showMessage(title, message, QSystemTrayIcon::Information, 5000);
}

void SystemTray::updateStatus(bool connected, int blockHeight)
{
    QString tooltip = connected 
        ? tr("Abyss Explorer - Connected (Block #%1)").arg(blockHeight)
        : tr("Abyss Explorer - Disconnected");
    setToolTip(tooltip);
}
