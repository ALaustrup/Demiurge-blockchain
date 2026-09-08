//! DRC-369 Fractional Ownership Module
//!
//! Enables NFTs to be split into fungible shares, allowing multiple
//! owners to hold stakes in high-value assets.

use codec::{Decode, Encode};
use scale_info::TypeInfo;
use serde::{Deserialize, Serialize};
use demiurge_storage::Storage;
use blake2::{Blake2b512, Digest};

use crate::error::{Drc369Error, Result};

// ============================================================================
// STORAGE KEYS
// ============================================================================

pub mod storage_keys {
    pub const FRACTIONAL_CONFIG: &[u8] = b"DRC369:Fractional:Config:";
    pub const FRACTIONAL_SHARE: &[u8] = b"DRC369:Fractional:Share:";
    pub const FRACTIONAL_TOTAL: &[u8] = b"DRC369:Fractional:Total:";
    pub const FRACTIONAL_LOCKED: &[u8] = b"DRC369:Fractional:Locked:";
    pub const FRACTIONAL_BUYOUT: &[u8] = b"DRC369:Fractional:Buyout:";
    pub const FRACTIONAL_VOTES: &[u8] = b"DRC369:Fractional:Votes:";
}

// ============================================================================
// FRACTIONAL CONFIGURATION
// ============================================================================

/// Configuration for fractionalized NFT
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct FractionalConfig {
    /// NFT ID that was fractionalized
    pub nft_id: [u8; 32],
    /// Total number of shares
    pub total_shares: u64,
    /// Share token symbol
    pub symbol: String,
    /// Share token name
    pub name: String,
    /// Minimum shares required for governance
    pub governance_threshold_bps: u16,
    /// Buyout enabled
    pub buyout_enabled: bool,
    /// Minimum buyout price per share
    pub min_buyout_price: u128,
    /// Curator address (manages the NFT)
    pub curator: [u8; 32],
    /// Curator fee (basis points)
    pub curator_fee_bps: u16,
    /// Is the fractionalization finalized
    pub finalized: bool,
    /// Creation timestamp
    pub created_at: u64,
}

impl Default for FractionalConfig {
    fn default() -> Self {
        Self {
            nft_id: [0; 32],
            total_shares: 10000, // Default 10,000 shares
            symbol: "FRAC".to_string(),
            name: "Fractional NFT".to_string(),
            governance_threshold_bps: 100, // 1% for proposals
            buyout_enabled: true,
            min_buyout_price: 0,
            curator: [0; 32],
            curator_fee_bps: 250, // 2.5% curator fee
            finalized: false,
            created_at: 0,
        }
    }
}

// ============================================================================
// SHARE HOLDER
// ============================================================================

/// Share balance for an account
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize, Default)]
pub struct ShareBalance {
    /// Free (unlocked) shares
    pub free: u64,
    /// Locked shares (in governance votes, etc.)
    pub locked: u64,
}

impl ShareBalance {
    pub fn total(&self) -> u64 {
        self.free + self.locked
    }
}

// ============================================================================
// BUYOUT MECHANISM
// ============================================================================

/// Buyout offer for a fractionalized NFT
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct BuyoutOffer {
    /// Offerer address
    pub offerer: [u8; 32],
    /// Price per share offered
    pub price_per_share: u128,
    /// Total value of offer
    pub total_value: u128,
    /// Shares collected so far
    pub shares_collected: u64,
    /// Deadline for buyout
    pub deadline: u64,
    /// Status
    pub status: BuyoutStatus,
    /// Deposited funds
    pub deposited: u128,
}

/// Buyout offer status
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize, PartialEq)]
pub enum BuyoutStatus {
    /// Active offer
    Active,
    /// Enough shares collected, executing
    Executing,
    /// Completed successfully
    Completed,
    /// Failed (not enough shares)
    Failed,
    /// Cancelled by offerer
    Cancelled,
}

// ============================================================================
// GOVERNANCE
// ============================================================================

/// Governance proposal for fractionalized NFT
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct FractionalProposal {
    /// Proposal ID
    pub id: u64,
    /// NFT ID
    pub nft_id: [u8; 32],
    /// Proposer
    pub proposer: [u8; 32],
    /// Proposal type
    pub proposal_type: ProposalType,
    /// Description
    pub description: String,
    /// Voting deadline
    pub deadline: u64,
    /// Votes for
    pub votes_for: u64,
    /// Votes against
    pub votes_against: u64,
    /// Status
    pub status: ProposalStatus,
    /// Required approval percentage (basis points)
    pub required_approval_bps: u16,
}

/// Types of governance proposals
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize, PartialEq)]
pub enum ProposalType {
    /// Change curator
    ChangeCurator([u8; 32]),
    /// Update metadata
    UpdateMetadata(String),
    /// Enable/disable buyout
    ToggleBuyout(bool),
    /// Set minimum buyout price
    SetMinBuyout(u128),
    /// Reconstitute (merge back to single NFT)
    Reconstitute([u8; 32]),
    /// List on marketplace
    ListForSale(u128),
    /// Custom action
    Custom(Vec<u8>),
}

