//! Module trait definition
//!
//! All modules use interior mutability for storage operations.
//! The Storage trait provides thread-safe write operations via &self.

use demiurge_storage::Storage;
use thiserror::Error;

/// Execution context passed to module calls
/// 
/// Contains information about the transaction sender and execution environment.
#[derive(Clone, Debug)]
#[derive(Default)]
pub struct ExecutionContext {
    /// The account that signed and submitted the transaction (the "caller")
    pub caller: [u8; 32],
    /// Current block number
    pub block_number: u64,
    /// Current block timestamp (milliseconds since Unix epoch)
    pub timestamp: u64,
    /// Transaction nonce (for replay protection)
    pub nonce: u64,
    /// Whether this is a privileged/sudo call
    pub is_privileged: bool,
}

impl ExecutionContext {
    /// Create a new execution context
    pub fn new(caller: [u8; 32], block_number: u64, timestamp: u64, nonce: u64) -> Self {
        Self {
            caller,
            block_number,
            timestamp,
            nonce,
            is_privileged: false,
        }
    }
    
    /// Create a privileged execution context (for system operations)
    pub fn privileged(block_number: u64, timestamp: u64) -> Self {
        Self {
            caller: [0u8; 32], // System account
            block_number,
            timestamp,
            nonce: 0,
            is_privileged: true,
        }
    }
    
    /// Check if caller is the system/root account
    pub fn is_system(&self) -> bool {
        self.caller == [0u8; 32]
    }
}


/// Base trait for all modules
/// 
/// Storage uses interior mutability - all storage operations work through &dyn Storage.
/// This allows modules to be used in concurrent contexts without explicit locking.
pub trait Module: Send + Sync {
    /// Module name
    fn name(&self) -> &'static str;

    /// Module version
    fn version(&self) -> u32;

    /// Execute a call with execution context
    /// 
    /// The context provides the caller address, block info, and other metadata.
    /// Storage uses interior mutability for writes.
    fn execute(
        &self,
        call: Vec<u8>,
        context: &ExecutionContext,
        storage: &dyn Storage,
    ) -> Result<(), ModuleError>;

    /// Called at the start of each block
    /// 
    /// Use for initialization, cleanup of expired data, etc.
    fn on_initialize(&mut self, block_number: u64, storage: &dyn Storage) -> Result<(), ModuleError> {
        let _ = (block_number, storage);
        Ok(())
    }

    /// Called at the end of each block
    /// 
    /// Use for finalization, state updates that depend on all transactions.
    fn on_finalize(&mut self, block_number: u64, storage: &dyn Storage) -> Result<(), ModuleError> {
        let _ = (block_number, storage);
        Ok(())
    }
}

#[derive(Error, Debug)]
pub enum ModuleError {
    #[error("Invalid call: {0}")]
    InvalidCall(String),
    #[error("Execution failed: {0}")]
    ExecutionFailed(String),
    #[error("Unauthorized: {0}")]
    Unauthorized(String),
}
