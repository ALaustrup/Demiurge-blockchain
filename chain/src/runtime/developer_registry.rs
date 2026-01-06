//! Developer Registry module for tracking developers and their projects.
//!
//! This module handles:
//! - Developer profiles (address, username, reputation)
//! - Project registration and maintainers
//! - Reputation tracking

use serde::{Deserialize, Serialize};

use super::RuntimeModule;
use crate::core::state::State;
use crate::core::transaction::{Address, Transaction};
use crate::runtime::nft_dgen::system_mint_dev_nft;

const PREFIX_DEVELOPER_PROFILE: &[u8] = b"developer/profile:";
const PREFIX_DEVELOPER_USERNAME: &[u8] = b"developer/username:";
const PREFIX_DEVELOPER_PROJECT: &[u8] = b"developer/project:";
const PREFIX_DEVELOPER_ALL: &[u8] = b"developer/all";

/// Developer profile stored on-chain.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeveloperProfile {
    pub address: Address,
    pub username: String,
    pub projects: Vec<String>, // Project slugs
    pub reputation: u64,
    pub created_at: u64,
}

fn developer_profile_key(address: &Address) -> Vec<u8> {
    let mut key = Vec::with_capacity(PREFIX_DEVELOPER_PROFILE.len() + address.len());
    key.extend_from_slice(PREFIX_DEVELOPER_PROFILE);
    key.extend_from_slice(address);
    key
}

fn developer_username_key(username: &str) -> Vec<u8> {
    let mut key = Vec::with_capacity(PREFIX_DEVELOPER_USERNAME.len() + username.len());
    key.extend_from_slice(PREFIX_DEVELOPER_USERNAME);
    key.extend_from_slice(username.as_bytes());
    key
}

fn developer_project_key(project_slug: &str) -> Vec<u8> {
    let mut key = Vec::with_capacity(PREFIX_DEVELOPER_PROJECT.len() + project_slug.len());
    key.extend_from_slice(PREFIX_DEVELOPER_PROJECT);
    key.extend_from_slice(project_slug.as_bytes());
    key
}

/// Register a developer (requires UrgeID username).
pub fn register_developer(
    address: Address,
    username: String,
    current_height: u64,
    state: &mut State,
) -> Result<(), String> {
    // Validate username format (3-32 chars, lowercase alphanumeric + underscore)
    if !username.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '_')
        || username.len() < 3
        || username.len() > 32
    {
        return Err("Invalid username format".to_string());
    }

    // Check if username is already taken
    let username_key = developer_username_key(&username);
    if state.get_raw(&username_key).is_some() {
        return Err("Username already taken".to_string());
    }

    // Check if address already registered
    let profile_key = developer_profile_key(&address);
    if state.get_raw(&profile_key).is_some() {
        return Err("Address already registered as developer".to_string());
    }

    // Create profile
    let profile = DeveloperProfile {
        address,
        username: username.clone(),
        projects: Vec::new(),
        reputation: 0,
        created_at: current_height,
    };

    // Store profile
    let profile_bytes = bincode::serialize(&profile).map_err(|e| e.to_string())?;
    state.put_raw(profile_key, profile_bytes).map_err(|e| e.to_string())?;

    // Store username -> address mapping
    state.put_raw(username_key, address.to_vec()).map_err(|e| e.to_string())?;

    // Add to all developers list
    let all_key = PREFIX_DEVELOPER_ALL.to_vec();
    let mut all_developers: Vec<Address> = state
        .get_raw(&all_key)
        .and_then(|bytes| bincode::deserialize(&bytes).ok())
        .unwrap_or_default();
    all_developers.push(address);
    let all_bytes = bincode::serialize(&all_developers).map_err(|e| e.to_string())?;
    state.put_raw(all_key, all_bytes).map_err(|e| e.to_string())?;

    // Auto-mint DEV Badge NFT for the new developer
    // This is called from within the developer_registry module, so caller_module_id is "developer_registry"
    match system_mint_dev_nft(state, &address, &username, "developer_registry") {
        Ok(_nft_id) => {
            // DEV Badge minted successfully (log or handle as needed)
            // The NFT is now owned by the developer
        }
        Err(_e) => {
            // If minting fails, we still want registration to succeed
            // The developer can claim their badge later via dev_claimDevNft
            // Log the error but don't fail registration
            // In production, you might want to log this to a monitoring system
        }
    }

    Ok(())
}

/// Get developer profile by address.
pub fn get_developer_profile(address: &Address, state: &State) -> Option<DeveloperProfile> {
    let key = developer_profile_key(address);
    state
        .get_raw(&key)
        .and_then(|bytes| bincode::deserialize(&bytes).ok())
}

