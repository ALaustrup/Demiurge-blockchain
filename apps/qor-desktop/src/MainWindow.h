/**
 * MainWindow - Primary Application Window
 * 
 * Manages the main application window, menu bar, and window chrome.
 */

#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include <QMenuBar>
#include <QToolBar>
#include <QStatusBar>
#include <QSettings>

class BrowserView;
class SystemTray;
class AbyssIDManager;
class WalletBridge;
class UpdateManager;

enum class NavPosition {
    Top,
    Bottom,
    Left,
    Right
};

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    explicit MainWindow(QWidget *parent = nullptr);
    ~MainWindow();

    // Navigation position (mirrors web app setting)
    void setNavPosition(NavPosition position);
    NavPosition navPosition() const { return m_navPosition; }

public slots:
    void toggleFullscreen();
    void toggleDevTools();
    void showAbout();
    void checkForUpdates();
    void goHome();
    void goBack();
    void goForward();
    void reload();
    
signals:
    void navPositionChanged(NavPosition position);

protected:
    void closeEvent(QCloseEvent *event) override;
    void changeEvent(QEvent *event) override;

private:
    void setupUI();
    void setupMenuBar();
    void setupStatusBar();
    void loadSettings();
    void saveSettings();
    void connectSignals();

    BrowserView *m_browserView;
    SystemTray *m_systemTray;
    AbyssIDManager *m_abyssIdManager;
    WalletBridge *m_walletBridge;
    UpdateManager *m_updateManager;
    
    QToolBar *m_navToolBar;
    QStatusBar *m_statusBar;
    
    NavPosition m_navPosition = NavPosition::Top;
    QSettings m_settings;
};

#endif // MAINWINDOW_H
