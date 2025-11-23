//! UrgeID Registry module for user profiles and Syzygy tracking.
//!
//! This module handles:
//! - UrgeID profiles (display name, bio, Syzygy Score)
//! - Badge management (e.g., Luminary)
//! - Legacy Archon flag support (for backward compatibility with nft_dgen)

use serde::{Deserialize, Serialize};

use super::RuntimeModule;
use crate::core::state::State;
use crate::core::transaction::{Address, Transaction};

const PREFIX_ARCHON_FLAG: &[u8] = b"avatars:archon:";
const PREFIX_URGEID_PROFILE: &[u8] = b"urgeid/profile:";
const PREFIX_URGEID_HANDLE: &[u8] = b"urgeid/handle/";
const PREFIX_USERNAME: &[u8] = b"username/";

// Badge threshold
const LUMINARY_SYZYGY_THRESHOLD: u64 = 10_000;

/// UrgeID profile with Syzygy tracking.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UrgeIDProfile {
    pub address: Address,
    pub display_name: String,
    pub bio: Option<String>,
    /// Optional unique handle (e.g., "username" without @) - legacy, use username instead
    pub handle: Option<String>,
    /// Globally unique username (normalized, lowercased)
    pub username: Option<String>,
    /// Current level (starts at 1)
    pub level: u32,
    pub syzygy_score: u64,
    /// Total CGT earned from level-up rewards
    pub total_cgt_earned_from_rewards: u128,
    pub badges: Vec<String>,
    pub created_at_height: u64,
}

/// Legacy Archon flag management (kept for backward compatibility)

fn archon_flag_key(address: &Address) -> Vec<u8> {
    let mut key = Vec::with_capacity(PREFIX_ARCHON_FLAG.len() + address.len());
    key.extend_from_slice(PREFIX_ARCHON_FLAG);
    key.extend_from_slice(address);
    key
}

/// Check if an address has Archon status.
///
/// This is kept for backward compatibility with nft_dgen module.
pub fn is_archon(state: &State, addr: &Address) -> bool {
    state
        .get_raw(&archon_flag_key(addr))
        .map(|bytes| bytes == [1u8])
        .unwrap_or(false)
}

fn set_archon_flag(state: &mut State, addr: &Address, value: bool) -> Result<(), String> {
    let bytes = if value { vec![1u8] } else { vec![0u8] };
    state
        .put_raw(archon_flag_key(addr), bytes)
        .map_err(|e| e.to_string())
}

/// UrgeID profile management

fn urgeid_profile_key(address: &Address) -> Vec<u8> {
    let mut key = Vec::with_capacity(PREFIX_URGEID_PROFILE.len() + address.len());
    key.extend_from_slice(PREFIX_URGEID_PROFILE);
    key.extend_from_slice(address);
    key
}

fn load_urgeid_profile(state: &State, address: &Address) -> Option<UrgeIDProfile> {
    state
        .get_raw(&urgeid_profile_key(address))
        .and_then(|bytes| bincode::deserialize::<UrgeIDProfile>(&bytes).ok())
}

fn store_urgeid_profile(state: &mut State, profile: &UrgeIDProfile) -> Result<(), String> {
    let bytes = bincode::serialize(profile).map_err(|e| e.to_string())?;
    state
        .put_raw(urgeid_profile_key(&profile.address), bytes)
        .map_err(|e| e.to_string())
}

/// Handle mapping management

fn handle_key(handle: &str) -> Vec<u8> {
    let mut key = Vec::with_capacity(PREFIX_URGEID_HANDLE.len() + handle.len());
    key.extend_from_slice(PREFIX_URGEID_HANDLE);
    key.extend_from_slice(handle.as_bytes());
    key
}

/// Get address by handle.
pub fn get_address_by_handle(state: &State, handle: &str) -> Option<Address> {
    state
        .get_raw(&handle_key(handle))
        .and_then(|bytes| {
            if bytes.len() == 32 {
                let mut addr = [0u8; 32];
                addr.copy_from_slice(&bytes);
                Some(addr)
            } else {
                None
            }
        })
}

