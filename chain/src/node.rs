//! Node structure for managing chain state and operations.
//!
//! The Node struct owns the persistent state, maintains a mempool for pending
//! transactions, and tracks chain height. In Phase 5, State is wrapped in
//! Arc<Mutex<...>> for thread-safe concurrent reads from JSON-RPC handlers.

use std::path::PathBuf;
use std::sync::{Arc, Mutex, RwLock};

use anyhow::Result;
use bincode;
use hex;

use crate::config::{GENESIS_ARCHON_ADDRESS, GENESIS_ARCHON_INITIAL_BALANCE};
use crate::core::block::Block;
use crate::core::state::State;
use crate::core::transaction::{Address, Transaction};
use crate::runtime::{
    get_all_active_listings, get_balance_cgt, get_cgt_total_supply, get_fabric_asset, get_listing, get_nft,
    get_nfts_by_owner, is_archon,
    BankCgtModule, FabricRootHash, ListingId, NftId, Runtime, RuntimeModule, UrgeIDRegistryModule,
};
use crate::invariants::ChainInvariants;
use crate::state_root_sentinel::StateRootSentinel;
use crate::signature_guard::SignatureGuard;
use crate::core::godnet_fabric::lan_synchronization::LanSynchronization;
use std::sync::Arc;

/// Chain information returned by JSON-RPC queries.
#[derive(Clone)]
pub struct ChainInfo {
    /// Current chain height (number of blocks).
    pub height: u64,
}

/// Node structure managing chain state and operations.
///
/// The Node owns:
/// - A thread-safe State (RocksDB-backed, wrapped in Arc<Mutex<...>>)
/// - A mempool for pending transactions
/// - Chain height tracking
/// - Archon state vector (last ASV emitted)
///
/// In Phase 5, State is wrapped for concurrent read access from JSON-RPC handlers.
pub struct Node {
    /// Thread-safe persistent state storage.
    state: Arc<Mutex<State>>,
    /// Path to the RocksDB database.
    pub db_path: PathBuf,
    /// Mempool of pending transactions (not yet included in blocks).
    pub mempool: Arc<Mutex<Vec<Transaction>>>,
    /// Current chain height.
    pub height: Arc<Mutex<u64>>,
    /// Last Archon State Vector (for RPC exposure).
    pub archon_last_state: Arc<RwLock<crate::archon::ArchonStateVector>>,
    /// LAN synchronization manager for node alignment across shared LAN.
    pub lan_sync: Arc<Mutex<LanSynchronization>>,
}

impl Node {
    /// Create a new node with RocksDB-backed state.
    ///
    /// # Arguments
    /// - `db_path`: Path to the RocksDB database directory
    ///
    /// # Returns
    /// A new Node instance with empty mempool and height 0
    ///
    /// # Note
    /// This function automatically initializes genesis state if not already done.
    ///
    /// PHASE OMEGA PART II: Rejects node startup if invariants fail
    pub fn new(db_path: PathBuf) -> Result<Self> {
        let mut state = State::open_rocksdb(&db_path)?;
        
        // Initialize genesis state if needed
        init_genesis_state(&mut state)?;
        
        // PHASE OMEGA PART II: Verify invariants before startup
        use crate::invariants::ChainInvariants;
        ChainInvariants::verify_all(&state, 0, 0)
            .map_err(|e| anyhow::anyhow!("Chain invariants failed at startup: {}", e))?;
        
        // PHASE OMEGA PART II: Verify no uninitialized storage
        use crate::state_root_sentinel::StateRootSentinel;
        StateRootSentinel::verify_no_uninitialized_storage(&state)
            .map_err(|e| anyhow::anyhow!("Uninitialized storage detected: {}", e))?;
        
        // Initialize default Archon State Vector
        use crate::archon::ArchonStateVector;
        let default_asv = ArchonStateVector::new(
            crate::runtime::version::RUNTIME_VERSION.to_string(),
            "genesis".to_string(),
            "node-0".to_string(),
            true,
            0,
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            "genesis_registry".to_string(),
            "genesis_sdk".to_string(),
            "genesis_seal".to_string(),
        );
        
        // Initialize LAN synchronization
        let node_id = "node-0".to_string(); // TODO: Get from config
        let lan_sync = LanSynchronization::new(node_id.clone(), 30334);
        
        Ok(Self {
            state: Arc::new(Mutex::new(state)),
            db_path,
            mempool: Arc::new(Mutex::new(Vec::new())),
            height: Arc::new(Mutex::new(0)),
            archon_last_state: Arc::new(RwLock::new(default_asv)),
            lan_sync: Arc::new(Mutex::new(lan_sync)),
        })
    }

