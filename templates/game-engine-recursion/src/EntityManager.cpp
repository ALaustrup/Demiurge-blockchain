#include "EntityManager.h"
#include "GameEntity.h"
#include <QDebug>

// Forward declaration - GameEntity will be implemented
class GameEntity : public QObject {
public:
    GameEntity(quint64 id, const QString &type, const QJsonObject &props, QObject *parent = nullptr)
        : QObject(parent), m_id(id), m_type(type), m_properties(props) {}
    QString type() const { return m_type; }
private:
    quint64 m_id;
    QString m_type;
    QJsonObject m_properties;
};

EntityManager::EntityManager(QObject *parent)
    : QObject(parent)
    , m_nextEntityId(1)
{
}

EntityManager::~EntityManager()
{
    m_entities.clear();
}

quint64 EntityManager::createEntity(const QString &type, const QJsonObject &properties)
{
    quint64 id = m_nextEntityId++;
    
    auto entity = std::make_unique<GameEntity>(id, type, properties);
    m_entities[id] = std::move(entity);
    m_entitiesByType[type].append(id);
    
    emit entityCreated(id, type);
    return id;
}

void EntityManager::removeEntity(quint64 entityId)
{
    if (!m_entities.contains(entityId)) return;
    
    auto &entity = m_entities[entityId];
    QString type = entity->type();
    
    m_entitiesByType[type].removeAll(entityId);
    m_entities.remove(entityId);
    
    emit entityRemoved(entityId);
}

GameEntity* EntityManager::getEntity(quint64 entityId) const
{
    auto it = m_entities.find(entityId);
    if (it != m_entities.end()) {
        return it->get();
    }
    return nullptr;
}

void EntityManager::update(double deltaTime)
{
    for (auto &[id, entity] : m_entities) {
        entity->update(deltaTime);
    }
}

void EntityManager::handleChainEvent(const QString &eventType, const QJsonObject &eventData)
{
    // Handle NFT mint events - spawn entities
    if (eventType == "nft_mint") {
        QString tokenId = eventData["token_id"].toString();
        QString owner = eventData["owner"].toString();
        
        QJsonObject properties;
        properties["token_id"] = tokenId;
        properties["owner"] = owner;
        properties["nft_metadata"] = eventData["metadata"];
        
        createEntity("nft_object", properties);
    }
    
    // Handle CGT transfer events
    else if (eventType == "cgt_transfer") {
        // Update entity properties based on transfer
        // e.g., unlock features, update balances
    }
    
    // Handle recursion object creation
    else if (eventType == "recursion_object_created") {
        QJsonObject properties = eventData["properties"].toObject();
        createEntity("recursion_object", properties);
    }
}

QVector<quint64> EntityManager::getEntitiesByType(const QString &type) const
{
    return m_entitiesByType.value(type);
}

QVector<quint64> EntityManager::getAllEntities() const
{
    QVector<quint64> ids;
    ids.reserve(m_entities.size());
    for (auto it = m_entities.begin(); it != m_entities.end(); ++it) {
        ids.append(it.key());
    }
    return ids;
}
