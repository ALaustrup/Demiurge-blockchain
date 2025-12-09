//! Spirit Federation
//!
//! PHASE OMEGA PART IV: Allows spirits to migrate between nodes

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use crate::core::godnet_fabric::NodeId;

/// Spirit
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Spirit {
    pub id: String,
    pub current_node: NodeId,
    pub home_node: NodeId,
    pub state: Vec<u8>,
}

/// Spirit Federation
pub struct SpiritFederation {
    spirits: HashMap<String, Spirit>,
    migrations: Vec<Migration>,
}

/// Migration record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Migration {
    pub spirit_id: String,
    pub from_node: NodeId,
    pub to_node: NodeId,
    pub timestamp: u64,
}

impl SpiritFederation {
    /// Create new federation
    pub fn new() -> Self {
        Self {
            spirits: HashMap::new(),
            migrations: Vec::new(),
        }
    }

    /// Register spirit
    pub fn register_spirit(&mut self, spirit: Spirit) {
        self.spirits.insert(spirit.id.clone(), spirit);
    }

    /// Migrate spirit
    pub fn migrate(&mut self, spirit_id: &str, to_node: NodeId) -> bool {
        if let Some(spirit) = self.spirits.get_mut(spirit_id) {
            let from_node = spirit.current_node.clone();
            spirit.current_node = to_node.clone();
            
            self.migrations.push(Migration {
                spirit_id: spirit_id.to_string(),
                from_node,
                to_node,
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
            });
            
            true
        } else {
            false
        }
    }

    /// Get spirit
    pub fn get_spirit(&self, spirit_id: &str) -> Option<&Spirit> {
        self.spirits.get(spirit_id)
    }

    /// Get spirits on node
    pub fn get_spirits_on_node(&self, node_id: &NodeId) -> Vec<&Spirit> {
        self.spirits.values()
            .filter(|s| s.current_node == *node_id)
            .collect()
    }
}

impl Default for SpiritFederation {
    fn default() -> Self {
        Self::new()
    }
}
