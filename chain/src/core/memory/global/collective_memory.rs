//! Collective Memory
//!
//! PHASE OMEGA PART IV: Unified memory across the God-Net

use crate::core::memory::global::distributed_memory_pool::DistributedMemoryPool;
use serde::{Deserialize, Serialize};

/// Collective memory state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectiveMemoryState {
    pub total_chunks: usize,
    pub total_nodes: usize,
    pub average_importance: f64,
}

/// Collective Memory Manager
pub struct CollectiveMemory {
    pool: DistributedMemoryPool,
}

impl CollectiveMemory {
    /// Create new collective memory
    pub fn new() -> Self {
        Self {
            pool: DistributedMemoryPool::new(),
        }
    }

    /// Get collective state
    pub fn get_state(&self) -> CollectiveMemoryState {
        let chunks = &self.pool.chunks;
        let total_importance: f64 = chunks.values().map(|c| c.importance).sum();
        let avg_importance = if chunks.is_empty() {
            0.0
        } else {
            total_importance / chunks.len() as f64
        };
        
        CollectiveMemoryState {
            total_chunks: chunks.len(),
            total_nodes: 0, // Would track actual nodes
            average_importance: avg_importance,
        }
    }

    /// Get pool reference
    pub fn get_pool(&self) -> &DistributedMemoryPool {
        &self.pool
    }
}

impl Default for CollectiveMemory {
    fn default() -> Self {
        Self::new()
    }
}
