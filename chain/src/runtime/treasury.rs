//! Treasury Module
//!
//! Manages the ecosystem treasury and fee distribution for CGT.
//! 
//! Fee Distribution (70/20/10 Split):
//! - 70% → Ecosystem Treasury (development, infrastructure, grants)
//! - 20% → Token Burn (deflationary pressure)
//! - 10% → Validator Rewards (network security incentives)
//!
//! The treasury funds future development including:
//! - AbyssID storage upgrades
//! - Premium infrastructure
//! - Community grants
//! - Protocol improvements

use serde::{Deserialize, Serialize};

use super::RuntimeModule;
use super::bank_cgt::{get_balance_cgt, cgt_burn_from, set_balance_for_module, get_cgt_total_supply, set_cgt_total_supply};
use crate::core::state::State;
use crate::core::transaction::{Address, Transaction};

// ============================================================================
// Constants
// ============================================================================

/// Fee structure constants
pub const FEE_RATE_BPS: u64 = 10;                    // 0.1% fee rate
pub const MIN_FEE: u128 = 10_000;                    // 0.0001 CGT minimum
pub const MAX_FEE: u128 = 10_000_000_000;            // 100 CGT maximum

/// Fee distribution percentages (basis points, 10000 = 100%)
pub const TREASURY_SHARE_BPS: u64 = 7000;            // 70%
pub const BURN_SHARE_BPS: u64 = 2000;                // 20%
pub const VALIDATOR_SHARE_BPS: u64 = 1000;           // 10%

/// Storage key prefixes
const KEY_TREASURY_BALANCE: &[u8] = b"treasury/balance";
const KEY_TOTAL_FEES_COLLECTED: &[u8] = b"treasury/total_fees";
const KEY_TOTAL_BURNED: &[u8] = b"treasury/total_burned";
const KEY_TOTAL_VALIDATOR_REWARDS: &[u8] = b"treasury/total_validator_rewards";
const PREFIX_VALIDATOR_REWARDS: &[u8] = b"treasury/validator_rewards:";

/// Treasury address - a deterministic address derived from "DEMIURGE_TREASURY"
/// This is the ecosystem's reserve address for collected fees
pub const TREASURY_ADDRESS: Address = [
    0xDE, 0x41, 0x55, 0x52, 0x47, 0x45, 0x5F, 0x54, // "DEMIURGE_T"
    0x52, 0x45, 0x41, 0x53, 0x55, 0x52, 0x59, 0x00, // "REASURY\0"
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01,
];

/// Burn address - tokens sent here are permanently removed from circulation
pub const BURN_ADDRESS: Address = [
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0xDE, 0xAD, 0xBE, 0xEF,
];

// ============================================================================
// Fee Calculation
// ============================================================================

/// Fee distribution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeeDistribution {
    pub total_fee: u128,
    pub treasury_share: u128,
    pub burn_share: u128,
    pub validator_share: u128,
}

/// Calculate the fee for a transaction based on the amount
pub fn calculate_fee(amount: u128) -> u128 {
    // Fee = max(MIN_FEE, min(amount * FEE_RATE, MAX_FEE))
    let percentage_fee = (amount * FEE_RATE_BPS as u128) / 10000;
    
    if percentage_fee < MIN_FEE {
        MIN_FEE
    } else if percentage_fee > MAX_FEE {
        MAX_FEE
    } else {
        percentage_fee
    }
}

/// Calculate how a fee should be distributed
pub fn calculate_fee_distribution(total_fee: u128) -> FeeDistribution {
    let treasury_share = (total_fee * TREASURY_SHARE_BPS as u128) / 10000;
    let burn_share = (total_fee * BURN_SHARE_BPS as u128) / 10000;
    // Validator gets the remainder to avoid rounding issues
    let validator_share = total_fee - treasury_share - burn_share;
    
    FeeDistribution {
        total_fee,
        treasury_share,
        burn_share,
        validator_share,
    }
}

// ============================================================================
// Treasury State Management
// ============================================================================

/// Get the current treasury balance
pub fn get_treasury_balance(state: &State) -> u128 {
    state
        .get_raw(KEY_TREASURY_BALANCE)
        .and_then(|v| bincode::deserialize(&v).ok())
        .unwrap_or(0)
}

/// Set the treasury balance
fn set_treasury_balance(state: &mut State, amount: u128) -> Result<(), String> {
    let data = bincode::serialize(&amount)
        .map_err(|e| format!("Failed to serialize treasury balance: {}", e))?;
    state
        .put_raw(KEY_TREASURY_BALANCE.to_vec(), data)
        .map_err(|e| format!("Failed to save treasury balance: {}", e))
}

