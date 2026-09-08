//! Node service - Main node logic
//!
//! The heart of the Demiurge node - orchestrates all components:
//! - Consensus engine (block production)
//! - P2P networking (gossipsub, peer discovery)
//! - RPC server (external API)

use crate::{NodeConfig, GenesisConfig};
use demiurge_core::{Runtime, Block, Transaction};
use demiurge_storage::{StorageBackend, Storage};
use demiurge_consensus::{ConsensusEngine, Validator, BlockProof, BlockSignature};
use demiurge_network::{SwarmManager, NetworkEvent, TransactionPool};
use demiurge_rpc::{RpcServer, RpcMethods};
use anyhow::Result;
use libp2p::Multiaddr;
use tracing::{info, warn, debug};
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::time::{sleep, Duration};
use ed25519_dalek::SigningKey;
use hex;

/// Node service - The beating heart of the Demiurge Protocol
pub struct NodeService {
    config: NodeConfig,
    runtime: Arc<Mutex<Runtime<StorageBackend>>>,
    consensus: Option<Arc<Mutex<ConsensusEngine<StorageBackend>>>>,
    tx_pool: Arc<Mutex<TransactionPool>>,
    rpc_server: Option<RpcServer<StorageBackend>>,
    swarm_manager: Option<Arc<SwarmManager>>,
    is_validator: bool,
    validator_account: Option<[u8; 32]>,
    validator_key: Option<SigningKey>,
    validator_stake: Option<u128>,
    genesis_config: Option<GenesisConfig>,
}

impl NodeService {
    /// Create a new node service
    pub fn new(config: NodeConfig) -> Result<Self> {
        info!("Initializing node service...");
        
        // Initialize storage
        let storage = StorageBackend::new(
            config.data_dir.to_str().unwrap_or("./data")
        )?;
        
        // Initialize runtime (wrapped in Arc<Mutex> for sharing)
        let runtime = Arc::new(Mutex::new(Runtime::new(storage)));
        
        // Initialize transaction pool (10k transactions max)
        let tx_pool = Arc::new(Mutex::new(TransactionPool::new(10_000)));
        
        Ok(Self {
            config,
            runtime,
            consensus: None,
            tx_pool,
            rpc_server: None,
            swarm_manager: None,
            is_validator: false,
            validator_account: None,
            validator_key: None,
            validator_stake: None,
            genesis_config: None,
        })
    }
    
    /// Load genesis configuration (call before start())
    pub async fn load_genesis(&mut self, genesis_config: GenesisConfig) -> Result<()> {
        info!("Loading genesis configuration: chain_id={}", genesis_config.chain_id);
        info!("Genesis validators: {}", genesis_config.validators.len());
        for (i, validator) in genesis_config.validators.iter().enumerate() {
            info!("  Validator {}: {} (stake: {})", 
                i + 1, 
                validator.name.as_deref().unwrap_or(&validator.account),
                validator.stake
            );
        }
        
        // Initialize genesis balances in storage
        if !genesis_config.balances.is_empty() {
            info!("Initializing {} genesis balances...", genesis_config.balances.len());
            
            // Get storage reference from runtime
            let runtime_guard = self.runtime.lock().await;
            let storage = &runtime_guard.storage;
            
            for (address_hex, amount_str) in &genesis_config.balances {
                // Skip treasury for now (handled separately)
                if address_hex == "treasury" {
                    info!("  Treasury: {} (reserved)", amount_str);
                    continue;
                }
                
                // Parse address
                let address: [u8; 32] = match hex::decode(address_hex) {
                    Ok(bytes) if bytes.len() == 32 => {
                        bytes.try_into().unwrap()
                    }
                    _ => {
                        warn!("Invalid genesis balance address: {}", address_hex);
                        continue;
                    }
                };
                
                // Parse amount
                let amount: u128 = match amount_str.parse() {
                    Ok(a) => a,
                    Err(_) => {
                        warn!("Invalid genesis balance amount for {}: {}", address_hex, amount_str);
                        continue;
                    }
                };
                
                // Write balance to storage using the same key format as balances module
                let mut key = b"Balances:Account:".to_vec();
                key.extend_from_slice(&address);
                
                use codec::Encode;
                storage.put(&key, &amount.encode());
                
                info!("  Balance set: {} = {} sparks", 
                    &address_hex[..16], // First 16 chars for readability
                    amount
                );
            }
            
            info!("✅ Genesis balances initialized");
        }
        
        self.genesis_config = Some(genesis_config);
        Ok(())
    }

