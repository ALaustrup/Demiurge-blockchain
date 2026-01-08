/**
 * ProcessManager - Child Process Lifecycle Management
 */

#ifndef GENESIS_PROCESS_MANAGER_H
#define GENESIS_PROCESS_MANAGER_H

#include <QObject>
#include <QProcess>
#include <QMap>

class ProcessManager : public QObject
{
    Q_OBJECT

public:
    explicit ProcessManager(QObject *parent = nullptr);
    ~ProcessManager();
    
    QProcess* startProcess(const QString &id, const QString &path, 
                          const QStringList &args = QStringList());
    bool stopProcess(const QString &id, int timeoutMs = 3000);
    bool isRunning(const QString &id) const;
    QProcess* getProcess(const QString &id) const;
    
signals:
    void processStarted(const QString &id);
    void processStopped(const QString &id, int exitCode);
    void processError(const QString &id, const QString &error);

private:
    QMap<QString, QProcess*> m_processes;
};

#endif // GENESIS_PROCESS_MANAGER_H
