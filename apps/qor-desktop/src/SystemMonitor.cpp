/**
 * SystemMonitor.cpp - Implementation
 */

#include "SystemMonitor.h"
#include <QThread>
#include <QStorageInfo>
#include <QDebug>

#ifdef Q_OS_WIN
#include <windows.h>
#include <pdh.h>
#include <psapi.h>
#pragma comment(lib, "pdh.lib")
#endif

#ifdef Q_OS_LINUX
#include <unistd.h>
#include <fstream>
#include <sys/sysinfo.h>
#endif

namespace QOR {

SystemMonitor::SystemMonitor(QObject *parent)
    : QObject(parent)
    , m_cpuUsage(0.0)
    , m_cpuCores(QThread::idealThreadCount())
    , m_cpuName("Unknown CPU")
    , m_lastCpuTime(0)
    , m_lastSystemTime(0)
    , m_memoryUsage(0.0)
    , m_totalMemoryMB(0)
    , m_usedMemoryMB(0)
    , m_availableMemoryMB(0)
    , m_networkUploadKBps(0.0)
    , m_networkDownloadKBps(0.0)
    , m_lastBytesReceived(0)
    , m_lastBytesSent(0)
    , m_lastNetworkUpdateTime(0)
    , m_diskUsage(0.0)
    , m_totalDiskGB(0)
    , m_usedDiskGB(0)
    , m_updateInterval(1000)
{
    // Get CPU name
#ifdef Q_OS_WIN
    HKEY hKey;
    if (RegOpenKeyExA(HKEY_LOCAL_MACHINE, "HARDWARE\\DESCRIPTION\\System\\CentralProcessor\\0", 0, KEY_READ, &hKey) == ERROR_SUCCESS) {
        char buffer[256];
        DWORD size = sizeof(buffer);
        if (RegQueryValueExA(hKey, "ProcessorNameString", nullptr, nullptr, (LPBYTE)buffer, &size) == ERROR_SUCCESS) {
            m_cpuName = QString::fromLatin1(buffer).trimmed();
        }
        RegCloseKey(hKey);
    }
#endif

#ifdef Q_OS_LINUX
    std::ifstream cpuinfo("/proc/cpuinfo");
    std::string line;
    while (std::getline(cpuinfo, line)) {
        if (line.find("model name") != std::string::npos) {
            size_t pos = line.find(":");
            if (pos != std::string::npos) {
                m_cpuName = QString::fromStdString(line.substr(pos + 2)).trimmed();
                break;
            }
        }
    }
#endif

    // Get total memory
#ifdef Q_OS_WIN
    MEMORYSTATUSEX memStatus;
    memStatus.dwLength = sizeof(memStatus);
    if (GlobalMemoryStatusEx(&memStatus)) {
        m_totalMemoryMB = memStatus.ullTotalPhys / (1024 * 1024);
    }
#endif

#ifdef Q_OS_LINUX
    struct sysinfo si;
    if (sysinfo(&si) == 0) {
        m_totalMemoryMB = (si.totalram * si.mem_unit) / (1024 * 1024);
    }
#endif

    // Get total disk space (root drive)
    QStorageInfo storage = QStorageInfo::root();
    m_totalDiskGB = storage.bytesTotal() / (1024 * 1024 * 1024);

    // Initial update
    updateMetrics();

    // Setup timer
    m_updateTimer = new QTimer(this);
    connect(m_updateTimer, &QTimer::timeout, this, &SystemMonitor::updateMetrics);
    m_updateTimer->start(m_updateInterval);

    qInfo() << "SystemMonitor initialized:";
    qInfo() << "  CPU:" << m_cpuName << "(" << m_cpuCores << "cores)";
    qInfo() << "  RAM:" << m_totalMemoryMB << "MB";
    qInfo() << "  Disk:" << m_totalDiskGB << "GB";
}

SystemMonitor::~SystemMonitor()
{
    if (m_updateTimer) {
        m_updateTimer->stop();
    }
}

void SystemMonitor::setUpdateInterval(int ms)
{
    if (m_updateInterval != ms) {
        m_updateInterval = ms;
        if (m_updateTimer) {
            m_updateTimer->setInterval(ms);
        }
        emit updateIntervalChanged();
    }
}

void SystemMonitor::refresh()
{
    updateMetrics();
}

QVariantMap SystemMonitor::getAllMetrics() const
{
    QVariantMap metrics;
    
    metrics["cpuUsage"] = m_cpuUsage;
    metrics["cpuCores"] = m_cpuCores;
    metrics["cpuName"] = m_cpuName;
    
    metrics["memoryUsage"] = m_memoryUsage;
    metrics["totalMemoryMB"] = m_totalMemoryMB;
    metrics["usedMemoryMB"] = m_usedMemoryMB;
    metrics["availableMemoryMB"] = m_availableMemoryMB;
    
    metrics["networkUploadKBps"] = m_networkUploadKBps;
    metrics["networkDownloadKBps"] = m_networkDownloadKBps;
    
    metrics["diskUsage"] = m_diskUsage;
    metrics["totalDiskGB"] = m_totalDiskGB;
    metrics["usedDiskGB"] = m_usedDiskGB;
    
    return metrics;
}

void SystemMonitor::updateMetrics()
{
    updateCPUUsage();
    updateMemoryUsage();
    updateNetworkUsage();
    updateDiskUsage();
}

void SystemMonitor::updateCPUUsage()
{
#ifdef Q_OS_WIN
    static PDH_HQUERY cpuQuery = nullptr;
    static PDH_HCOUNTER cpuTotal = nullptr;
    
    if (!cpuQuery) {
        PdhOpenQuery(nullptr, 0, &cpuQuery);
        PdhAddEnglishCounter(cpuQuery, L"\\Processor(_Total)\\% Processor Time", 0, &cpuTotal);
        PdhCollectQueryData(cpuQuery);
        m_cpuUsage = 0.0;
        emit cpuUsageChanged();
        return;
    }
    
    PDH_FMT_COUNTERVALUE counterVal;
    PdhCollectQueryData(cpuQuery);
    PdhGetFormattedCounterValue(cpuTotal, PDH_FMT_DOUBLE, nullptr, &counterVal);
    
    double newUsage = counterVal.doubleValue;
    if (newUsage != m_cpuUsage) {
        m_cpuUsage = newUsage;
        emit cpuUsageChanged();
    }
#endif

#ifdef Q_OS_LINUX
    static unsigned long long lastTotalUser = 0, lastTotalUserLow = 0, lastTotalSys = 0, lastTotalIdle = 0;
    
    std::ifstream file("/proc/stat");
    std::string line;
    std::getline(file, line);
    
    unsigned long long totalUser, totalUserLow, totalSys, totalIdle;
    sscanf(line.c_str(), "cpu %llu %llu %llu %llu", &totalUser, &totalUserLow, &totalSys, &totalIdle);
    
    if (lastTotalUser != 0) {
        unsigned long long total = (totalUser - lastTotalUser) + (totalUserLow - lastTotalUserLow) + (totalSys - lastTotalSys);
        unsigned long long idle = totalIdle - lastTotalIdle;
        
        double newUsage = (total - idle) * 100.0 / total;
        if (std::abs(newUsage - m_cpuUsage) > 0.1) {
            m_cpuUsage = newUsage;
            emit cpuUsageChanged();
        }
    }
    
    lastTotalUser = totalUser;
    lastTotalUserLow = totalUserLow;
    lastTotalSys = totalSys;
    lastTotalIdle = totalIdle;
#endif
}

void SystemMonitor::updateMemoryUsage()
{
#ifdef Q_OS_WIN
    MEMORYSTATUSEX memStatus;
    memStatus.dwLength = sizeof(memStatus);
    if (GlobalMemoryStatusEx(&memStatus)) {
        m_usedMemoryMB = (memStatus.ullTotalPhys - memStatus.ullAvailPhys) / (1024 * 1024);
        m_availableMemoryMB = memStatus.ullAvailPhys / (1024 * 1024);
        m_memoryUsage = (double)(memStatus.ullTotalPhys - memStatus.ullAvailPhys) / memStatus.ullTotalPhys * 100.0;
        emit memoryUsageChanged();
    }
#endif

#ifdef Q_OS_LINUX
    struct sysinfo si;
    if (sysinfo(&si) == 0) {
        m_usedMemoryMB = ((si.totalram - si.freeram) * si.mem_unit) / (1024 * 1024);
        m_availableMemoryMB = (si.freeram * si.mem_unit) / (1024 * 1024);
        m_memoryUsage = (double)(si.totalram - si.freeram) / si.totalram * 100.0;
        emit memoryUsageChanged();
    }
#endif
}

void SystemMonitor::updateNetworkUsage()
{
    // Simplified network monitoring
    // In production, use platform-specific APIs or QNetworkInterface
    
    qint64 currentTime = QDateTime::currentMSecsSinceEpoch();
    
    if (m_lastNetworkUpdateTime > 0) {
        qint64 timeDelta = currentTime - m_lastNetworkUpdateTime;
        if (timeDelta > 0) {
            // Mock data for now - in production, read from /proc/net/dev or Windows Performance Counters
            m_networkDownloadKBps = (qrand() % 1000) / 10.0; // 0-100 KB/s random
            m_networkUploadKBps = (qrand() % 500) / 10.0;    // 0-50 KB/s random
            emit networkUsageChanged();
        }
    }
    
    m_lastNetworkUpdateTime = currentTime;
}

void SystemMonitor::updateDiskUsage()
{
    QStorageInfo storage = QStorageInfo::root();
    
    if (storage.isValid() && storage.isReady()) {
        qint64 used = storage.bytesTotal() - storage.bytesAvailable();
        m_usedDiskGB = used / (1024 * 1024 * 1024);
        m_diskUsage = (double)used / storage.bytesTotal() * 100.0;
        emit diskUsageChanged();
    }
}

} // namespace QOR
