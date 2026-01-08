/**
 * MiningEngine.h - QØЯ Mining Engine
 * 
 * Manages CGT mining operations using CPU and optional GPU acceleration.
 * Desktop clients can leverage their hardware to contribute to the
 * Demiurge network and earn CGT rewards.
 * 
 * Features:
 * - CPU mining (multi-threaded)
 * - GPU mining (OpenCL/CUDA when available)
 * - Automatic hardware detection
 * - Dynamic difficulty adjustment
 * - Power management (throttling)
 * - Pool mining support
 */

#ifndef MININGENGINE_H
#define MININGENGINE_H

#include <QObject>
#include <QThread>
#include <QMutex>
#include <QTimer>
#include <QElapsedTimer>
#include <QVector>
#include <atomic>

namespace QOR {

/**
 * Mining statistics
 */
struct MiningStats {
    quint64 hashesComputed = 0;
    double hashRate = 0.0;          // H/s
    quint64 sharesAccepted = 0;
    quint64 sharesRejected = 0;
    quint64 blocksFound = 0;
    quint64 totalRewards = 0;       // CGT in smallest units
    qint64 miningTimeSeconds = 0;
    double efficiency = 0.0;        // H/s per watt (estimated)
};

/**
 * Hardware information
 */
struct HardwareInfo {
    QString cpuName;
    int cpuCores;
    int cpuThreads;
    bool gpuAvailable;
    QString gpuName;
    quint64 gpuMemory;
    QString gpuDriver;
};

/**
 * Mining configuration
 */
struct MiningConfig {
    int cpuThreads = 0;             // 0 = auto (75% of available)
    bool useGpu = false;
    int gpuIntensity = 80;          // 0-100%
    int powerLimit = 80;            // 0-100%
    QString poolAddress;
    QString walletAddress;
    bool soloMining = true;
};

/**
 * CPU Mining Worker Thread
 */
class CpuMinerWorker : public QThread
{
    Q_OBJECT
    
public:
    CpuMinerWorker(int threadId, QObject* parent = nullptr);
    
    void stop() { m_running = false; }
    void setWork(const QByteArray& header, quint64 target, quint64 startNonce);
    
signals:
    void hashComputed(quint64 count);
    void solutionFound(quint64 nonce, const QByteArray& hash);
    
protected:
    void run() override;
    
private:
    int m_threadId;
    std::atomic<bool> m_running{false};
    QByteArray m_header;
    quint64 m_target = 0;
    quint64 m_startNonce = 0;
    QMutex m_mutex;
};

/**
 * Mining Engine - Core mining controller
 */
class MiningEngine : public QObject
{
    Q_OBJECT
    
    Q_PROPERTY(bool isMining READ isMining NOTIFY miningStateChanged)
    Q_PROPERTY(double hashRate READ hashRate NOTIFY statsUpdated)
    Q_PROPERTY(quint64 totalHashes READ totalHashes NOTIFY statsUpdated)
    Q_PROPERTY(quint64 sharesAccepted READ sharesAccepted NOTIFY statsUpdated)
    Q_PROPERTY(quint64 totalRewards READ totalRewards NOTIFY statsUpdated)
    
public:
    explicit MiningEngine(QObject* parent = nullptr);
    ~MiningEngine();
    
    // ========================================================================
    // INITIALIZATION
    // ========================================================================
    
    /**
     * Initialize the mining engine and detect hardware
     */
    bool initialize();
    
    /**
     * Get detected hardware information
     */
    Q_INVOKABLE QVariantMap getHardwareInfo() const;
    
    // ========================================================================
    // PROPERTIES
    // ========================================================================
    
    bool isMining() const { return m_isMining; }
    double hashRate() const { return m_stats.hashRate; }
    quint64 totalHashes() const { return m_stats.hashesComputed; }
    quint64 sharesAccepted() const { return m_stats.sharesAccepted; }
    quint64 totalRewards() const { return m_stats.totalRewards; }
    
    // ========================================================================
    // MINING CONTROL
    // ========================================================================
    
    /**
     * Start mining with the given configuration
     */
    Q_INVOKABLE bool startMining(const QVariantMap& config = {});
    
    /**
     * Stop mining
     */
    Q_INVOKABLE void stopMining();
    
    /**
     * Pause mining (reduce intensity)
     */
    Q_INVOKABLE void pauseMining();
    
    /**
     * Resume mining
     */
    Q_INVOKABLE void resumeMining();
    
    /**
     * Set CPU thread count
     */
    Q_INVOKABLE void setCpuThreads(int threads);
    
    /**
     * Set GPU intensity (0-100)
     */
    Q_INVOKABLE void setGpuIntensity(int intensity);
    
    /**
     * Set power limit (0-100)
     */
    Q_INVOKABLE void setPowerLimit(int limit);
    
    /**
     * Get current mining statistics
     */
    Q_INVOKABLE QVariantMap getStats() const;
    
    /**
     * Get mining configuration
     */
    Q_INVOKABLE QVariantMap getConfig() const;
    
    /**
     * Benchmark CPU mining
     */
    Q_INVOKABLE double benchmarkCpu(int duration = 10);
    
    /**
     * Benchmark GPU mining
     */
    Q_INVOKABLE double benchmarkGpu(int duration = 10);
    
signals:
    void miningStateChanged(bool mining);
    void statsUpdated();
    void shareSubmitted(bool accepted);
    void blockFound(const QString& hash, quint64 reward);
    void error(const QString& message);
    void hardwareDetected(const QVariantMap& info);
    
private slots:
    void onHashComputed(quint64 count);
    void onSolutionFound(quint64 nonce, const QByteArray& hash);
    void onStatsTimer();
    void onWorkUpdate();
    
private:
    // ========================================================================
    // INTERNAL METHODS
    // ========================================================================
    
    void detectHardware();
    bool initializeCpuMining();
    bool initializeGpuMining();
    void updateWork();
    QByteArray computeHash(const QByteArray& data);
    bool submitShare(quint64 nonce, const QByteArray& hash);
    void calculateStats();
    
    // ========================================================================
    // MEMBER VARIABLES
    // ========================================================================
    
    bool m_initialized = false;
    bool m_isMining = false;
    bool m_isPaused = false;
    
    HardwareInfo m_hardware;
    MiningConfig m_config;
    MiningStats m_stats;
    
    // CPU Workers
    QVector<CpuMinerWorker*> m_cpuWorkers;
    
    // Timing
    QElapsedTimer m_miningTimer;
    QTimer* m_statsTimer = nullptr;
    QTimer* m_workTimer = nullptr;
    
    // Current work
    QByteArray m_currentHeader;
    quint64 m_currentTarget = 0;
    quint64 m_currentDifficulty = 1;
    quint64 m_nonceCounter = 0;
    
    // Thread safety
    QMutex m_statsMutex;
    QMutex m_workMutex;
};

} // namespace QOR

#endif // MININGENGINE_H
