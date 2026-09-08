//! Validator set management

use crate::{ConsensusError, Result};
use std::collections::HashMap;
use ed25519_dalek::VerifyingKey;

/// Validator information
#[derive(Clone, Debug)]
pub struct Validator {
    pub account: [u8; 32],
    pub stake: u128,
    pub commission: u8, // Percentage (0-100)
    pub active: bool,
    pub public_key: VerifyingKey, // Ed25519 public key for block signing
}

/// Validator set
pub struct ValidatorSet {
    validators: HashMap<[u8; 32], Validator>,
    total_stake: u128,
}

impl ValidatorSet {
    pub fn new() -> Self {
        Self {
            validators: HashMap::new(),
            total_stake: 0,
        }
    }

    /// Add or update a validator
    pub fn register_validator(&mut self, validator: Validator) {
        if let Some(old) = self.validators.get(&validator.account) {
            self.total_stake -= old.stake;
        }
        self.total_stake += validator.stake;
        self.validators.insert(validator.account, validator);
    }

    /// Remove a validator
    pub fn remove_validator(&mut self, account: &[u8; 32]) -> Result<()> {
        if let Some(validator) = self.validators.remove(account) {
            self.total_stake -= validator.stake;
            Ok(())
        } else {
            Err(ConsensusError::ValidatorNotFound)
        }
    }

    /// Check if account is a validator
    pub fn is_validator(&self, account: &[u8; 32]) -> bool {
        self.validators
            .get(account)
            .map(|v| v.active)
            .unwrap_or(false)
    }

    /// Get validator count
    pub fn count(&self) -> usize {
        self.validators.len()
    }

    /// Select proposer based on stake (PoS)
    pub fn select_proposer(&self) -> Result<[u8; 32]> {
        if self.validators.is_empty() {
            return Err(ConsensusError::NoValidators);
        }

        // Weighted random selection based on stake
        // For now, simple round-robin (will be improved)
        let validators: Vec<_> = self.validators.keys().cloned().collect();
        Ok(validators[0]) // TODO: Implement proper weighted selection
    }

    /// Get total stake
    pub fn total_stake(&self) -> u128 {
        self.total_stake
    }

    /// Get validator
    pub fn get_validator(&self, account: &[u8; 32]) -> Option<&Validator> {
        self.validators.get(account)
    }

    /// Get validator's public key
    pub fn get_public_key(&self, account: &[u8; 32]) -> Option<&VerifyingKey> {
        self.validators.get(account).map(|v| &v.public_key)
    }

    /// Iterate over validators
    pub fn iter(&self) -> impl Iterator<Item = (&[u8; 32], &Validator)> {
        self.validators.iter()
    }
}

impl Default for ValidatorSet {
    fn default() -> Self {
        Self::new()
    }
}
