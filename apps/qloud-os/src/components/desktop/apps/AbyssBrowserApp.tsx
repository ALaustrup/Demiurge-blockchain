import { useState, useEffect, useRef } from 'react';
import { useQorID } from '../../../hooks/useAbyssID';
import { useChainStatus } from '../../../hooks/useChainStatus';
import { Button } from '../../shared/Button';
import { getAbyssBridge } from '../../../services/web3Bridge/qorBridge';
import { ABYSS_WEB3_INJECTION_SCRIPT } from '../../../services/web3Bridge/web3Injector';

/**
 * Normalize URL input to a valid URL string
 */
function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  
  // If it already has a scheme (http/https), keep it
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  
  // Otherwise default to https
  return `https://${trimmed}`;
}

/**
 * Internal page component for abyss:// protocol
 */
function InternalPage({ path }: { path: string }) {
  if (path === 'home' || path === '') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="text-6xl mb-4">🌊</div>
        <h2 className="text-2xl font-bold text-genesis-cipher-cyan mb-2">QOR OS Browser</h2>
        <p className="text-genesis-text-tertiary mb-4">Navigate the depths of the Demiurge Network</p>
        <div className="text-sm text-gray-500 space-y-1">
          <p>• Type a URL to browse the web</p>
          <p>• Use <code className="text-genesis-cipher-cyan">abyss://</code> for internal pages</p>
          <p>• DRC-369 assets are ready for Web3 integration</p>
        </div>
      </div>
    );
  }
  
  if (path === 'drc-369') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="text-6xl mb-4">🔷</div>
        <h2 className="text-2xl font-bold text-genesis-cipher-cyan mb-2">DRC-369 Assets</h2>
        <p className="text-genesis-text-tertiary mb-4">Browse DRC-369 assets in the Files app</p>
        <p className="text-sm text-gray-500">Open the Files app from the dock to view your assets</p>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full flex items-center justify-center text-genesis-text-tertiary">
      <p>Unknown internal page: <code className="text-genesis-cipher-cyan">abyss://{path}</code></p>
    </div>
  );
}

export function AbyssBrowserApp() {
  const { session, login, signMessage } = useQorID();
  const { status } = useChainStatus();
  const [inputUrl, setInputUrl] = useState<string>('abyss://home');
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isWeb3Ready, setIsWeb3Ready] = useState(false);
  const [isDRC369Ready, setIsDRC369Ready] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const bridgeRef = useRef(getAbyssBridge());

  // Initialize Web3 bridge
  useEffect(() => {
    const bridge = bridgeRef.current;
    
    // Update bridge with current session and chain status
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

    // Check if current site is Web3-aware
    if (currentUrl && !currentUrl.startsWith('abyss://')) {
      try {
        new URL(currentUrl);
        setIsWeb3Ready(true);
        setIsDRC369Ready(true);
      } catch {
        setIsWeb3Ready(false);
        setIsDRC369Ready(false);
      }
    } else {
      setIsWeb3Ready(false);
      setIsDRC369Ready(false);
    }

    // Listen for DRC-369 handshake messages from iframe
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "ABYSS_REQUEST_IDENTITY" || event.data?.type === "ABYSS_REQUEST") {
        setIsDRC369Ready(true);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [session, status, currentUrl, signMessage]);

  const handleNavigate = () => {
    const trimmed = inputUrl.trim();
    if (!trimmed) return;

    setLastError(null);

    // Handle internal abyss:// protocol
    if (trimmed.startsWith('abyss://')) {
      setCurrentUrl(trimmed);
      return;
    }

    // Normalize and set external URL
    try {
      const normalized = normalizeUrl(trimmed);
      setCurrentUrl(normalized);
    } catch (error) {
      setLastError('Invalid URL');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNavigate();
    }
  };

  const isInternalPage = currentUrl?.startsWith('abyss://') ?? false;
  const internalPath = isInternalPage && currentUrl ? currentUrl.replace('abyss://', '') : '';

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Top bar */}
      <div className="flex items-center space-x-2 pb-2 border-b border-genesis-border-default/20">
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 px-3 py-1.5 bg-genesis-glass-light border border-genesis-border-default/30 rounded-lg text-white text-sm focus:outline-none focus:border-genesis-border-default focus:ring-2 focus:ring-abyss-cyan/50"
          placeholder="Enter URL or abyss://..."
        />
        <Button onClick={handleNavigate} className="px-4">
          Go
        </Button>
      </div>

      {/* Identity bar */}
      <div className="flex items-center justify-between text-xs py-2 border-b border-genesis-border-default/10">
        <div className="flex items-center space-x-2">
          <span className="text-genesis-text-tertiary">Browsing as:</span>
          {session ? (
            <span className="text-genesis-cipher-cyan font-medium">{session.username}</span>
          ) : (
            <>
              <span className="text-gray-500">Guest</span>
              <Button onClick={() => login()} variant="ghost" className="px-2 py-1 text-xs">
                Login with QorID
              </Button>
            </>
          )}
          {isWeb3Ready && (
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs">
              Web3-ready
            </span>
          )}
          {isDRC369Ready && (
            <span className="px-2 py-0.5 bg-abyss-purple/20 text-abyss-purple border border-abyss-purple/30 rounded text-xs">
              DRC-369 Ready
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-genesis-text-tertiary">Chain:</span>
          <span className={status.state === 'connected' ? 'text-green-400' : 'text-red-400'}>
            {status.state === 'connected' ? 'Connected to Demiurge' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 border border-genesis-border-default/20 rounded-lg overflow-hidden bg-genesis-glass-light min-h-0 relative">
        {!currentUrl ? (
          <div className="w-full h-full flex items-center justify-center text-genesis-text-tertiary">
            Enter a URL and click Go to browse
          </div>
        ) : isInternalPage ? (
          <InternalPage path={internalPath} />
        ) : (
          <>
            {lastError && (
              <div className="absolute inset-0 flex items-center justify-center bg-genesis-glass-light/95 backdrop-blur-sm z-10 p-8">
                <div className="text-center max-w-md">
                  <div className="text-red-400 text-4xl mb-4">⚠️</div>
                  <p className="text-red-400 mb-2 text-lg font-medium">This site can't be shown inside AbyssBrowser</p>
                  <p className="text-genesis-text-tertiary text-sm mb-4">The site is likely blocking iframe embeds (X-Frame-Options/CSP)</p>
                  <Button onClick={() => window.open(currentUrl, '_blank')} className="mt-4" variant="secondary">
                    Open in New Tab
                  </Button>
                </div>
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={currentUrl}
              className="w-full h-full border-0"
              title="AbyssBrowser"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
              onLoad={(e) => {
                setLastError(null);
                // Inject Web3 script into iframe
                try {
                  const iframe = e.currentTarget;
                  const iframeWindow = iframe.contentWindow;
                  if (iframeWindow) {
                    const script = iframeWindow.document.createElement('script');
                    script.textContent = ABYSS_WEB3_INJECTION_SCRIPT;
                    iframeWindow.document.head.appendChild(script);
                  }
                } catch (error) {
                  // Cross-origin restrictions - expected for external sites
                  console.log('Could not inject Web3 script (cross-origin):', error);
                }
              }}
              onError={() => setLastError("This site can't be shown inside AbyssBrowser (likely blocking iframe embeds).")}
            />
          </>
        )}
      </div>

      {session && (
        <div className="text-xs text-gray-500 pt-2 border-t border-genesis-border-default/10">
          Public Key: <span className="font-mono text-genesis-text-tertiary">{session.publicKey.slice(0, 16)}...</span>
        </div>
      )}
    </div>
  );
}
