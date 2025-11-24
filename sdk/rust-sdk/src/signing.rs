/*!
 * Ed25519 signing utilities for Demiurge transactions
 */

use crate::error::{DemiurgeError, Result};
use ed25519_dalek::{Signer, SigningKey, VerifyingKey};
use sha2::{Digest, Sha256};

/// Derive public key (address) from private key
pub fn derive_address(private_key: &[u8; 32]) -> Result<String> {
    let signing_key = SigningKey::from_bytes(private_key);
    let verifying_key: VerifyingKey = signing_key.verifying_key();
    Ok(format!("0x{}", hex::encode(verifying_key.as_bytes())))
}

/// Sign a message with Ed25519
pub fn sign_message(message: &[u8], private_key: &[u8; 32]) -> Result<String> {
    let signing_key = SigningKey::from_bytes(private_key);
    let signature = signing_key.sign(message);
    Ok(hex::encode(signature.to_bytes()))
}

/// Sign a transaction (hashes the transaction bytes first)
pub fn sign_transaction(tx_bytes: &[u8], private_key: &[u8; 32]) -> Result<String> {
    let mut hasher = Sha256::new();
    hasher.update(tx_bytes);
    let hash = hasher.finalize();
    sign_message(&hash, private_key)
}

/// Convert hex string to bytes
pub fn hex_to_bytes(hex: &str) -> Result<Vec<u8>> {
    let clean_hex = hex.strip_prefix("0x").unwrap_or(hex);
    hex::decode(clean_hex)
        .map_err(|e| DemiurgeError::Other(format!("Invalid hex string: {}", e)))
}

/// Convert hex string to 32-byte array (for private keys)
pub fn hex_to_bytes_32(hex: &str) -> Result<[u8; 32]> {
    let bytes = hex_to_bytes(hex)?;
    if bytes.len() != 32 {
        return Err(DemiurgeError::Other("Expected 32 bytes".to_string()));
    }
    let mut array = [0u8; 32];
    array.copy_from_slice(&bytes);
    Ok(array)
}

