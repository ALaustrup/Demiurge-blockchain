//! Premium Tier Module
//!
//! Manages premium subscription tiers for AbyssID users.
//! Users can either pay monthly or stake CGT to unlock premium features.
//!
//! Tier Structure:
//! - FREE: 2 GB storage, standard features
//! - ARCHON: 10 GB storage, priority processing, badges (100 CGT/month or stake 10,000 CGT)
//! - GENESIS: 100 GB storage, exclusive features, governance bonus (500 CGT/month or stake 100,000 CGT)
//!
//! Revenue from premium subscriptions goes to the ecosystem treasury.

use serde::{Deserialize, Serialize};

use super::RuntimeModule;
use super::bank_cgt::{get_balance_cgt, set_balance_for_module};
use super::cgt_staking::get_stake_info;
use super::treasury::{get_treasury_balance, TREASURY_ADDRESS};
use crate::core::state::State;
use crate::core::transaction::{Address, Transaction};

// ============================================================================
// Constants
// ============================================================================

/// Storage limits (in bytes)
pub const FREE_STORAGE: u64 = 2 * 1024 * 1024 * 1024;       // 2 GB
pub const ARCHON_STORAGE: u64 = 10 * 1024 * 1024 * 1024;    // 10 GB
pub const GENESIS_STORAGE: u64 = 100 * 1024 * 1024 * 1024;  // 100 GB

/// Monthly subscription costs (in smallest CGT units, 10^-8)
pub const ARCHON_MONTHLY_COST: u128 = 100_00000000;         // 100 CGT
pub const GENESIS_MONTHLY_COST: u128 = 500_00000000;        // 500 CGT

/// Stake requirements for tier unlock (alternative to monthly payment)
pub const ARCHON_STAKE_REQUIREMENT: u128 = 10_000_00000000;     // 10,000 CGT
pub const GENESIS_STAKE_REQUIREMENT: u128 = 100_000_00000000;   // 100,000 CGT

/// Subscription duration in seconds (30 days)
pub const SUBSCRIPTION_DURATION: u64 = 30 * 24 * 60 * 60;

/// Storage key prefixes
const PREFIX_SUBSCRIPTION: &[u8] = b"premium/subscription:";
const PREFIX_STORAGE_USED: &[u8] = b"premium/storage_used:";

// ============================================================================
// Types
// ============================================================================

/// Premium tier levels
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PremiumTier {
    Free = 0,
    Archon = 1,
    Genesis = 2,
}

impl Default for PremiumTier {
    fn default() -> Self {
        PremiumTier::Free
    }
}

impl PremiumTier {
    /// Get the storage limit for this tier
    pub fn storage_limit(&self) -> u64 {
        match self {
            PremiumTier::Free => FREE_STORAGE,
            PremiumTier::Archon => ARCHON_STORAGE,
            PremiumTier::Genesis => GENESIS_STORAGE,
        }
    }
    
    /// Get the monthly cost for this tier (0 for Free)
    pub fn monthly_cost(&self) -> u128 {
        match self {
            PremiumTier::Free => 0,
            PremiumTier::Archon => ARCHON_MONTHLY_COST,
            PremiumTier::Genesis => GENESIS_MONTHLY_COST,
        }
    }
    
    /// Get the stake requirement for this tier (0 for Free)
    pub fn stake_requirement(&self) -> u128 {
        match self {
            PremiumTier::Free => 0,
            PremiumTier::Archon => ARCHON_STAKE_REQUIREMENT,
            PremiumTier::Genesis => GENESIS_STAKE_REQUIREMENT,
        }
    }
    
    /// Check if this tier includes a specific feature
    pub fn has_feature(&self, feature: PremiumFeature) -> bool {
        match feature {
            PremiumFeature::ExtendedStorage => *self != PremiumTier::Free,
            PremiumFeature::PriorityProcessing => *self != PremiumTier::Free,
            PremiumFeature::ProfileBadge => *self != PremiumTier::Free,
            PremiumFeature::PrioritySupport => *self != PremiumTier::Free,
            PremiumFeature::EarlyAccess => *self != PremiumTier::Free,
            PremiumFeature::ExclusiveThemes => *self == PremiumTier::Genesis,
            PremiumFeature::GovernanceBonus => *self == PremiumTier::Genesis,
            PremiumFeature::CustomHandle => *self == PremiumTier::Genesis,
            PremiumFeature::DirectSupport => *self == PremiumTier::Genesis,
        }
    }
}

/// Premium features available
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PremiumFeature {
    ExtendedStorage,
    PriorityProcessing,
    ProfileBadge,
    PrioritySupport,
    EarlyAccess,
    ExclusiveThemes,
    GovernanceBonus,
    CustomHandle,
    DirectSupport,
}

/// Subscription information for an address
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Subscription {
    /// The subscribed tier (if paid subscription)
    pub tier: PremiumTier,
    /// When the subscription expires (Unix timestamp)
    pub expires_at: u64,
    /// Total CGT spent on subscriptions
    pub total_spent: u128,
    /// Whether unlocked via staking (checked dynamically)
    pub stake_unlocked: bool,
}

