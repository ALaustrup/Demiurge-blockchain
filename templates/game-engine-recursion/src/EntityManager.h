/**
 * EntityManager - Entity-Component-System for game objects
 */

#ifndef ENTITY_MANAGER_H
#define ENTITY_MANAGER_H

#include <QObject>
#include <QMap>
#include <QVector>
#include <QJsonObject>
#include <memory>

class GameEntity;

class EntityManager : public QObject
{
    Q_OBJECT

public:
    explicit EntityManager(QObject *parent = nullptr);
    ~EntityManager();
    
    // Entity management
    quint64 createEntity(const QString &type, const QJsonObject &properties = QJsonObject());
    void removeEntity(quint64 entityId);
    GameEntity* getEntity(quint64 entityId) const;
    
    // Update loop
    void update(double deltaTime);
    
    // Chain event handling
    void handleChainEvent(const QString &eventType, const QJsonObject &eventData);
    
    // Query
    QVector<quint64> getEntitiesByType(const QString &type) const;
    QVector<quint64> getAllEntities() const;

signals:
    void entityCreated(quint64 entityId, const QString &type);
    void entityRemoved(quint64 entityId);
    void entityUpdated(quint64 entityId);

private:
    quint64 m_nextEntityId;
    QMap<quint64, GameEntity*> m_entities;
    QMap<QString, QVector<quint64>> m_entitiesByType;
};

#endif // ENTITY_MANAGER_H