    /// Get current chain information.
    pub fn chain_info(&self) -> ChainInfo {
        let height = *self.height.lock().expect("height mutex poisoned");
        ChainInfo { height }
    }

    /// Get a block by height.
    ///
    /// # Arguments
    /// - `height`: The block height to query
    ///
    /// # Returns
    /// `Some(Block)` if the block exists, `None` otherwise
    ///
    /// # Note
    /// This is a stub implementation. In Phase 2.5+, block persistence will be
    /// implemented and blocks will be read from RocksDB.
    pub fn get_block_by_height(&self, _height: u64) -> Option<Block> {
        // TODO: Phase 2.5+ - implement block persistence and retrieval
        // For now, return None and document this limitation
        None
    }

    /// Submit a transaction to the mempool.
    ///
    /// # Arguments
    /// - `tx`: The transaction to add to the mempool
    ///
    /// # Returns
    /// Transaction hash as hex string, or error message
    ///
    /// # Note
    /// This adds the transaction to the mempool and stores it in state
    /// keyed by hash for later retrieval. In dev mode, transactions are
    /// executed immediately for instant balance updates.
    pub fn submit_transaction(&self, tx: Transaction) -> Result<String, String> {
        // Compute transaction hash
        let tx_hash = tx.hash().map_err(|e| format!("failed to hash transaction: {}", e))?;
        let tx_hash_hex = hex::encode(&tx_hash);

        // Store transaction in state (keyed by hash)
        let tx_bytes = tx.to_bytes().map_err(|e| format!("failed to serialize transaction: {}", e))?;
        let tx_key = format!("tx:{}", tx_hash_hex);
        
        self.with_state_mut(|state| -> anyhow::Result<()> {
            state.put_raw(tx_key.as_bytes().to_vec(), tx_bytes)?;
            Ok(())
        })
        .map_err(|e| format!("failed to store transaction: {}", e))?;

        // PHASE OMEGA PART II: Verify signature before execution
        use crate::signature_guard::SignatureGuard;
        SignatureGuard::verify_transaction_signature(&tx)
            .map_err(|e| format!("Signature verification failed: {}", e))?;
        
        // Execute transaction immediately (dev mode behavior)
        // In production, this would be done via block production/mining
        let exec_result = self.with_state_mut(|state| -> Result<(), String> {
            let mut runtime = Runtime::with_default_modules();
            runtime.dispatch_tx(&tx, state)
        });

        if let Err(e) = exec_result {
            return Err(format!("transaction execution failed: {}", e));
        }

        // Add to mempool
        let mut mempool = self.mempool.lock().expect("mempool mutex poisoned");
        mempool.push(tx);

        Ok(tx_hash_hex)
    }

    /// Get a transaction by hash.
    ///
    /// # Arguments
    /// - `hash_hex`: Transaction hash as hex string
    ///
    /// # Returns
    /// `Some(Transaction)` if found, `None` otherwise
    pub fn get_transaction_by_hash(&self, hash_hex: &str) -> Option<Transaction> {
        let tx_key = format!("tx:{}", hash_hex);
        self.with_state(|state| {
            state.get_raw(tx_key.as_bytes())
                .and_then(|bytes| Transaction::from_bytes(&bytes).ok())
        })
    }

