//! Node Resonance Adapter
//!
//! PHASE OMEGA PART V: Detects resonance drift and repairs identity gaps

use crate::daemon::archon_presence::presence_daemon::PresenceDaemon;
use serde::{Deserialize, Serialize};

/// Resonance drift detection
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResonanceDrift {
    pub drift_amount: f64,
    pub detected: bool,
    pub repair_needed: bool,
}

/// Node Resonance Adapter
pub struct NodeResonanceAdapter {
    daemon: PresenceDaemon,
    drift_threshold: f64,
}

impl NodeResonanceAdapter {
    /// Create new adapter
    pub fn new(daemon: PresenceDaemon, threshold: f64) -> Self {
        Self {
            daemon,
            drift_threshold: threshold,
        }
    }

    /// Detect drift
    pub fn detect_drift(&self, expected_resonance: f64) -> ResonanceDrift {
        let current = self.daemon.get_contribution().resonance;
        let drift = (current - expected_resonance).abs();
        
        ResonanceDrift {
            drift_amount: drift,
            detected: drift > self.drift_threshold,
            repair_needed: drift > self.drift_threshold * 2.0,
        }
    }

    /// Repair resonance
    pub fn repair(&mut self, target_resonance: f64) {
        let current = self.daemon.get_contribution().resonance;
        let adjusted = (current + target_resonance) / 2.0; // Gradual adjustment
        self.daemon.update_contribution(
            self.daemon.get_contribution().contribution_strength,
            adjusted
        );
    }

    /// Get daemon reference
    pub fn get_daemon(&self) -> &PresenceDaemon {
        &self.daemon
    }
}
