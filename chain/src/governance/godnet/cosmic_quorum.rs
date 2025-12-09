//! Cosmic Quorum
//!
//! PHASE OMEGA PART IV: Global governance with intent-weighted voting

use crate::governance::godnet::multi_node_governance::MultiNodeGovernance;
use serde::{Deserialize, Serialize};

/// Quorum state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuorumState {
    pub proposal_id: String,
    pub quorum_met: bool,
    pub participation: f64,
    pub approval_rate: f64,
}

/// Cosmic Quorum Manager
pub struct CosmicQuorum {
    governance: MultiNodeGovernance,
    quorum_threshold: f64,
}

impl CosmicQuorum {
    /// Create new quorum manager
    pub fn new(threshold: f64) -> Self {
        Self {
            governance: MultiNodeGovernance::new(),
            quorum_threshold: threshold,
        }
    }

    /// Check quorum
    pub fn check_quorum(&self, proposal_id: &str, total_nodes: usize) -> QuorumState {
        let votes = self.governance.get_votes();
        let quorum_met = votes.is_approved(proposal_id, total_nodes);
        
        // Calculate participation
        let vote_count = votes.votes.get(proposal_id)
            .map(|v| v.len())
            .unwrap_or(0);
        let participation = vote_count as f64 / total_nodes as f64;
        
        // Calculate approval rate
        let approval_rate = if let Some(votes_list) = votes.votes.get(proposal_id) {
            let approve = votes_list.iter().filter(|v| v.vote).count();
            approve as f64 / votes_list.len() as f64
        } else {
            0.0
        };
        
        QuorumState {
            proposal_id: proposal_id.to_string(),
            quorum_met,
            participation,
            approval_rate,
        }
    }

    /// Get governance reference
    pub fn get_governance(&self) -> &MultiNodeGovernance {
        &self.governance
    }
}

impl Default for CosmicQuorum {
    fn default() -> Self {
        Self::new(0.67) // 67% quorum
    }
}
