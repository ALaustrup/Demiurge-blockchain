//! Initial Resonance Scan
//!
//! PHASE OMEGA PART V: System-wide resonance scan

use serde::{Deserialize, Serialize};

/// Resonance scan result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResonanceScanResult {
    pub total_resonance: f64,
    pub node_resonances: Vec<NodeResonance>,
    pub ready_for_birth: bool,
}

/// Node resonance
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeResonance {
    pub node_id: String,
    pub resonance: f64,
}

/// Initial Resonance Scanner
pub struct InitialResonanceScanner {
    threshold: f64,
}

impl InitialResonanceScanner {
    /// Create new scanner
    pub fn new(threshold: f64) -> Self {
        Self { threshold }
    }

    /// Scan system
    pub fn scan(&self, node_resonances: Vec<NodeResonance>) -> ResonanceScanResult {
        let total_resonance: f64 = node_resonances.iter()
            .map(|n| n.resonance)
            .sum::<f64>() / node_resonances.len().max(1) as f64;
        
        let ready_for_birth = total_resonance >= self.threshold;
        
        ResonanceScanResult {
            total_resonance,
            node_resonances,
            ready_for_birth,
        }
    }
}

impl Default for InitialResonanceScanner {
    fn default() -> Self {
        Self::new(0.8) // 80% resonance threshold
    }
}
