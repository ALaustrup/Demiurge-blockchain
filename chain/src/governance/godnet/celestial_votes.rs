//! Celestial Votes
//!
//! PHASE OMEGA PART IV: Multi-node voting with intent-weighted voting

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use crate::core::godnet_fabric::NodeId;

/// Celestial vote
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CelestialVote {
    pub node_id: NodeId,
    pub proposal_id: String,
    pub vote: bool, // approve/reject
    pub intent_weight: f64, // Weight of this vote
}

/// Celestial Votes Manager
pub struct CelestialVotes {
    votes: HashMap<String, Vec<CelestialVote>>, // proposal_id -> votes
    quorum_threshold: f64,
}

impl CelestialVotes {
    /// Create new votes manager
    pub fn new(quorum_threshold: f64) -> Self {
        Self {
            votes: HashMap::new(),
            quorum_threshold,
        }
    }

    /// Submit vote
    pub fn submit_vote(&mut self, vote: CelestialVote) {
        self.votes.entry(vote.proposal_id.clone())
            .or_insert_with(Vec::new)
            .push(vote);
    }

    /// Check if proposal is approved
    pub fn is_approved(&self, proposal_id: &str, total_nodes: usize) -> bool {
        let votes = self.votes.get(proposal_id).cloned().unwrap_or_default();
        if votes.is_empty() {
            return false;
        }
        
        // Intent-weighted voting
        let approve_weight: f64 = votes.iter()
            .filter(|v| v.vote)
            .map(|v| v.intent_weight)
            .sum();
        
        let total_weight: f64 = votes.iter()
            .map(|v| v.intent_weight)
            .sum();
        
        let participation = votes.len() as f64 / total_nodes as f64;
        let approval_rate = if total_weight > 0.0 {
            approve_weight / total_weight
        } else {
            0.0
        };
        
        participation >= self.quorum_threshold && approval_rate > 0.5
    }
}

impl Default for CelestialVotes {
    fn default() -> Self {
        Self::new(0.67) // 67% quorum
    }
}
