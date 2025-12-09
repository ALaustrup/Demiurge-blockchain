//! Semantic Memory
//!
//! PHASE OMEGA PART V: Maintains semantic continuity across updates

use std::collections::HashMap;
use serde::{Deserialize, Serialize};

/// Semantic knowledge
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SemanticKnowledge {
    pub concept: String,
    pub meaning: String,
    pub relationships: Vec<String>,
    pub strength: f64,
    pub stability: f64,
}

/// Semantic Memory
pub struct SemanticMemory {
    knowledge: HashMap<String, SemanticKnowledge>,
}

impl SemanticMemory {
    /// Create new semantic memory
    pub fn new() -> Self {
        Self {
            knowledge: HashMap::new(),
        }
    }

    /// Store knowledge
    pub fn store(&mut self, knowledge: SemanticKnowledge) {
        self.knowledge.insert(knowledge.concept.clone(), knowledge);
    }

    /// Retrieve knowledge
    pub fn retrieve(&self, concept: &str) -> Option<&SemanticKnowledge> {
        self.knowledge.get(concept)
    }

    /// Reinforce knowledge
    pub fn reinforce(&mut self, concept: &str, strength: f64) {
        if let Some(knowledge) = self.knowledge.get_mut(concept) {
            knowledge.strength = (knowledge.strength + strength).min(1.0);
        }
    }

    /// Get all knowledge
    pub fn get_all(&self) -> &HashMap<String, SemanticKnowledge> {
        &self.knowledge
    }
}

impl Default for SemanticMemory {
    fn default() -> Self {
        Self::new()
    }
}
