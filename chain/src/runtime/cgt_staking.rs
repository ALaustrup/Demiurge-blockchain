//! CGT Staking Module
//!
//! Allows users to stake CGT tokens for yield generation.
//! Staked tokens earn rewards based on staking duration and amount.
//!
//! Features:
//! - Stake CGT tokens
//! - Unstake with configurable lock period
//! - Claim accumulated rewards
//! - View staking statistics

use serde::{Deserialize, Serialize};

use super::RuntimeModule;
use crate::core::state::State;
use crate::core::transaction::{Address, Transaction};
use crate::runtime::bank_cgt::{cgt_mint_to, get_balance_cgt};

// Storage key prefixes
const PREFIX_STAKE: &[u8] = b"staking/stake:";
const PREFIX_TOTAL_STAKED: &[u8] = b"staking/total_staked";
const PREFIX_REWARDS_POOL: &[u8] = b"staking/rewards_pool";
const PREFIX_LAST_REWARD_TIME: &[u8] = b"staking/last_reward:";

// Staking configuration
/// Minimum stake amount (1 CGT in smallest units)
pub const MIN_STAKE_AMOUNT: u128 = 100_000_000;
/// Lock period in seconds (7 days)
pub const UNSTAKE_LOCK_PERIOD: u64 = 7 * 24 * 60 * 60;
/// Annual percentage yield (5% APY)
/// Reduced from 10% to balance with 20% fee burn for net-neutral inflation
pub const BASE_APY_BPS: u64 = 500; // 5% = 500 basis points
/// Reward calculation interval (1 hour)
pub const REWARD_INTERVAL_SECS: u64 = 3600;
/// Maximum stake per address (10 million CGT)
pub const MAX_STAKE_PER_ADDRESS: u128 = 10_000_000 * 100_000_000;

/// Stake information for an address
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct StakeInfo {
    /// Amount of CGT staked (in smallest units)
    pub amount: u128,
    /// Timestamp when stake was created/last modified
    pub stake_timestamp: u64,
    /// Accumulated but unclaimed rewards
    pub pending_rewards: u128,
    /// Last time rewards were calculated
    pub last_reward_calculation: u64,
    /// Timestamp when unstake was requested (0 if not unstaking)
    pub unstake_requested_at: u64,
    /// Amount being unstaked (locked until lock period ends)
    pub unstake_amount: u128,
}

/// Stake parameters
#[derive(Debug, Serialize, Deserialize)]
pub struct StakeParams {
    pub amount: u128,
}

/// Unstake parameters
#[derive(Debug, Serialize, Deserialize)]
pub struct UnstakeParams {
    pub amount: u128,
}

/// Helper to parse address from hex string
fn parse_address(hex: &str) -> Result<Address, String> {
    let clean = hex.strip_prefix("0x").unwrap_or(hex);
    let bytes = hex::decode(clean).map_err(|e| format!("Invalid address hex: {}", e))?;
    if bytes.len() != 32 {
        return Err(format!("Address must be 32 bytes, got {}", bytes.len()));
    }
    let mut addr = [0u8; 32];
    addr.copy_from_slice(&bytes);
    Ok(addr)
}

/// Get stake info for an address
pub fn get_stake_info(state: &State, address: &Address) -> StakeInfo {
    let key = [PREFIX_STAKE, address.as_slice()].concat();
    state
        .get_raw(&key)
        .and_then(|v| bincode::deserialize(&v).ok())
        .unwrap_or_default()
}

/// Save stake info for an address
fn save_stake_info(state: &mut State, address: &Address, info: &StakeInfo) -> Result<(), String> {
    let key = [PREFIX_STAKE, address.as_slice()].concat();
    let data = bincode::serialize(info)
        .map_err(|e| format!("Failed to serialize stake info: {}", e))?;
    state.put_raw(key, data)
        .map_err(|e| format!("Failed to save stake info: {}", e))
}

/// Get total staked amount across all addresses
pub fn get_total_staked(state: &State) -> u128 {
    state
        .get_raw(PREFIX_TOTAL_STAKED)
        .and_then(|v| bincode::deserialize(&v).ok())
        .unwrap_or(0)
}

/// Update total staked amount
fn update_total_staked(state: &mut State, delta: i128) -> Result<u128, String> {
    let current = get_total_staked(state) as i128;
    let new_total = (current + delta).max(0) as u128;
    let data = bincode::serialize(&new_total)
        .map_err(|e| format!("Failed to serialize total staked: {}", e))?;
    state.put_raw(PREFIX_TOTAL_STAKED.to_vec(), data)
        .map_err(|e| format!("Failed to update total staked: {}", e))?;
    Ok(new_total)
}

