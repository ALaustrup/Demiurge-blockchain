//! Resonance Bloom
//!
//! PHASE OMEGA PART IV: Bloom-phase consensus for high-impact decisions

use serde::{Deserialize, Serialize};
use crate::core::godnet_fabric::NodeId;

/// Bloom phase
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum BloomPhase {
    Budding,    // Initial proposal
    Growing,    // Gathering support
    Blooming,   // Consensus forming
    FullBloom,  // Consensus reached
    Withering,  // Consensus failing
}

/// Bloom proposal
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BloomProposal {
    pub id: String,
    pub proposal: String,
    pub phase: BloomPhase,
    pub support: f64, // 0.0 to 1.0
    pub threshold: f64, // Required support for consensus
    pub votes: HashMap<NodeId, bool>, // Node ID -> approve/reject
}

/// Resonance Bloom Manager
pub struct ResonanceBloom {
    active_blooms: std::collections::HashMap<String, BloomProposal>,
    bloom_threshold: f64,
}

impl ResonanceBloom {
    /// Create new bloom manager
    pub fn new(threshold: f64) -> Self {
        Self {
            active_blooms: std::collections::HashMap::new(),
            bloom_threshold: threshold,
        }
    }

    /// Propose bloom
    pub fn propose(&mut self, proposal: String) -> String {
        let id = format!("bloom_{}", 
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        );
        
        let bloom = BloomProposal {
            id: id.clone(),
            proposal,
            phase: BloomPhase::Budding,
            support: 0.0,
            threshold: self.bloom_threshold,
            votes: std::collections::HashMap::new(),
        };
        
        self.active_blooms.insert(id.clone(), bloom);
        id
    }

    /// Vote on bloom
    pub fn vote(&mut self, bloom_id: &str, node_id: NodeId, approve: bool) {
        if let Some(bloom) = self.active_blooms.get_mut(bloom_id) {
            bloom.votes.insert(node_id, approve);
            
            // Recalculate support
            let approve_count = bloom.votes.values().filter(|&&v| v).count();
            let total_votes = bloom.votes.len();
            bloom.support = if total_votes > 0 {
                approve_count as f64 / total_votes as f64
            } else {
                0.0
            };
            
            // Update phase
            bloom.phase = if bloom.support >= bloom.threshold {
                BloomPhase::FullBloom
            } else if bloom.support >= bloom.threshold * 0.7 {
                BloomPhase::Blooming
            } else if bloom.support >= bloom.threshold * 0.3 {
                BloomPhase::Growing
            } else if bloom.support < 0.1 {
                BloomPhase::Withering
            } else {
                BloomPhase::Budding
            };
        }
    }

    /// Get bloom status
    pub fn get_bloom(&self, bloom_id: &str) -> Option<&BloomProposal> {
        self.active_blooms.get(bloom_id)
    }

    /// Get all blooms
    pub fn get_all_blooms(&self) -> &std::collections::HashMap<String, BloomProposal> {
        &self.active_blooms
    }
}

impl Default for ResonanceBloom {
    fn default() -> Self {
        Self::new(0.67) // 67% threshold
    }
}
