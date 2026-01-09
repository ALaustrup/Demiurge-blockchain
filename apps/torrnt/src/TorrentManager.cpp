#include "TorrentManager.h"
#include "blockchain/BlockchainTorrentBridge.h"
#include <QDebug>
#include <QStandardPaths>
#include <QDir>
#include <QJsonObject>
#include <QJsonDocument>

TorrentManager::TorrentManager(QObject *parent)
    : QObject(parent)
    , m_blockchainBridge(nullptr)
    , m_statsTimer(new QTimer(this))
    , m_activeTorrents(0)
    , m_totalDownloadSpeed(0)
    , m_totalUploadSpeed(0)
    , m_totalDownloaded(0)
    , m_totalUploaded(0)
{
    // Set default save path
    QString downloadsPath = QStandardPaths::writableLocation(QStandardPaths::DownloadLocation);
    m_savePath = QDir(downloadsPath).filePath("TORRNT");
    QDir().mkpath(m_savePath);
    
    // Setup stats update timer
    m_statsTimer->setInterval(1000); // Update every second
    connect(m_statsTimer, &QTimer::timeout, this, &TorrentManager::updateStats);
    
    initializeSession();
    m_statsTimer->start();
}

TorrentManager::~TorrentManager()
{
    cleanupSession();
}

void TorrentManager::initializeSession()
{
#ifdef TORRNT_LIBTORRENT_ENABLED
    if (!m_session) {
        libtorrent::settings_pack settings;
        settings.set_int(libtorrent::settings_pack::alert_mask,
            libtorrent::alert::error_notification |
            libtorrent::alert::status_notification |
            libtorrent::alert::storage_notification);
        
        settings.set_str(libtorrent::settings_pack::user_agent, "TORRNT/1.0");
        settings.set_int(libtorrent::settings_pack::download_rate_limit, 0); // Unlimited
        settings.set_int(libtorrent::settings_pack::upload_rate_limit, 0); // Unlimited
        settings.set_bool(libtorrent::settings_pack::enable_dht, true);
        settings.set_bool(libtorrent::settings_pack::enable_lsd, true);
        settings.set_bool(libtorrent::settings_pack::enable_natpmp, true);
        settings.set_bool(libtorrent::settings_pack::enable_upnp, true);
        
        m_session = std::make_unique<libtorrent::session>(settings);
        
        qDebug() << "[TORRNT] Session initialized";
    }
#else
    qWarning() << "[TORRNT] libtorrent not available - torrenting disabled";
#endif
}

void TorrentManager::cleanupSession()
{
#ifdef TORRNT_LIBTORRENT_ENABLED
    if (m_session) {
        // Pause all torrents
        for (auto it = m_torrents.begin(); it != m_torrents.end(); ++it) {
            it.value().pause();
        }
        m_session.reset();
        qDebug() << "[TORRNT] Session cleaned up";
    }
#endif
}

bool TorrentManager::addMagnetLink(const QString &magnetUriStr)
{
#ifdef TORRNT_LIBTORRENT_ENABLED
    if (!m_session) {
        emit errorOccurred("Session not initialized");
        return false;
    }
    
    try {
        std::string magnetStr = magnetUriStr.toStdString();
        libtorrent::error_code ec;
        libtorrent::add_torrent_params params = libtorrent::parse_magnet_uri(magnetStr, ec);
        
        if (ec) {
            QString error = QString("Failed to parse magnet link: %1").arg(ec.message().c_str());
            emit errorOccurred(error);
            return false;
        }
        
        params.save_path = m_savePath.toStdString();
        
        libtorrent::torrent_handle handle = m_session->add_torrent(std::move(params), ec);
        
        if (ec) {
            QString error = QString("Failed to add torrent: %1").arg(ec.message().c_str());
            emit errorOccurred(error);
            return false;
        }
        
        QString infoHash = infoHashToString(QByteArray::fromRawData(
            reinterpret_cast<const char*>(handle.info_hash().data()), 20));
        
        m_torrents[infoHash] = handle;
        
        // Extract name from magnet URI if available
        QString name = magnetUriStr;
        if (name.contains("&dn=")) {
            int start = name.indexOf("&dn=") + 4;
            int end = name.indexOf("&", start);
            if (end == -1) end = name.length();
            name = QUrl::fromPercentEncoding(name.mid(start, end - start).toUtf8());
        } else {
            name = QString("Torrent %1").arg(infoHash.left(8));
        }
        
        m_torrentNames[infoHash] = name;
        
        emit torrentAdded(infoHash, name);
        emit activeTorrentsChanged();
        
        qDebug() << "[TORRNT] Added magnet link:" << name << "(" << infoHash << ")";
        return true;
        
    } catch (const std::exception &e) {
        QString error = QString("Exception: %1").arg(e.what());
        emit errorOccurred(error);
        return false;
    }
#else
    emit errorOccurred("libtorrent not available");
    return false;
#endif
}

