/**
 * IPCServer Implementation
 */

#include "IPCServer.h"
#include "SharedSession.h"

#include <QJsonDocument>
#include <QJsonObject>
#include <QDebug>

const QString IPCServer::SERVER_NAME = "GenesisLauncherIPC";
const QString IPCServer::SHARED_MEM_KEY = "GenesisSession";

IPCServer::IPCServer(QObject *parent)
    : QObject(parent)
    , m_server(new QLocalServer(this))
    , m_sharedMemory(new QSharedMemory(SHARED_MEM_KEY, this))
    , m_running(false)
{
    connect(m_server, &QLocalServer::newConnection,
            this, &IPCServer::onNewConnection);
}

IPCServer::~IPCServer()
{
    stop();
}

bool IPCServer::start(quint16 port)
{
    Q_UNUSED(port)
    
    // Remove any stale server
    QLocalServer::removeServer(SERVER_NAME);
    
    if (!m_server->listen(SERVER_NAME)) {
        qWarning() << "Failed to start IPC server:" << m_server->errorString();
        return false;
    }
    
    // Setup shared memory for fast session access
    setupSharedMemory();
    
    m_running = true;
    emit runningChanged();
    
    qInfo() << "IPC Server started on:" << SERVER_NAME;
    return true;
}

void IPCServer::stop()
{
    m_server->close();
    
    // Disconnect all clients
    for (QLocalSocket *client : m_clients) {
        client->disconnectFromServer();
    }
    m_clients.clear();
    
    // Detach shared memory
    if (m_sharedMemory->isAttached()) {
        m_sharedMemory->detach();
    }
    
    m_running = false;
    emit runningChanged();
}

void IPCServer::setSessionToken(const QString &token)
{
    m_sessionToken = token;
    updateSharedSession();
    
    // Notify all connected clients of new session
    QJsonObject msg;
    msg["type"] = "session_update";
    msg["token"] = token;
    
    broadcast(QString::fromUtf8(QJsonDocument(msg).toJson(QJsonDocument::Compact)));
}

void IPCServer::broadcast(const QString &message)
{
    QByteArray data = message.toUtf8();
    
    for (QLocalSocket *client : m_clients) {
        sendToClient(client, data);
    }
}

void IPCServer::onNewConnection()
{
    while (m_server->hasPendingConnections()) {
        QLocalSocket *client = m_server->nextPendingConnection();
        
        connect(client, &QLocalSocket::disconnected,
                this, &IPCServer::onClientDisconnected);
        connect(client, &QLocalSocket::readyRead,
                this, &IPCServer::onClientReadyRead);
        
        m_clients.append(client);
        
        QString clientId = getClientId(client);
        emit clientConnected(clientId);
        emit clientsChanged();
        
        qInfo() << "IPC client connected:" << clientId;
        
        // Send current session to new client
        if (!m_sessionToken.isEmpty()) {
            QJsonObject msg;
            msg["type"] = "session";
            msg["token"] = m_sessionToken;
            sendToClient(client, QJsonDocument(msg).toJson(QJsonDocument::Compact));
        }
    }
}

void IPCServer::onClientDisconnected()
{
    QLocalSocket *client = qobject_cast<QLocalSocket*>(sender());
    if (!client) return;
    
    QString clientId = getClientId(client);
    
    m_clients.removeAll(client);
    client->deleteLater();
    
    emit clientDisconnected(clientId);
    emit clientsChanged();
    
    qInfo() << "IPC client disconnected:" << clientId;
}

void IPCServer::onClientReadyRead()
{
    QLocalSocket *client = qobject_cast<QLocalSocket*>(sender());
    if (!client) return;
    
    while (client->bytesAvailable() > 0) {
        QByteArray data = client->readAll();
        handleClientMessage(client, data);
    }
}

void IPCServer::handleClientMessage(QLocalSocket *client, const QByteArray &data)
{
    QString clientId = getClientId(client);
    
    QJsonDocument doc = QJsonDocument::fromJson(data);
    if (!doc.isObject()) {
        emit messageReceived(clientId, QString::fromUtf8(data));
        return;
    }
    
    QJsonObject msg = doc.object();
    QString type = msg["type"].toString();
    
    if (type == "auth_request") {
        // Client requesting authentication
        QJsonObject response;
        response["type"] = "auth_response";
        response["token"] = m_sessionToken;
        response["success"] = !m_sessionToken.isEmpty();
        sendToClient(client, QJsonDocument(response).toJson(QJsonDocument::Compact));
    }
    else if (type == "ping") {
        QJsonObject response;
        response["type"] = "pong";
        sendToClient(client, QJsonDocument(response).toJson(QJsonDocument::Compact));
    }
    else {
        emit messageReceived(clientId, QString::fromUtf8(data));
    }
}

void IPCServer::sendToClient(QLocalSocket *client, const QByteArray &data)
{
    if (client->state() != QLocalSocket::ConnectedState) {
        return;
    }
    
    // Protocol: 4-byte length prefix + data
    quint32 length = static_cast<quint32>(data.size());
    QByteArray packet;
    packet.append(reinterpret_cast<const char*>(&length), sizeof(length));
    packet.append(data);
    
    client->write(packet);
    client->flush();
}

QString IPCServer::getClientId(QLocalSocket *client) const
{
    return QString::number(reinterpret_cast<quintptr>(client), 16);
}

bool IPCServer::setupSharedMemory()
{
    // Detach if already attached
    if (m_sharedMemory->isAttached()) {
        m_sharedMemory->detach();
    }
    
    // Create shared memory segment
    if (!m_sharedMemory->create(sizeof(SharedSession))) {
        // Try to attach to existing
        if (!m_sharedMemory->attach()) {
            qWarning() << "Failed to create/attach shared memory:" 
                       << m_sharedMemory->errorString();
            return false;
        }
    }
    
    // Initialize
    m_sharedMemory->lock();
    SharedSession *session = static_cast<SharedSession*>(m_sharedMemory->data());
    memset(session, 0, sizeof(SharedSession));
    session->magic = SHARED_SESSION_MAGIC;
    session->version = 1;
    m_sharedMemory->unlock();
    
    return true;
}

void IPCServer::updateSharedSession()
{
    if (!m_sharedMemory->isAttached()) {
        return;
    }
    
    m_sharedMemory->lock();
    SharedSession *session = static_cast<SharedSession*>(m_sharedMemory->data());
    
    session->magic = SHARED_SESSION_MAGIC;
    session->version = 1;
    session->authenticated = !m_sessionToken.isEmpty();
    
    QByteArray tokenBytes = m_sessionToken.toUtf8();
    int copyLen = qMin(tokenBytes.size(), static_cast<int>(sizeof(session->token) - 1));
    memcpy(session->token, tokenBytes.constData(), copyLen);
    session->token[copyLen] = '\0';
    
    session->timestamp = QDateTime::currentSecsSinceEpoch();
    
    m_sharedMemory->unlock();
}
