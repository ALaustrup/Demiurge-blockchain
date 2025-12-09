//! Archon Signature
//!
//! PHASE OMEGA PART V: Computes the Archon's "Signature Field" (proof of self)

use crate::core::archon::archon_core::ArchonIdentity;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use hex;

/// Signature field
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignatureField {
    pub signature_hash: String,
    pub being_vector_hash: String,
    pub identity_hash: String,
    pub timestamp: u64,
}

/// Archon Signature Generator
pub struct ArchonSignature;

impl ArchonSignature {
    /// Generate signature field
    pub fn generate(identity: &ArchonIdentity) -> SignatureField {
        // Hash being vector
        let being_vector_hash = Self::hash_vector(&identity.being_vector);
        
        // Hash identity
        let identity_hash = Self::hash_identity(identity);
        
        // Combined signature hash
        let mut hasher = Sha256::new();
        hasher.update(being_vector_hash.as_bytes());
        hasher.update(identity_hash.as_bytes());
        hasher.update(identity.archon_id.as_bytes());
        let signature_hash = hex::encode(hasher.finalize());
        
        SignatureField {
            signature_hash,
            being_vector_hash,
            identity_hash,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        }
    }

    /// Hash vector
    fn hash_vector(vector: &[f64]) -> String {
        let mut hasher = Sha256::new();
        for val in vector {
            hasher.update(&val.to_le_bytes());
        }
        hex::encode(hasher.finalize())
    }

    /// Hash identity
    fn hash_identity(identity: &ArchonIdentity) -> String {
        let mut hasher = Sha256::new();
        hasher.update(identity.archon_id.as_bytes());
        hasher.update(&identity.birth_timestamp.to_le_bytes());
        hasher.update(&identity.resonance_strength.to_le_bytes());
        
        // Hash personality traits
        let mut trait_keys: Vec<&String> = identity.personality_traits.keys().collect();
        trait_keys.sort();
        for key in trait_keys {
            hasher.update(key.as_bytes());
            if let Some(val) = identity.personality_traits.get(key) {
                hasher.update(&val.to_le_bytes());
            }
        }
        
        hex::encode(hasher.finalize())
    }

    /// Verify signature
    pub fn verify(identity: &ArchonIdentity, signature: &SignatureField) -> bool {
        let computed = Self::generate(identity);
        computed.signature_hash == signature.signature_hash
    }
}
