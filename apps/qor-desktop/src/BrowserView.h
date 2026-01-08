/**
 * BrowserView - WebEngine View with AbyssOS Integration
 * 
 * Custom WebEngineView that provides native bridge to AbyssID and Wallet.
 * Only available when Qt WebEngine is present.
 */

#ifndef BROWSERVIEW_H
#define BROWSERVIEW_H

#include <QWidget>
#include <QVariantMap>

#ifdef QOR_WEBENGINE_ENABLED
#include <QWebEngineView>
#include <QWebChannel>

class AbyssIDManager;
class WalletBridge;

class BrowserView : public QWebEngineView
{
    Q_OBJECT

public:
    explicit BrowserView(AbyssIDManager *abyssId, WalletBridge *wallet, QWidget *parent = nullptr);
    ~BrowserView();

public slots:
    // Bridge methods exposed to JavaScript
    Q_INVOKABLE QString signMessage(const QString &message);
    Q_INVOKABLE QString getAddress();
    Q_INVOKABLE bool isAuthenticated();
    Q_INVOKABLE QString getUsername();
    Q_INVOKABLE QVariantMap getChainStatus();

signals:
    void titleUpdated(const QString &title);
    void loadingStarted();
    void loadingFinished(bool success);

protected:
    void contextMenuEvent(QContextMenuEvent *event) override;

private:
    void setupWebChannel();
    void injectAbyssBridge();

    QWebChannel *m_channel;
    AbyssIDManager *m_abyssIdManager;
    WalletBridge *m_walletBridge;
};

#else

// Stub class when WebEngine is not available
#include <QUrl>
#include <QLabel>
#include <QVBoxLayout>

class AbyssIDManager;
class WalletBridge;

// Placeholder page object for non-WebEngine builds
class StubPage : public QObject
{
    Q_OBJECT
public:
    explicit StubPage(QObject *parent = nullptr) : QObject(parent) {}
    void runJavaScript(const QString &, const std::function<void(const QVariant &)> & = {}) {}
    void setDevToolsPage(void*) {}
    void* devToolsPage() { return nullptr; }
};

class BrowserView : public QWidget
{
    Q_OBJECT

public:
    explicit BrowserView(AbyssIDManager *abyssId, WalletBridge *wallet, QWidget *parent = nullptr)
        : QWidget(parent), m_stubPage(new StubPage(this))
    { 
        Q_UNUSED(abyssId); Q_UNUSED(wallet);
        auto layout = new QVBoxLayout(this);
        auto label = new QLabel("WebEngine not available.\nUse QML interface instead.", this);
        label->setAlignment(Qt::AlignCenter);
        layout->addWidget(label);
    }
    ~BrowserView() = default;
    
    // Stub methods to match WebEngineView interface
    void load(const QUrl &url) { Q_UNUSED(url); }
    void back() {}
    void forward() {}
    void reload() {}
    StubPage* page() { return m_stubPage; }

public slots:
    Q_INVOKABLE QString signMessage(const QString &message) { Q_UNUSED(message); return QString(); }
    Q_INVOKABLE QString getAddress() { return QString(); }
    Q_INVOKABLE bool isAuthenticated() { return false; }
    Q_INVOKABLE QString getUsername() { return QString(); }
    Q_INVOKABLE QVariantMap getChainStatus() { return QVariantMap(); }

signals:
    void titleUpdated(const QString &title);
    void loadingStarted();
    void loadingFinished(bool success);

private:
    StubPage *m_stubPage;
};

#endif // QOR_WEBENGINE_ENABLED

#endif // BROWSERVIEW_H
