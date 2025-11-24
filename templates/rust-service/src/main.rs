/*!
 * Demiurge Rust Service Template
 * 
 * Example Axum server that integrates with Demiurge Blockchain.
 */

use axum::{
    extract::Path,
    http::StatusCode,
    response::Json,
    routing::get,
    Router,
};
use demiurge_rust_sdk::DemiurgeSDK;
use serde_json::{json, Value};
use std::env;

const DEFAULT_RPC_URL: &str = "http://127.0.0.1:8545/rpc";

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let rpc_url = env::var("DEMIURGE_RPC_URL")
        .unwrap_or_else(|_| DEFAULT_RPC_URL.to_string());
    
    let sdk = DemiurgeSDK::new(&rpc_url);

    let app = Router::new()
        .route("/", get(health))
        .route("/urgeid/:address", get(get_urgeid_profile))
        .route("/cgt/balance/:address", get(get_cgt_balance))
        .route("/nfts/:address", get(get_nfts))
        .with_state(sdk);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001").await?;
    println!("Server running on http://0.0.0.0:3001");
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health() -> Json<Value> {
    Json(json!({ "status": "ok", "service": "demiurge-rust-service" }))
}

async fn get_urgeid_profile(
    Path(address): Path<String>,
    axum::extract::State(sdk): axum::extract::State<DemiurgeSDK>,
) -> Result<Json<Value>, StatusCode> {
    match sdk.urgeid().get_profile(&address).await {
        Ok(profile) => Ok(Json(json!(profile))),
        Err(_) => Err(StatusCode::NOT_FOUND),
    }
}

async fn get_cgt_balance(
    Path(address): Path<String>,
    axum::extract::State(sdk): axum::extract::State<DemiurgeSDK>,
) -> Result<Json<Value>, StatusCode> {
    match sdk.cgt().get_balance(&address).await {
        Ok(balance) => Ok(Json(json!({ "address": address, "balance": balance }))),
        Err(_) => Err(StatusCode::NOT_FOUND),
    }
}

async fn get_nfts(
    Path(address): Path<String>,
    axum::extract::State(sdk): axum::extract::State<DemiurgeSDK>,
) -> Result<Json<Value>, StatusCode> {
    match sdk.nft().get_nfts_by_owner(&address).await {
        Ok(nfts) => Ok(Json(json!({ "address": address, "nfts": nfts }))),
        Err(_) => Err(StatusCode::NOT_FOUND),
    }
}

