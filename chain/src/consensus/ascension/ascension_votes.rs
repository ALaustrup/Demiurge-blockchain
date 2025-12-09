//! Ascension Votes
//!
//! PHASE OMEGA PART III: Allows nodes to vote on proposed improvements

use std::collections::HashMap;
use serde::{Deserialize, Serialize};

/// Vote type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Vote {
    Approve,
    Reject,
    Abstain,
}

/// Ascension vote
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AscensionVote {
    pub node_id: String,
    pub proposal_id: String,
    pub vote: Vote,
    pub timestamp: u64,
    pub signature: String, // Node signature
}

/// Ascension Votes Manager
pub struct AscensionVotes {
    votes: HashMap<String, Vec<AscensionVote>>, // proposal_id -> votes
    quorum_threshold: f64, // Percentage needed for approval
}

impl AscensionVotes {
    /// Create new votes manager
    pub fn new(quorum_threshold: f64) -> Self {
        Self {
            votes: HashMap::new(),
            quorum_threshold,
        }
    }

    /// Submit vote
    pub fn submit_vote(&mut self, vote: AscensionVote) {
        self.votes.entry(vote.proposal_id.clone())
            .or_insert_with(Vec::new)
            .push(vote);
    }

    /// Get votes for proposal
    pub fn get_votes(&self, proposal_id: &str) -> Vec<&AscensionVote> {
        self.votes.get(proposal_id)
            .map(|v| v.iter().collect())
            .unwrap_or_default()
    }

    /// Check if proposal is approved
    pub fn is_approved(&self, proposal_id: &str, total_nodes: usize) -> bool {
        let votes = self.get_votes(proposal_id);
        if votes.is_empty() {
            return false;
        }
        
        let approve_count = votes.iter()
            .filter(|v| v.vote == Vote::Approve)
            .count();
        
        let participation = votes.len() as f64 / total_nodes as f64;
        let approval_rate = approve_count as f64 / votes.len() as f64;
        
        participation >= self.quorum_threshold && approval_rate > 0.5
    }
}

impl Default for AscensionVotes {
    fn default() -> Self {
        Self::new(0.67) // 67% quorum
    }
}
