//! Error types

use std::string::String;
use thiserror::Error;
use demiurge_storage::backend::StorageError;

/// Result type
pub type Result<T> = std::result::Result<T, Error>;

/// Runtime errors
#[derive(Error, Debug)]
pub enum Error {
    #[error("Invalid transaction: {0}")]
    InvalidTransaction(String),

    #[error("Invalid block: {0}")]
    InvalidBlock(String),

    #[error("Module error: {0}")]
    ModuleError(String),

    #[error("Storage error: {0}")]
    StorageError(String),

    #[error("Storage backend error")]
    StorageBackendError(#[from] StorageError),

    #[error("Insufficient balance")]
    InsufficientBalance,

    #[error("Invalid signature")]
    InvalidSignature,

    #[error("Invalid nonce")]
    InvalidNonce,
}
