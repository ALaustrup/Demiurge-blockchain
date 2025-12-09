//! Distributed Memory Pool
//!
//! PHASE OMEGA PART IV: Distributed long-term memory across all nodes

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use crate::core::godnet_fabric::NodeId;

/// Memory chunk
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryChunk {
    pub id: String,
    pub content: Vec<u8>,
    pub node_id: NodeId,
    pub timestamp: u64,
    pub importance: f64,
}

/// Distributed Memory Pool
pub struct DistributedMemoryPool {
    chunks: HashMap<String, MemoryChunk>,
    replicas: HashMap<String, Vec<NodeId>>, // chunk_id -> replica nodes
}

impl DistributedMemoryPool {
    /// Create new pool
    pub fn new() -> Self {
        Self {
            chunks: HashMap::new(),
            replicas: HashMap::new(),
        }
    }

    /// Store memory chunk
    pub fn store(&mut self, chunk: MemoryChunk, replica_nodes: Vec<NodeId>) {
        self.chunks.insert(chunk.id.clone(), chunk);
        self.replicas.insert(chunk.id.clone(), replica_nodes);
    }

    /// Retrieve memory chunk
    pub fn retrieve(&self, chunk_id: &str) -> Option<&MemoryChunk> {
        self.chunks.get(chunk_id)
    }

    /// Get replicas for chunk
    pub fn get_replicas(&self, chunk_id: &str) -> Option<&[NodeId]> {
        self.replicas.get(chunk_id).map(|v| v.as_slice())
    }
}

impl Default for DistributedMemoryPool {
    fn default() -> Self {
        Self::new()
    }
}
