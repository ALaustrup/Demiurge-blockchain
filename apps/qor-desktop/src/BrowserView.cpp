/**
 * BrowserView Implementation
 */

#include "BrowserView.h"
#include "AbyssIDManager.h"
#include "WalletBridge.h"

#include <QWebEnginePage>
#include <QWebEngineSettings>
#include <QWebEngineScript>
#include <QWebEngineScriptCollection>
#include <QContextMenuEvent>
#include <QMenu>
#include <QFile>
#include <QDebug>

BrowserView::BrowserView(AbyssIDManager *abyssId, WalletBridge *wallet, QWidget *parent)
    : QWebEngineView(parent)
    , m_channel(nullptr)
    , m_abyssIdManager(abyssId)
    , m_walletBridge(wallet)
{
    // Configure page settings
    QWebEngineSettings *settings = page()->settings();
    settings->setAttribute(QWebEngineSettings::JavascriptEnabled, true);
    settings->setAttribute(QWebEngineSettings::LocalStorageEnabled, true);
    settings->setAttribute(QWebEngineSettings::WebGLEnabled, true);
    settings->setAttribute(QWebEngineSettings::Accelerated2dCanvasEnabled, true);
    settings->setAttribute(QWebEngineSettings::PluginsEnabled, true);
    
    // Setup web channel for native bridge
    setupWebChannel();
    
    // Connect signals
    connect(this, &QWebEngineView::titleChanged, this, &BrowserView::titleUpdated);
    connect(this, &QWebEngineView::loadStarted, this, &BrowserView::loadingStarted);
    connect(this, &QWebEngineView::loadFinished, this, &BrowserView::loadingFinished);
    
    // Inject bridge script after page loads
    connect(this, &QWebEngineView::loadFinished, this, &BrowserView::injectAbyssBridge);
}

BrowserView::~BrowserView()
{
}

void BrowserView::setupWebChannel()
{
    m_channel = new QWebChannel(this);
    
    // Register this object for JavaScript access
    m_channel->registerObject(QStringLiteral("abyssNative"), this);
    m_channel->registerObject(QStringLiteral("abyssId"), m_abyssIdManager);
    m_channel->registerObject(QStringLiteral("wallet"), m_walletBridge);
    
    page()->setWebChannel(m_channel);
}

void BrowserView::injectAbyssBridge()
{
    // Inject the qwebchannel.js and bridge initialization
    QString bridgeScript = R"(
        // Wait for Qt WebChannel to be ready
        new QWebChannel(qt.webChannelTransport, function(channel) {
            // Expose native objects to window
            window.abyssNative = channel.objects.abyssNative;
            window.abyssIdNative = channel.objects.abyssId;
            window.walletNative = channel.objects.wallet;
            
            // Create Abyss Desktop Bridge
            window.ABYSS_DESKTOP = {
                isDesktop: true,
                version: '%1',
                
                // AbyssID methods
                isAuthenticated: function() {
                    return window.abyssIdNative.isAuthenticated();
                },
                
                getUsername: function() {
                    return window.abyssIdNative.username;
                },
                
                getAddress: function() {
                    return window.abyssIdNative.getPublicKey();
                },
                
                signMessage: function(message) {
                    return new Promise(function(resolve, reject) {
                        try {
                            var signature = window.abyssIdNative.signMessage(message);
                            resolve(signature);
                        } catch (e) {
                            reject(e);
                        }
                    });
                },
                
                // Chain status
                getChainStatus: function() {
                    return window.walletNative.getChainStatus();
                }
            };
            
            // Dispatch ready event
            window.dispatchEvent(new CustomEvent('abyss-desktop-ready', {
                detail: window.ABYSS_DESKTOP
            }));
            
            console.log('[Abyss Desktop] Native bridge initialized');
        });
    )";
    
    bridgeScript = bridgeScript.arg(APP_VERSION);
    
    page()->runJavaScript(bridgeScript);
}

QString BrowserView::signMessage(const QString &message)
{
    return m_abyssIdManager->signMessage(message);
}

QString BrowserView::getAddress()
{
    return m_abyssIdManager->getPublicKey();
}

bool BrowserView::isAuthenticated()
{
    return m_abyssIdManager->isAuthenticated();
}

QString BrowserView::getUsername()
{
    return m_abyssIdManager->username();
}

QVariantMap BrowserView::getChainStatus()
{
    return m_walletBridge->getChainStatus();
}

void BrowserView::contextMenuEvent(QContextMenuEvent *event)
{
    QMenu *menu = page()->createStandardContextMenu();
    
    // Add custom actions
    menu->addSeparator();
    menu->addAction(tr("&Back"), this, &QWebEngineView::back);
    menu->addAction(tr("&Forward"), this, &QWebEngineView::forward);
    menu->addAction(tr("&Reload"), this, &QWebEngineView::reload);
    
    menu->popup(event->globalPos());
}
