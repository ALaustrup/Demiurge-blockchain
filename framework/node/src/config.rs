//! Node configuration

use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use std::path::PathBuf;
use std::collections::HashMap;

/// Node configuration
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct NodeConfig {
    /// Data directory
    pub data_dir: PathBuf,
    
    /// RPC server address
    pub rpc_addr: SocketAddr,
    
    /// P2P network address
    pub p2p_addr: SocketAddr,
    
    /// Block time in milliseconds
    pub block_time_ms: u64,
    
    /// Enable RPC server
    pub enable_rpc: bool,
    
    /// Enable P2P networking
    pub enable_p2p: bool,
    
    /// Bootstrap peers
    pub bootstrap_peers: Vec<String>,
    
    /// Path to genesis file (optional)
    #[serde(default)]
    pub genesis_file: Option<PathBuf>,
    
    /// Validator key file (optional, for validator mode)
    #[serde(default)]
    pub validator_key_file: Option<PathBuf>,
}

impl Default for NodeConfig {
    fn default() -> Self {
        Self {
            data_dir: PathBuf::from("./data"),
            rpc_addr: "127.0.0.1:9944".parse().unwrap(),
            p2p_addr: "0.0.0.0:30333".parse().unwrap(),
            block_time_ms: 1000,
            enable_rpc: true,
            enable_p2p: true,
            bootstrap_peers: vec![],
            genesis_file: None,
            validator_key_file: None,
        }
    }
}

/// Genesis configuration
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GenesisConfig {
    /// Chain identifier
    pub chain_id: String,
    
    /// Initial validators
    pub validators: Vec<ValidatorConfig>,
    
    /// Initial account balances (address hex -> amount in base units)
    pub balances: HashMap<String, String>,
    
    /// Chain parameters
    #[serde(default)]
    pub parameters: ChainParameters,
}

/// Validator configuration for genesis
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ValidatorConfig {
    /// Validator account address (hex)
    pub account: String,
    
    /// Initial stake amount
    pub stake: String,
    
    /// Optional name for the validator
    #[serde(default)]
    pub name: Option<String>,
}

/// Chain parameters
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ChainParameters {
    /// Block time in milliseconds
    #[serde(default = "default_block_time")]
    pub block_time_ms: u64,
    
    /// Minimum validator stake
    #[serde(default = "default_min_stake")]
    pub min_validator_stake: String,
    
    /// Maximum validators
    #[serde(default = "default_max_validators")]
    pub max_validators: u32,
    
    /// Era length in blocks
    #[serde(default = "default_era_length")]
    pub era_length: u64,
}

fn default_block_time() -> u64 { 2000 }
fn default_min_stake() -> String { "1000000000".to_string() }
fn default_max_validators() -> u32 { 100 }
fn default_era_length() -> u64 { 14400 }

impl Default for ChainParameters {
    fn default() -> Self {
        Self {
            block_time_ms: default_block_time(),
            min_validator_stake: default_min_stake(),
            max_validators: default_max_validators(),
            era_length: default_era_length(),
        }
    }
}

impl GenesisConfig {
    /// Load genesis configuration from a file
    pub fn load_from_file(path: &PathBuf) -> anyhow::Result<Self> {
        let contents = std::fs::read_to_string(path)?;
        let config: GenesisConfig = serde_json::from_str(&contents)?;
        Ok(config)
    }
    
    /// Create a default genesis for a single validator testnet
    pub fn single_validator_testnet(validator_address: &str) -> Self {
        let mut balances = HashMap::new();
        // Treasury gets most of the initial supply
        balances.insert("treasury".to_string(), "12000000000000".to_string());
        // Validator gets initial balance
        balances.insert(validator_address.to_string(), "1000000000000".to_string());
        
        Self {
            chain_id: "demiurge-testnet".to_string(),
            validators: vec![
                ValidatorConfig {
                    account: validator_address.to_string(),
                    stake: "1000000000".to_string(),
                    name: Some("Genesis Validator".to_string()),
                }
            ],
            balances,
            parameters: ChainParameters::default(),
        }
    }
}
