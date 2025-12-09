//! Block Drift Detector
//!
//! PHASE OMEGA PART II: Detects drift in block ingestion
//! and validates chain invariants before indexing

use crate::error::{IndexerError, IndexerResult};

/// Block drift detector
pub struct BlockDriftDetector {
    expected_height: u64,
    last_seen_height: u64,
    drift_threshold: u64,
}

impl BlockDriftDetector {
    /// Create new drift detector
    pub fn new(expected_height: u64, drift_threshold: u64) -> Self {
        Self {
            expected_height,
            last_seen_height: 0,
            drift_threshold,
        }
    }

    /// Detect drift in block ingestion
    pub fn detect_drift(&self, current_height: u64) -> IndexerResult<DriftInfo> {
        let drift = if current_height > self.expected_height {
            current_height - self.expected_height
        } else {
            self.expected_height - current_height
        };
        
        let is_drifted = drift > self.drift_threshold;
        
        Ok(DriftInfo {
            current_height,
            expected_height: self.expected_height,
            drift,
            is_drifted,
            direction: if current_height > self.expected_height {
                DriftDirection::Ahead
            } else if current_height < self.expected_height {
                DriftDirection::Behind
            } else {
                DriftDirection::Synced
            },
        })
    }

    /// Update expected height
    pub fn update_expected_height(&mut self, height: u64) {
        self.expected_height = height;
    }

    /// Update last seen height
    pub fn update_last_seen(&mut self, height: u64) {
        self.last_seen_height = height;
    }

    /// Validate chain invariants before indexing
    pub fn validate_chain_invariants(&self, block_height: u64) -> IndexerResult<()> {
        // PHASE OMEGA PART II: Validate invariants before indexing
        
        // Height must be increasing
        if block_height <= self.last_seen_height {
            return Err(IndexerError::IntegrityError(format!(
                "Height regression: {} <= {}",
                block_height, self.last_seen_height
            )));
        }
        
        // Height must be reasonable (not too far ahead)
        if block_height > self.expected_height + self.drift_threshold {
            return Err(IndexerError::IntegrityError(format!(
                "Height too far ahead: {} > {} + {}",
                block_height, self.expected_height, self.drift_threshold
            )));
        }
        
        Ok(())
    }
}

#[derive(Debug, Clone)]
pub struct DriftInfo {
    pub current_height: u64,
    pub expected_height: u64,
    pub drift: u64,
    pub is_drifted: bool,
    pub direction: DriftDirection,
}

#[derive(Debug, Clone, Copy)]
pub enum DriftDirection {
    Ahead,
    Behind,
    Synced,
}
