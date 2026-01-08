/**
 * LauncherCore - Central Controller
 * 
 * Manages the launcher's state machine:
 * - Update checking
 * - Authentication flow
 * - Child process spawning (Miner or Full OS)
 */

#ifndef GENESIS_LAUNCHER_CORE_H
#define GENESIS_LAUNCHER_CORE_H

#include <QObject>
#include <QString>
#include <QProcess>
#include <QVariantMap>

class ProcessManager;

/**
 * Launch modes for the ecosystem
 */
enum class LaunchMode {
    None,
    Construct,  // Miner + Wallet (lightweight)
    Abyss       // Full OS (heavy)
};

class LauncherCore : public QObject
{
    Q_OBJECT
    
    Q_PROPERTY(QString state READ state NOTIFY stateChanged)
    Q_PROPERTY(bool isReady READ isReady NOTIFY readyChanged)
    Q_PROPERTY(bool isUpdating READ isUpdating NOTIFY updatingChanged)
    Q_PROPERTY(double updateProgress READ updateProgress NOTIFY updateProgressChanged)
    Q_PROPERTY(QString statusMessage READ statusMessage NOTIFY statusMessageChanged)
    Q_PROPERTY(QString version READ version CONSTANT)

public:
    explicit LauncherCore(QObject *parent = nullptr);
    ~LauncherCore();
    
    // State
    QString state() const { return m_state; }
    bool isReady() const { return m_isReady; }
    bool isUpdating() const { return m_isUpdating; }
    double updateProgress() const { return m_updateProgress; }
    QString statusMessage() const { return m_statusMessage; }
    QString version() const { return APP_VERSION; }
    
public slots:
    /**
     * Launch "The Construct" - Miner + Wallet mode
     * Lightweight, runs in system tray
     */
    Q_INVOKABLE void launchConstruct();
    
    /**
     * Launch "Enter Abyss" - Full OS mode
     * Heavy, full desktop environment
     */
    Q_INVOKABLE void launchAbyss();
    
    /**
     * Exit the launcher (optionally keeping child running)
     */
    Q_INVOKABLE void exitLauncher(bool keepChildRunning = true);
    
    /**
     * Get installed component info
     */
    Q_INVOKABLE QVariantMap getComponentStatus();
    
    /**
     * Force update check
     */
    Q_INVOKABLE void checkUpdates();
    
    /**
     * Apply pending updates
     */
    Q_INVOKABLE void applyUpdates();
    
signals:
    void stateChanged();
    void readyChanged();
    void updatingChanged();
    void updateProgressChanged();
    void statusMessageChanged();
    
    void launchStarted(const QString &mode);
    void launchCompleted(const QString &mode, bool success);
    void launchFailed(const QString &mode, const QString &error);
    
    void updateAvailable(const QString &version, const QString &changelog);
    void updateDownloadProgress(double percent);
    void updateComplete();
    void updateError(const QString &error);

private slots:
    void onChildProcessStarted();
    void onChildProcessFinished(int exitCode, QProcess::ExitStatus status);
    void onChildProcessError(QProcess::ProcessError error);

private:
    void setState(const QString &state);
    void setStatusMessage(const QString &message);
    void setReady(bool ready);
    void checkComponentsInstalled();
    void setUpdating(bool updating);
    void setUpdateProgress(double progress);
    
    QString findExecutable(const QString &name);
    QStringList buildLaunchArgs(LaunchMode mode);
    
    ProcessManager *m_processManager;
    
    QString m_state;
    bool m_isReady;
    bool m_isUpdating;
    double m_updateProgress;
    QString m_statusMessage;
    
    LaunchMode m_currentMode;
    QProcess *m_childProcess;
};

#endif // GENESIS_LAUNCHER_CORE_H
