/*!
 * D-GEN NFT operations
 */

use crate::client::DemiurgeClient;
use crate::error::Result;
use crate::types::DGenMetadata;
use serde_json::json;

pub struct NftApi<'a> {
    client: &'a DemiurgeClient,
}

impl<'a> NftApi<'a> {
    pub fn new(client: &'a DemiurgeClient) -> Self {
        Self { client }
    }

    /// Get NFT metadata by ID
    pub async fn get_nft(&self, nft_id: u64) -> Result<DGenMetadata> {
        self.client
            .call("cgt_getNft", Some(json!({ "id": nft_id })))
            .await
    }

    /// Get all NFTs owned by an address
    pub async fn get_nfts_by_owner(&self, owner: &str) -> Result<Vec<DGenMetadata>> {
        self.client
            .call("cgt_getNftsByOwner", Some(json!({ "owner": owner })))
            .await
    }
}

