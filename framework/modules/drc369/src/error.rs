//! DRC-369 module errors

use thiserror::Error;

/// Result type
pub type Result<T> = std::result::Result<T, Drc369Error>;

/// DRC-369 errors
#[derive(Error, Debug)]
pub enum Drc369Error {
    #[error("NFT not found")]
    NftNotFound,

    #[error("Not owner")]
    NotOwner,

    #[error("NFT is soulbound")]
    Soulbound,

    #[error("Invalid NFT ID")]
    InvalidNftId,

    #[error("Transfer failed: {0}")]
    TransferFailed(String),

    #[error("State update failed: {0}")]
    StateUpdateFailed(String),
    
    #[error("Physics validation failed: {0}")]
    PhysicsValidationFailed(String),
    
    #[error("Invalid metadata: {0}")]
    InvalidMetadata(String),
    
    #[error("Invalid royalty configuration: {0}")]
    InvalidRoyalty(String),
    
    #[error("CVP registration failed: {0}")]
    CvpRegistrationFailed(String),
    
    #[error("CVP mutation failed: {0}")]
    CvpMutationFailed(String),
}
