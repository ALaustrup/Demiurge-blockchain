//! Consensus errors

use std::string::String;
use thiserror::Error;
use demiurge_core::Error as CoreError;

/// Result type
pub type Result<T> = std::result::Result<T, ConsensusError>;

/// Consensus errors
#[derive(Error, Debug)]
pub enum ConsensusError {
    #[error("Invalid proposer")]
    InvalidProposer,

    #[error("Invalid validator")]
    InvalidValidator,

    #[error("Validator not found")]
    ValidatorNotFound,

    #[error("No validators available")]
    NoValidators,

    #[error("Insufficient signatures: required {required}, received {received}")]
    InsufficientSignatures { required: usize, received: usize },

    #[error("Timestamp too far in future")]
    TimestampTooFarInFuture,

    #[error("Timestamp too far in past")]
    TimestampTooFarInPast,

    #[error("Out of order finalization: expected {expected}, got {got}")]
    OutOfOrderFinalization { expected: u64, got: u64 },

    #[error("Invalid stake amount")]
    InvalidStakeAmount,

    #[error("Stake not found")]
    StakeNotFound,

    #[error("Insufficient stake: available {available}, requested {requested}")]
    InsufficientStake { available: u128, requested: u128 },

    #[error("Block validation failed: {0}")]
    BlockValidationFailed(String),

    #[error("Core error: {0}")]
    CoreError(#[from] CoreError),
    
    #[error("CVP error: {0}")]
    CvpError(String),
    
    #[error("Signing error: {0}")]
    SigningError(String),
}
