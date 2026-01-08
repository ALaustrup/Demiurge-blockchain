/**
 * UpdateEngine Implementation
 */

#include "UpdateEngine.h"
#include "ManifestParser.h"

#include <QNetworkReply>
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QFile>
#include <QDir>
#include <QStandardPaths>
#include <QCryptographicHash>
#include <QCoreApplication>
#include <QDebug>

const QString UpdateEngine::MANIFEST_URL = "https://releases.demiurge.cloud/genesis/manifest.json";

UpdateEngine::UpdateEngine(QObject *parent)
    : QObject(parent)
    , m_networkManager(new QNetworkAccessManager(this))
    , m_checking(false)
    , m_downloading(false)
    , m_progress(0.0)
    , m_currentDownload(nullptr)
    , m_currentUpdateIndex(0)
{
}

UpdateEngine::~UpdateEngine()
{
    cancelDownload();
}

void UpdateEngine::checkForUpdates()
{
    if (m_checking || m_downloading) return;
    
    m_checking = true;
    emit checkingChanged();
    setStatus("Checking for updates...");
    
    QUrl url{getManifestUrl()};
    QNetworkRequest request{url};
    request.setHeader(QNetworkRequest::UserAgentHeader, 
                      QString("GenesisLauncher/%1").arg(APP_VERSION));
    
    QNetworkReply *reply = m_networkManager->get(request);
    
    connect(reply, &QNetworkReply::finished, [this, reply]() {
        onManifestReceived(reply);
    });
}

void UpdateEngine::downloadUpdates()
{
    if (m_pendingUpdates.isEmpty() || m_downloading) return;
    
    m_downloading = true;
    m_currentUpdateIndex = 0;
    m_progress = 0.0;
    
    emit downloadingChanged();
    
    // Start downloading first update
    downloadNextUpdate();
}

void UpdateEngine::applyUpdates()
{
    setStatus("Applying updates...");
    
    QString downloadPath = getDownloadPath();
    
    for (const ComponentUpdate &update : m_pendingUpdates) {
        QString downloadedFile = downloadPath + "/" + update.name + ".update";
        QString targetPath = QCoreApplication::applicationDirPath() + "/" + update.name;
        
        if (!QFile::exists(downloadedFile)) {
            emit error(QString("Update file not found: %1").arg(update.name));
            continue;
        }
        
        // Verify checksum
        if (!verifyChecksum(downloadedFile, update.checksum)) {
            emit error(QString("Checksum mismatch for %1").arg(update.name));
            continue;
        }
        
        if (update.isDelta) {
            // Apply delta patch
            QString tempOutput = targetPath + ".new";
            if (applyDelta(targetPath, downloadedFile, tempOutput)) {
                // Backup old and replace
                QFile::rename(targetPath, targetPath + ".bak");
                QFile::rename(tempOutput, targetPath);
                QFile::remove(targetPath + ".bak");
            }
        } else {
            // Full file replacement
            QFile::remove(targetPath + ".bak");
            QFile::rename(targetPath, targetPath + ".bak");
            QFile::copy(downloadedFile, targetPath);
        }
        
        // Clean up download
        QFile::remove(downloadedFile);
        
        emit updateApplied(update.name);
    }
    
    m_pendingUpdates.clear();
    emit updatesChanged();
    setStatus("Updates applied successfully");
}

QVariantList UpdateEngine::getPendingUpdates() const
{
    QVariantList list;
    
    for (const ComponentUpdate &update : m_pendingUpdates) {
        QVariantMap item;
        item["name"] = update.name;
        item["currentVersion"] = update.currentVersion;
        item["newVersion"] = update.newVersion;
        item["size"] = update.size;
        item["isDelta"] = update.isDelta;
        list.append(item);
    }
    
    return list;
}

void UpdateEngine::cancelDownload()
{
    if (m_currentDownload) {
        m_currentDownload->abort();
        m_currentDownload->deleteLater();
        m_currentDownload = nullptr;
    }
    
    m_downloading = false;
    emit downloadingChanged();
    setStatus("Download cancelled");
}

void UpdateEngine::onManifestReceived(QNetworkReply *reply)
{
    m_checking = false;
    emit checkingChanged();
    
    reply->deleteLater();
    
    if (reply->error() != QNetworkReply::NoError) {
        // Offline mode - assume up to date
        setStatus("Offline - using cached version");
        return;
    }
    
    QJsonDocument doc = QJsonDocument::fromJson(reply->readAll());
    QJsonObject manifest = doc.object();
    
    m_pendingUpdates.clear();
    
    // Parse components
    QJsonArray components = manifest["components"].toArray();
    for (const QJsonValue &val : components) {
        QJsonObject comp = val.toObject();
        
        QString name = comp["name"].toString();
        QString latestVersion = comp["version"].toString();
        QString currentVersion = getCurrentVersion(name);
        
        if (latestVersion > currentVersion) {
            ComponentUpdate update;
            update.name = name;
            update.currentVersion = currentVersion;
            update.newVersion = latestVersion;
            update.downloadUrl = comp["url"].toString();
            update.size = comp["size"].toVariant().toLongLong();
            update.checksum = comp["checksum"].toString();
            update.isDelta = comp["delta"].toBool(false);
            
            m_pendingUpdates.append(update);
            emit updateAvailable(name, latestVersion);
        }
    }
    
    emit updatesChanged();
    
    if (m_pendingUpdates.isEmpty()) {
        setStatus("All components up to date");
    } else {
        setStatus(QString("%1 update(s) available").arg(m_pendingUpdates.size()));
    }
}

