//! RPC errors

use thiserror::Error;
use jsonrpsee::core::Error as JsonRpcError;
use jsonrpsee::types::ErrorObjectOwned;

/// Result type
pub type Result<T> = std::result::Result<T, RpcError>;

/// RPC errors
#[derive(Error, Debug)]
pub enum RpcError {
    #[error("Server error: {0}")]
    ServerError(String),

    #[error("Method not found")]
    MethodNotFound,

    #[error("Invalid parameters")]
    InvalidParams,

    #[error("Internal error: {0}")]
    InternalError(String),

    #[error("Not implemented")]
    NotImplemented,

    #[error("Subscription error: {0}")]
    SubscriptionError(String),

    #[error("Storage error: {0}")]
    StorageError(String),

    #[error("Not found: {0}")]
    NotFound(String),
    
    #[error("Invalid transaction: {0}")]
    InvalidTransaction(String),
    
    #[error("Transaction pool full")]
    PoolFull,
}

impl From<RpcError> for ErrorObjectOwned {
    fn from(err: RpcError) -> Self {
        let (code, message) = match err {
            RpcError::MethodNotFound => (-32601, "Method not found".to_string()),
            RpcError::InvalidParams => (-32602, "Invalid parameters".to_string()),
            RpcError::NotImplemented => (-32601, "Method not found".to_string()),
            RpcError::NotFound(msg) => (-32602, msg),
            RpcError::InvalidTransaction(msg) => (-32010, format!("Invalid transaction: {}", msg)),
            RpcError::PoolFull => (-32011, "Transaction pool is full".to_string()),
            RpcError::ServerError(msg) | RpcError::InternalError(msg) | RpcError::StorageError(msg) | RpcError::SubscriptionError(msg) => {
                (-32603, msg)
            }
        };
        ErrorObjectOwned::owned(code, message, None::<()>)
    }
}

impl From<RpcError> for JsonRpcError {
    fn from(err: RpcError) -> Self {
        let error_obj: ErrorObjectOwned = err.into();
        JsonRpcError::Call(error_obj)
    }
}

// Helper functions for creating JSON-RPC errors
pub fn invalid_params(msg: &str) -> ErrorObjectOwned {
    ErrorObjectOwned::from(RpcError::NotFound(msg.to_string()))
}

pub fn method_not_found() -> ErrorObjectOwned {
    ErrorObjectOwned::from(RpcError::MethodNotFound)
}

pub fn internal_error(msg: &str) -> ErrorObjectOwned {
    ErrorObjectOwned::from(RpcError::InternalError(msg.to_string()))
}
