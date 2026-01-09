/**
 * GameRenderer - Qt 3D rendering system
 */

#ifndef GAME_RENDERER_H
#define GAME_RENDERER_H

#include <QObject>
#include <QQuickView>
#include <QQuick3DNode>
#include <QQuick3DPerspectiveCamera>
#include <QQuick3DDirectionalLight>

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
    QQuick3DNode *m_sceneRoot;
    QQuick3DPerspectiveCamera *m_camera;
    QQuick3DDirectionalLight *m_light;
};

#endif // GAME_RENDERER_H
