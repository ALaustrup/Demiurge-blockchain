//! Unified error types for the indexer.
//!
//! PHASE OMEGA: Production-grade error handling with retry logic support.

use thiserror::Error;
use std::fmt;

#[derive(Debug, Error)]
pub enum IndexerError {
    #[error("RPC error: {0}")]
    RpcError(String),

    #[error("Network error: {0}")]
    NetworkError(#[from] reqwest::Error),

    #[error("Serialization error: {0}")]
    SerializationError(String),

    #[error("Block parsing error: {0}")]
    BlockParseError(String),

    #[error("Database error: {0}")]
    DatabaseError(String),

    #[error("WASM execution error: {0}")]
    WasmError(String),

    #[error("Retry limit exceeded after {attempts} attempts")]
    RetryLimitExceeded { attempts: u32 },

    #[error("Integrity check failed: {0}")]
    IntegrityError(String),
}

/// Result type for indexer operations
pub type IndexerResult<T> = Result<T, IndexerError>;

/// Retry configuration
pub struct RetryConfig {
    pub max_attempts: u32,
    pub initial_delay_ms: u64,
    pub max_delay_ms: u64,
    pub backoff_multiplier: f64,
}

impl Default for RetryConfig {
    fn default() -> Self {
        Self {
            max_attempts: 5,
            initial_delay_ms: 1000,
            max_delay_ms: 30000,
            backoff_multiplier: 2.0,
        }
    }
}

/// Retry logic with exponential backoff
pub async fn retry_with_backoff<F, Fut, T>(
    operation: F,
    config: RetryConfig,
) -> IndexerResult<T>
where
    F: Fn() -> Fut,
    Fut: std::future::Future<Output = IndexerResult<T>>,
{
    let mut delay = config.initial_delay_ms;
    
    for attempt in 1..=config.max_attempts {
        match operation().await {
            Ok(result) => return Ok(result),
            Err(_e) => {
                if attempt == config.max_attempts {
                    return Err(IndexerError::RetryLimitExceeded {
                        attempts: config.max_attempts,
                    });
                }
                
                // Exponential backoff
                tokio::time::sleep(tokio::time::Duration::from_millis(delay)).await;
                delay = (delay as f64 * config.backoff_multiplier) as u64;
                delay = delay.min(config.max_delay_ms);
            }
        }
    }
    
    Err(IndexerError::RetryLimitExceeded {
        attempts: config.max_attempts,
    })
}
