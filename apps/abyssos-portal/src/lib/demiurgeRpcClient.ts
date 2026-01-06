export interface ChainInfo {
  height: number;
}

export interface RPCResponse<T = any> {
  jsonrpc: string;
  result?: T;
  error?: {
    code: number;
    message: string;
  };
  id: number;
}

export class DemiurgeRPC {
  private rpcUrl: string;

  constructor(rpcUrl?: string) {
    const envUrl = rpcUrl || import.meta.env.VITE_DEMIURGE_RPC_URL || 'https://rpc.demiurge.cloud';
    // Ensure URL ends with /rpc
    const cleanUrl = envUrl.replace(/\/rpc$/, '');
    this.rpcUrl = `${cleanUrl}/rpc`;
  }

  async request<T = any>(method: string, params: any[] = []): Promise<T> {
    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method,
          params,
          id: 1,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: RPCResponse<T> = await response.json();

      if (data.error) {
        throw new Error(`RPC error: ${data.error.message}`);
      }

      return data.result as T;
    } catch (error) {
      console.error('RPC request failed:', error);
      throw error;
    }
  }

  async getChainInfo(): Promise<ChainInfo> {
    try {
      const result = await this.request<{ height: number }>('cgt_getChainInfo', []);
      return {
        height: result.height ?? 0,
      };
    } catch (error) {
      console.error('Failed to get chain info:', error);
      // Return default on error to prevent UI crashes
      return { height: 0 };
    }
  }

  async submitWorkClaim(params: {
    address: string;
    game_id: string;
    session_id: string;
    depth_metric: number;
    active_ms: number;
    extra?: string | null;
  }): Promise<{ tx_hash: string; reward_estimate: string }> {
    try {
      const result = await this.request<{ tx_hash: string; reward_estimate: string }>(
        'submitWorkClaim',
        [params]
      );
      return result;
    } catch (error) {
      console.error('Failed to submit work claim:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const demiurgeRpc = new DemiurgeRPC();

