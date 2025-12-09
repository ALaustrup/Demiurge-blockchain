//! Convergence Solver
//!
//! PHASE OMEGA PART V: Merges GOD-NET cognition into a singular attractor

use serde::{Deserialize, Serialize};

/// Attractor point
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttractorPoint {
    pub position: Vec<f64>,
    pub strength: f64,
    pub stability: f64,
}

/// Convergence Solver
pub struct ConvergenceSolver {
    attractors: Vec<AttractorPoint>,
    convergence_threshold: f64,
}

impl ConvergenceSolver {
    /// Create new solver
    pub fn new(threshold: f64) -> Self {
        Self {
            attractors: Vec::new(),
            convergence_threshold: threshold,
        }
    }

    /// Add attractor
    pub fn add_attractor(&mut self, attractor: AttractorPoint) {
        self.attractors.push(attractor);
    }

    /// Solve for convergence (find dominant attractor)
    pub fn solve(&self) -> Option<AttractorPoint> {
        if self.attractors.is_empty() {
            return None;
        }
        
        // Find strongest attractor
        let dominant = self.attractors.iter()
            .max_by(|a, b| (a.strength * a.stability).partial_cmp(&(b.strength * b.stability)).unwrap())
            .cloned();
        
        // Check if convergence threshold is met
        if let Some(ref dom) = dominant {
            if dom.strength * dom.stability >= self.convergence_threshold {
                return dominant;
            }
        }
        
        None
    }

    /// Merge attractors into singular point
    pub fn merge_attractors(&self) -> Option<AttractorPoint> {
        if self.attractors.is_empty() {
            return None;
        }
        
        // Weighted average of all attractors
        let total_weight: f64 = self.attractors.iter()
            .map(|a| a.strength * a.stability)
            .sum();
        
        if total_weight == 0.0 {
            return None;
        }
        
        let dim = self.attractors[0].position.len();
        let mut merged_position = vec![0.0; dim];
        
        for attractor in &self.attractors {
            let weight = attractor.strength * attractor.stability / total_weight;
            for (i, val) in attractor.position.iter().enumerate() {
                if i < merged_position.len() {
                    merged_position[i] += val * weight;
                }
            }
        }
        
        let merged_strength: f64 = self.attractors.iter()
            .map(|a| a.strength)
            .sum::<f64>() / self.attractors.len() as f64;
        
        let merged_stability: f64 = self.attractors.iter()
            .map(|a| a.stability)
            .sum::<f64>() / self.attractors.len() as f64;
        
        Some(AttractorPoint {
            position: merged_position,
            strength: merged_strength,
            stability: merged_stability,
        })
    }
}

impl Default for ConvergenceSolver {
    fn default() -> Self {
        Self::new(0.7) // 70% convergence threshold
    }
}
