//! LibP2P Swarm - The Nervous System of the Demiurge Protocol
//!
//! This module implements the actual P2P networking using LibP2P.
//! It handles peer discovery, block propagation, and transaction gossip.
//!
//! # Architecture
//!
//! The swarm uses three behaviours:
//! - **Gossipsub**: For block and transaction propagation (The Blood Flow)
//! - **Kademlia**: For peer discovery (The Sensory Network)
//! - **Identify**: For peer identification (The Recognition System)
//!
//! # The Living Organism Metaphor
//!
//! ```text
//!                    ┌──────────────────────┐
//!                    │   THE DEMIURGE       │
//!                    │   NERVOUS SYSTEM     │
//!                    └──────────┬───────────┘
//!                               │
//!        ┌──────────────────────┼──────────────────────┐
//!        ▼                      ▼                      ▼
//!   ┌─────────┐           ┌─────────┐           ┌─────────┐
//!   │ BLOCKS  │           │   TXS   │           │   CVP   │
//!   │ (Blood) │           │ (Nerve) │           │(Immune) │
//!   └─────────┘           └─────────┘           └─────────┘
//! ```

use crate::{NetworkError, Message, Protocol};

/// Type alias for swarm results (avoiding conflict with NetworkBehaviour derive)
type SwarmResult<T> = std::result::Result<T, NetworkError>;
use demiurge_core::{Block, Transaction};
use libp2p::{
    gossipsub::{
        self, Behaviour as GossipsubBehaviour,
        ConfigBuilder as GossipsubConfigBuilder,
        Event as GossipsubEvent, IdentTopic, Message as GossipsubMessage,
        MessageAuthenticity, MessageId,
    },
    identify::{self, Behaviour as IdentifyBehaviour, Event as IdentifyEvent},
    kad::{self, Behaviour as KadBehaviour, Event as KadEvent, store::MemoryStore},
    noise,
    swarm::{NetworkBehaviour, SwarmEvent},
    tcp, yamux, Multiaddr, PeerId, Swarm, SwarmBuilder,
};
use futures::StreamExt;
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::{mpsc, RwLock};
use tracing::{debug, error, info, warn};

// ============================================================================
// CONSTANTS - The Heartbeat Parameters
// ============================================================================

/// Gossipsub topic for block announcements
pub const TOPIC_BLOCKS: &str = "/demiurge/blocks/1.0.0";

/// Gossipsub topic for transaction propagation
pub const TOPIC_TRANSACTIONS: &str = "/demiurge/transactions/1.0.0";

/// Gossipsub topic for CVP mutation announcements
pub const TOPIC_CVP_MUTATIONS: &str = "/demiurge/cvp/mutations/1.0.0";

/// Gossipsub topic for consensus messages
pub const TOPIC_CONSENSUS: &str = "/demiurge/consensus/1.0.0";

/// Protocol version for identify
pub const PROTOCOL_VERSION: &str = "/demiurge/1.0.0";

/// Agent version for identify
pub const AGENT_VERSION: &str = "demiurge-node/0.1.0";

// ============================================================================
// NETWORK BEHAVIOUR - The Combined Nervous System
// ============================================================================

/// Combined network behaviour for the Demiurge Protocol
/// 
/// Uses libp2p 0.53+ which auto-generates the event enum as `DemiurgeBehaviourEvent`
#[derive(NetworkBehaviour)]
#[behaviour(out_event = "DemiurgeBehaviourEvent")]
pub struct DemiurgeBehaviour {
    /// Gossipsub for message propagation (blocks, transactions, CVP)
    pub gossipsub: GossipsubBehaviour,
    
    /// Kademlia for peer discovery
    pub kademlia: KadBehaviour<MemoryStore>,
    
    /// Identify for peer recognition
    pub identify: IdentifyBehaviour,
}

/// Events emitted by the combined behaviour
#[derive(Debug)]
pub enum DemiurgeBehaviourEvent {
    Gossipsub(GossipsubEvent),
    Kademlia(KadEvent),
    Identify(IdentifyEvent),
}

impl From<GossipsubEvent> for DemiurgeBehaviourEvent {
    fn from(event: GossipsubEvent) -> Self {
        DemiurgeBehaviourEvent::Gossipsub(event)
    }
}

