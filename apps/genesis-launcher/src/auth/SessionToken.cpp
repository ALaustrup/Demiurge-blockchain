/**
 * SessionToken Implementation
 */

#include "SessionToken.h"

#include <QUuid>
#include <QCryptographicHash>
#include <QRandomGenerator>

SessionToken::SessionToken(QObject *parent)
    : QObject(parent)
{
}

SessionToken::~SessionToken()
{
    // Securely clear the token from memory
    m_token.fill('0');
    m_token.clear();
}

bool SessionToken::isValid() const
{
    if (m_token.isEmpty()) {
        return false;
    }
    
    if (m_expiry.isValid() && m_expiry < QDateTime::currentDateTime()) {
        return false;
    }
    
    return true;
}

void SessionToken::setToken(const QString &token)
{
    if (m_token != token) {
        m_token = token;
        emit tokenChanged();
    }
}

void SessionToken::setExpiry(const QDateTime &expiry)
{
    m_expiry = expiry;
}

void SessionToken::clear()
{
    m_token.fill('0');
    m_token.clear();
    m_expiry = QDateTime();
    emit tokenChanged();
}

void SessionToken::generateLocal()
{
    // Generate a secure local token
    QByteArray randomData;
    randomData.resize(32);
    
    for (int i = 0; i < 32; ++i) {
        randomData[i] = static_cast<char>(QRandomGenerator::global()->bounded(256));
    }
    
    QByteArray hash = QCryptographicHash::hash(
        randomData + QUuid::createUuid().toByteArray(),
        QCryptographicHash::Sha256
    );
    
    m_token = "local_" + hash.toHex();
    m_expiry = QDateTime::currentDateTime().addDays(7);
    
    emit tokenChanged();
}

QByteArray SessionToken::toBytes() const
{
    QByteArray data;
    data.append(m_token.toUtf8());
    data.append('\0');
    data.append(QString::number(m_expiry.toSecsSinceEpoch()).toUtf8());
    return data;
}
