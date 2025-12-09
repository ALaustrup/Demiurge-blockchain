//! Cascade Detector
//!
//! PHASE OMEGA PART IV: Detects cascade risks, instabilities, and resonant events

use serde::{Deserialize, Serialize};

/// Cascade detection
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CascadeDetection {
    pub cascade_type: CascadeType,
    pub severity: f64,
    pub affected_nodes: usize,
    pub predicted_time: u64,
}

/// Cascade type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CascadeType {
    Performance,
    Consensus,
    State,
    Network,
}

/// Cascade Detector
pub struct CascadeDetector {
    threshold: f64,
}

impl CascadeDetector {
    /// Create new detector
    pub fn new(threshold: f64) -> Self {
        Self { threshold }
    }

    /// Detect cascade
    pub fn detect(&self, node_healths: &[f64]) -> Option<CascadeDetection> {
        if node_healths.is_empty() {
            return None;
        }
        
        let avg_health: f64 = node_healths.iter().sum::<f64>() / node_healths.len() as f64;
        let unhealthy_count = node_healths.iter().filter(|&&h| h < self.threshold).count();
        
        if unhealthy_count > node_healths.len() / 2 {
            Some(CascadeDetection {
                cascade_type: CascadeType::Performance,
                severity: 1.0 - avg_health,
                affected_nodes: unhealthy_count,
                predicted_time: 0,
            })
        } else {
            None
        }
    }
}

impl Default for CascadeDetector {
    fn default() -> Self {
        Self::new(0.7) // 70% health threshold
    }
}
