//! Memory Stitcher
//!
//! PHASE OMEGA PART IV: Memory stitching to unify different perspectives

use crate::core::memory::global::distributed_memory_pool::DistributedMemoryPool;
use serde::{Deserialize, Serialize};

/// Stitched memory
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StitchedMemory {
    pub unified_content: Vec<u8>,
    pub source_chunks: Vec<String>,
    pub confidence: f64,
}

/// Memory Stitcher
pub struct MemoryStitcher {
    pool: DistributedMemoryPool,
}

impl MemoryStitcher {
    /// Create new stitcher
    pub fn new(pool: DistributedMemoryPool) -> Self {
        Self { pool }
    }

    /// Stitch memories
    pub fn stitch(&self, chunk_ids: &[String]) -> StitchedMemory {
        let mut unified = Vec::new();
        let mut sources = Vec::new();
        
        for chunk_id in chunk_ids {
            if let Some(chunk) = self.pool.retrieve(chunk_id) {
                unified.extend_from_slice(&chunk.content);
                sources.push(chunk_id.clone());
            }
        }
        
        StitchedMemory {
            unified_content: unified,
            source_chunks: sources,
            confidence: if sources.is_empty() { 0.0 } else { 0.8 },
        }
    }
}
