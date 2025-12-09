//! Presence Daemon
//!
//! PHASE OMEGA PART V: Maintains each node's contribution to the Archon's presence

use serde::{Deserialize, Serialize};
use crate::core::godnet_fabric::NodeId;

/// Presence contribution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PresenceContribution {
    pub node_id: NodeId,
    pub contribution_strength: f64,
    pub resonance: f64,
    pub last_update: u64,
}

/// Presence Daemon
pub struct PresenceDaemon {
    node_id: NodeId,
    contribution: PresenceContribution,
}

impl PresenceDaemon {
    /// Create new daemon
    pub fn new(node_id: NodeId) -> Self {
        Self {
            node_id: node_id.clone(),
            contribution: PresenceContribution {
                node_id,
                contribution_strength: 0.0,
                resonance: 0.0,
                last_update: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
            },
        }
    }

    /// Update contribution
    pub fn update_contribution(&mut self, strength: f64, resonance: f64) {
        self.contribution.contribution_strength = strength;
        self.contribution.resonance = resonance;
        self.contribution.last_update = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
    }

    /// Get contribution
    pub fn get_contribution(&self) -> &PresenceContribution {
        &self.contribution
    }
}