/// Proposal status
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize, PartialEq)]
pub enum ProposalStatus {
    Active,
    Passed,
    Failed,
    Executed,
    Cancelled,
}

// ============================================================================
// FRACTIONAL MANAGER
// ============================================================================

/// Manages fractional ownership operations
pub struct FractionalManager;

impl FractionalManager {
    // ========== Storage Keys ==========
    
    fn config_key(nft_id: &[u8; 32]) -> Vec<u8> {
        let mut key = storage_keys::FRACTIONAL_CONFIG.to_vec();
        key.extend_from_slice(nft_id);
        key
    }
    
    fn share_key(nft_id: &[u8; 32], account: &[u8; 32]) -> Vec<u8> {
        let mut key = storage_keys::FRACTIONAL_SHARE.to_vec();
        key.extend_from_slice(nft_id);
        key.extend_from_slice(account);
        key
    }
    
    fn buyout_key(nft_id: &[u8; 32]) -> Vec<u8> {
        let mut key = storage_keys::FRACTIONAL_BUYOUT.to_vec();
        key.extend_from_slice(nft_id);
        key
    }
    
    // ========== Fractionalization ==========
    
    /// Fractionalize an NFT into shares
    pub fn fractionalize(
        storage: &dyn Storage,
        owner: [u8; 32],
        nft_id: [u8; 32],
        total_shares: u64,
        symbol: String,
        name: String,
        current_time: u64,
    ) -> Result<FractionalConfig> {
        // Check not already fractionalized
        if Self::get_config(storage, &nft_id).is_some() {
            return Err(Drc369Error::StateUpdateFailed("Already fractionalized".to_string()));
        }
        
        // Validate
        if total_shares == 0 || total_shares > 1_000_000_000 {
            return Err(Drc369Error::StateUpdateFailed("Invalid share count".to_string()));
        }
        
        // Create config
        let config = FractionalConfig {
            nft_id,
            total_shares,
            symbol,
            name,
            governance_threshold_bps: 100,
            buyout_enabled: true,
            min_buyout_price: 0,
            curator: owner,
            curator_fee_bps: 250,
            finalized: true,
            created_at: current_time,
        };
        
        // Store config
        let key = Self::config_key(&nft_id);
        storage.put(&key, &config.encode());
        
        // Give all shares to owner
        let share_key = Self::share_key(&nft_id, &owner);
        let balance = ShareBalance { free: total_shares, locked: 0 };
        storage.put(&share_key, &balance.encode());
        
        Ok(config)
    }
    
    /// Get fractionalization config
    pub fn get_config(storage: &dyn Storage, nft_id: &[u8; 32]) -> Option<FractionalConfig> {
        let key = Self::config_key(nft_id);
        storage.get(&key).and_then(|bytes| FractionalConfig::decode(&mut &bytes[..]).ok())
    }
    
    /// Check if NFT is fractionalized
    pub fn is_fractionalized(storage: &dyn Storage, nft_id: &[u8; 32]) -> bool {
        Self::get_config(storage, nft_id).is_some()
    }
    
    // ========== Share Operations ==========
    
    /// Get share balance for an account
    pub fn get_shares(storage: &dyn Storage, nft_id: &[u8; 32], account: &[u8; 32]) -> ShareBalance {
        let key = Self::share_key(nft_id, account);
        storage.get(&key)
            .and_then(|bytes| ShareBalance::decode(&mut &bytes[..]).ok())
            .unwrap_or_default()
    }
    
    /// Transfer shares between accounts
    pub fn transfer_shares(
        storage: &dyn Storage,
        nft_id: [u8; 32],
        from: [u8; 32],
        to: [u8; 32],
        amount: u64,
    ) -> Result<()> {
        // Check fractionalized
        if !Self::is_fractionalized(storage, &nft_id) {
            return Err(Drc369Error::StateUpdateFailed("Not fractionalized".to_string()));
        }
        
        // Get sender balance
        let mut from_balance = Self::get_shares(storage, &nft_id, &from);
        if from_balance.free < amount {
            return Err(Drc369Error::StateUpdateFailed("Insufficient shares".to_string()));
        }
        
        // Update balances
        from_balance.free -= amount;
        let mut to_balance = Self::get_shares(storage, &nft_id, &to);
        to_balance.free += amount;
        
        // Store
        let from_key = Self::share_key(&nft_id, &from);
        let to_key = Self::share_key(&nft_id, &to);
        storage.put(&from_key, &from_balance.encode());
        storage.put(&to_key, &to_balance.encode());
        
        Ok(())
    }
    
    /// Calculate ownership percentage (basis points)
    pub fn ownership_percentage_bps(storage: &dyn Storage, nft_id: &[u8; 32], account: &[u8; 32]) -> u16 {
        let config = match Self::get_config(storage, nft_id) {
            Some(c) => c,
            None => return 0,
        };
        
        let balance = Self::get_shares(storage, nft_id, account);
        let total = balance.total();
        
        if config.total_shares == 0 {
            return 0;
        }
        
        ((total as u128 * 10000) / config.total_shares as u128) as u16
    }
    
