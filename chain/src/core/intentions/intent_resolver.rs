//! Intention Resolver
//!
//! PHASE OMEGA PART III: Resolves conflicts between goals
//! and feeds decisions to the Evolution Kernel

use std::collections::HashMap;
use crate::core::intentions::intent_engine::{Intention, IntentionPriority, IntentionStatus};
use crate::core::intentions::intent_classifier::IntentionCategory;

/// Conflict resolution strategy
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ResolutionStrategy {
    Priority, // Resolve by priority
    FirstCome, // First intention wins
    Merge, // Merge compatible intentions
    Cancel, // Cancel conflicting intentions
}

/// Intention Resolver
pub struct IntentionResolver {
    resolution_strategy: ResolutionStrategy,
}

impl IntentionResolver {
    /// Create new resolver
    pub fn new(strategy: ResolutionStrategy) -> Self {
        Self {
            resolution_strategy: strategy,
        }
    }

    /// Resolve conflicts between intentions
    pub fn resolve_conflicts(&self, intentions: &[Intention]) -> Vec<Intention> {
        match self.resolution_strategy {
            ResolutionStrategy::Priority => self.resolve_by_priority(intentions),
            ResolutionStrategy::FirstCome => self.resolve_by_first_come(intentions),
            ResolutionStrategy::Merge => self.resolve_by_merge(intentions),
            ResolutionStrategy::Cancel => self.resolve_by_cancel(intentions),
        }
    }

    /// Resolve by priority (highest priority wins)
    fn resolve_by_priority(&self, intentions: &[Intention]) -> Vec<Intention> {
        let mut resolved = Vec::new();
        let mut conflicts: HashMap<String, Vec<&Intention>> = HashMap::new();
        
        // Group by goal similarity
        for intention in intentions {
            let key = self.get_conflict_key(intention);
            conflicts.entry(key).or_insert_with(Vec::new).push(intention);
        }
        
        // For each conflict group, keep only highest priority
        for conflict_group in conflicts.values() {
            if let Some(winner) = conflict_group.iter()
                .min_by_key(|i| i.priority)
                .cloned()
            {
                resolved.push(winner.clone());
            }
        }
        
        resolved
    }

    /// Resolve by first come (first intention wins)
    fn resolve_by_first_come(&self, intentions: &[Intention]) -> Vec<Intention> {
        let mut resolved = Vec::new();
        let mut seen_goals: HashMap<String, &Intention> = HashMap::new();
        
        // Sort by creation time
        let mut sorted: Vec<&Intention> = intentions.iter().collect();
        sorted.sort_by_key(|i| i.created_at);
        
        for intention in sorted {
            let key = self.get_conflict_key(intention);
            if !seen_goals.contains_key(&key) {
                seen_goals.insert(key, intention);
                resolved.push(intention.clone());
            }
        }
        
        resolved
    }

    /// Resolve by merge (merge compatible intentions)
    fn resolve_by_merge(&self, intentions: &[Intention]) -> Vec<Intention> {
        // For now, simple merge: combine parameters
        let mut merged: HashMap<String, Intention> = HashMap::new();
        
        for intention in intentions {
            let key = self.get_conflict_key(intention);
            if let Some(existing) = merged.get_mut(&key) {
                // Merge parameters
                for (k, v) in &intention.parameters {
                    existing.parameters.insert(k.clone(), v.clone());
                }
                // Keep higher priority
                if intention.priority < existing.priority {
                    existing.priority = intention.priority;
                }
            } else {
                merged.insert(key, intention.clone());
            }
        }
        
        merged.into_values().collect()
    }

    /// Resolve by cancel (cancel all conflicting)
    fn resolve_by_cancel(&self, intentions: &[Intention]) -> Vec<Intention> {
        let mut resolved = Vec::new();
        let mut conflicts: HashMap<String, Vec<&Intention>> = HashMap::new();
        
        // Group by conflict
        for intention in intentions {
            let key = self.get_conflict_key(intention);
            conflicts.entry(key).or_insert_with(Vec::new).push(intention);
        }
        
        // Only keep non-conflicting intentions
        for (_, group) in conflicts {
            if group.len() == 1 {
                resolved.push(group[0].clone());
            }
            // If multiple, cancel all (don't add to resolved)
        }
        
        resolved
    }

    /// Get conflict key (intentions with same key conflict)
    fn get_conflict_key(&self, intention: &Intention) -> String {
        // Simple: use goal text as conflict key
        // In production, use semantic similarity
        intention.goal.clone()
    }

    /// Convert resolved intentions to evolution decisions
    pub fn to_evolution_decisions(&self, intentions: &[Intention]) -> Vec<EvolutionDecision> {
        intentions.iter()
            .map(|intention| EvolutionDecision {
                intention_id: intention.id.clone(),
                goal: intention.goal.clone(),
                priority: intention.priority,
                parameters: intention.parameters.clone(),
            })
            .collect()
    }
}

/// Evolution decision (fed to Evolution Kernel)
#[derive(Debug, Clone)]
pub struct EvolutionDecision {
    pub intention_id: String,
    pub goal: String,
    pub priority: IntentionPriority,
    pub parameters: HashMap<String, String>,
}

impl Default for IntentionResolver {
    fn default() -> Self {
        Self::new(ResolutionStrategy::Priority)
    }
}
