//! Subsystem Purity Guard
//!
//! PHASE OMEGA PART III: Enforces absolute purity of core modules

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use hex;

/// Purity check result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PurityCheck {
    pub subsystem: String,
    pub pure: bool,
    pub hash: String,
    pub expected_hash: Option<String>,
}

/// Subsystem Purity Guard
pub struct SubsystemPurityGuard {
    expected_hashes: std::collections::HashMap<String, String>,
}

impl SubsystemPurityGuard {
    /// Create new guard
    pub fn new() -> Self {
        Self {
            expected_hashes: std::collections::HashMap::new(),
        }
    }

    /// Check purity
    pub fn check_purity(&self, subsystem: &str, content: &str) -> PurityCheck {
        let hash = self.compute_hash(content);
        let expected = self.expected_hashes.get(subsystem).cloned();
        let pure = expected.as_ref().map(|e| e == &hash).unwrap_or(true);
        
        PurityCheck {
            subsystem: subsystem.to_string(),
            pure,
            hash,
            expected_hash: expected,
        }
    }

    /// Set expected hash
    pub fn set_expected_hash(&mut self, subsystem: String, hash: String) {
        self.expected_hashes.insert(subsystem, hash);
    }

    /// Compute hash
    fn compute_hash(&self, content: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(content.as_bytes());
        let hash = hasher.finalize();
        hex::encode(hash)
    }
}

impl Default for SubsystemPurityGuard {
    fn default() -> Self {
        Self::new()
    }
}