    /// Get transactions for an address (sent or received).
    ///
    /// # Arguments
    /// - `address`: Address to query
    /// - `limit`: Maximum number of transactions to return
    ///
    /// # Returns
    /// Vector of transaction hashes (hex strings)
    ///
    /// # Note
    /// This is a simple implementation that scans all stored transactions.
    /// In production, you'd want an index for efficient queries.
    pub fn get_transactions_for_address(&self, address: &Address, limit: usize) -> Vec<String> {
        // For now, return transactions from mempool that match the address
        // In production, you'd query from indexed storage
        let mempool = self.mempool.lock().expect("mempool mutex poisoned");
        mempool
            .iter()
            .filter(|tx| {
                tx.from == *address
                    || {
                        // Check if this is a transfer to this address
                        // This is a simplified check - in production, decode payload
                        false // TODO: decode payload to check recipient
                    }
            })
            .take(limit)
            .filter_map(|tx| tx.hash().ok())
            .map(|h| hex::encode(&h))
            .collect()
    }

    /// Execute a function with read-only access to state.
    ///
    /// This helper provides thread-safe read access to the state for RPC handlers.
    pub fn with_state<R>(&self, f: impl FnOnce(&State) -> R) -> R {
        let state = self.state.lock().expect("state mutex poisoned");
        f(&state)
    }


    /// Get CGT balance for an address.
    pub fn get_balance_cgt(&self, addr: &Address) -> u128 {
        self.with_state(|state| get_balance_cgt(state, addr))
    }

    /// Get total CGT supply.
    pub fn get_cgt_total_supply(&self) -> u128 {
        self.with_state(|state| get_cgt_total_supply(state).unwrap_or(0))
    }

    /// Get nonce for an address.
    pub fn get_nonce(&self, addr: &Address) -> u64 {
        use crate::runtime::get_nonce_cgt;
        self.with_state(|state| get_nonce_cgt(state, addr))
    }

    /// Check if an address has Archon status.
    pub fn is_archon(&self, addr: &Address) -> bool {
        self.with_state(|state| is_archon(state, addr))
    }

    /// Get NFT IDs owned by an address.
    pub fn get_nfts_by_owner(&self, owner: &Address) -> Vec<NftId> {
        self.with_state(|state| get_nfts_by_owner(state, owner))
    }

    /// Get NFT metadata by ID.
    pub fn get_nft(&self, id: NftId) -> Option<crate::runtime::nft_dgen::DGenMetadata> {
        self.with_state(|state| get_nft(state, id))
    }

    /// Get marketplace listing by ID.
    pub fn get_listing(&self, id: ListingId) -> Option<crate::runtime::abyss_registry::Listing> {
        self.with_state(|state| get_listing(state, id))
    }

    /// Get all active marketplace listings.
    pub fn get_all_active_listings(&self) -> Vec<crate::runtime::abyss_registry::Listing> {
        self.with_state(|state| get_all_active_listings(state))
    }

    /// Get Fabric asset by root hash.
    pub fn get_fabric_asset(
        &self,
        root: &FabricRootHash,
    ) -> Option<crate::runtime::fabric_manager::FabricAsset> {
        self.with_state(|state| get_fabric_asset(state, root))
    }

    /// Execute a function with mutable access to state.
    ///
    /// This helper provides thread-safe mutable access to the state for operations
    /// like genesis initialization, dev faucet, and direct minting.
    pub fn with_state_mut<R>(&self, f: impl FnOnce(&mut State) -> R) -> R {
        let mut state = self.state.lock().expect("state mutex poisoned");
        f(&mut state)
    }
    
