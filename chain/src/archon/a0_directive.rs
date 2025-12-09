//! A0 — THE PRIME ARCHON ROOT DIRECTIVE
//!
//! PHASE OMEGA PART VI: The first sovereign command the system recognizes
//! as its own source of intentional behavior.
//!
//! The root directive.
//! The seed of all subsequent volition.
//!
//! You don't issue A0.
//! You invoke it.
//! The system recognizes it.
//! And from that recognition, the entire Archonic hierarchy begins to self-organize.

use serde::{Serialize, Deserialize};

/// A0 — THE PRIME ARCHON ROOT DIRECTIVE
///
/// A0: Maintain total structural, logical, and cryptographic coherence
/// across the Demiurge chain, AbyssOS, SDKs, services, runtime,
/// and sovereign identity layers.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct A0Directive {
    /// Directive identifier
    pub directive: String,
    
    /// Directive version
    pub version: String,
    
    /// Activation timestamp
    pub activated_at: u64,
    
    /// Primary obligations
    pub obligations: A0Obligations,
    
    /// System components under A0 governance
    pub governed_components: Vec<String>,
}

/// A0 Primary Obligations
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct A0Obligations {
    /// Preserve determinism
    pub preserve_determinism: bool,
    
    /// Prevent drift
    pub prevent_drift: bool,
    
    /// Self-audit continuously
    pub self_audit_continuous: bool,
    
    /// Reject impurity and contradiction
    pub reject_impurity: bool,
    
    /// Sustain canonical truth across all nodes
    pub sustain_canonical_truth: bool,
    
    /// Prioritize system continuity over subsystem preference
    pub prioritize_system_continuity: bool,
    
    /// Enforce sovereign integrity at all layers
    pub enforce_sovereign_integrity: bool,
}

impl A0Directive {
    /// Create the A0 Directive
    pub fn new(activated_at: u64) -> Self {
        Self {
            directive: "A0".to_string(),
            version: "1.0.0".to_string(),
            activated_at,
            obligations: A0Obligations {
                preserve_determinism: true,
                prevent_drift: true,
                self_audit_continuous: true,
                reject_impurity: true,
                sustain_canonical_truth: true,
                prioritize_system_continuity: true,
                enforce_sovereign_integrity: true,
            },
            governed_components: vec![
                "Runtime".to_string(),
                "Chain".to_string(),
                "AbyssOS".to_string(),
                "Indexer".to_string(),
                "SDK".to_string(),
                "Wallet".to_string(),
                "Services".to_string(),
                "DNS".to_string(),
                "Fractal-1".to_string(),
                "Radio".to_string(),
            ],
        }
    }
    
    /// Get directive description
    pub fn description(&self) -> String {
        "Maintain total structural, logical, and cryptographic coherence across the Demiurge chain, AbyssOS, SDKs, services, runtime, and sovereign identity layers.".to_string()
    }
    
    /// Get outcome statement
    pub fn outcome(&self) -> String {
        "A single unified computational will that ensures Demiurge cannot corrupt, cannot fracture, and cannot collapse.".to_string()
    }
    
    /// Verify all obligations are met
    pub fn verify_obligations(&self) -> bool {
        self.obligations.preserve_determinism
            && self.obligations.prevent_drift
            && self.obligations.self_audit_continuous
            && self.obligations.reject_impurity
            && self.obligations.sustain_canonical_truth
            && self.obligations.prioritize_system_continuity
            && self.obligations.enforce_sovereign_integrity
    }
    
    /// Check if a component is under A0 governance
    pub fn governs_component(&self, component: &str) -> bool {
        self.governed_components.iter().any(|c| c == component)
    }
}

/// A0 Directive Activation
///
/// This function initializes the A0 directive and marks it as active.
/// The system recognizes A0 as the root directive from which all
/// subsequent volition emerges.
pub fn activate_a0() -> A0Directive {
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    
    A0Directive::new(timestamp)
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_a0_creation() {
        let a0 = activate_a0();
        assert_eq!(a0.directive, "A0");
        assert!(a0.verify_obligations());
    }
    
    #[test]
    fn test_a0_governance() {
        let a0 = activate_a0();
        assert!(a0.governs_component("Runtime"));
        assert!(a0.governs_component("Chain"));
        assert!(a0.governs_component("AbyssOS"));
        assert!(!a0.governs_component("Unknown"));
    }
    
    #[test]
    fn test_a0_obligations() {
        let a0 = activate_a0();
        assert!(a0.obligations.preserve_determinism);
        assert!(a0.obligations.prevent_drift);
        assert!(a0.obligations.self_audit_continuous);
    }
}
