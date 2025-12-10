//! God-Net Fabric Mesh
//!
//! PHASE OMEGA PART IV: Connects all Demiurge instances into a living mesh

use std::collections::HashMap;
use serde::{Deserialize, Serialize};

/// Node identifier
pub type NodeId = String;

/// Mesh link
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MeshLink {
    pub from: NodeId,
    pub to: NodeId,
    pub resonance: f64, // Synchronization intensity (0.0 to 1.0)
    pub latency: u64, // Milliseconds
    pub established_at: u64,
    pub last_sync: u64,
}

/// Fabric Mesh
pub struct FabricMesh {
    nodes: HashMap<NodeId, NodeInfo>,
    links: Vec<MeshLink>,
    local_node_id: NodeId,
}

/// Node information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeInfo {
    pub id: NodeId,
    pub address: String,
    pub health: f64,
    pub last_seen: u64,
}

impl FabricMesh {
    /// Create new fabric mesh
    pub fn new(local_node_id: NodeId) -> Self {
        let mut nodes = HashMap::new();
        nodes.insert(local_node_id.clone(), NodeInfo {
            id: local_node_id.clone(),
            address: "local".to_string(),
            health: 1.0,
            last_seen: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        });
        
        Self {
            nodes,
            links: Vec::new(),
            local_node_id,
        }
    }

    /// Add node to mesh
    pub fn add_node(&mut self, node: NodeInfo) {
        self.nodes.insert(node.id.clone(), node);
    }

    /// Add link between nodes
    pub fn add_link(&mut self, link: MeshLink) {
        // Remove existing link if present
        self.links.retain(|l| !(l.from == link.from && l.to == link.to));
        self.links.push(link);
    }

    /// Get all nodes
    pub fn get_nodes(&self) -> Vec<&NodeInfo> {
        self.nodes.values().collect()
    }

    /// Get links for node
    pub fn get_links(&self, node_id: &NodeId) -> Vec<&MeshLink> {
        self.links.iter()
            .filter(|l| l.from == *node_id || l.to == *node_id)
            .collect()
    }

    /// Get local node ID
    pub fn local_node_id(&self) -> &NodeId {
        &self.local_node_id
    }

    /// Update link resonance
    pub fn update_resonance(&mut self, from: &NodeId, to: &NodeId, resonance: f64) {
        for link in &mut self.links {
            if link.from == *from && link.to == *to {
                link.resonance = resonance;
                link.last_sync = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs();
            }
        }
    }

    /// Get mesh stability (average resonance)
    pub fn get_stability(&self) -> f64 {
        if self.links.is_empty() {
            return 1.0;
        }
        
        self.links.iter()
            .map(|l| l.resonance)
            .sum::<f64>() / self.links.len() as f64
    }
}
