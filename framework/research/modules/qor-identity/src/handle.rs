//! Handle Registry - Human-readable names for Qor Identities
//!
//! Format: `name.demiurge` or `@name`

use demiurge_storage::Storage;
use codec::{Decode, Encode};
use scale_info::TypeInfo;
use serde::{Deserialize, Serialize};
use blake2::{Blake2b512, Digest};
use tracing::info;

use crate::did::QorDid;
use crate::error::{QorError, Result};

mod storage_keys {
    pub const HANDLE: &[u8] = b"QOR:Handle:";
    pub const DID_HANDLE: &[u8] = b"QOR:DidHandle:";
    pub const HANDLE_COUNT: &[u8] = b"QOR:HandleCount";
    pub const RESERVED: &[u8] = b"QOR:Reserved:";
}

/// A Qor Handle
#[derive(Clone, Debug, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct Handle(pub Vec<u8>);

impl Handle {
    /// Create a new handle (validates format)
    pub fn new(name: &str) -> Result<Self> {
        let normalized = Self::normalize(name)?;
        Ok(Self(normalized.into_bytes()))
    }
    
    fn normalize(name: &str) -> Result<String> {
        let name = name.trim().to_lowercase();
        let name = name.strip_prefix('@').unwrap_or(&name);
        
        if name.len() < 3 {
            return Err(QorError::InvalidHandle("Handle must be at least 3 characters".to_string()));
        }
        if name.len() > 32 {
            return Err(QorError::InvalidHandle("Handle must be at most 32 characters".to_string()));
        }
        if !name.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-') {
            return Err(QorError::InvalidHandle("Handle can only contain letters, numbers, underscores, and hyphens".to_string()));
        }
        if !name.chars().next().map(|c| c.is_ascii_alphabetic()).unwrap_or(false) {
            return Err(QorError::InvalidHandle("Handle must start with a letter".to_string()));
        }
        Ok(name.to_string())
    }
    
    /// Get as string
    pub fn as_str(&self) -> &str {
        std::str::from_utf8(&self.0).unwrap_or("")
    }
    
    /// Display format
    pub fn display(&self) -> String {
        format!("@{}", self.as_str())
    }
    
    /// DNS format
    pub fn dns_format(&self) -> String {
        format!("{}.demiurge", self.as_str())
    }
    
    /// Hash for storage
    pub fn hash(&self) -> [u8; 32] {
        let mut hasher = Blake2b512::new();
        hasher.update(b"QOR_HANDLE:");
        hasher.update(&self.0);
        let hash = hasher.finalize();
        let mut result = [0u8; 32];
        result.copy_from_slice(&hash[..32]);
        result
    }
}

impl std::fmt::Display for Handle {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "@{}", self.as_str())
    }
}

/// Handle metadata (simplified)
#[derive(Clone, Debug, Default, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct HandleMetadata {
    /// Display name
    pub display_name: Option<Vec<u8>>,
    /// Avatar URI
    pub avatar: Option<Vec<u8>>,
    /// Bio
    pub bio: Option<Vec<u8>>,
    /// Website
    pub website: Option<Vec<u8>>,
}

impl HandleMetadata {
    pub fn new() -> Self {
        Self::default()
    }
    
    pub fn with_display_name(mut self, name: &str) -> Self {
        self.display_name = Some(name.as_bytes().to_vec());
        self
    }
    
    pub fn with_bio(mut self, bio: &str) -> Self {
        self.bio = Some(bio.as_bytes().to_vec());
        self
    }
}

/// Handle registration
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct HandleRegistration {
    /// The handle
    pub handle: Handle,
    /// Owner DID
    pub owner_did: QorDid,
    /// Registration block
    pub registered_at: u64,
    /// Expiration (optional)
    pub expires_at: Option<u64>,
    /// Transferable
    pub transferable: bool,
    /// Metadata
    pub metadata: HandleMetadata,
}

/// Handle Registry
pub struct HandleRegistry;

