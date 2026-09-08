//! Transaction types and validation

use std::string::String;
use std::vec::Vec;
use codec::{Decode, Encode};
use scale_info::TypeInfo;
use serde::{Serialize, Deserialize};
use crate::serde_helpers::{serialize_bytes, deserialize_bytes, serialize_bytes64, deserialize_bytes64};

/// A transaction on the blockchain
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct Transaction {
    pub nonce: u64,
    #[serde(serialize_with = "serialize_bytes", deserialize_with = "deserialize_bytes")]
    pub from: [u8; 32], // Account ID
    #[serde(serialize_with = "serialize_bytes64", deserialize_with = "deserialize_bytes64")]
    pub signature: [u8; 64], // Ed25519 signature
    pub data: TransactionData,
}

/// Transaction data payload
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub enum TransactionData {
    /// Call a module function
    ModuleCall {
        module: String,
        call: Vec<u8>,
    },
    /// Transfer tokens
    Transfer {
        #[serde(serialize_with = "serialize_bytes", deserialize_with = "deserialize_bytes")]
        to: [u8; 32],
        amount: u128,
    },
}

impl Transaction {
    /// Validate the transaction
    /// 
    /// Verifies:
    /// - Ed25519 signature is valid for the signing payload
    /// - Transaction data is well-formed
    pub fn validate(&self) -> crate::Result<()> {
        use ed25519_dalek::{VerifyingKey, Verifier, Signature};
        use crate::Error;
        
        // Get the signing payload (everything except signature)
        let signing_data = self.signing_payload();
        
        // Parse public key from 'from' field (account ID is the public key)
        let public_key = VerifyingKey::from_bytes(&self.from)
            .map_err(|_| Error::InvalidSignature)?;
        
        // Parse signature
        let signature = Signature::from_bytes(&self.signature);
        
        // Verify signature
        public_key.verify(&signing_data, &signature)
            .map_err(|_| Error::InvalidSignature)?;
        
        // Validate transaction data
        self.validate_data()?;
        
        Ok(())
    }
    
    /// Create the payload that was signed
    /// 
    /// The signing payload includes: nonce, from, and data (but not signature)
    pub fn signing_payload(&self) -> Vec<u8> {
        let mut payload = Vec::new();
        payload.extend_from_slice(&self.nonce.encode());
        payload.extend_from_slice(&self.from);
        payload.extend_from_slice(&self.data.encode());
        payload
    }
    
    /// Validate the transaction data payload
    fn validate_data(&self) -> crate::Result<()> {
        use crate::Error;
        
        match &self.data {
            TransactionData::ModuleCall { module, call } => {
                // Module name should not be empty
                if module.is_empty() {
                    return Err(Error::InvalidTransaction("Module name is empty".into()));
                }
                // Call data can be empty for some calls
                if call.len() > 1024 * 1024 {
                    return Err(Error::InvalidTransaction("Call data too large".into()));
                }
            }
            TransactionData::Transfer { to, amount } => {
                // Cannot transfer to self
                if to == &self.from {
                    return Err(Error::InvalidTransaction("Cannot transfer to self".into()));
                }
                // Amount should be non-zero for transfers
                if *amount == 0 {
                    return Err(Error::InvalidTransaction("Transfer amount is zero".into()));
                }
            }
        }
        
        Ok(())
    }
    
    /// Calculate transaction hash
    pub fn hash(&self) -> [u8; 32] {
        use blake2::{Blake2b512, Digest};
        let encoded = self.encode();
        let hash = Blake2b512::digest(&encoded);
        let mut result = [0u8; 32];
        result.copy_from_slice(&hash[..32]);
        result
    }
}
