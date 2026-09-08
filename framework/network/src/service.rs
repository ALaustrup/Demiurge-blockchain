//! Network Service - Main Networking Component (The Nervous System Controller)
//!
//! Manages P2P connections, block/transaction propagation, and peer discovery.
//! This is the high-level interface that wraps the LibP2P Swarm.
//!
//! # Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────┐
//! │                     NETWORK SERVICE                              │
//! │                  (High-Level Interface)                          │
//! ├─────────────────────────────────────────────────────────────────┤
//! │                          │                                       │
//! │                          ▼                                       │
//! │                  ┌───────────────┐                               │
//! │                  │ SWARM MANAGER │ ◄── LibP2P Integration        │
//! │                  │  (The Heart)  │                               │
//! │                  └───────────────┘                               │
//! │                          │                                       │
//! │         ┌────────────────┼────────────────┐                      │
//! │         ▼                ▼                ▼                      │
//! │   ┌──────────┐    ┌──────────┐    ┌──────────┐                  │
//! │   │GOSSIPSUB │    │ KADEMLIA │    │ IDENTIFY │                  │
//! │   │ (Blood)  │    │(Sensors) │    │  (Eyes)  │                  │
//! │   └──────────┘    └──────────┘    └──────────┘                  │
//! └─────────────────────────────────────────────────────────────────┘
//! ```

use crate::{Result, NetworkError, PeerDiscovery};
use crate::discovery::DiscoveredPeer;
use crate::swarm::{SwarmManager, NetworkEvent};
use demiurge_core::Block;
use libp2p::{Multiaddr, PeerId};
use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, warn, debug};

/// Network configuration
#[derive(Clone, Debug)]
pub struct NetworkConfig {
    /// Local address to listen on
    pub listen_addr: SocketAddr,
    
    /// Bootstrap peer addresses (format: "/ip4/x.x.x.x/tcp/30333/p2p/PeerId")
    pub bootstrap_peers: Vec<String>,
    
    /// Node identity (optional - will be generated if not provided)
    pub node_key: Option<[u8; 32]>,
    
    /// Maximum number of peers to connect to
    pub max_peers: usize,
    
    /// Connection timeout in seconds
    pub connection_timeout_secs: u64,
}

impl Default for NetworkConfig {
    fn default() -> Self {
        Self {
            listen_addr: "0.0.0.0:30333".parse().unwrap(),
            bootstrap_peers: vec![],
            node_key: None,
            max_peers: 50,
            connection_timeout_secs: 30,
        }
    }
}

/// Network service managing P2P connections
pub struct NetworkService {
    /// Configuration
    config: NetworkConfig,
    
    /// Connected peers
    peers: Arc<RwLock<HashMap<PeerId, PeerInfo>>>,
    
    /// Peer discovery service
    discovery: Arc<RwLock<PeerDiscovery>>,
    
    /// Pending outbound blocks to broadcast
    pending_blocks: Arc<RwLock<Vec<Block>>>,
    
    /// Pending outbound transactions to broadcast
    pending_transactions: Arc<RwLock<Vec<demiurge_core::Transaction>>>,
    
    /// Running flag
    running: bool,
    
    /// Local peer ID (generated or from node key)
    local_peer_id: Option<PeerId>,
    
    /// LibP2P Swarm Manager (The Heart)
    swarm_manager: Option<Arc<SwarmManager>>,
}

/// Peer information
#[derive(Clone, Debug)]
pub struct PeerInfo {
    pub peer_id: PeerId,
    pub address: String,
    pub connected: bool,
    pub last_seen: u64,
    pub block_height: u64,
}

impl NetworkService {
    /// Create a new network service with default config
    pub fn new() -> Result<Self> {
        Self::with_config(NetworkConfig::default())
    }
    
    /// Create a new network service with custom config
    pub fn with_config(config: NetworkConfig) -> Result<Self> {
        let discovery = PeerDiscovery::new(config.bootstrap_peers.clone());
        
        Ok(Self {
            config,
            peers: Arc::new(RwLock::new(HashMap::new())),
            discovery: Arc::new(RwLock::new(discovery)),
            pending_blocks: Arc::new(RwLock::new(Vec::new())),
            pending_transactions: Arc::new(RwLock::new(Vec::new())),
            running: false,
            local_peer_id: None,
            swarm_manager: None,
        })
    }
    
