//! Link Resonance
//!
//! PHASE OMEGA PART IV: Maintains link resonance (synchronization intensity)

use crate::core::godnet_fabric::fabric_mesh::{FabricMesh, NodeId};
use serde::{Deserialize, Serialize};

/// Resonance measurement
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResonanceMeasurement {
    pub from: NodeId,
    pub to: NodeId,
    pub resonance: f64,
    pub timestamp: u64,
    pub quality: ResonanceQuality,
}

/// Resonance quality
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ResonanceQuality {
    Perfect,
    High,
    Medium,
    Low,
    Broken,
}

/// Link Resonance Manager
pub struct LinkResonance {
    mesh: FabricMesh,
}

impl LinkResonance {
    /// Create new resonance manager
    pub fn new(mesh: FabricMesh) -> Self {
        Self { mesh }
    }

    /// Measure resonance between nodes
    pub fn measure(&self, from: &NodeId, to: &NodeId) -> ResonanceMeasurement {
        let resonance = self.calculate_resonance(from, to);
        let quality = self.classify_quality(resonance);
        
        ResonanceMeasurement {
            from: from.clone(),
            to: to.clone(),
            resonance,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            quality,
        }
    }

    /// Calculate resonance
    fn calculate_resonance(&self, from: &NodeId, to: &NodeId) -> f64 {
        // Find link
        for link in &self.mesh.links {
            if link.from == *from && link.to == *to {
                // Resonance decays over time
                let age = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs() - link.last_sync;
                
                let decay = (age as f64 / 3600.0).min(1.0); // Decay over 1 hour
                return (link.resonance * (1.0 - decay * 0.1)).max(0.0);
            }
        }
        
        0.0 // No link
    }

    /// Classify resonance quality
    fn classify_quality(&self, resonance: f64) -> ResonanceQuality {
        if resonance >= 0.95 {
            ResonanceQuality::Perfect
        } else if resonance >= 0.8 {
            ResonanceQuality::High
        } else if resonance >= 0.6 {
            ResonanceQuality::Medium
        } else if resonance >= 0.3 {
            ResonanceQuality::Low
        } else {
            ResonanceQuality::Broken
        }
    }

    /// Synchronize link
    pub fn synchronize(&mut self, from: &NodeId, to: &NodeId) {
        let resonance = self.calculate_resonance(from, to);
        self.mesh.update_resonance(from, to, (resonance + 0.1).min(1.0));
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
