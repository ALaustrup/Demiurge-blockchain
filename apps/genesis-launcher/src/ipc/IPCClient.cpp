/**
 * IPCClient Implementation
 */

#include "IPCClient.h"
#include "SharedSession.h"

#include <QJsonDocument>
#include <QJsonObject>
#include <QDebug>

const QString IPCClient::SERVER_NAME = "GenesisLauncherIPC";
const QString IPCClient::SHARED_MEM_KEY = "GenesisSession";

IPCClient::IPCClient(QObject *parent)
    : QObject(parent)
    , m_socket(new QLocalSocket(this))
    , m_sharedMemory(new QSharedMemory(SHARED_MEM_KEY, this))
    , m_reconnectTimer(new QTimer(this))
    , m_connected(false)
{
    connect(m_socket, &QLocalSocket::connected,
            this, &IPCClient::onConnected);
    connect(m_socket, &QLocalSocket::disconnected,
            this, &IPCClient::onDisconnected);
    connect(m_socket, &QLocalSocket::readyRead,
            this, &IPCClient::onReadyRead);
    connect(m_socket, &QLocalSocket::errorOccurred,
            this, &IPCClient::onError);
    
    m_reconnectTimer->setInterval(5000);
    connect(m_reconnectTimer, &QTimer::timeout,
            this, &IPCClient::onReconnectTimer);
}

IPCClient::~IPCClient()
{
    disconnect();
}

bool IPCClient::connectToLauncher()
{
    // First try shared memory (fast path)
    if (trySharedMemory()) {
        return true;
    }
    
    // Fall back to socket connection
    m_socket->connectToServer(SERVER_NAME);
    return m_socket->waitForConnected(3000);
}

void IPCClient::disconnect()
{
    m_reconnectTimer->stop();
    
    if (m_socket->state() == QLocalSocket::ConnectedState) {
        m_socket->disconnectFromServer();
    }
    
    if (m_sharedMemory->isAttached()) {
        m_sharedMemory->detach();
    }
}

void IPCClient::requestAuth()
{
    if (!m_connected) {
        emit error("Not connected to launcher");
        return;
    }
    
    QJsonObject msg;
    msg["type"] = "auth_request";
    
    QByteArray data = QJsonDocument(msg).toJson(QJsonDocument::Compact);
    
    // Protocol: 4-byte length prefix
    quint32 length = static_cast<quint32>(data.size());
    QByteArray packet;
    packet.append(reinterpret_cast<const char*>(&length), sizeof(length));
    packet.append(data);
    
    m_socket->write(packet);
    m_socket->flush();
}

bool IPCClient::trySharedMemory()
{
    if (!m_sharedMemory->attach(QSharedMemory::ReadOnly)) {
        return false;
    }
    
    m_sharedMemory->lock();
    const SharedSession *session = static_cast<const SharedSession*>(
        m_sharedMemory->constData());
    
    bool success = false;
    
    if (session->magic == SHARED_SESSION_MAGIC && session->authenticated) {
        m_sessionToken = QString::fromUtf8(session->token);
        success = true;
    }
    
    m_sharedMemory->unlock();
    m_sharedMemory->detach();
    
    if (success) {
        emit sessionChanged();
        emit authenticated(m_sessionToken);
    }
    
    return success;
}

void IPCClient::sendMessage(const QString &message)
{
    if (!m_connected) {
        emit error("Not connected");
        return;
    }
    
    QByteArray data = message.toUtf8();
    quint32 length = static_cast<quint32>(data.size());
    QByteArray packet;
    packet.append(reinterpret_cast<const char*>(&length), sizeof(length));
    packet.append(data);
    
    m_socket->write(packet);
    m_socket->flush();
}

void IPCClient::onConnected()
{
    m_connected = true;
    m_reconnectTimer->stop();
    emit connectionChanged();
    
    qInfo() << "Connected to Genesis Launcher";
    
    // Request authentication immediately
    requestAuth();
}

void IPCClient::onDisconnected()
{
    m_connected = false;
    emit connectionChanged();
    
    qInfo() << "Disconnected from Genesis Launcher";
    
    // Start reconnection attempts
    m_reconnectTimer->start();
}

void IPCClient::onReadyRead()
{
    m_readBuffer.append(m_socket->readAll());
    
    // Parse messages (4-byte length prefix protocol)
    while (m_readBuffer.size() >= 4) {
        quint32 length = *reinterpret_cast<const quint32*>(m_readBuffer.constData());
        
        if (m_readBuffer.size() < static_cast<int>(4 + length)) {
            break;  // Wait for more data
        }
        
        QByteArray messageData = m_readBuffer.mid(4, length);
        m_readBuffer.remove(0, 4 + length);
        
        handleMessage(messageData);
    }
}

void IPCClient::onError(QLocalSocket::LocalSocketError socketError)
{
    QString errorMsg;
    
    switch (socketError) {
    case QLocalSocket::ConnectionRefusedError:
        errorMsg = "Connection refused - Genesis Launcher may not be running";
        break;
    case QLocalSocket::ServerNotFoundError:
        errorMsg = "Launcher not found";
        break;
    default:
        errorMsg = m_socket->errorString();
        break;
    }
    
    qWarning() << "IPC Client error:" << errorMsg;
    emit error(errorMsg);
    
    // Start reconnection timer
    if (!m_reconnectTimer->isActive()) {
        m_reconnectTimer->start();
    }
}

void IPCClient::onReconnectTimer()
{
    qInfo() << "Attempting to reconnect to Genesis Launcher...";
    connectToLauncher();
}

void IPCClient::handleMessage(const QByteArray &data)
{
    QJsonDocument doc = QJsonDocument::fromJson(data);
    
    if (!doc.isObject()) {
        emit messageReceived(QString::fromUtf8(data));
        return;
    }
    
    QJsonObject msg = doc.object();
    QString type = msg["type"].toString();
    
    if (type == "auth_response" || type == "session" || type == "session_update") {
        if (msg["success"].toBool(true)) {
            m_sessionToken = msg["token"].toString();
            emit sessionChanged();
            emit authenticated(m_sessionToken);
            qInfo() << "Received session token from launcher";
        }
    }
    else if (type == "pong") {
        // Heartbeat response
    }
    else {
        emit messageReceived(QString::fromUtf8(data));
    }
}