    /// Create a network service with a pre-initialized SwarmManager
    pub fn with_swarm(config: NetworkConfig, swarm: Arc<SwarmManager>) -> Result<Self> {
        let discovery = PeerDiscovery::new(config.bootstrap_peers.clone());
        let local_peer_id = Some(swarm.local_peer_id());
        
        Ok(Self {
            config,
            peers: Arc::new(RwLock::new(HashMap::new())),
            discovery: Arc::new(RwLock::new(discovery)),
            pending_blocks: Arc::new(RwLock::new(Vec::new())),
            pending_transactions: Arc::new(RwLock::new(Vec::new())),
            running: true,
            local_peer_id,
            swarm_manager: Some(swarm),
        })
    }

    /// Start the network service
    pub async fn start(&mut self) -> Result<()> {
        if self.running {
            return Err(NetworkError::ConnectionFailed("Already running".to_string()));
        }
        
        info!("Starting P2P network on {:?}", self.config.listen_addr);
        
        // Parse listen address to Multiaddr
        let listen_multiaddr: Multiaddr = format!(
            "/ip4/{}/tcp/{}",
            self.config.listen_addr.ip(),
            self.config.listen_addr.port()
        ).parse().map_err(|e| NetworkError::InvalidAddress(format!("{}", e)))?;
        
        // Parse bootstrap peers to Multiaddrs
        let bootstrap_multiaddrs: Vec<Multiaddr> = self.config.bootstrap_peers
            .iter()
            .filter_map(|addr| addr.parse().ok())
            .collect();
        
        info!("Connecting to {} bootstrap peers...", bootstrap_multiaddrs.len());
        
        // Initialize the SwarmManager (The Heart)
        let swarm = SwarmManager::new(
            self.config.node_key,
            listen_multiaddr,
            bootstrap_multiaddrs,
        ).await?;
        
        self.local_peer_id = Some(swarm.local_peer_id());
        let swarm = Arc::new(swarm);
        self.swarm_manager = Some(swarm.clone());
        
        info!("Local peer ID: {:?}", self.local_peer_id);
        
        // Start the network event handler loop
        let peers_clone = self.peers.clone();
        let discovery_clone = self.discovery.clone();
        tokio::spawn(async move {
            Self::network_event_loop(swarm, peers_clone, discovery_clone).await;
        });
        
        self.running = true;
        info!("P2P network started successfully (The Heart is beating)");
        
        Ok(())
    }
    
    /// Handle network events from the swarm
    async fn network_event_loop(
        swarm: Arc<SwarmManager>,
        peers: Arc<RwLock<HashMap<PeerId, PeerInfo>>>,
        discovery: Arc<RwLock<PeerDiscovery>>,
    ) {
        info!("Network event loop started");
        
        while swarm.is_running().await {
            if let Some(event) = swarm.next_event().await {
                match event {
                    NetworkEvent::PeerConnected(peer_id) => {
                        info!("Peer connected: {}", peer_id);
                        
                        let now = std::time::SystemTime::now()
                            .duration_since(std::time::UNIX_EPOCH)
                            .unwrap()
                            .as_secs();
                        
                        let peer_info = PeerInfo {
                            peer_id,
                            address: String::new(),
                            connected: true,
                            last_seen: now,
                            block_height: 0,
                        };
                        
                        peers.write().await.insert(peer_id, peer_info);
                        discovery.write().await.peer_connected(&peer_id);
                    }
                    
                    NetworkEvent::PeerDisconnected(peer_id) => {
                        warn!("Peer disconnected: {}", peer_id);
                        
                        if let Some(peer) = peers.write().await.get_mut(&peer_id) {
                            peer.connected = false;
                        }
                        discovery.write().await.peer_disconnected(&peer_id);
                    }
                    
                    NetworkEvent::BlockReceived { block, from } => {
                        info!(
                            "Received block #{} from {}",
                            block.header.block_number, from
                        );
                        // TODO: Forward to consensus engine for validation
                    }
                    
                    NetworkEvent::TransactionReceived { transaction: _, from } => {
                        debug!("Received transaction from {}", from);
                        // TODO: Forward to transaction pool
                    }
                    
                    NetworkEvent::CvpMutationAnnounced { contract_id, epoch, mutation_hash: _, from } => {
                        info!(
                            "CVP mutation announced: contract {:?} epoch {} from {}",
                            hex::encode(&contract_id[..8]), epoch, from
                        );
                        // TODO: Forward to CVP engine for validation
                    }
                    
                    NetworkEvent::ConsensusMessage { data, from } => {
                        debug!("Consensus message from {} ({} bytes)", from, data.len());
                        // TODO: Forward to consensus engine
                    }
                }
            }
        }
        
        info!("Network event loop terminated");
    }
    