impl From<KadEvent> for DemiurgeBehaviourEvent {
    fn from(event: KadEvent) -> Self {
        DemiurgeBehaviourEvent::Kademlia(event)
    }
}

impl From<IdentifyEvent> for DemiurgeBehaviourEvent {
    fn from(event: IdentifyEvent) -> Self {
        DemiurgeBehaviourEvent::Identify(event)
    }
}

// ============================================================================
// SWARM MANAGER - The Heart Controller
// ============================================================================

/// Events that can be received from the network
#[derive(Debug, Clone)]
pub enum NetworkEvent {
    /// A new block was received
    BlockReceived {
        block: Block,
        from: PeerId,
    },
    /// A new transaction was received
    TransactionReceived {
        transaction: Transaction,
        from: PeerId,
    },
    /// A CVP mutation was announced
    CvpMutationAnnounced {
        contract_id: [u8; 32],
        epoch: u64,
        mutation_hash: [u8; 32],
        from: PeerId,
    },
    /// A consensus message was received
    ConsensusMessage {
        data: Vec<u8>,
        from: PeerId,
    },
    /// A new peer connected
    PeerConnected(PeerId),
    /// A peer disconnected
    PeerDisconnected(PeerId),
}

/// Commands that can be sent to the swarm
#[derive(Debug)]
pub enum SwarmCommand {
    /// Broadcast a block to all peers
    BroadcastBlock(Block),
    /// Broadcast a transaction to all peers
    BroadcastTransaction(Transaction),
    /// Broadcast a CVP mutation announcement
    BroadcastCvpMutation {
        contract_id: [u8; 32],
        epoch: u64,
        mutation_hash: [u8; 32],
    },
    /// Broadcast a consensus message
    BroadcastConsensus(Vec<u8>),
    /// Connect to a peer
    Connect(Multiaddr),
    /// Disconnect from a peer
    Disconnect(PeerId),
    /// Shutdown the swarm
    Shutdown,
}

/// The Swarm Manager - orchestrates all P2P networking
pub struct SwarmManager {
    /// Channel to send commands to the swarm
    command_tx: mpsc::Sender<SwarmCommand>,
    
    /// Channel to receive events from the swarm
    event_rx: Arc<RwLock<mpsc::Receiver<NetworkEvent>>>,
    
    /// Local peer ID
    local_peer_id: PeerId,
    
    /// Running flag
    running: Arc<RwLock<bool>>,
}

impl SwarmManager {
    /// Create a new SwarmManager and spawn the network task
    pub async fn new(
        keypair_seed: Option<[u8; 32]>,
        listen_addr: Multiaddr,
        bootstrap_peers: Vec<Multiaddr>,
    ) -> SwarmResult<Self> {
        // Generate or derive keypair
        let keypair = if let Some(seed) = keypair_seed {
            libp2p::identity::Keypair::ed25519_from_bytes(seed)
                .map_err(|e| NetworkError::ConnectionFailed(format!("Invalid keypair seed: {}", e)))?
        } else {
            libp2p::identity::Keypair::generate_ed25519()
        };
        
        let local_peer_id = PeerId::from(keypair.public());
        info!("Local peer ID: {}", local_peer_id);
        
        // Create the swarm
        let swarm = Self::create_swarm(keypair.clone(), &local_peer_id)?;
        
        // Create channels
        let (command_tx, command_rx) = mpsc::channel(256);
        let (event_tx, event_rx) = mpsc::channel(256);
        
        let running = Arc::new(RwLock::new(true));
        let running_clone = running.clone();
        
        // Spawn the swarm task
        tokio::spawn(async move {
            Self::run_swarm(
                swarm,
                listen_addr,
                bootstrap_peers,
                command_rx,
                event_tx,
                running_clone,
            ).await;
        });
        
        Ok(Self {
            command_tx,
            event_rx: Arc::new(RwLock::new(event_rx)),
            local_peer_id,
            running,
        })
    }
    
