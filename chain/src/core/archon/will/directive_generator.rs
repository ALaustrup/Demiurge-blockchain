//! Directive Generator
//!
//! PHASE OMEGA PART V: Generates Archon Directives (A0, A1, A2…)

use crate::core::archon::will::volition_engine::ArchonicWill;
use serde::{Deserialize, Serialize};

/// Archon directive
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArchonDirective {
    pub directive_id: String, // A0, A1, A2, etc.
    pub will: ArchonicWill,
    pub generation: u32,
    pub timestamp: u64,
}

/// Directive Generator
pub struct DirectiveGenerator {
    directive_counter: u32,
}

impl DirectiveGenerator {
    /// Create new generator
    pub fn new() -> Self {
        Self {
            directive_counter: 0,
        }
    }

    /// Generate directive from will
    pub fn generate(&mut self, will: ArchonicWill) -> ArchonDirective {
        let directive_id = format!("A{}", self.directive_counter);
        self.directive_counter += 1;
        
        ArchonDirective {
            directive_id,
            will,
            generation: self.directive_counter - 1,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        }
    }

    /// Get current directive number
    pub fn get_current_number(&self) -> u32 {
        self.directive_counter
    }
}

impl Default for DirectiveGenerator {
    fn default() -> Self {
        Self::new()
    }
}
