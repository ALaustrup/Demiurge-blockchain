//! DRC-369 Rental/Lease Protocol
//!
//! Enables NFT owners to rent out their assets while retaining ownership.
//! Critical for metaverse economies where users want to monetize idle assets.

use codec::{Decode, Encode};
use scale_info::TypeInfo;
use serde::{Deserialize, Serialize};
use demiurge_storage::Storage;

use crate::error::{Drc369Error, Result};

// ============================================================================
// STORAGE KEYS
// ============================================================================

pub mod storage_keys {
    pub const RENTAL_AGREEMENT: &[u8] = b"DRC369:Rental:Agreement:";
    pub const RENTAL_ACTIVE: &[u8] = b"DRC369:Rental:Active:";
    pub const RENTAL_HISTORY: &[u8] = b"DRC369:Rental:History:";
    pub const RENTAL_CONFIG: &[u8] = b"DRC369:Rental:Config:";
    pub const RENTAL_EARNINGS: &[u8] = b"DRC369:Rental:Earnings:";
}

// ============================================================================
// RENTAL AGREEMENT
// ============================================================================

/// A rental agreement between owner and renter
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct RentalAgreement {
    /// NFT being rented
    pub nft_id: [u8; 32],
    /// Owner of the NFT
    pub owner: [u8; 32],
    /// Current renter
    pub renter: [u8; 32],
    /// Rental start timestamp
    pub start_time: u64,
    /// Rental end timestamp
    pub end_time: u64,
    /// Price paid (in smallest unit)
    pub price_paid: u128,
    /// Rental type
    pub rental_type: RentalType,
    /// Permissions granted to renter
    pub permissions: RentalPermissions,
    /// Agreement status
    pub status: RentalStatus,
    /// Revenue share for renter (basis points)
    pub renter_revenue_share_bps: u16,
    /// Auto-renewal enabled
    pub auto_renew: bool,
    /// Collateral deposited (if any)
    pub collateral: u128,
}

impl RentalAgreement {
    /// Check if rental is currently active
    pub fn is_active(&self, current_time: u64) -> bool {
        matches!(self.status, RentalStatus::Active) 
            && current_time >= self.start_time 
            && current_time <= self.end_time
    }
    
    /// Calculate remaining time
    pub fn remaining_time(&self, current_time: u64) -> u64 {
        self.end_time.saturating_sub(current_time)
    }
    
    /// Check if rental has expired
    pub fn is_expired(&self, current_time: u64) -> bool {
        current_time > self.end_time
    }
}

/// Types of rentals
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize, PartialEq)]
pub enum RentalType {
    /// Fixed duration rental
    FixedTerm,
    /// Pay-per-use rental
    PayPerUse,
    /// Subscription (recurring)
    Subscription,
    /// Revenue sharing (renter pays % of earnings)
    RevenueShare,
    /// Free trial
    Trial,
}

/// Permissions granted to renter
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct RentalPermissions {
    /// Can use in games/metaverses
    pub use_in_game: bool,
    /// Can display/showcase
    pub display: bool,
    /// Can modify state (XP, level)
    pub modify_state: bool,
    /// Can equip items
    pub equip_items: bool,
    /// Can breed/combine (if applicable)
    pub breed: bool,
    /// Can sublease to others
    pub sublease: bool,
    /// Can participate in battles
    pub battle: bool,
    /// Can earn rewards
    pub earn_rewards: bool,
    /// Custom permissions
    pub custom: Vec<String>,
}

impl Default for RentalPermissions {
    fn default() -> Self {
        Self {
            use_in_game: true,
            display: true,
            modify_state: false,
            equip_items: false,
            breed: false,
            sublease: false,
            battle: true,
            earn_rewards: true,
            custom: vec![],
        }
    }
}

/// Rental agreement status
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize, PartialEq)]
pub enum RentalStatus {
    /// Listed for rent
    Listed,
    /// Active rental
    Active,
    /// Completed normally
    Completed,
    /// Cancelled by owner
    CancelledByOwner,
    /// Cancelled by renter
    CancelledByRenter,
    /// Expired without renewal
    Expired,
    /// Disputed
    Disputed,
}

// ============================================================================
// RENTAL CONFIGURATION
// ============================================================================

/// Owner's rental configuration for an NFT
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct RentalConfig {
    /// NFT ID
    pub nft_id: [u8; 32],
    /// Is rental enabled
    pub enabled: bool,
    /// Minimum rental duration (seconds)
    pub min_duration: u64,
    /// Maximum rental duration (seconds)
    pub max_duration: u64,
    /// Price per day (in smallest unit)
    pub price_per_day: u128,
    /// Collateral required (0 = none)
    pub collateral_required: u128,
    /// Allowed rental types
    pub allowed_types: Vec<RentalType>,
    /// Default permissions for renters
    pub default_permissions: RentalPermissions,
    /// Maximum concurrent rentals (for fractional)
    pub max_concurrent: u8,
    /// Whitelisted renters (empty = anyone)
    pub whitelist: Vec<[u8; 32]>,
    /// Blacklisted renters
    pub blacklist: Vec<[u8; 32]>,
}

