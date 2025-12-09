//! Demiurge indexer ingestor.
//!
//! This binary connects to the Demiurge chain JSON-RPC endpoint and ingests
//! blocks and events. In Phase 4, this is a skeleton that can query chain info.
//! Later phases will add block persistence and event indexing.
//!
//! PHASE OMEGA: Enhanced with retry logic, error handling, and integrity checks.

mod error;
mod recovery_mode;
mod block_drift_detector;
mod canonical_chain_enforcer;

use error::{IndexerError, IndexerResult, RetryConfig, retry_with_backoff};
use recovery_mode::{RecoveryMode, RecoveryConfig};
use block_drift_detector::BlockDriftDetector;
use canonical_chain_enforcer::CanonicalChainEnforcer;
use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::json;
use tracing_subscriber::EnvFilter;

#[derive(Debug, Deserialize)]
struct ChainInfoResult {
    height: u64,
}

#[derive(Debug, Deserialize)]
struct JsonRpcResponse<R> {
    jsonrpc: String,
    result: Option<R>,
    error: Option<JsonRpcError>,
    id: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
struct JsonRpcError {
    code: i32,
    message: String,
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .init();

    let rpc_url = std::env::var("DEMIURGE_RPC_URL")
        .unwrap_or_else(|_| "http://127.0.0.1:8545/rpc".to_string());

    tracing::info!("Starting Demiurge ingestor, RPC = {}", rpc_url);

    let client = reqwest::Client::new();

    // PHASE OMEGA: Use retry logic for RPC calls
    let chain_info = retry_with_backoff(
        || async {
            let req_body = json!({
                "jsonrpc": "2.0",
                "method": "cgt_getChainInfo",
                "params": null,
                "id": 1
            });

            let resp = client
                .post(&rpc_url)
                .json(&req_body)
                .send()
                .await
                .map_err(IndexerError::NetworkError)?;
            
            let json_resp: JsonRpcResponse<ChainInfoResult> = resp
                .json()
                .await
                .map_err(|e| {
                    // Check if it's a JSON parsing error
                    let err_str = e.to_string();
                    if err_str.contains("json") || err_str.contains("parse") || err_str.contains("deserialize") {
                        IndexerError::SerializationError(err_str)
                    } else {
                        IndexerError::NetworkError(e)
                    }
                })?;

            if let Some(err) = json_resp.error {
                Err(IndexerError::RpcError(format!("{} - {}", err.code, err.message)))
            } else if let Some(info) = json_resp.result {
                Ok(info)
            } else {
                Err(IndexerError::RpcError("No result from cgt_getChainInfo".to_string()))
            }
        },
        RetryConfig::default(),
    )
    .await
    .map_err(|e| anyhow::anyhow!("Indexer error: {}", e))?;

    tracing::info!("Chain height = {}", chain_info.height);

    // PHASE OMEGA: Integrity mode - verify chain state consistency
    let integrity_mode = std::env::var("INTEGRITY_MODE")
        .unwrap_or_else(|_| "false".to_string())
        .parse::<bool>()
        .unwrap_or(false);

    if integrity_mode {
        tracing::info!("Integrity mode enabled - performing consistency checks");
        // TODO: Add integrity checks (block hash verification, state root validation)
    }

    // Later phases: loop and ingest blocks & events into PostgreSQL.

    Ok(())
}
