//! Meta-Compiler v2
//!
//! PHASE OMEGA PART III: Generates and validates code improvements

pub mod reflective_compiler;
pub mod code_synthesizer;
pub mod code_validator;
pub mod compilation_auditor;

pub use reflective_compiler::{ReflectiveCompiler, CompiledArtifact, ArtifactType};
pub use code_synthesizer::CodeSynthesizer;
pub use code_validator::{CodeValidator, ValidationResult};
pub use compilation_auditor::{CompilationAuditor, AuditedArtifact};
