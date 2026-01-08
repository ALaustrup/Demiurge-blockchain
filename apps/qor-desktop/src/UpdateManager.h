/**
 * UpdateManager - Auto-Update System
 * 
 * Checks for and downloads application updates.
 */

#ifndef UPDATEMANAGER_H
#define UPDATEMANAGER_H

#include <QObject>
#include <QString>

class QNetworkAccessManager;

class UpdateManager : public QObject
{
    Q_OBJECT

public:
    explicit UpdateManager(QObject *parent = nullptr);
    ~UpdateManager();

    Q_INVOKABLE void checkForUpdates();
    Q_INVOKABLE void downloadUpdate();
    Q_INVOKABLE void installUpdate();
    
    QString currentVersion() const { return m_currentVersion; }
    QString newVersion() const { return m_newVersion; }
    bool updateAvailable() const { return m_updateAvailable; }

signals:
    void updateAvailable(const QString &version, const QString &changelog);
    void noUpdateAvailable();
    void downloadProgress(int percent);
    void downloadComplete();
    void updateReady();
    void updateError(const QString &error);

private:
    QNetworkAccessManager *m_networkManager;
    QString m_updateUrl = "https://releases.demiurge.cloud/desktop/";
    QString m_currentVersion;
    QString m_newVersion;
    QString m_downloadUrl;
    QString m_changelog;
    bool m_updateAvailable = false;
};

#endif // UPDATEMANAGER_H
