//! Activity Log module for on-chain action tracking.
//!
//! This module records user activities on the Demiurge blockchain,
//! enabling transparent action history and analytics.
//!
//! Features:
//! - Log various activity types (transfers, mints, trades, etc.)
//! - Query activity history by address
//! - Activity statistics for profiles
//! - Support for activity-based rewards/achievements

use serde::{Deserialize, Serialize};

use super::RuntimeModule;
use crate::core::state::State;
use crate::core::transaction::{Address, Transaction};

/// Activity type categories
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum ActivityType {
    /// CGT token transfer
    Transfer,
    /// NFT minted
    NftMint,
    /// NFT transferred
    NftTransfer,
    /// Marketplace listing created
    MarketplaceListing,
    /// Marketplace purchase
    MarketplacePurchase,
    /// Work claim submitted (mining)
    WorkClaim,
    /// Profile created
    ProfileCreated,
    /// Username set
    UsernameSet,
    /// Developer registered
    DeveloperRegistered,
    /// Project created
    ProjectCreated,
    /// World created (Recursion)
    WorldCreated,
    /// Chat message sent
    ChatMessage,
    /// Level up achieved
    LevelUp,
    /// Badge earned
    BadgeEarned,
    /// Custom activity type
    Custom(String),
}

impl ActivityType {
    /// Get the string representation of the activity type
    pub fn as_str(&self) -> &str {
        match self {
            ActivityType::Transfer => "transfer",
            ActivityType::NftMint => "nft_mint",
            ActivityType::NftTransfer => "nft_transfer",
            ActivityType::MarketplaceListing => "marketplace_listing",
            ActivityType::MarketplacePurchase => "marketplace_purchase",
            ActivityType::WorkClaim => "work_claim",
            ActivityType::ProfileCreated => "profile_created",
            ActivityType::UsernameSet => "username_set",
            ActivityType::DeveloperRegistered => "developer_registered",
            ActivityType::ProjectCreated => "project_created",
            ActivityType::WorldCreated => "world_created",
            ActivityType::ChatMessage => "chat_message",
            ActivityType::LevelUp => "level_up",
            ActivityType::BadgeEarned => "badge_earned",
            ActivityType::Custom(s) => s,
        }
    }

    /// Parse activity type from string
    pub fn from_str(s: &str) -> Self {
        match s {
            "transfer" => ActivityType::Transfer,
            "nft_mint" => ActivityType::NftMint,
            "nft_transfer" => ActivityType::NftTransfer,
            "marketplace_listing" => ActivityType::MarketplaceListing,
            "marketplace_purchase" => ActivityType::MarketplacePurchase,
            "work_claim" => ActivityType::WorkClaim,
            "profile_created" => ActivityType::ProfileCreated,
            "username_set" => ActivityType::UsernameSet,
            "developer_registered" => ActivityType::DeveloperRegistered,
            "project_created" => ActivityType::ProjectCreated,
            "world_created" => ActivityType::WorldCreated,
            "chat_message" => ActivityType::ChatMessage,
            "level_up" => ActivityType::LevelUp,
            "badge_earned" => ActivityType::BadgeEarned,
            other => ActivityType::Custom(other.to_string()),
        }
    }
}

/// A single activity log entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityEntry {
    /// Unique activity ID
    pub id: u64,
    /// Address of the actor
    pub address: Address,
    /// Type of activity
    pub activity_type: ActivityType,
    /// Block height when activity occurred
    pub block_height: u64,
    /// Timestamp (Unix epoch seconds)
    pub timestamp: u64,
    /// Optional target address (for transfers, etc.)
    pub target: Option<Address>,
    /// Optional amount (for transfers, rewards)
    pub amount: Option<u128>,
    /// Optional reference ID (NFT ID, listing ID, etc.)
    pub reference_id: Option<String>,
    /// Optional metadata (JSON string)
    pub metadata: Option<String>,
}

