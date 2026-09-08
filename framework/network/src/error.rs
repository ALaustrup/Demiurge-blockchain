//! Network errors

use thiserror::Error;

/// Result type
pub type Result<T> = std::result::Result<T, NetworkError>;

/// Network errors
#[derive(Error, Debug)]
pub enum NetworkError {
    #[error("Connection failed: {0}")]
    ConnectionFailed(String),

    #[error("Protocol error: {0}")]
    ProtocolError(String),

    #[error("Peer not found")]
    PeerNotFound,

    #[error("Message decode failed")]
    DecodeFailed,

    #[error("Pool full")]
    PoolFull,

    #[error("Invalid message")]
    InvalidMessage,
    
    #[error("Invalid address: {0}")]
    InvalidAddress(String),
    
    #[error("Connection timeout")]
    ConnectionTimeout,
    
    #[error("Discovery failed: {0}")]
    DiscoveryFailed(String),
}
