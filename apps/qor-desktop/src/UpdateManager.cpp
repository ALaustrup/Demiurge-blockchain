/**
 * UpdateManager Implementation
 */

#include "UpdateManager.h"

#include <QNetworkAccessManager>
#include <QNetworkRequest>
#include <QNetworkReply>
#include <QJsonDocument>
#include <QJsonObject>
#include <QVersionNumber>
#include <QDebug>

UpdateManager::UpdateManager(QObject *parent)
    : QObject(parent)
    , m_networkManager(new QNetworkAccessManager(this))
    , m_currentVersion(APP_VERSION)
{
}

UpdateManager::~UpdateManager()
{
}

void UpdateManager::checkForUpdates()
{
    QNetworkRequest request(QUrl(m_updateUrl + "latest.json"));
    
    QNetworkReply *reply = m_networkManager->get(request);
    
    connect(reply, &QNetworkReply::finished, [this, reply]() {
        reply->deleteLater();
        
        if (reply->error() != QNetworkReply::NoError) {
            emit updateError(tr("Failed to check for updates: %1").arg(reply->errorString()));
            return;
        }
        
        QJsonDocument doc = QJsonDocument::fromJson(reply->readAll());
        QJsonObject info = doc.object();
        
        QString latestVersion = info["version"].toString();
        m_changelog = info["changelog"].toString();
        m_downloadUrl = info["download_url"].toString();
        
        // Compare versions
        QVersionNumber current = QVersionNumber::fromString(m_currentVersion);
        QVersionNumber latest = QVersionNumber::fromString(latestVersion);
        
        if (latest > current) {
            m_newVersion = latestVersion;
            m_updateAvailable = true;
            emit updateAvailable(latestVersion, m_changelog);
        } else {
            m_updateAvailable = false;
            emit noUpdateAvailable();
        }
    });
}

void UpdateManager::downloadUpdate()
{
    if (!m_updateAvailable || m_downloadUrl.isEmpty()) {
        emit updateError(tr("No update available to download"));
        return;
    }
    
    QNetworkRequest request(QUrl(m_downloadUrl));
    QNetworkReply *reply = m_networkManager->get(request);
    
    connect(reply, &QNetworkReply::downloadProgress,
            [this](qint64 received, qint64 total) {
        if (total > 0) {
            int percent = static_cast<int>((received * 100) / total);
            emit downloadProgress(percent);
        }
    });
    
    connect(reply, &QNetworkReply::finished, [this, reply]() {
        reply->deleteLater();
        
        if (reply->error() != QNetworkReply::NoError) {
            emit updateError(tr("Failed to download update: %1").arg(reply->errorString()));
            return;
        }
        
        // Save to temp directory
        // In production, verify signature before saving
        QByteArray data = reply->readAll();
        
        // TODO: Save to file and verify
        
        emit downloadComplete();
        emit updateReady();
    });
}

void UpdateManager::installUpdate()
{
    // In production, this would:
    // 1. Close the application
    // 2. Run the installer/updater
    // 3. Restart the application
    
    emit updateError(tr("Auto-install not implemented yet. Please download manually."));
}
