//! Evolution Kernel v2
//!
//! PHASE OMEGA PART III: Evaluates all possible changes to the system
//! and chooses optimizations that maximize fitness, stability, throughput

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use crate::core::intentions::EvolutionDecision;

/// System delta (proposed change)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemDelta {
    pub id: String,
    pub description: String,
    pub target_subsystem: String,
    pub change_type: DeltaType,
    pub parameters: HashMap<String, String>,
    pub estimated_impact: ImpactEstimate,
}

/// Delta type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum DeltaType {
    Optimization,
    BugFix,
    Feature,
    Refactor,
    Security,
    Performance,
}

/// Impact estimate
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImpactEstimate {
    pub fitness_gain: f64, // Expected fitness improvement
    pub stability_impact: f64, // Stability change (-1.0 to 1.0)
    pub throughput_gain: f64, // Throughput improvement
    pub risk_score: f64, // Risk of negative impact (0.0 to 1.0)
}

/// Evolution Kernel
pub struct EvolutionKernel {
    pending_deltas: Vec<SystemDelta>,
    approved_deltas: Vec<SystemDelta>,
    rejected_deltas: Vec<SystemDelta>,
    fitness_threshold: f64,
    stability_threshold: f64,
}

impl EvolutionKernel {
    /// Create new evolution kernel
    pub fn new(fitness_threshold: f64, stability_threshold: f64) -> Self {
        Self {
            pending_deltas: Vec::new(),
            approved_deltas: Vec::new(),
            rejected_deltas: Vec::new(),
            fitness_threshold,
            stability_threshold,
        }
    }

    /// Evaluate delta from evolution decision
    pub fn evaluate_delta(&mut self, decision: EvolutionDecision) -> SystemDelta {
        // Estimate impact before moving decision.parameters
        let estimated_impact = Self::estimate_impact(&decision);
        
        // Convert decision to delta
        let delta = SystemDelta {
            id: format!("delta_{}", decision.intention_id),
            description: decision.goal.clone(),
            target_subsystem: decision.parameters.get("subsystem")
                .cloned()
                .unwrap_or_else(|| "unknown".to_string()),
            change_type: Self::classify_delta_type(&decision.goal),
            parameters: decision.parameters,
            estimated_impact,
        };
        
        self.pending_deltas.push(delta.clone());
        delta
    }

    /// Score delta using multi-dimensional heuristics
    pub fn score_delta(&self, delta: &SystemDelta) -> f64 {
        let impact = &delta.estimated_impact;
        
        // Multi-dimensional scoring
        let fitness_score = impact.fitness_gain * 0.4;
        let stability_score = (1.0 - impact.stability_impact.abs()) * 0.3;
        let throughput_score = impact.throughput_gain * 0.2;
        let risk_penalty = impact.risk_score * 0.1;
        
        fitness_score + stability_score + throughput_score - risk_penalty
    }

    /// Choose optimizations that maximize fitness, stability, throughput
    pub fn select_optimal_deltas(&mut self) -> Vec<SystemDelta> {
        // Score all pending deltas
        let mut scored: Vec<(SystemDelta, f64)> = self.pending_deltas.iter()
            .map(|d| (d.clone(), self.score_delta(d)))
            .collect();
        
        // Sort by score (highest first)
        scored.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        
        // Select deltas that meet thresholds
        let mut selected = Vec::new();
        for (delta, score) in scored {
            let impact = &delta.estimated_impact;
            
            if score >= self.fitness_threshold &&
               impact.stability_impact >= -self.stability_threshold &&
               impact.risk_score < 0.5 {
                selected.push(delta.clone());
                self.approved_deltas.push(delta);
            } else {
                self.rejected_deltas.push(delta);
            }
        }
        
        // Clear pending
        self.pending_deltas.clear();
        
        selected
    }

    /// Classify delta type from goal
    fn classify_delta_type(goal: &str) -> DeltaType {
        let goal_lower = goal.to_lowercase();
        
        if goal_lower.contains("security") || goal_lower.contains("vulnerability") {
            DeltaType::Security
        } else if goal_lower.contains("performance") || goal_lower.contains("speed") {
            DeltaType::Performance
        } else if goal_lower.contains("bug") || goal_lower.contains("fix") {
            DeltaType::BugFix
        } else if goal_lower.contains("optimize") || goal_lower.contains("improve") {
            DeltaType::Optimization
        } else if goal_lower.contains("refactor") || goal_lower.contains("clean") {
            DeltaType::Refactor
        } else {
            DeltaType::Feature
        }
    }

    /// Estimate impact of decision
    fn estimate_impact(decision: &EvolutionDecision) -> ImpactEstimate {
        // Simple heuristic estimation
        // In production, use ML models or historical data
        
        let goal_lower = decision.goal.to_lowercase();
        
        let fitness_gain = if goal_lower.contains("optimize") || goal_lower.contains("improve") {
            0.1
        } else if goal_lower.contains("critical") {
            0.3
        } else {
            0.05
        };
        
        let stability_impact = if goal_lower.contains("stability") || goal_lower.contains("fix") {
            0.2
        } else if goal_lower.contains("refactor") {
            -0.1
        } else {
            0.0
        };
        
        let throughput_gain = if goal_lower.contains("performance") {
            0.15
        } else {
            0.05
        };
        
        let risk_score = if goal_lower.contains("refactor") || goal_lower.contains("major") {
            0.3
        } else if goal_lower.contains("critical") {
            0.1
        } else {
            0.2
        };
        
        ImpactEstimate {
            fitness_gain,
            stability_impact,
            throughput_gain,
            risk_score,
        }
    }

    /// Get approved deltas
    pub fn get_approved_deltas(&self) -> &[SystemDelta] {
        &self.approved_deltas
    }

    /// Get rejected deltas
    pub fn get_rejected_deltas(&self) -> &[SystemDelta] {
        &self.rejected_deltas
    }
}

impl Default for EvolutionKernel {
    fn default() -> Self {
        Self::new(0.1, 0.2) // 10% fitness threshold, 20% stability threshold
    }
}