bool TorrentManager::addTorrentFile(const QString &filePath)
{
#ifdef TORRNT_LIBTORRENT_ENABLED
    if (!m_session) {
        emit errorOccurred("Session not initialized");
        return false;
    }
    
    try {
        libtorrent::add_torrent_params params;
        std::string filePathStr = filePath.toStdString();
        params.ti = std::make_shared<libtorrent::torrent_info>(filePathStr);
        params.save_path = m_savePath.toStdString();
        
        libtorrent::error_code ec;
        libtorrent::torrent_handle handle = m_session->add_torrent(std::move(params), ec);
        
        if (ec) {
            QString error = QString("Failed to add torrent file: %1").arg(ec.message().c_str());
            emit errorOccurred(error);
            return false;
        }
        
        QString infoHash = infoHashToString(QByteArray::fromRawData(
            reinterpret_cast<const char*>(handle.info_hash().data()), 20));
        
        m_torrents[infoHash] = handle;
        m_torrentNames[infoHash] = handle.status().name.c_str();
        
        emit torrentAdded(infoHash, m_torrentNames[infoHash]);
        emit activeTorrentsChanged();
        
        qDebug() << "[TORRNT] Added torrent file:" << m_torrentNames[infoHash];
        return true;
        
    } catch (const std::exception &e) {
        QString error = QString("Exception: %1").arg(e.what());
        emit errorOccurred(error);
        return false;
    }
#else
    emit errorOccurred("libtorrent not available");
    return false;
#endif
}

bool TorrentManager::removeTorrent(const QString &infoHash, bool deleteFiles)
{
#ifdef TORRNT_LIBTORRENT_ENABLED
    if (!m_torrents.contains(infoHash)) {
        return false;
    }
    
    libtorrent::torrent_handle handle = m_torrents[infoHash];
    
    if (deleteFiles) {
        m_session->remove_torrent(handle, libtorrent::session::delete_files);
    } else {
        m_session->remove_torrent(handle);
    }
    
    m_torrents.remove(infoHash);
    m_torrentNames.remove(infoHash);
    
    emit torrentRemoved(infoHash);
    emit activeTorrentsChanged();
    
    return true;
#else
    Q_UNUSED(infoHash)
    Q_UNUSED(deleteFiles)
    return false;
#endif
}

void TorrentManager::pauseTorrent(const QString &infoHash)
{
#ifdef TORRNT_LIBTORRENT_ENABLED
    if (m_torrents.contains(infoHash)) {
        m_torrents[infoHash].pause();
        emit torrentStatusChanged(infoHash, torrentStatusToMap(infoHash));
    }
#else
    Q_UNUSED(infoHash)
#endif
}

void TorrentManager::resumeTorrent(const QString &infoHash)
{
#ifdef TORRNT_LIBTORRENT_ENABLED
    if (m_torrents.contains(infoHash)) {
        m_torrents[infoHash].resume();
        emit torrentStatusChanged(infoHash, torrentStatusToMap(infoHash));
    }
#else
    Q_UNUSED(infoHash)
#endif
}

QVariantMap TorrentManager::getTorrentStatus(const QString &infoHash)
{
    return torrentStatusToMap(infoHash);
}

QVariantList TorrentManager::getAllTorrents()
{
    QVariantList result;
    
#ifdef TORRNT_LIBTORRENT_ENABLED
    for (auto it = m_torrents.begin(); it != m_torrents.end(); ++it) {
        result.append(torrentStatusToMap(it.key()));
    }
#endif
    
    return result;
}

QString TorrentManager::getSavePath() const
{
    return m_savePath;
}

void TorrentManager::setSavePath(const QString &path)
{
    if (m_savePath != path) {
        QDir dir(path);
        if (!dir.exists()) {
            dir.mkpath(".");
        }
        m_savePath = path;
    }
}

