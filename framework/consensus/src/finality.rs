//! Finality mechanism - BFT finality

use crate::{ConsensusError, Result};
use demiurge_core::Block;
use std::collections::HashMap;

/// Finality tracker
pub struct Finality {
    finalized_blocks: HashMap<u64, [u8; 32]>, // block_number -> block_hash
    latest_finalized: u64,
}

impl Finality {
    pub fn new() -> Self {
        Self {
            finalized_blocks: HashMap::new(),
            latest_finalized: 0,
        }
    }

    /// Finalize a block
    pub fn finalize(&mut self, block: &Block) -> Result<()> {
        let block_number = block.header.block_number;
        let block_hash = block.hash();

        // Ensure we're finalizing in order
        if block_number != self.latest_finalized + 1 {
            return Err(ConsensusError::OutOfOrderFinalization {
                expected: self.latest_finalized + 1,
                got: block_number,
            });
        }

        self.finalized_blocks.insert(block_number, block_hash);
        self.latest_finalized = block_number;

        Ok(())
    }

    /// Check if block is finalized
    pub fn is_finalized(&self, block_number: u64) -> bool {
        self.finalized_blocks.contains_key(&block_number)
    }

    /// Get latest finalized block number
    pub fn latest_finalized(&self) -> u64 {
        self.latest_finalized
    }

    /// Get finalized block hash
    pub fn get_finalized_hash(&self, block_number: u64) -> Option<[u8; 32]> {
        self.finalized_blocks.get(&block_number).copied()
    }
}

impl Default for Finality {
    fn default() -> Self {
        Self::new()
    }
}
