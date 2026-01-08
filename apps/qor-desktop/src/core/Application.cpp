/**
 * QØЯ Application Implementation
 */

#include "Application.h"
#include "../storage/LocalDatabase.h"
#include "../storage/SecureVault.h"
#include "../AbyssIDManager.h"
#include "../WalletBridge.h"
#include "../chain/ChainClient.h"
#include "../chain/SyncManager.h"
#include "../MainWindow.h"

#include <QStandardPaths>
#include <QDir>
#include <QNetworkAccessManager>
#include <QNetworkReply>
#include <QTimer>
#include <QDebug>

namespace QOR {

// Singleton instance
Application* Application::s_instance = nullptr;

Application::Application(int &argc, char **argv)
    : QApplication(argc, argv)
    , m_mainWindow(nullptr)
    , m_initialized(false)
    , m_isFirstRun(false)
    , m_isOnline(false)
{
    s_instance = this;
    
    // Set application properties
    setApplicationName(APP_NAME);
    setApplicationVersion(APP_VERSION);
    setOrganizationName(APP_ORGANIZATION);
    setOrganizationDomain(APP_DOMAIN);
    setApplicationDisplayName(APP_DISPLAY_NAME);
    
    // Ensure data directories exist
    QDir().mkpath(dataPath());
    QDir().mkpath(cachePath());
    QDir().mkpath(configPath());
}

Application::~Application()
{
    shutdown();
    s_instance = nullptr;
}

Application* Application::instance()
{
    return s_instance;
}

QString Application::dataPath() const
{
    return QStandardPaths::writableLocation(QStandardPaths::AppDataLocation);
}

QString Application::cachePath() const
{
    return QStandardPaths::writableLocation(QStandardPaths::CacheLocation);
}

QString Application::configPath() const
{
    return QStandardPaths::writableLocation(QStandardPaths::AppConfigLocation);
}

bool Application::initialize()
{
    if (m_initialized) {
        qWarning() << "Application already initialized";
        return true;
    }
    
    qInfo() << "Initializing QØЯ...";
    qInfo() << "Data path:" << dataPath();
    
    // Check if first run
    checkFirstRun();
    
    // Initialize subsystems in order
    if (!initStorage()) {
        emit criticalError(tr("Failed to initialize storage"));
        return false;
    }
    
    if (!initIdentity()) {
        emit criticalError(tr("Failed to initialize identity system"));
        return false;
    }
    
    if (!initChain()) {
        emit criticalError(tr("Failed to initialize chain client"));
        return false;
    }
    
    if (!initUI()) {
        emit criticalError(tr("Failed to initialize user interface"));
        return false;
    }
    
    // Connect signals between components
    connectSignals();
    
    // Check network connectivity
    checkConnectivity();
    
    m_initialized = true;
    emit initialized();
    
    qInfo() << "QØЯ initialized successfully";
    return true;
}

void Application::shutdown()
{
    if (!m_initialized) {
        return;
    }
    
    qInfo() << "Shutting down QØЯ...";
    
    // Sync any pending changes
    if (m_sync) {
        m_sync->flush();
    }
    
    // Close database
    if (m_database) {
        m_database->close();
    }
    
    m_initialized = false;
    qInfo() << "QØЯ shutdown complete";
}

bool Application::initStorage()
{
    qInfo() << "Initializing storage...";
    
    // Initialize SQLite database
    m_database = QSharedPointer<LocalDatabase>::create();
    QString dbPath = dataPath() + "/qor.db";
    
    if (!m_database->open(dbPath)) {
        qCritical() << "Failed to open database:" << dbPath;
        return false;
    }
    
    // Run migrations if needed
    if (!m_database->migrate()) {
        qCritical() << "Database migration failed";
        return false;
    }
    
    // Initialize secure vault (OS keychain)
    m_vault = QSharedPointer<SecureVault>::create();
    if (!m_vault->initialize()) {
        qWarning() << "Secure vault initialization failed, using fallback";
        // Continue anyway - vault has fallback mode
    }
    
    qInfo() << "Storage initialized";
    return true;
}

bool Application::initIdentity()
{
    qInfo() << "Initializing identity system...";
    
    // Create AbyssID manager
    m_abyssId = QSharedPointer<AbyssIDManager>::create();
    m_abyssId->setVault(m_vault.data());
    m_abyssId->setDatabase(m_database.data());
    
    // Try to load existing identity
    if (m_vault->hasCredential("abyssid_key")) {
        m_abyssId->loadFromVault();
    }
    
    // Create wallet manager
    m_wallet = QSharedPointer<WalletManager>::create(m_abyssId.data());
    
    qInfo() << "Identity system initialized";
    return true;
}

bool Application::initChain()
{
    qInfo() << "Initializing chain client...";
    
    // Create chain client
    m_chain = QSharedPointer<ChainClient>::create();
    m_chain->setDatabase(m_database.data());
    
    // Create sync manager
    m_sync = QSharedPointer<SyncManager>::create();
    m_sync->setChainClient(m_chain.data());
    m_sync->setDatabase(m_database.data());
    
    qInfo() << "Chain client initialized";
    return true;
}

bool Application::initUI()
{
    qInfo() << "Initializing user interface...";
    
    m_mainWindow = new MainWindow();
    m_mainWindow->show();
    
    qInfo() << "User interface initialized";
    return true;
}

void Application::connectSignals()
{
    // Online state triggers sync
    connect(this, &Application::onlineStateChanged, [this](bool online) {
        if (online && m_sync) {
            m_sync->startSync();
        }
    });
    
    // AbyssID changes trigger wallet refresh
    if (m_abyssId && m_wallet) {
        connect(m_abyssId.data(), &AbyssIDManager::authChanged, [this]() {
            if (m_abyssId->isAuthenticated()) {
                m_wallet->refresh();
            }
        });
    }
}

void Application::checkFirstRun()
{
    QString markerPath = dataPath() + "/.initialized";
    QFile marker(markerPath);
    
    if (!marker.exists()) {
        m_isFirstRun = true;
        // Create marker for next time
        marker.open(QIODevice::WriteOnly);
        marker.write(APP_VERSION);
        marker.close();
    } else {
        m_isFirstRun = false;
    }
}

void Application::checkConnectivity()
{
    // Simple connectivity check
    QNetworkAccessManager *manager = new QNetworkAccessManager(this);
    
    connect(manager, &QNetworkAccessManager::finished, [this, manager](QNetworkReply *reply) {
        bool wasOnline = m_isOnline;
        m_isOnline = (reply->error() == QNetworkReply::NoError);
        
        if (m_isOnline != wasOnline) {
            emit onlineStateChanged(m_isOnline);
        }
        
        reply->deleteLater();
        manager->deleteLater();
    });
    
    // Try to reach the chain RPC
    QNetworkRequest request(QUrl("https://rpc.demiurge.cloud/health"));
    request.setAttribute(QNetworkRequest::RedirectPolicyAttribute, 
                        QNetworkRequest::NoLessSafeRedirectPolicy);
    manager->get(request);
}

void Application::syncWithChain()
{
    if (m_isOnline && m_sync) {
        m_sync->startSync();
    }
}

} // namespace QOR
