//! Peer discovery mechanism
//!
//! Handles bootstrap peer connections and peer discovery for the Demiurge network.

use crate::{Result, NetworkError};
use libp2p::PeerId;
use libp2p::Multiaddr;
use std::collections::{HashSet, HashMap};
use std::str::FromStr;
use tracing::{info, warn, debug};

/// Peer connection state
#[derive(Clone, Debug, PartialEq)]
pub enum PeerState {
    /// Peer is known but not connected
    Disconnected,
    /// Connection attempt in progress
    Connecting,
    /// Peer is connected
    Connected,
    /// Connection failed (with retry count)
    Failed(u32),
}

/// Extended peer information
#[derive(Clone, Debug)]
pub struct DiscoveredPeer {
    pub peer_id: PeerId,
    pub addresses: Vec<Multiaddr>,
    pub state: PeerState,
    pub last_seen: u64,
    pub is_bootstrap: bool,
}

/// Peer discovery service
pub struct PeerDiscovery {
    known_peers: HashMap<PeerId, DiscoveredPeer>,
    bootstrap_addrs: Vec<(Multiaddr, Option<PeerId>)>,
    max_peers: usize,
    // Configured but not consulted yet; reconnect scheduling is still TODO.
    #[allow(dead_code)]
    reconnect_delay_secs: u64,
}

impl PeerDiscovery {
    /// Create a new peer discovery service
    pub fn new(bootstrap_peers: Vec<String>) -> Self {
        let mut bootstrap_addrs = Vec::new();
        
        for addr_str in &bootstrap_peers {
            match Self::parse_multiaddr(addr_str) {
                Ok((multiaddr, peer_id)) => {
                    info!("Parsed bootstrap peer: {} (peer_id: {:?})", multiaddr, peer_id);
                    bootstrap_addrs.push((multiaddr, peer_id));
                }
                Err(e) => {
                    warn!("Failed to parse bootstrap address '{}': {}", addr_str, e);
                }
            }
        }
        
        Self {
            known_peers: HashMap::new(),
            bootstrap_addrs,
            max_peers: 50,
            reconnect_delay_secs: 30,
        }
    }
    
    /// Parse a multiaddr string, optionally extracting the peer ID
    fn parse_multiaddr(addr: &str) -> Result<(Multiaddr, Option<PeerId>)> {
        let multiaddr = Multiaddr::from_str(addr)
            .map_err(|e| NetworkError::InvalidAddress(format!("Invalid multiaddr: {}", e)))?;
        
        // Try to extract peer ID from the multiaddr (e.g., /p2p/QmXxx...)
        let peer_id = multiaddr.iter()
            .find_map(|protocol| {
                if let libp2p::multiaddr::Protocol::P2p(peer_id) = protocol {
                    Some(peer_id)
                } else {
                    None
                }
            });
        
        Ok((multiaddr, peer_id))
    }

    /// Get bootstrap addresses for initial connection
    pub fn get_bootstrap_addrs(&self) -> Vec<(Multiaddr, Option<PeerId>)> {
        self.bootstrap_addrs.clone()
    }

    /// Discover new peers from connected peers
    pub async fn discover(&mut self) -> Result<Vec<PeerId>> {
        // Return peers that need connection attempts
        let peers_to_connect: Vec<PeerId> = self.known_peers
            .iter()
            .filter(|(_, peer)| {
                matches!(peer.state, PeerState::Disconnected) ||
                matches!(peer.state, PeerState::Failed(n) if n < 3)
            })
            .map(|(id, _)| *id)
            .collect();
        
        debug!("Discovery found {} peers to connect", peers_to_connect.len());
        Ok(peers_to_connect)
    }

    /// Add a known peer with address
    pub fn add_peer_with_addr(&mut self, peer_id: PeerId, addr: Multiaddr, is_bootstrap: bool) {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        if let Some(peer) = self.known_peers.get_mut(&peer_id) {
            // Update existing peer
            if !peer.addresses.contains(&addr) {
                peer.addresses.push(addr);
            }
            peer.last_seen = now;
        } else if self.known_peers.len() < self.max_peers {
            // Add new peer
            let peer = DiscoveredPeer {
                peer_id,
                addresses: vec![addr],
                state: PeerState::Disconnected,
                last_seen: now,
                is_bootstrap,
            };
            self.known_peers.insert(peer_id, peer);
            info!("Added new peer: {}", peer_id);
        }
    }

    /// Add a known peer (legacy interface)
    pub fn add_peer(&mut self, peer_id: PeerId) {
        if !self.known_peers.contains_key(&peer_id) && self.known_peers.len() < self.max_peers {
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs();
            
            let peer = DiscoveredPeer {
                peer_id,
                addresses: vec![],
                state: PeerState::Disconnected,
                last_seen: now,
                is_bootstrap: false,
            };
            self.known_peers.insert(peer_id, peer);
        }
    }
    
    /// Update peer state
    pub fn update_peer_state(&mut self, peer_id: &PeerId, state: PeerState) {
        if let Some(peer) = self.known_peers.get_mut(peer_id) {
            peer.state = state;
            peer.last_seen = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs();
        }
    }
    
    /// Mark peer as connected
    pub fn peer_connected(&mut self, peer_id: &PeerId) {
        self.update_peer_state(peer_id, PeerState::Connected);
        info!("Peer connected: {}", peer_id);
    }
    
    /// Mark peer as disconnected
    pub fn peer_disconnected(&mut self, peer_id: &PeerId) {
        self.update_peer_state(peer_id, PeerState::Disconnected);
        warn!("Peer disconnected: {}", peer_id);
    }
    
    /// Mark connection attempt failed
    pub fn connection_failed(&mut self, peer_id: &PeerId) {
        if let Some(peer) = self.known_peers.get_mut(peer_id) {
            let retry_count = match peer.state {
                PeerState::Failed(n) => n + 1,
                _ => 1,
            };
            peer.state = PeerState::Failed(retry_count);
            warn!("Connection failed for peer {} (attempt {})", peer_id, retry_count);
        }
    }

    /// Get known peers (legacy interface returning just the set of peer IDs)
    pub fn known_peers(&self) -> HashSet<PeerId> {
        self.known_peers.keys().cloned().collect()
    }
    
    /// Get all discovered peers with full info
    pub fn all_peers(&self) -> &HashMap<PeerId, DiscoveredPeer> {
        &self.known_peers
    }
    
    /// Get connected peer count
    pub fn connected_count(&self) -> usize {
        self.known_peers.values()
            .filter(|p| p.state == PeerState::Connected)
            .count()
    }

    /// Get bootstrap peers (legacy interface)
    pub fn bootstrap_peers(&self) -> Vec<String> {
        self.bootstrap_addrs
            .iter()
            .map(|(addr, _)| addr.to_string())
            .collect()
    }
    
    /// Remove peers that have exceeded max retry attempts
    pub fn prune_failed_peers(&mut self, max_retries: u32) {
        let to_remove: Vec<PeerId> = self.known_peers
            .iter()
            .filter(|(_, peer)| {
                !peer.is_bootstrap && matches!(peer.state, PeerState::Failed(n) if n >= max_retries)
            })
            .map(|(id, _)| *id)
            .collect();
        
        for peer_id in to_remove {
            self.known_peers.remove(&peer_id);
            debug!("Pruned failed peer: {}", peer_id);
        }
    }
}
