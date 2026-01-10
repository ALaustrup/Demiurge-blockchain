/**
 * QØЯ - Demiurge Blockchain Desktop Client
 * Glass Engine v1.0.0 - Ancient Code Meets Ethereal Glass
 * 
 * The complete native desktop environment for the Demiurge ecosystem.
 * Provides full chain access, QOR OS GUI, and native performance with
 * cutting-edge glassmorphism and shader effects.
 */

#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QIcon>
#include <QDir>
#include <QStandardPaths>
#include <QDebug>
#include <QSurfaceFormat>
#include "QorIDManager.h"

int main(int argc, char *argv[])
{
    qDebug() << "🌌 QOR Desktop - Glass Engine v1.0.0";
    qDebug() << "✨ Ancient Code Meets Ethereal Glass";
    
    // Enable high DPI scaling for crisp display on modern monitors
    QGuiApplication::setHighDpiScaleFactorRoundingPolicy(
        Qt::HighDpiScaleFactorRoundingPolicy::PassThrough);
    
    // Configure OpenGL surface format for Glass Engine shaders
    QSurfaceFormat format;
    format.setRenderableType(QSurfaceFormat::OpenGL);
    format.setProfile(QSurfaceFormat::CoreProfile);
    format.setVersion(4, 5);  // OpenGL 4.5 for advanced shaders
    format.setSamples(4);     // MSAA for smooth edges
    QSurfaceFormat::setDefaultFormat(format);
    
    // Initialize QØЯ application
    QGuiApplication app(argc, argv);
    
    qDebug() << "🔧 Application initialized";
    app.setApplicationName("QOR");
    app.setApplicationVersion("1.0.0");
    app.setOrganizationName("Demiurge");
    app.setOrganizationDomain("demiurge.cloud");
    app.setApplicationDisplayName("QØЯ - Demiurge Desktop");
    
    // Set application icon
    app.setWindowIcon(QIcon(":/assets/icon.png"));
    
    // Create QML engine
    QQmlApplicationEngine engine;
    
    qDebug() << "🎨 QML engine created";
    
    // Create and expose QorID Manager to QML
    QorIDManager qorIDManager;
    engine.rootContext()->setContextProperty("QorIDManager", &qorIDManager);
    
    qDebug() << "🔐 QorIDManager exposed to QML";
    
    // Set import paths for QML modules
    engine.addImportPath("qrc:/qml");
    engine.addImportPath("qrc:/");
    
    qDebug() << "📦 Import paths configured";
    
    // Load main QML file (Glass Engine interface)
    const QUrl url(QStringLiteral("qrc:/qml/src/qml/main.qml"));
    
    qDebug() << "🚀 Loading Glass Engine from:" << url;
    
    QObject::connect(&engine, &QQmlApplicationEngine::objectCreated,
        &app, [url](QObject *obj, const QUrl &objUrl) {
            if (!obj && url == objUrl) {
                qCritical() << "❌ ERROR: Failed to create root object!";
                QCoreApplication::exit(-1);
            } else if (obj) {
                qDebug() << "✅ Glass Engine root object created successfully!";
            }
        }, Qt::QueuedConnection);
    
    engine.load(url);
    
    if (engine.rootObjects().isEmpty()) {
        qCritical() << "❌ ERROR: No root objects loaded! Check QML file.";
        return -1;
    }
    
    qDebug() << "🎭 Glass Engine initialized - Entering event loop...";
    qDebug() << "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
    
    return app.exec();
}