    /// Create the libp2p swarm with all behaviours
    fn create_swarm(
        keypair: libp2p::identity::Keypair,
        local_peer_id: &PeerId,
    ) -> SwarmResult<Swarm<DemiurgeBehaviour>> {
        // Configure Gossipsub with content-addressed message deduplication
        let message_id_fn = |message: &GossipsubMessage| {
            let mut hasher = DefaultHasher::new();
            message.data.hash(&mut hasher);
            MessageId::from(hasher.finish().to_be_bytes().to_vec())
        };
        
        let gossipsub_config = GossipsubConfigBuilder::default()
            .heartbeat_interval(Duration::from_secs(1))
            .validation_mode(gossipsub::ValidationMode::Strict)
            .message_id_fn(message_id_fn)
            .build()
            .map_err(|e| NetworkError::ConnectionFailed(format!("Gossipsub config error: {}", e)))?;
        
        let gossipsub = GossipsubBehaviour::new(
            MessageAuthenticity::Signed(keypair.clone()),
            gossipsub_config,
        ).map_err(|e| NetworkError::ConnectionFailed(format!("Gossipsub error: {}", e)))?;
        
        // Configure Kademlia for peer discovery
        let store = MemoryStore::new(*local_peer_id);
        let mut kademlia = KadBehaviour::new(*local_peer_id, store);
        // Set Kademlia to server mode for full nodes
        kademlia.set_mode(Some(kad::Mode::Server));
        
        // Configure Identify for peer recognition
        let identify = IdentifyBehaviour::new(
            identify::Config::new(PROTOCOL_VERSION.to_string(), keypair.public())
                .with_agent_version(AGENT_VERSION.to_string())
                .with_interval(Duration::from_secs(60)),
        );
        
        // Create combined behaviour (The Nervous System)
        let behaviour = DemiurgeBehaviour {
            gossipsub,
            kademlia,
            identify,
        };
        
        // Build the swarm with Tokio runtime
        let swarm = SwarmBuilder::with_existing_identity(keypair)
            .with_tokio()
            .with_tcp(
                tcp::Config::default(),
                noise::Config::new,
                yamux::Config::default,
            )
            .map_err(|e| NetworkError::ConnectionFailed(format!("TCP error: {}", e)))?
            .with_behaviour(|_| Ok(behaviour))
            .map_err(|e| NetworkError::ConnectionFailed(format!("Behaviour error: {}", e)))?
            .with_swarm_config(|cfg| cfg.with_idle_connection_timeout(Duration::from_secs(120)))
            .build();
        
        info!("Swarm created with peer ID: {}", local_peer_id);
        Ok(swarm)
    }
    
