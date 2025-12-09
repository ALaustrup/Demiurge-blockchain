//! Global Trend Predictor
//!
//! PHASE OMEGA PART IV: Predicts behaviors of the entire God-Net

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use crate::core::godnet_fabric::NodeId;

/// Global trend prediction
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlobalTrendPrediction {
    pub metric: String,
    pub current_value: f64,
    pub predicted_value: f64,
    pub confidence: f64,
    pub node_predictions: HashMap<NodeId, f64>,
}

/// Global Trend Predictor
pub struct GlobalTrendPredictor {
    node_predictions: HashMap<NodeId, Vec<f64>>,
}

impl GlobalTrendPredictor {
    /// Create new predictor
    pub fn new() -> Self {
        Self {
            node_predictions: HashMap::new(),
        }
    }

    /// Add node prediction
    pub fn add_node_prediction(&mut self, node_id: NodeId, value: f64) {
        self.node_predictions.entry(node_id)
            .or_insert_with(Vec::new)
            .push(value);
    }

    /// Predict global trend
    pub fn predict(&self, metric: &str, time_horizon: u64) -> GlobalTrendPrediction {
        let node_predictions: HashMap<NodeId, f64> = self.node_predictions.iter()
            .map(|(id, values)| {
                let avg = values.iter().sum::<f64>() / values.len() as f64;
                (id.clone(), avg)
            })
            .collect();
        
        let current_value: f64 = node_predictions.values().sum::<f64>() / node_predictions.len() as f64;
        let predicted_value = current_value * 1.1; // Simple prediction
        
        GlobalTrendPrediction {
            metric: metric.to_string(),
            current_value,
            predicted_value,
            confidence: 0.8,
            node_predictions,
        }
    }
}

impl Default for GlobalTrendPredictor {
    fn default() -> Self {
        Self::new()
    }
}
