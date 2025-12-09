//! Purity Field Enforcer
//!
//! PHASE OMEGA PART IV: Enforces purity through resonance suppression

use crate::godnet_alignment::anomaly_resonance_detector::AnomalyResonanceDetector;
use serde::{Deserialize, Serialize};

/// Purity field state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PurityFieldState {
    pub field_intensity: f64,
    pub suppression_active: bool,
    pub anomalies_suppressed: usize,
}

/// Purity Field Enforcer
pub struct PurityFieldEnforcer {
    detector: AnomalyResonanceDetector,
    suppression_threshold: f64,
}

impl PurityFieldEnforcer {
    /// Create new enforcer
    pub fn new() -> Self {
        Self {
            detector: AnomalyResonanceDetector::default(),
            suppression_threshold: 0.5,
        }
    }

    /// Enforce purity
    pub fn enforce(&self, node_anomalies: &[f64]) -> PurityFieldState {
        let resonance = self.detector.detect(node_anomalies);
        let suppression_active = resonance.as_ref()
            .map(|r| r.resonance_strength > self.suppression_threshold)
            .unwrap_or(false);
        
        PurityFieldState {
            field_intensity: resonance.as_ref()
                .map(|r| 1.0 - r.resonance_strength)
                .unwrap_or(1.0),
            suppression_active,
            anomalies_suppressed: resonance.as_ref()
                .map(|r| r.affected_nodes)
                .unwrap_or(0),
        }
    }
}

impl Default for PurityFieldEnforcer {
    fn default() -> Self {
        Self::new()
    }
}
