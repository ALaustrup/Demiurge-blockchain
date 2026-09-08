//! Recursive Royalty Protocol
//!
//! Ensures creators receive perpetual royalties across:
//! - Primary sales
//! - Secondary market trades
//! - In-game usage (streaming, renders, interactions)
//! - Cross-chain settlements
//! - Derivative works and forks
//!
//! # Key Features
//!
//! - **Recursive**: Royalties flow to original creators even through derivatives
//! - **Automatic**: Integrated into transfer logic, no opt-out
//! - **Transparent**: All royalty data on-chain and queryable
//! - **Flexible**: Support for splits, tiers, and time-decay

use codec::{Decode, Encode};
use scale_info::TypeInfo;
use serde::{Deserialize, Serialize};
use demiurge_storage::Storage;

use crate::error::{Drc369Error, Result};

/// Token ID type (32-byte hash)
pub type TokenId = [u8; 32];

/// Storage key prefixes
mod storage_keys {
    pub const ROYALTY_CONFIG: &[u8] = b"DRC369:Royalty:Config:";
    pub const ROYALTY_EARNED: &[u8] = b"DRC369:Royalty:Earned:";
    pub const USAGE_TRACKER: &[u8] = b"DRC369:Royalty:Usage:";
}

/// Basis points (1/100th of a percent, so 10000 = 100%)
pub type BasisPoints = u16;

/// Maximum total royalty (25%)
pub const MAX_TOTAL_ROYALTY_BPS: BasisPoints = 2500;

/// Royalty recipient with share
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct RoyaltyRecipient {
    /// Recipient address (32-byte account)
    pub address: [u8; 32],
    /// Share in basis points (100 = 1%)
    pub share_bps: BasisPoints,
    /// Role (creator, collaborator, platform, etc.)
    pub role: RoyaltyRole,
}

/// Role in the royalty split
#[derive(Clone, Debug, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub enum RoyaltyRole {
    /// Original creator
    Creator,
    /// Co-creator or collaborator
    Collaborator,
    /// Platform fee
    Platform,
    /// Curator or promoter
    Curator,
    /// Parent asset creator (for derivatives)
    ParentCreator,
    /// Custom role
    Custom(Vec<u8>),
}

/// Royalty configuration for an asset
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct RoyaltyConfig {
    /// Token ID this config applies to
    pub token_id: TokenId,
    /// Primary sale royalty (first sale from creator)
    pub primary_sale_bps: BasisPoints,
    /// Secondary sale royalty (resales)
    pub secondary_sale_bps: BasisPoints,
    /// Usage royalty per interaction (for streaming/gaming)
    pub usage_royalty_bps: BasisPoints,
    /// Recipients and their shares (must sum to 10000)
    pub recipients: Vec<RoyaltyRecipient>,
    /// Parent token (if this is a derivative)
    pub parent_token: Option<TokenId>,
    /// Share of royalties passed to parent (for derivatives)
    pub parent_share_bps: BasisPoints,
    /// Minimum royalty floor (cannot be reduced below this)
    pub minimum_bps: BasisPoints,
    /// Whether royalties can be modified
    pub immutable: bool,
    /// Creation timestamp
    pub created_at: u64,
}

impl RoyaltyConfig {
    /// Create a simple royalty config for a single creator
    pub fn simple(token_id: TokenId, creator: [u8; 32], royalty_bps: BasisPoints) -> Result<Self> {
        if royalty_bps > MAX_TOTAL_ROYALTY_BPS {
            return Err(Drc369Error::InvalidRoyalty(format!(
                "Royalty {}bps exceeds max {}bps",
                royalty_bps, MAX_TOTAL_ROYALTY_BPS
            )));
        }
        
        Ok(Self {
            token_id,
            primary_sale_bps: 0, // Creator gets 100% of primary
            secondary_sale_bps: royalty_bps,
            usage_royalty_bps: royalty_bps / 10, // 10% of trade royalty for usage
            recipients: vec![RoyaltyRecipient {
                address: creator,
                share_bps: 10000, // 100%
                role: RoyaltyRole::Creator,
            }],
            parent_token: None,
            parent_share_bps: 0,
            minimum_bps: royalty_bps / 2, // Floor at 50% of original
            immutable: false,
            created_at: 0,
        })
    }
    
