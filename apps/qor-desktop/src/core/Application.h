/**
 * QØЯ Application Class
 * 
 * Central application manager for QØЯ desktop client.
 * Handles initialization, configuration, and coordination
 * of all major subsystems.
 */

#ifndef QOR_APPLICATION_H
#define QOR_APPLICATION_H

#include <QApplication>
#include <QSharedPointer>
#include <QString>

// Forward declarations (outside QOR namespace)
class AbyssIDManager;
class MainWindow;

namespace QOR {

// Forward declarations (inside QOR namespace)
class LocalDatabase;
class SecureVault;
class WalletManager;
class ChainClient;
class SyncManager;

/**
 * Application - Main application controller
 * 
 * Manages the lifecycle of all QØЯ components:
 * - Local storage (SQLite database)
 * - Secure vault (OS keychain integration)
 * - Identity management (AbyssID)
 * - Chain connectivity
 * - UI windows
 */
class Application : public QApplication
{
    Q_OBJECT

public:
    /**
     * Constructor
     * @param argc Argument count
     * @param argv Argument values
     */
    Application(int &argc, char **argv);
    
    /**
     * Destructor - ensures clean shutdown
     */
    ~Application() override;
    
    /**
     * Get singleton instance
     * @return Application instance
     */
    static Application* instance();
    
    /**
     * Initialize all subsystems
     * @return true if initialization successful
     */
    bool initialize();
    
    /**
     * Shutdown all subsystems gracefully
     */
    void shutdown();
    
    // Component accessors
    LocalDatabase* database() const { return m_database.data(); }
    SecureVault* vault() const { return m_vault.data(); }
    AbyssIDManager* abyssId() const { return m_abyssId.data(); }
    WalletManager* wallet() const { return m_wallet.data(); }
    ChainClient* chain() const { return m_chain.data(); }
    SyncManager* sync() const { return m_sync.data(); }
    MainWindow* mainWindow() const { return m_mainWindow; }
    
    // Configuration
    QString dataPath() const;
    QString cachePath() const;
    QString configPath() const;
    bool isFirstRun() const { return m_isFirstRun; }
    bool isOnline() const { return m_isOnline; }

signals:
    /**
     * Emitted when online/offline state changes
     */
    void onlineStateChanged(bool online);
    
    /**
     * Emitted when initialization is complete
     */
    void initialized();
    
    /**
     * Emitted when a critical error occurs
     */
    void criticalError(const QString &message);

public slots:
    /**
     * Check network connectivity
     */
    void checkConnectivity();
    
    /**
     * Trigger sync with chain
     */
    void syncWithChain();

private:
    /**
     * Initialize storage subsystem
     */
    bool initStorage();
    
    /**
     * Initialize identity subsystem
     */
    bool initIdentity();
    
    /**
     * Initialize chain subsystem
     */
    bool initChain();
    
    /**
     * Initialize UI
     */
    bool initUI();
    
    /**
     * Setup signal connections
     */
    void connectSignals();
    
    /**
     * Check if this is the first run
     */
    void checkFirstRun();

private:
    // Subsystem instances
    QSharedPointer<LocalDatabase> m_database;
    QSharedPointer<SecureVault> m_vault;
    QSharedPointer<AbyssIDManager> m_abyssId;
    QSharedPointer<WalletManager> m_wallet;
    QSharedPointer<ChainClient> m_chain;
    QSharedPointer<SyncManager> m_sync;
    
    // UI
    MainWindow *m_mainWindow;
    
    // State
    bool m_initialized;
    bool m_isFirstRun;
    bool m_isOnline;
    
    // Singleton
    static Application *s_instance;
};

} // namespace QOR

// Convenience macro
#define qorApp (QOR::Application::instance())

#endif // QOR_APPLICATION_H
