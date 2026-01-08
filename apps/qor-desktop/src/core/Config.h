/**
 * QØЯ Configuration Manager
 * 
 * Manages application settings and preferences.
 * Settings are stored in a platform-appropriate location.
 */

#ifndef QOR_CONFIG_H
#define QOR_CONFIG_H

#include <QObject>
#include <QSettings>
#include <QVariant>
#include <QString>

namespace QOR {

/**
 * Config - Application configuration manager
 * 
 * Provides type-safe access to application settings
 * with default values and change notifications.
 */
class Config : public QObject
{
    Q_OBJECT
    
    // General settings
    Q_PROPERTY(QString language READ language WRITE setLanguage NOTIFY languageChanged)
    Q_PROPERTY(QString theme READ theme WRITE setTheme NOTIFY themeChanged)
    Q_PROPERTY(bool minimizeToTray READ minimizeToTray WRITE setMinimizeToTray NOTIFY minimizeToTrayChanged)
    Q_PROPERTY(bool startOnBoot READ startOnBoot WRITE setStartOnBoot NOTIFY startOnBootChanged)
    
    // Chain settings
    Q_PROPERTY(QString rpcEndpoint READ rpcEndpoint WRITE setRpcEndpoint NOTIFY rpcEndpointChanged)
    Q_PROPERTY(bool autoSync READ autoSync WRITE setAutoSync NOTIFY autoSyncChanged)
    
    // Mining settings
    Q_PROPERTY(bool miningEnabled READ miningEnabled WRITE setMiningEnabled NOTIFY miningEnabledChanged)
    Q_PROPERTY(bool gpuMining READ gpuMining WRITE setGpuMining NOTIFY gpuMiningChanged)
    Q_PROPERTY(int miningThreads READ miningThreads WRITE setMiningThreads NOTIFY miningThreadsChanged)
    
    // P2P settings
    Q_PROPERTY(bool p2pEnabled READ p2pEnabled WRITE setP2pEnabled NOTIFY p2pEnabledChanged)
    Q_PROPERTY(bool seedingEnabled READ seedingEnabled WRITE setSeedingEnabled NOTIFY seedingEnabledChanged)
    Q_PROPERTY(int maxUploadSpeed READ maxUploadSpeed WRITE setMaxUploadSpeed NOTIFY maxUploadSpeedChanged)

public:
    /**
     * Get singleton instance
     */
    static Config* instance();
    
    /**
     * Constructor
     */
    explicit Config(QObject *parent = nullptr);
    
    // General settings
    QString language() const;
    void setLanguage(const QString &lang);
    
    QString theme() const;
    void setTheme(const QString &theme);
    
    bool minimizeToTray() const;
    void setMinimizeToTray(bool enabled);
    
    bool startOnBoot() const;
    void setStartOnBoot(bool enabled);
    
    // Chain settings
    QString rpcEndpoint() const;
    void setRpcEndpoint(const QString &endpoint);
    
    bool autoSync() const;
    void setAutoSync(bool enabled);
    
    // Mining settings
    bool miningEnabled() const;
    void setMiningEnabled(bool enabled);
    
    bool gpuMining() const;
    void setGpuMining(bool enabled);
    
    int miningThreads() const;
    void setMiningThreads(int threads);
    
    // P2P settings
    bool p2pEnabled() const;
    void setP2pEnabled(bool enabled);
    
    bool seedingEnabled() const;
    void setSeedingEnabled(bool enabled);
    
    int maxUploadSpeed() const;
    void setMaxUploadSpeed(int kbps);
    
    // Generic access
    QVariant value(const QString &key, const QVariant &defaultValue = QVariant()) const;
    void setValue(const QString &key, const QVariant &value);
    bool contains(const QString &key) const;
    void remove(const QString &key);
    
    // Persistence
    void sync();
    void reset();

signals:
    void languageChanged(const QString &lang);
    void themeChanged(const QString &theme);
    void minimizeToTrayChanged(bool enabled);
    void startOnBootChanged(bool enabled);
    void rpcEndpointChanged(const QString &endpoint);
    void autoSyncChanged(bool enabled);
    void miningEnabledChanged(bool enabled);
    void gpuMiningChanged(bool enabled);
    void miningThreadsChanged(int threads);
    void p2pEnabledChanged(bool enabled);
    void seedingEnabledChanged(bool enabled);
    void maxUploadSpeedChanged(int kbps);

private:
    QSettings m_settings;
    static Config *s_instance;
};

} // namespace QOR

// Convenience macro
#define qorConfig (QOR::Config::instance())

#endif // QOR_CONFIG_H
