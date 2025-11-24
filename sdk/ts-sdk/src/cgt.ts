/**
 * CGT (Creator God Token) operations
 */

import { DemiurgeClient } from './client';
import { CgtMetadata, CgtBalance, Address } from './types';
import { cgtFromSmallest, cgtToSmallest } from './utils';

export class CgtApi {
  constructor(private client: DemiurgeClient) {}

  /**
   * Get CGT metadata (name, symbol, decimals, max supply, total supply)
   */
  async getMetadata(): Promise<CgtMetadata> {
    return this.client.call<CgtMetadata>('cgt_getCgtMetadata');
  }

  /**
   * Get total supply of CGT
   */
  async getTotalSupply(): Promise<string> {
    const result = await this.client.call<{ totalSupply: string }>('cgt_getTotalSupply');
    return result.totalSupply;
  }

  /**
   * Get CGT balance for an address
   */
  async getBalance(address: Address): Promise<string> {
    const result = await this.client.call<CgtBalance>('cgt_getBalance', { address });
    return result.balance;
  }

  /**
   * Get CGT balance as a human-readable number
   */
  async getBalanceFormatted(address: Address): Promise<number> {
    const balance = await this.getBalance(address);
    return cgtFromSmallest(balance);
  }

  /**
   * Get transaction nonce for an address
   */
  async getNonce(address: Address): Promise<number> {
    return this.client.call<number>('cgt_getNonce', { address });
  }

  /**
   * Build a transfer transaction (does not sign or submit)
   */
  async buildTransfer(
    from: Address,
    to: Address,
    amount: number | string,
    nonce?: number
  ): Promise<{ unsignedTxHex: string; nonce: number }> {
    const amountStr = typeof amount === 'number' ? cgtToSmallest(amount) : amount;
    const txNonce = nonce ?? await this.getNonce(from);

    const result = await this.client.call<{ unsigned_tx_hex: string }>(
      'cgt_buildTransferTx',
      {
        from,
        to,
        amount: amountStr,
        nonce: txNonce,
      }
    );

    return {
      unsignedTxHex: result.unsigned_tx_hex,
      nonce: txNonce,
    };
  }

  /**
   * Submit a signed transaction
   */
  async sendRawTransaction(signedTxHex: string): Promise<string> {
    const result = await this.client.call<{ tx_hash: string }>(
      'cgt_sendRawTransaction',
      { tx_hex: signedTxHex }
    );
    return result.tx_hash;
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(txHash: string): Promise<any> {
    return this.client.call('cgt_getTransaction', { hash: txHash });
  }

  /**
   * Get transaction history for an address
   */
  async getTransactionHistory(address: Address, limit?: number): Promise<any[]> {
    return this.client.call<any[]>('cgt_getTransactionHistory', {
      address,
      limit: limit ?? 100,
    });
  }

  /**
   * Request CGT from dev faucet (debug builds only)
   */
  async requestFaucet(address: Address): Promise<string> {
    const result = await this.client.call<{ tx_hash: string }>('cgt_devFaucet', {
      address,
    });
    return result.tx_hash;
  }
}

