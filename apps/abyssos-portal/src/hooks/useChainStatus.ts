import { useEffect, useState } from 'react';

type ChainInfo = {
  height: number;
};

export function useChainStatus(pollIntervalMs = 5000) {
  const [status, setStatus] = useState<'connecting' | 'online' | 'offline'>('connecting');
  const [info, setInfo] = useState<ChainInfo | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchStatus() {
      try {
        const res = await fetch('https://rpc.demiurge.cloud/rpc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'cgt_getChainInfo',
            params: [],
            id: 1,
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        if (!cancelled) {
          setInfo(json.result);
          setStatus('online');
          setLastError(null);
        }
      } catch (e: any) {
        if (!cancelled) {
          setStatus(info ? 'offline' : 'connecting');
          setLastError(e?.message ?? 'Unknown error');
        }
      }
    }

    fetchStatus();
    const id = setInterval(fetchStatus, pollIntervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pollIntervalMs]);

  return { status, info, lastError };
}

