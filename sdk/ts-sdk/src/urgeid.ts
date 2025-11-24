/**
 * UrgeID operations
 */

import { DemiurgeClient } from './client';
import { UrgeIDProfile, UrgeIDProgress, UserAnalytics, Address } from './types';
import { isValidUsername } from './utils';

export class UrgeIdApi {
  constructor(private client: DemiurgeClient) {}

  /**
   * Get UrgeID profile for an address
   */
  async getProfile(address: Address): Promise<UrgeIDProfile> {
    return this.client.call<UrgeIDProfile>('urgeid_getProfile', { address });
  }

  /**
   * Set username for an address (requires signing)
   */
  async setUsername(
    address: Address,
    username: string,
    signedTxHex: string
  ): Promise<void> {
    if (!isValidUsername(username)) {
      throw new Error(
        'Invalid username: must be 3-32 characters, lowercase alphanumeric + underscore'
      );
    }

    await this.client.call('urgeid_setUsername', {
      address,
      username,
      signed_tx_hex: signedTxHex,
    });
  }

  /**
   * Resolve username to address
   */
  async resolveUsername(username: string): Promise<Address | null> {
    const result = await this.client.call<{ address: string } | null>(
      'urgeid_resolveUsername',
      { username }
    );
    return result?.address ?? null;
  }

  /**
   * Get UrgeID progress (level, Syzygy, thresholds)
   */
  async getProgress(address: Address): Promise<UrgeIDProgress> {
    return this.client.call<UrgeIDProgress>('urgeid_getProgress', { address });
  }

  /**
   * Get user analytics
   */
  async getAnalytics(address: Address): Promise<UserAnalytics> {
    return this.client.call<UserAnalytics>('urgeid_getAnalytics', { address });
  }

  /**
   * Check if an address is an Archon
   */
  async isArchon(address: Address): Promise<boolean> {
    return this.client.call<boolean>('cgt_isArchon', { address });
  }
}

