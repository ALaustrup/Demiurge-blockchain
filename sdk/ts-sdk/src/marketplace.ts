/**
 * Abyss Marketplace operations
 */

import { DemiurgeClient } from './client';
import { Listing, Address } from './types';
import { cgtToSmallest } from './utils';

export class MarketplaceApi {
  constructor(private client: DemiurgeClient) {}

  /**
   * Get all active listings
   */
  async getAllListings(): Promise<Listing[]> {
    return this.client.call<Listing[]>('abyss_getAllListings');
  }

  /**
   * Get a specific listing by ID
   */
  async getListing(listingId: number): Promise<Listing> {
    return this.client.call<Listing>('abyss_getListing', { id: listingId });
  }

  /**
   * Create a new listing (Archon-only)
   */
  async createListing(
    nftId: number,
    seller: Address,
    price: number | string,
    signedTxHex: string
  ): Promise<Listing> {
    const priceStr = typeof price === 'number' ? cgtToSmallest(price) : price;

    return this.client.call<Listing>('abyss_createListing', {
      nft_id: nftId,
      seller,
      price: priceStr,
      signed_tx_hex: signedTxHex,
    });
  }

  /**
   * Cancel a listing
   */
  async cancelListing(
    listingId: number,
    seller: Address,
    signedTxHex: string
  ): Promise<void> {
    await this.client.call('abyss_cancelListing', {
      id: listingId,
      seller,
      signed_tx_hex: signedTxHex,
    });
  }

  /**
   * Buy a listing
   */
  async buyListing(
    listingId: number,
    buyer: Address,
    signedTxHex: string
  ): Promise<void> {
    await this.client.call('abyss_buyListing', {
      id: listingId,
      buyer,
      signed_tx_hex: signedTxHex,
    });
  }
}

