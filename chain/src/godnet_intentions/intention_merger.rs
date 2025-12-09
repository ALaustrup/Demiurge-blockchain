//! Intention Merger
//!
//! PHASE OMEGA PART IV: Forms a God-Net "Prime Directive"

use crate::godnet_intentions::synthesis_engine::{SynthesisEngine, SynthesizedIntention};
use serde::{Deserialize, Serialize};

/// Prime Directive
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrimeDirective {
    pub directive: String,
    pub synthesized_from: Vec<String>, // Intention IDs
    pub consensus_strength: f64,
}

/// Intention Merger
pub struct IntentionMerger {
    engine: SynthesisEngine,
    prime_directive: Option<PrimeDirective>,
}

impl IntentionMerger {
    /// Create new merger
    pub fn new() -> Self {
        Self {
            engine: SynthesisEngine::new(),
            prime_directive: None,
        }
    }

    /// Merge intentions into prime directive
    pub fn merge(&mut self) -> PrimeDirective {
        let synthesized = self.engine.synthesize();
        
        let directive = PrimeDirective {
            directive: synthesized.goal.clone(),
            synthesized_from: vec![synthesized.id.clone()],
            consensus_strength: synthesized.priority,
        };
        
        self.prime_directive = Some(directive.clone());
        directive
    }

    /// Get prime directive
    pub fn get_prime_directive(&self) -> Option<&PrimeDirective> {
        self.prime_directive.as_ref()
    }

    /// Get engine reference
    pub fn get_engine(&mut self) -> &mut SynthesisEngine {
        &mut self.engine
    }
}

impl Default for IntentionMerger {
    fn default() -> Self {
        Self::new()
    }
}
