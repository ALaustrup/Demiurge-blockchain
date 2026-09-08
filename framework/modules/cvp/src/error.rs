//! CVP Error types

use thiserror::Error;

/// Result type for CVP operations
pub type Result<T> = std::result::Result<T, CvpError>;

/// CVP-specific errors
#[derive(Debug, Error)]
pub enum CvpError {
    /// Invalid Semantic IR
    #[error("Invalid Semantic IR: {0}")]
    InvalidSemanticIR(String),
    
    /// Compilation failed
    #[error("Compilation failed: {0}")]
    CompilationFailed(String),
    
    /// Mutation strategy error
    #[error("Mutation failed: {0}")]
    MutationFailed(String),
    
    /// Proof generation failed
    #[error("Proof generation failed: {0}")]
    ProofGenerationFailed(String),
    
    /// Proof verification failed
    #[error("Proof verification failed: {0}")]
    ProofVerificationFailed(String),
    
    /// Invalid proof format
    #[error("Invalid proof format")]
    InvalidProofFormat,
    
    /// Semantic equivalence violation
    #[error("Semantic equivalence violation: {0}")]
    EquivalenceViolation(String),
    
    /// Resource bounds exceeded
    #[error("Resource bounds exceeded: {0}")]
    ResourceBoundsExceeded(String),
    
    /// Invariant violation
    #[error("Invariant '{name}' violated: {reason}")]
    InvariantViolation {
        name: String,
        reason: String,
    },
    
    /// Contract not found
    #[error("Contract not found: {0}")]
    ContractNotFound(String),
    
    /// Epoch transition error
    #[error("Epoch transition failed: {0}")]
    EpochTransitionFailed(String),
    
    /// Encoding/decoding error
    #[error("Codec error: {0}")]
    CodecError(String),
    
    /// Storage error
    #[error("Storage error: {0}")]
    StorageError(String),
    
    /// Internal error
    #[error("Internal error: {0}")]
    InternalError(String),
}

impl From<codec::Error> for CvpError {
    fn from(err: codec::Error) -> Self {
        CvpError::CodecError(format!("{:?}", err))
    }
}
