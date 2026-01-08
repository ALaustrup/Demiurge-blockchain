/**
 * SystemTray - System Tray Integration
 */

#ifndef SYSTEMTRAY_H
#define SYSTEMTRAY_H

#include <QSystemTrayIcon>

class MainWindow;

class SystemTray : public QSystemTrayIcon
{
    Q_OBJECT

public:
    explicit SystemTray(MainWindow *mainWindow);
    
    void showNotification(const QString &title, const QString &message);
    void updateStatus(bool connected, int blockHeight);

private slots:
    void onActivated(QSystemTrayIcon::ActivationReason reason);

private:
    QMenu* createContextMenu();
    MainWindow *m_mainWindow;
};

#endif // SYSTEMTRAY_H
