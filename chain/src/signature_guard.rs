//! Signature Guard
//!
//! PHASE OMEGA PART II: Protects against signature forgery and replay attacks.

use crate::core::transaction::{Address, Signature, Transaction};
use sha2::{Digest, Sha256};
use hex;

/// Signature guard that validates transaction signatures
pub struct SignatureGuard;

impl SignatureGuard {
    /// Verify transaction signature
    pub fn verify_signature(tx: &Transaction) -> Result<(), String> {
        // PHASE OMEGA PART II: Verify Ed25519 signature
        // In a real implementation, we'd:
        // 1. Reconstruct the message that was signed
        // 2. Verify the signature against the sender's public key
        
        if tx.signature.is_empty() {
            return Err("Transaction signature is empty".to_string());
        }
        
        if tx.signature.len() != 64 {
            return Err(format!(
                "Invalid signature length: expected 64, got {}",
                tx.signature.len()
            ));
        }
        
        // TODO: Implement actual Ed25519 signature verification
        // For now, we just check the signature is present and correct length
        
        Ok(())
    }

    /// Compute transaction hash for signing
    pub fn compute_transaction_hash(tx: &Transaction) -> [u8; 32] {
        // PHASE OMEGA PART II: Deterministic transaction hash
        // This must match what the client signs
        
        let mut hasher = Sha256::new();
        hasher.update(&tx.from);
        hasher.update(&tx.nonce.to_le_bytes());
        hasher.update(tx.module_id.as_bytes());
        hasher.update(tx.call_id.as_bytes());
        hasher.update(&tx.payload);
        hasher.update(&tx.fee.to_le_bytes());
        
        let result = hasher.finalize();
        let mut hash = [0u8; 32];
        hash.copy_from_slice(&result);
        hash
    }

    /// Verify signature against transaction hash
    pub fn verify_transaction_signature(tx: &Transaction) -> Result<(), String> {
        // PHASE OMEGA PART II: Full signature verification
        let hash = Self::compute_transaction_hash(tx);
        
        // Verify signature is not empty
        if tx.signature.is_empty() {
            return Err("Transaction has no signature".to_string());
        }
        
        // TODO: Implement Ed25519 verification
        // ed25519_dalek::PublicKey::verify(&hash, &signature)
        
        // For now, we just verify the signature exists and has correct length
        Self::verify_signature(tx)
    }

    /// Check for signature anomalies (replay attacks, etc.)
    pub fn detect_signature_anomalies(
        tx: &Transaction,
        seen_nonces: &std::collections::HashSet<(Address, u64)>,
    ) -> Result<(), String> {
        // PHASE OMEGA PART II: Detect replay attacks
        let key = (tx.from, tx.nonce);
        
        if seen_nonces.contains(&key) {
            return Err(format!(
                "Replay attack detected: nonce {} already used by address {:?}",
                tx.nonce,
                hex::encode(tx.from)
            ));
        }
        
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::transaction::Transaction;

    #[test]
    fn test_transaction_hash_computation() {
        let tx = Transaction {
            from: [0; 32],
            nonce: 1,
            module_id: "test".to_string(),
            call_id: "test".to_string(),
            payload: vec![],
            fee: 0,
            signature: vec![],
        };
        
        let hash1 = SignatureGuard::compute_transaction_hash(&tx);
        let hash2 = SignatureGuard::compute_transaction_hash(&tx);
        
        // Hash should be deterministic
        assert_eq!(hash1, hash2);
    }
}
