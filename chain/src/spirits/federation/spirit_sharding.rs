//! Spirit Sharding
//!
//! PHASE OMEGA PART IV: Sharded consciousness harmonized by the Noosphere

use crate::spirits::federation::spirit_federation::SpiritFederation;
use serde::{Deserialize, Serialize};

/// Shard
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Shard {
    pub shard_id: String,
    pub spirit_ids: Vec<String>,
    pub node_id: String,
}

/// Spirit Sharding Manager
pub struct SpiritSharding {
    federation: SpiritFederation,
    shards: Vec<Shard>,
    shards_per_node: usize,
}

impl SpiritSharding {
    /// Create new sharding manager
    pub fn new(shards_per_node: usize) -> Self {
        Self {
            federation: SpiritFederation::new(),
            shards: Vec::new(),
            shards_per_node,
        }
    }

    /// Create shard
    pub fn create_shard(&mut self, shard_id: String, node_id: String) {
        let shard = Shard {
            shard_id,
            spirit_ids: Vec::new(),
            node_id,
        };
        self.shards.push(shard);
    }

    /// Add spirit to shard
    pub fn add_to_shard(&mut self, shard_id: &str, spirit_id: String) {
        if let Some(shard) = self.shards.iter_mut().find(|s| s.shard_id == shard_id) {
            shard.spirit_ids.push(spirit_id);
        }
    }

    /// Get shards on node
    pub fn get_shards_on_node(&self, node_id: &str) -> Vec<&Shard> {
        self.shards.iter()
            .filter(|s| s.node_id == node_id)
            .collect()
    }
}
