//! # Demiurge Node
//!
//! The full node implementation - ties everything together.
//! The flame burns eternal. The code serves the will.

use clap::{Parser, Subcommand};
use demiurge_node::{NodeConfig, NodeService, GenesisConfig};
use ed25519_dalek::{SigningKey, VerifyingKey};
use tracing::info;
use std::path::PathBuf;

/// Demiurge Blockchain Node
#[derive(Parser, Debug)]
#[command(name = "demiurge-node")]
#[command(about = "Demiurge Blockchain Full Node", long_about = None)]
struct Args {
    #[command(subcommand)]
    command: Option<Commands>,

    /// Data directory
    #[arg(short, long, default_value = "./data")]
    data_dir: String,

    /// RPC address (use 0.0.0.0:9944 for external access)
    #[arg(short, long, default_value = "0.0.0.0:9944")]
    rpc_addr: String,

    /// P2P address
    #[arg(short, long, default_value = "0.0.0.0:30333")]
    p2p_addr: String,

    /// Block time in milliseconds
    #[arg(short, long, default_value = "1000")]
    block_time: u64,

    /// Enable RPC server
    #[arg(long, default_value = "true")]
    rpc: bool,

    /// Enable P2P networking
    #[arg(long, default_value = "true")]
    p2p: bool,

    /// Genesis configuration file (JSON)
    #[arg(long)]
    genesis: Option<String>,

    /// Validator key file (JSON) - enables validator mode
    #[arg(long)]
    validator_key: Option<String>,

    /// Bootstrap peer addresses (comma-separated multiaddrs)
    #[arg(long)]
    bootstrap_peers: Option<String>,
}

#[derive(Subcommand, Debug)]
// Variant names double as the CLI subcommand names (`generate-key`, `show-key`, ...); renaming would break the CLI.
#[allow(clippy::enum_variant_names)]
enum Commands {
    /// Generate a new validator key pair
    GenerateKey {
        /// Output file for the private key (default: stdout as JSON)
        #[arg(short, long)]
        output: Option<String>,
    },
    /// Show key info from a key file
    ShowKey {
        /// Key file path
        #[arg(short, long)]
        file: String,
    },
    /// Rotate validator key (copy old to new, keep old as backup)
    RotateKey {
        /// Path to current key file
        #[arg(long)]
        old: String,
        /// Path for new key file
        #[arg(long)]
        new: String,
    },
    /// Export key to different format
    ExportKey {
        /// Key file path
        #[arg(short, long)]
        file: String,
        /// Export format: json or mnemonic
        #[arg(short, long, default_value = "json")]
        format: String,
    },
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let args = Args::parse();

    // Handle subcommands
    if let Some(command) = args.command {
        return match command {
            Commands::GenerateKey { output } => generate_key(output),
            Commands::ShowKey { file } => show_key(&file),
            Commands::RotateKey { old, new } => rotate_key(&old, &new),
            Commands::ExportKey { file, format } => export_key(&file, &format),
        };
    }

    // Initialize tracing for node mode
    tracing_subscriber::fmt::init();

    info!("🔥 Demiurge Node Starting...");
    info!("The flame burns eternal. The code serves the will.");

    // Create node configuration
    let data_dir = args.data_dir.clone();
    let genesis_file = args.genesis.as_ref().map(PathBuf::from);
    let validator_key_file = args.validator_key.as_ref().map(PathBuf::from);
    
    // Log genesis and validator configuration
    if let Some(ref genesis_path) = genesis_file {
        info!("Genesis file: {:?}", genesis_path);
    }
    if let Some(ref validator_key_path) = validator_key_file {
        info!("Validator key file: {:?}", validator_key_path);
        info!("Running in VALIDATOR mode");
    } else {
        info!("Running in OBSERVER mode (no validator key)");
    }
    
    // Parse bootstrap peers from comma-separated string
    let bootstrap_peers = if let Some(ref peers_str) = args.bootstrap_peers {
        peers_str.split(',')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect()
    } else {
        vec![]
    };
    
    if !bootstrap_peers.is_empty() {
        info!("Bootstrap peers configured: {}", bootstrap_peers.len());
        for peer in &bootstrap_peers {
            info!("  - {}", peer);
        }
    }
    
    let config = NodeConfig {
        data_dir: data_dir.clone().into(),
        rpc_addr: args.rpc_addr.parse()
            .map_err(|e| anyhow::anyhow!("Invalid RPC address: {}", e))?,
        p2p_addr: args.p2p_addr.parse()
            .map_err(|e| anyhow::anyhow!("Invalid P2P address: {}", e))?,
        block_time_ms: args.block_time,
        enable_rpc: args.rpc,
        enable_p2p: args.p2p,
        bootstrap_peers,
        genesis_file: genesis_file.clone(),
        validator_key_file: validator_key_file.clone(),
    };

    // Create and start node service
    let mut node = NodeService::new(config)?;
    
