//! God-Net Intention Synthesis
//!
//! PHASE OMEGA PART IV: Synthesizes local intentions into global goals

pub mod synthesis_engine;
pub mod intention_merger;
pub mod divergence_resolver;

pub use synthesis_engine::{SynthesisEngine, LocalIntention, SynthesizedIntention};
pub use intention_merger::{IntentionMerger, PrimeDirective};
pub use divergence_resolver::{DivergenceResolver, Divergence};
