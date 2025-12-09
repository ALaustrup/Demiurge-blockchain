//! State Diffuser
//!
//! PHASE OMEGA PART IV: Spreads local knowledge across the God-Net

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use crate::core::godnet_fabric::NodeId;

/// State update
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StateUpdate {
    pub node_id: NodeId,
    pub key: String,
    pub value: Vec<u8>,
    pub timestamp: u64,
    pub version: u64,
}

/// State Diffuser
pub struct StateDiffuser {
    local_node_id: NodeId,
    state_updates: Vec<StateUpdate>,
    diffusion_radius: u32,
}

impl StateDiffuser {
    /// Create new diffuser
    pub fn new(local_node_id: NodeId, radius: u32) -> Self {
        Self {
            local_node_id,
            state_updates: Vec::new(),
            diffusion_radius: radius,
        }
    }

    /// Diffuse state update
    pub fn diffuse(&mut self, key: String, value: Vec<u8>) {
        let update = StateUpdate {
            node_id: self.local_node_id.clone(),
            key,
            value,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            version: 1,
        };
        
        self.state_updates.push(update);
    }

    /// Get pending updates
    pub fn get_pending_updates(&self) -> &[StateUpdate] {
        &self.state_updates
    }

    /// Clear processed updates
    pub fn clear_processed(&mut self, count: usize) {
        if count >= self.state_updates.len() {
            self.state_updates.clear();
        } else {
            self.state_updates.drain(0..count);
        }
    }

    /// Get diffusion radius
    pub fn get_radius(&self) -> u32 {
        self.diffusion_radius
    }
}
