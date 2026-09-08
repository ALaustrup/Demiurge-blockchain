//! Consensus Engine Hook
//!
//! This module provides the direct integration points for adding CVP
//! to the Demiurge consensus engine.
//!
//! ## Integration Steps
//!
//! 1. Add `demiurge-cvp` to consensus/Cargo.toml dependencies
//! 2. Add `CvpConsensusIntegration` to `ConsensusEngine` struct
//! 3. Call `on_block_finalized` in `finalize_block` method
//! 4. Include CVP proofs in block structure
//!
//! ## Example Integration
//!
//! ```rust,ignore
//! // In consensus/src/engine.rs
//!
//! use demiurge_cvp::{CvpConsensusIntegration, CvpConfig, TransactionInfo};
//!
//! pub struct ConsensusEngine<S: Storage> {
//!     // ... existing fields ...
//!     cvp: CvpConsensusIntegration,
//! }
//!
//! impl<S: Storage> ConsensusEngine<S> {
//!     pub fn new(storage: S, block_time_ms: u64) -> Self {
//!         Self {
//!             // ... existing initialization ...
//!             cvp: CvpConsensusIntegration::new(CvpConfig {
//!                 mutation_epoch_length: 100, // Mutate every 100 blocks
//!                 ..Default::default()
//!             }),
//!         }
//!     }
//!
//!     pub fn finalize_block(
//!         &mut self,
//!         block: &Block,
//!         signatures: Vec<BlockSignature>,
//!     ) -> Result<()> {
//!         // ... existing validation ...
//!
//!         // CVP Integration
//!         let tx_infos: Vec<TransactionInfo> = block.transactions
//!             .iter()
//!             .map(|tx| tx.into())
//!             .collect();
//!         
//!         let cvp_result = self.cvp.on_block_finalized(
//!             block.header.block_number,
//!             block.hash(),
//!             &tx_infos,
//!         )?;
//!
//!         // Log threats
//!         for threat in &cvp_result.threats_detected {
//!             tracing::warn!("CVP Threat: {:?}", threat);
//!         }
//!
//!         // ... rest of finalization ...
//!     }
//! }
//! ```

use crate::{CvpConsensusIntegration, TransactionInfo, EquivalenceProof};

/// Block extension for CVP proofs
/// 
/// This shows how to extend the block structure to include CVP proofs.
#[derive(Debug, Clone)]
pub struct CvpBlockExtension {
    /// CVP equivalence proofs for this block
    pub cvp_proofs: Vec<EquivalenceProof>,
    
    /// Whether this block triggers an epoch transition
    pub is_epoch_transition: bool,
    
    /// Epoch number after this block
    pub epoch: u64,
}

impl CvpBlockExtension {
    /// Create empty extension (no CVP data)
    pub fn empty() -> Self {
        Self {
            cvp_proofs: Vec::new(),
            is_epoch_transition: false,
            epoch: 0,
        }
    }
    
    /// Create extension with proofs
    pub fn with_proofs(proofs: Vec<EquivalenceProof>, epoch: u64) -> Self {
        let is_transition = !proofs.is_empty();
        Self {
            cvp_proofs: proofs,
            is_epoch_transition: is_transition,
            epoch,
        }
    }
}

/// Helper to convert transaction to TransactionInfo
/// 
/// This would be implemented in the consensus module to convert
/// the native Transaction type to CVP's TransactionInfo.
pub trait IntoCvpTransactionInfo {
    fn into_cvp_info(self) -> TransactionInfo;
}

/// Example implementation for a generic transaction
/// 
/// Real implementation would use the actual Transaction type from demiurge-core
#[derive(Debug)]
pub struct TransactionAdapter {
    pub hash: [u8; 32],
    pub sender: [u8; 32],
    pub target: Option<[u8; 32]>,
    pub data: Vec<u8>,
    pub gas_used: u64,
    pub value: u128,
    pub success: bool,
}

impl IntoCvpTransactionInfo for TransactionAdapter {
    fn into_cvp_info(self) -> TransactionInfo {
        let function_selector = if self.data.len() >= 4 {
            let mut sel = [0u8; 4];
            sel.copy_from_slice(&self.data[..4]);
            Some(sel)
        } else {
            None
        };
        
        TransactionInfo {
            hash: self.hash,
            sender: self.sender,
            target_contract: self.target,
            function_selector,
            gas_used: self.gas_used,
            value: self.value,
            success: self.success,
            call_depth: 1, // Would come from execution trace
            timestamp: 0,  // Would come from block
        }
    }
}

/// Era transition hook
/// 
/// Shows how to integrate CVP with the existing era transition.
pub fn integrate_era_transition(
    cvp: &mut CvpConsensusIntegration,
    block_number: u64,
    block_hashes: &[[u8; 32]],
    transactions: &[TransactionInfo],
) -> crate::Result<CvpBlockExtension> {
    // Process the block
    let _result = cvp.on_block_finalized(
        block_number,
        block_hashes.last().copied().unwrap_or([0u8; 32]),
        transactions,
    )?;
    
    // Get pending proofs if any mutations occurred
    let proofs = cvp.take_pending_proofs();
    
    // Get stats for epoch number
    let stats = cvp.stats();
    
    Ok(CvpBlockExtension::with_proofs(proofs, stats.current_epoch))
}

/// Block validation with CVP
/// 
/// Shows how to validate CVP proofs during block import.
pub fn validate_block_cvp(
    cvp: &CvpConsensusIntegration,
    extension: &CvpBlockExtension,
) -> crate::Result<bool> {
    if extension.cvp_proofs.is_empty() {
        return Ok(true); // No proofs to validate
    }
    
    cvp.verify_block_proofs(&extension.cvp_proofs)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::CvpConfig;
    
    #[test]
    fn test_cvp_block_extension() {
        let ext = CvpBlockExtension::empty();
        assert!(!ext.is_epoch_transition);
        assert!(ext.cvp_proofs.is_empty());
    }
    
    #[test]
    fn test_transaction_adapter() {
        let tx = TransactionAdapter {
            hash: [1u8; 32],
            sender: [2u8; 32],
            target: Some([3u8; 32]),
            data: vec![0xa9, 0x05, 0x9c, 0xbb, 1, 2, 3, 4],
            gas_used: 100_000,
            value: 1_000_000,
            success: true,
        };
        
        let info = tx.into_cvp_info();
        
        assert_eq!(info.hash, [1u8; 32]);
        assert_eq!(info.function_selector, Some([0xa9, 0x05, 0x9c, 0xbb]));
    }
    
    #[test]
    fn test_era_transition_integration() {
        let config = CvpConfig {
            mutation_epoch_length: 10,
            ..Default::default()
        };
        let mut cvp = CvpConsensusIntegration::new(config);
        
        let hashes = vec![[1u8; 32]];
        let transactions = vec![];
        
        let result = integrate_era_transition(&mut cvp, 10, &hashes, &transactions);
        assert!(result.is_ok());
    }
}