    /// Create royalty config for a derivative work
    pub fn derivative(
        token_id: TokenId,
        creator: [u8; 32],
        parent_token: TokenId,
        royalty_bps: BasisPoints,
        parent_share_bps: BasisPoints,
    ) -> Result<Self> {
        if royalty_bps > MAX_TOTAL_ROYALTY_BPS {
            return Err(Drc369Error::InvalidRoyalty("Exceeds max royalty".into()));
        }
        if parent_share_bps > 5000 {
            return Err(Drc369Error::InvalidRoyalty("Parent share cannot exceed 50%".into()));
        }
        
        Ok(Self {
            token_id,
            primary_sale_bps: 0,
            secondary_sale_bps: royalty_bps,
            usage_royalty_bps: royalty_bps / 10,
            recipients: vec![RoyaltyRecipient {
                address: creator,
                share_bps: 10000,
                role: RoyaltyRole::Creator,
            }],
            parent_token: Some(parent_token),
            parent_share_bps,
            minimum_bps: royalty_bps / 2,
            immutable: false,
            created_at: 0,
        })
    }
    
    /// Validate the config
    pub fn validate(&self) -> Result<()> {
        // Check total share
        let total: u32 = self.recipients.iter().map(|r| r.share_bps as u32).sum();
        if total != 10000 {
            return Err(Drc369Error::InvalidRoyalty(format!(
                "Recipient shares must sum to 10000, got {}",
                total
            )));
        }
        
        // Check max royalty
        if self.secondary_sale_bps > MAX_TOTAL_ROYALTY_BPS {
            return Err(Drc369Error::InvalidRoyalty("Exceeds max royalty".into()));
        }
        
        // Check minimum is reasonable
        if self.minimum_bps > self.secondary_sale_bps {
            return Err(Drc369Error::InvalidRoyalty("Minimum exceeds current royalty".into()));
        }
        
        Ok(())
    }
    
    /// Calculate royalty amount for a sale
    pub fn calculate_royalty(&self, sale_price: u128, is_primary: bool) -> u128 {
        let bps = if is_primary {
            self.primary_sale_bps
        } else {
            self.secondary_sale_bps
        };
        
        (sale_price * bps as u128) / 10000
    }
    
    /// Calculate per-recipient amounts
    pub fn calculate_splits(&self, total_royalty: u128) -> Vec<([u8; 32], u128)> {
        let mut splits = Vec::new();
        let mut remaining = total_royalty;
        
        // If derivative, parent gets their share first
        if self.parent_token.is_some() && self.parent_share_bps > 0 {
            let parent_amount = (total_royalty * self.parent_share_bps as u128) / 10000;
            remaining -= parent_amount;
            // Parent address will be resolved from parent config
        }
        
        // Distribute remaining among recipients
        for (i, recipient) in self.recipients.iter().enumerate() {
            let amount = if i == self.recipients.len() - 1 {
                // Last recipient gets remainder to avoid rounding issues
                remaining
            } else {
                (remaining * recipient.share_bps as u128) / 10000
            };
            
            if amount > 0 {
                splits.push((recipient.address, amount));
                remaining -= amount;
            }
        }
        
        splits
    }
}

/// Usage tracking for in-game royalties
#[derive(Clone, Debug, Default, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct UsageTracker {
    /// Token ID
    pub token_id: TokenId,
    /// Total times rendered/displayed
    pub render_count: u64,
    /// Total times interacted with
    pub interaction_count: u64,
    /// Total streaming minutes (for audio/video)
    pub stream_minutes: u64,
    /// Games that have used this asset
    pub game_ids: Vec<[u8; 32]>,
    /// Last usage timestamp
    pub last_used: u64,
    /// Accumulated unpaid royalties (in smallest unit)
    pub pending_royalty: u128,
}