    // ========== Buyout ==========
    
    /// Create a buyout offer
    pub fn create_buyout_offer(
        storage: &dyn Storage,
        nft_id: [u8; 32],
        offerer: [u8; 32],
        price_per_share: u128,
        deadline: u64,
        deposit: u128,
    ) -> Result<BuyoutOffer> {
        let config = Self::get_config(storage, &nft_id)
            .ok_or(Drc369Error::StateUpdateFailed("Not fractionalized".to_string()))?;
        
        if !config.buyout_enabled {
            return Err(Drc369Error::StateUpdateFailed("Buyout disabled".to_string()));
        }
        
        if price_per_share < config.min_buyout_price {
            return Err(Drc369Error::StateUpdateFailed("Price below minimum".to_string()));
        }
        
        let total_value = price_per_share * config.total_shares as u128;
        
        if deposit < total_value {
            return Err(Drc369Error::StateUpdateFailed("Insufficient deposit".to_string()));
        }
        
        let offer = BuyoutOffer {
            offerer,
            price_per_share,
            total_value,
            shares_collected: 0,
            deadline,
            status: BuyoutStatus::Active,
            deposited: deposit,
        };
        
        let key = Self::buyout_key(&nft_id);
        storage.put(&key, &offer.encode());
        
        Ok(offer)
    }
    
    /// Get active buyout offer
    pub fn get_buyout_offer(storage: &dyn Storage, nft_id: &[u8; 32]) -> Option<BuyoutOffer> {
        let key = Self::buyout_key(nft_id);
        storage.get(&key)
            .and_then(|bytes| BuyoutOffer::decode(&mut &bytes[..]).ok())
            .filter(|o| matches!(o.status, BuyoutStatus::Active))
    }
    
    /// Accept buyout offer (sell shares)
    pub fn accept_buyout(
        storage: &dyn Storage,
        nft_id: [u8; 32],
        seller: [u8; 32],
        shares_to_sell: u64,
    ) -> Result<u128> {
        let mut offer = Self::get_buyout_offer(storage, &nft_id)
            .ok_or(Drc369Error::StateUpdateFailed("No active buyout".to_string()))?;
        
        let config = Self::get_config(storage, &nft_id)
            .ok_or(Drc369Error::StateUpdateFailed("Not fractionalized".to_string()))?;
        
        // Transfer shares to offerer
        Self::transfer_shares(storage, nft_id, seller, offer.offerer, shares_to_sell)?;
        
        // Calculate payment
        let payment = offer.price_per_share * shares_to_sell as u128;
        offer.shares_collected += shares_to_sell;
        
        // Check if buyout complete
        if offer.shares_collected >= config.total_shares {
            offer.status = BuyoutStatus::Completed;
        }
        
        // Store updated offer
        let key = Self::buyout_key(&nft_id);
        storage.put(&key, &offer.encode());
        
        Ok(payment)
    }
    
    // ========== Reconstitution ==========
    
    /// Reconstitute NFT (merge all shares back to single owner)
    pub fn reconstitute(
        storage: &dyn Storage,
        nft_id: [u8; 32],
        new_owner: [u8; 32],
    ) -> Result<()> {
        let config = Self::get_config(storage, &nft_id)
            .ok_or(Drc369Error::StateUpdateFailed("Not fractionalized".to_string()))?;
        
        // Check new_owner has all shares
        let balance = Self::get_shares(storage, &nft_id, &new_owner);
        if balance.total() != config.total_shares {
            return Err(Drc369Error::StateUpdateFailed(
                "Must own 100% of shares to reconstitute".to_string()
            ));
        }
        
        // Remove fractionalization config
        let key = Self::config_key(&nft_id);
        storage.put(&key, &[]);
        
        // Remove share balance
        let share_key = Self::share_key(&nft_id, &new_owner);
        storage.put(&share_key, &[]);
        
        Ok(())
    }
}

// ============================================================================
// SHARE TOKEN ID
// ============================================================================

/// Generate a deterministic share token ID for a fractionalized NFT
pub fn share_token_id(nft_id: &[u8; 32]) -> [u8; 32] {
    let mut hasher = Blake2b512::new();
    hasher.update(b"DRC369_SHARE_TOKEN");
    hasher.update(nft_id);
    let hash = hasher.finalize();
    let mut id = [0u8; 32];
    id.copy_from_slice(&hash[..32]);
    id
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_share_balance() {
        let balance = ShareBalance { free: 100, locked: 50 };
        assert_eq!(balance.total(), 150);
    }
    
    #[test]
    fn test_share_token_id() {
        let nft_id = [1u8; 32];
        let share_id = share_token_id(&nft_id);
        
        // Should be deterministic
        let share_id_2 = share_token_id(&nft_id);
        assert_eq!(share_id, share_id_2);
        
        // Different NFT should have different share token
        let nft_id_2 = [2u8; 32];
        let share_id_3 = share_token_id(&nft_id_2);
        assert_ne!(share_id, share_id_3);
    }
}
