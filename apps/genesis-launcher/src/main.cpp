/**
 * Genesis Launcher - Main Entry Point
 * 
 * The unified gateway for the Demiurge Blockchain ecosystem.
 * Handles authentication, updates, and child process launching.
 */

#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QQuickStyle>
#include <QFontDatabase>
#include <QIcon>
#include <QDir>

#include "core/LauncherCore.h"
#include "auth/AuthManager.h"
#include "auth/KeyVault.h"
#include "ipc/IPCServer.h"
#include "updater/UpdateEngine.h"

int main(int argc, char *argv[])
{
    // High DPI support
    QGuiApplication::setHighDpiScaleFactorRoundingPolicy(
        Qt::HighDpiScaleFactorRoundingPolicy::PassThrough);
    
    QGuiApplication app(argc, argv);
    
    // Application metadata
    app.setApplicationName(APP_NAME);
    app.setApplicationVersion(APP_VERSION);
    app.setOrganizationName(APP_ORGANIZATION);
    app.setOrganizationDomain(APP_DOMAIN);
    
    // Set application icon
    app.setWindowIcon(QIcon(":/icons/genesis.png"));
    
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
    
    // Connect systems
    QObject::connect(&authManager, &AuthManager::authenticated,
                     &keyVault, &KeyVault::unlockWithSession);
    
    QObject::connect(&authManager, &AuthManager::authenticated,
                     &ipcServer, &IPCServer::setSessionToken);
    
    // Create QML engine
    QQmlApplicationEngine engine;
    
    // Expose C++ objects to QML
    engine.rootContext()->setContextProperty("LauncherCore", &launcherCore);
    engine.rootContext()->setContextProperty("AuthManager", &authManager);
    engine.rootContext()->setContextProperty("KeyVault", &keyVault);
    engine.rootContext()->setContextProperty("IPCServer", &ipcServer);
    engine.rootContext()->setContextProperty("UpdateEngine", &updateEngine);
    
    // Add QML import paths
    engine.addImportPath("qrc:/qml");
    
    // Load main QML file
    const QUrl mainUrl(QStringLiteral("qrc:/qml/LauncherWindow.qml"));
    
    QObject::connect(&engine, &QQmlApplicationEngine::objectCreated,
                     &app, [mainUrl](QObject *obj, const QUrl &objUrl) {
        if (!obj && mainUrl == objUrl) {
            QCoreApplication::exit(-1);
        }
    }, Qt::QueuedConnection);
    
    engine.load(mainUrl);
    
    // Start IPC server for child processes
    ipcServer.start();
    
    // Check for updates on startup
    updateEngine.checkForUpdates();
    
    return app.exec();
}
