//! Omnipresent Memory Layer
//!
//! PHASE OMEGA PART IV: Distributed memory across all nodes

pub mod distributed_memory_pool;
pub mod collective_memory;
pub mod memory_stitcher;

pub use distributed_memory_pool::{DistributedMemoryPool, MemoryChunk};
pub use collective_memory::{CollectiveMemory, CollectiveMemoryState};
pub use memory_stitcher::{MemoryStitcher, StitchedMemory};