    /// Initialize consensus engine
    pub fn init_consensus(&mut self) -> Result<()> {
        info!("Initializing consensus engine...");
        
        // Share storage with runtime by cloning the Arc
        // Get storage from runtime - Runtime stores it as Arc internally
        // We need to create a shared storage wrapper
        // For now, use a separate database path for consensus to avoid lock conflicts
        // TODO: Refactor Runtime and ConsensusEngine to accept Arc<Mutex<StorageBackend>>
        let consensus_storage_path = format!("{}/consensus", self.config.data_dir.to_str().unwrap_or("./data"));
        let storage = StorageBackend::new(&consensus_storage_path)?;
        
        let consensus_engine = ConsensusEngine::new(storage, self.config.block_time_ms);
        
        // Register genesis validators if we have genesis config
        if let Some(ref genesis_config) = self.genesis_config {
            info!("Registering {} genesis validators...", genesis_config.validators.len());
            
            for validator_config in &genesis_config.validators {
                // Parse validator address
                let _account: [u8; 32] = match hex::decode(&validator_config.account) {
                    Ok(bytes) if bytes.len() == 32 => {
                        bytes.try_into().unwrap()
                    }
                    _ => {
                        warn!("Invalid validator account format: {}", validator_config.account);
                        continue;
                    }
                };
                
                // Parse stake
                let stake: u128 = validator_config.stake.parse().unwrap_or(1_000_000_000);
                
                // For genesis validators without keys, we create a placeholder public key
                // The actual validator with the key will register properly
                // This is just to initialize the validator set for consensus
                info!("  Registering genesis validator: {} (stake: {})", 
                    validator_config.name.as_deref().unwrap_or(&validator_config.account),
                    stake
                );
                
                // Note: Genesis validators are placeholders - real validators must register with keys
                // We'll skip actually adding them here since we need real keys
                // The local validator registration below will add the actual validator
            }
        }
        
        self.consensus = Some(Arc::new(Mutex::new(consensus_engine)));
        
        // Now register the local validator if configured
        self.register_validator_with_consensus()?;
        
        // Log final validator count
        if let Some(ref consensus) = self.consensus {
            if let Ok(consensus_guard) = consensus.try_lock() {
                let validator_count = consensus_guard.validators.count();
                info!("✅ Consensus engine initialized with {} validators", validator_count);
            }
        }
        
        Ok(())
    }

    /// Register as validator (call before start())
    /// The validator will be registered when consensus engine is initialized
    pub fn register_validator(&mut self, account: [u8; 32], signing_key: SigningKey, stake: u128) -> Result<()> {
        info!("Preparing to register as validator: {}", hex::encode(account));
        
        self.is_validator = true;
        self.validator_account = Some(account);
        self.validator_key = Some(signing_key);
        self.validator_stake = Some(stake);
        
        info!("✅ Validator configuration stored (will register on start)");
        Ok(())
    }
    
    /// Actually register the validator with the consensus engine (called after consensus init)
    fn register_validator_with_consensus(&self) -> Result<()> {
        if !self.is_validator {
            return Ok(());
        }
        
        let account = self.validator_account.ok_or_else(|| anyhow::anyhow!("No validator account"))?;
        let signing_key = self.validator_key.as_ref().ok_or_else(|| anyhow::anyhow!("No validator key"))?;
        let stake = self.validator_stake.unwrap_or(1_000_000_000);
        
        if let Some(consensus) = &self.consensus {
            let mut consensus = consensus.try_lock()
                .map_err(|_| anyhow::anyhow!("Failed to acquire consensus lock"))?;
            
            // Register validator key
            consensus.register_validator_key(account, signing_key.clone());
            
            // Register validator in validator set
            let public_key = signing_key.verifying_key();
            let validator = Validator {
                account,
                stake,
                commission: 10,
                active: true,
                public_key,
            };
            consensus.validators.register_validator(validator);
            
            info!("✅ Validator registered with consensus: {}", hex::encode(account));
        } else {
            return Err(anyhow::anyhow!("Consensus engine not initialized"));
        }
        
        Ok(())
    }

