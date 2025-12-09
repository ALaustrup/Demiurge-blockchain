//! Chain Anomaly Watcher
//!
//! PHASE OMEGA PART III: Monitors the ENTIRE system for anomalies

use crate::core::meta::cognitive_state::CognitiveStateManager;
use serde::{Deserialize, Serialize};

/// Anomaly type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AnomalyType {
    PerformanceDegradation,
    InvariantViolation,
    StateCorruption,
    SecurityBreach,
    ConsensusFailure,
}

/// Anomaly detection
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnomalyDetection {
    pub anomaly_type: AnomalyType,
    pub severity: f64,
    pub subsystem: String,
    pub description: String,
    pub timestamp: u64,
}

/// Chain Anomaly Watcher
pub struct ChainAnomalyWatcher {
    cognitive_state: CognitiveStateManager,
    anomaly_threshold: f64,
}

impl ChainAnomalyWatcher {
    /// Create new watcher
    pub fn new(threshold: f64) -> Self {
        Self {
            cognitive_state: CognitiveStateManager::new(),
            anomaly_threshold: threshold,
        }
    }

    /// Watch for anomalies
    pub fn watch(&self) -> Vec<AnomalyDetection> {
        let state = self.cognitive_state.get_current_state();
        let mut anomalies = Vec::new();
        
        // Check health
        if state.global_health < self.anomaly_threshold {
            anomalies.push(AnomalyDetection {
                anomaly_type: AnomalyType::PerformanceDegradation,
                severity: 1.0 - state.global_health,
                subsystem: "global".to_string(),
                description: format!("Global health below threshold: {}", state.global_health),
                timestamp: state.timestamp,
            });
        }
        
        // Check entropy
        if state.global_entropy > 0.5 {
            anomalies.push(AnomalyDetection {
                anomaly_type: AnomalyType::StateCorruption,
                severity: state.global_entropy,
                subsystem: "global".to_string(),
                description: format!("High entropy detected: {}", state.global_entropy),
                timestamp: state.timestamp,
            });
        }
        
        // Check invariants
        for (subsystem, held) in &state.invariant_status {
            if !held {
                anomalies.push(AnomalyDetection {
                    anomaly_type: AnomalyType::InvariantViolation,
                    severity: 1.0,
                    subsystem: format!("{:?}", subsystem),
                    description: "Invariant violation detected".to_string(),
                    timestamp: state.timestamp,
                });
            }
        }
        
        anomalies
    }
}

impl Default for ChainAnomalyWatcher {
    fn default() -> Self {
        Self::new(0.7) // 70% health threshold
    }
}