impl UsageTracker {
    /// Record a render event
    pub fn record_render(&mut self, timestamp: u64) {
        self.render_count += 1;
        self.last_used = timestamp;
    }
    
    /// Record an interaction
    pub fn record_interaction(&mut self, timestamp: u64) {
        self.interaction_count += 1;
        self.last_used = timestamp;
    }
    
    /// Record streaming usage
    pub fn record_stream(&mut self, minutes: u64, timestamp: u64) {
        self.stream_minutes += minutes;
        self.last_used = timestamp;
    }
    
    /// Register a game using this asset
    pub fn register_game(&mut self, game_id: [u8; 32]) {
        if !self.game_ids.contains(&game_id) {
            self.game_ids.push(game_id);
        }
    }
}

/// Royalty distribution event
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct RoyaltyDistribution {
    /// Token that generated the royalty
    pub token_id: TokenId,
    /// Total royalty amount
    pub total_amount: u128,
    /// Individual distributions
    pub distributions: Vec<([u8; 32], u128)>,
    /// Type of royalty
    pub royalty_type: RoyaltyType,
    /// Block number
    pub block_number: u64,
    /// Transaction hash (if applicable)
    pub tx_hash: Option<[u8; 32]>,
}

/// Type of royalty event
#[derive(Clone, Debug, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub enum RoyaltyType {
    /// Primary sale (first sale)
    PrimarySale,
    /// Secondary sale (resale)
    SecondarySale,
    /// Usage-based (gaming, streaming)
    Usage,
    /// Cross-chain settlement
    CrossChain,
}

/// Royalty Registry - manages all royalty configs
pub struct RoyaltyRegistry;

impl RoyaltyRegistry {
    /// Register royalty config for a token
    pub fn register(
        storage: &mut dyn Storage,
        config: RoyaltyConfig,
        current_block: u64,
    ) -> Result<()> {
        config.validate()?;
        
        // Check if already exists and immutable
        if let Some(existing) = Self::get_config(storage, &config.token_id) {
            if existing.immutable {
                return Err(Drc369Error::InvalidRoyalty("Config is immutable".into()));
            }
        }
        
        let mut config = config;
        config.created_at = current_block;
        
        let key = Self::config_key(&config.token_id);
        storage.put(&key, &config.encode());
        
        Ok(())
    }
    
    /// Get royalty config for a token
    pub fn get_config(storage: &dyn Storage, token_id: &TokenId) -> Option<RoyaltyConfig> {
        let key = Self::config_key(token_id);
        storage.get(&key).and_then(|v| RoyaltyConfig::decode(&mut &v[..]).ok())
    }
    
    /// Calculate and distribute royalties for a sale
    pub fn distribute_sale_royalty(
        storage: &mut dyn Storage,
        token_id: &TokenId,
        sale_price: u128,
        is_primary: bool,
        block_number: u64,
    ) -> Result<RoyaltyDistribution> {
        let config = Self::get_config(storage, token_id)
            .ok_or_else(|| Drc369Error::InvalidRoyalty("No royalty config".into()))?;
        
        let total_royalty = config.calculate_royalty(sale_price, is_primary);
        let mut distributions = config.calculate_splits(total_royalty);
        
        // Handle recursive parent royalties
        if let Some(parent_id) = &config.parent_token {
            if config.parent_share_bps > 0 {
                let parent_amount = (total_royalty * config.parent_share_bps as u128) / 10000;
                if let Some(parent_config) = Self::get_config(storage, parent_id) {
                    // Add parent creator to distributions
                    for recipient in &parent_config.recipients {
                        if recipient.role == RoyaltyRole::Creator {
                            let amount = (parent_amount * recipient.share_bps as u128) / 10000;
                            distributions.push((recipient.address, amount));
                        }
                    }
                }
            }
        }
        
        // Record earned royalties
        for (address, amount) in &distributions {
            Self::add_earned(storage, address, *amount);
        }
        
        let distribution = RoyaltyDistribution {
            token_id: *token_id,
            total_amount: total_royalty,
            distributions,
            royalty_type: if is_primary {
                RoyaltyType::PrimarySale
            } else {
                RoyaltyType::SecondarySale
            },
            block_number,
            tx_hash: None,
        };
        
        Ok(distribution)
    }
    
