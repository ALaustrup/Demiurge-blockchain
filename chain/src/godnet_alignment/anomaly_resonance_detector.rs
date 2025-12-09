//! Anomaly Resonance Detector
//!
//! PHASE OMEGA PART IV: Detects network-wide deviations

use serde::{Deserialize, Serialize};

/// Anomaly resonance
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnomalyResonance {
    pub anomaly_type: String,
    pub resonance_strength: f64,
    pub affected_nodes: usize,
}

/// Anomaly Resonance Detector
pub struct AnomalyResonanceDetector {
    threshold: f64,
}

impl AnomalyResonanceDetector {
    /// Create new detector
    pub fn new(threshold: f64) -> Self {
        Self { threshold }
    }

    /// Detect resonance
    pub fn detect(&self, node_anomalies: &[f64]) -> Option<AnomalyResonance> {
        if node_anomalies.is_empty() {
            return None;
        }
        
        let avg_anomaly: f64 = node_anomalies.iter().sum::<f64>() / node_anomalies.len() as f64;
        let affected = node_anomalies.iter().filter(|&&a| a > self.threshold).count();
        
        if avg_anomaly > self.threshold {
            Some(AnomalyResonance {
                anomaly_type: "Network-wide".to_string(),
                resonance_strength: avg_anomaly,
                affected_nodes: affected,
            })
        } else {
            None
        }
    }
}

impl Default for AnomalyResonanceDetector {
    fn default() -> Self {
        Self::new(0.3) // 30% anomaly threshold
    }
}
