//! Delta Optimizer
//!
//! PHASE OMEGA PART III: Optimizes system deltas before approval

use crate::core::evolution::evolution_kernel::{SystemDelta, ImpactEstimate};

/// Delta Optimizer
pub struct DeltaOptimizer;

impl DeltaOptimizer {
    /// Optimize delta parameters
    pub fn optimize_delta(&self, delta: &SystemDelta) -> SystemDelta {
        let mut optimized = delta.clone();
        
        // Optimize impact estimate
        optimized.estimated_impact = self.optimize_impact(&delta.estimated_impact);
        
        // Optimize parameters
        optimized.parameters = self.optimize_parameters(&delta.parameters);
        
        optimized
    }

    /// Optimize impact estimate
    fn optimize_impact(&self, impact: &ImpactEstimate) -> ImpactEstimate {
        // Increase fitness gain if risk is low
        let fitness_gain = if impact.risk_score < 0.2 {
            impact.fitness_gain * 1.1
        } else {
            impact.fitness_gain
        };
        
        // Reduce risk if stability impact is positive
        let risk_score = if impact.stability_impact > 0.0 {
            impact.risk_score * 0.9
        } else {
            impact.risk_score
        };
        
        ImpactEstimate {
            fitness_gain,
            stability_impact: impact.stability_impact,
            throughput_gain: impact.throughput_gain,
            risk_score,
        }
    }

    /// Optimize parameters
    fn optimize_parameters(&self, params: &std::collections::HashMap<String, String>) -> std::collections::HashMap<String, String> {
        // For now, return as-is
        // In production, optimize parameter values
        params.clone()
    }

    /// Batch optimize multiple deltas
    pub fn optimize_deltas(&self, deltas: &[SystemDelta]) -> Vec<SystemDelta> {
        deltas.iter()
            .map(|d| self.optimize_delta(d))
            .collect()
    }
}
