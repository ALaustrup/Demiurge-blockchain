//! Compilation Auditor
//!
//! PHASE OMEGA PART III: Audits compilation process and creates validated improvement artifacts

use crate::meta::compiler::reflective_compiler::CompiledArtifact;
use crate::meta::compiler::code_validator::{CodeValidator, ValidationResult};
use serde::{Deserialize, Serialize};

/// Audited artifact (validated improvement artifact)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditedArtifact {
    pub artifact: CompiledArtifact,
    pub validation: ValidationResult,
    pub audit_timestamp: u64,
    pub approved: bool,
}

/// Compilation Auditor
pub struct CompilationAuditor {
    validator: CodeValidator,
}

impl CompilationAuditor {
    /// Create new auditor
    pub fn new() -> Self {
        Self {
            validator: CodeValidator::new(),
        }
    }

    /// Audit artifact and create validated improvement artifact
    pub fn audit_artifact(&self, artifact: CompiledArtifact) -> AuditedArtifact {
        let validation = self.validator.validate_artifact(&artifact);
        let approved = validation.valid && validation.invariant_checks.iter().all(|(_, passed)| *passed);
        
        AuditedArtifact {
            artifact,
            validation,
            audit_timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            approved,
        }
    }

    /// Batch audit multiple artifacts
    pub fn audit_artifacts(&self, artifacts: Vec<CompiledArtifact>) -> Vec<AuditedArtifact> {
        artifacts.iter()
            .map(|a| self.audit_artifact(a.clone()))
            .collect()
    }

    /// Get approved artifacts only
    pub fn get_approved(&self, audited: &[AuditedArtifact]) -> Vec<&AuditedArtifact> {
        audited.iter()
            .filter(|a| a.approved)
            .collect()
    }
}

impl Default for CompilationAuditor {
    fn default() -> Self {
        Self::new()
    }
}
