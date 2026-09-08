//! # Agentic Layer Errors

use alloc::string::String;
use crate::wallet::ActionType;

/// Errors for the Agentic Integration Layer
#[derive(Debug, Clone)]
pub enum AgenticError {
    /// Invalid DID format
    InvalidDid(String),
    
    /// Agent not found
    AgentNotFound,
    
    /// Agent already exists
    AgentAlreadyExists,
    
    /// Agent has been deactivated
    AgentDeactivated(String),
    
    /// Not authorized to perform action
    NotAuthorized,
    
    /// Wallet is locked
    WalletLocked,
    
    /// Action not allowed for this agent
    ActionNotAllowed(ActionType),
    
    /// Spending limit exceeded
    SpendingLimitExceeded,
    
    /// Approval required for this action
    ApprovalRequired,
    
    /// Approval not found
    ApprovalNotFound,
    
    /// Approval expired
    ApprovalExpired,
    
    /// Model already registered
    ModelAlreadyRegistered,
    
    /// Model not found
    ModelNotFound,
    
    /// Insufficient quorum
    InsufficientQuorum,
    
    /// Invalid proof
    InvalidProof,
    
    /// Memory not found
    MemoryNotFound,
    
    /// Memory limit reached
    MemoryLimitReached,
    
    /// Invalid embedding dimension
    InvalidEmbeddingDimension,
    
    /// Serialization error
    SerializationError(String),
    
    /// Signing operation failed
    SigningFailed(String),
    
    /// Internal error
    InternalError(String),
}

impl core::fmt::Display for AgenticError {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        match self {
            Self::InvalidDid(msg) => write!(f, "Invalid DID: {}", msg),
            Self::AgentNotFound => write!(f, "Agent not found"),
            Self::AgentAlreadyExists => write!(f, "Agent already exists"),
            Self::AgentDeactivated(reason) => write!(f, "Agent deactivated: {}", reason),
            Self::NotAuthorized => write!(f, "Not authorized"),
            Self::WalletLocked => write!(f, "Wallet is locked"),
            Self::ActionNotAllowed(action) => write!(f, "Action not allowed: {:?}", action),
            Self::SpendingLimitExceeded => write!(f, "Spending limit exceeded"),
            Self::ApprovalRequired => write!(f, "Controller approval required"),
            Self::ApprovalNotFound => write!(f, "Approval not found"),
            Self::ApprovalExpired => write!(f, "Approval expired"),
            Self::ModelAlreadyRegistered => write!(f, "Model already registered"),
            Self::ModelNotFound => write!(f, "Model not found"),
            Self::InsufficientQuorum => write!(f, "Insufficient sentinel quorum"),
            Self::InvalidProof => write!(f, "Invalid compute proof"),
            Self::MemoryNotFound => write!(f, "Memory not found"),
            Self::MemoryLimitReached => write!(f, "Memory limit reached"),
            Self::InvalidEmbeddingDimension => write!(f, "Invalid embedding dimension"),
            Self::SerializationError(msg) => write!(f, "Serialization error: {}", msg),
            Self::SigningFailed(msg) => write!(f, "Signing failed: {}", msg),
            Self::InternalError(msg) => write!(f, "Internal error: {}", msg),
        }
    }
}

#[cfg(feature = "std")]
impl std::error::Error for AgenticError {}
