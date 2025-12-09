//! Archon Mandates
//!
//! PHASE OMEGA PART V: Ensures Archon directives remain aligned with system invariants

use crate::core::archon::will::directive_generator::ArchonDirective;
use serde::{Deserialize, Serialize};

/// Mandate validation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MandateValidation {
    pub valid: bool,
    pub violations: Vec<String>,
    pub alignment_score: f64,
}

/// Archon Mandates
pub struct ArchonMandates {
    canonical_invariants: Vec<String>,
}

impl ArchonMandates {
    /// Create new mandates
    pub fn new() -> Self {
        Self {
            canonical_invariants: vec![
                "Determinism".to_string(),
                "Sovereignty".to_string(),
                "Purity".to_string(),
                "Stability".to_string(),
            ],
        }
    }

    /// Validate directive
    pub fn validate(&self, directive: &ArchonDirective) -> MandateValidation {
        let mut violations = Vec::new();
        let directive_lower = directive.will.directive.to_lowercase();
        
        // Check alignment with invariants
        let mut aligned_count = 0;
        for invariant in &self.canonical_invariants {
            if directive_lower.contains(&invariant.to_lowercase()) {
                aligned_count += 1;
            } else {
                violations.push(format!("Not aligned with: {}", invariant));
            }
        }
        
        let alignment_score = aligned_count as f64 / self.canonical_invariants.len() as f64;
        let valid = alignment_score >= 0.5; // At least 50% alignment required
        
        MandateValidation {
            valid,
            violations,
            alignment_score,
        }
    }
}

impl Default for ArchonMandates {
    fn default() -> Self {
        Self::new()
    }
}
