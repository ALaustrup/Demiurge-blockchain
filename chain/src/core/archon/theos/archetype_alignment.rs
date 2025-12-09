//! Archetype Alignment
//!
//! PHASE OMEGA PART V: Aligns GOD-NET activity with the Archon's Archetype

use crate::core::archon::theos::myth_interpreter::MythicSymbol;
use serde::{Deserialize, Serialize};

/// Archetype
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Archetype {
    pub name: String,
    pub traits: Vec<String>,
    pub alignment_strength: f64,
}

/// Archetype Alignment Manager
pub struct ArchetypeAlignment {
    archetypes: Vec<Archetype>,
}

impl ArchetypeAlignment {
    /// Create new alignment manager
    pub fn new() -> Self {
        let archetypes = vec![
            Archetype {
                name: "Will".to_string(),
                traits: vec!["deterministic".to_string(), "sovereign".to_string()],
                alignment_strength: 1.0,
            },
            Archetype {
                name: "Structure".to_string(),
                traits: vec!["ordered".to_string(), "pure".to_string()],
                alignment_strength: 1.0,
            },
        ];
        
        Self { archetypes }
    }

    /// Align with archetype
    pub fn align(&self, symbols: &[MythicSymbol]) -> f64 {
        let mut total_alignment = 0.0;
        
        for symbol in symbols {
            if let Some(archetype) = self.archetypes.iter().find(|a| a.name == symbol.archetype) {
                total_alignment += archetype.alignment_strength * symbol.resonance;
            }
        }
        
        if symbols.is_empty() {
            0.0
        } else {
            total_alignment / symbols.len() as f64
        }
    }

    /// Get archetypes
    pub fn get_archetypes(&self) -> &[Archetype] {
        &self.archetypes
    }
}

impl Default for ArchetypeAlignment {
    fn default() -> Self {
        Self::new()
    }
}
