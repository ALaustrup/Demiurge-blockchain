/*!
 * Abyss Marketplace operations
 */

use crate::client::DemiurgeClient;
use crate::error::Result;
use crate::types::Listing;
use serde_json::json;

pub struct MarketplaceApi<'a> {
    client: &'a DemiurgeClient,
}

impl<'a> MarketplaceApi<'a> {
    pub fn new(client: &'a DemiurgeClient) -> Self {
        Self { client }
    }

    /// Get all active listings
    pub async fn get_all_listings(&self) -> Result<Vec<Listing>> {
        self.client.call("abyss_getAllListings", None).await
    }

    /// Get a specific listing by ID
    pub async fn get_listing(&self, listing_id: u64) -> Result<Listing> {
        self.client
            .call("abyss_getListing", Some(json!({ "id": listing_id })))
            .await
    }
}