int TorrentManager::activeTorrents() const
{
    return m_activeTorrents;
}

qint64 TorrentManager::totalDownloadSpeed() const
{
    return m_totalDownloadSpeed;
}

qint64 TorrentManager::totalUploadSpeed() const
{
    return m_totalUploadSpeed;
}

qint64 TorrentManager::totalDownloaded() const
{
    return m_totalDownloaded;
}

qint64 TorrentManager::totalUploaded() const
{
    return m_totalUploaded;
}

void TorrentManager::setBlockchainBridge(BlockchainTorrentBridge *bridge)
{
    m_blockchainBridge = bridge;
}

void TorrentManager::registerTorrentOnChain(const QString &infoHash, const QString &name)
{
    if (m_blockchainBridge) {
        m_blockchainBridge->registerTorrent(infoHash, name);
    }
}

QVariantList TorrentManager::searchTorrentsOnChain(const QString &query)
{
    if (m_blockchainBridge) {
        return m_blockchainBridge->searchTorrents(query);
    }
    return QVariantList();
}

void TorrentManager::updateStats()
{
#ifdef TORRNT_LIBTORRENT_ENABLED
    if (!m_session) return;
    
    int active = 0;
    qint64 totalDlSpeed = 0;
    qint64 totalUpSpeed = 0;
    qint64 totalDl = 0;
    qint64 totalUp = 0;
    
    for (auto it = m_torrents.begin(); it != m_torrents.end(); ++it) {
        libtorrent::torrent_status status = it.value().status();
        
        if (status.state != libtorrent::torrent_status::finished) {
            active++;
        }
        
        totalDlSpeed += status.download_rate;
        totalUpSpeed += status.upload_rate;
        totalDl += status.total_download;
        totalUp += status.total_upload;
        
        // Check if finished
        if (status.state == libtorrent::torrent_status::finished && 
            status.progress >= 1.0) {
            emit torrentFinished(it.key());
        }
        
        // Emit status update
        emit torrentStatusChanged(it.key(), torrentStatusToMap(it.key()));
    }
    
    bool changed = false;
    if (m_activeTorrents != active) {
        m_activeTorrents = active;
        changed = true;
        emit activeTorrentsChanged();
    }
    if (m_totalDownloadSpeed != totalDlSpeed) {
        m_totalDownloadSpeed = totalDlSpeed;
        changed = true;
    }
    if (m_totalUploadSpeed != totalUpSpeed) {
        m_totalUploadSpeed = totalUpSpeed;
        changed = true;
    }
    if (m_totalDownloaded != totalDl) {
        m_totalDownloaded = totalDl;
        changed = true;
    }
    if (m_totalUploaded != totalUp) {
        m_totalUploaded = totalUp;
        changed = true;
    }
    
    if (changed) {
        emit statsUpdated();
    }
#endif
}

QVariantMap TorrentManager::torrentStatusToMap(const QString &infoHash) const
{
    QVariantMap status;
    
#ifdef TORRNT_LIBTORRENT_ENABLED
    if (!m_torrents.contains(infoHash)) {
        return status;
    }
    
    libtorrent::torrent_status ts = m_torrents[infoHash].status();
    
    status["infoHash"] = infoHash;
    status["name"] = m_torrentNames.value(infoHash, QString::fromStdString(ts.name));
    status["progress"] = ts.progress;
    status["downloadRate"] = static_cast<qint64>(ts.download_rate);
    status["uploadRate"] = static_cast<qint64>(ts.upload_rate);
    status["totalDownloaded"] = static_cast<qint64>(ts.total_download);
    status["totalUploaded"] = static_cast<qint64>(ts.total_upload);
    status["numPeers"] = ts.num_peers;
    status["numSeeds"] = ts.num_seeds;
    status["state"] = static_cast<int>(ts.state);
    status["isPaused"] = (ts.flags & libtorrent::torrent_flags::paused) != 0;
    status["isFinished"] = (ts.state == libtorrent::torrent_status::finished);
    status["totalSize"] = static_cast<qint64>(ts.total);
    status["remainingSize"] = static_cast<qint64>(ts.total_wanted - ts.total_wanted_done);
#else
    Q_UNUSED(infoHash)
#endif
    
    return status;
}

QString TorrentManager::infoHashToString(const QByteArray &hash) const
{
    return hash.toHex().toUpper();
}