/// Get total fees collected (historical)
pub fn get_total_fees_collected(state: &State) -> u128 {
    state
        .get_raw(KEY_TOTAL_FEES_COLLECTED)
        .and_then(|v| bincode::deserialize(&v).ok())
        .unwrap_or(0)
}

/// Get total tokens burned (historical)
pub fn get_total_burned(state: &State) -> u128 {
    state
        .get_raw(KEY_TOTAL_BURNED)
        .and_then(|v| bincode::deserialize(&v).ok())
        .unwrap_or(0)
}

/// Get total validator rewards distributed (historical)
pub fn get_total_validator_rewards(state: &State) -> u128 {
    state
        .get_raw(KEY_TOTAL_VALIDATOR_REWARDS)
        .and_then(|v| bincode::deserialize(&v).ok())
        .unwrap_or(0)
}

/// Get rewards accumulated by a specific validator
pub fn get_validator_rewards(state: &State, validator: &Address) -> u128 {
    let key = [PREFIX_VALIDATOR_REWARDS, validator.as_slice()].concat();
    state
        .get_raw(&key)
        .and_then(|v| bincode::deserialize(&v).ok())
        .unwrap_or(0)
}

// ============================================================================
// Fee Distribution
// ============================================================================

/// Distribute a fee according to the 70/20/10 split
/// 
/// # Arguments
/// - `state`: Mutable chain state
/// - `total_fee`: The total fee amount to distribute
/// - `validator`: The address of the current block producer (receives 10%)
/// 
/// # Returns
/// - `Ok(FeeDistribution)` with the amounts distributed
/// - `Err(String)` if distribution fails
pub fn distribute_fees(
    state: &mut State,
    total_fee: u128,
    validator: &Address,
) -> Result<FeeDistribution, String> {
    if total_fee == 0 {
        return Ok(FeeDistribution {
            total_fee: 0,
            treasury_share: 0,
            burn_share: 0,
            validator_share: 0,
        });
    }
    
    let distribution = calculate_fee_distribution(total_fee);
    
    // 1. Credit treasury (70%)
    let current_treasury = get_treasury_balance(state);
    set_treasury_balance(state, current_treasury.saturating_add(distribution.treasury_share))?;
    
    // 2. Burn tokens (20%) - reduce total supply
    if distribution.burn_share > 0 {
        let current_supply = get_cgt_total_supply(state).map_err(|e| e.to_string())?;
        let new_supply = current_supply.saturating_sub(distribution.burn_share);
        set_cgt_total_supply(state, new_supply).map_err(|e| e.to_string())?;
        
        // Update burn counter
        let total_burned = get_total_burned(state);
        let data = bincode::serialize(&(total_burned + distribution.burn_share))
            .map_err(|e| format!("Failed to serialize burn counter: {}", e))?;
        state.put_raw(KEY_TOTAL_BURNED.to_vec(), data)
            .map_err(|e| format!("Failed to update burn counter: {}", e))?;
    }
    
    // 3. Credit validator (10%)
    if distribution.validator_share > 0 {
        let current_balance = get_balance_cgt(state, validator);
        set_balance_for_module(state, validator, current_balance + distribution.validator_share)?;
        
        // Update validator rewards counter
        let key = [PREFIX_VALIDATOR_REWARDS, validator.as_slice()].concat();
        let validator_total = get_validator_rewards(state, validator);
        let data = bincode::serialize(&(validator_total + distribution.validator_share))
            .map_err(|e| format!("Failed to serialize validator rewards: {}", e))?;
        state.put_raw(key, data)
            .map_err(|e| format!("Failed to update validator rewards: {}", e))?;
        
        // Update total validator rewards
        let total_rewards = get_total_validator_rewards(state);
        let data = bincode::serialize(&(total_rewards + distribution.validator_share))
            .map_err(|e| format!("Failed to serialize total validator rewards: {}", e))?;
        state.put_raw(KEY_TOTAL_VALIDATOR_REWARDS.to_vec(), data)
            .map_err(|e| format!("Failed to update total validator rewards: {}", e))?;
    }
    
    // Update total fees collected counter
    let total_fees = get_total_fees_collected(state);
    let data = bincode::serialize(&(total_fees + total_fee))
        .map_err(|e| format!("Failed to serialize total fees: {}", e))?;
    state.put_raw(KEY_TOTAL_FEES_COLLECTED.to_vec(), data)
        .map_err(|e| format!("Failed to update total fees: {}", e))?;
    
    Ok(distribution)
}

