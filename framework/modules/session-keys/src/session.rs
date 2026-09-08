//! Session keys implementation
//!
//! Allows users to authorize temporary session keys for gaming and dApp use.
//! Session keys can perform limited actions without requiring the main private key.

use crate::{SessionKeysError, Result};
use demiurge_modules::traits::{Module, ExecutionContext};
use demiurge_storage::Storage;
use codec::{Decode, Encode};
use scale_info::TypeInfo;
use std::vec::Vec;

/// Session Keys module - Temporary key authorization for gasless gaming
pub struct SessionKeysModule;

impl Module for SessionKeysModule {
    fn name(&self) -> &'static str {
        "SessionKeys"
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
        let call_data: SessionCall = Decode::decode(&mut &call[..])
            .map_err(|e| demiurge_modules::traits::ModuleError::InvalidCall(e.to_string()))?;

        let caller = context.caller;

        match call_data {
            SessionCall::Authorize { primary_account, session_key, duration } => {
                // Only the primary account owner can authorize session keys
                if primary_account != caller {
                    return Err(demiurge_modules::traits::ModuleError::Unauthorized(
                        "Only the account owner can authorize session keys".to_string()
                    ));
                }
                Self::authorize_session_key(storage, primary_account, session_key, duration)
                    .map_err(|e| demiurge_modules::traits::ModuleError::ExecutionFailed(e.to_string()))?;
                Ok(())
            }
            SessionCall::Revoke { primary_account, session_key } => {
                // Only the primary account owner can revoke session keys
                if primary_account != caller {
                    return Err(demiurge_modules::traits::ModuleError::Unauthorized(
                        "Only the account owner can revoke session keys".to_string()
                    ));
                }
                Self::revoke_session_key(storage, primary_account, session_key)
                    .map_err(|e| demiurge_modules::traits::ModuleError::ExecutionFailed(e.to_string()))?;
                Ok(())
            }
        }
    }

    fn on_initialize(
        &mut self,
        block_number: u64,
        storage: &dyn Storage,
    ) -> std::result::Result<(), demiurge_modules::traits::ModuleError> {
        // Auto-expire expired session keys
        // Note: In production, we'd use a more efficient approach (indexed by expiry)
        // For now, we'll clean up on-demand when checking validity
        Self::cleanup_expired_keys(storage, block_number)
            .map_err(|e| demiurge_modules::traits::ModuleError::ExecutionFailed(e.to_string()))?;
        Ok(())
    }
}

impl SessionKeysModule {
    /// Authorize a session key for a primary account
    /// 
    /// Storage uses interior mutability - &dyn Storage works for writes.
    pub fn authorize_session_key(
        storage: &dyn Storage,
        primary_account: [u8; 32],
        session_key: [u8; 32],
        duration: u64,
    ) -> Result<()> {
        // Validate duration
        if duration == 0 {
            return Err(SessionKeysError::InvalidDuration);
        }

        if duration > constants::MAX_SESSION_DURATION {
            return Err(SessionKeysError::InvalidDuration);
        }

        // Check if session key already exists
        if Self::is_session_key_valid(storage, primary_account, session_key)? {
            return Err(SessionKeysError::AuthorizationFailed);
        }

        // Calculate expiry block
        let current_block = Self::get_current_block(storage);
        let expiry_block = current_block + duration;

        // Store session key with expiry
        Self::set_session_key(storage, primary_account, session_key, expiry_block)?;

        Ok(())
    }

    /// Revoke a session key
    pub fn revoke_session_key(
        storage: &dyn Storage,
        primary_account: [u8; 32],
        session_key: [u8; 32],
    ) -> Result<()> {
        // Check if session key exists
        if !Self::session_key_exists(storage, primary_account, session_key) {
            return Err(SessionKeysError::SessionKeyNotFound);
        }

        // Delete session key
        Self::delete_session_key(storage, primary_account, session_key);

        Ok(())
    }

    /// Check if a session key is valid (exists and not expired)
    pub fn is_session_key_valid(
        storage: &dyn Storage,
        primary_account: [u8; 32],
        session_key: [u8; 32],
    ) -> Result<bool> {
        let expiry_block = match Self::get_session_key_expiry(storage, primary_account, session_key) {
            Some(expiry) => expiry,
            None => return Ok(false),
        };

        let current_block = Self::get_current_block(storage);
        Ok(current_block < expiry_block)
    }

    /// Get expiry block for a session key
    fn get_session_key_expiry(
        storage: &dyn Storage,
        primary_account: [u8; 32],
        session_key: [u8; 32],
    ) -> Option<u64> {
        let key = Self::session_key_storage_key(primary_account, session_key);
        storage.get(&key).and_then(|value| {
            <u64 as Decode>::decode(&mut &value[..]).ok()
        })
    }

    /// Check if session key exists (regardless of expiry)
    fn session_key_exists(
        storage: &dyn Storage,
        primary_account: [u8; 32],
        session_key: [u8; 32],
    ) -> bool {
        Self::get_session_key_expiry(storage, primary_account, session_key).is_some()
    }

    /// Set session key with expiry block (uses interior mutability)
    fn set_session_key(
        storage: &dyn Storage,
        primary_account: [u8; 32],
        session_key: [u8; 32],
        expiry_block: u64,
    ) -> Result<()> {
        let key = Self::session_key_storage_key(primary_account, session_key);
        let encoded = expiry_block.encode();
        storage.put(&key, &encoded);
        Ok(())
    }

    /// Delete session key (uses interior mutability)
    fn delete_session_key(
        storage: &dyn Storage,
        primary_account: [u8; 32],
        session_key: [u8; 32],
    ) {
        let key = Self::session_key_storage_key(primary_account, session_key);
        storage.delete(&key);
    }

    /// Cleanup expired session keys
    /// Note: This is a simplified implementation. In production, we'd use an index
    /// to efficiently find expired keys without scanning all keys.
    fn cleanup_expired_keys(
        _storage: &dyn Storage,
        _current_block: u64,
    ) -> Result<()> {
        // In a production system, we'd maintain an index of keys by expiry block
        // For now, we'll rely on lazy cleanup (checking validity on access)
        // This function is a placeholder for future optimization
        Ok(())
    }

    /// Get current block number (placeholder - should come from runtime)
    fn get_current_block(storage: &dyn Storage) -> u64 {
        // TODO: Get from runtime/block number storage
        let key = b"System:BlockNumber";
        match storage.get(key) {
            Some(value) => {
                <u64 as Decode>::decode(&mut &value[..]).unwrap_or(0)
            }
            None => 0,
        }
    }

    /// Generate storage key for session key
    fn session_key_storage_key(primary_account: [u8; 32], session_key: [u8; 32]) -> Vec<u8> {
        let mut key = b"SessionKeys:".to_vec();
        key.extend_from_slice(&primary_account);
        key.push(b':');
        key.extend_from_slice(&session_key);
        key
    }
}

/// Session keys module calls
#[derive(Clone, Debug, Encode, Decode, TypeInfo)]
pub enum SessionCall {
    /// Authorize a session key
    Authorize {
        primary_account: [u8; 32],
        session_key: [u8; 32],
        duration: u64, // Duration in blocks
    },
    /// Revoke a session key
    Revoke {
        primary_account: [u8; 32],
        session_key: [u8; 32],
    },
}

/// Session keys constants
pub mod constants {
    /// Maximum session duration in blocks
    /// 7 days at 1 block/second = 604,800 blocks
    /// Using a more conservative 100,800 blocks (about 1.16 days)
    pub const MAX_SESSION_DURATION: u64 = 100_800;
}
