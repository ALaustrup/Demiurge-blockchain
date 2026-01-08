/**
 * IPCServer - Inter-Process Communication Server
 * 
 * Provides SSO (Single Sign-On) to child processes (Miner, QOR Desktop).
 * Uses QLocalServer for secure local-only communication.
 */

#ifndef GENESIS_IPC_SERVER_H
#define GENESIS_IPC_SERVER_H

#include <QObject>
#include <QLocalServer>
#include <QLocalSocket>
#include <QSharedMemory>
#include <QList>

class IPCServer : public QObject
{
    Q_OBJECT
    
    Q_PROPERTY(bool isRunning READ isRunning NOTIFY runningChanged)
    Q_PROPERTY(int connectedClients READ connectedClients NOTIFY clientsChanged)

public:
    explicit IPCServer(QObject *parent = nullptr);
    ~IPCServer();
    
    bool isRunning() const { return m_running; }
    int connectedClients() const { return m_clients.size(); }
    
public slots:
    /**
     * Start the IPC server
     */
    Q_INVOKABLE bool start(quint16 port = 31337);
    
    /**
     * Stop the server
     */
    Q_INVOKABLE void stop();
    
    /**
     * Set the session token to share with clients
     */
    Q_INVOKABLE void setSessionToken(const QString &token);
    
    /**
     * Broadcast message to all clients
     */
    Q_INVOKABLE void broadcast(const QString &message);

signals:
    void runningChanged();
    void clientsChanged();
    void clientConnected(const QString &clientId);
    void clientDisconnected(const QString &clientId);
    void messageReceived(const QString &clientId, const QString &message);

private slots:
    void onNewConnection();
    void onClientDisconnected();
    void onClientReadyRead();

private:
    void handleClientMessage(QLocalSocket *client, const QByteArray &data);
    void sendToClient(QLocalSocket *client, const QByteArray &data);
    QString getClientId(QLocalSocket *client) const;
    
    bool setupSharedMemory();
    void updateSharedSession();
    
    QLocalServer *m_server;
    QSharedMemory *m_sharedMemory;
    QList<QLocalSocket*> m_clients;
    
    QString m_sessionToken;
    bool m_running;
    
    static const QString SERVER_NAME;
    static const QString SHARED_MEM_KEY;
};

#endif // GENESIS_IPC_SERVER_H
