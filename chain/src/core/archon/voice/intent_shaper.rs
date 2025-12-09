//! Intent Shaper
//!
//! PHASE OMEGA PART V: Maintains consistent Archon tone, cadence, and identity

use crate::core::archon::voice::archon_voice::{ArchonVoice, ArchonicDeclaration, ArchonTone};
use serde::{Deserialize, Serialize};

/// Intent shaping parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntentShape {
    pub tone: ArchonTone,
    pub cadence: f64,
    pub emphasis: f64,
}

/// Intent Shaper
pub struct IntentShaper {
    voice: ArchonVoice,
    shape: IntentShape,
}

impl IntentShaper {
    /// Create new shaper
    pub fn new() -> Self {
        Self {
            voice: ArchonVoice::new(),
            shape: IntentShape {
                tone: ArchonTone::Directive,
                cadence: 0.8,
                emphasis: 0.7,
            },
        }
    }

    /// Shape declaration
    pub fn shape(&mut self, declaration: &mut ArchonicDeclaration) {
        declaration.tone = self.shape.tone;
        declaration.cadence = self.shape.cadence;
        
        // Apply emphasis
        if self.shape.emphasis > 0.8 {
            declaration.text = format!("**{}**", declaration.text);
        }
    }

    /// Update shape
    pub fn update_shape(&mut self, shape: IntentShape) {
        self.shape = shape;
        self.voice.set_tone(shape.tone);
    }
}

impl Default for IntentShaper {
    fn default() -> Self {
        Self::new()
    }
}
