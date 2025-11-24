use crate::runtime::RuntimeModule;
use crate::core::state::State;
use crate::core::transaction::{Address, Transaction};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CapsuleStatus {
    Draft,
    Live,
    Paused,
    Archived,
}

impl CapsuleStatus {
    pub fn from_str(s: &str) -> Result<Self, String> {
        match s.to_lowercase().as_str() {
            "draft" => Ok(CapsuleStatus::Draft),
            "live" => Ok(CapsuleStatus::Live),
            "paused" => Ok(CapsuleStatus::Paused),
            "archived" => Ok(CapsuleStatus::Archived),
            _ => Err(format!("Invalid capsule status: {}", s)),
        }
    }

    pub fn as_str(&self) -> &str {
        match self {
            CapsuleStatus::Draft => "draft",
            CapsuleStatus::Live => "live",
            CapsuleStatus::Paused => "paused",
            CapsuleStatus::Archived => "archived",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DevCapsule {
    pub id: u64,
    pub owner: Address,
    pub project_slug: String,
    pub status: CapsuleStatus,
    pub created_at: u64,
    pub updated_at: u64,
    pub notes: String,
}

// Storage key prefixes
const PREFIX_CAPSULE_BY_ID: &[u8] = b"capsule:by_id:";
const PREFIX_CAPSULE_BY_OWNER: &[u8] = b"capsule:by_owner:";
const PREFIX_CAPSULE_BY_PROJECT: &[u8] = b"capsule:by_project:";
const PREFIX_CAPSULE_COUNTER: &[u8] = b"capsule:counter";

fn capsule_by_id_key(id: u64) -> Vec<u8> {
    let mut key = PREFIX_CAPSULE_BY_ID.to_vec();
    key.extend_from_slice(&id.to_be_bytes());
    key
}

fn capsule_by_owner_key(owner: &Address) -> Vec<u8> {
    let mut key = PREFIX_CAPSULE_BY_OWNER.to_vec();
    key.extend_from_slice(owner);
    key
}

fn capsule_by_project_key(project_slug: &str) -> Vec<u8> {
    let mut key = PREFIX_CAPSULE_BY_PROJECT.to_vec();
    key.extend_from_slice(project_slug.as_bytes());
    key
}

fn get_next_capsule_id(state: &mut State) -> Result<u64, String> {
    let counter_key = PREFIX_CAPSULE_COUNTER.to_vec();
    let current = state
        .get_raw(&counter_key)
        .and_then(|bytes| {
            if bytes.len() == 8 {
                Some(u64::from_be_bytes([
                    bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5], bytes[6], bytes[7],
                ]))
            } else {
                None
            }
        })
        .unwrap_or(0);

    let next = current + 1;
    state.put_raw(counter_key, next.to_be_bytes().to_vec())
        .map_err(|e| format!("Failed to update capsule counter: {}", e))?;
    Ok(next)
}

pub fn create_capsule(
    state: &mut State,
    owner: &Address,
    project_slug: &str,
    notes: &str,
    created_at: u64,
) -> Result<DevCapsule, String> {
    // Validate project_slug (basic validation)
    if project_slug.is_empty() || project_slug.len() > 100 {
        return Err("Project slug must be between 1 and 100 characters".to_string());
    }

    // Get next ID
    let id = get_next_capsule_id(state)?;

    let capsule = DevCapsule {
        id,
        owner: *owner,
        project_slug: project_slug.to_string(),
        status: CapsuleStatus::Draft,
        created_at,
        updated_at: created_at,
        notes: notes.to_string(),
    };

    // Store capsule by ID
    let capsule_bytes = bincode::serialize(&capsule).map_err(|e| e.to_string())?;
    state.put_raw(capsule_by_id_key(id), capsule_bytes)
        .map_err(|e| format!("Failed to store capsule: {}", e))?;

    // Update owner's capsule list
    let owner_key = capsule_by_owner_key(owner);
    let mut owner_capsules = get_capsules_by_owner_internal(state, owner)
        .unwrap_or_default()
        .iter()
        .map(|c| c.id)
        .collect::<Vec<u64>>();
    if !owner_capsules.contains(&id) {
        owner_capsules.push(id);
        let owner_capsules_bytes = bincode::serialize(&owner_capsules).map_err(|e| e.to_string())?;
        state.put_raw(owner_key, owner_capsules_bytes)
            .map_err(|e| format!("Failed to update owner capsules list: {}", e))?;
    }

    // Update project's capsule list
    let project_key = capsule_by_project_key(project_slug);
    let mut project_capsules = get_capsules_by_project_internal(state, project_slug)
        .unwrap_or_default()
        .iter()
        .map(|c| c.id)
        .collect::<Vec<u64>>();
    if !project_capsules.contains(&id) {
        project_capsules.push(id);
        let project_capsules_bytes = bincode::serialize(&project_capsules).map_err(|e| e.to_string())?;
        state.put_raw(project_key, project_capsules_bytes)
            .map_err(|e| format!("Failed to update project capsules list: {}", e))?;
    }

    Ok(capsule)
}

pub fn get_capsule(state: &State, id: u64) -> Option<DevCapsule> {
    let key = capsule_by_id_key(id);
    state
        .get_raw(&key)
        .and_then(|bytes| bincode::deserialize(&bytes).ok())
}

fn get_capsules_by_owner_internal(state: &State, owner: &Address) -> Option<Vec<DevCapsule>> {
    let owner_key = capsule_by_owner_key(owner);
    let ids: Vec<u64> = state
        .get_raw(&owner_key)
        .and_then(|bytes| bincode::deserialize(&bytes).ok())
        .unwrap_or_default();

    let mut capsules = Vec::new();
    for id in ids {
        if let Some(capsule) = get_capsule(state, id) {
            capsules.push(capsule);
        }
    }
    Some(capsules)
}

pub fn list_capsules_by_owner(state: &State, owner: &Address) -> Vec<DevCapsule> {
    get_capsules_by_owner_internal(state, owner).unwrap_or_default()
}

fn get_capsules_by_project_internal(state: &State, project_slug: &str) -> Option<Vec<DevCapsule>> {
    let project_key = capsule_by_project_key(project_slug);
    let ids: Vec<u64> = state
        .get_raw(&project_key)
        .and_then(|bytes| bincode::deserialize(&bytes).ok())
        .unwrap_or_default();

    let mut capsules = Vec::new();
    for id in ids {
        if let Some(capsule) = get_capsule(state, id) {
            capsules.push(capsule);
        }
    }
    Some(capsules)
}

pub fn list_capsules_by_project(state: &State, project_slug: &str) -> Vec<DevCapsule> {
    get_capsules_by_project_internal(state, project_slug).unwrap_or_default()
}

pub fn update_capsule_status(
    state: &mut State,
    id: u64,
    new_status: CapsuleStatus,
    updated_at: u64,
) -> Result<DevCapsule, String> {
    let mut capsule = get_capsule(state, id)
        .ok_or_else(|| format!("Capsule {} not found", id))?;

    capsule.status = new_status;
    capsule.updated_at = updated_at;

    // Update storage
    let capsule_bytes = bincode::serialize(&capsule).map_err(|e| e.to_string())?;
    state.put_raw(capsule_by_id_key(id), capsule_bytes)
        .map_err(|e| format!("Failed to update capsule status: {}", e))?;

    Ok(capsule)
}

pub fn update_capsule_notes(
    state: &mut State,
    id: u64,
    notes: &str,
    updated_at: u64,
) -> Result<DevCapsule, String> {
    let mut capsule = get_capsule(state, id)
        .ok_or_else(|| format!("Capsule {} not found", id))?;

    capsule.notes = notes.to_string();
    capsule.updated_at = updated_at;

    // Update storage
    let capsule_bytes = bincode::serialize(&capsule).map_err(|e| e.to_string())?;
    state.put_raw(capsule_by_id_key(id), capsule_bytes)
        .map_err(|e| format!("Failed to update capsule notes: {}", e))?;

    Ok(capsule)
}

pub struct DevCapsulesModule;

impl DevCapsulesModule {
    pub fn new() -> Self {
        Self
    }
}

impl RuntimeModule for DevCapsulesModule {
    fn module_id(&self) -> &'static str {
        "dev_capsules"
    }

    fn dispatch(&self, call_id: &str, tx: &Transaction, state: &mut State) -> Result<(), String> {
        match call_id {
            "create_capsule" => {
                #[derive(Deserialize)]
                struct Params {
                    project_slug: String,
                    notes: String,
                }
                let params: Params = bincode::deserialize(&tx.payload)
                    .map_err(|_| "Invalid create_capsule params")?;
                // Use block height from transaction context (0 for now, will be passed in later)
                let current_height = 0;
                create_capsule(state, &tx.from, &params.project_slug, &params.notes, current_height)?;
                Ok(())
            }
            "update_capsule_status" => {
                #[derive(Deserialize)]
                struct Params {
                    id: u64,
                    status: String,
                }
                let params: Params = bincode::deserialize(&tx.payload)
                    .map_err(|_| "Invalid update_capsule_status params")?;
                let status = CapsuleStatus::from_str(&params.status)?;
                // Verify ownership
                let capsule = get_capsule(state, params.id)
                    .ok_or_else(|| format!("Capsule {} not found", params.id))?;
                if capsule.owner != tx.from {
                    return Err("Only capsule owner can update status".to_string());
                }
                let current_height = 0;
                update_capsule_status(state, params.id, status, current_height)?;
                Ok(())
            }
            "update_capsule_notes" => {
                #[derive(Deserialize)]
                struct Params {
                    id: u64,
                    notes: String,
                }
                let params: Params = bincode::deserialize(&tx.payload)
                    .map_err(|_| "Invalid update_capsule_notes params")?;
                // Verify ownership
                let capsule = get_capsule(state, params.id)
                    .ok_or_else(|| format!("Capsule {} not found", params.id))?;
                if capsule.owner != tx.from {
                    return Err("Only capsule owner can update notes".to_string());
                }
                let current_height = 0;
                update_capsule_notes(state, params.id, &params.notes, current_height)?;
                Ok(())
            }
            _ => Err(format!("Unknown call_id: {}", call_id)),
        }
    }
}

