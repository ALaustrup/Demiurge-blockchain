//! Shock Detector
//!
//! PHASE OMEGA PART III: Detects future anomalies before they occur

use serde::{Deserialize, Serialize};

/// Shock type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ShockType {
    TrafficSpike,
    PerformanceDegradation,
    StateGrowth,
    ErrorRate,
}

/// Shock detection
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShockDetection {
    pub shock_type: ShockType,
    pub severity: f64, // 0.0 to 1.0
    pub predicted_time: u64, // Block height
    pub confidence: f64,
}

/// Shock Detector
pub struct ShockDetector {
    thresholds: std::collections::HashMap<ShockType, f64>,
}

impl ShockDetector {
    /// Create new detector
    pub fn new() -> Self {
        let mut thresholds = std::collections::HashMap::new();
        thresholds.insert(ShockType::TrafficSpike, 2.0); // 2x increase
        thresholds.insert(ShockType::PerformanceDegradation, 0.5); // 50% degradation
        thresholds.insert(ShockType::StateGrowth, 1.5); // 1.5x growth
        thresholds.insert(ShockType::ErrorRate, 0.1); // 10% error rate
        
        Self { thresholds }
    }

    /// Detect shock
    pub fn detect(&self, current_value: f64, predicted_value: f64, shock_type: ShockType) -> Option<ShockDetection> {
        let threshold = self.thresholds.get(&shock_type).copied().unwrap_or(1.0);
        let change_ratio = if current_value > 0.0 {
            predicted_value / current_value
        } else {
            1.0
        };
        
        if change_ratio >= threshold {
            let severity = ((change_ratio - threshold) / threshold).min(1.0);
            
            Some(ShockDetection {
                shock_type,
                severity,
                predicted_time: 0, // Would be calculated from trend
                confidence: 0.7, // Base confidence
            })
        } else {
            None
        }
    }
}

impl Default for ShockDetector {
    fn default() -> Self {
        Self::new()
    }
}
