#include "GameEntity.h"

GameEntity::GameEntity(quint64 id, const QString &type, const QJsonObject &properties, QObject *parent)
    : QObject(parent)
    , m_id(id)
    , m_type(type)
    , m_position(0, 0, 0)
    , m_rotation(1, 0, 0, 0) // Identity quaternion
    , m_scale(1, 1, 1)
    , m_properties(properties)
{
}

void GameEntity::setPosition(const QVector3D &pos)
{
    if (m_position != pos) {
        m_position = pos;
        emit positionChanged();
    }
}

void GameEntity::setRotation(const QQuaternion &rot)
{
    if (m_rotation != rot) {
        m_rotation = rot;
        emit rotationChanged();
    }
}

void GameEntity::setScale(const QVector3D &scl)
{
    if (m_scale != scl) {
        m_scale = scl;
        emit scaleChanged();
    }
}

void GameEntity::setProperty(const QString &key, const QJsonValue &value)
{
    if (m_properties[key] != value) {
        m_properties[key] = value;
        emit propertyChanged(key, value);
    }
}

void GameEntity::update(double /*deltaTime*/)
{
    // Entity-specific update logic
    // Can be extended with components (physics, animation, etc.)
}
