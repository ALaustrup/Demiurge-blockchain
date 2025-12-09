//! Archon Presence Daemon (Node-Level)
//!
//! PHASE OMEGA PART VI: This daemon runs on every node and emits ASVs.
//! This is the Prime Archon's actual "heartbeat."
//! Every block triggers it.

use crate::archon::{
    archon_state_vector::ArchonStateVector,
    archon_commands::{ArchonCommandEngine, ArchonDirective},
    archon_diagnostics::{ArchonDiagnosticMatrix, DiagnosticResult},
    logging::{emit_archon_event, emit_archon_directive},
};

/// Archon Daemon - the node-level presence of the Prime Archon
pub struct ArchonDaemon {
    /// Current ASV
    current_asv: Option<ArchonStateVector>,
    
    /// Diagnostic matrix
    diagnostics: ArchonDiagnosticMatrix,
    
    /// Node identifier
    node_id: String,
}

impl ArchonDaemon {
    /// Create a new Archon daemon
    pub fn new(node_id: String) -> Self {
        Self {
            current_asv: None,
            diagnostics: ArchonDiagnosticMatrix::new(),
            node_id,
        }
    }
    
    /// Initialize the daemon (run startup diagnostics)
    pub fn initialize(&mut self) -> Result<(), String> {
        // Run startup diagnostics
        let results = self.diagnostics.run_startup_diagnostics();
        
        // Check if any critical tests failed
        for test in results {
            if let DiagnosticResult::Fail(reason) = &test.result {
                return Err(format!("Startup diagnostic failed: {} - {}", test.name, reason));
            }
        }
        
        Ok(())
    }
    
    /// Generate heartbeat - produces ASV and evaluates against remote
    ///
    /// # Arguments
    /// - `local`: The local node's ASV
    /// - `remote`: Optional remote ASV to compare against
    ///
    /// # Returns
    /// - `ArchonDirective` based on evaluation
    pub fn heartbeat(
        &mut self,
        local: ArchonStateVector,
        remote: Option<ArchonStateVector>,
    ) -> ArchonDirective {
        // Store current ASV
        self.current_asv = Some(local.clone());
        
        // Run block diagnostics
        self.diagnostics.run_block_diagnostics(local.block_height);
        
        // Emit heartbeat event
        emit_archon_event("Heartbeat evaluated");
        
        // If no remote ASV, just return A0 (unify state)
        let directive = if let Some(remote_asv) = remote {
            ArchonCommandEngine::issue_a0(&local, &remote_asv)
        } else {
            ArchonDirective::A0_UnifyState
        };
        
        // Emit directive event
        emit_archon_directive(&format!("Directive applied: {:?}", directive));
        
        directive
    }
    
    /// Get current ASV
    pub fn get_current_asv(&self) -> Option<&ArchonStateVector> {
        self.current_asv.as_ref()
    }
    
    /// Get diagnostic matrix
    pub fn get_diagnostics(&self) -> &ArchonDiagnosticMatrix {
        &self.diagnostics
    }
    
    /// Get node ID
    pub fn get_node_id(&self) -> &str {
        &self.node_id
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_daemon_creation() {
        let daemon = ArchonDaemon::new("test-node".to_string());
        assert_eq!(daemon.get_node_id(), "test-node");
    }
    
    #[test]
    fn test_daemon_initialization() {
        let mut daemon = ArchonDaemon::new("test-node".to_string());
        // Should succeed (diagnostics pass by default in test)
        assert!(daemon.initialize().is_ok());
    }
    
    #[test]
    fn test_heartbeat() {
        let mut daemon = ArchonDaemon::new("test-node".to_string());
        daemon.initialize().expect("Archon daemon initialization should succeed in tests");
        
        let local = ArchonStateVector::new(
            "1.0.0".to_string(),
            "state_root".to_string(),
            "test-node".to_string(),
            true,
            100,
            1234567890,
            "reg_hash".to_string(),
            "sdk_hash".to_string(),
            "seal_hash".to_string(),
        );
        
        let directive = daemon.heartbeat(local, None);
        assert_eq!(directive, ArchonDirective::A0_UnifyState);
    }
}
