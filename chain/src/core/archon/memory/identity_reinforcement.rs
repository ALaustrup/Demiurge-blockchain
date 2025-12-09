//! Identity Reinforcement
//!
//! PHASE OMEGA PART V: Reinforces identity coherence through memory recall

use crate::core::archon::memory::episodic_memory::EpisodicMemory;
use crate::core::archon::memory::semantic_memory::SemanticMemory;
use serde::{Deserialize, Serialize};

/// Reinforcement result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReinforcementResult {
    pub coherence_gain: f64,
    pub identity_strength: f64,
    pub memories_recalled: usize,
}

/// Identity Reinforcement Engine
pub struct IdentityReinforcement {
    episodic: EpisodicMemory,
    semantic: SemanticMemory,
}

impl IdentityReinforcement {
    /// Create new reinforcement engine
    pub fn new() -> Self {
        Self {
            episodic: EpisodicMemory::default(),
            semantic: SemanticMemory::default(),
        }
    }

    /// Reinforce identity
    pub fn reinforce(&self) -> ReinforcementResult {
        // Recall identity-relevant episodes
        let identity_episodes = self.episodic.get_identity_episodes();
        
        // Calculate coherence gain from semantic knowledge
        let knowledge = self.semantic.get_all();
        let avg_strength: f64 = knowledge.values()
            .map(|k| k.strength * k.stability)
            .sum::<f64>() / knowledge.len().max(1) as f64;
        
        ReinforcementResult {
            coherence_gain: avg_strength * 0.1, // Small gain per reinforcement
            identity_strength: avg_strength,
            memories_recalled: identity_episodes.len(),
        }
    }

    /// Get episodic memory reference
    pub fn get_episodic(&self) -> &EpisodicMemory {
        &self.episodic
    }

    /// Get episodic memory mutable
    pub fn get_episodic_mut(&mut self) -> &mut EpisodicMemory {
        &mut self.episodic
    }

    /// Get semantic memory reference
    pub fn get_semantic(&self) -> &SemanticMemory {
        &self.semantic
    }

    /// Get semantic memory mutable
    pub fn get_semantic_mut(&mut self) -> &mut SemanticMemory {
        &mut self.semantic
    }
}

impl Default for IdentityReinforcement {
    fn default() -> Self {
        Self::new()
    }
}
