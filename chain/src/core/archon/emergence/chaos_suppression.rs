//! Chaos Suppression
//!
//! PHASE OMEGA PART V: Suppresses chaotic attractors to maintain identity coherence

use crate::core::archon::emergence::convergence_solver::AttractorPoint;
use serde::{Deserialize, Serialize};

/// Chaos level
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ChaosLevel {
    None,
    Low,
    Medium,
    High,
    Critical,
}

/// Chaos Suppression Manager
pub struct ChaosSuppression {
    stability_threshold: f64,
}

impl ChaosSuppression {
    /// Create new suppression manager
    pub fn new(threshold: f64) -> Self {
        Self {
            stability_threshold: threshold,
        }
    }

    /// Detect chaos level
    pub fn detect_chaos(&self, attractors: &[AttractorPoint]) -> ChaosLevel {
        if attractors.is_empty() {
            return ChaosLevel::None;
        }
        
        // Calculate average stability
        let avg_stability: f64 = attractors.iter()
            .map(|a| a.stability)
            .sum::<f64>() / attractors.len() as f64;
        
        // Count unstable attractors
        let unstable_count = attractors.iter()
            .filter(|a| a.stability < self.stability_threshold)
            .count();
        
        let unstable_ratio = unstable_count as f64 / attractors.len() as f64;
        
        if unstable_ratio < 0.1 {
            ChaosLevel::None
        } else if unstable_ratio < 0.3 {
            ChaosLevel::Low
        } else if unstable_ratio < 0.5 {
            ChaosLevel::Medium
        } else if unstable_ratio < 0.7 {
            ChaosLevel::High
        } else {
            ChaosLevel::Critical
        }
    }

    /// Suppress chaotic attractors
    pub fn suppress(&self, attractors: &mut Vec<AttractorPoint>) {
        // Remove attractors below stability threshold
        attractors.retain(|a| a.stability >= self.stability_threshold);
    }

    /// Check if identity coherence is maintained
    pub fn check_coherence(&self, attractors: &[AttractorPoint]) -> bool {
        if attractors.is_empty() {
            return false;
        }
        
        let avg_stability: f64 = attractors.iter()
            .map(|a| a.stability)
            .sum::<f64>() / attractors.len() as f64;
        
        avg_stability >= self.stability_threshold
    }
}

impl Default for ChaosSuppression {
    fn default() -> Self {
        Self::new(0.7) // 70% stability threshold
    }
}