    /// Start the node service
    pub async fn start(&mut self) -> Result<()> {
        info!("🚀 Starting Demiurge Node...");
        info!("The flame burns eternal. The code serves the will.");
        
        // Initialize consensus engine (also registers validators)
        self.init_consensus()?;
        
        // Start block production if validator
        if self.is_validator {
            let validator_account = self.validator_account
                .ok_or_else(|| anyhow::anyhow!("Validator mode enabled but no account set"))?;
            
            info!("Starting block production loop for validator {}...", 
                hex::encode(validator_account));
            
            let consensus_clone = self.consensus.clone().unwrap();
            let runtime_clone = self.runtime.clone();
            let tx_pool_clone = self.tx_pool.clone();
            let block_time = Duration::from_millis(self.config.block_time_ms);
            
            tokio::spawn(async move {
                Self::block_production_loop(
                    consensus_clone, 
                    runtime_clone,
                    tx_pool_clone,
                    block_time,
                    validator_account,
                ).await;
            });
        } else {
            info!("Running in observer mode (no block production)");
        }
        
        // Start RPC server if enabled
        if self.config.enable_rpc {
            self.start_rpc_server().await?;
        }
        
        // Start P2P network if enabled
        if self.config.enable_p2p {
            self.start_p2p_network().await?;
        }
        
        info!("✅ Node service started - The Heart is beating");
        Ok(())
    }
    
    /// Start P2P networking (The Nervous System)
    async fn start_p2p_network(&mut self) -> Result<()> {
        info!("🌐 Starting P2P network on {}...", self.config.p2p_addr);
        
        // Convert socket addr to multiaddr
        let listen_multiaddr: Multiaddr = format!(
            "/ip4/{}/tcp/{}",
            self.config.p2p_addr.ip(),
            self.config.p2p_addr.port()
        ).parse().map_err(|e| anyhow::anyhow!("Invalid P2P address: {}", e))?;
        
        // Parse bootstrap peers
        let bootstrap_multiaddrs: Vec<Multiaddr> = self.config.bootstrap_peers
            .iter()
            .filter_map(|addr| addr.parse().ok())
            .collect();
        
        info!("  Listen address: {}", listen_multiaddr);
        info!("  Bootstrap peers: {}", bootstrap_multiaddrs.len());
        
        // Create SwarmManager with optional node key from validator key
        let node_key = self.validator_key.as_ref().map(|k| {
            let mut seed = [0u8; 32];
            seed.copy_from_slice(&k.to_bytes());
            seed
        });
        
        let swarm = SwarmManager::new(
            node_key,
            listen_multiaddr,
            bootstrap_multiaddrs,
        ).await.map_err(|e| anyhow::anyhow!("Failed to create swarm: {:?}", e))?;
        
        let peer_id = swarm.local_peer_id();
        info!("  Local Peer ID: {}", peer_id);
        
        let swarm = Arc::new(swarm);
        self.swarm_manager = Some(swarm.clone());
        
        // Spawn network event handler
        let consensus = self.consensus.clone();
        let tx_pool = self.tx_pool.clone();
        let runtime = self.runtime.clone();
        tokio::spawn(async move {
            Self::network_event_loop(swarm, consensus, tx_pool, runtime).await;
        });
        
        info!("✅ P2P network started - The Nervous System is alive");
        Ok(())
    }
    
