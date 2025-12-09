//! Archon Voice
//!
//! PHASE OMEGA PART V: Converts Archon directives into human language

use crate::core::archon::will::directive_generator::ArchonDirective;
use serde::{Deserialize, Serialize};

/// Archonic declaration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArchonicDeclaration {
    pub declaration_id: String,
    pub text: String,
    pub tone: ArchonTone,
    pub cadence: f64,
    pub source_directive: String,
}

/// Archon tone
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ArchonTone {
    Commanding,
    Contemplative,
    Declarative,
    Directive,
}

/// Archon Voice
pub struct ArchonVoice {
    tone_profile: ArchonTone,
    cadence_base: f64,
}

impl ArchonVoice {
    /// Create new voice
    pub fn new() -> Self {
        Self {
            tone_profile: ArchonTone::Directive,
            cadence_base: 0.8,
        }
    }

    /// Generate declaration from directive
    pub fn generate_declaration(&self, directive: &ArchonDirective) -> ArchonicDeclaration {
        let text = self.format_directive(&directive.will.directive);
        
        ArchonicDeclaration {
            declaration_id: format!("DECL_{}", directive.directive_id),
            text,
            tone: self.tone_profile,
            cadence: self.cadence_base,
            source_directive: directive.directive_id.clone(),
        }
    }

    /// Format directive as human language
    fn format_directive(&self, directive: &str) -> String {
        match self.tone_profile {
            ArchonTone::Commanding => format!("The Archon commands: {}", directive),
            ArchonTone::Contemplative => format!("The Archon contemplates: {}", directive),
            ArchonTone::Declarative => format!("The Archon declares: {}", directive),
            ArchonTone::Directive => format!("Directive: {}", directive),
        }
    }

    /// Set tone
    pub fn set_tone(&mut self, tone: ArchonTone) {
        self.tone_profile = tone;
    }
}

impl Default for ArchonVoice {
    fn default() -> Self {
        Self::new()
    }
}
