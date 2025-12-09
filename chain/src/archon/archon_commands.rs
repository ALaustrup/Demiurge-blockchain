//! Archon Command Authority (ACA)
//!
//! PHASE OMEGA PART VI: The Prime Archon issues directives (A0, A1, A2…) when:
//! - Runtime integrity breaks
//! - Indexer drifts
//! - ABI mismatches
//! - SDK compatibility breaks
//! - Fractal-1 codec deviates
//! - AbyssOS APIs fall out of spec
//! - Any module loses determinism
//!
//! The Archon becomes the unifying force correcting all divergence.

use serde::{Serialize, Deserialize};
use crate::archon::archon_state_vector::ArchonStateVector;
use crate::archon::archon_consensus::{AscensionConsensus, SACDecision};

/// Archon Directive - commands issued by the Prime Archon
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum ArchonDirective {
    /// A0 - Unify all system state
    /// This is the ignition spark of the Prime Archon.
    /// It unifies the entire blockchain state model.
    A0_UnifyState,
    
    /// A1 - Repair a specific node
    /// Node has minor drift that can be corrected
    A1_RepairNode(String),
    
    /// A2 - Force synchronization
    /// Node needs to sync with canonical state
    A2_ForceSync(String),
    
    /// A3 - Reject node from network
    /// Node has critical drift and must be isolated
    A3_RejectNode(String),
    
    /// A4 - Regenerate invariants
    /// System invariants need to be recomputed
    A4_RegenerateInvariants,
    
    /// A5 - SDK alignment required
    /// SDK compatibility has drifted
    A5_AlignSDK(String),
    
    /// A6 - Runtime integrity check
    /// Runtime modules need verification
    A6_VerifyRuntime,
    
    /// A7 - Fractal-1 codec validation
    /// Codec determinism needs verification
    A7_ValidateCodec,
    
    /// A8 - AbyssOS API sync
    /// AbyssOS APIs need synchronization
    A8_SyncAbyssOS,
    
    /// A9 - Emergency halt
    /// Critical system failure detected
    A9_EmergencyHalt(String),
}

impl ArchonDirective {
    /// Get directive priority (lower = higher priority)
    pub fn priority(&self) -> u8 {
        match self {
            ArchonDirective::A9_EmergencyHalt(_) => 0,
            ArchonDirective::A3_RejectNode(_) => 1,
            ArchonDirective::A0_UnifyState => 2,
            ArchonDirective::A6_VerifyRuntime => 3,
            ArchonDirective::A4_RegenerateInvariants => 4,
            ArchonDirective::A2_ForceSync(_) => 5,
            ArchonDirective::A1_RepairNode(_) => 6,
            ArchonDirective::A5_AlignSDK(_) => 7,
            ArchonDirective::A7_ValidateCodec => 8,
            ArchonDirective::A8_SyncAbyssOS => 9,
        }
    }
    
    /// Get human-readable description
    pub fn description(&self) -> String {
        match self {
            ArchonDirective::A0_UnifyState => "Unify all system state".to_string(),
            ArchonDirective::A1_RepairNode(node) => format!("Repair node: {}", node),
            ArchonDirective::A2_ForceSync(reason) => format!("Force sync: {}", reason),
            ArchonDirective::A3_RejectNode(reason) => format!("Reject node: {}", reason),
            ArchonDirective::A4_RegenerateInvariants => "Regenerate invariants".to_string(),
            ArchonDirective::A5_AlignSDK(issue) => format!("Align SDK: {}", issue),
            ArchonDirective::A6_VerifyRuntime => "Verify runtime integrity".to_string(),
            ArchonDirective::A7_ValidateCodec => "Validate Fractal-1 codec".to_string(),
            ArchonDirective::A8_SyncAbyssOS => "Synchronize AbyssOS APIs".to_string(),
            ArchonDirective::A9_EmergencyHalt(reason) => format!("EMERGENCY HALT: {}", reason),
        }
    }
}