/// User's premium status (combines subscription and stake)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PremiumStatus {
    pub effective_tier: PremiumTier,
    pub subscription_tier: PremiumTier,
    pub stake_tier: PremiumTier,
    pub subscription_expires_at: u64,
    pub staked_amount: u128,
    pub storage_limit: u64,
    pub storage_used: u64,
}

// ============================================================================
// State Management
// ============================================================================

/// Get subscription for an address
pub fn get_subscription(state: &State, address: &Address) -> Subscription {
    let key = [PREFIX_SUBSCRIPTION, address.as_slice()].concat();
    state
        .get_raw(&key)
        .and_then(|v| bincode::deserialize(&v).ok())
        .unwrap_or_default()
}

/// Save subscription for an address
fn save_subscription(state: &mut State, address: &Address, subscription: &Subscription) -> Result<(), String> {
    let key = [PREFIX_SUBSCRIPTION, address.as_slice()].concat();
    let data = bincode::serialize(subscription)
        .map_err(|e| format!("Failed to serialize subscription: {}", e))?;
    state.put_raw(key, data)
        .map_err(|e| format!("Failed to save subscription: {}", e))
}

/// Get storage used by an address
pub fn get_storage_used(state: &State, address: &Address) -> u64 {
    let key = [PREFIX_STORAGE_USED, address.as_slice()].concat();
    state
        .get_raw(&key)
        .and_then(|v| bincode::deserialize(&v).ok())
        .unwrap_or(0)
}

/// Update storage used by an address
pub fn update_storage_used(state: &mut State, address: &Address, used: u64) -> Result<(), String> {
    let key = [PREFIX_STORAGE_USED, address.as_slice()].concat();
    let data = bincode::serialize(&used)
        .map_err(|e| format!("Failed to serialize storage used: {}", e))?;
    state.put_raw(key, data)
        .map_err(|e| format!("Failed to update storage used: {}", e))
}

// ============================================================================
// Tier Calculation
// ============================================================================

/// Determine the tier a user has unlocked via staking
pub fn get_stake_tier(state: &State, address: &Address) -> PremiumTier {
    let stake_info = get_stake_info(state, address);
    let staked = stake_info.amount;
    
    if staked >= GENESIS_STAKE_REQUIREMENT {
        PremiumTier::Genesis
    } else if staked >= ARCHON_STAKE_REQUIREMENT {
        PremiumTier::Archon
    } else {
        PremiumTier::Free
    }
}

/// Get the effective premium tier for a user (best of subscription or stake)
pub fn get_effective_tier(state: &State, address: &Address, current_time: u64) -> PremiumTier {
    // Check subscription tier
    let subscription = get_subscription(state, address);
    let subscription_tier = if subscription.expires_at > current_time {
        subscription.tier
    } else {
        PremiumTier::Free
    };
    
    // Check stake tier
    let stake_tier = get_stake_tier(state, address);
    
    // Return the higher tier
    if stake_tier as u8 > subscription_tier as u8 {
        stake_tier
    } else {
        subscription_tier
    }
}

/// Get full premium status for a user
pub fn get_premium_status(state: &State, address: &Address, current_time: u64) -> PremiumStatus {
    let subscription = get_subscription(state, address);
    let stake_info = get_stake_info(state, address);
    
    let subscription_tier = if subscription.expires_at > current_time {
        subscription.tier
    } else {
        PremiumTier::Free
    };
    
    let stake_tier = get_stake_tier(state, address);
    
    let effective_tier = if stake_tier as u8 > subscription_tier as u8 {
        stake_tier
    } else {
        subscription_tier
    };
    
    PremiumStatus {
        effective_tier,
        subscription_tier,
        stake_tier,
        subscription_expires_at: subscription.expires_at,
        staked_amount: stake_info.amount,
        storage_limit: effective_tier.storage_limit(),
        storage_used: get_storage_used(state, address),
    }
}

// ============================================================================
// Subscription Management
// ============================================================================

