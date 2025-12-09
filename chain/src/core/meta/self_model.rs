//! Meta-Cognitive Self-Model
//!
//! PHASE OMEGA PART III: Observes all subsystem states and maintains
//! a unified internal cognitive graph as the single source of internal truth.

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use serde::{Deserialize, Serialize};

/// Subsystem identifier
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SubsystemId {
    Runtime,
    State,
    Consensus,
    Network,
    Indexer,
    SDK,
    AbyssOS,
    DNS,
    Wallet,
    Fractal,
}

/// Subsystem state observation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubsystemState {
    pub subsystem: SubsystemId,
    pub health: f64, // 0.0 to 1.0
    pub performance: f64, // 0.0 to 1.0
    pub drift: f64, // Entropy measure
    pub invariants_held: bool,
    pub last_updated: u64, // Timestamp
    pub metrics: HashMap<String, f64>,
}

/// Cognitive graph node
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CognitiveNode {
    pub id: String,
    pub subsystem: SubsystemId,
    pub state: SubsystemState,
    pub connections: Vec<String>, // Connected node IDs
    pub weight: f64, // Importance weight
}

/// Meta-Cognitive Self-Model
pub struct SelfModel {
    cognitive_graph: Arc<Mutex<HashMap<String, CognitiveNode>>>,
    subsystem_states: Arc<Mutex<HashMap<SubsystemId, SubsystemState>>>,
    global_health: Arc<Mutex<f64>>,
    global_entropy: Arc<Mutex<f64>>,
}

impl SelfModel {
    /// Create new self-model
    pub fn new() -> Self {
        Self {
            cognitive_graph: Arc::new(Mutex::new(HashMap::new())),
            subsystem_states: Arc::new(Mutex::new(HashMap::new())),
            global_health: Arc::new(Mutex::new(1.0)),
            global_entropy: Arc::new(Mutex::new(0.0)),
        }
    }

    /// Observe subsystem state
    pub fn observe_subsystem(&self, state: SubsystemState) {
        let mut states = self.subsystem_states.lock().unwrap();
        states.insert(state.subsystem, state.clone());
        
        // Update cognitive graph
        let mut graph = self.cognitive_graph.lock().unwrap();
        let node_id = format!("{:?}", state.subsystem);
        
        let node = CognitiveNode {
            id: node_id.clone(),
            subsystem: state.subsystem,
            state: state.clone(),
            connections: vec![],
            weight: state.health * state.performance,
        };
        
        graph.insert(node_id, node);
        
        // Recalculate global metrics
        self.recalculate_global_metrics();
    }

    /// Get subsystem state
    pub fn get_subsystem_state(&self, subsystem: SubsystemId) -> Option<SubsystemState> {
        let states = self.subsystem_states.lock().unwrap();
        states.get(&subsystem).cloned()
    }

    /// Get all subsystem states
    pub fn get_all_states(&self) -> HashMap<SubsystemId, SubsystemState> {
        let states = self.subsystem_states.lock().unwrap();
        states.clone()
    }

    /// Get cognitive graph
    pub fn get_cognitive_graph(&self) -> HashMap<String, CognitiveNode> {
        let graph = self.cognitive_graph.lock().unwrap();
        graph.clone()
    }

    /// Get global health
    pub fn get_global_health(&self) -> f64 {
        *self.global_health.lock().unwrap()
    }

    /// Get global entropy
    pub fn get_global_entropy(&self) -> f64 {
        *self.global_entropy.lock().unwrap()
    }

    /// Recalculate global metrics
    fn recalculate_global_metrics(&self) {
        let states = self.subsystem_states.lock().unwrap();
        
        if states.is_empty() {
            return;
        }
        
        // Calculate average health
        let avg_health: f64 = states.values()
            .map(|s| s.health)
            .sum::<f64>() / states.len() as f64;
        
        // Calculate average entropy (drift)
        let avg_entropy: f64 = states.values()
            .map(|s| s.drift)
            .sum::<f64>() / states.len() as f64;
        
        *self.global_health.lock().unwrap() = avg_health;
        *self.global_entropy.lock().unwrap() = avg_entropy;
    }

    /// Check if all invariants are held
    pub fn all_invariants_held(&self) -> bool {
        let states = self.subsystem_states.lock().unwrap();
        states.values().all(|s| s.invariants_held)
    }

    /// Get subsystem with highest drift
    pub fn get_highest_drift_subsystem(&self) -> Option<(SubsystemId, f64)> {
        let states = self.subsystem_states.lock().unwrap();
        states.iter()
            .max_by(|(_, a), (_, b)| a.drift.partial_cmp(&b.drift).unwrap())
            .map(|(id, state)| (*id, state.drift))
    }
}

impl Default for SelfModel {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_self_model_creation() {
        let model = SelfModel::new();
        assert_eq!(model.get_global_health(), 1.0);
        assert_eq!(model.get_global_entropy(), 0.0);
    }

    #[test]
    fn test_subsystem_observation() {
        let model = SelfModel::new();
        let state = SubsystemState {
            subsystem: SubsystemId::Runtime,
            health: 0.9,
            performance: 0.8,
            drift: 0.1,
            invariants_held: true,
            last_updated: 1000,
            metrics: HashMap::new(),
        };
        
        model.observe_subsystem(state);
        assert!(model.get_subsystem_state(SubsystemId::Runtime).is_some());
    }
}
