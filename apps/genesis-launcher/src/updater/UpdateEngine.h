/**
 * UpdateEngine - Auto-Update System
 * 
 * Handles version checking, differential downloads, and patching.
 */

#ifndef GENESIS_UPDATE_ENGINE_H
#define GENESIS_UPDATE_ENGINE_H

#include <QObject>
#include <QString>
#include <QNetworkAccessManager>
#include <QVariantMap>
#include <QList>

struct ComponentUpdate {
    QString name;
    QString currentVersion;
    QString newVersion;
    QString downloadUrl;
    qint64 size;
    QString checksum;
    bool isDelta;
};

class UpdateEngine : public QObject
{
    Q_OBJECT
    
    Q_PROPERTY(bool isChecking READ isChecking NOTIFY checkingChanged)
    Q_PROPERTY(bool isDownloading READ isDownloading NOTIFY downloadingChanged)
    Q_PROPERTY(bool hasUpdates READ hasUpdates NOTIFY updatesChanged)
    Q_PROPERTY(double downloadProgress READ downloadProgress NOTIFY progressChanged)
    Q_PROPERTY(QString statusMessage READ statusMessage NOTIFY statusChanged)

public:
    explicit UpdateEngine(QObject *parent = nullptr);
    ~UpdateEngine();
    
    bool isChecking() const { return m_checking; }
    bool isDownloading() const { return m_downloading; }
    bool hasUpdates() const { return !m_pendingUpdates.isEmpty(); }
    double downloadProgress() const { return m_progress; }
    QString statusMessage() const { return m_statusMessage; }

public slots:
    /**
     * Check for updates
     */
    Q_INVOKABLE void checkForUpdates();
    
    /**
     * Download all pending updates
     */
    Q_INVOKABLE void downloadUpdates();
    
    /**
     * Apply downloaded updates
     */
    Q_INVOKABLE void applyUpdates();
    
    /**
     * Get list of pending updates
     */
    Q_INVOKABLE QVariantList getPendingUpdates() const;
    
    /**
     * Cancel download
     */
    Q_INVOKABLE void cancelDownload();

signals:
    void checkingChanged();
    void downloadingChanged();
    void updatesChanged();
    void progressChanged();
    void statusChanged();
    
    void updateAvailable(const QString &component, const QString &newVersion);
    void downloadComplete();
    void updateApplied(const QString &component);
    void error(const QString &message);

private slots:
    void onManifestReceived(QNetworkReply *reply);
    void onDownloadProgress(qint64 received, qint64 total);
    void onDownloadFinished(QNetworkReply *reply);

private:
    void setStatus(const QString &message);
    QString getManifestUrl() const;
    QString getDownloadPath() const;
    bool verifyChecksum(const QString &filePath, const QString &expected);
    bool applyDelta(const QString &basePath, const QString &deltaPath, 
                    const QString &outputPath);
    QString getCurrentVersion(const QString &component) const;
    void downloadNextUpdate();
    
    QNetworkAccessManager *m_networkManager;
    QList<ComponentUpdate> m_pendingUpdates;
    
    bool m_checking;
    bool m_downloading;
    double m_progress;
    QString m_statusMessage;
    
    QNetworkReply *m_currentDownload;
    int m_currentUpdateIndex;
    
    static const QString MANIFEST_URL;
};

#endif // GENESIS_UPDATE_ENGINE_H
