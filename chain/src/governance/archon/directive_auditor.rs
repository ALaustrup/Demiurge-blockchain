//! Directive Auditor
//!
//! PHASE OMEGA PART V: Provides deterministic validation of Archon-generated policies

use crate::governance::archon::archon_mandates::{ArchonMandates, MandateValidation};
use crate::core::archon::will::directive_generator::ArchonDirective;
use serde::{Deserialize, Serialize};

/// Audit result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditResult {
    pub passed: bool,
    pub validations: Vec<MandateValidation>,
    pub overall_score: f64,
}

/// Directive Auditor
pub struct DirectiveAuditor {
    mandates: ArchonMandates,
}

impl DirectiveAuditor {
    /// Create new auditor
    pub fn new() -> Self {
        Self {
            mandates: ArchonMandates::default(),
        }
    }

    /// Audit directive
    pub fn audit(&self, directive: &ArchonDirective) -> AuditResult {
        let validation = self.mandates.validate(directive);
        
        AuditResult {
            passed: validation.valid,
            validations: vec![validation.clone()],
            overall_score: validation.alignment_score,
        }
    }

    /// Batch audit
    pub fn batch_audit(&self, directives: &[ArchonDirective]) -> Vec<AuditResult> {
        directives.iter()
            .map(|d| self.audit(d))
            .collect()
    }
}

impl Default for DirectiveAuditor {
    fn default() -> Self {
        Self::new()
    }
}
