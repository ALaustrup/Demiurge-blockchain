/**
 * GameEntity - Represents a game object in the world
 */

#ifndef GAME_ENTITY_H
#define GAME_ENTITY_H

#include <QObject>
#include <QJsonObject>
#include <QVector3D>
#include <QQuaternion>

class GameEntity : public QObject
{
    Q_OBJECT
    Q_PROPERTY(quint64 id READ id CONSTANT)
    Q_PROPERTY(QString type READ type CONSTANT)
    Q_PROPERTY(QVector3D position READ position WRITE setPosition NOTIFY positionChanged)
    Q_PROPERTY(QQuaternion rotation READ rotation WRITE setRotation NOTIFY rotationChanged)
    Q_PROPERTY(QVector3D scale READ scale WRITE setScale NOTIFY scaleChanged)

public:
    explicit GameEntity(quint64 id, const QString &type, const QJsonObject &properties, QObject *parent = nullptr);
    
    // Getters
    quint64 id() const { return m_id; }
    QString type() const { return m_type; }
    QVector3D position() const { return m_position; }
    QQuaternion rotation() const { return m_rotation; }
    QVector3D scale() const { return m_scale; }
    QJsonObject properties() const { return m_properties; }
    
    // Setters
    void setPosition(const QVector3D &pos);
    void setRotation(const QQuaternion &rot);
    void setScale(const QVector3D &scl);
    void setProperty(const QString &key, const QJsonValue &value);
    
    // Update
    void update(double deltaTime);

signals:
    void positionChanged();
    void rotationChanged();
    void scaleChanged();
    void propertyChanged(const QString &key, const QJsonValue &value);

private:
    quint64 m_id;
    QString m_type;
    QVector3D m_position;
    QQuaternion m_rotation;
    QVector3D m_scale;
    QJsonObject m_properties;
};

#endif // GAME_ENTITY_H
