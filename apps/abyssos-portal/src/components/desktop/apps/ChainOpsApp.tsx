import { useEffect, useState } from 'react';
import { demiurgeRpc } from '../../../lib/demiurgeRpcClient';
import { ChainStatusPill } from '../../ChainStatusPill';
import { useChainStatus } from '../../../hooks/useChainStatus';

export function ChainOpsApp() {
  const [chainInfo, setChainInfo] = useState<{ height: number; block_hash?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { status: rpcStatus } = useChainStatus();
  const rpcUrl = import.meta.env.VITE_DEMIURGE_RPC_URL || 'https://rpc.demiurge.cloud/rpc';

  useEffect(() => {
    const fetchChainInfo = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const info = await demiurgeRpc.getChainInfo();
        setChainInfo(info);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch chain info');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChainInfo();
    const interval = setInterval(fetchChainInfo, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full bg-abyss-dark text-white p-6 overflow-y-auto">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-abyss-cyan mb-4">Chain Operations</h2>
          <p className="text-gray-300 text-sm mb-4">
            Real-time Demiurge Blockchain network status and metrics.
          </p>
        </div>

        <div className="space-y-4">
          {/* RPC Connection Status */}
          <div className="bg-abyss-dark/50 border border-abyss-cyan/20 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-2">RPC Connection Status</div>
            <div className="flex items-center gap-3">
              <ChainStatusPill />
            </div>
            <div className="mt-3 text-xs text-gray-500">
              {rpcStatus.state === 'connected' && (
                <div>Connected to Demiurge blockchain</div>
              )}
              {rpcStatus.state === 'error' && (
                <div className="text-red-400">Connection error - check RPC endpoint</div>
              )}
              {rpcStatus.state === 'connecting' && (
                <div>Establishing connection...</div>
              )}
            </div>
          </div>

          <div className="bg-abyss-dark/50 border border-abyss-cyan/20 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Network Status</div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                rpcStatus.state === 'connected' ? 'bg-green-400 animate-pulse' : 
                rpcStatus.state === 'error' ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'
              }`} />
              <span className="text-abyss-cyan font-medium">
                {rpcStatus.state === 'connected' ? 'Online' : 
                 rpcStatus.state === 'error' ? 'Offline' : 'Connecting...'}
              </span>
            </div>
          </div>

          {isLoading && !chainInfo && (
            <div className="text-gray-400">Loading chain info...</div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
              <div className="text-red-400 font-medium mb-1">Error</div>
              <div className="text-sm text-red-300">{error}</div>
            </div>
          )}

          {chainInfo && (
            <>
              <div className="bg-abyss-dark/50 border border-abyss-cyan/20 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Current Block Height</div>
                <div className="text-3xl font-mono text-abyss-cyan">{chainInfo.height}</div>
              </div>
              
              {chainInfo.block_hash && (
                <div className="bg-abyss-dark/50 border border-abyss-cyan/20 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Latest Block Hash</div>
                  <div className="text-xs font-mono text-abyss-cyan break-all">{chainInfo.block_hash}</div>
                </div>
              )}
            </>
          )}

          <div className="bg-abyss-dark/50 border border-abyss-cyan/20 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">RPC Endpoint</div>
            <div className="text-xs font-mono text-gray-300 break-all">{rpcUrl}</div>
            <div className="mt-2 text-xs text-gray-500">
              {rpcStatus.state === 'connected' ? '✓ Endpoint responding' : '⚠ Endpoint not responding'}
            </div>
          </div>

          {/* Network Metrics */}
          <div className="bg-abyss-dark/50 border border-abyss-cyan/20 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-3">Network Metrics</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Connection State</div>
                <div className="text-sm font-mono text-abyss-cyan capitalize">{rpcStatus.state}</div>
              </div>
              {rpcStatus.state === 'connected' && rpcStatus.height && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Synced Height</div>
                  <div className="text-sm font-mono text-abyss-cyan">{rpcStatus.height}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