/// Set handle mapping (handle -> address).
fn set_handle_mapping(state: &mut State, handle: &str, address: Address) -> Result<(), String> {
    state
        .put_raw(handle_key(handle), address.to_vec())
        .map_err(|e| e.to_string())
}

/// Remove handle mapping.
fn remove_handle_mapping(_state: &mut State, _handle: &str) -> Result<(), String> {
    // For now, we'll just overwrite with empty or leave it
    // In a real implementation, you might want to track deletions
    // For simplicity, we'll just remove the key by setting it to empty
    // RocksDB doesn't have explicit delete in our abstraction, so we'll leave it
    // The lookup will fail if the mapping doesn't exist
    Ok(())
}

/// Username management

/// Normalize username: lowercase, trim, validate format.
pub fn normalize_username(raw: &str) -> Result<String, String> {
    let normalized = raw.trim().to_lowercase();
    
    // Length check: 3-32 characters
    if normalized.len() < 3 || normalized.len() > 32 {
        return Err("Username must be 3-32 characters".into());
    }
    
    // Only allow [a-z0-9_.]
    if !normalized.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '_' || c == '.') {
        return Err("Username can only contain lowercase letters, numbers, underscores, and dots".into());
    }
    
    // No leading/trailing dots
    if normalized.starts_with('.') || normalized.ends_with('.') {
        return Err("Username cannot start or end with a dot".into());
    }
    
    // No consecutive dots
    if normalized.contains("..") {
        return Err("Username cannot contain consecutive dots".into());
    }
    
    Ok(normalized)
}

fn username_key(name: &str) -> Vec<u8> {
    let mut key = Vec::with_capacity(PREFIX_USERNAME.len() + name.len());
    key.extend_from_slice(PREFIX_USERNAME);
    key.extend_from_slice(name.as_bytes());
    key
}

/// Get address by username.
pub fn get_address_by_username(state: &State, username: &str) -> Result<Option<Address>, String> {
    let normalized = normalize_username(username)?;
    state
        .get_raw(&username_key(&normalized))
        .and_then(|bytes| {
            if bytes.len() == 32 {
                let mut addr = [0u8; 32];
                addr.copy_from_slice(&bytes);
                Some(addr)
            } else {
                None
            }
        })
        .ok_or_else(|| "Username not found".to_string())
        .map(Some)
        .or_else(|_| Ok(None))
}

/// Set username mapping (username -> address).
fn set_username_mapping(state: &mut State, username: &str, addr: &Address) -> Result<(), String> {
    let normalized = normalize_username(username)?;
    state
        .put_raw(username_key(&normalized), addr.to_vec())
        .map_err(|e| e.to_string())
}

/// Clear username mapping.
fn clear_username_mapping(_state: &mut State, _username: &str) -> Result<(), String> {
    // For simplicity, we'll just leave the key (lookup will fail if mapping doesn't exist)
    // In production, you might want to track deletions explicitly
    Ok(())
}

/// Set username for an UrgeID.
pub fn set_username(
    state: &mut State,
    caller: &Address,
    raw_username: &str,
) -> Result<(), String> {
    // Normalize and validate
    let normalized = normalize_username(raw_username)?;
    
    // Check if already taken
    if let Some(existing_addr) = get_address_by_username(state, &normalized)? {
        if existing_addr != *caller {
            return Err("Username already taken".into());
        }
        // Same address, updating is fine (no-op)
    }
    
    // Load profile for caller
    let mut profile = load_urgeid_profile(state, caller)
        .ok_or_else(|| "UrgeID profile not found".to_string())?;
    
    // If profile.username == Some(normalized.clone()), do nothing
    if profile.username.as_ref() == Some(&normalized) {
        return Ok(());
    }
    
    // If profile has a different username, remove old mapping
    if let Some(old) = &profile.username {
        if old != &normalized {
            clear_username_mapping(state, old)?;
        }
    }
    
    // Update profile
    profile.username = Some(normalized.clone());
    
    // Write both: updated profile and username mapping
    store_urgeid_profile(state, &profile)?;
    set_username_mapping(state, &normalized, caller)?;
    
    Ok(())
}

