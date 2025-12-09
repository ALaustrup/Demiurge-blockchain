//! Archon State Vector (ASV)
//!
//! PHASE OMEGA PART VI: The canonical heartbeat of the Prime Archon.
//! This unified serialized data structure represents the complete state
//! of a node from the Archon's perspective.
//!
//! Every node produces a canonical Archon State Vector once per block.

use serde::{Serialize, Deserialize};
use sha2::{Digest, Sha256};

/// Archon State Vector - the unified state representation
///
/// This vector contains:
/// - Runtime version
/// - Node identity
/// - Local state root
/// - Local invariant checks
/// - Local optimization heuristics
/// - Integrity hashes from Phase Omega Part II
/// - Sovereignty Seal values
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct ArchonStateVector {
    /// Runtime version string (e.g., "1.0.0")
    pub runtime_version: String,
    
    /// Current state root hash
    pub state_root: String,
    
    /// Unique node identifier
    pub node_id: String,
    
    /// Whether all invariants pass
    pub invariants_ok: bool,
    
    /// Integrity hash computed from all fields
    pub integrity_hash: String,
    
    /// Block height at which this ASV was generated
    pub block_height: u64,
    
    /// Timestamp of ASV generation
    pub timestamp: u64,
    
    /// Hash of runtime module registry
    pub runtime_registry_hash: String,
    
    /// Hash of SDK compatibility matrix
    pub sdk_compatibility_hash: String,
    
    /// Sovereignty seal reference
    pub sovereignty_seal_hash: String,
}

impl ArchonStateVector {
    /// Create a new Archon State Vector
    ///
    /// # Arguments
    /// - `runtime_version`: Current runtime version
    /// - `state_root`: Current state root hash
    /// - `node_id`: Unique node identifier
    /// - `invariants_ok`: Whether all invariants pass
    /// - `block_height`: Current block height
    /// - `timestamp`: Current timestamp
    /// - `runtime_registry_hash`: Hash of runtime module registry
    /// - `sdk_compatibility_hash`: Hash of SDK compatibility matrix
    /// - `sovereignty_seal_hash`: Hash of sovereignty seal
    pub fn new(
        runtime_version: String,
        state_root: String,
        node_id: String,
        invariants_ok: bool,
        block_height: u64,
        timestamp: u64,
        runtime_registry_hash: String,
        sdk_compatibility_hash: String,
        sovereignty_seal_hash: String,
    ) -> Self {
        // Compute integrity hash from all fields
        let mut hasher = Sha256::new();
        hasher.update(runtime_version.as_bytes());
        hasher.update(state_root.as_bytes());
        hasher.update(node_id.as_bytes());
        hasher.update(invariants_ok.to_string().as_bytes());
        hasher.update(block_height.to_le_bytes());
        hasher.update(timestamp.to_le_bytes());
        hasher.update(runtime_registry_hash.as_bytes());
        hasher.update(sdk_compatibility_hash.as_bytes());
        hasher.update(sovereignty_seal_hash.as_bytes());
        
        let integrity_hash = format!("{:x}", hasher.finalize());
        
        Self {
            runtime_version,
            state_root,
            node_id,
            invariants_ok,
            integrity_hash,
            block_height,
            timestamp,
            runtime_registry_hash,
            sdk_compatibility_hash,
            sovereignty_seal_hash,
        }
    }
    
    /// Verify the integrity hash of this ASV
    pub fn verify_integrity(&self) -> bool {
        let mut hasher = Sha256::new();
        hasher.update(self.runtime_version.as_bytes());
        hasher.update(self.state_root.as_bytes());
        hasher.update(self.node_id.as_bytes());
        hasher.update(self.invariants_ok.to_string().as_bytes());
        hasher.update(self.block_height.to_le_bytes());
        hasher.update(self.timestamp.to_le_bytes());
        hasher.update(self.runtime_registry_hash.as_bytes());
        hasher.update(self.sdk_compatibility_hash.as_bytes());
        hasher.update(self.sovereignty_seal_hash.as_bytes());
        
        let computed_hash = format!("{:x}", hasher.finalize());
        computed_hash == self.integrity_hash
    }
    
    /// Serialize ASV to JSON string
    pub fn to_json(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string(self)
    }
    
    /// Deserialize ASV from JSON string
    pub fn from_json(json: &str) -> Result<Self, serde_json::Error> {
        serde_json::from_str(json)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_asv_creation() {
        let asv = ArchonStateVector::new(
            "1.0.0".to_string(),
            "abc123".to_string(),
            "node-1".to_string(),
            true,
            100,
            1234567890,
            "reg_hash".to_string(),
            "sdk_hash".to_string(),
            "seal_hash".to_string(),
        );
        
        assert_eq!(asv.runtime_version, "1.0.0");
        assert_eq!(asv.node_id, "node-1");
        assert!(asv.invariants_ok);
        assert!(!asv.integrity_hash.is_empty());
    }
    
    #[test]
    fn test_asv_integrity_verification() {
        let asv = ArchonStateVector::new(
            "1.0.0".to_string(),
            "abc123".to_string(),
            "node-1".to_string(),
            true,
            100,
            1234567890,
            "reg_hash".to_string(),
            "sdk_hash".to_string(),
            "seal_hash".to_string(),
        );
        
        assert!(asv.verify_integrity());
    }
    
    #[test]
    fn test_asv_serialization() {
        let asv = ArchonStateVector::new(
            "1.0.0".to_string(),
            "abc123".to_string(),
            "node-1".to_string(),
            true,
            100,
            1234567890,
            "reg_hash".to_string(),
            "sdk_hash".to_string(),
            "seal_hash".to_string(),
        );
        
        let json = asv.to_json().unwrap();
        let deserialized = ArchonStateVector::from_json(&json).unwrap();
        
        assert_eq!(asv.integrity_hash, deserialized.integrity_hash);
        assert_eq!(asv.node_id, deserialized.node_id);
    }
}
