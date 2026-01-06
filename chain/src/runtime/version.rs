//! Runtime module version and registration integrity checks.
//!
//! PHASE OMEGA: Ensures deterministic runtime module registration
//! and prevents accidental changes to module order or registration.

use crate::runtime::Runtime;

/// Runtime version - increment when module order or registration changes
pub const RUNTIME_VERSION: u32 = 3;

/// Expected module count - must match actual registered modules
pub const EXPECTED_MODULE_COUNT: usize = 11;

/// Expected module IDs in registration order
pub const EXPECTED_MODULE_IDS: &[&str] = &[
    "bank_cgt",
    "abyssid_registry",
    "nft_dgen",
    "fabric_manager",
    "abyss_registry",
    "developer_registry",
    "dev_capsules",
    "recursion_registry",
    "work_claim",
    "activity_log",
    "cgt_staking",
];

/// Verify runtime module registration integrity
pub fn verify_runtime_integrity(runtime: &Runtime) -> Result<(), String> {
    let module_count = runtime.modules.len();
    
    if module_count != EXPECTED_MODULE_COUNT {
        return Err(format!(
            "Runtime module count mismatch: expected {}, got {}",
            EXPECTED_MODULE_COUNT, module_count
        ));
    }

    // Verify module IDs match expected order
    for (i, expected_id) in EXPECTED_MODULE_IDS.iter().enumerate() {
        if let Some(module) = runtime.modules.get(i) {
            if module.module_id() != *expected_id {
                return Err(format!(
                    "Runtime module order mismatch at index {}: expected '{}', got '{}'",
                    i, expected_id, module.module_id()
                ));
            }
        } else {
            return Err(format!(
                "Missing runtime module at index {}: expected '{}'",
                i, expected_id
            ));
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::runtime::Runtime;

    #[test]
    fn test_runtime_integrity() {
        let runtime = Runtime::with_default_modules();
        assert!(verify_runtime_integrity(&runtime).is_ok());
    }

    #[test]
    fn test_runtime_module_count() {
        let runtime = Runtime::with_default_modules();
        assert_eq!(runtime.modules.len(), EXPECTED_MODULE_COUNT);
    }
}
