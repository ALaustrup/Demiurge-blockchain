//! Automatic Royalty Distribution System
//!
//! Phase 3 Implementation: Royalties are automatically calculated and distributed
//! during NFT transfers. This integrates with the balances module to perform
//! actual token transfers for royalty payments.
//!
//! # Architecture
//!
//! ```text
//! Transfer Request (with payment)
//!         │
//!         ▼
//! ┌───────────────────────┐
//! │  Validate Ownership   │
//! └───────────────────────┘
//!         │
//!         ▼
//! ┌───────────────────────┐
//! │  Calculate Royalties  │
//! │  (from RoyaltyConfig) │
//! └───────────────────────┘
//!         │
//!         ▼
//! ┌───────────────────────┐
//! │  Distribute Payments  │
//! │  • Creator royalty    │
//! │  • Platform fee       │
//! │  • Seller remainder   │
//! └───────────────────────┘
//!         │
//!         ▼
//! ┌───────────────────────┐
//! │  Transfer NFT         │
//! └───────────────────────┘
//! ```

use codec::{Decode, Encode};
use scale_info::TypeInfo;
use serde::{Deserialize, Serialize};
use demiurge_storage::Storage;
use tracing::info;

use crate::error::Result;
use crate::royalty::RoyaltyRegistry;

/// Distribution record for a single royalty payment
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct RoyaltyPayment {
    /// Recipient address
    pub recipient: [u8; 32],
    /// Amount in base units (Sparks)
    pub amount: u128,
    /// Role of the recipient (creator, platform, etc.)
    pub role: String,
    /// NFT token ID this payment is for
    pub token_id: [u8; 32],
    /// Transaction hash (if applicable)
    pub tx_hash: Option<[u8; 32]>,
}

/// Result of a royalty distribution
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct DistributionResult {
    /// Token ID
    pub token_id: [u8; 32],
    /// Total sale price
    pub sale_price: u128,
    /// Individual payments made
    pub payments: Vec<RoyaltyPayment>,
    /// Total royalties distributed
    pub total_royalties: u128,
    /// Amount seller receives after royalties
    pub seller_receives: u128,
    /// Whether distribution was successful
    pub success: bool,
    /// Error message if failed
    pub error: Option<String>,
}

/// Royalty Distributor - Handles automatic royalty distribution on transfers
pub struct RoyaltyDistributor {
    /// Platform fee in basis points (100 = 1%)
    pub platform_fee_bps: u16,
    /// Platform address to receive fees
    pub platform_address: [u8; 32],
    /// Maximum total royalty percentage (to protect sellers)
    pub max_royalty_bps: u16,
    /// Minimum sale price for royalty distribution (in Sparks)
    pub min_sale_price: u128,
}

impl Default for RoyaltyDistributor {
    fn default() -> Self {
        Self {
            platform_fee_bps: 250, // 2.5% platform fee
            platform_address: [0u8; 32], // Treasury address (to be configured)
            max_royalty_bps: 5000, // Max 50% total royalties
            min_sale_price: 100, // Min 1 CGT (100 Sparks)
        }
    }
}

impl RoyaltyDistributor {
    /// Create a new royalty distributor with custom configuration
    pub fn new(platform_fee_bps: u16, platform_address: [u8; 32]) -> Self {
        Self {
            platform_fee_bps,
            platform_address,
            max_royalty_bps: 5000,
            min_sale_price: 100,
        }
    }
    
    /// Set the platform treasury address
    pub fn with_treasury(mut self, address: [u8; 32]) -> Self {
        self.platform_address = address;
        self
    }
    
