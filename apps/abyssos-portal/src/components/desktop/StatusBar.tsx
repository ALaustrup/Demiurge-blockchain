import { useEffect, useState } from 'react';
import { useAuthStore } from '../../state/authStore';
import { demiurgeRpc } from '../../lib/demiurgeRpcClient';

export function StatusBar() {
  const account = useAuthStore((state) => state.account);
  const [chainHeight, setChainHeight] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const fetchChainInfo = async () => {
      try {
        const info = await demiurgeRpc.getChainInfo();
        setChainHeight(info.height);
        setIsOnline(true);
      } catch (error) {
        console.error('Failed to fetch chain info:', error);
        setIsOnline(false);
      }
    };

    fetchChainInfo();
    const interval = setInterval(fetchChainInfo, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-8 bg-abyss-dark/80 backdrop-blur-sm border-b border-abyss-cyan/20 z-50 flex items-center justify-between px-4 text-xs">
      <div className="text-abyss-cyan">AbyssOS – Demiurge Devnet</div>
      
      <div className="flex items-center space-x-4">
        {chainHeight !== null && (
          <div className="text-gray-300">
            Height: <span className="text-abyss-cyan font-mono">{chainHeight}</span>
          </div>
        )}
        {!isOnline && (
          <div className="text-red-400">Offline</div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
        <span className="text-gray-300">{account?.username || 'Guest'}</span>
      </div>
    </div>
  );
}

