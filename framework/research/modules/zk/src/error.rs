//! ZK module errors

use std::string::String;
use thiserror::Error;

/// Result type
pub type Result<T> = std::result::Result<T, ZkError>;

/// ZK errors
#[derive(Error, Debug)]
pub enum ZkError {
    #[error("Proof generation failed: {0}")]
    ProofGenerationFailed(String),

    #[error("Proof verification failed: {0}")]
    ProofVerificationFailed(String),

    #[error("Invalid proof format")]
    InvalidProofFormat,

    #[error("Invalid commitment")]
    InvalidCommitment,

    #[error("Not implemented")]
    NotImplemented,

    #[error("Trusted setup required")]
    TrustedSetupRequired,
}