impl HandleRegistry {
    /// Register a handle
    pub fn register(
        storage: &mut dyn Storage,
        handle_str: &str,
        owner_did: QorDid,
        metadata: HandleMetadata,
        current_block: u64,
    ) -> Result<HandleRegistration> {
        let handle = Handle::new(handle_str)?;
        
        if Self::is_reserved(storage, &handle) {
            return Err(QorError::HandleTaken(format!("{} is reserved", handle)));
        }
        
        if Self::resolve(storage, &handle).is_some() {
            return Err(QorError::HandleTaken(handle.to_string()));
        }
        
        if Self::get_handle_for_did(storage, &owner_did).is_some() {
            return Err(QorError::InvalidHandle("DID already has a handle".to_string()));
        }
        
        let registration = HandleRegistration {
            handle: handle.clone(),
            owner_did: owner_did.clone(),
            registered_at: current_block,
            expires_at: None,
            transferable: true,
            metadata,
        };
        
        storage.put(&Self::handle_key(&handle), &registration.encode());
        storage.put(&Self::did_handle_key(&owner_did), &handle.0);
        
        let count = Self::get_handle_count(storage);
        storage.put(storage_keys::HANDLE_COUNT, &(count + 1).encode());
        
        info!("QOR: Registered handle {} for {}", handle, owner_did);
        
        Ok(registration)
    }
    
    /// Resolve handle
    pub fn resolve(storage: &dyn Storage, handle: &Handle) -> Option<HandleRegistration> {
        storage.get(&Self::handle_key(handle))
            .and_then(|v| HandleRegistration::decode(&mut &v[..]).ok())
    }
    
    /// Resolve by string
    pub fn resolve_str(storage: &dyn Storage, handle_str: &str) -> Option<HandleRegistration> {
        Handle::new(handle_str).ok().and_then(|h| Self::resolve(storage, &h))
    }
    
    /// Get handle for DID
    pub fn get_handle_for_did(storage: &dyn Storage, did: &QorDid) -> Option<Handle> {
        storage.get(&Self::did_handle_key(did)).map(Handle)
    }
    
    /// Transfer handle
    pub fn transfer(
        storage: &mut dyn Storage,
        handle: &Handle,
        current_owner: &QorDid,
        new_owner: QorDid,
        _current_block: u64,
    ) -> Result<()> {
        let mut registration = Self::resolve(storage, handle)
            .ok_or_else(|| QorError::HandleNotFound(handle.to_string()))?;
        
        if &registration.owner_did != current_owner {
            return Err(QorError::NotAuthorized("Not the handle owner".to_string()));
        }
        
        if !registration.transferable {
            return Err(QorError::NotAuthorized("Handle is not transferable".to_string()));
        }
        
        if Self::get_handle_for_did(storage, &new_owner).is_some() {
            return Err(QorError::InvalidHandle("New owner already has a handle".to_string()));
        }
        
        storage.delete(&Self::did_handle_key(&registration.owner_did));
        registration.owner_did = new_owner.clone();
        storage.put(&Self::handle_key(handle), &registration.encode());
        storage.put(&Self::did_handle_key(&new_owner), &handle.0);
        
        info!("QOR: Transferred handle {} to {}", handle, new_owner);
        Ok(())
    }
    
    /// Release handle
    pub fn release(storage: &mut dyn Storage, handle: &Handle, owner: &QorDid) -> Result<()> {
        let registration = Self::resolve(storage, handle)
            .ok_or_else(|| QorError::HandleNotFound(handle.to_string()))?;
        
        if &registration.owner_did != owner {
            return Err(QorError::NotAuthorized("Not the handle owner".to_string()));
        }
        
        storage.delete(&Self::handle_key(handle));
        storage.delete(&Self::did_handle_key(owner));
        
        let count = Self::get_handle_count(storage);
        if count > 0 {
            storage.put(storage_keys::HANDLE_COUNT, &(count - 1).encode());
        }
        
        info!("QOR: Released handle {}", handle);
        Ok(())
    }
    
