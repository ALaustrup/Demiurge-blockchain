/**
 * Core RPC client for Demiurge Blockchain
 */

import { RpcError, RpcResponse } from './types';

export interface DemiurgeClientConfig {
  rpcUrl: string;
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

export class DemiurgeClient {
  private config: Required<DemiurgeClientConfig>;

  constructor(config: DemiurgeClientConfig) {
    this.config = {
      rpcUrl: config.rpcUrl,
      retries: config.retries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      timeout: config.timeout ?? 30000,
    };
  }

  /**
   * Call an RPC method with automatic retries and error handling
   */
  async call<T>(method: string, params: any = null): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(this.config.rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method,
            params,
            id: Date.now(),
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const json: RpcResponse<T> = await response.json();

        if (json.error) {
          throw new RpcErrorImpl(json.error.code, json.error.message, json.error.data);
        }

        if (json.result === undefined) {
          throw new Error('RPC response missing result');
        }

        return json.result;
      } catch (error: any) {
        lastError = error;

        // Don't retry on abort (timeout) or certain RPC errors
        if (error.name === 'AbortError' || error instanceof RpcErrorImpl) {
          if (error.code === -32602 || error.code === -32603) {
            // Invalid params or internal error - don't retry
            throw error;
          }
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.config.retries) {
          await new Promise(resolve => 
            setTimeout(resolve, this.config.retryDelay * (attempt + 1))
          );
        }
      }
    }

    // All retries exhausted
    if (lastError?.message?.includes('fetch')) {
      throw new Error(
        `Connection failed: Unable to reach Demiurge node at ${this.config.rpcUrl}. ` +
        `Make sure the node is running.`
      );
    }

    throw lastError || new Error('RPC call failed after retries');
  }

  /**
   * Get the RPC URL
   */
  getRpcUrl(): string {
    return this.config.rpcUrl;
  }
}

export class RpcErrorImpl extends Error implements RpcError {
  constructor(
    public code: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'RpcError';
  }
}

