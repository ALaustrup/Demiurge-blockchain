//! Demiurge indexer ingestor.
//!
//! This binary connects to the Demiurge chain JSON-RPC endpoint and ingests
//! blocks and events. In Phase 4, this is a skeleton that can query chain info.
//! Later phases will add block persistence and event indexing.

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

    // Simple demo: poll chain info once at startup.
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
        .await?
        .json::<JsonRpcResponse<ChainInfoResult>>()
        .await?;

    if let Some(err) = resp.error {
        tracing::error!("RPC error: {} - {}", err.code, err.message);
    } else if let Some(info) = resp.result {
        tracing::info!("Chain height = {}", info.height);
    } else {
        tracing::warn!("No result from cgt_getChainInfo");
    }

    // Later phases: loop and ingest blocks & events into PostgreSQL.

    Ok(())
}
