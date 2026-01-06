/**
 * Activity Log API for the Demiurge TypeScript SDK
 * 
 * Provides methods to query on-chain activity logs and statistics.
 */

import type { RpcClient } from './client';

/**
 * Activity type categories
 */
export type ActivityType = 
  | 'transfer'
  | 'nft_mint'
  | 'nft_transfer'
  | 'marketplace_listing'
  | 'marketplace_purchase'
  | 'work_claim'
  | 'profile_created'
  | 'username_set'
  | 'developer_registered'
  | 'project_created'
  | 'world_created'
  | 'chat_message'
  | 'level_up'
  | 'badge_earned'
  | string; // Custom types

/**
 * A single activity log entry
 */
export interface ActivityEntry {
  /** Unique activity ID */
  id: number;
  /** Address of the actor */
  address: string;
  /** Type of activity */
  activity_type: ActivityType;
  /** Block height when activity occurred */
  block_height: number;
  /** Timestamp (Unix epoch seconds) */
  timestamp: number;
  /** Optional target address (for transfers, etc.) */
  target?: string | null;
  /** Optional amount (for transfers, rewards) */
  amount?: string | null;
  /** Optional reference ID (NFT ID, listing ID, etc.) */
  reference_id?: string | null;
  /** Optional metadata (JSON string) */
  metadata?: string | null;
}

/**
 * Activity statistics for an address
 */
export interface ActivityStats {
  /** Total number of activities */
  total_activities: number;
  /** Number of transfers sent */
  transfers_sent: number;
  /** Number of transfers received */
  transfers_received: number;
  /** Total CGT sent */
  total_cgt_sent: string;
  /** Total CGT received */
  total_cgt_received: string;
  /** NFTs minted */
  nfts_minted: number;
  /** NFTs transferred */
  nfts_transferred: number;
  /** Work claims submitted */
  work_claims: number;
  /** Total work claim rewards */
  total_work_rewards: string;
  /** Marketplace listings created */
  listings_created: number;
  /** Marketplace purchases made */
  purchases_made: number;
}

/**
 * Activity Log API
 */
export class ActivityApi {
  constructor(private client: RpcClient) {}

  /**
   * Get activity statistics for an address
   * 
   * @param address - The address to get statistics for
   * @returns Activity statistics
   */
  async getStats(address: string): Promise<ActivityStats> {
    return this.client.call<ActivityStats>('activity_getStats', { address });
  }

  /**
   * Get activity history for an address
   * 
   * @param address - The address to get history for
   * @param options - Optional filters
   * @returns List of activity entries
   */
  async getHistory(
    address: string,
    options?: {
      activity_type?: ActivityType;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ activities: ActivityEntry[]; count: number }> {
    return this.client.call<{ activities: ActivityEntry[]; count: number }>(
      'activity_getHistory',
      {
        address,
        activity_type: options?.activity_type,
        limit: options?.limit ?? 50,
        offset: options?.offset ?? 0,
      }
    );
  }

  /**
   * Get recent global activities
   * 
   * @param limit - Maximum number of activities to return (default: 20, max: 100)
   * @returns List of recent activity entries
   */
  async getRecent(limit: number = 20): Promise<{ activities: ActivityEntry[]; count: number }> {
    return this.client.call<{ activities: ActivityEntry[]; count: number }>(
      'activity_getRecent',
      { limit: Math.min(limit, 100) }
    );
  }

  /**
   * Get a single activity entry by ID
   * 
   * @param id - The activity ID
   * @returns The activity entry, or null if not found
   */
  async getActivity(id: number): Promise<ActivityEntry | null> {
    try {
      return await this.client.call<ActivityEntry>('activity_get', { id });
    } catch (error) {
      // Activity not found
      return null;
    }
  }

  /**
   * Get all transfers for an address
   */
  async getTransfers(
    address: string,
    options?: { limit?: number; offset?: number }
  ): Promise<ActivityEntry[]> {
    const result = await this.getHistory(address, {
      activity_type: 'transfer',
      ...options,
    });
    return result.activities;
  }

  /**
   * Get all NFT mints for an address
   */
  async getNftMints(
    address: string,
    options?: { limit?: number; offset?: number }
  ): Promise<ActivityEntry[]> {
    const result = await this.getHistory(address, {
      activity_type: 'nft_mint',
      ...options,
    });
    return result.activities;
  }

  /**
   * Get all work claims for an address
   */
  async getWorkClaims(
    address: string,
    options?: { limit?: number; offset?: number }
  ): Promise<ActivityEntry[]> {
    const result = await this.getHistory(address, {
      activity_type: 'work_claim',
      ...options,
    });
    return result.activities;
  }
}
