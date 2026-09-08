//! Decentralized Identifier (DID) Implementation
//!
//! Qor DIDs follow the W3C DID specification with Demiurge-specific extensions.
//! DID Format: `did:demiurge:<32-byte-hex>`

use demiurge_primitives::{AbstractPublicKey, SignatureScheme, SecurityLevel};
use demiurge_storage::Storage;
use codec::{Decode, Encode};
use scale_info::TypeInfo;
use serde::{Deserialize, Serialize};
use blake2::{Blake2b512, Digest};
use tracing::info;

use crate::error::{QorError, Result};

// Storage keys
mod storage_keys {
    pub const IDENTITY: &[u8] = b"QOR:Identity:";
    pub const DID_TO_ADDRESS: &[u8] = b"QOR:DidAddr:";
    pub const IDENTITY_COUNT: &[u8] = b"QOR:Count";
}

/// Qor DID - Permanent decentralized identifier
#[derive(Clone, Debug, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct QorDid(pub [u8; 32]);

impl QorDid {
    /// Create DID from address bytes
    pub fn from_address(address: [u8; 32]) -> Self {
        Self(address)
    }
    
    /// Create DID from initial public key
    pub fn from_public_key(key: &AbstractPublicKey) -> Self {
        let mut hasher = Blake2b512::new();
        hasher.update(b"QOR_DID_V1:");
        hasher.update(&[key.scheme as u8]);
        hasher.update(&key.key);
        let hash = hasher.finalize();
        let mut did = [0u8; 32];
        did.copy_from_slice(&hash[..32]);
        Self(did)
    }
    
    /// Convert to string representation
    pub fn to_did_string(&self) -> String {
        format!("did:demiurge:{}", hex::encode(&self.0))
    }
    
    /// Parse from string
    pub fn from_string(s: &str) -> Result<Self> {
        const PREFIX: &str = "did:demiurge:";
        if !s.starts_with(PREFIX) {
            return Err(QorError::InvalidDid(format!("Must start with '{}'", PREFIX)));
        }
        let hex_part = &s[PREFIX.len()..];
        let bytes = hex::decode(hex_part).map_err(|e| QorError::InvalidDid(e.to_string()))?;
        if bytes.len() != 32 {
            return Err(QorError::InvalidDid("DID must be 32 bytes".to_string()));
        }
        let mut did = [0u8; 32];
        did.copy_from_slice(&bytes);
        Ok(Self(did))
    }
    
    pub fn as_bytes(&self) -> &[u8; 32] {
        &self.0
    }
}

impl std::fmt::Display for QorDid {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "did:demiurge:{}", hex::encode(&self.0))
    }
}

/// Purpose of a key in the identity
#[derive(Clone, Debug, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub enum KeyPurpose {
    /// Primary signing key (full authority)
    Primary,
    /// Recovery key (can rotate primary)
    Recovery,
    /// Session key with expiration
    Session { expires_at: u64 },
    /// Authentication only
    Authentication,
}

/// External linked identity
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct LinkedIdentity {
    /// Provider (e.g., "github", "discord")
    pub provider: Vec<u8>,
    /// External identifier
    pub external_id: Vec<u8>,
    /// When linked
    pub linked_at: u64,
}

/// Active key entry
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct ActiveKey {
    /// Public key bytes
    pub key_bytes: Vec<u8>,
    /// Signature scheme
    pub scheme: u8,
    /// Purpose
    pub purpose: KeyPurpose,
    /// When added
    pub added_at: u64,
}

impl ActiveKey {
    pub fn from_abstract_key(key: &AbstractPublicKey, purpose: KeyPurpose, block: u64) -> Self {
        Self {
            key_bytes: key.key.clone(),
            scheme: key.scheme as u8,
            purpose,
            added_at: block,
        }
    }
    
    pub fn to_abstract_key(&self) -> Option<AbstractPublicKey> {
        let scheme = match self.scheme {
            0 => SignatureScheme::Ed25519,
            10 => SignatureScheme::Dilithium3,
            100 => SignatureScheme::HybridEdDilithium3,
            _ => return None,
        };
        Some(AbstractPublicKey {
            scheme,
            key: self.key_bytes.clone(),
            custom_verifier: None,
        })
    }
}

/// Qor Sovereign Identity (simplified for SCALE encoding)
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct QorIdentity {
    /// Permanent DID
    pub did: QorDid,
    /// Handle (optional, stored separately)
    pub handle: Option<Vec<u8>>,
    /// Active keys
    pub active_keys: Vec<ActiveKey>,
    /// Key rotation count
    pub rotation_count: u32,
    /// Security level (0=Classical, 1=Hybrid, 2=QuantumSafe)
    pub security_level: u8,
    /// Creation block
    pub created_at: u64,
    /// Last activity block
    pub last_active: u64,
}

