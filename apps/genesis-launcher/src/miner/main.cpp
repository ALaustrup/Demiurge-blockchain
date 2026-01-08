/**
 * DemiurgeMiner - Lightweight Mining Daemon
 * 
 * "The Construct" - Runs in system tray, no heavy desktop overhead.
 */

#include <QApplication>
#include <QCommandLineParser>

#include "MinerDaemon.h"
#include "../ipc/IPCClient.h"

int main(int argc, char *argv[])
{
    QApplication app(argc, argv);
    
    app.setApplicationName("DemiurgeMiner");
    app.setApplicationVersion("1.0.0");
    app.setOrganizationName("Demiurge");
    app.setQuitOnLastWindowClosed(false);  // Keep running in tray
    
    // Parse command line
    QCommandLineParser parser;
    parser.addHelpOption();
    parser.addVersionOption();
    
    parser.addOption({"ipc-port", "IPC port for launcher connection", "port", "31337"});
    parser.addOption({"session-id", "Session ID from launcher", "id"});
    parser.addOption({"mode", "Run mode (tray, console)", "mode", "tray"});
    parser.addOption({"no-gui", "Run without GUI (headless mining)"});
    
    parser.process(app);
    
    // Create IPC client for SSO
    IPCClient ipcClient;
    
    // Create miner daemon
    MinerDaemon daemon;
    
    // Connect IPC authentication
    QObject::connect(&ipcClient, &IPCClient::authenticated,
                     &daemon, &MinerDaemon::onAuthenticated);
    
    // Try to get session from launcher
    if (!ipcClient.connectToLauncher()) {
        qWarning() << "Could not connect to Genesis Launcher";
        // Allow standalone operation with manual login
    }
    
    // Show tray icon (unless headless)
    if (!parser.isSet("no-gui")) {
        daemon.showTray();
    }
    
    return app.exec();
}
