/**
 * ProcessManager Implementation
 */

#include "ProcessManager.h"
#include <QDebug>

ProcessManager::ProcessManager(QObject *parent)
    : QObject(parent)
{
}

ProcessManager::~ProcessManager()
{
    // Stop all running processes
    for (auto it = m_processes.begin(); it != m_processes.end(); ++it) {
        if (it.value()->state() == QProcess::Running) {
            it.value()->terminate();
            it.value()->waitForFinished(1000);
        }
        it.value()->deleteLater();
    }
}

QProcess* ProcessManager::startProcess(const QString &id, const QString &path,
                                        const QStringList &args)
{
    if (m_processes.contains(id)) {
        stopProcess(id);
    }
    
    QProcess *process = new QProcess(this);
    m_processes[id] = process;
    
    connect(process, &QProcess::started, [this, id]() {
        emit processStarted(id);
    });
    
    connect(process, QOverload<int, QProcess::ExitStatus>::of(&QProcess::finished),
            [this, id](int exitCode, QProcess::ExitStatus) {
        emit processStopped(id, exitCode);
    });
    
    connect(process, &QProcess::errorOccurred, [this, id](QProcess::ProcessError err) {
        QString errorMsg;
        switch (err) {
        case QProcess::FailedToStart: errorMsg = "Failed to start"; break;
        case QProcess::Crashed: errorMsg = "Crashed"; break;
        default: errorMsg = "Unknown error"; break;
        }
        emit processError(id, errorMsg);
    });
    
    process->start(path, args);
    return process;
}

bool ProcessManager::stopProcess(const QString &id, int timeoutMs)
{
    if (!m_processes.contains(id)) {
        return false;
    }
    
    QProcess *process = m_processes[id];
    
    if (process->state() == QProcess::Running) {
        process->terminate();
        if (!process->waitForFinished(timeoutMs)) {
            process->kill();
            process->waitForFinished(1000);
        }
    }
    
    m_processes.remove(id);
    process->deleteLater();
    return true;
}

bool ProcessManager::isRunning(const QString &id) const
{
    if (!m_processes.contains(id)) {
        return false;
    }
    return m_processes[id]->state() == QProcess::Running;
}

QProcess* ProcessManager::getProcess(const QString &id) const
{
    return m_processes.value(id, nullptr);
}
