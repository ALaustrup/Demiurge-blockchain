/**
 * Genesis Launcher - Main Entry Point
 * 
 * The unified gateway for the Demiurge Blockchain ecosystem.
 * Handles authentication, updates, child process launching,
 * system tray integration, and background operation.
 */

#include <QApplication>  // QApplication for system tray support (not QGuiApplication)
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QQuickStyle>
#include <QFontDatabase>
#include <QIcon>
#include <QDir>
#include <QQuickWindow>
#include <QCommandLineParser>
#include <QSharedMemory>
#include <QMessageBox>

#include "core/LauncherCore.h"
#include "core/SystemTrayManager.h"
#include "auth/AuthManager.h"
#include "auth/KeyVault.h"
#include "ipc/IPCServer.h"
#include "updater/UpdateEngine.h"

// Single instance lock using shared memory
bool acquireSingleInstanceLock(QSharedMemory &sharedMem)
{
    // Try to attach to existing - if successful, another instance exists
    if (sharedMem.attach()) {
        return false;  // Another instance is running
    }
    
    // Create the shared memory segment
    if (!sharedMem.create(1)) {
        return false;  // Failed to create
    }
    
    return true;
}

int main(int argc, char *argv[])
{
    // High DPI support
    QApplication::setHighDpiScaleFactorRoundingPolicy(
        Qt::HighDpiScaleFactorRoundingPolicy::PassThrough);
    
    // Use QApplication for QSystemTrayIcon support
    QApplication app(argc, argv);
    
    // Application metadata
    app.setApplicationName(APP_NAME);
    app.setApplicationVersion(APP_VERSION);
    app.setOrganizationName(APP_ORGANIZATION);
    app.setOrganizationDomain(APP_DOMAIN);
    
    // Set application icon
    app.setWindowIcon(QIcon(":/icons/genesis.png"));
    
    // Don't quit when last window closes (we want tray to keep running)
    app.setQuitOnLastWindowClosed(false);
    
    // Command line parsing
    QCommandLineParser parser;
    parser.setApplicationDescription("Genesis Launcher - Demiurge Ecosystem Gateway");
    parser.addHelpOption();
    parser.addVersionOption();
    
    QCommandLineOption minimizedOption(
        QStringList() << "m" << "minimized",
        "Start minimized to system tray");
    parser.addOption(minimizedOption);
    
    QCommandLineOption skipIntroOption(
        QStringList() << "s" << "skip-intro",
        "Skip the intro video sequence");
    parser.addOption(skipIntroOption);
    
    parser.process(app);
    
    bool startMinimized = parser.isSet(minimizedOption);
    bool skipIntro = parser.isSet(skipIntroOption);
    
    // Single instance check
    QSharedMemory singleInstanceLock("GenesisLauncher_SingleInstance_Lock");
    if (!acquireSingleInstanceLock(singleInstanceLock)) {
        // Another instance is running - try to bring it to front
        // For now, just show a message and exit
        QMessageBox::information(nullptr, "Genesis Launcher",
            "Genesis Launcher is already running.\n\n"
            "Check your system tray for the Genesis icon.");
        return 0;
    }
    
    // Use custom style
    QQuickStyle::setStyle("Basic");
    
    // Load custom fonts
    QFontDatabase::addApplicationFont(":/fonts/Orbitron-Bold.ttf");
    QFontDatabase::addApplicationFont(":/fonts/Rajdhani-Medium.ttf");
    QFontDatabase::addApplicationFont(":/fonts/JetBrainsMono-Regular.ttf");
    
    // Initialize core systems
    LauncherCore launcherCore;
    AuthManager authManager;
    KeyVault keyVault;
    IPCServer ipcServer;
    UpdateEngine updateEngine;
    SystemTrayManager trayManager;
    
    // Connect systems
    trayManager.setLauncherCore(&launcherCore);
    
    QObject::connect(&authManager, &AuthManager::authenticated,
                     &keyVault, &KeyVault::unlockWithSession);
    
    QObject::connect(&authManager, &AuthManager::authenticated,
                     &ipcServer, &IPCServer::setSessionToken);
    
    // Connect launcher events to tray notifications
    QObject::connect(&launcherCore, &LauncherCore::launchCompleted,
                     [&trayManager](const QString &mode, bool success) {
        if (success) {
            trayManager.showNotification(
                "Launch Complete",
                mode == "construct" ? "The Construct is running" : "Abyss OS is starting",
                3000);
        }
    });
    
    QObject::connect(&updateEngine, &UpdateEngine::updateAvailable,
                     [&trayManager](const QString &component, const QString &version) {
        trayManager.showNotification(
            "Update Available",
            QString("%1 version %2 is available").arg(component, version),
            5000);
    });
    
    // Create QML engine
    QQmlApplicationEngine engine;
    
    // Expose C++ objects to QML
    engine.rootContext()->setContextProperty("LauncherCore", &launcherCore);
    engine.rootContext()->setContextProperty("AuthManager", &authManager);
    engine.rootContext()->setContextProperty("KeyVault", &keyVault);
    engine.rootContext()->setContextProperty("IPCServer", &ipcServer);
    engine.rootContext()->setContextProperty("UpdateEngine", &updateEngine);
    engine.rootContext()->setContextProperty("TrayManager", &trayManager);
    
    // Pass command line flags to QML
    engine.rootContext()->setContextProperty("startMinimized", startMinimized);
    engine.rootContext()->setContextProperty("skipIntro", skipIntro);
    
    // Add QML import paths
    engine.addImportPath("qrc:/qml");
    
    // Store reference to main window for tray manager
    QObject *mainWindow = nullptr;
    
    // Load main QML file
    const QUrl mainUrl(QStringLiteral("qrc:/qml/LauncherWindow.qml"));
    
    QObject::connect(&engine, &QQmlApplicationEngine::objectCreated,
                     &app, [&mainWindow, &trayManager, mainUrl, startMinimized]
                     (QObject *obj, const QUrl &objUrl) {
        if (!obj && mainUrl == objUrl) {
            QCoreApplication::exit(-1);
            return;
        }
        
        if (objUrl == mainUrl) {
            mainWindow = obj;
            
            // Connect tray manager to window
            QObject::connect(&trayManager, &SystemTrayManager::showWindowRequested,
                            [mainWindow]() {
                if (auto *window = qobject_cast<QQuickWindow*>(mainWindow)) {
                    window->show();
                    window->raise();
                    window->requestActivate();
                }
            });
            
                            // Note: Window close handling is done in QML
                // The CloseButton in LauncherWindow.qml handles minimize to tray
            
            // Start minimized if requested
            if (startMinimized) {
                if (auto *window = qobject_cast<QQuickWindow*>(mainWindow)) {
                    window->hide();
                }
            }
        }
    }, Qt::QueuedConnection);
    
    engine.load(mainUrl);
    
    // Initialize system tray
    trayManager.initialize();
    
    // Check for saved "start minimized" setting
    if (trayManager.startMinimized() && !startMinimized) {
        // Hide window after a brief delay to allow QML to load
        QTimer::singleShot(100, [&engine, &trayManager]() {
            if (auto *window = qobject_cast<QQuickWindow*>(engine.rootObjects().first())) {
                window->hide();
                trayManager.hideToTray();
            }
        });
    }
    
    // Start IPC server for child processes
    ipcServer.start();
    
    // Check for updates on startup
    updateEngine.checkForUpdates();
    
    return app.exec();
}
