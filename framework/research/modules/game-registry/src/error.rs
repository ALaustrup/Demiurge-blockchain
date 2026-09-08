//! Game registry errors

use thiserror::Error;

#[derive(Error, Debug)]
pub enum GameRegistryError {
    #[error("Game not found: {0}")]
    GameNotFound(String),

    #[error("Game already registered: {0}")]
    GameAlreadyExists(String),

    #[error("Insufficient stake: required {required}, provided {provided}")]
    InsufficientStake { required: u128, provided: u128 },

    #[error("Not authorized: {0}")]
    NotAuthorized(String),

    #[error("Invalid metadata: {0}")]
    InvalidMetadata(String),

    #[error("Game not approved")]
    GameNotApproved,

    #[error("Invalid category: {0}")]
    InvalidCategory(String),

    #[error("Invalid engine: {0}")]
    InvalidEngine(String),

    #[error("Storage error: {0}")]
    StorageError(String),

    #[error("Serialization error: {0}")]
    SerializationError(String),
}

impl From<serde_json::Error> for GameRegistryError {
    fn from(e: serde_json::Error) -> Self {
        GameRegistryError::SerializationError(e.to_string())
    }
}