impl QorIdentity {
    /// Get primary key
    pub fn primary_key(&self) -> Option<AbstractPublicKey> {
        self.active_keys
            .iter()
            .find(|k| matches!(k.purpose, KeyPurpose::Primary))
            .and_then(|k| k.to_abstract_key())
    }
    
    /// Check if quantum-safe
    pub fn is_quantum_safe(&self) -> bool {
        self.security_level >= 2
    }
    
    /// Get transaction address
    pub fn transaction_address(&self) -> Option<[u8; 32]> {
        self.primary_key().map(|k| k.to_address())
    }
}

/// Identity calls
#[derive(Clone, Debug, Encode, Decode, TypeInfo)]
pub enum QorIdentityCall {
    /// Create identity
    Create { initial_key_bytes: Vec<u8>, scheme: u8 },
    /// Rotate key
    RotateKey { new_key_bytes: Vec<u8>, scheme: u8 },
    /// Add session key
    AddSessionKey { key_bytes: Vec<u8>, scheme: u8, expires_at: u64 },
    /// Revoke key
    RevokeKey { key_address: [u8; 32] },
}

// Storage helpers
fn identity_key(did: &QorDid) -> Vec<u8> {
    let mut key = storage_keys::IDENTITY.to_vec();
    key.extend_from_slice(&did.0);
    key
}

fn address_to_did_key(address: &[u8; 32]) -> Vec<u8> {
    let mut key = storage_keys::DID_TO_ADDRESS.to_vec();
    key.extend_from_slice(address);
    key
}

/// Create a new Qor Identity
pub fn create_identity(
    storage: &mut dyn Storage,
    initial_key: AbstractPublicKey,
    current_block: u64,
) -> Result<QorIdentity> {
    let did = QorDid::from_public_key(&initial_key);
    
    // Check if exists
    if storage.get(&identity_key(&did)).is_some() {
        return Err(QorError::InvalidDid("Identity already exists".to_string()));
    }
    
    let security_level = match SecurityLevel::from_scheme(initial_key.scheme) {
        SecurityLevel::Classical => 0,
        SecurityLevel::Hybrid => 1,
        SecurityLevel::QuantumSafe | SecurityLevel::QuantumRedundant => 2,
    };
    
    let identity = QorIdentity {
        did: did.clone(),
        handle: None,
        active_keys: vec![ActiveKey::from_abstract_key(&initial_key, KeyPurpose::Primary, current_block)],
        rotation_count: 0,
        security_level,
        created_at: current_block,
        last_active: current_block,
    };
    
    // Store
    storage.put(&identity_key(&did), &identity.encode());
    
    // Map address to DID
    let address = initial_key.to_address();
    storage.put(&address_to_did_key(&address), &did.0);
    
    // Update count
    let count = get_identity_count(storage);
    storage.put(storage_keys::IDENTITY_COUNT, &(count + 1).encode());
    
    info!("QOR: Created identity {}", did);
    
    Ok(identity)
}

/// Resolve identity by DID
pub fn resolve_identity(storage: &dyn Storage, did: &QorDid) -> Option<QorIdentity> {
    storage.get(&identity_key(did))
        .and_then(|v| QorIdentity::decode(&mut &v[..]).ok())
}

/// Resolve identity by address
pub fn resolve_by_address(storage: &dyn Storage, address: &[u8; 32]) -> Option<QorIdentity> {
    storage.get(&address_to_did_key(address))
        .and_then(|did_bytes| {
            if did_bytes.len() == 32 {
                let mut did = [0u8; 32];
                did.copy_from_slice(&did_bytes);
                resolve_identity(storage, &QorDid(did))
            } else {
                None
            }
        })
}

/// Get identity count
pub fn get_identity_count(storage: &dyn Storage) -> u64 {
    storage.get(storage_keys::IDENTITY_COUNT)
        .and_then(|v| u64::decode(&mut &v[..]).ok())
        .unwrap_or(0)
}

#[cfg(test)]
mod tests {
    use super::*;
    use demiurge_storage::MemoryStorage;
    
    #[test]
    fn test_create_identity() {
        let mut storage = MemoryStorage::new();
        let key = AbstractPublicKey::ed25519([1u8; 32]);
        
        let identity = create_identity(&mut storage, key.clone(), 1).unwrap();
        
        assert_eq!(identity.rotation_count, 0);
        assert_eq!(identity.active_keys.len(), 1);
        
        // Resolve
        let resolved = resolve_identity(&storage, &identity.did).unwrap();
        assert_eq!(resolved.did, identity.did);
        
        // By address
        let address = key.to_address();
        let resolved = resolve_by_address(&storage, &address).unwrap();
        assert_eq!(resolved.did, identity.did);
    }
    
    #[test]
    fn test_did_parsing() {
        let did = QorDid([42u8; 32]);
        let s = did.to_did_string();
        assert!(s.starts_with("did:demiurge:"));
        let parsed = QorDid::from_string(&s).unwrap();
        assert_eq!(parsed, did);
    }
}