    /// Record usage and accumulate royalties
    pub fn record_usage(
        storage: &mut dyn Storage,
        token_id: &TokenId,
        game_id: Option<[u8; 32]>,
        render: bool,
        interact: bool,
        stream_minutes: u64,
        timestamp: u64,
    ) -> Result<()> {
        let mut tracker = Self::get_usage(storage, token_id).unwrap_or(UsageTracker {
            token_id: *token_id,
            ..Default::default()
        });
        
        if render {
            tracker.record_render(timestamp);
        }
        if interact {
            tracker.record_interaction(timestamp);
        }
        if stream_minutes > 0 {
            tracker.record_stream(stream_minutes, timestamp);
        }
        if let Some(gid) = game_id {
            tracker.register_game(gid);
        }
        
        // Calculate pending royalty based on config
        if let Some(config) = Self::get_config(storage, token_id) {
            // Simple model: 1 unit per 1000 renders/interactions
            let usage_units = (tracker.render_count + tracker.interaction_count * 10) / 1000;
            tracker.pending_royalty = usage_units as u128 * config.usage_royalty_bps as u128;
        }
        
        let key = Self::usage_key(token_id);
        storage.put(&key, &tracker.encode());
        
        Ok(())
    }
    
    /// Get usage tracker
    pub fn get_usage(storage: &dyn Storage, token_id: &TokenId) -> Option<UsageTracker> {
        let key = Self::usage_key(token_id);
        storage.get(&key).and_then(|v| UsageTracker::decode(&mut &v[..]).ok())
    }
    
    /// Get total earned royalties for an address
    pub fn get_earned(storage: &dyn Storage, address: &[u8; 32]) -> u128 {
        let key = Self::earned_key(address);
        storage.get(&key)
            .and_then(|v| u128::decode(&mut &v[..]).ok())
            .unwrap_or(0)
    }
    
    /// Add to earned royalties
    fn add_earned(storage: &mut dyn Storage, address: &[u8; 32], amount: u128) {
        let current = Self::get_earned(storage, address);
        let key = Self::earned_key(address);
        storage.put(&key, &(current + amount).encode());
    }
    
    /// Get creator dashboard data
    pub fn get_creator_stats(
        storage: &dyn Storage,
        creator: &[u8; 32],
    ) -> CreatorStats {
        let earned = Self::get_earned(storage, creator);
        
        // Count tokens with this creator
        let mut token_count = 0u64;
        let mut total_usage = 0u64;
        
        for (key, value) in storage.prefix_iter(storage_keys::ROYALTY_CONFIG) {
            if let Ok(config) = RoyaltyConfig::decode(&mut &value[..]) {
                if config.recipients.iter().any(|r| &r.address == creator) {
                    token_count += 1;
                    
                    if let Some(usage) = Self::get_usage(storage, &config.token_id) {
                        total_usage += usage.render_count + usage.interaction_count;
                    }
                }
            }
            let _ = key; // suppress warning
        }
        
        CreatorStats {
            address: *creator,
            total_earned: earned,
            token_count,
            total_usage,
        }
    }
    
    // Storage key helpers
    fn config_key(token_id: &TokenId) -> Vec<u8> {
        let mut key = storage_keys::ROYALTY_CONFIG.to_vec();
        key.extend(&token_id.encode());
        key
    }
    
    fn usage_key(token_id: &TokenId) -> Vec<u8> {
        let mut key = storage_keys::USAGE_TRACKER.to_vec();
        key.extend(&token_id.encode());
        key
    }
    
