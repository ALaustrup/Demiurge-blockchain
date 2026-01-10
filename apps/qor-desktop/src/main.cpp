/**
 * QØЯ - Demiurge Blockchain Desktop Client
 * 
 * The complete native desktop environment for the Demiurge ecosystem.
 * Provides full chain access, QOR OS GUI, and native performance.
 * 
 * QØЯ (pronounced "core") represents the heart of Demiurge - 
 * a desktop client that facilitates all blockchain operations while
 * providing the QOR OS graphical environment.
 */

#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QIcon>
#include <QDir>
#include <QStandardPaths>
#include <QDebug>

int main(int argc, char *argv[])
{
    qDebug() << "QOR Desktop starting...";
    
    // Enable high DPI scaling for crisp display on modern monitors
    QGuiApplication::setHighDpiScaleFactorRoundingPolicy(
        Qt::HighDpiScaleFactorRoundingPolicy::PassThrough);
    
    // Initialize QØЯ application
    QGuiApplication app(argc, argv);
    
    qDebug() << "Application initialized";
    app.setApplicationName("QOR");
    app.setApplicationVersion("1.0.0");
    app.setOrganizationName("Demiurge");
    app.setOrganizationDomain("demiurge.cloud");
    app.setApplicationDisplayName("QØЯ - Demiurge Desktop");
    
    // Set application icon
    app.setWindowIcon(QIcon(":/assets/icon.png"));
    
    // Create QML engine
    QQmlApplicationEngine engine;
    
    qDebug() << "QML engine created";
    
    // Set import paths
    engine.addImportPath("qrc:/qml");
    engine.addImportPath("qrc:/");
    
    qDebug() << "Import paths set";
    
    // Load main QML file (note: qml.qrc prefix is /qml, file is src/qml/Main.qml)
    const QUrl url(QStringLiteral("qrc:/qml/src/qml/Main.qml"));
    
    qDebug() << "Loading QML from:" << url;
    
    QObject::connect(&engine, &QQmlApplicationEngine::objectCreated,
        &app, [url](QObject *obj, const QUrl &objUrl) {
            qDebug() << "Object created callback:" << obj << objUrl;
            if (!obj && url == objUrl) {
                qDebug() << "ERROR: Failed to create root object!";
                QCoreApplication::exit(-1);
            } else {
                qDebug() << "Root object created successfully!";
            }
        }, Qt::QueuedConnection);
    
    engine.load(url);
    
    qDebug() << "QML load initiated. Root objects:" << engine.rootObjects().count();
    
    if (engine.rootObjects().isEmpty()) {
        qDebug() << "ERROR: No root objects loaded!";
        return -1;
    }
    
    qDebug() << "Entering event loop...";
    return app.exec();
}
