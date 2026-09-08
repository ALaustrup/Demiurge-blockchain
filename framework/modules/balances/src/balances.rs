//! Balances module implementation

use crate::{BalancesError, Result};
use demiurge_modules::traits::{Module, ExecutionContext};
use demiurge_storage::Storage;
use codec::{Decode, Encode};
use constants::EXISTENTIAL_DEPOSIT;

/// Balances module
pub struct BalancesModule;

impl Module for BalancesModule {
    fn name(&self) -> &'static str {
        "Balances"
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
        // Decode call
        let call_data: BalanceCall = Decode::decode(&mut &call[..])
            .map_err(|e| demiurge_modules::traits::ModuleError::InvalidCall(e.to_string()))?;

        // Get caller from context
        let caller = context.caller;

        match call_data {
            BalanceCall::Transfer { from, to, amount } => {
                // Verify caller is the sender or has permission
                if from != caller && !context.is_privileged {
                    return Err(demiurge_modules::traits::ModuleError::Unauthorized(
                        "Caller is not the sender".to_string()
                    ));
                }
                Self::transfer(storage, from, to, amount)
                    .map_err(|e| demiurge_modules::traits::ModuleError::ExecutionFailed(e.to_string()))
            }
            BalanceCall::Mint { to, amount } => {
                // Only privileged calls can mint
                if !context.is_privileged {
                    return Err(demiurge_modules::traits::ModuleError::Unauthorized(
                        "Only privileged calls can mint".to_string()
                    ));
                }
                Self::mint(storage, to, amount)
                    .map_err(|e| demiurge_modules::traits::ModuleError::ExecutionFailed(e.to_string()))
            }
            BalanceCall::Burn { from, amount } => {
                // Verify caller owns the tokens or has permission
                if from != caller && !context.is_privileged {
                    return Err(demiurge_modules::traits::ModuleError::Unauthorized(
                        "Caller is not the token owner".to_string()
                    ));
                }
                Self::burn(storage, from, amount)
                    .map_err(|e| demiurge_modules::traits::ModuleError::ExecutionFailed(e.to_string()))
            }
        }
    }
}

impl BalancesModule {
    /// Transfer balance from one account to another
    /// 
    /// Storage uses interior mutability - &dyn Storage works for writes.
    // EXISTENTIAL_DEPOSIT is currently `CGT / 1000 == 0`, so clippy const-folds this check to always-false.
    #[allow(clippy::absurd_extreme_comparisons, clippy::impossible_comparisons)]
    pub fn transfer(
        storage: &dyn Storage,
        from: [u8; 32],
        to: [u8; 32],
        amount: u128,
    ) -> Result<()> {
        // Validate amount
        if amount == 0 {
            return Err(BalancesError::InvalidAmount);
        }

        // Get current balances
        let from_balance = Self::get_balance(storage, from)?;
        let to_balance = Self::get_balance(storage, to)?;

        // Check sufficient balance
        if from_balance < amount {
            return Err(BalancesError::InsufficientBalance);
        }

        // Calculate new balances
        let new_from_balance = from_balance - amount;
        let new_to_balance = to_balance + amount;

        // Check existential deposit for sender (if balance becomes non-zero, must maintain minimum)
        if new_from_balance > 0 && new_from_balance < EXISTENTIAL_DEPOSIT {
            return Err(BalancesError::ExistentialDepositViolation);
        }

        // Update balances
        Self::set_balance(storage, from, new_from_balance)?;
        Self::set_balance(storage, to, new_to_balance)?;

        Ok(())
    }

    /// Mint new tokens (governance only - TODO: add governance check)
    pub fn mint(
        storage: &dyn Storage,
        to: [u8; 32],
        amount: u128,
    ) -> Result<()> {
        // Validate amount
        if amount == 0 {
            return Err(BalancesError::InvalidAmount);
        }

        // Get current total supply and balance
        let total_supply = Self::get_total_supply(storage)?;
        let to_balance = Self::get_balance(storage, to)?;

        // Check total supply limit
        if total_supply.saturating_add(amount) > constants::TOTAL_SUPPLY {
            return Err(BalancesError::TotalSupplyExceeded);
        }

        // Update balances
        let new_to_balance = to_balance + amount;
        Self::set_balance(storage, to, new_to_balance)?;
        Self::set_total_supply(storage, total_supply + amount)?;

        Ok(())
    }

