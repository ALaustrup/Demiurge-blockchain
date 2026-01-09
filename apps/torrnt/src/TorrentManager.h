/**
 * TorrentManager - Manages torrent downloads/uploads using libtorrent
 * 
 * Handles:
 * - Magnet link parsing and adding
 * - Torrent file loading
 * - Download/upload management
 * - Peer connections
 * - Blockchain integration for on-chain torrenting
 */

#ifndef TORRENT_MANAGER_H
#define TORRENT_MANAGER_H

#include <QObject>
#include <QString>
#include <QUrl>
#include <QHash>
#include <QTimer>
#include <QStandardPaths>
#include <QDir>

#ifdef TORRNT_LIBTORRENT_ENABLED
#include <libtorrent/session.hpp>
#include <libtorrent/torrent_handle.hpp>
#include <libtorrent/add_torrent_params.hpp>
#include <libtorrent/magnet_uri.hpp>
#include <libtorrent/torrent_status.hpp>
#endif

class BlockchainTorrentBridge;

class TorrentManager : public QObject
{
    Q_OBJECT
    
    Q_PROPERTY(int activeTorrents READ activeTorrents NOTIFY activeTorrentsChanged)
    Q_PROPERTY(qint64 totalDownloadSpeed READ totalDownloadSpeed NOTIFY statsUpdated)
    Q_PROPERTY(qint64 totalUploadSpeed READ totalUploadSpeed NOTIFY statsUpdated)
    Q_PROPERTY(qint64 totalDownloaded READ totalDownloaded NOTIFY statsUpdated)
    Q_PROPERTY(qint64 totalUploaded READ totalUploaded NOTIFY statsUpdated)

public:
    explicit TorrentManager(QObject *parent = nullptr);
    ~TorrentManager();

    // QML-invokable methods
    Q_INVOKABLE bool addMagnetLink(const QString &magnetUri);
    Q_INVOKABLE bool addTorrentFile(const QString &filePath);
    Q_INVOKABLE bool removeTorrent(const QString &infoHash, bool deleteFiles = false);
    Q_INVOKABLE void pauseTorrent(const QString &infoHash);
    Q_INVOKABLE void resumeTorrent(const QString &infoHash);
    Q_INVOKABLE QVariantMap getTorrentStatus(const QString &infoHash);
    Q_INVOKABLE QVariantList getAllTorrents();
    Q_INVOKABLE QString getSavePath() const;
    Q_INVOKABLE void setSavePath(const QString &path);
    
    // Properties
    int activeTorrents() const;
    qint64 totalDownloadSpeed() const;
    qint64 totalUploadSpeed() const;
    qint64 totalDownloaded() const;
    qint64 totalUploaded() const;
    
    // Blockchain integration
    void setBlockchainBridge(BlockchainTorrentBridge *bridge);
    Q_INVOKABLE void registerTorrentOnChain(const QString &infoHash, const QString &name);
    Q_INVOKABLE QVariantList searchTorrentsOnChain(const QString &query);

signals:
    void torrentAdded(const QString &infoHash, const QString &name);
    void torrentRemoved(const QString &infoHash);
    void torrentStatusChanged(const QString &infoHash, const QVariantMap &status);
    void torrentFinished(const QString &infoHash);
    void errorOccurred(const QString &error);
    void activeTorrentsChanged();
    void statsUpdated();

private slots:
    void updateStats();
    void onTorrentStatusUpdate();

private:
    void initializeSession();
    void cleanupSession();
    QString infoHashToString(const QByteArray &hash) const;
    QVariantMap torrentStatusToMap(const QString &infoHash) const;
    
#ifdef TORRNT_LIBTORRENT_ENABLED
    std::unique_ptr<libtorrent::session> m_session;
    QHash<QString, libtorrent::torrent_handle> m_torrents;
    QHash<QString, QString> m_torrentNames; // infoHash -> name
#endif
    
    BlockchainTorrentBridge *m_blockchainBridge;
    QTimer *m_statsTimer;
    QString m_savePath;
    
    // Aggregated stats
    int m_activeTorrents;
    qint64 m_totalDownloadSpeed;
    qint64 m_totalUploadSpeed;
    qint64 m_totalDownloaded;
    qint64 m_totalUploaded;
};

#endif // TORRENT_MANAGER_H
