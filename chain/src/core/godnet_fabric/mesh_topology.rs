//! Mesh Topology
//!
//! PHASE OMEGA PART IV: Evaluates mesh stability, topology entropy, and link decay

use crate::core::godnet_fabric::fabric_mesh::{FabricMesh, NodeId};
use serde::{Deserialize, Serialize};

/// Topology metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TopologyMetrics {
    pub node_count: usize,
    pub link_count: usize,
    pub average_degree: f64,
    pub connectivity: f64,
    pub entropy: f64,
    pub stability: f64,
}

/// Mesh Topology Analyzer
pub struct MeshTopology {
    mesh: FabricMesh,
}

impl MeshTopology {
    /// Create new topology analyzer
    pub fn new(mesh: FabricMesh) -> Self {
        Self { mesh }
    }

    /// Analyze topology
    pub fn analyze(&self) -> TopologyMetrics {
        let nodes = self.mesh.get_nodes();
        let node_count = nodes.len();
        let link_count = self.mesh.links.len();
        
        // Calculate average degree (connections per node)
        let average_degree = if node_count > 0 {
            (link_count as f64 * 2.0) / node_count as f64
        } else {
            0.0
        };
        
        // Calculate connectivity (actual links / possible links)
        let possible_links = if node_count > 1 {
            node_count * (node_count - 1) / 2
        } else {
            0
        };
        let connectivity = if possible_links > 0 {
            link_count as f64 / possible_links as f64
        } else {
            0.0
        };
        
        // Calculate entropy (topology disorder)
        let entropy = self.calculate_entropy();
        
        // Get stability
        let stability = self.mesh.get_stability();
        
        TopologyMetrics {
            node_count,
            link_count,
            average_degree,
            connectivity,
            entropy,
            stability,
        }
    }

    /// Calculate topology entropy
    fn calculate_entropy(&self) -> f64 {
        // Entropy based on link resonance distribution
        let resonances: Vec<f64> = self.mesh.links.iter()
            .map(|l| l.resonance)
            .collect();
        
        if resonances.is_empty() {
            return 0.0;
        }
        
        // Shannon entropy of resonance distribution
        let mut entropy = 0.0;
        let total: f64 = resonances.iter().sum();
        
        for &res in &resonances {
            if res > 0.0 {
                let p = res / total;
                entropy -= p * p.log2();
            }
        }
        
        entropy
    }

    /// Detect link decay
    pub fn detect_decay(&self, max_age: u64) -> Vec<(NodeId, NodeId)> {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        self.mesh.links.iter()
            .filter(|l| now - l.last_sync > max_age)
            .map(|l| (l.from.clone(), l.to.clone()))
            .collect()
    }

    /// Get mesh reference
    pub fn get_mesh(&self) -> &FabricMesh {
        &self.mesh
    }

    /// Get mesh mutable
    pub fn get_mesh_mut(&mut self) -> &mut FabricMesh {
        &mut self.mesh
    }
}
