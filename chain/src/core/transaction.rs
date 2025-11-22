//! Transaction types for the Demiurge chain.
//!
//! This module defines the `Transaction` structure that represents all operations
//! on the chain. Transactions are routed to runtime modules via `module_id` and
//! `call_id`, with parameters encoded in the `payload` field.

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use thiserror::Error;

/// Address type: a 32-byte public key identifier.
pub type Address = [u8; 32];

/// Signature type: a 64-byte Ed25519-style signature.
///
/// Using Vec<u8> instead of [u8; 64] for serde compatibility.
/// In production, consider using serde_bytes for fixed-size arrays.
pub type Signature = Vec<u8>;

/// A transaction that can be executed on the chain.
///
/// Transactions are routed to runtime modules based on `module_id` (e.g., "bank_cgt")
/// and `call_id` (e.g., "transfer"). The `payload` contains bincode-serialized
/// call parameters that the module will deserialize and process.
///
/// In Phase 3, transactions will be signed and verified before execution.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Transaction {
    /// Address of the transaction sender.
    pub from: Address,
    /// Nonce to prevent replay attacks.
    pub nonce: u64,
    /// Runtime module identifier (e.g., "bank_cgt", "nft_dgen").
    pub module_id: String,
    /// Call identifier within the module (e.g., "transfer", "mint_dgen").
    pub call_id: String,
    /// Bincode-serialized call parameters.
    pub payload: Vec<u8>,
    /// Transaction fee in CGT (will be deducted in Phase 3).
    pub fee: u64,
    /// Transaction signature (placeholder for Phase 3 signature verification).
    pub signature: Signature,
}

/// Errors that can occur during transaction serialization/deserialization.
#[derive(Debug, Error)]
pub enum TransactionError {
    #[error("Serialization error: {0}")]
    SerializationError(#[from] bincode::Error),
    #[error("Deserialization error: {0}")]
    DeserializationError(String),
}

impl Transaction {
    /// Serialize this transaction to bytes.
    ///
    /// Returns the bincode-serialized representation of the transaction.
    pub fn to_bytes(&self) -> Result<Vec<u8>, TransactionError> {
        bincode::serialize(self).map_err(TransactionError::SerializationError)
    }

    /// Deserialize a transaction from bytes.
    ///
    /// Attempts to deserialize a `Transaction` from the provided byte slice.
    pub fn from_bytes(bytes: &[u8]) -> Result<Self, TransactionError> {
        bincode::deserialize(bytes)
            .map_err(|e| TransactionError::DeserializationError(e.to_string()))
    }

    /// Compute the hash of this transaction.
    ///
    /// Returns a 32-byte SHA-256 hash of the bincode-serialized transaction.
    pub fn hash(&self) -> Result<[u8; 32], TransactionError> {
        let bytes = self.to_bytes()?;
        let mut hasher = Sha256::new();
        hasher.update(&bytes);
        let digest = hasher.finalize();
        let mut hash = [0u8; 32];
        hash.copy_from_slice(&digest);
        Ok(hash)
    }

    /// Serialize transaction without signature for signing.
    ///
    /// This creates a copy of the transaction with an empty signature,
    /// serializes it, and returns the bytes. This is used for creating
    /// the message that will be signed.
    pub fn serialize_for_signing(&self) -> Result<Vec<u8>, TransactionError> {
        let mut tx_for_signing = self.clone();
        tx_for_signing.signature = vec![];
        tx_for_signing.to_bytes()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_transaction_serialization_round_trip() {
        let tx = Transaction {
            from: [1; 32],
            nonce: 42,
            module_id: "bank_cgt".to_string(),
            call_id: "transfer".to_string(),
            payload: vec![1, 2, 3, 4],
            fee: 100,
            signature: vec![0; 64],
        };

        // Serialize
        let bytes = tx.to_bytes().expect("Serialization should succeed");
        assert!(!bytes.is_empty());

        // Deserialize
        let tx2 = Transaction::from_bytes(&bytes).expect("Deserialization should succeed");

        // Verify all fields are preserved
        assert_eq!(tx.from, tx2.from);
        assert_eq!(tx.nonce, tx2.nonce);
        assert_eq!(tx.module_id, tx2.module_id);
        assert_eq!(tx.call_id, tx2.call_id);
        assert_eq!(tx.payload, tx2.payload);
        assert_eq!(tx.fee, tx2.fee);
        assert_eq!(tx.signature, tx2.signature);
    }

    #[test]
    fn test_module_call_ids_preserved() {
        let tx = Transaction {
            from: [0; 32],
            nonce: 0,
            module_id: "nft_dgen".to_string(),
            call_id: "mint_dgen".to_string(),
            payload: vec![],
            fee: 0,
            signature: vec![0; 64],
        };

        let bytes = tx.to_bytes().expect("Serialization should succeed");
        let tx2 = Transaction::from_bytes(&bytes).expect("Deserialization should succeed");

        assert_eq!(tx.module_id, tx2.module_id);
        assert_eq!(tx.call_id, tx2.call_id);
    }
}
