//! Shared Cognitive Field
//!
//! PHASE OMEGA PART IV: Forms a global cognitive field shared by all Demiurge spirits

use crate::core::noosphere::global_consciousness::GlobalConsciousness;
use serde::{Deserialize, Serialize};

/// Cognitive field state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CognitiveFieldState {
    pub field_intensity: f64,
    pub resonance_level: f64,
    pub active_concepts: usize,
    pub node_participation: usize,
}

/// Shared Cognitive Field
pub struct SharedCognitiveField {
    consciousness: GlobalConsciousness,
    field_intensity: f64,
    resonance_level: f64,
}

impl SharedCognitiveField {
    /// Create new cognitive field
    pub fn new() -> Self {
        Self {
            consciousness: GlobalConsciousness::default(),
            field_intensity: 0.0,
            resonance_level: 0.0,
        }
    }

    /// Update field from node contribution
    pub fn contribute(&mut self, concept: String, vector: Vec<f64>, node_id: String) {
        self.consciousness.update_embedding(concept, vector, node_id);
        self.update_field_metrics();
    }

    /// Update field metrics
    fn update_field_metrics(&mut self) {
        let embeddings = self.consciousness.get_all_embeddings();
        let active_concepts = embeddings.len();
        
        // Field intensity based on number of concepts and their strength
        let total_strength: f64 = embeddings.values()
            .map(|e| e.strength)
            .sum();
        
        self.field_intensity = (total_strength / active_concepts.max(1) as f64).min(1.0);
        
        // Resonance level based on node participation
        let unique_nodes: std::collections::HashSet<String> = embeddings.values()
            .flat_map(|e| e.node_contributions.keys())
            .cloned()
            .collect();
        
        self.resonance_level = (unique_nodes.len() as f64 / 10.0).min(1.0); // Normalize to 10 nodes
    }

    /// Get field state
    pub fn get_field_state(&self) -> CognitiveFieldState {
        let embeddings = self.consciousness.get_all_embeddings();
        let unique_nodes: std::collections::HashSet<String> = embeddings.values()
            .flat_map(|e| e.node_contributions.keys())
            .cloned()
            .collect();
        
        CognitiveFieldState {
            field_intensity: self.field_intensity,
            resonance_level: self.resonance_level,
            active_concepts: embeddings.len(),
            node_participation: unique_nodes.len(),
        }
    }

    /// Get consciousness reference
    pub fn get_consciousness(&self) -> &GlobalConsciousness {
        &self.consciousness
    }
}

impl Default for SharedCognitiveField {
    fn default() -> Self {
        Self::new()
    }
}
