/**
 * D-GEN NFT operations
 */

import { DemiurgeClient } from './client';
import { DGenMetadata, Address } from './types';

export class NftApi {
  constructor(private client: DemiurgeClient) {}

  /**
   * Mint a D-GEN NFT (Archon-only)
   */
  async mintDgenNft(
    owner: Address,
    fabricRootHash: string,
    royaltyBps?: number,
    signedTxHex: string
  ): Promise<DGenMetadata> {
    if (!/^0x[0-9a-f]{64}$/i.test(fabricRootHash)) {
      throw new Error('Invalid fabric_root_hash: must be 64-char hex string');
    }

    return this.client.call<DGenMetadata>('cgt_mintDgenNft', {
      owner,
      fabric_root_hash: fabricRootHash,
      royalty_bps: royaltyBps ?? 0,
      signed_tx_hex: signedTxHex,
    });
  }

  /**
   * Get NFT metadata by ID
   */
  async getNft(nftId: number): Promise<DGenMetadata> {
    return this.client.call<DGenMetadata>('cgt_getNft', { id: nftId });
  }

  /**
   * Get all NFTs owned by an address
   */
  async getNftsByOwner(owner: Address): Promise<DGenMetadata[]> {
    return this.client.call<DGenMetadata[]>('cgt_getNftsByOwner', { owner });
  }

  /**
   * Transfer NFT to another address
   */
  async transferNft(
    nftId: number,
    from: Address,
    to: Address,
    signedTxHex: string
  ): Promise<void> {
    await this.client.call('cgt_transferNft', {
      id: nftId,
      from,
      to,
      signed_tx_hex: signedTxHex,
    });
  }
}

