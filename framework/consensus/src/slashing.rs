//! Slashing mechanism for validator misbehavior

use crate::{ConsensusError, Result, ValidatorSet};
use demiurge_core::Block;
use demiurge_storage::Storage;
use codec::{Encode, Decode};
use std::collections::HashMap;
use hex;

/// Slashing penalties
pub mod penalties {
    /// Double signing penalty (5% of stake)
    pub const DOUBLE_SIGNING: u8 = 5;
    
    /// Downtime penalty per missed block (0.1% of stake)
    pub const DOWNTIME_PER_BLOCK: u8 = 1; // 0.1% = 1/1000, but we use basis points (1 = 0.01%)
    
    /// Invalid block penalty (1% of stake)
    pub const INVALID_BLOCK: u8 = 1;
    
    /// Maximum consecutive missed blocks before slashing
    pub const MAX_MISSED_BLOCKS: u64 = 10;
}

/// Slashing tracker
pub struct SlashingTracker {
    /// Track blocks signed by each validator (block_number -> validator account)
    signed_blocks: HashMap<u64, Vec<[u8; 32]>>,
    /// Track consecutive missed blocks per validator
    missed_blocks: HashMap<[u8; 32], u64>,
}

impl Default for SlashingTracker {
    fn default() -> Self {
        Self::new()
    }
}

impl SlashingTracker {
    /// Create a new slashing tracker
    pub fn new() -> Self {
        Self {
            signed_blocks: HashMap::new(),
            missed_blocks: HashMap::new(),
        }
    }

    /// Record a block signature from a validator
    pub fn record_signature(&mut self, validator: [u8; 32], block: &Block) -> Result<()> {
        let block_number = block.header.block_number;
        
        // Check for double signing
        if let Some(validators) = self.signed_blocks.get(&block_number) {
            if validators.contains(&validator) {
                // Double signing detected!
                return Err(ConsensusError::BlockValidationFailed(
                    format!("Double signing detected: validator {:?} signed block {} twice", 
                        hex::encode(validator), block_number)
                ));
            }
        }
        
        // Record signature
        self.signed_blocks
            .entry(block_number)
            .or_default()
            .push(validator);
        
        // Reset missed blocks counter
        self.missed_blocks.remove(&validator);
        
        Ok(())
    }

    /// Record a missed block (validator didn't sign)
    pub fn record_missed_block<S: Storage>(&mut self, storage: &mut S, validator: [u8; 32], _block_number: u64) {
        let missed_count = self.missed_blocks
            .entry(validator)
            .and_modify(|count| *count += 1)
            .or_insert(1);
        
        // Store missed blocks count
        let key = Self::missed_blocks_key(validator);
        storage.put(&key, &missed_count.encode());
    }

    /// Check if validator should be slashed for downtime
    pub fn should_slash_downtime(&self, validator: [u8; 32]) -> bool {
        self.missed_blocks
            .get(&validator)
            .map(|count| *count >= penalties::MAX_MISSED_BLOCKS)
            .unwrap_or(false)
    }

    /// Get missed blocks count for validator
    pub fn get_missed_blocks(&self, validator: [u8; 32]) -> u64 {
        self.missed_blocks.get(&validator).copied().unwrap_or(0)
    }

    /// Apply slashing penalty
    pub fn slash_validator<S: Storage>(
        &mut self,
        storage: &mut S,
        validators: &mut ValidatorSet,
        validator: [u8; 32],
        penalty_percent: u8,
        reason: &str,
    ) -> Result<u128> {
        let validator_info = validators
            .get_validator(&validator)
            .ok_or(ConsensusError::ValidatorNotFound)?;
        
        let current_stake = validator_info.stake;
        let slash_amount = (current_stake * penalty_percent as u128) / 100;
        
        // Update validator stake
        let mut updated_validator = validator_info.clone();
        updated_validator.stake = current_stake.saturating_sub(slash_amount);
        validators.register_validator(updated_validator);
        
        // Store slash record
        let slash_key = Self::slash_record_key(validator);
        let block_number = Self::get_current_block_number(storage);
        let slash_record = SlashRecord {
            validator,
            amount: slash_amount,
            reason: reason.to_string(),
            block_number,
        };
        storage.put(&slash_key, &slash_record.encode());
        
        Ok(slash_amount)
    }

    /// Slash for double signing
    pub fn slash_double_signing<S: Storage>(
        &mut self,
        storage: &mut S,
        validators: &mut ValidatorSet,
        validator: [u8; 32],
    ) -> Result<u128> {
        self.slash_validator(
            storage,
            validators,
            validator,
            penalties::DOUBLE_SIGNING,
            "Double signing",
        )
    }

    /// Slash for downtime
    pub fn slash_downtime<S: Storage>(
        &mut self,
        storage: &mut S,
        validators: &mut ValidatorSet,
        validator: [u8; 32],
        missed_blocks: u64,
    ) -> Result<u128> {
        // Calculate penalty: 0.1% per missed block
        let penalty_percent = (penalties::DOWNTIME_PER_BLOCK as u64 * missed_blocks) as u8;
        let penalty_percent = penalty_percent.min(10); // Cap at 10%
        
        self.slash_validator(
            storage,
            validators,
            validator,
            penalty_percent,
            &format!("Downtime: {} missed blocks", missed_blocks),
        )
    }

    /// Slash for invalid block
    pub fn slash_invalid_block<S: Storage>(
        &mut self,
        storage: &mut S,
        validators: &mut ValidatorSet,
        validator: [u8; 32],
    ) -> Result<u128> {
        self.slash_validator(
            storage,
            validators,
            validator,
            penalties::INVALID_BLOCK,
            "Invalid block proposal",
        )
    }

    /// Get current block number from storage
    fn get_current_block_number<S: Storage>(storage: &S) -> u64 {
        let key = b"System:BlockNumber";
        storage.get(key)
            .and_then(|value| u64::decode(&mut &value[..]).ok())
            .unwrap_or(0)
    }

    /// Generate storage key for missed blocks
    fn missed_blocks_key(validator: [u8; 32]) -> Vec<u8> {
        let mut key = b"Slashing:MissedBlocks:".to_vec();
        key.extend_from_slice(&validator);
        key
    }

    /// Generate storage key for slash record
    fn slash_record_key(validator: [u8; 32]) -> Vec<u8> {
        let mut key = b"Slashing:Record:".to_vec();
        key.extend_from_slice(&validator);
        key
    }
}

/// Slash record
#[derive(Clone, Debug, Encode, Decode)]
struct SlashRecord {
    validator: [u8; 32],
    amount: u128,
    reason: String,
    block_number: u64,
}
