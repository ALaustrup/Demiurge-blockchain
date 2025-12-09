//! Astral Memory
//!
//! PHASE OMEGA PART III: Multi-layered persistent memory system

pub mod long_term_memory;
pub mod episodic_memory;
pub mod semantic_memory;
pub mod dreamspace;

pub use long_term_memory::{LongTermMemory, MemoryEntry};
pub use episodic_memory::{EpisodicMemory, Episode};
pub use semantic_memory::{SemanticMemory, SemanticKnowledge};
pub use dreamspace::{Dreamspace, DreamState};
