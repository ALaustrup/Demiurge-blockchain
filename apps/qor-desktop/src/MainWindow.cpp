/**
 * MainWindow Implementation
 */

#include "MainWindow.h"
#include "BrowserView.h"
#include "SystemTray.h"
#include "AbyssIDManager.h"
#include "WalletBridge.h"
#include "UpdateManager.h"

#include <QApplication>
#include <QMenuBar>
#include <QMenu>
#include <QAction>
#include <QToolBar>
#include <QStatusBar>
#include <QLabel>
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QMessageBox>
#include <QCloseEvent>
#include <QDir>
#include <QUrl>

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent)
    , m_browserView(nullptr)
    , m_systemTray(nullptr)
    , m_abyssIdManager(nullptr)
    , m_walletBridge(nullptr)
    , m_updateManager(nullptr)
    , m_navToolBar(nullptr)
    , m_settings("Demiurge", "QOR")
{
    // Set window properties
    setWindowTitle(tr("QØЯ - Demiurge Desktop"));
    setMinimumSize(1024, 768);
    
    // Initialize components
    m_abyssIdManager = new AbyssIDManager(this);
    m_walletBridge = new WalletBridge(m_abyssIdManager, this);
    m_updateManager = new UpdateManager(this);
    
    // Setup UI
    setupUI();
    setupMenuBar();
    setupStatusBar();
    
    // Create system tray
    m_systemTray = new SystemTray(this);
    
    // Load settings
    loadSettings();
    
    // Connect signals
    connectSignals();
    
    // Check for updates on startup
    m_updateManager->checkForUpdates();
}

MainWindow::~MainWindow()
{
    saveSettings();
}

void MainWindow::setupUI()
{
    // Create central widget
    QWidget *centralWidget = new QWidget(this);
    QVBoxLayout *layout = new QVBoxLayout(centralWidget);
    layout->setContentsMargins(0, 0, 0, 0);
    layout->setSpacing(0);
    
    // Create browser view
    m_browserView = new BrowserView(m_abyssIdManager, m_walletBridge, this);
    layout->addWidget(m_browserView);
    
    setCentralWidget(centralWidget);
    
    // Load the AbyssOS web app
    QString webPath = QDir(QApplication::applicationDirPath()).filePath("web/index.html");
    if (QFile::exists(webPath)) {
        m_browserView->load(QUrl::fromLocalFile(webPath));
    } else {
        // Fallback to production URL if local files not found
        m_browserView->load(QUrl("https://os.demiurge.cloud"));
    }
}

void MainWindow::setupMenuBar()
{
    // File menu
    QMenu *fileMenu = menuBar()->addMenu(tr("&File"));
    
    QAction *newTabAction = fileMenu->addAction(tr("New &Tab"), Qt::CTRL | Qt::Key_T);
    connect(newTabAction, &QAction::triggered, [this]() {
        // Send new tab command to web app
        m_browserView->page()->runJavaScript(
            "window.dispatchEvent(new CustomEvent('abyss-new-tab'))");
    });
    
    fileMenu->addSeparator();
    
    QAction *quitAction = fileMenu->addAction(tr("&Quit"), Qt::CTRL | Qt::Key_Q);
    connect(quitAction, &QAction::triggered, this, &QWidget::close);
    
    // Edit menu
    QMenu *editMenu = menuBar()->addMenu(tr("&Edit"));
    editMenu->addAction(tr("&Undo"), Qt::CTRL | Qt::Key_Z);
    editMenu->addAction(tr("&Redo"), Qt::CTRL | Qt::SHIFT | Qt::Key_Z);
    editMenu->addSeparator();
    editMenu->addAction(tr("Cu&t"), Qt::CTRL | Qt::Key_X);
    editMenu->addAction(tr("&Copy"), Qt::CTRL | Qt::Key_C);
    editMenu->addAction(tr("&Paste"), Qt::CTRL | Qt::Key_V);
    
    // View menu
    QMenu *viewMenu = menuBar()->addMenu(tr("&View"));
    
    QAction *fullscreenAction = viewMenu->addAction(tr("&Fullscreen"), Qt::Key_F11);
    connect(fullscreenAction, &QAction::triggered, this, &MainWindow::toggleFullscreen);
    
    QAction *devToolsAction = viewMenu->addAction(tr("&Developer Tools"), Qt::Key_F12);
    connect(devToolsAction, &QAction::triggered, this, &MainWindow::toggleDevTools);
    
    viewMenu->addSeparator();
    
    QAction *reloadAction = viewMenu->addAction(tr("&Reload"), Qt::CTRL | Qt::Key_R);
    connect(reloadAction, &QAction::triggered, this, &MainWindow::reload);
    
    // Navigate menu
    QMenu *navMenu = menuBar()->addMenu(tr("&Navigate"));
    
    QAction *backAction = navMenu->addAction(tr("&Back"), Qt::ALT | Qt::Key_Left);
    connect(backAction, &QAction::triggered, this, &MainWindow::goBack);
    
    QAction *forwardAction = navMenu->addAction(tr("&Forward"), Qt::ALT | Qt::Key_Right);
    connect(forwardAction, &QAction::triggered, this, &MainWindow::goForward);
    
    QAction *homeAction = navMenu->addAction(tr("&Home"), Qt::ALT | Qt::Key_Home);
    connect(homeAction, &QAction::triggered, this, &MainWindow::goHome);
    
    // Help menu
    QMenu *helpMenu = menuBar()->addMenu(tr("&Help"));
    
    QAction *updateAction = helpMenu->addAction(tr("Check for &Updates..."));
    connect(updateAction, &QAction::triggered, this, &MainWindow::checkForUpdates);
    
    helpMenu->addSeparator();
    
    QAction *aboutAction = helpMenu->addAction(tr("&About QØЯ"));
    connect(aboutAction, &QAction::triggered, this, &MainWindow::showAbout);
}

