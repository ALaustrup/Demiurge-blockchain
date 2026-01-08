/**
 * QØЯ Configuration Manager Implementation
 */

#include "Config.h"
#include <QCoreApplication>
#include <QThread>

namespace QOR {

Config* Config::s_instance = nullptr;

Config* Config::instance()
{
    if (!s_instance) {
        s_instance = new Config();
    }
    return s_instance;
}

Config::Config(QObject *parent)
    : QObject(parent)
    , m_settings(APP_ORGANIZATION, APP_NAME)
{
    s_instance = this;
}

// General settings
QString Config::language() const
{
    return m_settings.value("general/language", "en").toString();
}

void Config::setLanguage(const QString &lang)
{
    if (language() != lang) {
        m_settings.setValue("general/language", lang);
        emit languageChanged(lang);
    }
}

QString Config::theme() const
{
    return m_settings.value("general/theme", "dark").toString();
}

void Config::setTheme(const QString &theme)
{
    if (this->theme() != theme) {
        m_settings.setValue("general/theme", theme);
        emit themeChanged(theme);
    }
}

bool Config::minimizeToTray() const
{
    return m_settings.value("general/minimizeToTray", true).toBool();
}

void Config::setMinimizeToTray(bool enabled)
{
    if (minimizeToTray() != enabled) {
        m_settings.setValue("general/minimizeToTray", enabled);
        emit minimizeToTrayChanged(enabled);
    }
}

bool Config::startOnBoot() const
{
    return m_settings.value("general/startOnBoot", false).toBool();
}

void Config::setStartOnBoot(bool enabled)
{
    if (startOnBoot() != enabled) {
        m_settings.setValue("general/startOnBoot", enabled);
        emit startOnBootChanged(enabled);
        // TODO: Actually register/unregister with OS startup
    }
}

// Chain settings
QString Config::rpcEndpoint() const
{
    return m_settings.value("chain/rpcEndpoint", "https://rpc.demiurge.cloud").toString();
}

void Config::setRpcEndpoint(const QString &endpoint)
{
    if (rpcEndpoint() != endpoint) {
        m_settings.setValue("chain/rpcEndpoint", endpoint);
        emit rpcEndpointChanged(endpoint);
    }
}

bool Config::autoSync() const
{
    return m_settings.value("chain/autoSync", true).toBool();
}

void Config::setAutoSync(bool enabled)
{
    if (autoSync() != enabled) {
        m_settings.setValue("chain/autoSync", enabled);
        emit autoSyncChanged(enabled);
    }
}

// Mining settings
bool Config::miningEnabled() const
{
    return m_settings.value("mining/enabled", false).toBool();
}

void Config::setMiningEnabled(bool enabled)
{
    if (miningEnabled() != enabled) {
        m_settings.setValue("mining/enabled", enabled);
        emit miningEnabledChanged(enabled);
    }
}

bool Config::gpuMining() const
{
    return m_settings.value("mining/gpuMining", false).toBool();
}

void Config::setGpuMining(bool enabled)
{
    if (gpuMining() != enabled) {
        m_settings.setValue("mining/gpuMining", enabled);
        emit gpuMiningChanged(enabled);
    }
}

int Config::miningThreads() const
{
    int defaultThreads = QThread::idealThreadCount() / 2;
    return m_settings.value("mining/threads", defaultThreads).toInt();
}

void Config::setMiningThreads(int threads)
{
    if (miningThreads() != threads) {
        m_settings.setValue("mining/threads", threads);
        emit miningThreadsChanged(threads);
    }
}

// P2P settings
bool Config::p2pEnabled() const
{
    return m_settings.value("p2p/enabled", true).toBool();
}

void Config::setP2pEnabled(bool enabled)
{
    if (p2pEnabled() != enabled) {
        m_settings.setValue("p2p/enabled", enabled);
        emit p2pEnabledChanged(enabled);
    }
}

bool Config::seedingEnabled() const
{
    return m_settings.value("p2p/seeding", false).toBool();
}

void Config::setSeedingEnabled(bool enabled)
{
    if (seedingEnabled() != enabled) {
        m_settings.setValue("p2p/seeding", enabled);
        emit seedingEnabledChanged(enabled);
    }
}

int Config::maxUploadSpeed() const
{
    return m_settings.value("p2p/maxUploadSpeed", 0).toInt(); // 0 = unlimited
}

void Config::setMaxUploadSpeed(int kbps)
{
    if (maxUploadSpeed() != kbps) {
        m_settings.setValue("p2p/maxUploadSpeed", kbps);
        emit maxUploadSpeedChanged(kbps);
    }
}

// Generic access
QVariant Config::value(const QString &key, const QVariant &defaultValue) const
{
    return m_settings.value(key, defaultValue);
}

void Config::setValue(const QString &key, const QVariant &value)
{
    m_settings.setValue(key, value);
}

bool Config::contains(const QString &key) const
{
    return m_settings.contains(key);
}

void Config::remove(const QString &key)
{
    m_settings.remove(key);
}

void Config::sync()
{
    m_settings.sync();
}

void Config::reset()
{
    m_settings.clear();
    m_settings.sync();
}

} // namespace QOR
