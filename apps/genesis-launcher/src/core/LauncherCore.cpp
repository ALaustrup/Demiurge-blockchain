/**
 * LauncherCore Implementation
 */

#include "LauncherCore.h"
#include "ProcessManager.h"

#include <QCoreApplication>
#include <QDir>
#include <QStandardPaths>
#include <QTimer>
#include <QDebug>

LauncherCore::LauncherCore(QObject *parent)
    : QObject(parent)
    , m_processManager(new ProcessManager(this))
    , m_state("initializing")
    , m_isReady(false)
    , m_isUpdating(false)
    , m_updateProgress(0.0)
    , m_statusMessage("Initializing Genesis...")
    , m_currentMode(LaunchMode::None)
    , m_childProcess(nullptr)
{
    // Initialize and check for installed components
    QTimer::singleShot(100, this, [this]() {
        checkComponentsInstalled();
    });
}

LauncherCore::~LauncherCore()
{
    // Clean shutdown of child processes if needed
    if (m_childProcess && m_childProcess->state() == QProcess::Running) {
        m_childProcess->terminate();
        m_childProcess->waitForFinished(3000);
    }
}

void LauncherCore::launchConstruct()
{
    if (m_currentMode != LaunchMode::None) {
        qWarning() << "Another process is already running";
        return;
    }
    
    setStatusMessage("Initializing The Construct...");
    emit launchStarted("construct");
    
    m_currentMode = LaunchMode::Construct;
    
    QString minerPath = findExecutable("DemiurgeMiner");
    if (minerPath.isEmpty()) {
        emit launchFailed("construct", "Miner executable not found");
        m_currentMode = LaunchMode::None;
        return;
    }
    
    m_childProcess = new QProcess(this);
    
    connect(m_childProcess, &QProcess::started, 
            this, &LauncherCore::onChildProcessStarted);
    connect(m_childProcess, QOverload<int, QProcess::ExitStatus>::of(&QProcess::finished),
            this, &LauncherCore::onChildProcessFinished);
    connect(m_childProcess, &QProcess::errorOccurred,
            this, &LauncherCore::onChildProcessError);
    
    QStringList args = buildLaunchArgs(LaunchMode::Construct);
    
    qInfo() << "Launching Construct:" << minerPath << args;
    m_childProcess->start(minerPath, args);
}

void LauncherCore::launchAbyss()
{
    if (m_currentMode != LaunchMode::None) {
        qWarning() << "Another process is already running";
        return;
    }
    
    setStatusMessage("Opening the Abyss...");
    emit launchStarted("abyss");
    
    m_currentMode = LaunchMode::Abyss;
    
    QString qorPath = findExecutable("QOR");
    if (qorPath.isEmpty()) {
        emit launchFailed("abyss", "QOR Desktop not found");
        m_currentMode = LaunchMode::None;
        return;
    }
    
    m_childProcess = new QProcess(this);
    
    connect(m_childProcess, &QProcess::started, 
            this, &LauncherCore::onChildProcessStarted);
    connect(m_childProcess, QOverload<int, QProcess::ExitStatus>::of(&QProcess::finished),
            this, &LauncherCore::onChildProcessFinished);
    connect(m_childProcess, &QProcess::errorOccurred,
            this, &LauncherCore::onChildProcessError);
    
    QStringList args = buildLaunchArgs(LaunchMode::Abyss);
    
    qInfo() << "Launching Abyss:" << qorPath << args;
    m_childProcess->start(qorPath, args);
}

void LauncherCore::exitLauncher(bool keepChildRunning)
{
    if (!keepChildRunning && m_childProcess) {
        m_childProcess->terminate();
        m_childProcess->waitForFinished(3000);
    }
    
    QCoreApplication::quit();
}

QVariantMap LauncherCore::getComponentStatus()
{
    QVariantMap status;
    
    // Check QOR Desktop
    QString qorPath = findExecutable("QOR");
    status["qorInstalled"] = !qorPath.isEmpty();
    status["qorPath"] = qorPath;
    
    // Check Miner
    QString minerPath = findExecutable("DemiurgeMiner");
    status["minerInstalled"] = !minerPath.isEmpty();
    status["minerPath"] = minerPath;
    
    // Versions (read from manifest)
    status["qorVersion"] = "1.0.0";
    status["minerVersion"] = "1.0.0";
    status["launcherVersion"] = QString(APP_VERSION);
    
    return status;
}