    /// Background peer discovery loop
    // Not yet spawned from `start`; kept for the pending libp2p dial integration (see TODO below).
    #[allow(dead_code)]
    async fn peer_discovery_loop(
        discovery: Arc<RwLock<PeerDiscovery>>,
        _peers: Arc<RwLock<HashMap<PeerId, PeerInfo>>>,
    ) {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(30));
        
        loop {
            interval.tick().await;
            
            // Prune failed peers
            {
                let mut disc = discovery.write().await;
                disc.prune_failed_peers(5);
            }
            
            // Discover new peers
            let peers_to_connect = {
                let mut disc = discovery.write().await;
                match disc.discover().await {
                    Ok(peers) => peers,
                    Err(e) => {
                        warn!("Peer discovery failed: {:?}", e);
                        continue;
                    }
                }
            };
            
            if !peers_to_connect.is_empty() {
                debug!("Attempting to connect to {} discovered peers", peers_to_connect.len());
                
                // TODO: Initiate connections via libp2p swarm
                for peer_id in peers_to_connect {
                    debug!("Would attempt connection to peer: {}", peer_id);
                }
            }
        }
    }
    
    /// Stop the network service
    pub async fn stop(&mut self) -> Result<()> {
        if !self.running {
            return Ok(());
        }
        
        info!("Stopping P2P network...");
        self.running = false;
        
        // Clear peers
        self.peers.write().await.clear();
        
        info!("P2P network stopped");
        Ok(())
    }

    /// Broadcast a block to all peers via Gossipsub
    pub async fn broadcast_block(&mut self, block: &Block) -> Result<()> {
        // Try to use swarm if available
        if let Some(swarm) = &self.swarm_manager {
            info!("Broadcasting block {} via Gossipsub", block.header.block_number);
            swarm.broadcast_block(block.clone()).await?;
            return Ok(());
        }
        
        // Fallback: queue for later
        let peer_count = self.peer_count().await;
        if peer_count == 0 {
            self.pending_blocks.write().await.push(block.clone());
            debug!("Block {} queued for broadcast (no peers connected)", block.header.block_number);
            return Ok(());
        }
        
        warn!("Swarm not available, block not broadcast");
        Ok(())
    }

    /// Broadcast a transaction to all peers via Gossipsub
    pub async fn broadcast_transaction(&mut self, tx: &demiurge_core::Transaction) -> Result<()> {
        // Try to use swarm if available
        if let Some(swarm) = &self.swarm_manager {
            debug!("Broadcasting transaction via Gossipsub");
            swarm.broadcast_transaction(tx.clone()).await?;
            return Ok(());
        }
        
        // Fallback: queue for later
        let peer_count = self.peer_count().await;
        if peer_count == 0 {
            self.pending_transactions.write().await.push(tx.clone());
            debug!("Transaction queued for broadcast (no peers connected)");
            return Ok(());
        }
        
        warn!("Swarm not available, transaction not broadcast");
        Ok(())
    }
    
    /// Broadcast a CVP mutation announcement
    pub async fn broadcast_cvp_mutation(
        &self,
        contract_id: [u8; 32],
        epoch: u64,
        mutation_hash: [u8; 32],
    ) -> Result<()> {
        if let Some(swarm) = &self.swarm_manager {
            info!("Broadcasting CVP mutation for epoch {}", epoch);
            swarm.broadcast_cvp_mutation(contract_id, epoch, mutation_hash).await?;
        } else {
            warn!("Swarm not available, CVP mutation not broadcast");
        }
        Ok(())
    }
    
    /// Broadcast a consensus message
    pub async fn broadcast_consensus(&self, data: Vec<u8>) -> Result<()> {
        if let Some(swarm) = &self.swarm_manager {
            debug!("Broadcasting consensus message ({} bytes)", data.len());
            swarm.broadcast_consensus(data).await?;
        } else {
            warn!("Swarm not available, consensus message not broadcast");
        }
        Ok(())
    }
    
    /// Get the SwarmManager if available
    pub fn swarm(&self) -> Option<Arc<SwarmManager>> {
        self.swarm_manager.clone()
    }

    /// Get connected peer count
    pub async fn peer_count(&self) -> usize {
        self.peers.read().await
            .values()
            .filter(|p| p.connected)
            .count()
    }
    
    /// Get discovery peer count (includes pending connections)
    pub async fn discovered_peer_count(&self) -> usize {
        self.discovery.read().await.connected_count()
    }

    /// Get peer information
    pub async fn get_peer(&self, peer_id: &PeerId) -> Option<PeerInfo> {
        self.peers.read().await.get(peer_id).cloned()
    }
    
    /// Get all connected peers
    pub async fn get_connected_peers(&self) -> Vec<PeerInfo> {
        self.peers.read().await
            .values()
            .filter(|p| p.connected)
            .cloned()
            .collect()
    }
    
    /// Get all discovered peers
    pub async fn get_discovered_peers(&self) -> Vec<DiscoveredPeer> {
        self.discovery.read().await
            .all_peers()
            .values()
            .cloned()
            .collect()
    }
    
    /// Add a peer manually (for testing or manual peer management)
    pub async fn add_peer(&mut self, peer_id: PeerId, address: String) -> Result<()> {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        let peer_info = PeerInfo {
            peer_id,
            address: address.clone(),
            connected: false,
            last_seen: now,
            block_height: 0,
        };
        
        self.peers.write().await.insert(peer_id, peer_info);
        
        // Also add to discovery
        if let Ok(multiaddr) = address.parse() {
            let mut discovery = self.discovery.write().await;
            discovery.add_peer_with_addr(peer_id, multiaddr, false);
        }
        
        Ok(())
    }
    
    /// Mark a peer as connected
    pub async fn peer_connected(&mut self, peer_id: &PeerId) {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        if let Some(peer) = self.peers.write().await.get_mut(peer_id) {
            peer.connected = true;
            peer.last_seen = now;
            info!("Peer connected: {}", peer_id);
        }
        
        // Update discovery state
        self.discovery.write().await.peer_connected(peer_id);
    }
    
    /// Mark a peer as disconnected
    pub async fn peer_disconnected(&mut self, peer_id: &PeerId) {
        if let Some(peer) = self.peers.write().await.get_mut(peer_id) {
            peer.connected = false;
            warn!("Peer disconnected: {}", peer_id);
        }
        
        // Update discovery state
        self.discovery.write().await.peer_disconnected(peer_id);
    }
    
    /// Handle connection failure
    pub async fn connection_failed(&mut self, peer_id: &PeerId) {
        self.discovery.write().await.connection_failed(peer_id);
    }
    
    /// Is the network running?
    pub fn is_running(&self) -> bool {
        self.running
    }
    
    /// Get local peer ID
    pub fn local_peer_id(&self) -> Option<PeerId> {
        self.local_peer_id
    }
    
    /// Get pending block count
    pub async fn pending_block_count(&self) -> usize {
        self.pending_blocks.read().await.len()
    }
    
    /// Get pending transaction count
    pub async fn pending_transaction_count(&self) -> usize {
        self.pending_transactions.read().await.len()
    }
    
    /// Flush pending broadcasts (call when peers connect)
    pub async fn flush_pending(&mut self) -> Result<()> {
        let peer_count = self.peer_count().await;
        if peer_count == 0 {
            return Ok(());
        }
        
        // Flush pending blocks
        let pending_blocks = {
            let mut blocks = self.pending_blocks.write().await;
            std::mem::take(&mut *blocks)
        };
        
        if !pending_blocks.is_empty() {
            info!("Flushing {} pending blocks to {} peers", pending_blocks.len(), peer_count);
            for block in pending_blocks {
                // TODO: Actually broadcast via libp2p
                debug!("Would broadcast pending block {}", block.header.block_number);
            }
        }
        
        // Flush pending transactions
        let pending_txs = {
            let mut txs = self.pending_transactions.write().await;
            std::mem::take(&mut *txs)
        };
        
        if !pending_txs.is_empty() {
            info!("Flushing {} pending transactions to {} peers", pending_txs.len(), peer_count);
            for _tx in pending_txs {
                // TODO: Actually broadcast via libp2p
                debug!("Would broadcast pending transaction");
            }
        }
        
        Ok(())
    }
}

impl Default for NetworkService {
    fn default() -> Self {
        Self::new().unwrap()
    }
}