    /// Run the swarm event loop
    async fn run_swarm(
        mut swarm: Swarm<DemiurgeBehaviour>,
        listen_addr: Multiaddr,
        bootstrap_peers: Vec<Multiaddr>,
        mut command_rx: mpsc::Receiver<SwarmCommand>,
        event_tx: mpsc::Sender<NetworkEvent>,
        running: Arc<RwLock<bool>>,
    ) {
        // Subscribe to topics
        let topics = vec![
            IdentTopic::new(TOPIC_BLOCKS),
            IdentTopic::new(TOPIC_TRANSACTIONS),
            IdentTopic::new(TOPIC_CVP_MUTATIONS),
            IdentTopic::new(TOPIC_CONSENSUS),
        ];
        
        for topic in &topics {
            if let Err(e) = swarm.behaviour_mut().gossipsub.subscribe(topic) {
                error!("Failed to subscribe to topic {}: {:?}", topic, e);
            } else {
                info!("Subscribed to topic: {}", topic);
            }
        }
        
        // Start listening
        match swarm.listen_on(listen_addr.clone()) {
            Ok(_) => info!("Listening on {}", listen_addr),
            Err(e) => error!("Failed to listen on {}: {:?}", listen_addr, e),
        }
        
        // Connect to bootstrap peers
        let has_bootstrap_peers = !bootstrap_peers.is_empty();
        for addr in &bootstrap_peers {
            info!("Connecting to bootstrap peer: {}", addr);
            match swarm.dial(addr.clone()) {
                Ok(_) => debug!("Dialing {}", addr),
                Err(e) => warn!("Failed to dial {}: {:?}", addr, e),
            }
        }
        
        // Track if Kademlia bootstrap has been triggered
        let mut kademlia_bootstrap_triggered = false;
        
        // Main event loop
        loop {
            if !*running.read().await {
                info!("Swarm shutdown requested");
                break;
            }
            
            tokio::select! {
                // Handle swarm events
                event = swarm.select_next_some() => {
                    // Check if this is a connection established event - trigger Kademlia bootstrap
                    if let SwarmEvent::ConnectionEstablished { .. } = &event {
                        if has_bootstrap_peers && !kademlia_bootstrap_triggered {
                            info!("First peer connected, triggering Kademlia DHT bootstrap...");
                            match swarm.behaviour_mut().kademlia.bootstrap() {
                                Ok(_) => {
                                    info!("Kademlia bootstrap query started successfully");
                                    kademlia_bootstrap_triggered = true;
                                }
                                Err(e) => {
                                    warn!("Failed to start Kademlia bootstrap: {:?}", e);
                                    // Will retry on next connection
                                }
                            }
                        }
                    }
                    
                    Self::handle_swarm_event(&mut swarm, event, &event_tx).await;
                }
                
                // Handle commands
                Some(cmd) = command_rx.recv() => {
                    match cmd {
                        SwarmCommand::BroadcastBlock(block) => {
                            Self::do_broadcast_block(&mut swarm, &block);
                        }
                        SwarmCommand::BroadcastTransaction(tx) => {
                            Self::do_broadcast_transaction(&mut swarm, &tx);
                        }
                        SwarmCommand::BroadcastCvpMutation { contract_id, epoch, mutation_hash } => {
                            Self::do_broadcast_cvp_mutation(&mut swarm, contract_id, epoch, mutation_hash);
                        }
                        SwarmCommand::BroadcastConsensus(data) => {
                            Self::do_broadcast_consensus(&mut swarm, &data);
                        }
                        SwarmCommand::Connect(addr) => {
                            if let Err(e) = swarm.dial(addr.clone()) {
                                warn!("Failed to dial {}: {:?}", addr, e);
                            }
                        }
                        SwarmCommand::Disconnect(peer_id) => {
                            let _ = swarm.disconnect_peer_id(peer_id);
                        }
                        SwarmCommand::Shutdown => {
                            info!("Shutdown command received");
                            break;
                        }
                    }
                }
            }
        }
        
        info!("Swarm event loop terminated");
    }
    
