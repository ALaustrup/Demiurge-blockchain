//! Intention Engine
//!
//! PHASE OMEGA PART III: Converts system goals into actionable plans

pub mod intent_engine;
pub mod intent_classifier;
pub mod intent_resolver;

pub use intent_engine::{IntentionEngine, Intention, IntentionPriority, IntentionStatus};
pub use intent_classifier::{IntentionClassifier, IntentionCategory};
pub use intent_resolver::{IntentionResolver, ResolutionStrategy, EvolutionDecision};
