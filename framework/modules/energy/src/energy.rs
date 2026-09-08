//! Energy module implementation
//!
//! Provides gasless transactions through an energy system.
//! Energy regenerates over time and is consumed by transactions.

use crate::{EnergyError, Result};
use demiurge_modules::traits::{Module, ExecutionContext};
use demiurge_storage::Storage;
use codec::{Decode, Encode};
use scale_info::TypeInfo;
use std::vec::Vec;

/// Energy module - Gasless transaction system
pub struct EnergyModule;

impl Module for EnergyModule {
    fn name(&self) -> &'static str {
        "Energy"
    }

    fn version(&self) -> u32 {
        1
    }

    fn execute(
        &self,
        call: Vec<u8>,
        context: &ExecutionContext,
        storage: &dyn Storage,
    ) -> std::result::Result<(), demiurge_modules::traits::ModuleError> {
        let call_data: EnergyCall = Decode::decode(&mut &call[..])
            .map_err(|e| demiurge_modules::traits::ModuleError::InvalidCall(e.to_string()))?;

        let caller = context.caller;

        match call_data {
            EnergyCall::Consume { account, amount } => {
                // Can only consume own energy unless privileged
                if account != caller && !context.is_privileged {
                    return Err(demiurge_modules::traits::ModuleError::Unauthorized(
                        "Can only consume own energy".to_string()
                    ));
                }
                Self::consume_energy(storage, account, amount)
                    .map_err(|e| demiurge_modules::traits::ModuleError::ExecutionFailed(e.to_string()))?;
                Ok(())
            }
            EnergyCall::Regenerate { account } => {
                // Anyone can trigger regeneration for any account
                Self::regenerate_energy(storage, account)
                    .map_err(|e| demiurge_modules::traits::ModuleError::ExecutionFailed(e.to_string()))?;
                Ok(())
            }
            EnergyCall::Sponsor { developer, user } => {
                // Developer must be the caller
                if developer != caller {
                    return Err(demiurge_modules::traits::ModuleError::Unauthorized(
                        "Caller must be the developer sponsoring".to_string()
                    ));
                }
                Self::sponsor_transaction(storage, developer, user)
                    .map_err(|e| demiurge_modules::traits::ModuleError::ExecutionFailed(e.to_string()))?;
                Ok(())
            }
        }
    }

    fn on_initialize(
        &mut self,
        _block_number: u64,
        _storage: &dyn Storage,
    ) -> std::result::Result<(), demiurge_modules::traits::ModuleError> {
        // Note: Regenerating energy for all accounts on each block is expensive
        // In production, we'd use a lazy regeneration approach (regenerate on access)
        // For now, we'll regenerate on-demand when energy is accessed
        Ok(())
    }
}

impl EnergyModule {
    /// Consume energy from an account
    /// 
    /// Storage uses interior mutability - &dyn Storage works for writes.
    pub fn consume_energy(
        storage: &dyn Storage,
        account: [u8; 32],
        amount: u64,
    ) -> Result<()> {
        if amount == 0 {
            return Err(EnergyError::InvalidAmount);
        }

        // Regenerate energy first (lazy regeneration)
        Self::regenerate_energy(storage, account)?;

        let current_energy = Self::get_energy(storage, account)?;
        
        if current_energy < amount {
            return Err(EnergyError::InsufficientEnergy);
        }

        let new_energy = current_energy - amount;
        let current_block = Self::get_current_block(storage);
        Self::set_energy(storage, account, new_energy)?;
        Self::set_last_update(storage, account, current_block);

        Ok(())
    }

    /// Regenerate energy for an account based on blocks passed
    pub fn regenerate_energy(
        storage: &dyn Storage,
        account: [u8; 32],
    ) -> Result<()> {
        let current_block = Self::get_current_block(storage);
        let last_update = Self::get_last_update(storage, account);
        
        if current_block <= last_update {
            // No blocks passed, no regeneration needed
            return Ok(());
        }

        let blocks_passed = current_block - last_update;
        let energy_to_add = blocks_passed * constants::REGENERATION_RATE;
        
        let current_energy = Self::get_energy(storage, account)?;
        let new_energy = (current_energy + energy_to_add).min(constants::MAX_ENERGY);
        
        Self::set_energy(storage, account, new_energy)?;
        Self::set_last_update(storage, account, current_block);

        Ok(())
    }

