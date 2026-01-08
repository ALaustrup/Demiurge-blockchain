/**
 * Downloader - Launcher Download Handler
 */

#ifndef DOWNLOADER_H
#define DOWNLOADER_H

#include <QObject>
#include <QNetworkAccessManager>

class Downloader : public QObject
{
    Q_OBJECT

public:
    explicit Downloader(QObject *parent = nullptr);
    
    void downloadLauncher(const QString &targetPath);

signals:
    void progressChanged(double percent);
    void statusChanged(const QString &message);
    void downloadComplete();
    void downloadFailed(const QString &error);

private:
    QNetworkAccessManager *m_networkManager;
    QString m_targetPath;
    
    static const QString LAUNCHER_URL;
};

#endif // DOWNLOADER_H