void MainWindow::setupStatusBar()
{
    m_statusBar = statusBar();
    
    // Connection status
    QLabel *connectionLabel = new QLabel(tr("Connecting..."));
    connectionLabel->setObjectName("connectionStatus");
    m_statusBar->addPermanentWidget(connectionLabel);
}

void MainWindow::loadSettings()
{
    // Window geometry
    if (m_settings.contains("geometry")) {
        restoreGeometry(m_settings.value("geometry").toByteArray());
    }
    if (m_settings.contains("windowState")) {
        restoreState(m_settings.value("windowState").toByteArray());
    }
    
    // Nav position
    int navPos = m_settings.value("navPosition", 0).toInt();
    m_navPosition = static_cast<NavPosition>(navPos);
}

void MainWindow::saveSettings()
{
    m_settings.setValue("geometry", saveGeometry());
    m_settings.setValue("windowState", saveState());
    m_settings.setValue("navPosition", static_cast<int>(m_navPosition));
}

void MainWindow::connectSignals()
{
    // Update manager signals
    connect(m_updateManager, &UpdateManager::updateFound,
            this, [this](const QString &version, const QString &changelog) {
        QMessageBox::information(this, tr("Update Available"),
            tr("A new version (%1) is available.\n\n%2").arg(version, changelog));
    });
    
    // AbyssID manager signals
    connect(m_abyssIdManager, &AbyssIDManager::authChanged, [this]() {
        if (m_abyssIdManager->isAuthenticated()) {
            statusBar()->showMessage(
                tr("Logged in as %1").arg(m_abyssIdManager->username()), 3000);
        }
    });
}

void MainWindow::toggleFullscreen()
{
    if (isFullScreen()) {
        showNormal();
    } else {
        showFullScreen();
    }
}

void MainWindow::toggleDevTools()
{
    // Toggle developer tools
    m_browserView->page()->setDevToolsPage(
        m_browserView->page()->devToolsPage() ? nullptr : m_browserView->page());
}

void MainWindow::showAbout()
{
    QMessageBox::about(this, tr("About QØЯ"),
        tr("<h2>QØЯ</h2>"
           "<p>Version %1</p>"
           "<p>The complete desktop client for the Demiurge blockchain.</p>"
           "<p>QØЯ provides native access to the entire Demiurge ecosystem "
           "including AbyssID, Abyss Wallet, mining, P2P networking, and the "
           "Abyss OS graphical environment.</p>"
           "<p>© 2024-2026 Demiurge</p>"
           "<p><a href='https://demiurge.cloud'>https://demiurge.cloud</a></p>")
        .arg(APP_VERSION));
}

void MainWindow::checkForUpdates()
{
    m_updateManager->checkForUpdates();
    statusBar()->showMessage(tr("Checking for updates..."), 3000);
}

void MainWindow::goHome()
{
    m_browserView->page()->runJavaScript(
        "window.dispatchEvent(new CustomEvent('abyss-go-home'))");
}

void MainWindow::goBack()
{
    m_browserView->back();
}

void MainWindow::goForward()
{
    m_browserView->forward();
}

void MainWindow::reload()
{
    m_browserView->reload();
}

void MainWindow::setNavPosition(NavPosition position)
{
    if (m_navPosition != position) {
        m_navPosition = position;
        emit navPositionChanged(position);
        
        // Sync with web app
        QString posStr;
        switch (position) {
            case NavPosition::Top: posStr = "top"; break;
            case NavPosition::Bottom: posStr = "bottom"; break;
            case NavPosition::Left: posStr = "left"; break;
            case NavPosition::Right: posStr = "right"; break;
        }
        m_browserView->page()->runJavaScript(
            QString("window.dispatchEvent(new CustomEvent('abyss-set-nav-position', {detail: '%1'}))").arg(posStr));
    }
}

void MainWindow::closeEvent(QCloseEvent *event)
{
    // Minimize to tray instead of closing (optional)
    if (m_systemTray && m_systemTray->isVisible()) {
        hide();
        event->ignore();
    } else {
        saveSettings();
        event->accept();
    }
}

void MainWindow::changeEvent(QEvent *event)
{
    if (event->type() == QEvent::WindowStateChange) {
        // Handle window state changes
    }
    QMainWindow::changeEvent(event);
}
