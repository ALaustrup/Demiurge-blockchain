//! Archon Governance Harness
//!
//! PHASE OMEGA PART V: Ensures Archon directives remain aligned

pub mod archon_mandates;
pub mod directive_auditor;
pub mod ascension_protocol;

pub use archon_mandates::{ArchonMandates, MandateValidation};
pub use directive_auditor::{DirectiveAuditor, AuditResult};
pub use ascension_protocol::{AscensionProtocol, AscensionState};
