import { useState, useEffect, useRef } from 'react';
import { useAbyssID } from '../../../hooks/useAbyssID';
import { useChainStatus } from '../../../hooks/useChainStatus';
import { Button } from '../../shared/Button';
import { getAbyssBridge } from '../../../services/web3Bridge/abyssBridge';

export function AbyssBrowserApp() {
  const { session, login, signMessage } = useAbyssID();
  const { status, info } = useChainStatus();
  const [url, setUrl] = useState('https://example.com');
  const [currentUrl, setCurrentUrl] = useState('');
  const [isWeb3Ready, setIsWeb3Ready] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const bridgeRef = useRef(getAbyssBridge());

  // Initialize Web3 bridge
  useEffect(() => {
    const bridge = bridgeRef.current;
    
    // Update bridge with current session and chain status
    bridge.setSession(session ? { username: session.username, publicKey: session.publicKey } : null);
    bridge.setChainStatus({ status, info });
    bridge.setSignMessageFn(async (message: string) => {
      return signMessage(message);
    });

    // Check if current site is Web3-aware (simple heuristic)
    if (currentUrl) {
      try {
        new URL(currentUrl);
        // In the future, this could check for a manifest or meta tag
        setIsWeb3Ready(true); // For now, assume all sites can be Web3-aware
      } catch {
        setIsWeb3Ready(false);
      }
    }

    return () => {
      // Bridge cleanup is handled by singleton pattern
    };
  }, [session, status, info, currentUrl, signMessage]);

  const handleNavigate = () => {
    if (url.trim()) {
      setCurrentUrl(url.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNavigate();
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center space-x-2 pb-2 border-b border-abyss-cyan/20">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 px-3 py-1.5 bg-abyss-dark border border-abyss-cyan/30 rounded-lg text-white text-sm focus:outline-none focus:border-abyss-cyan focus:ring-2 focus:ring-abyss-cyan/50"
          placeholder="Enter URL..."
        />
        <Button onClick={handleNavigate} className="px-4">
          Go
        </Button>
      </div>

      {/* Identity bar */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">Browsing as:</span>
          {session ? (
            <span className="text-abyss-cyan font-medium">{session.username}</span>
          ) : (
            <>
              <span className="text-gray-500">Guest</span>
              <Button onClick={() => login()} variant="ghost" className="px-2 py-1 text-xs">
                Login with AbyssID
              </Button>
            </>
          )}
          {isWeb3Ready && (
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs">
              Web3-ready
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">Chain:</span>
          <span className={status === 'online' ? 'text-green-400' : 'text-red-400'}>
            {status === 'online' ? 'Connected to Demiurge' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Iframe content */}
      <div className="flex-1 border border-abyss-cyan/20 rounded-lg overflow-hidden bg-abyss-dark">
        {currentUrl ? (
          <iframe
            ref={iframeRef}
            src={currentUrl}
            className="w-full h-full border-0"
            title="AbyssBrowser"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Enter a URL and click Go to browse
          </div>
        )}
      </div>

      {session && (
        <div className="text-xs text-gray-500 pt-2 border-t border-abyss-cyan/10">
          Public Key: <span className="font-mono text-gray-400">{session.publicKey.slice(0, 16)}...</span>
        </div>
      )}
    </div>
  );
}