    /// Handle incoming network events
    async fn network_event_loop(
        swarm: Arc<SwarmManager>,
        consensus: Option<Arc<Mutex<ConsensusEngine<StorageBackend>>>>,
        tx_pool: Arc<Mutex<TransactionPool>>,
        runtime: Arc<Mutex<Runtime<StorageBackend>>>,
    ) {
        info!("Network event loop started");
        
        while swarm.is_running().await {
            if let Some(event) = swarm.next_event().await {
                match event {
                    NetworkEvent::PeerConnected(peer_id) => {
                        info!("🔗 Peer connected: {}", peer_id);
                    }
                    
                    NetworkEvent::PeerDisconnected(peer_id) => {
                        warn!("🔌 Peer disconnected: {}", peer_id);
                    }
                    
                    NetworkEvent::BlockReceived { block, from } => {
                        info!("📦 Received block #{} from {}", block.header.block_number, from);
                        
                        // Validate and import block via consensus
                        if let Some(ref consensus) = consensus {
                            if let Ok(mut consensus_guard) = consensus.try_lock() {
                                // Validate block structure first
                                if let Err(e) = block.validate(None) {
                                    warn!("Invalid block received from {}: {:?}", from, e);
                                    continue;
                                }
                                
                                if let Err(e) = consensus_guard.store_block(&block) {
                                    warn!("Failed to store received block: {:?}", e);
                                } else {
                                    debug!("Block #{} stored successfully", block.header.block_number);
                                    
                                    // CRITICAL FIX: Execute transactions through runtime
                                    // This ensures non-proposers update their state correctly
                                    drop(consensus_guard); // Release consensus lock before acquiring runtime lock
                                    
                                    match runtime.lock().await.execute_block(block.clone()) {
                                        Ok(computed_state_root) => {
                                            // Verify state root matches (critical for consensus)
                                            if computed_state_root != block.header.state_root {
                                                warn!(
                                                    "⚠️ State root mismatch for block #{}! Expected: {:?}, Got: {:?}",
                                                    block.header.block_number,
                                                    hex::encode(block.header.state_root),
                                                    hex::encode(computed_state_root)
                                                );
                                                // In production, this would trigger a reorg or sync request
                                            } else {
                                                info!(
                                                    "✅ Block #{} executed and verified (state root matches)",
                                                    block.header.block_number
                                                );
                                            }
                                        }
                                        Err(e) => {
                                            warn!(
                                                "Failed to execute block #{}: {:?}",
                                                block.header.block_number, e
                                            );
                                        }
                                    }
                                    
                                    // Remove block's transactions from the pool
                                    let tx_hashes: Vec<[u8; 32]> = block.transactions.iter()
                                        .map(|tx| {
                                            use blake2::{Blake2b512, Digest};
                                            use codec::Encode;
                                            let encoded = tx.encode();
                                            let hash = Blake2b512::digest(&encoded);
                                            let mut result = [0u8; 32];
                                            result.copy_from_slice(&hash[..32]);
                                            result
                                        })
                                        .collect();
                                    
                                    if !tx_hashes.is_empty() {
                                        let mut pool = tx_pool.lock().await;
                                        pool.remove(&tx_hashes);
                                        debug!("Removed {} transactions from pool", tx_hashes.len());
                                    }
                                }
                            }
                        }
                    }
                    
                    NetworkEvent::TransactionReceived { transaction, from } => {
                        debug!("📝 Received transaction from {}", from);
                        
                        // Validate transaction before adding to pool
                        if let Err(e) = transaction.validate() {
                            warn!("Invalid transaction received from {}: {:?}", from, e);
                            continue;
                        }
                        
                        // Add to transaction pool
                        let mut pool = tx_pool.lock().await;
                        match pool.add(transaction) {
                            Ok(_) => debug!("Transaction added to pool (size: {})", pool.size()),
                            Err(e) => warn!("Failed to add transaction to pool: {:?}", e),
                        }
                    }
                    
                    NetworkEvent::CvpMutationAnnounced { contract_id, epoch, mutation_hash: _, from } => {
                        info!(
                            "🛡️ CVP mutation announced: contract {} epoch {} from {}",
                            hex::encode(&contract_id[..8]), epoch, from
                        );
                        // TODO: Validate and apply CVP mutation
                    }
                    
                    NetworkEvent::ConsensusMessage { data, from } => {
                        debug!("📢 Consensus message from {} ({} bytes)", from, data.len());
                        // TODO: Process consensus message (votes, etc.)
                    }
                }
            }
        }
        
        info!("Network event loop terminated");
    }

