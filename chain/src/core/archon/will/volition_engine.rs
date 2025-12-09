//! Volition Engine
//!
//! PHASE OMEGA PART V: Synthesizes global intentions into Archonic Will

use std::collections::HashMap;
use serde::{Deserialize, Serialize};

/// Archonic will
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArchonicWill {
    pub will_id: String,
    pub directive: String,
    pub priority: f64,
    pub strength: f64,
    pub source_intentions: Vec<String>,
}

/// Volition Engine
pub struct VolitionEngine {
    global_intentions: Vec<GlobalIntention>,
    synthesized_will: Vec<ArchonicWill>,
}

/// Global intention
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlobalIntention {
    pub id: String,
    pub goal: String,
    pub weight: f64,
    pub node_count: usize,
}

impl VolitionEngine {
    /// Create new volition engine
    pub fn new() -> Self {
        Self {
            global_intentions: Vec::new(),
            synthesized_will: Vec::new(),
        }
    }

    /// Add global intention
    pub fn add_intention(&mut self, intention: GlobalIntention) {
        self.global_intentions.push(intention);
    }

    /// Synthesize Archonic Will
    pub fn synthesize(&mut self) -> ArchonicWill {
        // Find highest priority intention
        let dominant = self.global_intentions.iter()
            .max_by(|a, b| (a.weight * a.node_count as f64).partial_cmp(&(b.weight * b.node_count as f64)).unwrap())
            .cloned();
        
        if let Some(intention) = dominant {
            let will = ArchonicWill {
                will_id: format!("WILL_{}", 
                    std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap()
                        .as_nanos()
                ),
                directive: intention.goal.clone(),
                priority: intention.weight,
                strength: intention.weight * intention.node_count as f64,
                source_intentions: vec![intention.id],
            };
            
            self.synthesized_will.push(will.clone());
            will
        } else {
            // Default will
            ArchonicWill {
                will_id: "WILL_DEFAULT".to_string(),
                directive: "Maintain system stability".to_string(),
                priority: 0.5,
                strength: 0.5,
                source_intentions: Vec::new(),
            }
        }
    }

    /// Get synthesized will
    pub fn get_synthesized_will(&self) -> &[ArchonicWill] {
        &self.synthesized_will
    }
}

impl Default for VolitionEngine {
    fn default() -> Self {
        Self::new()
    }
}