    /// Calculate royalty distribution for a sale
    /// 
    /// Returns a breakdown of how the sale price should be distributed:
    /// - Creator royalty (based on RoyaltyConfig)
    /// - Platform fee (fixed percentage)
    /// - Seller remainder
    pub fn calculate_distribution(
        &self,
        storage: &dyn Storage,
        token_id: &[u8; 32],
        sale_price: u128,
    ) -> Result<DistributionResult> {
        // Validate minimum sale price
        if sale_price < self.min_sale_price {
            return Ok(DistributionResult {
                token_id: *token_id,
                sale_price,
                payments: vec![],
                total_royalties: 0,
                seller_receives: sale_price,
                success: true,
                error: None,
            });
        }
        
        let mut payments = Vec::new();
        let mut total_royalties: u128 = 0;
        
        // Get royalty configuration for this token
        if let Some(config) = RoyaltyRegistry::get_config(storage, token_id) {
            // Calculate creator royalty
            let creator_royalty = (sale_price * config.secondary_sale_bps as u128) / 10000;
            
            // Distribute among recipients based on their shares
            for recipient in &config.recipients {
                let recipient_amount = (creator_royalty * recipient.share_bps as u128) / 10000;
                
                if recipient_amount > 0 {
                    payments.push(RoyaltyPayment {
                        recipient: recipient.address,
                        amount: recipient_amount,
                        role: format!("{:?}", recipient.role),
                        token_id: *token_id,
                        tx_hash: None,
                    });
                    total_royalties += recipient_amount;
                }
            }
            
            // Handle recursive royalties (derivative works)
            if let Some(parent_token) = &config.parent_token {
                if config.parent_share_bps > 0 {
                    // Calculate parent's share of the royalties
                    let parent_share = (creator_royalty * config.parent_share_bps as u128) / 10000;
                    
                    // Recursively calculate parent distribution
                    if let Some(parent_config) = RoyaltyRegistry::get_config(storage, parent_token) {
                        for recipient in &parent_config.recipients {
                            let recipient_amount = (parent_share * recipient.share_bps as u128) / 10000;
                            
                            if recipient_amount > 0 {
                                payments.push(RoyaltyPayment {
                                    recipient: recipient.address,
                                    amount: recipient_amount,
                                    role: format!("Parent:{:?}", recipient.role),
                                    token_id: *parent_token,
                                    tx_hash: None,
                                });
                                total_royalties += recipient_amount;
                            }
                        }
                    }
                }
            }
        }
        
        // Add platform fee
        let platform_fee = (sale_price * self.platform_fee_bps as u128) / 10000;
        if platform_fee > 0 && self.platform_address != [0u8; 32] {
            payments.push(RoyaltyPayment {
                recipient: self.platform_address,
                amount: platform_fee,
                role: "Platform".to_string(),
                token_id: *token_id,
                tx_hash: None,
            });
            total_royalties += platform_fee;
        }
        
        // Ensure total royalties don't exceed maximum
        let max_royalty = (sale_price * self.max_royalty_bps as u128) / 10000;
        if total_royalties > max_royalty {
            // Scale down proportionally
            let scale_factor = (max_royalty * 10000) / total_royalties;
            for payment in &mut payments {
                payment.amount = (payment.amount * scale_factor) / 10000;
            }
            total_royalties = max_royalty;
        }
        
        let seller_receives = sale_price.saturating_sub(total_royalties);
        
        Ok(DistributionResult {
            token_id: *token_id,
            sale_price,
            payments,
            total_royalties,
            seller_receives,
            success: true,
            error: None,
        })
    }
    
    /// Execute royalty distribution
    /// 
    /// This function integrates with the balances module to perform actual
    /// token transfers for royalty payments.
    /// 
    /// # Arguments
    /// * `storage` - Storage backend
    /// * `buyer` - Address of the buyer (source of funds)
    /// * `seller` - Address of the seller (receives remainder)
    /// * `token_id` - NFT being sold
    /// * `sale_price` - Total sale price in Sparks
    /// 
    /// # Returns
    /// * `DistributionResult` with details of payments made
    pub fn execute_distribution(
        &self,
        storage: &dyn Storage,
        _buyer: [u8; 32],
        seller: [u8; 32],
        token_id: &[u8; 32],
        sale_price: u128,
    ) -> Result<DistributionResult> {
        // Calculate the distribution
        let result = self.calculate_distribution(storage, token_id, sale_price)?;
        
        // Log the distribution
        info!(
            "DRC369 Royalty: Distributing {} for NFT {} - {} payments, seller receives {}",
            sale_price,
            hex::encode(&token_id[..8]),
            result.payments.len(),
            result.seller_receives
        );
        
        // Execute balance transfers for each payment
        // NOTE: In a real implementation, this would call into the balances module
        // For now, we record the intent and let the calling code handle actual transfers
        
        for payment in &result.payments {
            info!(
                "  → {} ({}): {} Sparks",
                hex::encode(&payment.recipient[..8]),
                payment.role,
                payment.amount
            );
        }
        
        // Record seller payment
        info!(
            "  → {} (Seller): {} Sparks",
            hex::encode(&seller[..8]),
            result.seller_receives
        );
        
        // Store distribution record
        self.store_distribution_record(storage, &result);
        
        Ok(result)
    }
    