/// Create a new UrgeID profile.
///
/// Returns an error if a profile already exists for this address.
pub fn create_urgeid_profile(
    state: &mut State,
    address: Address,
    display_name: String,
    bio: Option<String>,
    current_height: u64,
) -> Result<UrgeIDProfile, String> {
    if load_urgeid_profile(state, &address).is_some() {
        return Err("UrgeID profile already exists for this address".into());
    }

    let profile = UrgeIDProfile {
        address,
        display_name,
        bio,
        handle: None, // Handles are set separately via set_handle
        username: None, // Usernames are set separately via set_username
        level: 1, // Start at level 1
        syzygy_score: 0,
        total_cgt_earned_from_rewards: 0,
        badges: vec![],
        created_at_height: current_height,
    };

    store_urgeid_profile(state, &profile)?;
    Ok(profile)
}

/// Set or update an UrgeID's handle.
///
/// Validates handle format, enforces uniqueness, and updates the profile.
pub fn set_handle(
    state: &mut State,
    address: Address,
    new_handle: String,
) -> Result<UrgeIDProfile, String> {
    // Normalize handle: lowercase, trim
    let normalized = new_handle.trim().to_lowercase();

    // Validate format: [a-z0-9_]{3,32}
    if normalized.len() < 3 || normalized.len() > 32 {
        return Err("Handle must be 3-32 characters".into());
    }

    if !normalized.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '_') {
        return Err("Handle can only contain lowercase letters, numbers, and underscores".into());
    }

    // Check if handle is already taken by a different address
    if let Some(existing_addr) = get_address_by_handle(state, &normalized) {
        if existing_addr != address {
            return Err("Handle already taken".into());
        }
        // Same address, updating is fine
    }

    // Load current profile
    let mut profile = load_urgeid_profile(state, &address)
        .ok_or_else(|| "UrgeID profile not found".to_string())?;

    // Remove old handle mapping if exists
    if let Some(old_handle) = &profile.handle {
        if old_handle != &normalized {
            remove_handle_mapping(state, old_handle)?;
        }
    }

    // Update profile
    profile.handle = Some(normalized.clone());

    // Store updated profile
    store_urgeid_profile(state, &profile)?;

    // Store new handle mapping
    set_handle_mapping(state, &normalized, address)?;

    Ok(profile)
}

/// Get an UrgeID profile by address.
pub fn get_urgeid_profile(state: &State, address: &Address) -> Option<UrgeIDProfile> {
    load_urgeid_profile(state, address)
}

/// Compute level threshold for a given level.
pub fn level_threshold(level: u32) -> u64 {
    const BASE: u64 = 1_000;
    BASE.saturating_mul(level.saturating_mul(level) as u64)
}

/// Record Syzygy contribution and update badges.
///
/// Increments syzygy_score by the given amount, checks for level-ups, mints CGT rewards,
/// and awards badges if thresholds are met.
pub fn record_syzygy(
    state: &mut State,
    address: Address,
    amount: u64,
) -> Result<UrgeIDProfile, String> {
    use crate::runtime::cgt_mint_to;
    
    let mut profile = load_urgeid_profile(state, &address)
        .ok_or_else(|| "UrgeID profile not found".to_string())?;

    // Increment Syzygy Score
    profile.syzygy_score = profile
        .syzygy_score
        .checked_add(amount)
        .ok_or("Syzygy Score overflow")?;

    // Level up logic: check if syzygy_score meets next level threshold
    const REWARD_PER_LEVEL: u128 = 10_0000_0000; // 10 CGT in smallest units (10 * 10^8)
    
    while profile.syzygy_score >= level_threshold(profile.level) {
        profile.level += 1;
        
        // Mint 10 CGT as level-up reward
        cgt_mint_to(state, &address, REWARD_PER_LEVEL, "urgeid_level_rewards")
            .map_err(|e| format!("Failed to mint level reward: {}", e))?;
        
        profile.total_cgt_earned_from_rewards = profile
            .total_cgt_earned_from_rewards
            .saturating_add(REWARD_PER_LEVEL);
    }

    // Check for Luminary badge
    let has_luminary = profile.badges.iter().any(|b| b == "Luminary");
    if profile.syzygy_score >= LUMINARY_SYZYGY_THRESHOLD && !has_luminary {
        profile.badges.push("Luminary".to_string());
    }

    store_urgeid_profile(state, &profile)?;
    Ok(profile)
}

