/**
 * RecursionEngine - Qt-based Game Engine for Demiurge Blockchain
 * 
 * Provides a full-featured game engine using Qt 3D/Quick 3D for rendering,
 * integrated with blockchain events and Recursion World state.
 */

#ifndef RECURSION_ENGINE_H
#define RECURSION_ENGINE_H

#include <QObject>
#include <QQuickView>
#include <QTimer>
#include <QElapsedTimer>
#include <memory>

namespace recursion {
    class RecursionWorld;
}

class BlockchainRPC;
class EntityManager;
class GameRenderer;

class RecursionEngine : public QObject
{
    Q_OBJECT
    Q_PROPERTY(QString worldId READ worldId NOTIFY worldIdChanged)
    Q_PROPERTY(QString worldTitle READ worldTitle NOTIFY worldTitleChanged)
    Q_PROPERTY(bool isRunning READ isRunning NOTIFY isRunningChanged)
    Q_PROPERTY(double fps READ fps NOTIFY fpsChanged)

public:
    explicit RecursionEngine(QObject *parent = nullptr);
    ~RecursionEngine();

    // Getters
    QString worldId() const { return m_worldId; }
    QString worldTitle() const { return m_worldTitle; }
    bool isRunning() const { return m_running; }
    double fps() const { return m_fps; }

    // Engine control
    Q_INVOKABLE void initialize(const QString &worldId, const QString &rpcUrl = "https://rpc.demiurge.cloud/rpc");
    Q_INVOKABLE void start();
    Q_INVOKABLE void stop();
    Q_INVOKABLE void pause();
    Q_INVOKABLE void resume();

    // World operations
    Q_INVOKABLE void loadWorld(const QString &worldId);
    Q_INVOKABLE void applyChainEvent(const QString &eventType, const QJsonObject &eventData);
    Q_INVOKABLE QJsonObject exportStateSnapshot() const;

    // Rendering
    QQuickView* view() const { return m_view; }

signals:
    void worldIdChanged();
    void worldTitleChanged();
    void isRunningChanged();
    void fpsChanged();
    void chainEventReceived(const QString &eventType, const QJsonObject &eventData);
    void worldLoaded(const QString &worldId);
    void errorOccurred(const QString &error);

private slots:
    void onTick();
    void onBlockchainEvent(const QString &eventType, const QJsonObject &eventData);
    void onWorldLoaded(const QString &worldId, const QJsonObject &worldData);

private:
    void setupQmlEngine();
    void setupGameLoop();
    void updateFPS();

    QQuickView *m_view;
    QTimer *m_gameTimer;
    QElapsedTimer m_elapsedTimer;
    
    std::unique_ptr<recursion::RecursionWorld> m_world;
    std::unique_ptr<BlockchainRPC> m_rpc;
    std::unique_ptr<EntityManager> m_entityManager;
    std::unique_ptr<GameRenderer> m_renderer;

    QString m_worldId;
    QString m_worldTitle;
    QString m_rpcUrl;
    bool m_running;
    bool m_paused;
    
    // FPS tracking
    double m_fps;
    qint64 m_frameCount;
    qint64 m_lastFpsUpdate;
    double m_accumulatedTime;
};

#endif // RECURSION_ENGINE_H