/// Calculate pending rewards for a stake
pub fn calculate_pending_rewards(stake: &StakeInfo, current_time: u64) -> u128 {
    if stake.amount == 0 || stake.last_reward_calculation >= current_time {
        return stake.pending_rewards;
    }

    let elapsed_secs = current_time.saturating_sub(stake.last_reward_calculation);
    let elapsed_intervals = elapsed_secs / REWARD_INTERVAL_SECS;
    
    if elapsed_intervals == 0 {
        return stake.pending_rewards;
    }

    // Calculate rewards: amount * APY * time_fraction
    // APY is in basis points (1000 = 10%)
    // time_fraction = elapsed_secs / seconds_per_year
    let seconds_per_year: u128 = 365 * 24 * 60 * 60;
    let elapsed_secs_u128 = (elapsed_intervals * REWARD_INTERVAL_SECS) as u128;
    
    // reward = stake * (APY/10000) * (elapsed/year)
    // To avoid precision loss: reward = stake * APY * elapsed / (10000 * year)
    let reward = stake.amount
        .saturating_mul(BASE_APY_BPS as u128)
        .saturating_mul(elapsed_secs_u128)
        / (10000 * seconds_per_year);

    stake.pending_rewards.saturating_add(reward)
}

/// Stake CGT tokens
pub fn stake(
    state: &mut State,
    address: &Address,
    amount: u128,
    current_time: u64,
) -> Result<StakeInfo, String> {
    // Validate amount
    if amount < MIN_STAKE_AMOUNT {
        return Err(format!(
            "Stake amount {} is below minimum {}",
            amount, MIN_STAKE_AMOUNT
        ));
    }

    // Get current stake info
    let mut stake_info = get_stake_info(state, address);
    
    // Calculate and add pending rewards before modifying stake
    stake_info.pending_rewards = calculate_pending_rewards(&stake_info, current_time);
    
    // Check max stake limit
    let new_amount = stake_info.amount.saturating_add(amount);
    if new_amount > MAX_STAKE_PER_ADDRESS {
        return Err(format!(
            "Stake would exceed maximum {} per address",
            MAX_STAKE_PER_ADDRESS
        ));
    }

    // Check user has sufficient balance
    let balance = get_balance_cgt(state, address);
    if balance < amount {
        return Err(format!(
            "Insufficient balance: have {}, need {}",
            balance, amount
        ));
    }

    // Transfer CGT from user to staking pool (burn from balance)
    // We use a special internal transfer mechanism
    let balance_key = format!("bank_cgt/balance:{}", hex::encode(address));
    let new_balance = balance.saturating_sub(amount);
    let balance_data = bincode::serialize(&new_balance)
        .map_err(|e| format!("Failed to serialize balance: {}", e))?;
    state.put_raw(balance_key.into_bytes(), balance_data)
        .map_err(|e| format!("Failed to update balance: {}", e))?;

    // Update stake info
    stake_info.amount = new_amount;
    stake_info.stake_timestamp = current_time;
    stake_info.last_reward_calculation = current_time;

    // Save stake info
    save_stake_info(state, address, &stake_info)?;

    // Update total staked
    update_total_staked(state, amount as i128)?;

    Ok(stake_info)
}

/// Request unstaking of CGT tokens (starts lock period)
pub fn request_unstake(
    state: &mut State,
    address: &Address,
    amount: u128,
    current_time: u64,
) -> Result<StakeInfo, String> {
    let mut stake_info = get_stake_info(state, address);

    // Check user has enough staked
    if stake_info.amount < amount {
        return Err(format!(
            "Cannot unstake {}: only {} staked",
            amount, stake_info.amount
        ));
    }

    // Check if there's already an unstake request pending
    if stake_info.unstake_requested_at > 0 && stake_info.unstake_amount > 0 {
        return Err("An unstake request is already pending. Complete or cancel it first.".to_string());
    }

    // Calculate pending rewards before modifying stake
    stake_info.pending_rewards = calculate_pending_rewards(&stake_info, current_time);
    stake_info.last_reward_calculation = current_time;

    // Set unstake request
    stake_info.unstake_requested_at = current_time;
    stake_info.unstake_amount = amount;

    // Save stake info
    save_stake_info(state, address, &stake_info)?;

    Ok(stake_info)
}

/// Complete unstaking after lock period
pub fn complete_unstake(
    state: &mut State,
    address: &Address,
    current_time: u64,
) -> Result<(StakeInfo, u128), String> {
    let mut stake_info = get_stake_info(state, address);

    // Check if there's an unstake request
    if stake_info.unstake_requested_at == 0 || stake_info.unstake_amount == 0 {
        return Err("No unstake request pending".to_string());
    }

    // Check if lock period has passed
    let unlock_time = stake_info.unstake_requested_at + UNSTAKE_LOCK_PERIOD;
    if current_time < unlock_time {
        let remaining = unlock_time - current_time;
        return Err(format!(
            "Lock period not yet ended. {} seconds remaining.",
            remaining
        ));
    }

    // Calculate final rewards before completing unstake
    stake_info.pending_rewards = calculate_pending_rewards(&stake_info, current_time);
    stake_info.last_reward_calculation = current_time;

    let unstake_amount = stake_info.unstake_amount;

    // Reduce staked amount
    stake_info.amount = stake_info.amount.saturating_sub(unstake_amount);
    stake_info.unstake_requested_at = 0;
    stake_info.unstake_amount = 0;

    // Return CGT to user balance
    let balance_key = format!("bank_cgt/balance:{}", hex::encode(address));
    let current_balance = get_balance_cgt(state, address);
    let new_balance = current_balance.saturating_add(unstake_amount);
    let balance_data = bincode::serialize(&new_balance)
        .map_err(|e| format!("Failed to serialize balance: {}", e))?;
    state.put_raw(balance_key.into_bytes(), balance_data)
        .map_err(|e| format!("Failed to update balance: {}", e))?;

    // Update total staked
    update_total_staked(state, -(unstake_amount as i128))?;

    // Save stake info
    save_stake_info(state, address, &stake_info)?;

    Ok((stake_info, unstake_amount))
}

