//! Divergence Resolver
//!
//! PHASE OMEGA PART IV: Resolution of divergent local goals

use crate::godnet_intentions::synthesis_engine::LocalIntention;
use serde::{Deserialize, Serialize};

/// Divergence detection
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Divergence {
    pub conflicting_goals: Vec<String>,
    pub divergence_score: f64,
}

/// Divergence Resolver
pub struct DivergenceResolver;

impl DivergenceResolver {
    /// Detect divergence
    pub fn detect(&self, intentions: &[LocalIntention]) -> Option<Divergence> {
        // Group by goal
        let mut goal_groups: std::collections::HashMap<String, Vec<&LocalIntention>> = std::collections::HashMap::new();
        
        for intention in intentions {
            goal_groups.entry(intention.goal.clone())
                .or_insert_with(Vec::new)
                .push(intention);
        }
        
        // Check for conflicts (multiple high-priority goals)
        let high_priority: Vec<String> = goal_groups.iter()
            .filter(|(_, ints)| {
                ints.iter().map(|i| i.priority).sum::<f64>() / ints.len() as f64 > 0.7
            })
            .map(|(goal, _)| goal.clone())
            .collect();
        
        if high_priority.len() > 1 {
            let divergence_score = high_priority.len() as f64 / intentions.len() as f64;
            Some(Divergence {
                conflicting_goals: high_priority,
                divergence_score,
            })
        } else {
            None
        }
    }

    /// Resolve divergence
    pub fn resolve(&self, divergence: &Divergence) -> String {
        // Simple resolution: choose first goal
        // In production, use more sophisticated conflict resolution
        divergence.conflicting_goals.first()
            .cloned()
            .unwrap_or_else(|| "No resolution".to_string())
    }
}
