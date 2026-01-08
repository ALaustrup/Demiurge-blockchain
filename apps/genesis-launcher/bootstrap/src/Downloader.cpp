/**
 * Downloader Implementation
 */

#include "Downloader.h"

#include <QNetworkReply>
#include <QFile>

const QString Downloader::LAUNCHER_URL = 
    "https://releases.demiurge.cloud/genesis/latest/GenesisLauncher";

Downloader::Downloader(QObject *parent)
    : QObject(parent)
    , m_networkManager(new QNetworkAccessManager(this))
{
}

void Downloader::downloadLauncher(const QString &targetPath)
{
    m_targetPath = targetPath;
    
    emit statusChanged("Connecting to Demiurge servers...");
    
#ifdef Q_OS_WIN
    QString url = LAUNCHER_URL + ".exe";
#elif defined(Q_OS_MAC)
    QString url = LAUNCHER_URL + ".app.zip";
#else
    QString url = LAUNCHER_URL;
#endif
    
    QUrl requestUrl{url};
    QNetworkRequest request{requestUrl};
    request.setHeader(QNetworkRequest::UserAgentHeader, "GenesisSeed/1.0");
    
    QNetworkReply *reply = m_networkManager->get(request);
    
    connect(reply, &QNetworkReply::downloadProgress,
            [this](qint64 received, qint64 total) {
        if (total > 0) {
            double percent = (static_cast<double>(received) / total) * 100.0;
            emit progressChanged(percent);
            
            double mb = received / (1024.0 * 1024.0);
            double totalMb = total / (1024.0 * 1024.0);
            emit statusChanged(QString("Downloading... %1 / %2 MB")
                .arg(mb, 0, 'f', 1)
                .arg(totalMb, 0, 'f', 1));
        }
    });
    
    connect(reply, &QNetworkReply::finished, [this, reply]() {
        reply->deleteLater();
        
        if (reply->error() != QNetworkReply::NoError) {
            emit downloadFailed(reply->errorString());
            return;
        }
        
        // Save to file
        QFile file(m_targetPath);
        if (!file.open(QIODevice::WriteOnly)) {
            emit downloadFailed("Failed to create launcher file");
            return;
        }
        
        file.write(reply->readAll());
        file.close();
        
        // Make executable on Unix
#ifndef Q_OS_WIN
        file.setPermissions(file.permissions() | 
            QFile::ExeOwner | QFile::ExeGroup | QFile::ExeOther);
#endif
        
        emit statusChanged("Download complete!");
        emit downloadComplete();
    });
}
