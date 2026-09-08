//! Qor Identity Error Types

use thiserror::Error;

pub type Result<T> = std::result::Result<T, QorError>;

#[derive(Error, Debug)]
pub enum QorError {
    #[error("Identity not found: {0}")]
    IdentityNotFound(String),
    
    #[error("Handle already taken: {0}")]
    HandleTaken(String),
    
    #[error("Handle not found: {0}")]
    HandleNotFound(String),
    
    #[error("Invalid handle format: {0}")]
    InvalidHandle(String),
    
    #[error("Invalid signature: {0}")]
    InvalidSignature(String),
    
    #[error("Not authorized: {0}")]
    NotAuthorized(String),
    
    #[error("Key rotation failed: {0}")]
    KeyRotationFailed(String),
    
    #[error("Invalid DID format: {0}")]
    InvalidDid(String),
    
    #[error("Encoding error: {0}")]
    EncodingError(String),
    
    #[error("Storage error: {0}")]
    StorageError(String),
}
