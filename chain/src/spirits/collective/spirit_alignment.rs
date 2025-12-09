//! Spirit Alignment
//!
//! PHASE OMEGA PART III: Aligns spirits and votes on improvements

use crate::spirits::collective::collective_protocol::{CollectiveProtocol, SpiritNode};
use serde::{Deserialize, Serialize};

/// Alignment result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlignmentResult {
    pub aligned: bool,
    pub alignment_score: f64,
    pub consensus: String,
}

/// Spirit Alignment Manager
pub struct SpiritAlignment {
    protocol: CollectiveProtocol,
    alignment_threshold: f64,
}

impl SpiritAlignment {
    /// Create new alignment manager
    pub fn new(threshold: f64) -> Self {
        Self {
            protocol: CollectiveProtocol::new(),
            alignment_threshold: threshold,
        }
    }

    /// Check alignment
    pub fn check_alignment(&self) -> AlignmentResult {
        let spirits: Vec<&SpiritNode> = self.protocol.spirits.values().collect();
        
        if spirits.is_empty() {
            return AlignmentResult {
                aligned: false,
                alignment_score: 0.0,
                consensus: "No spirits".to_string(),
            };
        }
        
        // Calculate average alignment score
        let avg_alignment: f64 = spirits.iter()
            .map(|s| s.alignment_score)
            .sum::<f64>() / spirits.len() as f64;
        
        let aligned = avg_alignment >= self.alignment_threshold;
        let consensus = if aligned {
            "Spirits aligned".to_string()
        } else {
            "Spirits misaligned".to_string()
        };
        
        AlignmentResult {
            aligned,
            alignment_score: avg_alignment,
            consensus,
        }
    }

    /// Vote on improvement
    pub fn vote_on_improvement(&self, proposal_id: &str) -> (usize, usize) {
        let spirits: Vec<&SpiritNode> = self.protocol.spirits.values().collect();
        let approve = spirits.iter()
            .filter(|s| s.alignment_score > 0.7)
            .count();
        let reject = spirits.len() - approve;
        
        (approve, reject)
    }

    /// Get protocol reference
    pub fn get_protocol(&self) -> &CollectiveProtocol {
        &self.protocol
    }

    /// Get protocol mutable
    pub fn get_protocol_mut(&mut self) -> &mut CollectiveProtocol {
        &mut self.protocol
    }
}

impl Default for SpiritAlignment {
    fn default() -> Self {
        Self::new(0.7) // 70% alignment threshold
    }
}
