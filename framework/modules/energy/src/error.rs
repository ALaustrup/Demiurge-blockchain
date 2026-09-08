//! Energy module errors

use thiserror::Error;

/// Result type
pub type Result<T> = std::result::Result<T, EnergyError>;

/// Energy errors
#[derive(Error, Debug)]
pub enum EnergyError {
    #[error("Insufficient energy")]
    InsufficientEnergy,

    #[error("Account not found")]
    AccountNotFound,

    #[error("Energy regeneration failed")]
    RegenerationFailed,

    #[error("Invalid amount")]
    InvalidAmount,

    #[error("Storage corruption")]
    StorageCorruption,
}