/// Get developer address by username.
pub fn get_developer_by_username(username: &str, state: &State) -> Option<Address> {
    let key = developer_username_key(username);
    state.get_raw(&key).and_then(|bytes| {
        if bytes.len() == 32 {
            let mut addr = [0u8; 32];
            addr.copy_from_slice(&bytes[..32]);
            Some(addr)
        } else {
            None
        }
    })
}

/// Add a project to a developer.
pub fn add_project(
    address: Address,
    project_slug: String,
    state: &mut State,
) -> Result<(), String> {
    // Validate project slug
    if !project_slug
        .chars()
        .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-' || c == '_')
        || project_slug.len() < 3
        || project_slug.len() > 64
    {
        return Err("Invalid project slug format".to_string());
    }

    // Get developer profile
    let profile_key = developer_profile_key(&address);
    let mut profile: DeveloperProfile = state
        .get_raw(&profile_key)
        .and_then(|bytes| bincode::deserialize(&bytes).ok())
        .ok_or("Developer not found")?;

    // Add project if not already present
    if !profile.projects.contains(&project_slug) {
        profile.projects.push(project_slug.clone());
        let profile_bytes = bincode::serialize(&profile).map_err(|e| e.to_string())?;
        state.put_raw(profile_key, profile_bytes).map_err(|e| e.to_string())?;

        // Store project -> maintainers mapping
        let project_key = developer_project_key(&project_slug);
        let mut maintainers: Vec<Address> = state
            .get_raw(&project_key)
            .and_then(|bytes| bincode::deserialize(&bytes).ok())
            .unwrap_or_default();
        if !maintainers.contains(&address) {
            maintainers.push(address);
            let maintainers_bytes = bincode::serialize(&maintainers).map_err(|e| e.to_string())?;
            state.put_raw(project_key, maintainers_bytes).map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

/// Increment developer reputation.
pub fn increment_reputation(address: Address, amount: u64, state: &mut State) -> Result<(), String> {
    let profile_key = developer_profile_key(&address);
    let mut profile: DeveloperProfile = state
        .get_raw(&profile_key)
        .and_then(|bytes| bincode::deserialize(&bytes).ok())
        .ok_or("Developer not found")?;

    profile.reputation = profile.reputation.saturating_add(amount);
    let profile_bytes = bincode::serialize(&profile).map_err(|e| e.to_string())?;
    state.put_raw(profile_key, profile_bytes).map_err(|e| e.to_string())?;

    Ok(())
}

/// Get all developers.
pub fn get_all_developers(state: &State) -> Vec<Address> {
    let all_key = PREFIX_DEVELOPER_ALL.to_vec();
    state
        .get_raw(&all_key)
        .and_then(|bytes| bincode::deserialize(&bytes).ok())
        .unwrap_or_default()
}

/// Get project maintainers.
pub fn get_project_maintainers(project_slug: &str, state: &State) -> Vec<Address> {
    let project_key = developer_project_key(project_slug);
    state
        .get_raw(&project_key)
        .and_then(|bytes| bincode::deserialize(&bytes).ok())
        .unwrap_or_default()
}

/// Developer Registry runtime module.
pub struct DeveloperRegistryModule;

impl DeveloperRegistryModule {
    pub fn new() -> Self {
        Self
    }
}

impl RuntimeModule for DeveloperRegistryModule {
    fn module_id(&self) -> &'static str {
        "developer_registry"
    }

    fn dispatch(&self, call_id: &str, tx: &Transaction, state: &mut State) -> Result<(), String> {
        match call_id {
            "register_developer" => {
                let params: RegisterDeveloperParams = bincode::deserialize(&tx.payload)
                    .map_err(|_| "Invalid register_developer params")?;
                register_developer(tx.from, params.username, 0, state) // TODO: get current height
            }
            "claim_dev_nft" => {
                // Allow existing developers to claim their DEV Badge NFT
                let profile = get_developer_profile(&tx.from, state)
                    .ok_or_else(|| "Developer not registered".to_string())?;
                system_mint_dev_nft(state, &tx.from, &profile.username, "developer_registry")
                    .map(|_| ())
                    .map_err(|e| format!("Failed to mint DEV Badge: {}", e))
            }
            "add_project" => {
                let params: AddProjectParams = bincode::deserialize(&tx.payload)
                    .map_err(|_| "Invalid add_project params")?;
                add_project(tx.from, params.project_slug, state)
            }
            "increment_reputation" => {
                let params: IncrementReputationParams = bincode::deserialize(&tx.payload)
                    .map_err(|_| "Invalid increment_reputation params")?;
                increment_reputation(tx.from, params.amount, state)
            }
            _ => Err(format!("Unknown call_id: {}", call_id)),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
struct RegisterDeveloperParams {
    username: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct AddProjectParams {
    project_slug: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct IncrementReputationParams {
    amount: u64,
}

