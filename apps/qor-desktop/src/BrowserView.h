/**
 * BrowserView - WebEngine View with AbyssOS Integration
 * 
 * Custom WebEngineView that provides native bridge to AbyssID and Wallet.
 */

#ifndef BROWSERVIEW_H
#define BROWSERVIEW_H

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

#endif // BROWSERVIEW_H
