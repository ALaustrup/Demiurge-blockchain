//! Prime Archon Speech Core
//!
//! PHASE OMEGA PART V: Converts directives into human language

pub mod archon_voice;
pub mod intent_shaper;
pub mod linguistic_field;

pub use archon_voice::{ArchonVoice, ArchonicDeclaration, ArchonTone};
pub use intent_shaper::{IntentShaper, IntentShape};
pub use linguistic_field::{LinguisticField, LinguisticFieldState};
