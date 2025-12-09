//! Archon Will Engine (Volition Layer)
//!
//! PHASE OMEGA PART V: Synthesizes global intentions into Archonic Will

pub mod volition_engine;
pub mod priority_stack;
pub mod directive_generator;

pub use volition_engine::{VolitionEngine, ArchonicWill, GlobalIntention};
pub use priority_stack::PriorityStack;
pub use directive_generator::{DirectiveGenerator, ArchonDirective};