/// Activity statistics for an address
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ActivityStats {
    /// Total number of activities
    pub total_activities: u64,
    /// Number of transfers sent
    pub transfers_sent: u64,
    /// Number of transfers received
    pub transfers_received: u64,
    /// Total CGT sent
    pub total_cgt_sent: u128,
    /// Total CGT received
    pub total_cgt_received: u128,
    /// NFTs minted
    pub nfts_minted: u64,
    /// NFTs transferred
    pub nfts_transferred: u64,
    /// Work claims submitted
    pub work_claims: u64,
    /// Total work claim rewards
    pub total_work_rewards: u128,
    /// Marketplace listings created
    pub listings_created: u64,
    /// Marketplace purchases made
    pub purchases_made: u64,
}

/// Parameters for logging an activity
#[derive(Debug, Serialize, Deserialize)]
pub struct LogActivityParams {
    pub activity_type: String,
    pub target: Option<String>,
    pub amount: Option<String>,
    pub reference_id: Option<String>,
    pub metadata: Option<String>,
}

/// Parameters for querying activities
#[derive(Debug, Serialize, Deserialize)]
pub struct QueryActivitiesParams {
    pub address: String,
    pub activity_type: Option<String>,
    pub limit: Option<u64>,
    pub offset: Option<u64>,
}

// Storage key prefixes
const PREFIX_ACTIVITY: &[u8] = b"activity/entry:";
const PREFIX_ACTIVITY_BY_ADDRESS: &[u8] = b"activity/by_addr:";
const PREFIX_ACTIVITY_STATS: &[u8] = b"activity/stats:";
const KEY_ACTIVITY_COUNTER: &[u8] = b"activity/counter";

/// Get the next activity ID and increment the counter
fn next_activity_id(state: &mut State) -> u64 {
    let current = state
        .get_raw(KEY_ACTIVITY_COUNTER)
        .and_then(|v| bincode::deserialize::<u64>(&v).ok())
        .unwrap_or(0);
    
    let next = current + 1;
    if let Ok(data) = bincode::serialize(&next) {
        let _ = state.put_raw(KEY_ACTIVITY_COUNTER.to_vec(), data);
    }
    next
}

/// Log an activity entry
pub fn log_activity(
    state: &mut State,
    address: &Address,
    activity_type: ActivityType,
    block_height: u64,
    timestamp: u64,
    target: Option<Address>,
    amount: Option<u128>,
    reference_id: Option<String>,
    metadata: Option<String>,
) -> Result<u64, String> {
    let id = next_activity_id(state);
    
    let entry = ActivityEntry {
        id,
        address: *address,
        activity_type: activity_type.clone(),
        block_height,
        timestamp,
        target,
        amount,
        reference_id,
        metadata,
    };
    
    // Store the activity entry
    let entry_key = [PREFIX_ACTIVITY, &id.to_be_bytes()].concat();
    let entry_data = bincode::serialize(&entry)
        .map_err(|e| format!("Failed to serialize activity: {}", e))?;
    state.put_raw(entry_key, entry_data)
        .map_err(|e| format!("Failed to store activity: {}", e))?;
    
    // Add to address index (store activity IDs for each address)
    let addr_key = [PREFIX_ACTIVITY_BY_ADDRESS, address.as_slice()].concat();
    let mut addr_activities: Vec<u64> = state
        .get_raw(&addr_key)
        .and_then(|v| bincode::deserialize(&v).ok())
        .unwrap_or_default();
    addr_activities.push(id);
    let addr_data = bincode::serialize(&addr_activities)
        .map_err(|e| format!("Failed to serialize address index: {}", e))?;
    state.put_raw(addr_key, addr_data)
        .map_err(|e| format!("Failed to store address index: {}", e))?;
    
    // Update stats
    update_activity_stats(state, address, &activity_type, amount, false)?;
    
    // If there's a target, also update their stats
    if let Some(target_addr) = target {
        update_activity_stats(state, &target_addr, &activity_type, amount, true)?;
    }
    
    Ok(id)
}

