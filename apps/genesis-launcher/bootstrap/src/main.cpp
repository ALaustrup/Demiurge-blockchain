/**
 * Genesis Seed - Bootstrap Installer
 * 
 * A lightweight executable (~10MB) that:
 * 1. Displays a sleek "seed" window
 * 2. Downloads the Genesis Launcher
 * 3. Launches the full launcher
 * 4. Exits
 */

#include <QApplication>
#include <QDir>
#include <QStandardPaths>
#include <QProcess>

#include "SeedWindow.h"
#include "Downloader.h"

int main(int argc, char *argv[])
{
    QApplication app(argc, argv);
    
    app.setApplicationName("GenesisSeed");
    app.setOrganizationName("Demiurge");
    
    // Check if launcher already installed
    QString appDataPath = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation);
    QDir().mkpath(appDataPath);
    
#ifdef Q_OS_WIN
    QString launcherPath = appDataPath + "/GenesisLauncher.exe";
#else
    QString launcherPath = appDataPath + "/GenesisLauncher";
#endif
    
    // Create and show the seed window
    SeedWindow window;
    window.show();
    
    // Check if launcher exists and is up to date
    if (QFile::exists(launcherPath)) {
        // Launch existing
        window.setStatus("Initializing...");
        
        QProcess::startDetached(launcherPath, QStringList());
        
        // Exit seed
        return 0;
    }
    
    // Download launcher
    window.setStatus("Downloading Genesis Launcher...");
    
    Downloader downloader;
    
    QObject::connect(&downloader, &Downloader::progressChanged,
                     &window, &SeedWindow::setProgress);
    
    QObject::connect(&downloader, &Downloader::statusChanged,
                     &window, &SeedWindow::setStatus);
    
    QObject::connect(&downloader, &Downloader::downloadComplete,
                     [&launcherPath]() {
        // Launch and exit
        QProcess::startDetached(launcherPath, QStringList());
        QApplication::quit();
    });
    
    QObject::connect(&downloader, &Downloader::downloadFailed,
                     &window, &SeedWindow::showError);
    
    downloader.downloadLauncher(launcherPath);
    
    return app.exec();
}