/// Subscribe to a premium tier
pub fn subscribe(
    state: &mut State,
    address: &Address,
    tier: PremiumTier,
    months: u8,
    current_time: u64,
) -> Result<Subscription, String> {
    if tier == PremiumTier::Free {
        return Err("Cannot subscribe to Free tier".to_string());
    }
    
    if months == 0 || months > 12 {
        return Err("Months must be between 1 and 12".to_string());
    }
    
    let monthly_cost = tier.monthly_cost();
    let total_cost = monthly_cost * months as u128;
    
    // Check user balance
    let balance = get_balance_cgt(state, address);
    if balance < total_cost {
        return Err(format!(
            "Insufficient balance: have {}, need {}",
            balance, total_cost
        ));
    }
    
    // Deduct from user balance
    set_balance_for_module(state, address, balance - total_cost)?;
    
    // Credit treasury
    let treasury_balance = get_treasury_balance(state);
    let treasury_key = b"treasury/balance".to_vec();
    let new_treasury = treasury_balance + total_cost;
    let data = bincode::serialize(&new_treasury)
        .map_err(|e| format!("Failed to serialize treasury balance: {}", e))?;
    state.put_raw(treasury_key, data)
        .map_err(|e| format!("Failed to update treasury: {}", e))?;
    
    // Update subscription
    let mut subscription = get_subscription(state, address);
    
    // If upgrading tier or renewing
    let new_expires = if subscription.expires_at > current_time && subscription.tier == tier {
        // Extend existing subscription
        subscription.expires_at + (months as u64 * SUBSCRIPTION_DURATION)
    } else {
        // New subscription or tier change
        current_time + (months as u64 * SUBSCRIPTION_DURATION)
    };
    
    subscription.tier = tier;
    subscription.expires_at = new_expires;
    subscription.total_spent = subscription.total_spent.saturating_add(total_cost);
    
    save_subscription(state, address, &subscription)?;
    
    Ok(subscription)
}

/// Check if a user can use a certain amount of storage
pub fn can_use_storage(state: &State, address: &Address, additional_bytes: u64, current_time: u64) -> bool {
    let tier = get_effective_tier(state, address, current_time);
    let limit = tier.storage_limit();
    let used = get_storage_used(state, address);
    
    used + additional_bytes <= limit
}

// ============================================================================
// Runtime Module
// ============================================================================

/// Subscribe parameters
#[derive(Debug, Serialize, Deserialize)]
pub struct SubscribeParams {
    pub tier: u8, // 1 = Archon, 2 = Genesis
    pub months: u8,
}

/// Premium runtime module
pub struct PremiumModule;

impl PremiumModule {
    pub fn new() -> Self {
        Self
    }
}

impl Default for PremiumModule {
    fn default() -> Self {
        Self::new()
    }
}

impl RuntimeModule for PremiumModule {
    fn module_id(&self) -> &'static str {
        "premium"
    }

    fn dispatch(&self, call_id: &str, tx: &Transaction, state: &mut State) -> Result<(), String> {
        let current_time = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0);

        match call_id {
            "subscribe" => {
                let params: SubscribeParams = serde_json::from_slice(&tx.payload)
                    .map_err(|e| format!("Invalid subscribe params: {}", e))?;
                
                let tier = match params.tier {
                    1 => PremiumTier::Archon,
                    2 => PremiumTier::Genesis,
                    _ => return Err("Invalid tier: use 1 (Archon) or 2 (Genesis)".to_string()),
                };
                
                subscribe(state, &tx.from, tier, params.months, current_time)?;
                Ok(())
            }
            
            _ => Err(format!("Unknown call_id for premium: {}", call_id)),
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
    fn test_tier_storage_limits() {
        assert_eq!(PremiumTier::Free.storage_limit(), FREE_STORAGE);
        assert_eq!(PremiumTier::Archon.storage_limit(), ARCHON_STORAGE);
        assert_eq!(PremiumTier::Genesis.storage_limit(), GENESIS_STORAGE);
    }

    #[test]
    fn test_tier_monthly_costs() {
        assert_eq!(PremiumTier::Free.monthly_cost(), 0);
        assert_eq!(PremiumTier::Archon.monthly_cost(), ARCHON_MONTHLY_COST);
        assert_eq!(PremiumTier::Genesis.monthly_cost(), GENESIS_MONTHLY_COST);
    }

    #[test]
    fn test_tier_features() {
        // Free tier has no premium features
        assert!(!PremiumTier::Free.has_feature(PremiumFeature::ExtendedStorage));
        assert!(!PremiumTier::Free.has_feature(PremiumFeature::GovernanceBonus));
        
        // Archon has basic premium features
        assert!(PremiumTier::Archon.has_feature(PremiumFeature::ExtendedStorage));
        assert!(PremiumTier::Archon.has_feature(PremiumFeature::ProfileBadge));
        assert!(!PremiumTier::Archon.has_feature(PremiumFeature::GovernanceBonus));
        
        // Genesis has all features
        assert!(PremiumTier::Genesis.has_feature(PremiumFeature::ExtendedStorage));
        assert!(PremiumTier::Genesis.has_feature(PremiumFeature::GovernanceBonus));
        assert!(PremiumTier::Genesis.has_feature(PremiumFeature::CustomHandle));
    }

    #[test]
    fn test_default_subscription() {
        let state = State::in_memory();
        let address = [1u8; 32];
        
        let subscription = get_subscription(&state, &address);
        assert_eq!(subscription.tier, PremiumTier::Free);
        assert_eq!(subscription.expires_at, 0);
    }

    #[test]
    fn test_effective_tier_defaults_to_free() {
        let state = State::in_memory();
        let address = [1u8; 32];
        
        let tier = get_effective_tier(&state, &address, 1000000);
        assert_eq!(tier, PremiumTier::Free);
    }
}