/// Update activity statistics for an address
fn update_activity_stats(
    state: &mut State,
    address: &Address,
    activity_type: &ActivityType,
    amount: Option<u128>,
    is_target: bool,
) -> Result<(), String> {
    let stats_key = [PREFIX_ACTIVITY_STATS, address.as_slice()].concat();
    let mut stats: ActivityStats = state
        .get_raw(&stats_key)
        .and_then(|v| bincode::deserialize(&v).ok())
        .unwrap_or_default();
    
    stats.total_activities += 1;
    
    match activity_type {
        ActivityType::Transfer => {
            if is_target {
                stats.transfers_received += 1;
                if let Some(amt) = amount {
                    stats.total_cgt_received += amt;
                }
            } else {
                stats.transfers_sent += 1;
                if let Some(amt) = amount {
                    stats.total_cgt_sent += amt;
                }
            }
        }
        ActivityType::NftMint => {
            if !is_target {
                stats.nfts_minted += 1;
            }
        }
        ActivityType::NftTransfer => {
            if !is_target {
                stats.nfts_transferred += 1;
            }
        }
        ActivityType::WorkClaim => {
            if !is_target {
                stats.work_claims += 1;
                if let Some(amt) = amount {
                    stats.total_work_rewards += amt;
                }
            }
        }
        ActivityType::MarketplaceListing => {
            if !is_target {
                stats.listings_created += 1;
            }
        }
        ActivityType::MarketplacePurchase => {
            if !is_target {
                stats.purchases_made += 1;
            }
        }
        _ => {}
    }
    
    let stats_data = bincode::serialize(&stats)
        .map_err(|e| format!("Failed to serialize stats: {}", e))?;
    state.put_raw(stats_key, stats_data)
        .map_err(|e| format!("Failed to store stats: {}", e))?;
    
    Ok(())
}

/// Get activity statistics for an address
pub fn get_activity_stats(state: &State, address: &Address) -> ActivityStats {
    let stats_key = [PREFIX_ACTIVITY_STATS, address.as_slice()].concat();
    state
        .get_raw(&stats_key)
        .and_then(|v| bincode::deserialize(&v).ok())
        .unwrap_or_default()
}

/// Get a single activity entry by ID
pub fn get_activity(state: &State, id: u64) -> Option<ActivityEntry> {
    let entry_key = [PREFIX_ACTIVITY, &id.to_be_bytes()].concat();
    state
        .get_raw(&entry_key)
        .and_then(|v| bincode::deserialize(&v).ok())
}

/// Get activities for an address with optional filtering
pub fn get_activities_for_address(
    state: &State,
    address: &Address,
    activity_type: Option<ActivityType>,
    limit: u64,
    offset: u64,
) -> Vec<ActivityEntry> {
    let addr_key = [PREFIX_ACTIVITY_BY_ADDRESS, address.as_slice()].concat();
    let activity_ids: Vec<u64> = state
        .get_raw(&addr_key)
        .and_then(|v| bincode::deserialize(&v).ok())
        .unwrap_or_default();
    
    // Reverse to get newest first
    let mut ids: Vec<u64> = activity_ids.into_iter().rev().collect();
    
    // Apply offset and limit
    if offset > 0 {
        ids = ids.into_iter().skip(offset as usize).collect();
    }
    
    ids.truncate(limit as usize);
    
    // Fetch entries
    let mut entries: Vec<ActivityEntry> = ids
        .into_iter()
        .filter_map(|id| get_activity(state, id))
        .collect();
    
    // Filter by activity type if specified
    if let Some(filter_type) = activity_type {
        entries.retain(|e| e.activity_type == filter_type);
    }
    
    entries
}

/// Get recent global activities
pub fn get_recent_activities(state: &State, limit: u64) -> Vec<ActivityEntry> {
    let current = state
        .get_raw(KEY_ACTIVITY_COUNTER)
        .and_then(|v| bincode::deserialize::<u64>(&v).ok())
        .unwrap_or(0);
    
    let mut entries = Vec::new();
    let start = if current > limit { current - limit } else { 0 };
    
    for id in (start..=current).rev() {
        if let Some(entry) = get_activity(state, id) {
            entries.push(entry);
            if entries.len() >= limit as usize {
                break;
            }
        }
    }
    
    entries
}

/// Parse hex address from string
fn parse_address(s: &str) -> Result<Address, String> {
    let hex = s.strip_prefix("0x").unwrap_or(s);
    if hex.len() != 64 {
        return Err(format!("Invalid address length: expected 64 hex chars, got {}", hex.len()));
    }
    let bytes = hex::decode(hex).map_err(|e| format!("Invalid hex: {}", e))?;
    let mut addr = [0u8; 32];
    addr.copy_from_slice(&bytes);
    Ok(addr)
}

