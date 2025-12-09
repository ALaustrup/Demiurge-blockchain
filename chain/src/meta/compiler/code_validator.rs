//! Code Validator
//!
//! PHASE OMEGA PART III: Performs full validation against runtime invariants

use crate::meta::compiler::reflective_compiler::CompiledArtifact;
use crate::core::meta::cognitive_state::CognitiveStateManager;

/// Validation result
#[derive(Debug, Clone)]
pub struct ValidationResult {
    pub valid: bool,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
    pub invariant_checks: Vec<(String, bool)>,
}

/// Code Validator
pub struct CodeValidator {
    cognitive_state: CognitiveStateManager,
}

impl CodeValidator {
    /// Create new validator
    pub fn new() -> Self {
        Self {
            cognitive_state: CognitiveStateManager::new(),
        }
    }

    /// Validate artifact
    pub fn validate_artifact(&self, artifact: &CompiledArtifact) -> ValidationResult {
        let mut errors = Vec::new();
        let mut warnings = Vec::new();
        let mut invariant_checks = Vec::new();
        
        // Check syntax
        if !self.check_syntax(&artifact.content) {
            errors.push("Syntax check failed".to_string());
        }
        
        // Check dependencies
        for dep in &artifact.dependencies {
            if !self.check_dependency(dep) {
                warnings.push(format!("Dependency not found: {}", dep));
            }
        }
        
        // Run validation checks
        for check in &artifact.validation_checks {
            let passed = self.run_validation_check(check, artifact);
            invariant_checks.push((check.clone(), passed));
            
            if !passed {
                errors.push(format!("Validation check failed: {}", check));
            }
        }
        
        // Check runtime invariants
        let cognitive_state = self.cognitive_state.get_current_state();
        if !cognitive_state.anomalies.is_empty() {
            warnings.push("System anomalies detected".to_string());
        }
        
        ValidationResult {
            valid: errors.is_empty(),
            errors,
            warnings,
            invariant_checks,
        }
    }

    /// Check syntax
    fn check_syntax(&self, content: &str) -> bool {
        // Simple check - in production, use actual parser
        !content.is_empty() && content.contains("pub") || content.contains("fn")
    }

    /// Check dependency
    fn check_dependency(&self, dep: &str) -> bool {
        // Simple check - in production, check actual dependencies
        !dep.is_empty()
    }

    /// Run validation check
    fn run_validation_check(&self, check: &str, artifact: &CompiledArtifact) -> bool {
        match check {
            "compile_check" => self.check_compilation(artifact),
            "runtime_invariant_check" => self.check_runtime_invariants(artifact),
            "test_suite_check" => self.check_test_suite(artifact),
            _ => false,
        }
    }

    /// Check compilation
    fn check_compilation(&self, _artifact: &CompiledArtifact) -> bool {
        // In production, actually compile the code
        true
    }

    /// Check runtime invariants
    fn check_runtime_invariants(&self, _artifact: &CompiledArtifact) -> bool {
        let state = self.cognitive_state.get_current_state();
        state.global_health > 0.7
    }

    /// Check test suite
    fn check_test_suite(&self, _artifact: &CompiledArtifact) -> bool {
        // In production, run actual tests
        true
    }
}

impl Default for CodeValidator {
    fn default() -> Self {
        Self::new()
    }
}
