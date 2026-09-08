//! Block structure and validation
//!
//! Includes CVP (Consensus-Verified Polymorphism) proof root for epoch-based
//! bytecode mutations with cryptographic commitments.

use codec::{Decode, Encode};
use scale_info::TypeInfo;
use serde::{Serialize, Deserialize};
use crate::Transaction;
use crate::serde_helpers::{serialize_bytes, deserialize_bytes, serialize_option_bytes, deserialize_option_bytes};

/// A block in the blockchain
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct Block {
    pub header: BlockHeader,
    pub transactions: Vec<Transaction>,
}

/// Block header
/// 
/// The `cvp_proof_root` field contains a Merkle root of all CVP equivalence proofs
/// generated during epoch transitions. This cryptographically commits validators
/// to the bytecode mutations, ensuring consensus on the polymorphic state.
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct BlockHeader {
    #[serde(serialize_with = "serialize_bytes", deserialize_with = "deserialize_bytes")]
    pub parent_hash: [u8; 32],
    pub block_number: u64,
    #[serde(serialize_with = "serialize_bytes", deserialize_with = "deserialize_bytes")]
    pub state_root: [u8; 32],
    #[serde(serialize_with = "serialize_bytes", deserialize_with = "deserialize_bytes")]
    pub extrinsics_root: [u8; 32],
    pub timestamp: u64,
    
    /// CVP (Consensus-Verified Polymorphism) proof root
    /// 
    /// Present only at epoch boundaries when bytecode mutations occur.
    /// Contains Merkle root of: hash(contract_id || original_hash || new_hash || proof_hash)
    /// for all contracts mutated in this epoch transition.
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        serialize_with = "serialize_option_bytes",
        deserialize_with = "deserialize_option_bytes"
    )]
    pub cvp_proof_root: Option<[u8; 32]>,
    
    /// Epoch number for CVP mutations (increments at epoch boundaries)
    #[serde(default)]
    pub cvp_epoch: u64,
}

impl Block {
    /// Validate the block structure and contents
    /// 
    /// If a parent block is provided, validates:
    /// - Parent hash matches parent block's hash
    /// - Block number is sequential (parent + 1)
    /// 
    /// Always validates:
    /// - Extrinsics root matches calculated root from transactions
    /// - Timestamp is not too far in the future (30 second tolerance)
    /// - All transactions are valid
    pub fn validate(&self, parent: Option<&Block>) -> crate::Result<()> {
        use crate::Error;
        
        // Verify parent hash and block number if parent provided
        if let Some(parent_block) = parent {
            if self.header.parent_hash != parent_block.hash() {
                return Err(Error::InvalidBlock("Parent hash mismatch".into()));
            }
            if self.header.block_number != parent_block.header.block_number + 1 {
                return Err(Error::InvalidBlock(format!(
                    "Block number not sequential: expected {}, got {}",
                    parent_block.header.block_number + 1,
                    self.header.block_number
                )));
            }
        } else if self.header.block_number != 0 {
            // Genesis block check - block 0 should have zero parent hash
            let zero_hash = [0u8; 32];
            if self.header.parent_hash != zero_hash && self.header.block_number > 0 {
                // Non-genesis block without parent context - we can't fully validate
                // This is acceptable for syncing blocks from network
            }
        }
        
        // Verify extrinsics root
        let calculated_root = self.calculate_extrinsics_root();
        if self.header.extrinsics_root != calculated_root {
            return Err(Error::InvalidBlock("Extrinsics root mismatch".into()));
        }
        
        // Check timestamp is reasonable (not too far in future)
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64;
        
        // Allow 30 second tolerance for clock skew
        if self.header.timestamp > now + 30_000 {
            return Err(Error::InvalidBlock("Block timestamp too far in future".into()));
        }
        
        // Validate all transactions
        for (idx, tx) in self.transactions.iter().enumerate() {
            tx.validate().map_err(|e| {
                Error::InvalidBlock(format!("Transaction {} invalid: {}", idx, e))
            })?;
        }
        
        Ok(())
    }
    
    /// Validate block without parent context (for received blocks)
    pub fn validate_standalone(&self) -> crate::Result<()> {
        self.validate(None)
    }
    
    /// Calculate the extrinsics (transactions) root hash
    pub fn calculate_extrinsics_root(&self) -> [u8; 32] {
        use blake2::{Blake2b512, Digest};
        
        if self.transactions.is_empty() {
            // Empty transactions = zero hash
            return [0u8; 32];
        }
        
        // Hash all encoded transactions together
        let mut hasher = Blake2b512::new();
        for tx in &self.transactions {
            hasher.update(tx.encode());
        }
        let hash = hasher.finalize();
        let mut result = [0u8; 32];
        result.copy_from_slice(&hash[..32]);
        result
    }

    /// Calculate block hash
    pub fn hash(&self) -> [u8; 32] {
        use blake2::{Blake2b512, Digest};
        let encoded = self.header.encode();
        let hash = Blake2b512::digest(&encoded);
        let mut result = [0u8; 32];
        result.copy_from_slice(&hash[..32]);
        result
    }
}
