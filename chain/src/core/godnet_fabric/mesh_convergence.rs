//! Mesh Convergence
//!
//! PHASE OMEGA PART IV: Ensures mesh converges to stable state

use crate::core::godnet_fabric::fabric_mesh::FabricMesh;
use serde::{Deserialize, Serialize};

/// Convergence state
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ConvergenceState {
    Converging,
    Converged,
    Diverging,
    Unstable,
}

/// Convergence metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConvergenceMetrics {
    pub state: ConvergenceState,
    pub convergence_rate: f64,
    pub stability_score: f64,
    pub iterations: u64,
}

/// Mesh Convergence Manager
pub struct MeshConvergence {
    mesh: FabricMesh,
    convergence_threshold: f64,
}

impl MeshConvergence {
    /// Create new convergence manager
    pub fn new(mesh: FabricMesh, threshold: f64) -> Self {
        Self {
            mesh,
            convergence_threshold: threshold,
        }
    }

    /// Check convergence
    pub fn check_convergence(&self) -> ConvergenceMetrics {
        let stability = self.mesh.get_stability();
        let convergence_rate = self.calculate_convergence_rate();
        
        let state = if stability >= self.convergence_threshold {
            ConvergenceState::Converged
        } else if convergence_rate > 0.0 {
            ConvergenceState::Converging
        } else if convergence_rate < -0.1 {
            ConvergenceState::Diverging
        } else {
            ConvergenceState::Unstable
        };
        
        ConvergenceMetrics {
            state,
            convergence_rate,
            stability_score: stability,
            iterations: 0, // Would track actual iterations
        }
    }

    /// Calculate convergence rate
    fn calculate_convergence_rate(&self) -> f64 {
        // Simple rate calculation based on resonance trends
        // In production, track historical stability values
        let current_stability = self.mesh.get_stability();
        let target_stability = 0.9;
        
        if current_stability >= target_stability {
            0.0 // Already converged
        } else {
            (target_stability - current_stability) / 10.0 // Estimated rate
        }
    }

    /// Force convergence
    pub fn force_convergence(&mut self) {
        // Increase resonance of all links
        for link in &mut self.mesh.links {
            link.resonance = (link.resonance + 0.1).min(1.0);
        }
    }

    /// Get mesh reference
    pub fn get_mesh(&self) -> &FabricMesh {
        &self.mesh
    }
}