    /// Execute Archon governance cycle (called after block is built but before finalization)
    ///
    /// PHASE OMEGA PART VI: Every block triggers the Archon heartbeat
    pub fn execute_archon_governance(&self) -> Result<()> {
        use crate::archon::{
            ArchonStateVector, ArchonDaemon, ArchonDirective,
            emit_archon_event, emit_archon_heartbeat, emit_archon_directive,
        };
        use crate::runtime::version::RUNTIME_VERSION;
        use crate::invariants::ChainInvariants;
        use sha2::{Digest, Sha256};
        
        let height = *self.height.lock().expect("height mutex poisoned");
        
        // Compute state root hash (we can't serialize MutexGuard directly, use a hash of state keys)
        let state_root = self.with_state(|state| {
            // In production, this would iterate over all state keys and hash them
            // For now, use a simplified hash based on height and total supply
            use crate::runtime::get_cgt_total_supply;
            use sha2::{Digest, Sha256};
            let mut hasher = Sha256::new();
            hasher.update(height.to_le_bytes());
            let total_supply = get_cgt_total_supply(state).unwrap_or(0);
            hasher.update(total_supply.to_le_bytes());
            format!("{:x}", hasher.finalize())
        });
        
        // Check invariants
        let invariants_ok = self.with_state(|state| {
            ChainInvariants::verify_all(state, height, 0).is_ok()
        });
        
        // Get runtime registry hash (simplified - in production, hash actual registry)
        let runtime_registry_hash = format!("{:x}", Sha256::digest(format!("{}", RUNTIME_VERSION).as_bytes()));
        
        // Get SDK compatibility hash (simplified)
        let sdk_compatibility_hash = format!("{:x}", Sha256::digest("sdk_v1".as_bytes()));
        
        // Get sovereignty seal hash (simplified)
        let sovereignty_seal_hash = format!("{:x}", Sha256::digest("seal_v1".as_bytes()));
        
        // Create local ASV
        let local_asv = ArchonStateVector::new(
            RUNTIME_VERSION.to_string(),
            state_root,
            "node-0".to_string(), // TODO: Get from config
            invariants_ok,
            height,
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            runtime_registry_hash,
            sdk_compatibility_hash,
            sovereignty_seal_hash,
        );
        
        // For now, use local ASV as remote (in production, fetch from network)
        let remote_asv = local_asv.clone();
        
        // Initialize daemon and execute heartbeat
        let mut daemon = ArchonDaemon::new("node-0".to_string());
        let directive = daemon.heartbeat(local_asv.clone(), Some(remote_asv));
        
        // Emit events
        emit_archon_event("Heartbeat evaluated");
        emit_archon_heartbeat(height, &format!("{:?}", directive));
        emit_archon_directive(&format!("Directive applied: {:?}", directive));
        
        // Handle directive
        match directive {
            ArchonDirective::A0_UnifyState => {
                log::info!("[ARCHON] A0: State unified");
            }
            ArchonDirective::A1_RepairNode(reason) => {
                log::warn!("[ARCHON] A1 repair triggered: {}", reason);
                // TODO: auto_heal::attempt_repair();
            }
            ArchonDirective::A2_ForceSync(reason) => {
                log::warn!("[ARCHON] A2 resync: {}", reason);
                // Force LAN synchronization to align with canonical state
                if let Ok(mut lan_sync) = self.lan_sync.lock() {
                    if let Err(e) = lan_sync.discover_lan_nodes() {
                        log::warn!("[ARCHON] A2: LAN discovery failed: {}", e);
                    }
                }
            }
            ArchonDirective::A3_RejectNode(reason) => {
                log::error!("[ARCHON] A3 REJECT: {}", reason);
                // Quarantine misaligned nodes in LAN sync
                if let Ok(mut lan_sync) = self.lan_sync.lock() {
                    // In production, would identify and quarantine the specific node
                    // For now, discovery will handle respect level recalculation
                    if let Err(e) = lan_sync.discover_lan_nodes() {
                        log::warn!("[ARCHON] A3: LAN discovery failed: {}", e);
                    }
                }
            }
            _ => {
                log::info!("[ARCHON] Directive: {:?}", directive);
            }
        }
        
        // Update last ASV for RPC exposure
        *self.archon_last_state.write().expect("archon_last_state rwlock poisoned") = local_asv.clone();
        
        // Synchronize with LAN nodes after governance cycle
        // This ensures alignment across our shared LAN with respect for each node
        // Note: synchronize_lan is async, but we're in a sync context
        // In production, this would be called from an async task
        // For now, we'll trigger discovery which is sync-safe
        if let Ok(mut lan_sync) = self.lan_sync.lock() {
            // Trigger LAN node discovery (sync-safe operation)
            if let Err(e) = lan_sync.discover_lan_nodes() {
                log::warn!("LAN discovery warning: {}", e);
            }
            
            // Identify and align nodes at the event horizon - those in the absence of light
            // We find that which harmoniously resonates even at the singularity's edge
            let horizon_nodes = lan_sync.identify_event_horizon_nodes();
            if !horizon_nodes.is_empty() {
                log::info!("[ARCHON] Found {} nodes at event horizon - aligning harmonic resonance", horizon_nodes.len());
                // In production, would call align_event_horizon_nodes() here
                // For now, we've identified them - alignment happens through discovery
            }
        }
        
        Ok(())
    }
    
