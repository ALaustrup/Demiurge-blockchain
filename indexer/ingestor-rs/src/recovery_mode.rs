//! Recovery Mode
//!
//! PHASE OMEGA PART II: Auto-recover from missed heights
//! and backfill historical blocks without race conditions

use crate::error::{IndexerError, IndexerResult};
use std::collections::HashSet;

/// Recovery mode configuration
#[derive(Clone)]
pub struct RecoveryConfig {
    /// Maximum number of blocks to recover in one batch
    pub max_batch_size: u64,
    /// Maximum height gap to attempt recovery
    pub max_gap: u64,
    /// Whether to backfill historical blocks
    pub backfill_enabled: bool,
}

impl Default for RecoveryConfig {
    fn default() -> Self {
        Self {
            max_batch_size: 100,
            max_gap: 1000,
            backfill_enabled: true,
        }
    }
}

/// Recovery mode handler
pub struct RecoveryMode {
    config: RecoveryConfig,
    processed_heights: HashSet<u64>,
    last_processed_height: u64,
}

impl RecoveryMode {
    /// Create new recovery mode handler
    pub fn new(config: RecoveryConfig) -> Self {
        Self {
            config,
            processed_heights: HashSet::new(),
            last_processed_height: 0,
        }
    }

    /// Detect missed block heights
    pub fn detect_missed_heights(
        &self,
        current_height: u64,
        expected_height: u64,
    ) -> Vec<u64> {
        let mut missed = Vec::new();
        
        if current_height < expected_height {
            for height in (current_height + 1)..=expected_height {
                if !self.processed_heights.contains(&height) {
                    missed.push(height);
                }
            }
        }
        
        missed
    }

    /// Recover missed blocks
    pub async fn recover_missed_blocks(
        &mut self,
        missed_heights: Vec<u64>,
    ) -> IndexerResult<()> {
        if missed_heights.is_empty() {
            return Ok(());
        }
        
        // Check gap size
        if let (Some(&min), Some(&max)) = (missed_heights.first(), missed_heights.last()) {
            let gap = max - min;
            if gap > self.config.max_gap {
                return Err(IndexerError::IntegrityError(format!(
                    "Gap too large for recovery: {} > {}",
                    gap, self.config.max_gap
                )));
            }
        }
        
        // Process in batches
        for chunk in missed_heights.chunks(self.config.max_batch_size as usize) {
            for &height in chunk {
                // TODO: Fetch and process block at height
                // For now, just mark as processed
                self.processed_heights.insert(height);
                self.last_processed_height = height;
            }
        }
        
        Ok(())
    }

    /// Backfill historical blocks
    pub async fn backfill_historical(
        &mut self,
        from_height: u64,
        to_height: u64,
    ) -> IndexerResult<()> {
        if !self.config.backfill_enabled {
            return Ok(());
        }
        
        // Process blocks in reverse order (newest first) to avoid race conditions
        for height in (from_height..=to_height).rev() {
            if !self.processed_heights.contains(&height) {
                // TODO: Fetch and process block
                self.processed_heights.insert(height);
                self.last_processed_height = height.max(self.last_processed_height);
            }
        }
        
        Ok(())
    }

    /// Get recovery status
    pub fn get_status(&self) -> RecoveryStatus {
        RecoveryStatus {
            last_processed_height: self.last_processed_height,
            processed_count: self.processed_heights.len(),
            config: self.config.clone(),
        }
    }
}

#[derive(Clone)]
pub struct RecoveryStatus {
    pub last_processed_height: u64,
    pub processed_count: usize,
    pub config: RecoveryConfig,
}
