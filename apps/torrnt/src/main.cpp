/**
 * TORRNT - On-Chain Torrenting Application
 * 
 * A Qt-based torrent client with blockchain integration for the Demiurge ecosystem.
 */

#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QQuickStyle>
#include "TorrentManager.h"
#include "blockchain/BlockchainTorrentBridge.h"

int main(int argc, char *argv[])
{
    QGuiApplication app(argc, argv);
    
    // Set application properties
    app.setApplicationName("TORRNT");
    app.setApplicationVersion("1.0.0");
    app.setOrganizationName("Demiurge");
    app.setOrganizationDomain("demiurge.cloud");
    
    // Set Qt Quick style
    QQuickStyle::setStyle("Material");
    
    // Create managers
    TorrentManager *torrentManager = new TorrentManager(&app);
    BlockchainTorrentBridge *blockchainBridge = new BlockchainTorrentBridge(&app);
    
    // Connect them
    torrentManager->setBlockchainBridge(blockchainBridge);
    
    // Setup QML engine
    QQmlApplicationEngine engine;
    
    // Expose to QML
    engine.rootContext()->setContextProperty("torrentManager", torrentManager);
    engine.rootContext()->setContextProperty("blockchainBridge", blockchainBridge);
    
    // Load main QML
    const QUrl url(QStringLiteral("qrc:/MainWindow.qml"));
    QObject::connect(&engine, &QQmlApplicationEngine::objectCreationFailed,
                     &app, []() { QCoreApplication::exit(-1); },
                     Qt::QueuedConnection);
    engine.load(url);
    
    return app.exec();
}