impl Default for RentalConfig {
    fn default() -> Self {
        Self {
            nft_id: [0; 32],
            enabled: false,
            min_duration: 3600,        // 1 hour minimum
            max_duration: 2592000,     // 30 days maximum
            price_per_day: 0,
            collateral_required: 0,
            allowed_types: vec![RentalType::FixedTerm],
            default_permissions: RentalPermissions::default(),
            max_concurrent: 1,
            whitelist: vec![],
            blacklist: vec![],
        }
    }
}

// ============================================================================
// RENTAL MANAGER
// ============================================================================

/// Manages all rental operations
pub struct RentalManager;

impl RentalManager {
    // ========== Storage Keys ==========
    
    fn agreement_key(nft_id: &[u8; 32]) -> Vec<u8> {
        let mut key = storage_keys::RENTAL_AGREEMENT.to_vec();
        key.extend_from_slice(nft_id);
        key
    }
    
    fn config_key(nft_id: &[u8; 32]) -> Vec<u8> {
        let mut key = storage_keys::RENTAL_CONFIG.to_vec();
        key.extend_from_slice(nft_id);
        key
    }
    
    fn active_rental_key(renter: &[u8; 32], nft_id: &[u8; 32]) -> Vec<u8> {
        let mut key = storage_keys::RENTAL_ACTIVE.to_vec();
        key.extend_from_slice(renter);
        key.extend_from_slice(nft_id);
        key
    }
    
    fn earnings_key(owner: &[u8; 32]) -> Vec<u8> {
        let mut key = storage_keys::RENTAL_EARNINGS.to_vec();
        key.extend_from_slice(owner);
        key
    }
    
    // ========== Configuration ==========
    
    /// Set rental configuration for an NFT
    pub fn set_config(
        storage: &dyn Storage,
        caller: [u8; 32],
        nft_id: [u8; 32],
        owner: [u8; 32],
        config: RentalConfig,
    ) -> Result<()> {
        // Only owner can configure
        if caller != owner {
            return Err(Drc369Error::NotOwner);
        }
        
        // Validate config
        if config.min_duration > config.max_duration {
            return Err(Drc369Error::StateUpdateFailed(
                "min_duration cannot exceed max_duration".to_string()
            ));
        }
        
        let key = Self::config_key(&nft_id);
        storage.put(&key, &config.encode());
        
        Ok(())
    }
    
    /// Get rental configuration
    pub fn get_config(storage: &dyn Storage, nft_id: &[u8; 32]) -> Option<RentalConfig> {
        let key = Self::config_key(nft_id);
        storage.get(&key).and_then(|bytes| RentalConfig::decode(&mut &bytes[..]).ok())
    }
    
    // ========== Rental Operations ==========
    
    /// Start a rental
    // Mirrors the on-chain call signature; all params are distinct rental terms.
    #[allow(clippy::too_many_arguments)]
    pub fn start_rental(
        storage: &dyn Storage,
        owner: [u8; 32],
        renter: [u8; 32],
        nft_id: [u8; 32],
        duration_seconds: u64,
        current_time: u64,
        payment: u128,
        collateral: u128,
    ) -> Result<RentalAgreement> {
        // Get config
        let config = Self::get_config(storage, &nft_id)
            .ok_or(Drc369Error::StateUpdateFailed("Rental not configured".to_string()))?;
        
        if !config.enabled {
            return Err(Drc369Error::StateUpdateFailed("Rental not enabled".to_string()));
        }
        
        // Validate duration
        if duration_seconds < config.min_duration || duration_seconds > config.max_duration {
            return Err(Drc369Error::StateUpdateFailed("Invalid rental duration".to_string()));
        }
        
        // Validate collateral
        if collateral < config.collateral_required {
            return Err(Drc369Error::StateUpdateFailed("Insufficient collateral".to_string()));
        }
        
        // Check whitelist/blacklist
        if !config.whitelist.is_empty() && !config.whitelist.contains(&renter) {
            return Err(Drc369Error::StateUpdateFailed("Renter not whitelisted".to_string()));
        }
        if config.blacklist.contains(&renter) {
            return Err(Drc369Error::StateUpdateFailed("Renter is blacklisted".to_string()));
        }
        
        // Check no existing active rental
        if Self::get_active_agreement(storage, &nft_id).is_some() {
            return Err(Drc369Error::StateUpdateFailed("NFT already rented".to_string()));
        }
        
        // Calculate expected payment
        let days = (duration_seconds as u128).div_ceil(86400); // Round up
        let expected_payment = config.price_per_day * days;
        if payment < expected_payment {
            return Err(Drc369Error::StateUpdateFailed("Insufficient payment".to_string()));
        }
        
        // Create agreement
        let agreement = RentalAgreement {
            nft_id,
            owner,
            renter,
            start_time: current_time,
            end_time: current_time + duration_seconds,
            price_paid: payment,
            rental_type: RentalType::FixedTerm,
            permissions: config.default_permissions,
            status: RentalStatus::Active,
            renter_revenue_share_bps: 0,
            auto_renew: false,
            collateral,
        };
        
        // Store agreement
        let key = Self::agreement_key(&nft_id);
        storage.put(&key, &agreement.encode());
        
        // Track active rental for renter
        let active_key = Self::active_rental_key(&renter, &nft_id);
        storage.put(&active_key, &[1u8]);
        
        // Update owner earnings
        let earnings_key = Self::earnings_key(&owner);
        let current_earnings: u128 = storage.get(&earnings_key)
            .and_then(|bytes| u128::decode(&mut &bytes[..]).ok())
            .unwrap_or(0);
        storage.put(&earnings_key, &(current_earnings + payment).encode());
        
        Ok(agreement)
    }
    
