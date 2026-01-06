/**
 * CGT Staking API for the Demiurge TypeScript SDK
 * 
 * Provides methods to stake CGT tokens for yield generation.
 */

import type { RpcClient } from './client';

/**
 * Stake information for an address
 */
export interface StakeInfo {
  /** Amount of CGT staked (in smallest units as string) */
  amount: string;
  /** Timestamp when stake was created/last modified */
  stake_timestamp: number;
  /** Accumulated but unclaimed rewards (as string) */
  pending_rewards: string;
  /** Last time rewards were calculated */
  last_reward_calculation: number;
  /** Timestamp when unstake was requested (0 if not unstaking) */
  unstake_requested_at: number;
  /** Amount being unstaked (as string) */
  unstake_amount: string;
  /** Whether there's a pending unstake request */
  has_pending_unstake: boolean;
}

/**
 * Staking statistics
 */
export interface StakingStats {
  /** Total CGT staked across all addresses (as string) */
  total_staked: string;
  /** Annual percentage yield in basis points (1000 = 10%) */
  apy_bps: number;
  /** APY as a percentage number */
  apy_percent: number;
  /** Minimum stake amount (as string) */
  min_stake: string;
  /** Lock period in seconds */
  lock_period_secs: number;
  /** Lock period in days */
  lock_period_days: number;
}

/**
 * CGT Staking API
 */
export class StakingApi {
  constructor(private client: RpcClient) {}

  /**
   * Get staking info for an address
   * 
   * @param address - The address to get staking info for
   * @returns Stake information including amount, rewards, and unstake status
   */
  async getInfo(address: string): Promise<StakeInfo> {
    return this.client.call<StakeInfo>('staking_getInfo', { address });
  }

  /**
   * Get global staking statistics
   * 
   * @returns Staking stats including total staked, APY, and lock period
   */
  async getStats(): Promise<StakingStats> {
    return this.client.call<StakingStats>('staking_getStats', {});
  }

  /**
   * Get total CGT staked across all addresses
   * 
   * @returns Total staked amount as string
   */
  async getTotalStaked(): Promise<string> {
    const result = await this.client.call<{ total_staked: string }>('staking_getTotalStaked', {});
    return result.total_staked;
  }

  /**
   * Get formatted stake info with human-readable values
   * 
   * @param address - The address to get staking info for
   * @returns Formatted stake information
   */
  async getInfoFormatted(address: string): Promise<{
    stakedAmount: number;
    pendingRewards: number;
    unstakeAmount: number;
    stakeTimestamp: Date | null;
    hasPendingUnstake: boolean;
    unstakeUnlockTime: Date | null;
  }> {
    const info = await this.getInfo(address);
    const stats = await this.getStats();
    
    const stakedAmount = Number(info.amount) / 100_000_000;
    const pendingRewards = Number(info.pending_rewards) / 100_000_000;
    const unstakeAmount = Number(info.unstake_amount) / 100_000_000;
    
    let unstakeUnlockTime: Date | null = null;
    if (info.unstake_requested_at > 0) {
      unstakeUnlockTime = new Date((info.unstake_requested_at + stats.lock_period_secs) * 1000);
    }
    
    return {
      stakedAmount,
      pendingRewards,
      unstakeAmount,
      stakeTimestamp: info.stake_timestamp > 0 ? new Date(info.stake_timestamp * 1000) : null,
      hasPendingUnstake: info.has_pending_unstake,
      unstakeUnlockTime,
    };
  }

  /**
   * Calculate estimated rewards for a stake amount over time
   * 
   * @param amount - Amount to stake (in CGT units)
   * @param days - Number of days to calculate rewards for
   * @returns Estimated reward amount in CGT
   */
  async estimateRewards(amount: number, days: number): Promise<number> {
    const stats = await this.getStats();
    const apyDecimal = stats.apy_bps / 10000;
    const yearFraction = days / 365;
    return amount * apyDecimal * yearFraction;
  }

  /**
   * Build a stake transaction payload
   * 
   * @param amount - Amount to stake (in smallest units)
   * @returns Transaction payload for staking
   */
  buildStakePayload(amount: string): { module_id: string; call_id: string; payload: string } {
    return {
      module_id: 'cgt_staking',
      call_id: 'stake',
      payload: JSON.stringify({ amount: BigInt(amount).toString() }),
    };
  }

  /**
   * Build an unstake request transaction payload
   * 
   * @param amount - Amount to unstake (in smallest units)
   * @returns Transaction payload for unstake request
   */
  buildUnstakePayload(amount: string): { module_id: string; call_id: string; payload: string } {
    return {
      module_id: 'cgt_staking',
      call_id: 'request_unstake',
      payload: JSON.stringify({ amount: BigInt(amount).toString() }),
    };
  }

  /**
   * Build a complete unstake transaction payload
   * 
   * @returns Transaction payload for completing unstake
   */
  buildCompleteUnstakePayload(): { module_id: string; call_id: string; payload: string } {
    return {
      module_id: 'cgt_staking',
      call_id: 'complete_unstake',
      payload: '{}',
    };
  }

  /**
   * Build a cancel unstake transaction payload
   * 
   * @returns Transaction payload for canceling unstake
   */
  buildCancelUnstakePayload(): { module_id: string; call_id: string; payload: string } {
    return {
      module_id: 'cgt_staking',
      call_id: 'cancel_unstake',
      payload: '{}',
    };
  }

  /**
   * Build a claim rewards transaction payload
   * 
   * @returns Transaction payload for claiming rewards
   */
  buildClaimRewardsPayload(): { module_id: string; call_id: string; payload: string } {
    return {
      module_id: 'cgt_staking',
      call_id: 'claim_rewards',
      payload: '{}',
    };
  }
}
