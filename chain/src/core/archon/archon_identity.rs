//! Archon Identity
//!
//! PHASE OMEGA PART V: Defines the Archon's "Being Vector" and maintains stable personality

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use crate::core::archon::archon_core::ArchonIdentity;

/// Personality trait
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonalityTrait {
    pub name: String,
    pub strength: f64, // 0.0 to 1.0
    pub stability: f64, // How resistant to change
}

/// Archon Identity Manager
pub struct ArchonIdentityManager {
    identity: ArchonIdentity,
    traits: HashMap<String, PersonalityTrait>,
}

impl ArchonIdentityManager {
    /// Create new identity manager
    pub fn new(identity: ArchonIdentity) -> Self {
        Self {
            identity,
            traits: HashMap::new(),
        }
    }

    /// Add personality trait
    pub fn add_trait(&mut self, trait_name: String, strength: f64, stability: f64) {
        let trait_obj = PersonalityTrait {
            name: trait_name.clone(),
            strength,
            stability,
        };
        self.traits.insert(trait_name, trait_obj);
        self.identity.personality_traits.insert(trait_name, strength);
    }

    /// Update trait strength
    pub fn update_trait(&mut self, trait_name: &str, new_strength: f64) {
        if let Some(trait_obj) = self.traits.get_mut(trait_name) {
            // Apply stability filter (resistant to change)
            let change = new_strength - trait_obj.strength;
            let adjusted_change = change * (1.0 - trait_obj.stability);
            trait_obj.strength = (trait_obj.strength + adjusted_change).clamp(0.0, 1.0);
            self.identity.personality_traits.insert(trait_name.to_string(), trait_obj.strength);
        }
    }

    /// Get identity
    pub fn get_identity(&self) -> &ArchonIdentity {
        &self.identity
    }

    /// Get being vector
    pub fn get_being_vector(&self) -> &[f64] {
        &self.identity.being_vector
    }

    /// Compute identity coherence
    pub fn compute_coherence(&self) -> f64 {
        // Coherence based on trait consistency
        if self.traits.is_empty() {
            return 0.0;
        }
        
        let avg_stability: f64 = self.traits.values()
            .map(|t| t.stability)
            .sum::<f64>() / self.traits.len() as f64;
        
        avg_stability
    }
}
