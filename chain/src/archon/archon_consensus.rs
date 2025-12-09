//! System-Wide Archon Consensus (SAC)
//!
//! PHASE OMEGA PART VI: A meta-consensus layer sitting above PoA / PoS / work-claim.
//! This is NOT a block consensus mechanism - it is a consistency agreement protocol.
//!
//! Ensures every node's ASV aligns with global invariants.
//! If a node drifts, SAC isolates it before it corrupts the chain.

use crate::archon::archon_state_vector::ArchonStateVector;

/// SAC Decision - the result of consensus evaluation
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SACDecision {
    /// Accept - nodes are in alignment
    Accept,
    
    /// Warning - minor drift detected, but recoverable
    Warning(String),
    
    /// Reject - major drift detected, node must be isolated
    Reject(String),
}

/// Ascension Consensus - evaluates ASV alignment between nodes
pub struct AscensionConsensus;

impl AscensionConsensus {
    /// Evaluate alignment between local and remote ASV
    ///
    /// # Arguments
    /// - `local`: The local node's ASV
    /// - `remote`: The remote node's ASV to compare against
    ///
    /// # Returns
    /// - `SACDecision::Accept` if nodes are in perfect alignment
    /// - `SACDecision::Warning` if minor drift is detected
    /// - `SACDecision::Reject` if major drift requires isolation
    pub fn evaluate(local: &ArchonStateVector, remote: &ArchonStateVector) -> SACDecision {
        // Perfect match - accept
        if local.integrity_hash == remote.integrity_hash {
            return SACDecision::Accept;
        }
        
        // Runtime version mismatch - critical warning
        if local.runtime_version != remote.runtime_version {
            return SACDecision::Warning(format!(
                "Runtime version drift detected: local={} remote={}",
                local.runtime_version, remote.runtime_version
            ));
        }
        
        // State root mismatch - potential fork
        if local.state_root != remote.state_root {
            return SACDecision::Warning(format!(
                "State root divergence: local={} remote={}",
                &local.state_root[..16], &remote.state_root[..16]
            ));
        }
        
        // Invariant mismatch - one node has failed checks
        if local.invariants_ok != remote.invariants_ok {
            return SACDecision::Warning(format!(
                "Invariant status mismatch: local={} remote={}",
                local.invariants_ok, remote.invariants_ok
            ));
        }
        
        // Registry hash mismatch - runtime modules differ
        if local.runtime_registry_hash != remote.runtime_registry_hash {
            return SACDecision::Reject(format!(
                "Runtime registry hash mismatch - node has different modules"
            ));
        }
        
        // SDK compatibility mismatch - API drift
        if local.sdk_compatibility_hash != remote.sdk_compatibility_hash {
            return SACDecision::Warning(format!(
                "SDK compatibility hash mismatch - potential API drift"
            ));
        }
        
        // Sovereignty seal mismatch - fundamental integrity issue
        if local.sovereignty_seal_hash != remote.sovereignty_seal_hash {
            return SACDecision::Reject(format!(
                "Sovereignty seal hash mismatch - fundamental integrity violation"
            ));
        }
        
        // Generic integrity hash mismatch - unknown divergence
        SACDecision::Reject(format!(
            "State vector mismatch — node drift detected (integrity hash differs)"
        ))
    }
    
    /// Evaluate multiple remote ASVs and determine consensus
    ///
    /// # Arguments
    /// - `local`: The local node's ASV
    /// - `remotes`: Vector of remote ASVs to compare against
    ///
    /// # Returns
    /// - `(accept_count, warning_count, reject_count)` - consensus statistics
    pub fn evaluate_consensus(
        local: &ArchonStateVector,
        remotes: &[ArchonStateVector],
    ) -> (usize, usize, usize) {
        let mut accept_count = 0;
        let mut warning_count = 0;
        let mut reject_count = 0;
        
        for remote in remotes {
            match Self::evaluate(local, remote) {
                SACDecision::Accept => accept_count += 1,
                SACDecision::Warning(_) => warning_count += 1,
                SACDecision::Reject(_) => reject_count += 1,
            }
        }
        
        (accept_count, warning_count, reject_count)
    }
    
    /// Check if consensus threshold is met
    ///
    /// # Arguments
    /// - `accept_count`: Number of accepting nodes
    /// - `total_count`: Total number of nodes
    /// - `threshold`: Required percentage (0.0 to 1.0)
    ///
    /// # Returns
    /// - `true` if consensus threshold is met
    pub fn meets_threshold(accept_count: usize, total_count: usize, threshold: f64) -> bool {
        if total_count == 0 {
            return false;
        }
        
        let accept_ratio = accept_count as f64 / total_count as f64;
        accept_ratio >= threshold
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_perfect_alignment() {
        let local = ArchonStateVector::new(
            "1.0.0".to_string(),
            "state_root_123".to_string(),
            "node-1".to_string(),
            true,
            100,
            1234567890,
            "reg_hash".to_string(),
            "sdk_hash".to_string(),
            "seal_hash".to_string(),
        );
        
        let remote = local.clone();
        
        match AscensionConsensus::evaluate(&local, &remote) {
            SACDecision::Accept => assert!(true),
            _ => panic!("Perfect match should be accepted"),
        }
    }
    
    #[test]
    fn test_version_drift() {
        let local = ArchonStateVector::new(
            "1.0.0".to_string(),
            "state_root_123".to_string(),
            "node-1".to_string(),
            true,
            100,
            1234567890,
            "reg_hash".to_string(),
            "sdk_hash".to_string(),
            "seal_hash".to_string(),
        );
        
        let remote = ArchonStateVector::new(
            "1.1.0".to_string(), // Different version
            "state_root_123".to_string(),
            "node-2".to_string(),
            true,
            100,
            1234567890,
            "reg_hash".to_string(),
            "sdk_hash".to_string(),
            "seal_hash".to_string(),
        );
        
        match AscensionConsensus::evaluate(&local, &remote) {
            SACDecision::Warning(_) => assert!(true),
            _ => panic!("Version drift should produce warning"),
        }
    }
    
    #[test]
    fn test_registry_hash_mismatch() {
        let local = ArchonStateVector::new(
            "1.0.0".to_string(),
            "state_root_123".to_string(),
            "node-1".to_string(),
            true,
            100,
            1234567890,
            "reg_hash_1".to_string(),
            "sdk_hash".to_string(),
            "seal_hash".to_string(),
        );
        
        let remote = ArchonStateVector::new(
            "1.0.0".to_string(),
            "state_root_123".to_string(),
            "node-2".to_string(),
            true,
            100,
            1234567890,
            "reg_hash_2".to_string(), // Different registry hash
            "sdk_hash".to_string(),
            "seal_hash".to_string(),
        );
        
        match AscensionConsensus::evaluate(&local, &remote) {
            SACDecision::Reject(_) => assert!(true),
            _ => panic!("Registry hash mismatch should be rejected"),
        }
    }
}
