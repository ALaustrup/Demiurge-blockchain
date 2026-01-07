//! Demiurge chain node entry point.
//!
//! This is the main binary for the Demiurge L1 blockchain node.
//! Phase 2 features:
//! - JSON-RPC server (Axum) on http://127.0.0.1:8545
//! - RocksDB persistence
//! - Forge PoW verification
//!
//! Future phases will add:
//! - P2P networking
//! - Block production (mining)
//! - Runtime module execution

use std::path::PathBuf;
use std::sync::Arc;

use anyhow::{Result, Context};
use toml;
use tokio::net::TcpListener;

mod config;
mod config_loader;
mod core;
mod forge;
mod invariants;
mod node;
mod rpc;
mod runtime;
mod signature_guard;
mod state_root_sentinel;
mod archon;

use crate::node::Node;
use crate::rpc::rpc_router;
use crate::config_loader::{NodeConfig, GenesisConfig, load_validator_key, address_to_hex};

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing for structured logging
    tracing_subscriber::fmt().with_env_filter("info").init();

    // Determine config paths
    // Priority: 1) /opt/demiurge/configs/node.toml, 2) ./configs/node.devnet.toml, 3) defaults
    let node_config_path = if PathBuf::from("/opt/demiurge/configs/node.toml").exists() {
        PathBuf::from("/opt/demiurge/configs/node.toml")
    } else if PathBuf::from("./configs/node.devnet.toml").exists() {
        PathBuf::from("./configs/node.devnet.toml")
    } else {
        // Use defaults
        tracing::warn!("No config file found, using defaults");
        return run_with_defaults().await;
    };

    // Load node configuration
    let node_config = NodeConfig::from_file(&node_config_path)
        .context("Failed to load node configuration")?;

    // Load validator key
    let validator_key_path = PathBuf::from("/opt/demiurge/keys/validator.key");
    let (validator_address, _validator_signing_key) = if validator_key_path.exists() {
        load_validator_key(&validator_key_path)
            .context("Failed to load validator key")?
    } else {
        tracing::warn!("Validator key not found at {}, node will not produce blocks", validator_key_path.display());
        ([0u8; 32], [0u8; 32])
    };

    if validator_address != [0u8; 32] {
        tracing::info!("Validator address: {}", address_to_hex(&validator_address));
    }

    // Determine DB path from config (absolute or relative to working directory)
    let db_path = if node_config.node.db_path.starts_with('/') {
        PathBuf::from(&node_config.node.db_path)
    } else {
        std::env::current_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
            .join(&node_config.node.db_path)
    };
    std::fs::create_dir_all(&db_path)
        .context("Failed to create database directory")?;

    // Load and inject genesis config if specified
    if let Ok(genesis_path) = std::fs::canonicalize(
        node_config_path.parent()
            .unwrap_or(&PathBuf::from("."))
            .join(&node_config.genesis.genesis_config)
    ) {
        if let Ok(mut genesis_config) = GenesisConfig::from_file(&genesis_path) {
            // Inject validator address if placeholder exists and we have a validator
            if validator_address != [0u8; 32] {
                let validator_hex = address_to_hex(&validator_address);
                let needs_injection = genesis_config.validators.as_ref()
                    .map(|v| v.iter().any(|val| val.address == "validator_address_here" || val.address == "<YOUR_ADDRESS_FROM_KEYGEN>"))
                    .unwrap_or(false);
                
                if needs_injection {
                    genesis_config.inject_validator_address(&validator_hex);
                    // Write back the updated config
                    let updated_toml = toml::to_string_pretty(&genesis_config)
                        .context("Failed to serialize updated genesis config")?;
                    std::fs::write(&genesis_path, updated_toml)
                        .context("Failed to write updated genesis config")?;
                    tracing::info!("Injected validator address into genesis config");
                }
            }
            tracing::info!("Loaded genesis config from: {}", genesis_path.display());
        }
    }

    // Create node with RocksDB-backed state
    let node = Arc::new(Node::new(db_path.clone())
        .context("Failed to initialize node")?);

    tracing::info!(
        "Demiurge chain node starting - Chain: {} (ID: {})",
        node_config.chain.name,
        node_config.chain.chain_id
    );
    tracing::info!("Database path: {}", db_path.display());

    // Start JSON-RPC server
    let rpc_addr = format!("{}:{}", node_config.node.rpc_host, node_config.node.rpc_port);
    let addr: std::net::SocketAddr = rpc_addr.parse()
        .with_context(|| format!("Invalid RPC address: {}", rpc_addr))?;
    
    let listener = TcpListener::bind(&addr).await
        .with_context(|| format!("Failed to bind RPC server to {}", addr))?;
    let app = rpc_router(node);

    tracing::info!("JSON-RPC server listening on http://{}", addr);
    tracing::info!("Health check available at http://{}/health", addr);
    tracing::info!(
        "Available methods: cgt_getChainInfo, cgt_getBlockByHeight, cgt_sendRawTransaction, cgt_getBalance, cgt_*"
    );

    // Serve requests with graceful shutdown support
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    Ok(())
}

/// Run with default configuration (backward compatibility).
async fn run_with_defaults() -> Result<()> {
    let db_path = PathBuf::from(".demiurge/data");
    std::fs::create_dir_all(&db_path)?;

    let node = Arc::new(Node::new(db_path)?);
    tracing::info!("Demiurge chain node starting (default config)");

    let addr: std::net::SocketAddr = "0.0.0.0:8545".parse().unwrap();
    let listener = TcpListener::bind(addr).await?;
    let app = rpc_router(node);

    tracing::info!("JSON-RPC server listening on http://{}", addr);
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    Ok(())
}

/// Graceful shutdown signal handler
async fn shutdown_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("Failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("Failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {
            tracing::info!("Received Ctrl+C, shutting down gracefully...");
        },
        _ = terminate => {
            tracing::info!("Received SIGTERM, shutting down gracefully...");
        },
    }
}