    // Load genesis configuration if provided
    if let Some(ref genesis_path) = genesis_file {
        let genesis_config = GenesisConfig::load_from_file(genesis_path)?;
        info!("Loaded genesis config: chain_id={}, validators={}", 
            genesis_config.chain_id, genesis_config.validators.len());
        node.load_genesis(genesis_config).await?;
    }
    
    // Load validator key and register as validator if provided
    if let Some(ref validator_key_path) = validator_key_file {
        let key_contents = std::fs::read_to_string(validator_key_path)?;
        let key_json: serde_json::Value = serde_json::from_str(&key_contents)?;
        
        let private_key_hex = key_json.get("private_key")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow::anyhow!("Invalid validator key file: missing private_key"))?;
        let address_hex = key_json.get("address")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow::anyhow!("Invalid validator key file: missing address"))?;
        
        // Parse signing key
        let private_key_bytes = hex::decode(private_key_hex)?;
        let signing_key = SigningKey::from_bytes(
            private_key_bytes.as_slice().try_into()
                .map_err(|_| anyhow::anyhow!("Invalid private key length"))?
        );
        
        // Parse address
        let address: [u8; 32] = hex::decode(address_hex)?
            .try_into()
            .map_err(|_| anyhow::anyhow!("Invalid address length"))?;
        
        info!("Registering as validator: {}", address_hex);
        
        // Default stake for genesis validator (1 billion units)
        let default_stake: u128 = 1_000_000_000;
        node.register_validator(address, signing_key, default_stake)?;
    }
    
    node.start().await?;

    info!("🚀 Demiurge Node is running!");
    info!("RPC: {}", args.rpc_addr);
    info!("P2P: {}", args.p2p_addr);
    info!("Block time: {}ms", args.block_time);
    info!("Data directory: {}", data_dir);

    // Main event loop - keep running until Ctrl+C
    info!("Entering main event loop...");
    tokio::signal::ctrl_c().await?;
    
    info!("Shutting down...");
    node.stop().await?;
    info!("✅ Node stopped gracefully");
    
    Ok(())
}

/// Generate a new Ed25519 validator key pair
fn generate_key(output: Option<String>) -> anyhow::Result<()> {
    use rand::rngs::OsRng;
    
    // Generate key pair
    let signing_key = SigningKey::generate(&mut OsRng);
    let verifying_key: VerifyingKey = (&signing_key).into();
    
    // Create key JSON
    let key_json = serde_json::json!({
        "private_key": hex::encode(signing_key.to_bytes()),
        "public_key": hex::encode(verifying_key.to_bytes()),
        "address": hex::encode(verifying_key.to_bytes()),
        "key_type": "ed25519",
        "version": 1
    });
    
    let key_str = serde_json::to_string_pretty(&key_json)?;
    
    match output {
        Some(path) => {
            std::fs::write(&path, &key_str)?;
            eprintln!("✅ Validator key saved to: {}", path);
            eprintln!("Public key (address): {}", hex::encode(verifying_key.to_bytes()));
        }
        None => {
            println!("{}", key_str);
        }
    }
    
    Ok(())
}

/// Show key info from a key file
fn show_key(file: &str) -> anyhow::Result<()> {
    let contents = std::fs::read_to_string(file)?;
    let key: serde_json::Value = serde_json::from_str(&contents)?;
    
    println!("Key File: {}", file);
    println!("Key Type: {}", key.get("key_type").and_then(|v| v.as_str()).unwrap_or("unknown"));
    println!("Public Key: {}", key.get("public_key").and_then(|v| v.as_str()).unwrap_or("unknown"));
    println!("Address: {}", key.get("address").and_then(|v| v.as_str()).unwrap_or("unknown"));
    
    Ok(())
}

/// Rotate validator key - copy old to new file
fn rotate_key(old_path: &str, new_path: &str) -> anyhow::Result<()> {
    let contents = std::fs::read_to_string(old_path)?;
    std::fs::write(new_path, &contents)?;
    eprintln!("✅ Key copied from {} to {}", old_path, new_path);
    eprintln!("   Generate a new key with: demiurge-node generate-key --output <path>");
    Ok(())
}

/// Export key to json or mnemonic format
fn export_key(file: &str, format: &str) -> anyhow::Result<()> {
    let contents = std::fs::read_to_string(file)?;
    let key: serde_json::Value = serde_json::from_str(&contents)?;
    
    match format.to_lowercase().as_str() {
        "json" => println!("{}", serde_json::to_string_pretty(&key)?),
        "mnemonic" => {
            // Ed25519 keys don't have standard mnemonic - output placeholder
            // In production, use BIP39 with proper derivation
            eprintln!("Note: Ed25519 keys use a different format. Mnemonic export not fully supported.");
            println!("{}", key);
        }
        _ => return Err(anyhow::anyhow!("Format must be 'json' or 'mnemonic'")),
    }
    Ok(())
}
