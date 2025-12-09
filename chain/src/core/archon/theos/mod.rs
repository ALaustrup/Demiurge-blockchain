//! Archon-Theos Interpreter (Lore Processing)
//!
//! PHASE OMEGA PART V: Converts mythic language into machine structures

pub mod myth_interpreter;
pub mod symbolic_resonance;
pub mod archetype_alignment;

pub use myth_interpreter::{MythInterpreter, MythicSymbol, InterpretedMyth, MythStructure};
pub use symbolic_resonance::{SymbolicResonanceAnalyzer, SymbolicResonance};
pub use archetype_alignment::{ArchetypeAlignment, Archetype};