/// Activity Log runtime module
pub struct ActivityLogModule;

impl ActivityLogModule {
    pub fn new() -> Self {
        Self
    }
}

impl Default for ActivityLogModule {
    fn default() -> Self {
        Self::new()
    }
}

impl RuntimeModule for ActivityLogModule {
    fn module_id(&self) -> &'static str {
        "activity_log"
    }

    fn dispatch(&self, call_id: &str, tx: &Transaction, state: &mut State) -> Result<(), String> {
        match call_id {
            "log" => {
                let params: LogActivityParams = serde_json::from_slice(&tx.payload)
                    .map_err(|e| format!("Invalid log params: {}", e))?;
                
                let activity_type = ActivityType::from_str(&params.activity_type);
                let target = params.target
                    .map(|s| parse_address(&s))
                    .transpose()?;
                let amount = params.amount
                    .map(|s| s.parse::<u128>())
                    .transpose()
                    .map_err(|e| format!("Invalid amount: {}", e))?;
                
                // Use current block height (simplified - in production, get from block context)
                let block_height = 0;
                let timestamp = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .map(|d| d.as_secs())
                    .unwrap_or(0);
                
                log_activity(
                    state,
                    &tx.from,
                    activity_type,
                    block_height,
                    timestamp,
                    target,
                    amount,
                    params.reference_id,
                    params.metadata,
                )?;
                
                Ok(())
            }
            
            _ => Err(format!("Unknown call_id for activity_log: {}", call_id)),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_activity_type_roundtrip() {
        let types = vec![
            ActivityType::Transfer,
            ActivityType::NftMint,
            ActivityType::Custom("test_custom".to_string()),
        ];
        
        for t in types {
            let s = t.as_str();
            let parsed = ActivityType::from_str(s);
            assert_eq!(parsed, t);
        }
    }

    #[test]
    fn test_log_and_get_activity() {
        let mut state = State::in_memory();
        let address: Address = [1u8; 32];
        
        let id = log_activity(
            &mut state,
            &address,
            ActivityType::Transfer,
            100,
            1704067200,
            Some([2u8; 32]),
            Some(1000),
            Some("ref123".to_string()),
            None,
        ).unwrap();
        
        let entry = get_activity(&state, id).unwrap();
        assert_eq!(entry.address, address);
        assert_eq!(entry.activity_type, ActivityType::Transfer);
        assert_eq!(entry.amount, Some(1000));
    }

    #[test]
    fn test_activity_stats() {
        let mut state = State::in_memory();
        let address: Address = [1u8; 32];
        let target: Address = [2u8; 32];
        
        // Log a transfer
        log_activity(
            &mut state,
            &address,
            ActivityType::Transfer,
            100,
            1704067200,
            Some(target),
            Some(5000),
            None,
            None,
        ).unwrap();
        
        // Check sender stats
        let sender_stats = get_activity_stats(&state, &address);
        assert_eq!(sender_stats.transfers_sent, 1);
        assert_eq!(sender_stats.total_cgt_sent, 5000);
        
        // Check receiver stats
        let receiver_stats = get_activity_stats(&state, &target);
        assert_eq!(receiver_stats.transfers_received, 1);
        assert_eq!(receiver_stats.total_cgt_received, 5000);
    }

    #[test]
    fn test_get_activities_for_address() {
        let mut state = State::in_memory();
        let address: Address = [1u8; 32];
        
        // Log multiple activities
        for i in 0..5 {
            log_activity(
                &mut state,
                &address,
                ActivityType::Transfer,
                i as u64,
                1704067200 + i,
                None,
                Some(100 * (i + 1) as u128),
                None,
                None,
            ).unwrap();
        }
        
        // Get all activities
        let activities = get_activities_for_address(&state, &address, None, 10, 0);
        assert_eq!(activities.len(), 5);
        
        // Activities should be newest first
        assert_eq!(activities[0].block_height, 4);
        assert_eq!(activities[4].block_height, 0);
        
        // Test with limit
        let limited = get_activities_for_address(&state, &address, None, 2, 0);
        assert_eq!(limited.len(), 2);
        
        // Test with offset
        let offset = get_activities_for_address(&state, &address, None, 10, 2);
        assert_eq!(offset.len(), 3);
    }
}