void UpdateEngine::onDownloadProgress(qint64 received, qint64 total)
{
    if (total > 0) {
        // Calculate overall progress
        double currentFileProgress = static_cast<double>(received) / total;
        double overallProgress = (m_currentUpdateIndex + currentFileProgress) / 
                                 m_pendingUpdates.size();
        
        m_progress = overallProgress;
        emit progressChanged();
        
        // Format nice status message
        double mbReceived = received / (1024.0 * 1024.0);
        double mbTotal = total / (1024.0 * 1024.0);
        setStatus(QString("Downloading... %.1f / %.1f MB").arg(mbReceived).arg(mbTotal));
    }
}

void UpdateEngine::onDownloadFinished(QNetworkReply *reply)
{
    reply->deleteLater();
    m_currentDownload = nullptr;
    
    if (reply->error() != QNetworkReply::NoError) {
        m_downloading = false;
        emit downloadingChanged();
        emit error(QString("Download failed: %1").arg(reply->errorString()));
        return;
    }
    
    // Save downloaded file
    const ComponentUpdate &update = m_pendingUpdates[m_currentUpdateIndex];
    QString downloadPath = getDownloadPath();
    QDir().mkpath(downloadPath);
    
    QString filePath = downloadPath + "/" + update.name + ".update";
    QFile file(filePath);
    if (file.open(QIODevice::WriteOnly)) {
        file.write(reply->readAll());
        file.close();
    }
    
    // Move to next update
    m_currentUpdateIndex++;
    
    if (m_currentUpdateIndex < m_pendingUpdates.size()) {
        downloadNextUpdate();
    } else {
        m_downloading = false;
        m_progress = 1.0;
        emit downloadingChanged();
        emit progressChanged();
        emit downloadComplete();
        setStatus("Downloads complete - ready to install");
    }
}

void UpdateEngine::setStatus(const QString &message)
{
    if (m_statusMessage != message) {
        m_statusMessage = message;
        emit statusChanged();
    }
}

QString UpdateEngine::getManifestUrl() const
{
    return MANIFEST_URL;
}

QString UpdateEngine::getDownloadPath() const
{
    return QStandardPaths::writableLocation(QStandardPaths::TempLocation) + 
           "/GenesisUpdates";
}

bool UpdateEngine::verifyChecksum(const QString &filePath, const QString &expected)
{
    QFile file(filePath);
    if (!file.open(QIODevice::ReadOnly)) {
        return false;
    }
    
    QCryptographicHash hash(QCryptographicHash::Sha256);
    hash.addData(&file);
    file.close();
    
    return hash.result().toHex() == expected.toLower();
}

bool UpdateEngine::applyDelta(const QString &basePath, const QString &deltaPath,
                              const QString &outputPath)
{
    // Simplified delta patching
    // In production, use a proper binary diff library (bsdiff, Courgette, etc.)
    
    // For now, just copy the delta as a full file (placeholder)
    return QFile::copy(deltaPath, outputPath);
}

QString UpdateEngine::getCurrentVersion(const QString &component) const
{
    // Read version from installed component
    // For now return the app version
    if (component == "GenesisLauncher") {
        return QString(APP_VERSION);
    }
    
    // Check version file
    QString versionFile = QCoreApplication::applicationDirPath() + "/" + 
                          component + ".version";
    QFile file(versionFile);
    if (file.open(QIODevice::ReadOnly)) {
        QString version = QString::fromUtf8(file.readAll()).trimmed();
        file.close();
        return version;
    }
    
    return "0.0.0";
}

void UpdateEngine::downloadNextUpdate()
{
    if (m_currentUpdateIndex >= m_pendingUpdates.size()) return;
    
    const ComponentUpdate &update = m_pendingUpdates[m_currentUpdateIndex];
    setStatus(QString("Downloading %1...").arg(update.name));
    
    QUrl url{update.downloadUrl};
    QNetworkRequest request{url};
    
    m_currentDownload = m_networkManager->get(request);
    
    connect(m_currentDownload, &QNetworkReply::downloadProgress,
            this, &UpdateEngine::onDownloadProgress);
    connect(m_currentDownload, &QNetworkReply::finished, [this]() {
        onDownloadFinished(m_currentDownload);
    });
}
