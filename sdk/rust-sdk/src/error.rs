/*!
 * Error types for Demiurge SDK
 */

use thiserror::Error;

pub type Result<T> = std::result::Result<T, DemiurgeError>;

#[derive(Error, Debug)]
pub enum DemiurgeError {
    #[error("RPC error: {0}")]
    Rpc(String),

    #[error("HTTP error: {0}")]
    Http(String),

    #[error("Serialization error: {0}")]
    Serialization(String),

    #[error("Invalid address: {0}")]
    InvalidAddress(String),

    #[error("Invalid username: {0}")]
    InvalidUsername(String),

    #[error("Signing error: {0}")]
    Signing(String),

    #[error("Transaction error: {0}")]
    Transaction(String),

    #[error("Other error: {0}")]
    Other(String),
}

impl From<reqwest::Error> for DemiurgeError {
    fn from(err: reqwest::Error) -> Self {
        DemiurgeError::Http(err.to_string())
    }
}

impl From<serde_json::Error> for DemiurgeError {
    fn from(err: serde_json::Error) -> Self {
        DemiurgeError::Serialization(err.to_string())
    }
}