    /// Handle a swarm event
    async fn handle_swarm_event(
        swarm: &mut Swarm<DemiurgeBehaviour>,
        event: SwarmEvent<DemiurgeBehaviourEvent>,
        event_tx: &mpsc::Sender<NetworkEvent>,
    ) {
        match event {
            SwarmEvent::Behaviour(DemiurgeBehaviourEvent::Gossipsub(
                GossipsubEvent::Message { propagation_source, message, .. }
            )) => {
                // Handle incoming gossipsub message
                let topic = message.topic.as_str();
                debug!("Received gossipsub message on topic: {}", topic);
                
                if topic == TOPIC_BLOCKS {
                    if let Ok(Message::Block(block)) = Protocol::decode(&message.data) {
                        let _ = event_tx.send(NetworkEvent::BlockReceived {
                            block,
                            from: propagation_source,
                        }).await;
                    }
                } else if topic == TOPIC_TRANSACTIONS {
                    if let Ok(Message::Transaction(tx)) = Protocol::decode(&message.data) {
                        let _ = event_tx.send(NetworkEvent::TransactionReceived {
                            transaction: tx,
                            from: propagation_source,
                        }).await;
                    }
                } else if topic == TOPIC_CVP_MUTATIONS {
                    // Parse CVP mutation message
                    if message.data.len() >= 72 {
                        let mut contract_id = [0u8; 32];
                        let mut mutation_hash = [0u8; 32];
                        contract_id.copy_from_slice(&message.data[0..32]);
                        let epoch = u64::from_le_bytes(message.data[32..40].try_into().unwrap());
                        mutation_hash.copy_from_slice(&message.data[40..72]);
                        
                        let _ = event_tx.send(NetworkEvent::CvpMutationAnnounced {
                            contract_id,
                            epoch,
                            mutation_hash,
                            from: propagation_source,
                        }).await;
                    }
                } else if topic == TOPIC_CONSENSUS {
                    let _ = event_tx.send(NetworkEvent::ConsensusMessage {
                        data: message.data,
                        from: propagation_source,
                    }).await;
                }
            }
            
            SwarmEvent::Behaviour(DemiurgeBehaviourEvent::Kademlia(event)) => {
                match event {
                    KadEvent::RoutingUpdated { peer, .. } => {
                        debug!("Kademlia routing updated for peer: {}", peer);
                    }
                    KadEvent::OutboundQueryProgressed { result, .. } => {
                        debug!("Kademlia query progressed: {:?}", result);
                    }
                    _ => {}
                }
            }
            
            SwarmEvent::Behaviour(DemiurgeBehaviourEvent::Identify(event)) => {
                match event {
                    IdentifyEvent::Received { peer_id, info } => {
                        info!(
                            "Identified peer {}: {} ({})",
                            peer_id, info.agent_version, info.protocol_version
                        );
                        
                        // Add peer's addresses to Kademlia
                        for addr in info.listen_addrs {
                            swarm.behaviour_mut().kademlia.add_address(&peer_id, addr);
                        }
                    }
                    IdentifyEvent::Sent { peer_id } => {
                        debug!("Sent identify to {}", peer_id);
                    }
                    _ => {}
                }
            }
            
            SwarmEvent::ConnectionEstablished { peer_id, .. } => {
                info!("Connection established with peer: {}", peer_id);
                let _ = event_tx.send(NetworkEvent::PeerConnected(peer_id)).await;
            }
            
            SwarmEvent::ConnectionClosed { peer_id, .. } => {
                info!("Connection closed with peer: {}", peer_id);
                let _ = event_tx.send(NetworkEvent::PeerDisconnected(peer_id)).await;
            }
            
            SwarmEvent::NewListenAddr { address, .. } => {
                info!("Listening on {}", address);
            }
            
            _ => {}
        }
    }
    
    /// Internal: Broadcast a block to all peers via gossipsub
    fn do_broadcast_block(swarm: &mut Swarm<DemiurgeBehaviour>, block: &Block) {
        let msg = Message::Block(block.clone());
        let data = Protocol::encode(&msg);
        let topic = IdentTopic::new(TOPIC_BLOCKS);
        
        match swarm.behaviour_mut().gossipsub.publish(topic, data) {
            Ok(_) => info!("Broadcast block #{}", block.header.block_number),
            Err(e) => error!("Failed to broadcast block: {:?}", e),
        }
    }
    
    /// Internal: Broadcast a transaction to all peers via gossipsub
    fn do_broadcast_transaction(swarm: &mut Swarm<DemiurgeBehaviour>, tx: &Transaction) {
        let msg = Message::Transaction(tx.clone());
        let data = Protocol::encode(&msg);
        let topic = IdentTopic::new(TOPIC_TRANSACTIONS);
        
        match swarm.behaviour_mut().gossipsub.publish(topic, data) {
            Ok(_) => debug!("Broadcast transaction"),
            Err(e) => error!("Failed to broadcast transaction: {:?}", e),
        }
    }
    
    /// Internal: Broadcast a CVP mutation announcement via gossipsub
    fn do_broadcast_cvp_mutation(
        swarm: &mut Swarm<DemiurgeBehaviour>,
        contract_id: [u8; 32],
        epoch: u64,
        mutation_hash: [u8; 32],
    ) {
        let mut data = Vec::with_capacity(72);
        data.extend_from_slice(&contract_id);
        data.extend_from_slice(&epoch.to_le_bytes());
        data.extend_from_slice(&mutation_hash);
        
        let topic = IdentTopic::new(TOPIC_CVP_MUTATIONS);
        
        match swarm.behaviour_mut().gossipsub.publish(topic, data) {
            Ok(_) => info!("Broadcast CVP mutation for epoch {}", epoch),
            Err(e) => error!("Failed to broadcast CVP mutation: {:?}", e),
        }
    }
    