    /// Sponsor a user's transaction (developer pays energy cost)
    pub fn sponsor_transaction(
        storage: &dyn Storage,
        developer: [u8; 32],
        _user: [u8; 32],
    ) -> Result<()> {
        // Consume energy from developer instead of user
        // This is a simple implementation - in production, we'd track sponsored transactions
        // For now, we'll just ensure developer has enough energy
        Self::regenerate_energy(storage, developer)?;
        
        let developer_energy = Self::get_energy(storage, developer)?;
        if developer_energy < constants::BASE_TX_COST {
            return Err(EnergyError::InsufficientEnergy);
        }

        // Consume from developer
        Self::consume_energy(storage, developer, constants::BASE_TX_COST)?;

        Ok(())
    }

    /// Get current energy for an account (with lazy regeneration)
    pub fn get_energy(storage: &dyn Storage, account: [u8; 32]) -> Result<u64> {
        let key = Self::energy_key(account);
        match storage.get(&key) {
            Some(value) => {
                <u64 as Decode>::decode(&mut &value[..])
                    .map_err(|_| EnergyError::StorageCorruption)
            }
            None => Ok(0), // Account has no energy yet
        }
    }

    /// Set energy for an account (uses interior mutability)
    fn set_energy(storage: &dyn Storage, account: [u8; 32], energy: u64) -> Result<()> {
        let key = Self::energy_key(account);
        let encoded = energy.encode();
        storage.put(&key, &encoded);
        Ok(())
    }

    /// Get last update block for an account
    fn get_last_update(storage: &dyn Storage, account: [u8; 32]) -> u64 {
        let key = Self::last_update_key(account);
        match storage.get(&key) {
            Some(value) => {
                <u64 as Decode>::decode(&mut &value[..]).unwrap_or(0)
            }
            None => 0,
        }
    }

    /// Set last update block for an account (uses interior mutability)
    fn set_last_update(storage: &dyn Storage, account: [u8; 32], block: u64) {
        let key = Self::last_update_key(account);
        let encoded = block.encode();
        storage.put(&key, &encoded);
    }

    /// Get current block number (placeholder - should come from runtime)
    fn get_current_block(storage: &dyn Storage) -> u64 {
        // TODO: Get from runtime/block number storage
        // For now, use a placeholder
        let key = b"System:BlockNumber";
        match storage.get(key) {
            Some(value) => {
                <u64 as Decode>::decode(&mut &value[..]).unwrap_or(0)
            }
            None => 0,
        }
    }

    /// Generate storage key for energy balance
    fn energy_key(account: [u8; 32]) -> Vec<u8> {
        let mut key = b"Energy:Account:".to_vec();
        key.extend_from_slice(&account);
        key
    }

    /// Generate storage key for last update block
    fn last_update_key(account: [u8; 32]) -> Vec<u8> {
        let mut key = b"Energy:LastUpdate:".to_vec();
        key.extend_from_slice(&account);
        key
    }
}

/// Energy module calls
#[derive(Clone, Debug, Encode, Decode, TypeInfo)]
pub enum EnergyCall {
    /// Consume energy for transaction
    Consume {
        account: [u8; 32],
        amount: u64,
    },
    /// Regenerate energy (called automatically)
    Regenerate {
        account: [u8; 32],
    },
    /// Sponsor user's transaction (developer pays)
    Sponsor {
        developer: [u8; 32],
        user: [u8; 32],
    },
}

/// Energy constants
pub mod constants {
    /// Maximum energy per account
    pub const MAX_ENERGY: u64 = 1000;

    /// Energy regeneration rate per block
    pub const REGENERATION_RATE: u64 = 10; // 10 energy per block

    /// Base transaction cost
    pub const BASE_TX_COST: u64 = 100;
}
