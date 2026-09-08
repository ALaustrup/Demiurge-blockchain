//! Balances module errors

use thiserror::Error;

/// Result type
pub type Result<T> = std::result::Result<T, BalancesError>;

/// Balances errors
#[derive(Error, Debug)]
pub enum BalancesError {
    #[error("Insufficient balance")]
    InsufficientBalance,

    #[error("Invalid amount")]
    InvalidAmount,

    #[error("Existential deposit violation")]
    ExistentialDepositViolation,

    #[error("Total supply exceeded")]
    TotalSupplyExceeded,

    #[error("Storage corruption")]
    StorageCorruption,
}
