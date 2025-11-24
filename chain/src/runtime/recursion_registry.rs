use crate::runtime::RuntimeModule;
use crate::core::state::State;
use crate::core::transaction::{Address, Transaction};
use serde::{Deserialize, Serialize};

// Storage key prefixes
const PREFIX_RECURSION_WORLD: &[u8] = b"recursion:world:";
const PREFIX_RECURSION_WORLDS_BY_OWNER: &[u8] = b"recursion:worlds_by_owner:";

/// Metadata for a Recursion World stored on-chain.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecursionWorldMeta {
    pub world_id: String,
    pub owner: Address,
    pub title: String,
    pub description: String,
    pub fabric_root_hash: String, // Hex-encoded Fabric root hash
    pub created_at: u64,
}

fn recursion_world_key(world_id: &str) -> Vec<u8> {
    let mut key = PREFIX_RECURSION_WORLD.to_vec();
    key.extend_from_slice(world_id.as_bytes());
    key
}

fn recursion_worlds_by_owner_key(owner: &Address) -> Vec<u8> {
    let mut key = PREFIX_RECURSION_WORLDS_BY_OWNER.to_vec();
    key.extend_from_slice(owner);
    key
}

/// Create a new Recursion World.
pub fn create_world(
    state: &mut State,
    owner: &Address,
    world_id: String,
    title: String,
    description: String,
    fabric_root_hash: String,
    created_at: u64,
) -> Result<RecursionWorldMeta, String> {
    // Validate world_id (basic validation)
    if world_id.is_empty() || world_id.len() > 100 {
        return Err("World ID must be between 1 and 100 characters".to_string());
    }

    // Check if world_id already exists
    let world_key = recursion_world_key(&world_id);
    if state.get_raw(&world_key).is_some() {
        return Err(format!("World with ID '{}' already exists", world_id));
    }

    let world = RecursionWorldMeta {
        world_id: world_id.clone(),
        owner: *owner,
        title,
        description,
        fabric_root_hash,
        created_at,
    };

    // Store world by ID
    let world_bytes = bincode::serialize(&world).map_err(|e| e.to_string())?;
    state
        .put_raw(world_key, world_bytes)
        .map_err(|e| format!("Failed to store world: {}", e))?;

    // Update owner's world list
    let owner_key = recursion_worlds_by_owner_key(owner);
    let mut owner_worlds: Vec<String> = state
        .get_raw(&owner_key)
        .and_then(|bytes| bincode::deserialize(&bytes).ok())
        .unwrap_or_default();
    if !owner_worlds.contains(&world_id) {
        owner_worlds.push(world_id);
        let owner_worlds_bytes = bincode::serialize(&owner_worlds).map_err(|e| e.to_string())?;
        state
            .put_raw(owner_key, owner_worlds_bytes)
            .map_err(|e| format!("Failed to update owner worlds list: {}", e))?;
    }

    Ok(world)
}

/// Get a Recursion World by ID.
pub fn get_world(state: &State, world_id: &str) -> Option<RecursionWorldMeta> {
    let key = recursion_world_key(world_id);
    state
        .get_raw(&key)
        .and_then(|bytes| bincode::deserialize(&bytes).ok())
}

/// List all worlds owned by an address.
pub fn list_worlds_by_owner(state: &State, owner: &Address) -> Vec<RecursionWorldMeta> {
    let owner_key = recursion_worlds_by_owner_key(owner);
    let world_ids: Vec<String> = state
        .get_raw(&owner_key)
        .and_then(|bytes| bincode::deserialize(&bytes).ok())
        .unwrap_or_default();

    let mut worlds = Vec::new();
    for world_id in world_ids {
        if let Some(world) = get_world(state, &world_id) {
            worlds.push(world);
        }
    }
    worlds
}

pub struct RecursionRegistryModule;

impl RecursionRegistryModule {
    pub fn new() -> Self {
        Self
    }
}

impl RuntimeModule for RecursionRegistryModule {
    fn module_id(&self) -> &'static str {
        "recursion_registry"
    }

    fn dispatch(&self, call_id: &str, tx: &Transaction, state: &mut State) -> Result<(), String> {
        match call_id {
            "create_world" => {
                #[derive(Deserialize)]
                struct Params {
                    world_id: String,
                    title: String,
                    description: String,
                    fabric_root_hash: String,
                }
                let params: Params = bincode::deserialize(&tx.payload)
                    .map_err(|_| "Invalid create_world params")?;
                // Use block height from transaction context (0 for now)
                let current_height = 0;
                create_world(
                    state,
                    &tx.from,
                    params.world_id,
                    params.title,
                    params.description,
                    params.fabric_root_hash,
                    current_height,
                )?;
                Ok(())
            }
            _ => Err(format!("Unknown call_id: {}", call_id)),
        }
    }
}

