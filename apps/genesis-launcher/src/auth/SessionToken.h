/**
 * SessionToken - Secure Session Management
 * 
 * Holds the authentication token in secure memory.
 */

#ifndef GENESIS_SESSION_TOKEN_H
#define GENESIS_SESSION_TOKEN_H

#include <QObject>
#include <QString>
#include <QDateTime>
#include <QByteArray>

class SessionToken : public QObject
{
    Q_OBJECT
    
    Q_PROPERTY(bool isValid READ isValid NOTIFY tokenChanged)
    Q_PROPERTY(QString token READ token NOTIFY tokenChanged)

public:
    explicit SessionToken(QObject *parent = nullptr);
    ~SessionToken();
    
    bool isValid() const;
    QString token() const { return m_token; }
    QDateTime expiry() const { return m_expiry; }
    
    void setToken(const QString &token);
    void setExpiry(const QDateTime &expiry);
    void clear();
    
    /**
     * Generate a local session token (for offline mode)
     */
    void generateLocal();
    
    /**
     * Get token as bytes for IPC transmission
     */
    QByteArray toBytes() const;

signals:
    void tokenChanged();

private:
    QString m_token;
    QDateTime m_expiry;
};

#endif // GENESIS_SESSION_TOKEN_H
