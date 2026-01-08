/**
 * QØЯ Logging System
 * 
 * Provides structured logging with file output and
 * integration with Qt's message handler.
 */

#ifndef QOR_LOGGER_H
#define QOR_LOGGER_H

#include <QObject>
#include <QString>
#include <QFile>
#include <QMutex>
#include <QDateTime>

namespace QOR {

/**
 * Log level enumeration
 */
enum class LogLevel {
    Debug,
    Info,
    Warning,
    Error,
    Critical
};

/**
 * Logger - Application logging system
 * 
 * Thread-safe logging with:
 * - Console output
 * - File logging with rotation
 * - Qt message handler integration
 */
class Logger : public QObject
{
    Q_OBJECT

public:
    /**
     * Get singleton instance
     */
    static Logger* instance();
    
    /**
     * Initialize the logger
     * @param logPath Path to log file directory
     * @param maxFiles Maximum number of log files to keep
     */
    void initialize(const QString &logPath, int maxFiles = 5);
    
    /**
     * Log a message
     * @param level Log level
     * @param category Category (e.g., "chain", "ui", "storage")
     * @param message Log message
     */
    void log(LogLevel level, const QString &category, const QString &message);
    
    /**
     * Convenience methods
     */
    void debug(const QString &category, const QString &message);
    void info(const QString &category, const QString &message);
    void warning(const QString &category, const QString &message);
    void error(const QString &category, const QString &message);
    void critical(const QString &category, const QString &message);
    
    /**
     * Set minimum log level for output
     */
    void setMinLevel(LogLevel level);
    LogLevel minLevel() const { return m_minLevel; }
    
    /**
     * Enable/disable console output
     */
    void setConsoleEnabled(bool enabled);
    bool isConsoleEnabled() const { return m_consoleEnabled; }
    
    /**
     * Enable/disable file output
     */
    void setFileEnabled(bool enabled);
    bool isFileEnabled() const { return m_fileEnabled; }
    
    /**
     * Flush log buffer to file
     */
    void flush();
    
    /**
     * Close the logger
     */
    void close();

signals:
    /**
     * Emitted when a new log message is written
     */
    void messageLogged(LogLevel level, const QString &category, 
                       const QString &message, const QDateTime &timestamp);

private:
    Logger(QObject *parent = nullptr);
    ~Logger();
    
    /**
     * Write a log entry
     */
    void write(const QString &entry);
    
    /**
     * Rotate log files if needed
     */
    void rotateIfNeeded();
    
    /**
     * Convert level to string
     */
    static QString levelToString(LogLevel level);
    
    /**
     * Qt message handler callback
     */
    static void messageHandler(QtMsgType type, const QMessageLogContext &context, 
                               const QString &msg);

private:
    static Logger *s_instance;
    
    QFile m_logFile;
    QString m_logPath;
    int m_maxFiles;
    qint64 m_maxFileSize;
    
    LogLevel m_minLevel;
    bool m_consoleEnabled;
    bool m_fileEnabled;
    bool m_initialized;
    
    QMutex m_mutex;
};

} // namespace QOR

// Convenience macros
#define qorLog (QOR::Logger::instance())
#define LOG_DEBUG(cat, msg) QOR::Logger::instance()->debug(cat, msg)
#define LOG_INFO(cat, msg) QOR::Logger::instance()->info(cat, msg)
#define LOG_WARN(cat, msg) QOR::Logger::instance()->warning(cat, msg)
#define LOG_ERROR(cat, msg) QOR::Logger::instance()->error(cat, msg)
#define LOG_CRITICAL(cat, msg) QOR::Logger::instance()->critical(cat, msg)

#endif // QOR_LOGGER_H
