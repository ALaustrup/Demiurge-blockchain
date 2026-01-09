#include "RecursionEngine.h"
#include "BlockchainRPC.h"
#include "EntityManager.h"
#include "GameRenderer.h"
#include "recursion_world.h"

#include <QQmlContext>
#include <QQmlEngine>
#include <QQuickItem>
#include <QDebug>
#include <QDir>

RecursionEngine::RecursionEngine(QObject *parent)
    : QObject(parent)
    , m_view(new QQuickView)
    , m_gameTimer(new QTimer(this))
    , m_running(false)
    , m_paused(false)
    , m_fps(0.0)
    , m_frameCount(0)
    , m_lastFpsUpdate(0)
    , m_accumulatedTime(0.0)
{
    setupQmlEngine();
    setupGameLoop();
    
    connect(m_gameTimer, &QTimer::timeout, this, &RecursionEngine::onTick);
}

RecursionEngine::~RecursionEngine()
{
    stop();
    delete m_view;
}

void RecursionEngine::setupQmlEngine()
{
    // Expose engine to QML
    m_view->rootContext()->setContextProperty("recursionEngine", this);
    
    // Set QML source
    m_view->setSource(QUrl("qrc:/RecursionWorld.qml"));
    m_view->setResizeMode(QQuickView::SizeRootObjectToView);
    m_view->setTitle("Recursion Engine - Demiurge Blockchain");
    
    // Enable OpenGL
    m_view->setFormat(QSurfaceFormat::defaultFormat());
}

void RecursionEngine::setupGameLoop()
{
    // 60 FPS game loop
    m_gameTimer->setInterval(16); // ~60 FPS
    m_gameTimer->setTimerType(Qt::PreciseTimer);
    
    m_elapsedTimer.start();
    m_lastFpsUpdate = m_elapsedTimer.elapsed();
}

void RecursionEngine::initialize(const QString &worldId, const QString &rpcUrl)
{
    m_worldId = worldId;
    m_rpcUrl = rpcUrl;
    
    // Initialize RPC client
    m_rpc = std::make_unique<BlockchainRPC>(rpcUrl, this);
    connect(m_rpc.get(), &BlockchainRPC::chainEventReceived,
            this, &RecursionEngine::onBlockchainEvent);
    
    // Initialize entity manager
    m_entityManager = std::make_unique<EntityManager>(this);
    
    // Initialize renderer
    m_renderer = std::make_unique<GameRenderer>(m_view, this);
    
    // Load world from blockchain
    loadWorld(worldId);
}

void RecursionEngine::loadWorld(const QString &worldId)
{
    if (!m_rpc) {
        emit errorOccurred("RPC client not initialized");
        return;
    }
    
    m_rpc->getRecursionWorld(worldId, [this, worldId](bool success, const QJsonObject &worldData) {
        if (!success) {
            emit errorOccurred("Failed to load world: " + worldId);
            return;
        }
        
        // Create RecursionWorld from blockchain data
        recursion::RecursionWorldConfig config;
        config.world_id = worldId.toStdString();
        config.owner_address = worldData["owner"].toString().toStdString();
        config.title = worldData["title"].toString().toStdString();
        config.description = worldData["description"].toString().toStdString();
        config.fabric_root_hash = worldData["fabric_root_hash"].toString().toStdString();
        config.created_at = worldData["created_at"].toVariant().toULongLong();
        
        m_world = std::make_unique<recursion::RecursionWorld>(config);
        m_worldTitle = QString::fromStdString(config.title);
        
        emit worldIdChanged();
        emit worldTitleChanged();
        emit worldLoaded(worldId);
        
        qInfo() << "World loaded:" << m_worldTitle;
    });
}

void RecursionEngine::start()
{
    if (m_running) return;
    
    m_running = true;
    m_paused = false;
    m_gameTimer->start();
    m_elapsedTimer.restart();
    
    emit isRunningChanged();
    
    if (m_view) {
        m_view->show();
    }
    
    qInfo() << "Recursion Engine started";
}

void RecursionEngine::stop()
{
    if (!m_running) return;
    
    m_running = false;
    m_paused = false;
    m_gameTimer->stop();
    
    emit isRunningChanged();
    
    if (m_view) {
        m_view->hide();
    }
    
    qInfo() << "Recursion Engine stopped";
}

void RecursionEngine::pause()
{
    if (!m_running || m_paused) return;
    
    m_paused = true;
    m_gameTimer->stop();
    
    qInfo() << "Recursion Engine paused";
}

void RecursionEngine::resume()
{
    if (!m_running || !m_paused) return;
    
    m_paused = false;
    m_gameTimer->start();
    m_elapsedTimer.restart();
    
    qInfo() << "Recursion Engine resumed";
}

void RecursionEngine::applyChainEvent(const QString &eventType, const QJsonObject &eventData)
{
    if (!m_world) return;
    
    QJsonDocument doc(eventData);
    std::string jsonStr = doc.toJson(QJsonDocument::Compact).toStdString();
    
    m_world->applyChainEvent(eventType.toStdString(), jsonStr);
    
    // Update entities based on event
    if (m_entityManager) {
        m_entityManager->handleChainEvent(eventType, eventData);
    }
    
    emit chainEventReceived(eventType, eventData);
}

QJsonObject RecursionEngine::exportStateSnapshot() const
{
    if (!m_world) {
        return QJsonObject();
    }
    
    std::string snapshot = m_world->exportStateSnapshot();
    QJsonDocument doc = QJsonDocument::fromJson(QString::fromStdString(snapshot).toUtf8());
    return doc.object();
}

void RecursionEngine::onTick()
{
    if (!m_world || m_paused) return;
    
    // Calculate delta time
    qint64 elapsed = m_elapsedTimer.elapsed();
    double deltaTime = elapsed / 1000.0; // Convert to seconds
    m_elapsedTimer.restart();
    
    // Cap delta time
    if (deltaTime > 0.1) {
        deltaTime = 0.1;
    }
    
    // Update world
    m_world->tick(deltaTime);
    m_accumulatedTime += deltaTime;
    
    // Update entities
    if (m_entityManager) {
        m_entityManager->update(deltaTime);
    }
    
    // Update renderer
    if (m_renderer) {
        m_renderer->update(deltaTime);
    }
    
    // Update FPS
    m_frameCount++;
    updateFPS();
}

void RecursionEngine::onBlockchainEvent(const QString &eventType, const QJsonObject &eventData)
{
    applyChainEvent(eventType, eventData);
}

void RecursionEngine::onWorldLoaded(const QString &worldId, const QJsonObject &/*worldData*/)
{
    loadWorld(worldId);
}

void RecursionEngine::updateFPS()
{
    qint64 now = m_elapsedTimer.elapsed();
    qint64 elapsed = now - m_lastFpsUpdate;
    
    // Update FPS every second
    if (elapsed >= 1000) {
        m_fps = (m_frameCount * 1000.0) / elapsed;
        m_frameCount = 0;
        m_lastFpsUpdate = now;
        emit fpsChanged();
    }
}
