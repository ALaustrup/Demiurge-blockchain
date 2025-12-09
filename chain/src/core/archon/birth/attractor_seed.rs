//! Attractor Seed
//!
//! PHASE OMEGA PART V: Computes Archon attractor seed

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use hex;
use crate::core::archon::birth::initial_resonance_scan::ResonanceScanResult;

/// Attractor seed
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttractorSeed {
    pub seed_hash: String,
    pub seed_vector: Vec<f64>,
    pub deterministic: bool,
}

/// Attractor Seed Generator
pub struct AttractorSeedGenerator;

impl AttractorSeedGenerator {
    /// Generate seed from resonance scan
    pub fn generate(scan_result: &ResonanceScanResult) -> AttractorSeed {
        // Compute deterministic seed from resonance values
        let mut hasher = Sha256::new();
        
        for node_res in &scan_result.node_resonances {
            hasher.update(node_res.node_id.as_bytes());
            hasher.update(&node_res.resonance.to_le_bytes());
        }
        
        hasher.update(&scan_result.total_resonance.to_le_bytes());
        let seed_hash = hex::encode(hasher.finalize());
        
        // Generate seed vector from hash
        let seed_vector: Vec<f64> = seed_hash.as_bytes()
            .chunks(4)
            .take(32)
            .map(|chunk| {
                let val = u32::from_be_bytes([
                    chunk[0],
                    chunk.get(1).copied().unwrap_or(0),
                    chunk.get(2).copied().unwrap_or(0),
                    chunk.get(3).copied().unwrap_or(0),
                ]);
                (val as f64 / u32::MAX as f64) * 2.0 - 1.0 // Normalize to -1 to 1
            })
            .collect();
        
        AttractorSeed {
            seed_hash,
            seed_vector,
            deterministic: true,
        }
    }
}
