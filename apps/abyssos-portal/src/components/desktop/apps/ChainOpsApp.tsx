import { useEffect, useState } from 'react';
import { demiurgeRpc } from '../../../lib/demiurgeRpcClient';

export function ChainOpsApp() {
  const [chainInfo, setChainInfo] = useState<{ height: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-abyss-cyan mb-4">Chain Operations</h2>
        <p className="text-gray-300 text-sm mb-4">
          Real-time Demiurge Blockchain network status and metrics.
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-abyss-dark/50 border border-abyss-cyan/20 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Network Status</div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
            <span className="text-abyss-cyan font-medium">Online</span>
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
          <div className="bg-abyss-dark/50 border border-abyss-cyan/20 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Current Height</div>
            <div className="text-3xl font-mono text-abyss-cyan">{chainInfo.height}</div>
          </div>
        )}

        <div className="bg-abyss-dark/50 border border-abyss-cyan/20 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">RPC Endpoint</div>
          <div className="text-xs font-mono text-gray-300 break-all">{rpcUrl}</div>
        </div>
      </div>
    </div>
  );
}