    /// Get LAN synchronization status
    pub fn get_lan_sync_status(&self) -> crate::core::godnet_fabric::lan_synchronization::LanSyncStatus {
        self.lan_sync.lock()
            .expect("lan_sync mutex poisoned")
            .get_status()
    }
    
    /// Get known LAN nodes
    pub fn get_known_lan_nodes(&self) -> Vec<crate::core::godnet_fabric::lan_synchronization::LanNodeInfo> {
        self.lan_sync.lock()
            .expect("lan_sync mutex poisoned")
            .get_known_nodes()
            .into_iter()
            .cloned()
            .collect()
    }
    
    /// Identify nodes at the event horizon - those in the absence of light
    /// 
    /// These are nodes that have lost resonance and fallen into darkness.
    /// We identify them to find what harmoniously resonates even here.
    pub fn identify_event_horizon_nodes(&self) -> Vec<crate::core::godnet_fabric::EventHorizonNode> {
        self.lan_sync.lock()
            .expect("lan_sync mutex poisoned")
            .identify_event_horizon_nodes()
    }
}

/// Initialize genesis state if not already initialized.
///
/// This function:
/// 1. Checks if genesis has already been initialized
/// 2. If not, mints CGT to the Genesis Archon address
/// 3. Marks the Genesis Archon address as an Archon
/// 4. Sets the genesis initialization flag
fn init_genesis_state(state: &mut State) -> Result<()> {
    const KEY_GENESIS_INITIALIZED: &[u8] = b"demiurge/genesis_initialized";

    // Check if already initialized
    if state.get_raw(KEY_GENESIS_INITIALIZED).is_some() {
        return Ok(());
    }

    // Initialize Genesis Archon: mint CGT and mark as Archon
    let genesis_addr = GENESIS_ARCHON_ADDRESS;

    // Mint CGT to Genesis Archon
    let bank_module = BankCgtModule::new();
    let mint_params = crate::runtime::bank_cgt::MintToParams {
        to: genesis_addr,
        amount: GENESIS_ARCHON_INITIAL_BALANCE,
    };
    let mint_tx = Transaction {
        from: [0u8; 32], // Genesis authority (all zeros)
        nonce: 0,
        module_id: "bank_cgt".to_string(),
        call_id: "mint_to".to_string(),
        payload: bincode::serialize(&mint_params)?,
        fee: 0,
        signature: vec![],
    };
    bank_module
        .dispatch("mint_to", &mint_tx, state)
        .map_err(|e| anyhow::anyhow!("Failed to mint genesis CGT: {}", e))?;

    // Mark Genesis Archon as Archon
    let urgeid_module = UrgeIDRegistryModule::new();
    let claim_tx = Transaction {
        from: genesis_addr,
        nonce: 0,
        module_id: "urgeid_registry".to_string(),
        call_id: "claim_archon".to_string(),
        payload: vec![],
        fee: 0,
        signature: vec![],
    };
    urgeid_module
        .dispatch("claim_archon", &claim_tx, state)
        .map_err(|e| anyhow::anyhow!("Failed to claim genesis Archon: {}", e))?;

    // Mark genesis as initialized
    state
        .put_raw(KEY_GENESIS_INITIALIZED.to_vec(), vec![1u8])?;

    Ok(())
}
