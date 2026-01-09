/**
 * GameRenderer - Qt 3D rendering system
 */

#ifndef GAME_RENDERER_H
#define GAME_RENDERER_H

#include <QObject>
#include <QQuickView>

// Qt Quick 3D is handled in QML, not C++ headers
// This class manages rendering coordination

class EntityManager;

class GameRenderer : public QObject
{
    Q_OBJECT

public:
    explicit GameRenderer(QQuickView *view, QObject *parent = nullptr);
    
    void update(double deltaTime);
    void setEntityManager(EntityManager *manager) { m_entityManager = manager; }

private:
    void setupScene();
    void updateEntities();
    
    QQuickView *m_view;
    EntityManager *m_entityManager;
    // 3D scene nodes are managed in QML
};

#endif // GAME_RENDERER_H
