//! Trend Predictor
//!
//! PHASE OMEGA PART III: Predicts chain traffic, compute load, state growth

use std::collections::VecDeque;
use serde::{Deserialize, Serialize};

/// Trend prediction
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrendPrediction {
    pub metric: String,
    pub current_value: f64,
    pub predicted_value: f64,
    pub confidence: f64,
    pub time_horizon: u64, // Blocks ahead
}

/// Trend Predictor
pub struct TrendPredictor {
    history: VecDeque<f64>,
    max_history: usize,
}

impl TrendPredictor {
    /// Create new predictor
    pub fn new(max_history: usize) -> Self {
        Self {
            history: VecDeque::new(),
            max_history,
        }
    }

    /// Record metric value
    pub fn record(&mut self, value: f64) {
        self.history.push_back(value);
        if self.history.len() > self.max_history {
            self.history.pop_front();
        }
    }

    /// Predict future value
    pub fn predict(&self, metric: &str, time_horizon: u64) -> TrendPrediction {
        if self.history.len() < 2 {
            return TrendPrediction {
                metric: metric.to_string(),
                current_value: self.history.back().copied().unwrap_or(0.0),
                predicted_value: self.history.back().copied().unwrap_or(0.0),
                confidence: 0.0,
                time_horizon,
            };
        }
        
        // Simple linear regression
        let trend = self.calculate_trend();
        let current = self.history.back().copied().unwrap_or(0.0);
        let predicted = current + trend * time_horizon as f64;
        let confidence = (self.history.len() as f64 / self.max_history as f64).min(1.0);
        
        TrendPrediction {
            metric: metric.to_string(),
            current_value: current,
            predicted_value: predicted,
            confidence,
            time_horizon,
        }
    }

    /// Calculate trend (slope)
    fn calculate_trend(&self) -> f64 {
        if self.history.len() < 2 {
            return 0.0;
        }
        
        let first = self.history.front().copied().unwrap_or(0.0);
        let last = self.history.back().copied().unwrap_or(0.0);
        let period = self.history.len() as f64;
        
        (last - first) / period
    }
}

impl Default for TrendPredictor {
    fn default() -> Self {
        Self::new(100) // Keep last 100 values
    }
}