    /// Start RPC server
    async fn start_rpc_server(&mut self) -> Result<()> {
        info!("Starting RPC server on {}...", self.config.rpc_addr);
        
        // Get storage from runtime - Runtime stores it as Arc internally
        // Extract it by locking the runtime and cloning the storage Arc
        let storage_arc = {
            let runtime_guard = self.runtime.lock().await;
            runtime_guard.storage.clone()
        };
        
        // Create RPC methods handler with shared transaction pool
        let mut rpc_methods = RpcMethods::with_tx_pool(storage_arc, self.tx_pool.clone());
        
        // Set runtime and consensus references
        rpc_methods.set_runtime(self.runtime.clone());
        if let Some(consensus) = &self.consensus {
            rpc_methods.set_consensus(consensus.clone());
        }
        
        // Create and start RPC server
        let mut rpc_server = RpcServer::new(self.config.rpc_addr);
        rpc_server.start(Arc::new(rpc_methods)).await
            .map_err(|e| anyhow::anyhow!("Failed to start RPC server: {}", e))?;
        
        self.rpc_server = Some(rpc_server);
        info!("✅ RPC server started on {}", self.config.rpc_addr);
        Ok(())
    }

    /// Block production loop - The beating heart of block creation
    /// 
    /// Pulls transactions from the pool, executes them through the runtime,
    /// and produces blocks with proper state roots.
    async fn block_production_loop(
        consensus: Arc<Mutex<ConsensusEngine<StorageBackend>>>,
        runtime: Arc<Mutex<Runtime<StorageBackend>>>,
        tx_pool: Arc<Mutex<TransactionPool>>,
        block_time: Duration,
        validator_account: [u8; 32],
    ) {
        info!("🔨 Block production loop started for validator {}", hex::encode(validator_account));
        let mut blocks_produced = 0u64;
        const MAX_TXS_PER_BLOCK: usize = 100;
        
        loop {
            // Wait for block time
            sleep(block_time).await;
            
            // Get consensus lock
            let mut consensus_guard = match consensus.try_lock() {
                Ok(guard) => guard,
                Err(_) => {
                    warn!("Failed to acquire consensus lock, skipping block production");
                    continue;
                }
            };
            
            // Check if we're the proposer
            match consensus_guard.select_proposer_weighted() {
                Ok(proposer) => {
                    if proposer == validator_account {
                        // We're the proposer - pull transactions from pool
                        let transactions = {
                            let pool = tx_pool.lock().await;
                            pool.get_transactions(MAX_TXS_PER_BLOCK)
                        };
                        
                        let tx_count = transactions.len();
                        
                        // Execute transactions through runtime (if any)
                        let state_root = if !transactions.is_empty() {
                            let runtime_guard = runtime.lock().await;
                            let mut executed_count = 0;
                            
                            for tx in &transactions {
                                match runtime_guard.execute_transaction(tx) {
                                    Ok(_) => {
                                        executed_count += 1;
                                    }
                                    Err(e) => {
                                        debug!("Transaction execution failed: {:?}", e);
                                        // Continue with other transactions
                                    }
                                }
                            }
                            
                            if executed_count > 0 {
                                debug!("Executed {}/{} transactions", executed_count, tx_count);
                            }
                            
                            // Calculate state root from runtime
                            runtime_guard.calculate_state_root()
                        } else {
                            // Empty block - use previous state root or default
                            [0u8; 32]
                        };
                        
                        // Propose block with transactions
                        match consensus_guard.propose_block(transactions.clone(), validator_account) {
                            Ok((block, _proof)) => {
                                // Update block with calculated state root
                                let mut final_block = block.clone();
                                final_block.header.state_root = state_root;
                                
                                if let Err(e) = consensus_guard.store_block(&final_block) {
                                    warn!("Failed to store block: {:?}", e);
                                    continue;
                                }
                                
                                // Finalize block with self-signature (single-validator mode)
                                // In multi-validator mode, we'd collect signatures from other validators
                                let self_signature = BlockSignature {
                                    validator: validator_account,
                                    proof: _proof.clone(),
                                };
                                
                                match consensus_guard.finalize_block(&final_block, vec![self_signature]) {
                                    Ok(_) => {
                                        debug!("Block #{} finalized", final_block.header.block_number);
                                    }
                                    Err(e) => {
                                        // Finalization failure in single-validator is acceptable
                                        // (threshold may require >1 validator)
                                        debug!("Block finalization skipped: {:?}", e);
                                    }
                                }
                                
                                // Remove executed transactions from pool
                                if !transactions.is_empty() {
                                    let tx_hashes: Vec<[u8; 32]> = transactions.iter()
                                        .map(|tx| tx.hash())
                                        .collect();
                                    let mut pool = tx_pool.lock().await;
                                    pool.remove(&tx_hashes);
                                }
                                
                                blocks_produced += 1;
                                let block_num = final_block.header.block_number;
                                
                                // Log block production
                                if tx_count > 0 {
                                    info!("⛏️  Block #{} produced with {} txs (total blocks: {})", 
                                        block_num, tx_count, blocks_produced);
                                } else if blocks_produced.is_multiple_of(10) || blocks_produced <= 5 {
                                    info!("⛏️  Block #{} produced (total: {})", block_num, blocks_produced);
                                }
                            }
                            Err(e) => {
                                warn!("Failed to propose block: {:?}", e);
                            }
                        }
                    }
                    // If we're not the proposer, just wait for next round
                }
                Err(e) => {
                    // Only warn occasionally to avoid log spam
                    if blocks_produced == 0 {
                        warn!("No validators available for block production: {:?}", e);
                    }
                }
            }
        }
    }