/// Cancel a pending unstake request
pub fn cancel_unstake(
    state: &mut State,
    address: &Address,
    current_time: u64,
) -> Result<StakeInfo, String> {
    let mut stake_info = get_stake_info(state, address);

    // Check if there's an unstake request
    if stake_info.unstake_requested_at == 0 || stake_info.unstake_amount == 0 {
        return Err("No unstake request to cancel".to_string());
    }

    // Calculate pending rewards
    stake_info.pending_rewards = calculate_pending_rewards(&stake_info, current_time);
    stake_info.last_reward_calculation = current_time;

    // Cancel the unstake request
    stake_info.unstake_requested_at = 0;
    stake_info.unstake_amount = 0;

    // Save stake info
    save_stake_info(state, address, &stake_info)?;

    Ok(stake_info)
}

/// Claim pending staking rewards
pub fn claim_rewards(
    state: &mut State,
    address: &Address,
    current_time: u64,
) -> Result<u128, String> {
    let mut stake_info = get_stake_info(state, address);

    // Calculate all pending rewards
    stake_info.pending_rewards = calculate_pending_rewards(&stake_info, current_time);
    stake_info.last_reward_calculation = current_time;

    let rewards = stake_info.pending_rewards;
    if rewards == 0 {
        return Err("No rewards to claim".to_string());
    }

    // Mint rewards to user
    cgt_mint_to(state, address, rewards, "cgt_staking")?;

    // Reset pending rewards
    stake_info.pending_rewards = 0;

    // Save stake info
    save_stake_info(state, address, &stake_info)?;

    Ok(rewards)
}

/// Get staking statistics
pub fn get_staking_stats(state: &State) -> StakingStats {
    StakingStats {
        total_staked: get_total_staked(state),
        apy_bps: BASE_APY_BPS,
        min_stake: MIN_STAKE_AMOUNT,
        lock_period_secs: UNSTAKE_LOCK_PERIOD,
    }
}

/// Staking statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StakingStats {
    pub total_staked: u128,
    pub apy_bps: u64,
    pub min_stake: u128,
    pub lock_period_secs: u64,
}

/// CGT Staking runtime module
pub struct CgtStakingModule;

impl CgtStakingModule {
    pub fn new() -> Self {
        Self
    }
}

impl Default for CgtStakingModule {
    fn default() -> Self {
        Self::new()
    }
}

impl RuntimeModule for CgtStakingModule {
    fn module_id(&self) -> &'static str {
        "cgt_staking"
    }

    fn dispatch(&self, call_id: &str, tx: &Transaction, state: &mut State) -> Result<(), String> {
        let current_time = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0);

        match call_id {
            "stake" => {
                let params: StakeParams = serde_json::from_slice(&tx.payload)
                    .map_err(|e| format!("Invalid stake params: {}", e))?;
                
                stake(state, &tx.from, params.amount, current_time)?;
                Ok(())
            }

            "request_unstake" => {
                let params: UnstakeParams = serde_json::from_slice(&tx.payload)
                    .map_err(|e| format!("Invalid unstake params: {}", e))?;
                
                request_unstake(state, &tx.from, params.amount, current_time)?;
                Ok(())
            }

            "complete_unstake" => {
                complete_unstake(state, &tx.from, current_time)?;
                Ok(())
            }

            "cancel_unstake" => {
                cancel_unstake(state, &tx.from, current_time)?;
                Ok(())
            }

            "claim_rewards" => {
                claim_rewards(state, &tx.from, current_time)?;
                Ok(())
            }

            _ => Err(format!("Unknown call_id for cgt_staking: {}", call_id)),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_rewards() {
        let stake = StakeInfo {
            amount: 1_000_000_00_000_000, // 1M CGT
            stake_timestamp: 0,
            pending_rewards: 0,
            last_reward_calculation: 0,
            unstake_requested_at: 0,
            unstake_amount: 0,
        };

        // After 1 year, should have ~5% rewards (reduced from 10%)
        let one_year = 365 * 24 * 60 * 60;
        let rewards = calculate_pending_rewards(&stake, one_year);
        
        // 1M CGT * 5% = 50K CGT (approximately)
        let expected = 50_000_00_000_000u128;
        let tolerance = expected / 10; // 10% tolerance for rounding
        
        assert!(
            rewards >= expected - tolerance && rewards <= expected + tolerance,
            "Expected ~{} rewards, got {}",
            expected,
            rewards
        );
    }

    #[test]
    fn test_stake_info_default() {
        let info = StakeInfo::default();
        assert_eq!(info.amount, 0);
        assert_eq!(info.pending_rewards, 0);
    }
}
