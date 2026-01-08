/**
 * IPCClient - IPC Client for Child Processes
 * 
 * Used by DemiurgeMiner and QOR Desktop to connect to Genesis Launcher
 * for SSO authentication.
 */

#ifndef GENESIS_IPC_CLIENT_H
#define GENESIS_IPC_CLIENT_H

#include <QObject>
#include <QLocalSocket>
#include <QSharedMemory>
#include <QTimer>

class IPCClient : public QObject
{
    Q_OBJECT
    
    Q_PROPERTY(bool isConnected READ isConnected NOTIFY connectionChanged)
    Q_PROPERTY(QString sessionToken READ sessionToken NOTIFY sessionChanged)

public:
    explicit IPCClient(QObject *parent = nullptr);
    ~IPCClient();
    
    bool isConnected() const { return m_connected; }
    QString sessionToken() const { return m_sessionToken; }
    
public slots:
    /**
     * Connect to Genesis Launcher
     */
    Q_INVOKABLE bool connectToLauncher();
    
    /**
     * Disconnect from launcher
     */
    Q_INVOKABLE void disconnect();
    
    /**
     * Request authentication token
     */
    Q_INVOKABLE void requestAuth();
    
    /**
     * Try to read session from shared memory (fast path)
     */
    Q_INVOKABLE bool trySharedMemory();
    
    /**
     * Send message to launcher
     */
    Q_INVOKABLE void sendMessage(const QString &message);

signals:
    void connectionChanged();
    void sessionChanged();
    void authenticated(const QString &token);
    void messageReceived(const QString &message);
    void error(const QString &error);

private slots:
    void onConnected();
    void onDisconnected();
    void onReadyRead();
    void onError(QLocalSocket::LocalSocketError error);
    void onReconnectTimer();

private:
    void handleMessage(const QByteArray &data);
    
    QLocalSocket *m_socket;
    QSharedMemory *m_sharedMemory;
    QTimer *m_reconnectTimer;
    
    QString m_sessionToken;
    bool m_connected;
    QByteArray m_readBuffer;
    
    static const QString SERVER_NAME;
    static const QString SHARED_MEM_KEY;
};

#endif // GENESIS_IPC_CLIENT_H
