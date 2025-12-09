//! Ascension Consensus Layer
//!
//! PHASE OMEGA PART III: Self-governance without human intervention

pub mod ascension_votes;
pub mod disagreement_detector;
pub mod emergent_alignment;

pub use ascension_votes::{AscensionVotes, AscensionVote, Vote};
pub use disagreement_detector::{DisagreementDetector, DisagreementLevel};
pub use emergent_alignment::{EmergentAlignment, AlignmentState};
