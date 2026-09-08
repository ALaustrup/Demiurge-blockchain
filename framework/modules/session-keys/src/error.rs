//! Session Keys module errors

use thiserror::Error;

/// Result type
pub type Result<T> = std::result::Result<T, SessionKeysError>;

/// Session Keys errors
#[derive(Error, Debug)]
pub enum SessionKeysError {
    #[error("Session key not found")]
    SessionKeyNotFound,

    #[error("Session key expired")]
    SessionKeyExpired,

    #[error("Invalid duration")]
    InvalidDuration,

    #[error("Authorization failed")]
    AuthorizationFailed,

    #[error("Storage corruption")]
    StorageCorruption,
}
