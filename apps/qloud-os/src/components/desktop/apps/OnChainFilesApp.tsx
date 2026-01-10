import { useState, useEffect } from 'react';
import { useAbyssIDIdentity } from '../../../hooks/useAbyssIDIdentity';
import { Button } from '../../shared/Button';
import { abyssIdSDK } from '../../../services/qorid/sdk';
import type { DRC369 } from '../../../services/drc369/schema';

const TABS = [
  { id: 'my-assets', label: 'My DRC-369', icon: '🜁' },
  { id: 'network', label: 'Network', icon: '⧉' },
  { id: 'explorer', label: 'Chain Explorer', icon: '⟁' },
] as const;

type TabId = (typeof TABS)[number]['id'] | 'custom';

type MintStatus = 'idle' | 'minting' | 'finalizing' | 'confirmed' | 'error';

/**
 * My Assets View - Shows DRC-369 assets owned by current user
 * Uses unified QorID identity system - automatically syncs with logged-in user
 */
function MyAssetsView() {
  const { identity } = useAbyssIDIdentity();
  const session = identity ? { username: identity.username, publicKey: identity.publicKey } : null;
  const [assets, setAssets] = useState<DRC369[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMintForm, setShowMintForm] = useState(false);
  const [mintStatus, setMintStatus] = useState<MintStatus>('idle');
  const [mintResult, setMintResult] = useState<{ txHash?: string; blockHeight?: number } | null>(null);
  const [mintForm, setMintForm] = useState({
    name: '',
    description: '',
    uri: '',
    contentType: 'other' as DRC369['contentType'],
    priceCgt: 0,
  });

  useEffect(() => {
    async function loadAssets() {
      if (!session) {
        setAssets([]);
        setLoading(false);
        return;
      }

      try {
        // Load DRC-369 assets
        const owned = await abyssIdSDK.drc369.getOwned({ owner: session.publicKey });
        
        // Also load uploaded files (which are auto-minted as DRC-369)
        try {
          const sessionToken = typeof window !== 'undefined' 
            ? localStorage.getItem('abyssos.abyssid.sessionId')
            : null;
          if (sessionToken) {
            const filesResponse = await fetch(
              `${import.meta.env.VITE_QORID_API_URL || 'http://localhost:8082'}/api/storage/files`,
              {
                headers: {
                  'Authorization': `Bearer ${sessionToken}`,
                },
              }
            );
            
            if (filesResponse.ok) {
              const { files } = await filesResponse.json();
              // Files are already included in DRC-369 assets if they were minted
              // But we can add them as file entries if needed
            }
          }
        } catch (fileError) {
          console.error('Failed to load files:', fileError);
        }
        
        setAssets(owned);
      } catch (error) {
        console.error('Failed to load assets:', error);
      } finally {
        setLoading(false);
      }
    }

    loadAssets();
  }, [session]);

  const handleMint = async () => {
    if (!session || !mintForm.name || !mintForm.uri) {
      alert('Please fill in name and URI');
      return;
    }

    setMintStatus('minting');
    setMintResult(null);

    try {
      // Step 1: Minting...
      const result = await abyssIdSDK.drc369.publishNative({
        uri: mintForm.uri,
        contentType: mintForm.contentType,
        owner: session.publicKey,
        name: mintForm.name,
        description: mintForm.description,
        priceCgt: mintForm.priceCgt,
        attributes: {},
      });

      // Step 2: Finalizing Transaction...
      setMintStatus('finalizing');
      setMintResult({
        txHash: result.txHash,
        blockHeight: result.blockHeight,
      });

      // Step 3: Confirmed
      setTimeout(() => {
        setMintStatus('confirmed');
        
        // Reload assets
        abyssIdSDK.drc369.getOwned({ owner: session.publicKey }).then(owned => {
          setAssets(owned);
        });
        
        // Reset form after a moment
        setTimeout(() => {
          setShowMintForm(false);
          setMintForm({ name: '', description: '', uri: '', contentType: 'other', priceCgt: 0 });
          setMintStatus('idle');
          setMintResult(null);
        }, 2000);
      }, 1500);
    } catch (error) {
      console.error('Mint failed:', error);
      setMintStatus('error');
      setTimeout(() => {
        setMintStatus('idle');
        setMintResult(null);
      }, 3000);
    }
  };

  if (!session) {
    return (
      <div className="text-center text-genesis-text-tertiary py-12">
        <p>Please log in to view your DRC-369 assets</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center text-genesis-text-tertiary py-12">
        <p>Loading your assets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-genesis-cipher-cyan">My DRC-369 Assets</h3>
        <Button onClick={() => setShowMintForm(!showMintForm)} className="px-4">
          {showMintForm ? 'Cancel' : 'Mint New Asset'}
        </Button>
      </div>

      {showMintForm && (
        <div className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4 space-y-3">
          <h4 className="text-genesis-cipher-cyan font-medium">Create DRC-369 Asset</h4>
          <input
            type="text"
            placeholder="Asset Name"
            value={mintForm.name}
            onChange={(e) => setMintForm({ ...mintForm, name: e.target.value })}
            className="w-full px-3 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded text-white text-sm"
          />
          <textarea
            placeholder="Description (optional)"
            value={mintForm.description}
            onChange={(e) => setMintForm({ ...mintForm, description: e.target.value })}
            className="w-full px-3 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded text-white text-sm"
            rows={2}
          />
          <input
            type="text"
            placeholder="URI (IPFS, HTTP, etc.)"
            value={mintForm.uri}
            onChange={(e) => setMintForm({ ...mintForm, uri: e.target.value })}
            className="w-full px-3 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded text-white text-sm"
          />
          <select
            value={mintForm.contentType}
            onChange={(e) => setMintForm({ ...mintForm, contentType: e.target.value as DRC369['contentType'] })}
            className="w-full px-3 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded text-white text-sm"
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
            <option value="model">3D Model</option>
            <option value="html-app">HTML App</option>
            <option value="binary">Binary</option>
            <option value="other">Other</option>
          </select>
          <input
            type="number"
            placeholder="Price (CGT, optional)"
            value={mintForm.priceCgt || ''}
            onChange={(e) => setMintForm({ ...mintForm, priceCgt: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded text-white text-sm"
          />
          <Button 
            onClick={handleMint} 
            className="w-full"
            disabled={mintStatus === 'minting' || mintStatus === 'finalizing'}
          >
            {mintStatus === 'minting' && 'Minting…'}
            {mintStatus === 'finalizing' && 'Finalizing Transaction…'}
            {mintStatus === 'confirmed' && 'Confirmed ✓'}
            {mintStatus === 'error' && 'Error - Retry'}
            {mintStatus === 'idle' && 'Mint DRC-369 Asset'}
          </Button>
          
          {mintStatus !== 'idle' && (
            <div className="mt-2 text-sm">
              {mintStatus === 'minting' && (
                <p className="text-genesis-cipher-cyan">Preparing transaction...</p>
              )}
              {mintStatus === 'finalizing' && (
                <p className="text-genesis-cipher-cyan">Submitting to Demiurge chain...</p>
              )}
              {mintStatus === 'confirmed' && mintResult && (
                <div className="text-green-400 space-y-1">
                  <p>✓ Confirmed on-chain</p>
                  {mintResult.txHash && (
                    <p className="text-xs text-genesis-text-tertiary">
                      TX: <code className="text-genesis-cipher-cyan">{mintResult.txHash.slice(0, 16)}...</code>
                    </p>
                  )}
                  {mintResult.blockHeight && (
                    <p className="text-xs text-genesis-text-tertiary">Block #{mintResult.blockHeight}</p>
                  )}
                </div>
              )}
              {mintStatus === 'error' && (
                <p className="text-red-400">Transaction failed. Please try again.</p>
              )}
            </div>
          )}
          {mintStatus === 'idle' && (
            <p className="text-xs text-gray-500">Minting on Demiurge chain</p>
          )}
        </div>
      )}

      {assets.length === 0 ? (
        <div className="text-center text-genesis-text-tertiary py-12">
          <p>No DRC-369 assets yet</p>
          <p className="text-sm mt-2">Click "Mint New Asset" to create your first asset</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4 hover:border-genesis-border-default/50 transition-colors cursor-pointer"
              onClick={() => {
                // TODO: Open asset viewer
                console.log('View asset:', asset);
              }}
            >
              {/* Asset Preview/Thumbnail */}
              {asset.uri && (
                <div className="mb-3 aspect-square bg-genesis-glass-light rounded-lg overflow-hidden flex items-center justify-center">
                  {asset.contentType === 'image' ? (
                    <img 
                      src={asset.uri} 
                      alt={asset.name || 'Asset'} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : asset.contentType === 'video' ? (
                    <div className="text-4xl">🎬</div>
                  ) : asset.contentType === 'audio' ? (
                    <div className="text-4xl">🎵</div>
                  ) : (
                    <div className="text-4xl">📄</div>
                  )}
                </div>
              )}
              
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-genesis-cipher-cyan truncate flex-1">
                    {asset.name || asset.attributes?.name || asset.attributes?.originalFilename || 'Untitled'}
                  </h3>
                  <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                    <span className="px-1.5 py-0.5 bg-abyss-purple/20 text-abyss-purple border border-abyss-purple/30 rounded text-xs font-mono">
                      {asset.chain}
                    </span>
                    {asset.bridgeWrapped && (
                      <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded text-xs">
                        Wrapped
                      </span>
                    )}
                    {asset.onChain && (
                      <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs">
                        On-Chain
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-genesis-text-tertiary mt-1 line-clamp-2">
                  {asset.description || asset.attributes?.description || 'No description'}
                </p>
              </div>
              <div className="text-xs text-gray-500 mb-3 space-y-1">
                <div>Standard: {asset.standard}</div>
                {asset.attributes?.fileSize && (
                  <div>Size: {((asset.attributes.fileSize as number) / 1024 / 1024).toFixed(2)} MB</div>
                )}
                {asset.attributes?.mimeType && (
                  <div>Type: {asset.attributes.mimeType as string}</div>
                )}
                {asset.priceCgt && <div>Price: {asset.priceCgt} CGT</div>}
                {asset.onChain && asset.txHash && (
                  <div className="mt-1">
                    <div>TX: <code className="text-genesis-cipher-cyan font-mono">{asset.txHash.slice(0, 12)}...</code></div>
                    {asset.blockHeight && <div>Block: #{asset.blockHeight}</div>}
                  </div>
                )}
                {asset.attributes?.originChain && (
                  <div className="text-yellow-400">Swapped from: {asset.attributes.originChain as string}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Network View - Shows public DRC-369 assets with filters
 */
function NetworkView() {
  const [assets, setAssets] = useState<DRC369[]>([]);
  const [loading, setLoading] = useState(true);
  const [chainFilter, setChainFilter] = useState<string>('all');
  const [standardFilter, setStandardFilter] = useState<string>('all');

  useEffect(() => {
    async function loadAssets() {
      try {
        const publicAssets = await abyssIdSDK.drc369.getPublic({
          chain: chainFilter !== 'all' ? chainFilter : undefined,
          standard: standardFilter !== 'all' ? standardFilter : undefined,
        });
        setAssets(publicAssets);
      } catch (error) {
        console.error('Failed to load network assets:', error);
      } finally {
        setLoading(false);
      }
    }

    loadAssets();
  }, [chainFilter, standardFilter]);

  if (loading) {
    return (
      <div className="text-center text-genesis-text-tertiary py-12">
        <p>Loading network assets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-genesis-cipher-cyan">Network Assets</h3>
        <div className="flex items-center space-x-2">
          <select
            value={chainFilter}
            onChange={(e) => setChainFilter(e.target.value)}
            className="px-3 py-1.5 bg-genesis-glass-light border border-genesis-border-default/30 rounded text-white text-sm"
          >
            <option value="all">All Chains</option>
            <option value="DEMIURGE">Demiurge</option>
            <option value="ETH">Ethereum</option>
            <option value="POLYGON">Polygon</option>
            <option value="BSC">BSC</option>
            <option value="SOL">Solana</option>
            <option value="BTC">Bitcoin</option>
          </select>
          <select
            value={standardFilter}
            onChange={(e) => setStandardFilter(e.target.value)}
            className="px-3 py-1.5 bg-genesis-glass-light border border-genesis-border-default/30 rounded text-white text-sm"
          >
            <option value="all">All Standards</option>
            <option value="DRC-369">DRC-369</option>
            <option value="ERC-721">ERC-721</option>
            <option value="ERC-1155">ERC-1155</option>
            <option value="SPL">SPL</option>
            <option value="ORDINAL">ORDINAL</option>
          </select>
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-2">
        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded">
          Devnet · Simulated CGT
        </span>
      </div>

      {assets.length === 0 ? (
        <div className="text-center text-genesis-text-tertiary py-12">
          <p>No assets found</p>
          <p className="text-sm mt-2">Try adjusting the filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4 hover:border-genesis-border-default/50 transition-colors"
            >
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-genesis-cipher-cyan truncate flex-1">
                    {asset.name || asset.attributes?.name || 'Untitled'}
                  </h3>
                  <div className="flex items-center space-x-1 ml-2">
                    {asset.chain === 'DEMIURGE' ? (
                      <span className="px-1.5 py-0.5 bg-abyss-cyan/20 text-genesis-cipher-cyan border border-genesis-border-default/30 rounded text-xs font-mono">
                        DRG
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-abyss-purple/20 text-abyss-purple border border-abyss-purple/30 rounded text-xs font-mono">
                        {asset.chain}
                      </span>
                    )}
                    {asset.bridgeWrapped && (
                      <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded text-xs">
                        Wrapped
                      </span>
                    )}
                    {asset.onChain && (
                      <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs">
                        On-Chain ✓
                      </span>
                    )}
                    {!asset.onChain && asset.chain === 'DEMIURGE' && (
                      <span className="px-1.5 py-0.5 bg-gray-500/20 text-genesis-text-tertiary border border-gray-500/30 rounded text-xs">
                        Local (Unconfirmed)
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-genesis-text-tertiary mt-1 line-clamp-2">
                  {asset.description || asset.attributes?.description || 'No description'}
                </p>
              </div>
              <div className="text-xs text-gray-500 mb-3">
                <div>Owner: {asset.owner.slice(0, 8)}...</div>
                <div>Standard: {asset.standard}</div>
                {asset.priceCgt && <div>Price: {asset.priceCgt} CGT</div>}
                {asset.onChain && asset.txHash && (
                  <div className="mt-1">
                    <div>TX: <code className="text-genesis-cipher-cyan font-mono">{asset.txHash.slice(0, 12)}...</code></div>
                    {asset.blockHeight && <div>Block: #{asset.blockHeight}</div>}
                  </div>
                )}
              </div>
              <Button
                onClick={() => {
                  // TODO: Implement purchase flow
                  alert('Purchase flow coming soon');
                }}
                variant="secondary"
                className="w-full px-3 py-1 text-xs"
              >
                {asset.priceCgt ? `Buy ${asset.priceCgt} CGT` : 'View / Download'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Chain Explorer View - Shows on-chain DRC-369 assets with transaction details
 */
function ChainExplorerView() {
  const [assets, setAssets] = useState<DRC369[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOnChainAssets() {
      try {
        // Get all assets and filter for on-chain ones
        const allAssets = await abyssIdSDK.drc369.getPublic({});
        const onChainAssets = allAssets.filter(asset => asset.onChain);
        setAssets(onChainAssets);
      } catch (error) {
        console.error('Failed to load on-chain assets:', error);
      } finally {
        setLoading(false);
      }
    }

    loadOnChainAssets();
  }, []);

  if (loading) {
    return (
      <div className="text-center text-genesis-text-tertiary py-12">
        <p>Loading on-chain assets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-genesis-cipher-cyan">DRC-369 Chain Explorer</h3>
        <p className="text-xs text-gray-500">On-chain assets only</p>
      </div>

      {assets.length === 0 ? (
        <div className="text-center text-genesis-text-tertiary py-12">
          <p>No on-chain assets found</p>
          <p className="text-xs mt-2">Mint a DRC-369 asset to see it here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4 hover:border-genesis-border-default/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-genesis-cipher-cyan mb-1">
                    {asset.name || asset.attributes?.name || 'Untitled'}
                  </h4>
                  <p className="text-xs text-genesis-text-tertiary line-clamp-2">
                    {asset.description || asset.attributes?.description || 'No description'}
                  </p>
                </div>
                <div className="flex items-center space-x-1 ml-4">
                  <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs">
                    On-Chain ✓
                  </span>
                  {asset.chain === 'DEMIURGE' ? (
                    <span className="px-1.5 py-0.5 bg-abyss-cyan/20 text-genesis-cipher-cyan border border-genesis-border-default/30 rounded text-xs font-mono">
                      DRG
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 bg-abyss-purple/20 text-abyss-purple border border-abyss-purple/30 rounded text-xs font-mono">
                      {asset.chain}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mt-3 pt-3 border-t border-genesis-border-default/10">
                <div>
                  <div className="text-genesis-text-tertiary mb-1">Owner</div>
                  <code className="text-genesis-cipher-cyan">{asset.owner.slice(0, 16)}...</code>
                </div>
                <div>
                  <div className="text-genesis-text-tertiary mb-1">Standard</div>
                  <div>{asset.standard}</div>
                </div>
                {asset.txHash && (
                  <div className="col-span-2">
                    <div className="text-genesis-text-tertiary mb-1">Transaction Hash</div>
                    <code 
                      className="text-genesis-cipher-cyan font-mono break-all cursor-pointer hover:text-genesis-cipher-cyan/80 transition-colors"
                      onClick={() => {
                        // Future: Open in block explorer
                        if (asset.txHash) {
                          navigator.clipboard.writeText(asset.txHash);
                          alert('Transaction hash copied to clipboard');
                        }
                      }}
                      title="Click to copy (Block explorer coming soon)"
                    >
                      {asset.txHash}
                    </code>
                  </div>
                )}
                {asset.blockHeight && (
                  <div>
                    <div className="text-genesis-text-tertiary mb-1">Block Height</div>
                    <div className="text-genesis-cipher-cyan">#{asset.blockHeight}</div>
                  </div>
                )}
                {asset.uri && (
                  <div className="col-span-2">
                    <div className="text-genesis-text-tertiary mb-1">URI</div>
                    <code className="text-xs break-all text-genesis-text-secondary">{asset.uri}</code>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Custom Workspace Overlay
 */
function CustomWorkspaceOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-genesis-glass-light/90 backdrop-blur-sm z-50 flex items-center justify-center p-8">
      <div className="bg-abyss-navy/90 border border-genesis-border-default/30 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold text-genesis-cipher-cyan mb-4">Custom Workspaces</h3>
        <p className="text-genesis-text-secondary mb-4">
          Custom workspaces are coming soon. You'll be able to pin searches, favorite assets, and on-chain folders here.
        </p>
        <Button onClick={onClose} className="w-full">
          Close
        </Button>
      </div>
    </div>
  );
}

export function OnChainFilesApp() {
  const { identity, isAuthenticated } = useAbyssIDIdentity();
  const session = identity ? { username: identity.username, publicKey: identity.publicKey } : null;
  const mode = 'local'; // Default to local mode
  const [activeTab, setActiveTab] = useState<TabId>('my-assets');
  const [showCustomOverlay, setShowCustomOverlay] = useState(false);

  return (
    <div className="abyss-files-root h-full flex min-h-0 relative">
      {/* Mode indicator */}
      <div className="absolute top-2 right-2 z-10">
        <span className={`px-2 py-1 text-xs rounded ${
          mode === 'remote' 
            ? 'bg-abyss-cyan/20 text-genesis-cipher-cyan border border-genesis-border-default/30' 
            : 'bg-gray-700/50 text-genesis-text-tertiary border border-gray-600/30'
        }`}>
          Mode: {mode}
        </span>
      </div>
      {/* Left sidebar */}
      <div className="abyss-files-sidebar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`abyss-files-tab ${activeTab === tab.id ? 'is-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
          >
            <span className="abyss-files-tab-icon">{tab.icon}</span>
          </button>
        ))}
        <button
          className="abyss-files-tab abyss-files-tab-add"
          onClick={() => setShowCustomOverlay(true)}
          title="Add workspace"
        >
          +
        </button>
      </div>

      {/* Main content */}
      <div className="abyss-files-content">
        {!isAuthenticated && (
          <div className="mb-4 p-3 bg-abyss-purple/10 border border-abyss-purple/30 rounded-lg text-sm text-genesis-text-secondary">
            Sign in with QorID to mint DRC-369 assets
          </div>
        )}
        {activeTab === 'my-assets' && <MyAssetsView />}
        {activeTab === 'network' && <NetworkView />}
        {activeTab === 'explorer' && <ChainExplorerView />}
      </div>

      {showCustomOverlay && (
        <CustomWorkspaceOverlay onClose={() => setShowCustomOverlay(false)} />
      )}
    </div>
  );
}
