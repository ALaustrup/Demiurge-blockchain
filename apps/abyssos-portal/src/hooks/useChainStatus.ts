import { useEffect, useState, useCallback } from 'react';

/**
 * Get RPC URL from environment or fallback
 */
function getRpcUrl(): string {
  if (typeof window === 'undefined') {
    return 'https://rpc.demiurge.cloud';
  }
  
  // Try environment variable first, then window global, then default
  const envUrl = import.meta.env.VITE_DEMIURGE_RPC_URL;
  const windowUrl = (window as any).ABYSS_RPC_URL;
  const defaultUrl = 'https://rpc.demiurge.cloud';
  
  const baseUrl = envUrl || windowUrl || defaultUrl;
  
  // Ensure URL doesn't end with /rpc (we'll add it)
  const cleanUrl = baseUrl.replace(/\/rpc$/, '');
  
  // Return with /rpc endpoint
  return `${cleanUrl}/rpc`;
}

export type ChainStatus =
  | { state: 'connecting' }
  | { state: 'connected'; height: number }
  | { state: 'error'; message?: string };

export function useChainStatus(pollIntervalMs = 5000) {
  const [status, setStatus] = useState<ChainStatus>({ state: 'connecting' });
  const [retryTrigger, setRetryTrigger] = useState(0);

  const fetchStatus = useCallback(async () => {
    const rpcUrl = getRpcUrl();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for better reliability
    
    try {
      const res = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'cgt_getChainInfo',
          params: [],
          id: 1,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      
      // Check for JSON-RPC error
      if (json.error) {
        throw new Error(json.error.message || `RPC error: ${json.error.code || 'unknown'}`);
      }

      // Validate response structure
      if (!json.result) {
        throw new Error('Invalid RPC response: missing result');
      }

      // Treat ANY successful response with numeric height (including 0) as connected
      const height = typeof json.result?.height === 'number' ? json.result.height : 0;
      
      setStatus({ state: 'connected', height });
    } catch (e: any) {
      let message = 'Unknown error';
      if (e.name === 'AbortError') {
        message = 'Connection timeout';
      } else if (e.message) {
        message = e.message;
      } else if (typeof e === 'string') {
        message = e;
      }
      
      console.error('[ChainStatus] RPC error:', message, e);
      setStatus({ state: 'error', message });
    } finally {
      // Always clear timeout to prevent resource leaks
      clearTimeout(timeoutId);
    }
  }, []);

  // Manual retry function
  const retry = useCallback(() => {
    setStatus({ state: 'connecting' });
    setRetryTrigger((prev) => prev + 1);
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    let cancelled = false;

    // Initial fetch
    fetchStatus();

    // Set up polling interval
    const intervalId = setInterval(() => {
      if (!cancelled) {
        fetchStatus();
      }
    }, pollIntervalMs);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [fetchStatus, pollIntervalMs, retryTrigger]);

  return { status, retry };
}
