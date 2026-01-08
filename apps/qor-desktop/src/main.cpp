/**
 * QØЯ - Demiurge Blockchain Desktop Client
 * 
 * The complete native desktop environment for the Demiurge ecosystem.
 * Provides full chain access, AbyssOS GUI, and native performance.
 * 
 * QØЯ (pronounced "core") represents the heart of Demiurge - 
 * a desktop client that facilitates all blockchain operations while
 * providing the Abyss OS graphical environment.
 */

#include <QApplication>
#include <QDir>
#include <QStandardPaths>
#include "MainWindow.h"

#ifdef QOR_WEBENGINE_ENABLED
#include <QWebEngineProfile>
#include <QWebEngineSettings>
#endif

int main(int argc, char *argv[])
{
    // Enable high DPI scaling for crisp display on modern monitors
    QApplication::setHighDpiScaleFactorRoundingPolicy(
        Qt::HighDpiScaleFactorRoundingPolicy::PassThrough);
    
    // Initialize QØЯ application
    QApplication app(argc, argv);
    app.setApplicationName(APP_NAME);
    app.setApplicationVersion(APP_VERSION);
    app.setOrganizationName(APP_ORGANIZATION);
    app.setOrganizationDomain(APP_DOMAIN);
    app.setApplicationDisplayName(APP_DISPLAY_NAME);
    
#ifdef QOR_WEBENGINE_ENABLED
    // Configure WebEngine
    QWebEngineProfile *profile = QWebEngineProfile::defaultProfile();
    
    // Set persistent storage path
    QString dataPath = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation);
    profile->setPersistentStoragePath(dataPath + "/webengine");
    profile->setCachePath(dataPath + "/cache");
    
    // Enable local storage and IndexedDB
    QWebEngineSettings *settings = profile->settings();
    settings->setAttribute(QWebEngineSettings::LocalStorageEnabled, true);
    settings->setAttribute(QWebEngineSettings::LocalContentCanAccessRemoteUrls, true);
    settings->setAttribute(QWebEngineSettings::LocalContentCanAccessFileUrls, true);
    settings->setAttribute(QWebEngineSettings::JavascriptCanAccessClipboard, true);
    settings->setAttribute(QWebEngineSettings::AllowWindowActivationFromJavaScript, true);
    settings->setAttribute(QWebEngineSettings::WebGLEnabled, true);
    settings->setAttribute(QWebEngineSettings::Accelerated2dCanvasEnabled, true);
#endif
    
    // Create and show main window
    MainWindow mainWindow;
    mainWindow.show();
    
    return app.exec();
}
