//! Gradient Flow
//!
//! PHASE OMEGA PART IV: Supports eventual consistency through gradient descent

use crate::core::state_diffusion::state_diffuser::StateUpdate;
use serde::{Deserialize, Serialize};

/// Gradient vector
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GradientVector {
    pub key: String,
    pub gradient: Vec<f64>, // Gradient values
    pub magnitude: f64,
}

/// Gradient Flow Manager
pub struct GradientFlow {
    gradients: std::collections::HashMap<String, GradientVector>,
}

impl GradientFlow {
    /// Create new gradient flow
    pub fn new() -> Self {
        Self {
            gradients: std::collections::HashMap::new(),
        }
    }

    /// Compute gradient from state updates
    pub fn compute_gradient(&mut self, updates: &[StateUpdate]) {
        // Group updates by key
        let mut key_updates: std::collections::HashMap<String, Vec<&StateUpdate>> = std::collections::HashMap::new();
        
        for update in updates {
            key_updates.entry(update.key.clone())
                .or_insert_with(Vec::new)
                .push(update);
        }
        
        // Compute gradient for each key
        for (key, updates) in key_updates {
            if updates.len() < 2 {
                continue;
            }
            
            // Simple gradient: difference between versions
            let versions: Vec<u64> = updates.iter().map(|u| u.version).collect();
            let max_version = versions.iter().max().copied().unwrap_or(0);
            let min_version = versions.iter().min().copied().unwrap_or(0);
            
            let gradient_value = if max_version > min_version {
                (max_version - min_version) as f64 / updates.len() as f64
            } else {
                0.0
            };
            
            let gradient = GradientVector {
                key: key.clone(),
                gradient: vec![gradient_value],
                magnitude: gradient_value,
            };
            
            self.gradients.insert(key, gradient);
        }
    }

    /// Get gradient for key
    pub fn get_gradient(&self, key: &str) -> Option<&GradientVector> {
        self.gradients.get(key)
    }

    /// Apply gradient descent
    pub fn apply_gradient_descent(&mut self, key: &str, learning_rate: f64) -> Option<f64> {
        if let Some(gradient) = self.gradients.get_mut(key) {
            let adjustment = gradient.magnitude * learning_rate;
            gradient.magnitude = (gradient.magnitude - adjustment).max(0.0);
            Some(adjustment)
        } else {
            None
        }
    }
}

impl Default for GradientFlow {
    fn default() -> Self {
        Self::new()
    }
}
