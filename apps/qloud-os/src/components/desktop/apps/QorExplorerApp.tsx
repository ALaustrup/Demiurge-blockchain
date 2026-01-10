/**
 * QOR Explorer - Web3 Browser Application
 * 
 * A full-featured Web2+Web3 browser integrated with QorID and QOR Wallet.
 * Supports multiple tabs, bookmarks, history, and Web3 dApp interactions.
 * Features a modular navigation bar that can be positioned at top/bottom/left/right.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQorID } from '../../../hooks/useAbyssID';
import { useAbyssIDIdentity } from '../../../hooks/useAbyssIDIdentity';
import { useChainStatus } from '../../../hooks/useChainStatus';
import { Button } from '../../shared/Button';
import { getAbyssBridge } from '../../../services/web3Bridge/qorBridge';
import { ABYSS_WEB3_INJECTION_SCRIPT } from '../../../services/web3Bridge/web3Injector';
import { useBrowserStore, selectActiveTab } from '../../../services/browser/browserStore';
import { ExplorerNavBar, ExplorerBookmarks } from './explorer';

// ============================================================================
// Internal Pages
// ============================================================================

interface InternalPageProps {
  path: string;
  onNavigate: (url: string) => void;
}

function InternalPage({ path, onNavigate }: InternalPageProps) {
  const { identity } = useAbyssIDIdentity();
  const { status } = useChainStatus();
  const bookmarks = useBrowserStore(state => state.bookmarks);
  const navPosition = useBrowserStore(state => state.navPosition);
  const setNavPosition = useBrowserStore(state => state.setNavPosition);

  if (path === 'home' || path === '') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center overflow-y-auto">
        <div className="text-6xl mb-4">🌊</div>
        <h2 className="text-2xl font-bold text-genesis-cipher-cyan mb-2">QOR Explorer</h2>
        <p className="text-genesis-text-tertiary mb-6">Navigate the Demiurge Network with Web3 integration</p>
        
        {/* Quick links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-2xl">
          {[
            { name: 'OpenSea', url: 'https://opensea.io', icon: '🖼️' },
            { name: 'Uniswap', url: 'https://app.uniswap.org', icon: '🦄' },
            { name: 'Etherscan', url: 'https://etherscan.io', icon: '🔍' },
            { name: 'DefiLlama', url: 'https://defillama.com', icon: '🦙' },
          ].map(link => (
            <button
              key={link.url}
              onClick={() => onNavigate(link.url)}
              className="flex flex-col items-center gap-2 p-4 bg-genesis-glass-light/50 border border-genesis-border-default/20 rounded-lg hover:border-genesis-border-default/50 hover:bg-genesis-glass-light transition-all"
            >
              <span className="text-2xl">{link.icon}</span>
              <span className="text-sm text-genesis-text-secondary">{link.name}</span>
            </button>
          ))}
        </div>
        
        {/* Status info */}
        <div className="flex items-center gap-4 text-sm mb-6">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${identity ? 'bg-green-500' : 'bg-gray-500'}`} />
            <span className="text-genesis-text-tertiary">
              {identity ? `${identity.username || 'Connected'}` : 'Not logged in'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${status.state === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-genesis-text-tertiary">
              {status.state === 'connected' ? `Block #${status.height}` : 'Chain Offline'}
            </span>
          </div>
        </div>
        
        {/* Recent bookmarks */}
        {bookmarks.length > 0 && (
          <div className="w-full max-w-lg mb-8">
            <h3 className="text-sm font-medium text-genesis-text-tertiary mb-3">Recent Bookmarks</h3>
            <div className="space-y-2">
              {bookmarks.slice(0, 5).map(b => (
                <button
                  key={b.id}
                  onClick={() => onNavigate(b.url)}
                  className="w-full flex items-center gap-3 p-2 bg-genesis-glass-light/30 rounded-lg hover:bg-genesis-glass-light/50 transition-colors text-left"
                >
                  <span className="text-sm">⭐</span>
                  <span className="flex-1 text-sm text-genesis-text-secondary truncate">{b.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tip */}
        <div className="text-xs text-gray-500 max-w-md">
          <p>💡 <strong>Tip:</strong> Click the ⚙️ settings button in the navigation bar to reposition it (top, bottom, left, or right).</p>
        </div>
      </div>
    );
  }
  
  if (path === 'settings') {
    return <ExplorerSettings />;
  }
  
  if (path === 'history') {
    return <ExplorerHistory onNavigate={onNavigate} />;
  }
  
  return (
    <div className="w-full h-full flex items-center justify-center text-genesis-text-tertiary">
      <p>Unknown page: <code className="text-genesis-cipher-cyan">abyss://{path}</code></p>
    </div>
  );
}

// Settings page
function ExplorerSettings() {
  const homePage = useBrowserStore(state => state.homePage);
  const searchEngine = useBrowserStore(state => state.searchEngine);
  const navPosition = useBrowserStore(state => state.navPosition);
  const compactMode = useBrowserStore(state => state.compactMode);
  const setHomePage = useBrowserStore(state => state.setHomePage);
  const setSearchEngine = useBrowserStore(state => state.setSearchEngine);
  const setNavPosition = useBrowserStore(state => state.setNavPosition);
  const setCompactMode = useBrowserStore(state => state.setCompactMode);
  const clearHistory = useBrowserStore(state => state.clearHistory);
  
  return (
    <div className="w-full h-full p-6 overflow-y-auto">
      <h2 className="text-xl font-bold text-genesis-cipher-cyan mb-6">Explorer Settings</h2>
      
      <div className="space-y-6 max-w-lg">
        {/* Navigation position */}
        <div>
          <label className="block text-sm text-genesis-text-tertiary mb-2">Navigation Bar Position</label>
          <div className="grid grid-cols-4 gap-2">
            {(['top', 'bottom', 'left', 'right'] as const).map(pos => (
              <button
                key={pos}
                onClick={() => setNavPosition(pos)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  navPosition === pos
                    ? 'bg-abyss-cyan/20 text-genesis-cipher-cyan border border-genesis-border-default'
                    : 'bg-genesis-glass-light border border-genesis-border-default/30 text-genesis-text-tertiary hover:text-white'
                }`}
              >
                {pos.charAt(0).toUpperCase() + pos.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Compact mode */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={compactMode}
              onChange={(e) => setCompactMode(e.target.checked)}
              className="w-4 h-4 rounded border-genesis-border-default/30 bg-genesis-glass-light text-genesis-cipher-cyan focus:ring-abyss-cyan/50"
            />
            <span className="text-sm text-genesis-text-secondary">Compact Mode</span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-7">Hide tab titles and show only favicons</p>
        </div>
        
        {/* Home page */}
        <div>
          <label className="block text-sm text-genesis-text-tertiary mb-2">Home Page</label>
          <input
            type="text"
            value={homePage}
            onChange={(e) => setHomePage(e.target.value)}
            className="w-full px-3 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded-lg text-white text-sm focus:outline-none focus:border-genesis-border-default"
          />
        </div>
        
        {/* Search engine */}
        <div>
          <label className="block text-sm text-genesis-text-tertiary mb-2">Search Engine</label>
          <select
            value={searchEngine}
            onChange={(e) => setSearchEngine(e.target.value as any)}
            className="w-full px-3 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded-lg text-white text-sm focus:outline-none focus:border-genesis-border-default"
          >
            <option value="duckduckgo">DuckDuckGo</option>
            <option value="google">Google</option>
            <option value="brave">Brave Search</option>
          </select>
        </div>
        
        {/* Clear history */}
        <div>
          <label className="block text-sm text-genesis-text-tertiary mb-2">Privacy</label>
          <Button onClick={clearHistory} variant="secondary" className="text-sm">
            Clear Browsing History
          </Button>
        </div>
      </div>
    </div>
  );
}

// History page
function ExplorerHistory({ onNavigate }: { onNavigate: (url: string) => void }) {
  const history = useBrowserStore(state => state.history);
  const removeHistoryEntry = useBrowserStore(state => state.removeHistoryEntry);
  const clearHistory = useBrowserStore(state => state.clearHistory);
  
  // Group by date
  const groupedHistory = history.reduce((acc, entry) => {
    const date = new Date(entry.visitedAt).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, typeof history>);
  
  return (
    <div className="w-full h-full p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-genesis-cipher-cyan">Browsing History</h2>
        {history.length > 0 && (
          <Button onClick={clearHistory} variant="ghost" className="text-sm text-red-400">
            Clear All
          </Button>
        )}
      </div>
      
      {history.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <p>No browsing history yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedHistory).map(([date, entries]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-genesis-text-tertiary mb-2">{date}</h3>
              <div className="space-y-1">
                {entries.map((entry, i) => (
                  <div
                    key={`${entry.url}-${i}`}
                    className="group flex items-center gap-3 p-2 hover:bg-genesis-glass-light/50 rounded-lg cursor-pointer"
                    onClick={() => onNavigate(entry.url)}
                  >
                    <span className="text-gray-500 text-xs">
                      {new Date(entry.visitedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{entry.title}</div>
                      <div className="text-xs text-gray-500 truncate">{entry.url}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeHistoryEntry(entry.url);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function QorExplorerApp() {
  const { session, login, signMessage } = useQorID();
  const { identity } = useAbyssIDIdentity();
  const { status } = useChainStatus();
  
  // Browser state
  const tabs = useBrowserStore(state => state.tabs);
  const activeTab = useBrowserStore(selectActiveTab);
  const navPosition = useBrowserStore(state => state.navPosition);
  const createTab = useBrowserStore(state => state.createTab);
  const updateTab = useBrowserStore(state => state.updateTab);
  const navigateTab = useBrowserStore(state => state.navigateTab);
  const addHistoryEntry = useBrowserStore(state => state.addHistoryEntry);
  
  // UI state
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [iframeError, setIframeError] = useState<string | null>(null);
  
  // Refs
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const bridgeRef = useRef(getAbyssBridge());

  // Initialize with a tab if none exist
  useEffect(() => {
    if (tabs.length === 0) {
      createTab();
    }
  }, [tabs.length, createTab]);

  // Update Web3 bridge with current session
  useEffect(() => {
    const bridge = bridgeRef.current;
    
    bridge.setSession(session ? { username: session.username, publicKey: session.publicKey } : null);
    bridge.setChainStatus(
      status.state === 'connected'
        ? { status: 'online', info: { height: status.height } }
        : status.state === 'error'
        ? { status: 'offline', info: null }
        : { status: 'connecting', info: null }
    );
    bridge.setSignMessageFn(async (message: string) => {
      const result = await signMessage(message);
      return typeof result === 'string' ? result : (result as any).signature || '';
    });
  }, [session, status, signMessage]);

  // Handle navigation from bookmarks/internal pages
  const handleNavigate = useCallback((url: string) => {
    if (activeTab) {
      navigateTab(activeTab.id, url);
      setIframeError(null);
    }
  }, [activeTab, navigateTab]);

  // Handle iframe load
  const handleIframeLoad = useCallback((e: React.SyntheticEvent<HTMLIFrameElement>) => {
    setIframeError(null);
    
    if (!activeTab) return;
    
    // Update tab title from iframe
    try {
      const iframe = e.currentTarget;
      const title = iframe.contentDocument?.title || activeTab.url;
      updateTab(activeTab.id, { 
        title, 
        isLoading: false,
      });
      
      // Add to history
      if (!activeTab.url.startsWith('abyss://')) {
        addHistoryEntry({ url: activeTab.url, title });
      }
      
      // Inject Web3 script
      const iframeWindow = iframe.contentWindow;
      if (iframeWindow) {
        const script = iframeWindow.document.createElement('script');
        script.textContent = ABYSS_WEB3_INJECTION_SCRIPT;
        iframeWindow.document.head.appendChild(script);
        
        // Detect Web3
        updateTab(activeTab.id, {
          isWeb3: !!(iframeWindow as any).ethereum,
        });
      }
    } catch (error) {
      // Cross-origin - expected
      console.log('Could not access iframe content (cross-origin)');
      updateTab(activeTab.id, { isLoading: false });
    }
  }, [activeTab, updateTab, addHistoryEntry]);

  // Handle iframe error
  const handleIframeError = useCallback(() => {
    setIframeError("This site can't be displayed in QOR Explorer (likely blocking iframe embeds)");
    if (activeTab) {
      updateTab(activeTab.id, { isLoading: false });
    }
  }, [activeTab, updateTab]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    if (iframeRef.current && activeTab && !activeTab.url.startsWith('abyss://')) {
      updateTab(activeTab.id, { isLoading: true });
      iframeRef.current.src = activeTab.url;
    }
  }, [activeTab, updateTab]);

  const isInternalPage = activeTab?.url.startsWith('abyss://') ?? false;
  const internalPath = isInternalPage && activeTab ? activeTab.url.replace('abyss://', '') : '';

  // Determine layout based on nav position
  const isVerticalNav = navPosition === 'left' || navPosition === 'right';
  
  // Build the layout
  const NavBar = (
    <ExplorerNavBar
      onRefresh={handleRefresh}
      onToggleBookmarks={() => setShowBookmarks(!showBookmarks)}
      showBookmarks={showBookmarks}
    />
  );

  const ContentArea = (
    <div className="flex-1 flex min-h-0 min-w-0">
      {/* Bookmarks Sidebar (only for horizontal nav) */}
      {showBookmarks && !isVerticalNav && (
        <ExplorerBookmarks
          onNavigate={handleNavigate}
          onClose={() => setShowBookmarks(false)}
        />
      )}
      
      {/* Browser Content */}
      <div className="flex-1 border border-genesis-border-default/20 rounded-lg overflow-hidden bg-genesis-glass-light min-h-0 relative m-1">
        {!activeTab ? (
          <div className="w-full h-full flex items-center justify-center text-genesis-text-tertiary">
            No tab selected
          </div>
        ) : isInternalPage ? (
          <InternalPage path={internalPath} onNavigate={handleNavigate} />
        ) : (
          <>
            {/* Error overlay */}
            {iframeError && (
              <div className="absolute inset-0 flex items-center justify-center bg-genesis-glass-light/95 backdrop-blur-sm z-10 p-8">
                <div className="text-center max-w-md">
                  <div className="text-red-400 text-4xl mb-4">⚠️</div>
                  <p className="text-red-400 mb-2 text-lg font-medium">{iframeError}</p>
                  <p className="text-genesis-text-tertiary text-sm mb-4">
                    Many websites block embedding for security. You can open it in a new browser window instead.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => window.open(activeTab.url, '_blank')} variant="secondary">
                      Open in New Window
                    </Button>
                    <Button onClick={() => setIframeError(null)} variant="ghost">
                      Try Again
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Loading indicator */}
            {activeTab.isLoading && !iframeError && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-genesis-glass-light overflow-hidden z-10">
                <div className="h-full w-1/3 bg-abyss-cyan animate-[loading_1s_ease-in-out_infinite]" />
              </div>
            )}
            
            {/* Iframe */}
            <iframe
              ref={iframeRef}
              src={activeTab.url}
              className="w-full h-full border-0"
              title="QOR Explorer"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          </>
        )}
      </div>
    </div>
  );

  const StatusBar = (
    <div className="flex items-center justify-between px-3 py-1 bg-genesis-glass-light/50 border-t border-genesis-border-default/20 text-xs">
      <div className="flex items-center gap-3">
        {identity ? (
          <span className="text-genesis-text-tertiary">
            <span className="text-genesis-cipher-cyan">{identity.username}</span>
          </span>
        ) : (
          <button onClick={() => login()} className="text-genesis-text-tertiary hover:text-genesis-cipher-cyan transition-colors">
            Login
          </button>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        {activeTab?.isWeb3 && (
          <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-[10px]">
            Web3
          </span>
        )}
        {activeTab?.isDRC369 && (
          <span className="px-1.5 py-0.5 bg-abyss-purple/20 text-abyss-purple border border-abyss-purple/30 rounded text-[10px]">
            DRC-369
          </span>
        )}
        <span className={status.state === 'connected' ? 'text-green-400' : 'text-red-400'}>
          {status.state === 'connected' ? `⬢ #${status.height}` : '⬢ Offline'}
        </span>
      </div>
    </div>
  );

  // Render based on nav position
  return (
    <div className="h-full flex min-h-0 bg-abyss-navy/30">
      {/* Left nav */}
      {navPosition === 'left' && NavBar}
      
      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Top nav */}
        {navPosition === 'top' && NavBar}
        
        {/* Content */}
        {ContentArea}
        
        {/* Status bar (only for top/bottom nav) */}
        {!isVerticalNav && StatusBar}
        
        {/* Bottom nav */}
        {navPosition === 'bottom' && NavBar}
      </div>
      
      {/* Right nav */}
      {navPosition === 'right' && NavBar}
      
      {/* CSS for loading animation */}
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