    /// End a rental (by owner or expiration)
    pub fn end_rental(
        storage: &dyn Storage,
        caller: [u8; 32],
        nft_id: [u8; 32],
        current_time: u64,
    ) -> Result<RentalAgreement> {
        let mut agreement = Self::get_active_agreement(storage, &nft_id)
            .ok_or(Drc369Error::StateUpdateFailed("No active rental".to_string()))?;
        
        // Check authorization
        let is_expired = agreement.is_expired(current_time);
        let is_owner = caller == agreement.owner;
        let is_renter = caller == agreement.renter;
        
        if !is_expired && !is_owner && !is_renter {
            return Err(Drc369Error::NotOwner);
        }
        
        // Update status
        agreement.status = if is_expired {
            RentalStatus::Expired
        } else if is_owner {
            RentalStatus::CancelledByOwner
        } else {
            RentalStatus::CancelledByRenter
        };
        
        // Store updated agreement
        let key = Self::agreement_key(&nft_id);
        storage.put(&key, &agreement.encode());
        
        // Remove active rental tracking
        let active_key = Self::active_rental_key(&agreement.renter, &nft_id);
        storage.put(&active_key, &[0u8]);
        
        Ok(agreement)
    }
    
    /// Get active rental agreement for an NFT
    pub fn get_active_agreement(storage: &dyn Storage, nft_id: &[u8; 32]) -> Option<RentalAgreement> {
        let key = Self::agreement_key(nft_id);
        storage.get(&key)
            .and_then(|bytes| RentalAgreement::decode(&mut &bytes[..]).ok())
            .filter(|a| matches!(a.status, RentalStatus::Active))
    }
    
    /// Check if an address has usage rights (owner or active renter)
    pub fn has_usage_rights(
        storage: &dyn Storage,
        nft_id: &[u8; 32],
        account: &[u8; 32],
        owner: &[u8; 32],
        current_time: u64,
    ) -> bool {
        // Owner always has rights
        if account == owner {
            return true;
        }
        
        // Check for active rental
        if let Some(agreement) = Self::get_active_agreement(storage, nft_id) {
            if &agreement.renter == account && agreement.is_active(current_time) {
                return true;
            }
        }
        
        false
    }
    
    /// Get total earnings for an owner
    pub fn get_earnings(storage: &dyn Storage, owner: &[u8; 32]) -> u128 {
        let key = Self::earnings_key(owner);
        storage.get(&key)
            .and_then(|bytes| u128::decode(&mut &bytes[..]).ok())
            .unwrap_or(0)
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_rental_agreement_active() {
        let agreement = RentalAgreement {
            nft_id: [1; 32],
            owner: [2; 32],
            renter: [3; 32],
            start_time: 1000,
            end_time: 2000,
            price_paid: 100,
            rental_type: RentalType::FixedTerm,
            permissions: RentalPermissions::default(),
            status: RentalStatus::Active,
            renter_revenue_share_bps: 0,
            auto_renew: false,
            collateral: 0,
        };
        
        assert!(agreement.is_active(1500));
        assert!(!agreement.is_active(500));
        assert!(!agreement.is_active(2500));
        assert_eq!(agreement.remaining_time(1500), 500);
    }
    
    #[test]
    fn test_rental_config_default() {
        let config = RentalConfig::default();
        assert!(!config.enabled);
        assert_eq!(config.min_duration, 3600);
        assert_eq!(config.max_concurrent, 1);
    }
}
