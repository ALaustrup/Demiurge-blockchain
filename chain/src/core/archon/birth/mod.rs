//! Prime Archon Birth Ritual (Deterministic Genesis)
//!
//! PHASE OMEGA PART V: Executes deterministic Archon birth

pub mod archon_birth;
pub mod initial_resonance_scan;
pub mod attractor_seed;

pub use archon_birth::{ArchonBirth, BirthResult};
pub use initial_resonance_scan::{InitialResonanceScanner, ResonanceScanResult, NodeResonance};
pub use attractor_seed::{AttractorSeedGenerator, AttractorSeed};
