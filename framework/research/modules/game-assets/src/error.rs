//! Game Assets module errors

use thiserror::Error;

/// Result type
pub type Result<T> = std::result::Result<T, GameAssetsError>;

/// Game Assets errors
#[derive(Error, Debug)]
pub enum GameAssetsError {
    #[error("Asset type not found")]
    AssetTypeNotFound,

    #[error("Insufficient balance")]
    InsufficientBalance,

    #[error("Invalid game ID")]
    InvalidGameId,

    #[error("Transfer failed: {0}")]
    TransferFailed(String),
}