    fn earned_key(address: &[u8; 32]) -> Vec<u8> {
        let mut key = storage_keys::ROYALTY_EARNED.to_vec();
        key.extend(address);
        key
    }
}

/// Creator statistics for dashboard
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct CreatorStats {
    /// Creator address
    pub address: [u8; 32],
    /// Total CGT earned from royalties
    pub total_earned: u128,
    /// Number of tokens with royalty config
    pub token_count: u64,
    /// Total usage across all tokens
    pub total_usage: u64,
}

#[cfg(test)]
mod tests {
    use super::*;
    use demiurge_storage::MemoryStorage;
    
    fn test_token_id() -> TokenId {
        [1u8; 32]
    }
    
    #[test]
    fn test_simple_royalty_config() {
        let creator = [1u8; 32];
        let config = RoyaltyConfig::simple(test_token_id(), creator, 500).unwrap();
        
        assert_eq!(config.secondary_sale_bps, 500); // 5%
        assert!(config.validate().is_ok());
    }
    
    #[test]
    fn test_royalty_calculation() {
        let creator = [1u8; 32];
        let config = RoyaltyConfig::simple(test_token_id(), creator, 500).unwrap();
        
        let sale_price = 1_000_000u128; // 1M units
        let royalty = config.calculate_royalty(sale_price, false);
        
        assert_eq!(royalty, 50_000); // 5% of 1M
    }
    
    #[test]
    fn test_royalty_splits() {
        let creator = [1u8; 32];
        let config = RoyaltyConfig::simple(test_token_id(), creator, 500).unwrap();
        
        let royalty = 50_000u128;
        let splits = config.calculate_splits(royalty);
        
        assert_eq!(splits.len(), 1);
        assert_eq!(splits[0], (creator, 50_000));
    }
    
    #[test]
    fn test_royalty_registry() {
        let mut storage = MemoryStorage::new();
        let creator = [1u8; 32];
        let token_id = test_token_id();
        
        let config = RoyaltyConfig::simple(token_id, creator, 500).unwrap();
        RoyaltyRegistry::register(&mut storage, config, 1).unwrap();
        
        let loaded = RoyaltyRegistry::get_config(&storage, &token_id).unwrap();
        assert_eq!(loaded.secondary_sale_bps, 500);
    }
    
    #[test]
    fn test_sale_distribution() {
        let mut storage = MemoryStorage::new();
        let creator = [1u8; 32];
        let token_id = test_token_id();
        
        let config = RoyaltyConfig::simple(token_id, creator, 500).unwrap();
        RoyaltyRegistry::register(&mut storage, config, 1).unwrap();
        
        let distribution = RoyaltyRegistry::distribute_sale_royalty(
            &mut storage,
            &token_id,
            1_000_000,
            false,
            2,
        ).unwrap();
        
        assert_eq!(distribution.total_amount, 50_000);
        assert_eq!(distribution.distributions[0], (creator, 50_000));
        
        // Check earned was recorded
        let earned = RoyaltyRegistry::get_earned(&storage, &creator);
        assert_eq!(earned, 50_000);
    }
    
    #[test]
    fn test_usage_tracking() {
        let mut storage = MemoryStorage::new();
        let token_id = test_token_id();
        let game_id = [2u8; 32];
        
        RoyaltyRegistry::record_usage(
            &mut storage,
            &token_id,
            Some(game_id),
            true,  // render
            true,  // interact
            0,     // stream
            100,   // timestamp
        ).unwrap();
        
        let tracker = RoyaltyRegistry::get_usage(&storage, &token_id).unwrap();
        assert_eq!(tracker.render_count, 1);
        assert_eq!(tracker.interaction_count, 1);
        assert_eq!(tracker.game_ids.len(), 1);
    }
    
    #[test]
    fn test_max_royalty_validation() {
        let creator = [1u8; 32];
        let result = RoyaltyConfig::simple(test_token_id(), creator, 3000); // 30%
        
        assert!(result.is_err());
    }
}