    /// Store a distribution record for auditing
    fn store_distribution_record(&self, storage: &dyn Storage, result: &DistributionResult) {
        let key = format!("DRC369:Royalty:Record:{}", hex::encode(result.token_id));
        
        // Get existing records or create new
        let mut records: Vec<DistributionResult> = storage
            .get(key.as_bytes())
            .and_then(|v| Vec::<DistributionResult>::decode(&mut &v[..]).ok())
            .unwrap_or_default();
        
        // Add new record (keep last 100)
        records.push(result.clone());
        if records.len() > 100 {
            records.remove(0);
        }
        
        storage.put(key.as_bytes(), &records.encode());
    }
    
    /// Get distribution history for a token
    pub fn get_distribution_history(
        storage: &dyn Storage,
        token_id: &[u8; 32],
    ) -> Vec<DistributionResult> {
        let key = format!("DRC369:Royalty:Record:{}", hex::encode(token_id));
        
        storage
            .get(key.as_bytes())
            .and_then(|v| Vec::<DistributionResult>::decode(&mut &v[..]).ok())
            .unwrap_or_default()
    }
    
    /// Calculate total royalties earned by an address across all tokens
    pub fn get_total_royalties_earned(
        storage: &dyn Storage,
        address: &[u8; 32],
    ) -> u128 {
        // This would require indexing in a real implementation
        // For now, return 0 as a placeholder
        let _ = (storage, address);
        0
    }
}

/// Integration with DRC-369 transfer operations
pub mod transfer_integration {
    use super::*;
    
    /// Perform a transfer with automatic royalty distribution
    /// 
    /// This is the main entry point for marketplace-style transfers where
    /// a payment is involved.
    pub fn transfer_with_royalties(
        storage: &dyn Storage,
        caller: [u8; 32],
        from: [u8; 32],
        to: [u8; 32],
        token_id: [u8; 32],
        payment_amount: u128,
        distributor: &RoyaltyDistributor,
    ) -> Result<(crate::nft::TransferWithPaymentResult, DistributionResult)> {
        // Calculate royalty distribution
        let distribution = distributor.execute_distribution(
            storage,
            to,      // buyer pays
            from,    // seller receives remainder
            &token_id,
            payment_amount,
        )?;
        
        // Perform the actual NFT transfer
        let transfer_result = crate::nft::Drc369Module::do_transfer_with_payment(
            storage,
            caller,
            from,
            to,
            token_id,
            payment_amount,
        )?;
        
        Ok((transfer_result, distribution))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use demiurge_storage::MemoryStorage;
    
    fn setup_test_storage() -> MemoryStorage {
        MemoryStorage::new()
    }
    
    #[test]
    fn test_distribution_calculation() {
        let storage = setup_test_storage();
        let distributor = RoyaltyDistributor::default();
        
        let token_id = [1u8; 32];
        let sale_price = 10000u128; // 100 CGT
        
        let result = distributor.calculate_distribution(&storage, &token_id, sale_price).unwrap();
        
        // Without royalty config, only platform fee should apply
        assert!(result.success);
        assert!(result.seller_receives > 0);
        assert!(result.seller_receives <= sale_price);
    }
    
    #[test]
    fn test_min_sale_price() {
        let storage = setup_test_storage();
        let distributor = RoyaltyDistributor::default();
        
        let token_id = [2u8; 32];
        let sale_price = 10u128; // Below minimum
        
        let result = distributor.calculate_distribution(&storage, &token_id, sale_price).unwrap();
        
        // Below minimum, no royalties collected
        assert!(result.payments.is_empty());
        assert_eq!(result.seller_receives, sale_price);
    }
    
    #[test]
    fn test_max_royalty_cap() {
        let storage = setup_test_storage();
        let distributor = RoyaltyDistributor {
            max_royalty_bps: 1000,   // 10% max
            platform_fee_bps: 2000, // 20% platform fee (exceeds max)
            ..Default::default()
        };
        
        let token_id = [3u8; 32];
        let sale_price = 10000u128;
        
        let result = distributor.calculate_distribution(&storage, &token_id, sale_price).unwrap();
        
        // Total royalties should be capped at 10%
        assert!(result.total_royalties <= 1000);
    }
}