/// UrgeIDRegistryModule handles UrgeID profiles and Syzygy tracking
pub struct UrgeIDRegistryModule;

impl UrgeIDRegistryModule {
    pub fn new() -> Self {
        Self
    }
}

impl RuntimeModule for UrgeIDRegistryModule {
    fn module_id(&self) -> &'static str {
        "urgeid_registry"
    }

    fn dispatch(&self, call_id: &str, tx: &Transaction, state: &mut State) -> Result<(), String> {
        match call_id {
            "claim_archon" => handle_claim_archon(tx, state),
            other => Err(format!("urgeid_registry: unknown call_id '{}'", other)),
        }
    }
}

fn handle_claim_archon(tx: &Transaction, state: &mut State) -> Result<(), String> {
    // Legacy: mark as Archon (for backward compatibility)
    set_archon_flag(state, &tx.from, true)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::state::State;
    use crate::core::transaction::{Address, Transaction};

    #[test]
    fn test_is_archon_default_false() {
        let state = State::in_memory();
        let addr = [1u8; 32];
        assert!(!is_archon(&state, &addr));
    }

    #[test]
    fn test_claim_archon() {
        let mut state = State::in_memory();
        let addr = [1u8; 32];

        let tx = Transaction {
            from: addr,
            nonce: 0,
            module_id: "urgeid_registry".to_string(),
            call_id: "claim_archon".to_string(),
            payload: vec![],
            fee: 0,
            signature: vec![],
        };

        let module = UrgeIDRegistryModule::new();
        module.dispatch("claim_archon", &tx, &mut state).unwrap();

        assert!(is_archon(&state, &addr));
    }

    #[test]
    fn test_create_urgeid_profile() {
        let mut state = State::in_memory();
        let addr = [1u8; 32];

        let profile = create_urgeid_profile(
            &mut state,
            addr,
            "Test UrgeID".to_string(),
            Some("Test bio".to_string()),
            0,
        )
        .unwrap();

        assert_eq!(profile.display_name, "Test UrgeID");
        assert_eq!(profile.syzygy_score, 0);
        assert_eq!(profile.badges, Vec::<String>::new());

        // Should fail on duplicate
        assert!(create_urgeid_profile(
            &mut state,
            addr,
            "Another".to_string(),
            None,
            0
        )
        .is_err());
    }

    #[test]
    fn test_record_syzygy() {
        let mut state = State::in_memory();
        let addr = [1u8; 32];

        create_urgeid_profile(&mut state, addr, "Test".to_string(), None, 0).unwrap();

        let profile = record_syzygy(&mut state, addr, 300).unwrap();
        assert_eq!(profile.syzygy_score, 300);

        let profile = record_syzygy(&mut state, addr, 200).unwrap();
        assert_eq!(profile.syzygy_score, 500);
    }

    #[test]
    fn test_luminary_badge() {
        let mut state = State::in_memory();
        let addr = [1u8; 32];

        create_urgeid_profile(&mut state, addr, "Test".to_string(), None, 0).unwrap();

        let profile = record_syzygy(&mut state, addr, LUMINARY_SYZYGY_THRESHOLD).unwrap();
        assert!(profile.badges.contains(&"Luminary".to_string()));
    }
}

