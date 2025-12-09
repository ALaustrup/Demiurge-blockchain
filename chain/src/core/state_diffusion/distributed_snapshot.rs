//! Distributed Snapshot
//!
//! PHASE OMEGA PART IV: Maintains a global "Field State"

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use hex;
use crate::core::godnet_fabric::NodeId;

/// Field state snapshot
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldStateSnapshot {
    pub snapshot_id: String,
    pub timestamp: u64,
    pub node_states: HashMap<NodeId, NodeState>,
    pub global_state: GlobalState,
}

/// Node state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeState {
    pub node_id: NodeId,
    pub health: f64,
    pub state_hash: String,
    pub version: u64,
}

/// Global state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlobalState {
    pub consensus_hash: String,
    pub aggregate_health: f64,
    pub node_count: usize,
}

/// Distributed Snapshot Manager
pub struct DistributedSnapshot {
    snapshots: Vec<FieldStateSnapshot>,
    max_snapshots: usize,
}

impl DistributedSnapshot {
    /// Create new snapshot manager
    pub fn new(max_snapshots: usize) -> Self {
        Self {
            snapshots: Vec::new(),
            max_snapshots,
        }
    }

    /// Create snapshot
    pub fn create_snapshot(&mut self, node_states: HashMap<NodeId, NodeState>) -> FieldStateSnapshot {
        let aggregate_health: f64 = node_states.values()
            .map(|s| s.health)
            .sum::<f64>() / node_states.len() as f64;
        
        // Compute consensus hash
        let mut hasher = sha2::Sha256::new();
        for state in node_states.values() {
            hasher.update(state.state_hash.as_bytes());
        }
        let consensus_hash = hex::encode(hasher.finalize());
        
        let global_state = GlobalState {
            consensus_hash,
            aggregate_health,
            node_count: node_states.len(),
        };
        
        let snapshot = FieldStateSnapshot {
            snapshot_id: format!("snapshot_{}", 
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_nanos()
            ),
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            node_states,
            global_state,
        };
        
        self.snapshots.push(snapshot.clone());
        
        // Keep only recent snapshots
        if self.snapshots.len() > self.max_snapshots {
            self.snapshots.remove(0);
        }
        
        snapshot
    }

    /// Get latest snapshot
    pub fn get_latest(&self) -> Option<&FieldStateSnapshot> {
        self.snapshots.last()
    }

    /// Get snapshots
    pub fn get_snapshots(&self) -> &[FieldStateSnapshot] {
        &self.snapshots
    }
}

impl Default for DistributedSnapshot {
    fn default() -> Self {
        Self::new(100) // Keep last 100 snapshots
    }
}