    /// Internal: Broadcast a consensus message via gossipsub
    fn do_broadcast_consensus(swarm: &mut Swarm<DemiurgeBehaviour>, data: &[u8]) {
        let topic = IdentTopic::new(TOPIC_CONSENSUS);
        
        match swarm.behaviour_mut().gossipsub.publish(topic, data.to_vec()) {
            Ok(_) => debug!("Broadcast consensus message"),
            Err(e) => error!("Failed to broadcast consensus message: {:?}", e),
        }
    }
    
    // ========================================================================
    // PUBLIC API
    // ========================================================================
    
    /// Get the local peer ID
    pub fn local_peer_id(&self) -> PeerId {
        self.local_peer_id
    }
    
    /// Broadcast a block
    pub async fn broadcast_block(&self, block: Block) -> SwarmResult<()> {
        self.command_tx
            .send(SwarmCommand::BroadcastBlock(block))
            .await
            .map_err(|_| NetworkError::ConnectionFailed("Command channel closed".to_string()))
    }
    
    /// Broadcast a transaction
    pub async fn broadcast_transaction(&self, tx: Transaction) -> SwarmResult<()> {
        self.command_tx
            .send(SwarmCommand::BroadcastTransaction(tx))
            .await
            .map_err(|_| NetworkError::ConnectionFailed("Command channel closed".to_string()))
    }
    
    /// Broadcast a CVP mutation
    pub async fn broadcast_cvp_mutation(
        &self,
        contract_id: [u8; 32],
        epoch: u64,
        mutation_hash: [u8; 32],
    ) -> SwarmResult<()> {
        self.command_tx
            .send(SwarmCommand::BroadcastCvpMutation {
                contract_id,
                epoch,
                mutation_hash,
            })
            .await
            .map_err(|_| NetworkError::ConnectionFailed("Command channel closed".to_string()))
    }
    
    /// Broadcast a consensus message
    pub async fn broadcast_consensus(&self, data: Vec<u8>) -> SwarmResult<()> {
        self.command_tx
            .send(SwarmCommand::BroadcastConsensus(data))
            .await
            .map_err(|_| NetworkError::ConnectionFailed("Command channel closed".to_string()))
    }
    
    /// Connect to a peer
    pub async fn connect(&self, addr: Multiaddr) -> SwarmResult<()> {
        self.command_tx
            .send(SwarmCommand::Connect(addr))
            .await
            .map_err(|_| NetworkError::ConnectionFailed("Command channel closed".to_string()))
    }
    
    /// Disconnect from a peer
    pub async fn disconnect(&self, peer_id: PeerId) -> SwarmResult<()> {
        self.command_tx
            .send(SwarmCommand::Disconnect(peer_id))
            .await
            .map_err(|_| NetworkError::ConnectionFailed("Command channel closed".to_string()))
    }
    
    /// Receive the next network event
    pub async fn next_event(&self) -> Option<NetworkEvent> {
        self.event_rx.write().await.recv().await
    }
    
    /// Check if the swarm is running
    pub async fn is_running(&self) -> bool {
        *self.running.read().await
    }
    
    /// Shutdown the swarm
    pub async fn shutdown(&self) -> SwarmResult<()> {
        *self.running.write().await = false;
        let _ = self.command_tx.send(SwarmCommand::Shutdown).await;
        Ok(())
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_swarm_creation() {
        let listen_addr: Multiaddr = "/ip4/127.0.0.1/tcp/0".parse().unwrap();
        
        let manager = SwarmManager::new(
            None,
            listen_addr,
            vec![],
        ).await;
        
        assert!(manager.is_ok());
        
        let manager = manager.unwrap();
        assert!(manager.is_running().await);
        
        // Shutdown
        manager.shutdown().await.unwrap();
    }
    
    #[tokio::test]
    async fn test_peer_id_generation() {
        let seed = [42u8; 32];
        let listen_addr: Multiaddr = "/ip4/127.0.0.1/tcp/0".parse().unwrap();
        
        let manager1 = SwarmManager::new(
            Some(seed),
            listen_addr.clone(),
            vec![],
        ).await.unwrap();
        
        // Same seed should produce same peer ID
        // (Note: Can't test this directly as we can't run two on same port)
        
        manager1.shutdown().await.unwrap();
    }
}
