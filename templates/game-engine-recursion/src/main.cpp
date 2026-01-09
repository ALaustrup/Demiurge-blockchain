#include "RecursionEngine.h"
#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QCommandLineParser>
#include <QDebug>

int main(int argc, char *argv[])
{
    QGuiApplication app(argc, argv);
    app.setApplicationName("Recursion Engine");
    app.setApplicationVersion("0.1.0");
    app.setOrganizationName("Demiurge");
    
    // Parse command line arguments
    QCommandLineParser parser;
    parser.setApplicationDescription("Recursion Game Engine for Demiurge Blockchain");
    parser.addHelpOption();
    parser.addVersionOption();
    
    QCommandLineOption worldIdOption(QStringList() << "w" << "world-id",
        "World ID to load", "world_id", "default_world");
    parser.addOption(worldIdOption);
    
    QCommandLineOption rpcUrlOption(QStringList() << "r" << "rpc-url",
        "RPC endpoint URL", "url", "https://rpc.demiurge.cloud/rpc");
    parser.addOption(rpcUrlOption);
    
    parser.process(app);
    
    QString worldId = parser.value(worldIdOption);
    QString rpcUrl = parser.value(rpcUrlOption);
    
    qInfo() << "Recursion Engine v0.1.0";
    qInfo() << "========================";
    qInfo() << "World ID:" << worldId;
    qInfo() << "RPC URL:" << rpcUrl;
    
    // Create engine
    RecursionEngine engine;
    
    // Initialize with world
    engine.initialize(worldId, rpcUrl);
    
    // Start engine
    engine.start();
    
    return app.exec();
}