void LauncherCore::checkUpdates()
{
    setUpdating(true);
    setStatusMessage("Synchronizing reality...");
    
    // UpdateEngine handles the actual check
    emit updateDownloadProgress(0);
}

void LauncherCore::applyUpdates()
{
    setUpdating(true);
    setStatusMessage("Applying quantum patches...");
}

void LauncherCore::onChildProcessStarted()
{
    QString modeName = m_currentMode == LaunchMode::Construct ? "construct" : "abyss";
    qInfo() << "Child process started:" << modeName;
    
    emit launchCompleted(modeName, true);
    
    // Optionally minimize launcher to tray
    setStatusMessage(m_currentMode == LaunchMode::Construct 
        ? "The Construct is active" 
        : "You have entered the Abyss");
}

void LauncherCore::onChildProcessFinished(int exitCode, QProcess::ExitStatus status)
{
    QString modeName = m_currentMode == LaunchMode::Construct ? "construct" : "abyss";
    qInfo() << "Child process finished:" << modeName << "exit:" << exitCode;
    
    m_currentMode = LaunchMode::None;
    m_childProcess->deleteLater();
    m_childProcess = nullptr;
    
    setStatusMessage("Ready");
}

void LauncherCore::onChildProcessError(QProcess::ProcessError error)
{
    QString modeName = m_currentMode == LaunchMode::Construct ? "construct" : "abyss";
    QString errorMsg;
    
    switch (error) {
    case QProcess::FailedToStart:
        errorMsg = "Failed to start process";
        break;
    case QProcess::Crashed:
        errorMsg = "Process crashed";
        break;
    case QProcess::Timedout:
        errorMsg = "Process timed out";
        break;
    default:
        errorMsg = "Unknown error";
        break;
    }
    
    qWarning() << "Child process error:" << errorMsg;
    emit launchFailed(modeName, errorMsg);
    
    m_currentMode = LaunchMode::None;
}

void LauncherCore::setState(const QString &state)
{
    if (m_state != state) {
        m_state = state;
        emit stateChanged();
    }
}

void LauncherCore::setStatusMessage(const QString &message)
{
    if (m_statusMessage != message) {
        m_statusMessage = message;
        emit statusMessageChanged();
    }
}

void LauncherCore::setReady(bool ready)
{
    if (m_isReady != ready) {
        m_isReady = ready;
        emit readyChanged();
    }
}

void LauncherCore::setUpdating(bool updating)
{
    if (m_isUpdating != updating) {
        m_isUpdating = updating;
        emit updatingChanged();
    }
}

void LauncherCore::setUpdateProgress(double progress)
{
    if (m_updateProgress != progress) {
        m_updateProgress = progress;
        emit updateProgressChanged();
    }
}

QString LauncherCore::findExecutable(const QString &name)
{
    // Check in same directory as launcher
    QString appDir = QCoreApplication::applicationDirPath();
    
#ifdef Q_OS_WIN
    QString exeName = name + ".exe";
#else
    QString exeName = name;
#endif
    
    // Check app directory
    QString path = QDir(appDir).filePath(exeName);
    if (QFile::exists(path)) {
        return path;
    }
    
    // Check parent directory
    path = QDir(appDir).filePath("../" + exeName);
    if (QFile::exists(path)) {
        return QDir::cleanPath(path);
    }
    
    // Check standard install location
    QString dataPath = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation);
    path = QDir(dataPath).filePath(exeName);
    if (QFile::exists(path)) {
        return path;
    }
    
    return QString();
}

QStringList LauncherCore::buildLaunchArgs(LaunchMode mode)
{
    QStringList args;
    
    // Pass IPC connection info
    args << "--ipc-port" << "31337";
    args << "--session-id" << "genesis-session";
    
    // Mode-specific args
    if (mode == LaunchMode::Construct) {
        args << "--mode" << "tray";
        args << "--no-gui";
    } else {
        args << "--mode" << "desktop";
        args << "--skip-login";  // SSO - already authenticated
    }
    
    return args;
}

void LauncherCore::checkComponentsInstalled()
{
    QVariantMap status = getComponentStatus();
    
    bool allInstalled = status["qorInstalled"].toBool() || 
                        status["minerInstalled"].toBool();
    
    if (allInstalled) {
        setStatusMessage("Ready to launch");
        setReady(true);
        setState("ready");
    } else {
        setStatusMessage("Components need to be installed");
        setState("install_required");
    }
}