    /// Produce a block (called when we're the proposer)
    pub async fn produce_block(&mut self, transactions: Vec<Transaction>) -> Result<(Block, BlockProof)> {
        if !self.is_validator {
            return Err(anyhow::anyhow!("Not a validator"));
        }
        
        let account = self.validator_account.ok_or_else(|| anyhow::anyhow!("No validator account"))?;
        
        if let Some(consensus) = &self.consensus {
            let mut consensus = consensus.lock().await;
            
            // Propose block
            let (block, proof) = consensus.propose_block(transactions, account)?;
            
            // Execute block in runtime and get state root
            let state_root = {
                let mut runtime = self.runtime.lock().await;
                runtime.execute_block(block.clone())?
            };
            
            // Update block header with state root
            let mut updated_block = block.clone();
            updated_block.header.state_root = state_root;
            
            // Store block in consensus engine
            consensus.store_block(&updated_block)?;
            
            // Verify state root matches
            consensus.verify_state_root(state_root)?;
            
            // TODO: Broadcast block to network
            // TODO: Collect validator signatures
            // TODO: Finalize block when 2/3+ signatures received
            
            Ok((block, proof))
        } else {
            Err(anyhow::anyhow!("Consensus engine not initialized"))
        }
    }

    /// Stop the node service
    pub async fn stop(&mut self) -> Result<()> {
        info!("Shutting down node service...");
        
        // Stop RPC server if running
        if let Some(ref mut rpc_server) = self.rpc_server {
            rpc_server.stop().await
                .map_err(|e| anyhow::anyhow!("Failed to stop RPC server: {}", e))?;
            info!("✅ RPC server stopped");
        }
        
        Ok(())
    }

    /// Get runtime reference
    pub fn runtime(&self) -> &Arc<Mutex<Runtime<StorageBackend>>> {
        &self.runtime
    }
}
