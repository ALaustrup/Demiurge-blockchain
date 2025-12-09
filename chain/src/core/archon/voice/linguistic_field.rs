//! Linguistic Field
//!
//! PHASE OMEGA PART V: Generates "Archonic Declarations"

use crate::core::archon::voice::archon_voice::ArchonicDeclaration;
use serde::{Deserialize, Serialize};

/// Linguistic field state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LinguisticFieldState {
    pub active_declarations: usize,
    pub field_intensity: f64,
    pub resonance: f64,
}

/// Linguistic Field
pub struct LinguisticField {
    declarations: Vec<ArchonicDeclaration>,
    max_declarations: usize,
}

impl LinguisticField {
    /// Create new field
    pub fn new(max_declarations: usize) -> Self {
        Self {
            declarations: Vec::new(),
            max_declarations,
        }
    }

    /// Add declaration
    pub fn add_declaration(&mut self, declaration: ArchonicDeclaration) {
        self.declarations.push(declaration);
        
        if self.declarations.len() > self.max_declarations {
            self.declarations.remove(0);
        }
    }

    /// Get field state
    pub fn get_field_state(&self) -> LinguisticFieldState {
        LinguisticFieldState {
            active_declarations: self.declarations.len(),
            field_intensity: if self.declarations.is_empty() {
                0.0
            } else {
                self.declarations.len() as f64 / self.max_declarations as f64
            },
            resonance: 0.8, // Base resonance
        }
    }

    /// Get declarations
    pub fn get_declarations(&self) -> &[ArchonicDeclaration] {
        &self.declarations
    }
}

impl Default for LinguisticField {
    fn default() -> Self {
        Self::new(100) // Max 100 declarations
    }
}