    /// Burn tokens
    // EXISTENTIAL_DEPOSIT is currently `CGT / 1000 == 0`, so clippy const-folds this check to always-false.
    #[allow(clippy::absurd_extreme_comparisons, clippy::impossible_comparisons)]
    pub fn burn(
        storage: &dyn Storage,
        from: [u8; 32],
        amount: u128,
    ) -> Result<()> {
        // Validate amount
        if amount == 0 {
            return Err(BalancesError::InvalidAmount);
        }

        // Get current balance
        let from_balance = Self::get_balance(storage, from)?;

        // Check sufficient balance
        if from_balance < amount {
            return Err(BalancesError::InsufficientBalance);
        }

        // Calculate new balance
        let new_from_balance = from_balance - amount;

        // Check existential deposit
        if new_from_balance > 0 && new_from_balance < EXISTENTIAL_DEPOSIT {
            return Err(BalancesError::ExistentialDepositViolation);
        }

        // Get total supply
        let total_supply = Self::get_total_supply(storage)?;

        // Update balances
        Self::set_balance(storage, from, new_from_balance)?;
        Self::set_total_supply(storage, total_supply.saturating_sub(amount))?;

        Ok(())
    }

    /// Get balance for an account
    pub fn get_balance(storage: &dyn Storage, account: [u8; 32]) -> Result<u128> {
        let key = Self::balance_key(account);
        match storage.get(&key) {
            Some(value) => {
                u128::decode(&mut &value[..])
                    .map_err(|_| BalancesError::StorageCorruption)
            }
            None => Ok(0), // Account doesn't exist, balance is 0
        }
    }

    /// Set balance for an account (uses interior mutability)
    fn set_balance(storage: &dyn Storage, account: [u8; 32], balance: u128) -> Result<()> {
        let key = Self::balance_key(account);
        let value = balance.encode();
        storage.put(&key, &value);
        Ok(())
    }

    /// Get total supply
    pub fn get_total_supply(storage: &dyn Storage) -> Result<u128> {
        use codec::Decode;
        let key = Self::total_supply_key();
        match storage.get(&key) {
            Some(value) => {
                <u128 as Decode>::decode(&mut &value[..])
                    .map_err(|_| BalancesError::StorageCorruption)
            }
            None => Ok(0), // No supply minted yet
        }
    }

    /// Set total supply (uses interior mutability)
    fn set_total_supply(storage: &dyn Storage, supply: u128) -> Result<()> {
        let key = Self::total_supply_key();
        let value = supply.encode();
        storage.put(&key, &value);
        Ok(())
    }

    /// Generate storage key for account balance
    fn balance_key(account: [u8; 32]) -> Vec<u8> {
        let mut key = b"Balances:Account:".to_vec();
        key.extend_from_slice(&account);
        key
    }

    /// Generate storage key for total supply
    fn total_supply_key() -> Vec<u8> {
        b"Balances:TotalSupply".to_vec()
    }
}

/// Balance module calls
#[derive(Clone, Debug, Encode, Decode)]
pub enum BalanceCall {
    /// Transfer CGT
    Transfer {
        from: [u8; 32], // Sender account
        to: [u8; 32],   // Recipient account
        amount: u128,   // Amount in Sparks (100 Sparks = 1 CGT)
    },
    /// Mint new CGT (governance only)
    Mint {
        to: [u8; 32],
        amount: u128,
    },
    /// Burn CGT
    Burn {
        from: [u8; 32],
        amount: u128,
    },
}

/// CGT constants
pub mod constants {
    /// Total supply: 13 billion CGT (fixed)
    pub const TOTAL_SUPPLY: u128 = 13_000_000_000 * 100; // In Sparks

    /// One CGT in Sparks
    pub const CGT: u128 = 100; // 100 Sparks = 1 CGT

    /// Smallest unit: 1 Spark = 0.01 CGT
    pub const SPARK: u128 = 1;

    /// Existential deposit: 0.001 CGT (prevents dust accounts)
    pub const EXISTENTIAL_DEPOSIT: u128 = CGT / 1000;
}