    /// Reserve handle
    pub fn reserve(storage: &mut dyn Storage, handle_str: &str) -> Result<()> {
        let handle = Handle::new(handle_str)?;
        storage.put(&Self::reserved_key(&handle), &[1u8]);
        info!("QOR: Reserved handle {}", handle);
        Ok(())
    }
    
    /// Check if reserved
    pub fn is_reserved(storage: &dyn Storage, handle: &Handle) -> bool {
        storage.get(&Self::reserved_key(handle)).is_some()
    }
    
    /// Get handle count
    pub fn get_handle_count(storage: &dyn Storage) -> u64 {
        storage.get(storage_keys::HANDLE_COUNT)
            .and_then(|v| u64::decode(&mut &v[..]).ok())
            .unwrap_or(0)
    }
    
    /// List handles (paginated)
    pub fn list_handles(storage: &dyn Storage, offset: usize, limit: usize) -> Vec<HandleRegistration> {
        storage.prefix_iter(storage_keys::HANDLE)
            .skip(offset)
            .take(limit)
            .filter_map(|(_, v)| HandleRegistration::decode(&mut &v[..]).ok())
            .collect()
    }
    
    /// Convert to JSON-LD
    pub fn to_json_ld(registration: &HandleRegistration) -> serde_json::Value {
        serde_json::json!({
            "@context": "https://demiurge.io/identity/v1",
            "@type": "qor:Handle",
            "@id": format!("qor:handle:{}", registration.handle.as_str()),
            "name": registration.handle.as_str(),
            "displayFormat": registration.handle.display(),
            "dnsFormat": registration.handle.dns_format(),
            "did": registration.owner_did.to_did_string(),
            "registeredAt": registration.registered_at,
            "expiresAt": registration.expires_at,
            "transferable": registration.transferable,
        })
    }
    
    fn handle_key(handle: &Handle) -> Vec<u8> {
        let mut key = storage_keys::HANDLE.to_vec();
        key.extend_from_slice(&handle.hash());
        key
    }
    
    fn did_handle_key(did: &QorDid) -> Vec<u8> {
        let mut key = storage_keys::DID_HANDLE.to_vec();
        key.extend_from_slice(&did.0);
        key
    }
    
    fn reserved_key(handle: &Handle) -> Vec<u8> {
        let mut key = storage_keys::RESERVED.to_vec();
        key.extend_from_slice(&handle.hash());
        key
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use demiurge_storage::MemoryStorage;
    
    #[test]
    fn test_handle_validation() {
        assert!(Handle::new("alice").is_ok());
        assert!(Handle::new("@alice").is_ok());
        assert!(Handle::new("Alice").is_ok());
        assert!(Handle::new("ab").is_err()); // Too short
        assert!(Handle::new("123alice").is_err()); // Must start with letter
    }
    
    #[test]
    fn test_handle_registration() {
        let mut storage = MemoryStorage::new();
        let did = QorDid([1u8; 32]);
        
        let registration = HandleRegistry::register(
            &mut storage, "alice", did.clone(), HandleMetadata::default(), 1,
        ).unwrap();
        
        assert_eq!(registration.handle.as_str(), "alice");
        
        let resolved = HandleRegistry::resolve_str(&storage, "@alice").unwrap();
        assert_eq!(resolved.owner_did, did);
        
        let handle = HandleRegistry::get_handle_for_did(&storage, &did).unwrap();
        assert_eq!(handle.as_str(), "alice");
    }
    
    #[test]
    fn test_handle_transfer() {
        let mut storage = MemoryStorage::new();
        let did1 = QorDid([1u8; 32]);
        let did2 = QorDid([2u8; 32]);
        
        let handle = Handle::new("alice").unwrap();
        HandleRegistry::register(&mut storage, "alice", did1.clone(), HandleMetadata::default(), 1).unwrap();
        
        HandleRegistry::transfer(&mut storage, &handle, &did1, did2.clone(), 2).unwrap();
        
        let resolved = HandleRegistry::resolve(&storage, &handle).unwrap();
        assert_eq!(resolved.owner_did, did2);
    }
}
