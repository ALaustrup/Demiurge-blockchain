/**
 * SystemMonitor.h - Real-time System Metrics
 * 
 * Provides CPU, RAM, Network, and Disk usage statistics
 * for display in QOR Desktop widgets and status bar.
 */

#pragma once

#include <QObject>
#include <QTimer>
#include <QVariantMap>

namespace QOR {

class SystemMonitor : public QObject
{
    Q_OBJECT
    
    // CPU metrics
    Q_PROPERTY(double cpuUsage READ cpuUsage NOTIFY cpuUsageChanged)
    Q_PROPERTY(int cpuCores READ cpuCores CONSTANT)
    Q_PROPERTY(QString cpuName READ cpuName CONSTANT)
    
    // Memory metrics
    Q_PROPERTY(double memoryUsage READ memoryUsage NOTIFY memoryUsageChanged)
    Q_PROPERTY(qint64 totalMemoryMB READ totalMemoryMB CONSTANT)
    Q_PROPERTY(qint64 usedMemoryMB READ usedMemoryMB NOTIFY memoryUsageChanged)
    Q_PROPERTY(qint64 availableMemoryMB READ availableMemoryMB NOTIFY memoryUsageChanged)
    
    // Network metrics
    Q_PROPERTY(double networkUploadKBps READ networkUploadKBps NOTIFY networkUsageChanged)
    Q_PROPERTY(double networkDownloadKBps READ networkDownloadKBps NOTIFY networkUsageChanged)
    
    // Disk metrics
    Q_PROPERTY(double diskUsage READ diskUsage NOTIFY diskUsageChanged)
    Q_PROPERTY(qint64 totalDiskGB READ totalDiskGB CONSTANT)
    Q_PROPERTY(qint64 usedDiskGB READ usedDiskGB NOTIFY diskUsageChanged)
    
    // Update control
    Q_PROPERTY(int updateInterval READ updateInterval WRITE setUpdateInterval NOTIFY updateIntervalChanged)

public:
    explicit SystemMonitor(QObject *parent = nullptr);
    ~SystemMonitor();
    
    // CPU getters
    double cpuUsage() const { return m_cpuUsage; }
    int cpuCores() const { return m_cpuCores; }
    QString cpuName() const { return m_cpuName; }
    
    // Memory getters
    double memoryUsage() const { return m_memoryUsage; }
    qint64 totalMemoryMB() const { return m_totalMemoryMB; }
    qint64 usedMemoryMB() const { return m_usedMemoryMB; }
    qint64 availableMemoryMB() const { return m_availableMemoryMB; }
    
    // Network getters
    double networkUploadKBps() const { return m_networkUploadKBps; }
    double networkDownloadKBps() const { return m_networkDownloadKBps; }
    
    // Disk getters
    double diskUsage() const { return m_diskUsage; }
    qint64 totalDiskGB() const { return m_totalDiskGB; }
    qint64 usedDiskGB() const { return m_usedDiskGB; }
    
    // Update control
    int updateInterval() const { return m_updateInterval; }
    void setUpdateInterval(int ms);
    
    // Manual update
    Q_INVOKABLE void refresh();
    
    // Get all metrics as a map
    Q_INVOKABLE QVariantMap getAllMetrics() const;

signals:
    void cpuUsageChanged();
    void memoryUsageChanged();
    void networkUsageChanged();
    void diskUsageChanged();
    void updateIntervalChanged();

private slots:
    void updateMetrics();

private:
    void updateCPUUsage();
    void updateMemoryUsage();
    void updateNetworkUsage();
    void updateDiskUsage();
    
    // CPU
    double m_cpuUsage;
    int m_cpuCores;
    QString m_cpuName;
    qint64 m_lastCpuTime;
    qint64 m_lastSystemTime;
    
    // Memory
    double m_memoryUsage;
    qint64 m_totalMemoryMB;
    qint64 m_usedMemoryMB;
    qint64 m_availableMemoryMB;
    
    // Network
    double m_networkUploadKBps;
    double m_networkDownloadKBps;
    qint64 m_lastBytesReceived;
    qint64 m_lastBytesSent;
    qint64 m_lastNetworkUpdateTime;
    
    // Disk
    double m_diskUsage;
    qint64 m_totalDiskGB;
    qint64 m_usedDiskGB;
    
    // Update timer
    QTimer *m_updateTimer;
    int m_updateInterval;
};

} // namespace QOR