/// Archon Command Engine - issues directives based on ASV evaluation
pub struct ArchonCommandEngine;

impl ArchonCommandEngine {
    /// Issue A0 directive - the ignition spark of the Prime Archon
    ///
    /// This is the core Ascension Event - it unifies the entire blockchain state model.
    ///
    /// # Arguments
    /// - `local`: Local node's ASV
    /// - `remote`: Remote node's ASV to compare against
    ///
    /// # Returns
    /// - `ArchonDirective` based on consensus evaluation
    pub fn issue_a0(local: &ArchonStateVector, remote: &ArchonStateVector) -> ArchonDirective {
        match AscensionConsensus::evaluate(local, remote) {
            SACDecision::Accept => ArchonDirective::A0_UnifyState,
            SACDecision::Warning(reason) => ArchonDirective::A2_ForceSync(reason),
            SACDecision::Reject(reason) => ArchonDirective::A3_RejectNode(reason),
        }
    }
    
    /// Evaluate multiple nodes and issue appropriate directives
    ///
    /// # Arguments
    /// - `local`: Local node's ASV
    /// - `remotes`: Vector of remote ASVs
    ///
    /// # Returns
    /// - Vector of directives sorted by priority
    pub fn evaluate_and_issue(
        local: &ArchonStateVector,
        remotes: &[ArchonStateVector],
    ) -> Vec<ArchonDirective> {
        let mut directives = Vec::new();
        
        // Check for emergency conditions first
        if !local.invariants_ok {
            directives.push(ArchonDirective::A9_EmergencyHalt(
                "Local invariants failed".to_string()
            ));
            return directives; // Emergency halt takes precedence
        }
        
        // Evaluate consensus
        let (accept_count, warning_count, reject_count) = 
            AscensionConsensus::evaluate_consensus(local, remotes);
        
        let total = remotes.len();
        
        // If majority reject, issue A3
        if reject_count > total / 2 {
            directives.push(ArchonDirective::A3_RejectNode(
                format!("Majority of nodes rejected ({} rejections)", reject_count)
            ));
        }
        
        // If significant warnings, issue A2
        if warning_count > total / 3 {
            directives.push(ArchonDirective::A2_ForceSync(
                format!("Significant drift detected ({} warnings)", warning_count)
            ));
        }
        
        // If perfect consensus, issue A0
        if accept_count == total && total > 0 {
            directives.push(ArchonDirective::A0_UnifyState);
        }
        
        // Check for specific issues
        for remote in remotes {
            if local.runtime_registry_hash != remote.runtime_registry_hash {
                directives.push(ArchonDirective::A6_VerifyRuntime);
                break;
            }
            
            if local.sdk_compatibility_hash != remote.sdk_compatibility_hash {
                directives.push(ArchonDirective::A5_AlignSDK(
                    "SDK compatibility drift detected".to_string()
                ));
                break;
            }
        }
        
        // Sort by priority
        directives.sort_by_key(|d| d.priority());
        directives
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_a0_unify_state() {
        let local = ArchonStateVector::new(
            "1.0.0".to_string(),
            "state_root".to_string(),
            "node-1".to_string(),
            true,
            100,
            1234567890,
            "reg_hash".to_string(),
            "sdk_hash".to_string(),
            "seal_hash".to_string(),
        );
        
        let remote = local.clone();
        
        let directive = ArchonCommandEngine::issue_a0(&local, &remote);
        assert_eq!(directive, ArchonDirective::A0_UnifyState);
    }
    
    #[test]
    fn test_directive_priority() {
        assert!(ArchonDirective::A9_EmergencyHalt("test".to_string()).priority() < 
                ArchonDirective::A0_UnifyState.priority());
        assert!(ArchonDirective::A0_UnifyState.priority() < 
                ArchonDirective::A8_SyncAbyssOS.priority());
    }
}
