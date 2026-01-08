/**
 * QØЯ Logging System Implementation
 */

#include "Logger.h"
#include <QDir>
#include <QTextStream>
#include <QDebug>
#include <iostream>

namespace QOR {

Logger* Logger::s_instance = nullptr;

Logger* Logger::instance()
{
    if (!s_instance) {
        s_instance = new Logger();
    }
    return s_instance;
}

Logger::Logger(QObject *parent)
    : QObject(parent)
    , m_maxFiles(5)
    , m_maxFileSize(10 * 1024 * 1024) // 10 MB
    , m_minLevel(LogLevel::Info)
    , m_consoleEnabled(true)
    , m_fileEnabled(true)
    , m_initialized(false)
{
    s_instance = this;
}

Logger::~Logger()
{
    close();
    s_instance = nullptr;
}

void Logger::initialize(const QString &logPath, int maxFiles)
{
    QMutexLocker locker(&m_mutex);
    
    if (m_initialized) {
        return;
    }
    
    m_logPath = logPath;
    m_maxFiles = maxFiles;
    
    // Ensure log directory exists
    QDir().mkpath(logPath);
    
    // Open current log file
    QString fileName = QString("%1/qor_%2.log")
        .arg(logPath)
        .arg(QDateTime::currentDateTime().toString("yyyy-MM-dd"));
    
    m_logFile.setFileName(fileName);
    if (!m_logFile.open(QIODevice::WriteOnly | QIODevice::Append | QIODevice::Text)) {
        std::cerr << "Failed to open log file: " << fileName.toStdString() << std::endl;
        m_fileEnabled = false;
    }
    
    // Install Qt message handler
    qInstallMessageHandler(messageHandler);
    
    m_initialized = true;
    
    // Write startup message
    info("logger", QString("QØЯ Logger initialized - %1").arg(APP_VERSION));
}

void Logger::log(LogLevel level, const QString &category, const QString &message)
{
    if (level < m_minLevel) {
        return;
    }
    
    QMutexLocker locker(&m_mutex);
    
    QDateTime now = QDateTime::currentDateTime();
    QString timestamp = now.toString("yyyy-MM-dd hh:mm:ss.zzz");
    QString levelStr = levelToString(level);
    
    QString entry = QString("[%1] [%2] [%3] %4")
        .arg(timestamp)
        .arg(levelStr, -8)
        .arg(category, -12)
        .arg(message);
    
    // Console output
    if (m_consoleEnabled) {
        QTextStream out(stdout);
        out << entry << Qt::endl;
    }
    
    // File output
    if (m_fileEnabled && m_logFile.isOpen()) {
        rotateIfNeeded();
        write(entry);
    }
    
    // Emit signal for UI
    emit messageLogged(level, category, message, now);
}

void Logger::debug(const QString &category, const QString &message)
{
    log(LogLevel::Debug, category, message);
}

void Logger::info(const QString &category, const QString &message)
{
    log(LogLevel::Info, category, message);
}

void Logger::warning(const QString &category, const QString &message)
{
    log(LogLevel::Warning, category, message);
}

void Logger::error(const QString &category, const QString &message)
{
    log(LogLevel::Error, category, message);
}

void Logger::critical(const QString &category, const QString &message)
{
    log(LogLevel::Critical, category, message);
}

void Logger::setMinLevel(LogLevel level)
{
    m_minLevel = level;
}

void Logger::setConsoleEnabled(bool enabled)
{
    m_consoleEnabled = enabled;
}

void Logger::setFileEnabled(bool enabled)
{
    m_fileEnabled = enabled;
}

void Logger::flush()
{
    QMutexLocker locker(&m_mutex);
    if (m_logFile.isOpen()) {
        m_logFile.flush();
    }
}

void Logger::close()
{
    QMutexLocker locker(&m_mutex);
    
    if (m_logFile.isOpen()) {
        m_logFile.close();
    }
    
    m_initialized = false;
}

void Logger::write(const QString &entry)
{
    if (m_logFile.isOpen()) {
        QTextStream stream(&m_logFile);
        stream << entry << Qt::endl;
    }
}

void Logger::rotateIfNeeded()
{
    if (!m_logFile.isOpen() || m_logFile.size() < m_maxFileSize) {
        return;
    }
    
    m_logFile.close();
    
    // Rename current file with timestamp
    QString oldName = m_logFile.fileName();
    QString newName = QString("%1/qor_%2.log")
        .arg(m_logPath)
        .arg(QDateTime::currentDateTime().toString("yyyy-MM-dd_hh-mm-ss"));
    
    QFile::rename(oldName, newName);
    
    // Delete old log files if too many
    QDir logDir(m_logPath);
    QStringList logFiles = logDir.entryList(QStringList() << "qor_*.log", 
                                            QDir::Files, QDir::Time);
    
    while (logFiles.size() > m_maxFiles) {
        QString toDelete = logDir.filePath(logFiles.takeLast());
        QFile::remove(toDelete);
    }
    
    // Open new log file
    QString fileName = QString("%1/qor_%2.log")
        .arg(m_logPath)
        .arg(QDateTime::currentDateTime().toString("yyyy-MM-dd"));
    
    m_logFile.setFileName(fileName);
    m_logFile.open(QIODevice::WriteOnly | QIODevice::Append | QIODevice::Text);
}

QString Logger::levelToString(LogLevel level)
{
    switch (level) {
        case LogLevel::Debug:    return "DEBUG";
        case LogLevel::Info:     return "INFO";
        case LogLevel::Warning:  return "WARN";
        case LogLevel::Error:    return "ERROR";
        case LogLevel::Critical: return "CRITICAL";
        default:                 return "UNKNOWN";
    }
}

void Logger::messageHandler(QtMsgType type, const QMessageLogContext &context, 
                            const QString &msg)
{
    if (!s_instance) {
        return;
    }
    
    LogLevel level;
    switch (type) {
        case QtDebugMsg:    level = LogLevel::Debug; break;
        case QtInfoMsg:     level = LogLevel::Info; break;
        case QtWarningMsg:  level = LogLevel::Warning; break;
        case QtCriticalMsg: level = LogLevel::Error; break;
        case QtFatalMsg:    level = LogLevel::Critical; break;
        default:            level = LogLevel::Info; break;
    }
    
    QString category = context.category ? context.category : "qt";
    s_instance->log(level, category, msg);
}

} // namespace QOR
