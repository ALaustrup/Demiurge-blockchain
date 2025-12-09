//! System Improvement Heuristics
//!
//! PHASE OMEGA PART III: Heuristics for evaluating system improvements

use crate::core::evolution::evolution_kernel::{SystemDelta, ImpactEstimate};

/// Heuristic weights for scoring
#[derive(Debug, Clone)]
pub struct HeuristicWeights {
    pub fitness_weight: f64,
    pub stability_weight: f64,
    pub throughput_weight: f64,
    pub risk_weight: f64,
}

impl Default for HeuristicWeights {
    fn default() -> Self {
        Self {
            fitness_weight: 0.4,
            stability_weight: 0.3,
            throughput_weight: 0.2,
            risk_weight: 0.1,
        }
    }
}

/// System Improvement Heuristics
pub struct SystemImprovementHeuristics {
    weights: HeuristicWeights,
}

impl SystemImprovementHeuristics {
    /// Create new heuristics
    pub fn new(weights: HeuristicWeights) -> Self {
        Self { weights }
    }

    /// Calculate improvement score
    pub fn calculate_score(&self, delta: &SystemDelta) -> f64 {
        let impact = &delta.estimated_impact;
        
        let fitness_score = impact.fitness_gain * self.weights.fitness_weight;
        let stability_score = (1.0 - impact.stability_impact.abs()) * self.weights.stability_weight;
        let throughput_score = impact.throughput_gain * self.weights.throughput_weight;
        let risk_penalty = impact.risk_score * self.weights.risk_weight;
        
        fitness_score + stability_score + throughput_score - risk_penalty
    }

    /// Check if delta meets minimum thresholds
    pub fn meets_thresholds(&self, delta: &SystemDelta, min_fitness: f64, max_risk: f64) -> bool {
        let impact = &delta.estimated_impact;
        impact.fitness_gain >= min_fitness && impact.risk_score <= max_risk
    }

    /// Rank deltas by improvement potential
    pub fn rank_deltas(&self, deltas: &[SystemDelta]) -> Vec<(SystemDelta, f64)> {
        let mut ranked: Vec<(SystemDelta, f64)> = deltas.iter()
            .map(|d| (d.clone(), self.calculate_score(d)))
            .collect();
        
        ranked.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
        ranked
    }

    /// Get optimal weight configuration for current system state
    pub fn get_adaptive_weights(&self, system_health: f64) -> HeuristicWeights {
        // Adjust weights based on system health
        if system_health < 0.5 {
            // System unhealthy: prioritize stability
            HeuristicWeights {
                fitness_weight: 0.2,
                stability_weight: 0.5,
                throughput_weight: 0.2,
                risk_weight: 0.1,
            }
        } else if system_health > 0.9 {
            // System healthy: prioritize optimization
            HeuristicWeights {
                fitness_weight: 0.5,
                stability_weight: 0.2,
                throughput_weight: 0.2,
                risk_weight: 0.1,
            }
        } else {
            // Balanced
            HeuristicWeights::default()
        }
    }
}

impl Default for SystemImprovementHeuristics {
    fn default() -> Self {
        Self::new(HeuristicWeights::default())
    }
}