/// Withdraw from treasury (governance-controlled in the future)
/// For now, only the genesis address can withdraw
pub fn withdraw_from_treasury(
    state: &mut State,
    to: &Address,
    amount: u128,
    caller: &Address,
) -> Result<(), String> {
    // Only genesis (all zeros) can withdraw for now
    // In the future, this will be governance-controlled
    if *caller != [0u8; 32] {
        return Err("Only governance can withdraw from treasury".to_string());
    }
    
    let current_balance = get_treasury_balance(state);
    if amount > current_balance {
        return Err(format!(
            "Insufficient treasury balance: {} < {}",
            current_balance, amount
        ));
    }
    
    // Deduct from treasury
    set_treasury_balance(state, current_balance - amount)?;
    
    // Credit recipient
    let recipient_balance = get_balance_cgt(state, to);
    set_balance_for_module(state, to, recipient_balance + amount)?;
    
    Ok(())
}

// ============================================================================
// Treasury Statistics
// ============================================================================

/// Treasury statistics for RPC queries
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TreasuryStats {
    pub balance: u128,
    pub total_fees_collected: u128,
    pub total_burned: u128,
    pub total_validator_rewards: u128,
    pub fee_rate_bps: u64,
    pub treasury_share_bps: u64,
    pub burn_share_bps: u64,
    pub validator_share_bps: u64,
}

/// Get treasury statistics
pub fn get_treasury_stats(state: &State) -> TreasuryStats {
    TreasuryStats {
        balance: get_treasury_balance(state),
        total_fees_collected: get_total_fees_collected(state),
        total_burned: get_total_burned(state),
        total_validator_rewards: get_total_validator_rewards(state),
        fee_rate_bps: FEE_RATE_BPS,
        treasury_share_bps: TREASURY_SHARE_BPS,
        burn_share_bps: BURN_SHARE_BPS,
        validator_share_bps: VALIDATOR_SHARE_BPS,
    }
}

// ============================================================================
// Runtime Module
// ============================================================================

/// Treasury withdrawal parameters
#[derive(Debug, Serialize, Deserialize)]
pub struct WithdrawParams {
    pub to: Address,
    pub amount: u128,
}

/// Treasury runtime module
pub struct TreasuryModule;

impl TreasuryModule {
    pub fn new() -> Self {
        Self
    }
}

impl Default for TreasuryModule {
    fn default() -> Self {
        Self::new()
    }
}

impl RuntimeModule for TreasuryModule {
    fn module_id(&self) -> &'static str {
        "treasury"
    }

    fn dispatch(&self, call_id: &str, tx: &Transaction, state: &mut State) -> Result<(), String> {
        match call_id {
            "withdraw" => {
                let params: WithdrawParams = serde_json::from_slice(&tx.payload)
                    .map_err(|e| format!("Invalid withdraw params: {}", e))?;
                
                withdraw_from_treasury(state, &params.to, params.amount, &tx.from)
            }
            
            _ => Err(format!("Unknown call_id for treasury: {}", call_id)),
        }
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::state::State;

    #[test]
    fn test_calculate_fee() {
        // Test minimum fee
        assert_eq!(calculate_fee(100), MIN_FEE); // Too small, use minimum
        
        // Test percentage fee
        assert_eq!(calculate_fee(10_000_000_000_000), 1_000_000_000); // 0.1% of 10,000 CGT = 10 CGT
        
        // Test maximum fee cap
        assert_eq!(calculate_fee(1_000_000_000_000_000_000), MAX_FEE); // Very large, capped at 100 CGT
    }

    #[test]
    fn test_fee_distribution() {
        let fee = 1_000_000_000; // 10 CGT
        let distribution = calculate_fee_distribution(fee);
        
        assert_eq!(distribution.total_fee, fee);
        assert_eq!(distribution.treasury_share, 700_000_000); // 70%
        assert_eq!(distribution.burn_share, 200_000_000); // 20%
        assert_eq!(distribution.validator_share, 100_000_000); // 10%
        
        // Verify no rounding errors
        assert_eq!(
            distribution.treasury_share + distribution.burn_share + distribution.validator_share,
            fee
        );
    }

    #[test]
    fn test_distribute_fees() {
        let mut state = State::in_memory();
        let validator = [1u8; 32];
        let fee = 1_000_000_000; // 10 CGT
        
        let distribution = distribute_fees(&mut state, fee, &validator).unwrap();
        
        // Check treasury balance
        assert_eq!(get_treasury_balance(&state), 700_000_000);
        
        // Check validator balance
        assert_eq!(get_balance_cgt(&state, &validator), 100_000_000);
        
        // Check counters
        assert_eq!(get_total_fees_collected(&state), fee);
        assert_eq!(get_total_burned(&state), 200_000_000);
        assert_eq!(get_total_validator_rewards(&state), 100_000_000);
    }

    #[test]
    fn test_treasury_address() {
        // Treasury address should be non-zero and unique
        assert_ne!(TREASURY_ADDRESS, [0u8; 32]);
        assert_ne!(TREASURY_ADDRESS, BURN_ADDRESS);
    }
}
