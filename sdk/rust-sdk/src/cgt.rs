/*!
 * CGT (Creator God Token) operations
 */

use crate::client::DemiurgeClient;
use crate::error::Result;
use crate::types::{CgtBalance, CgtMetadata, ChainInfo};
use serde_json::json;

pub struct CgtApi<'a> {
    client: &'a DemiurgeClient,
}

impl<'a> CgtApi<'a> {
    pub fn new(client: &'a DemiurgeClient) -> Self {
        Self { client }
    }

    /// Get CGT metadata
    pub async fn get_metadata(&self) -> Result<CgtMetadata> {
        self.client.call("cgt_getCgtMetadata", None).await
    }

    /// Get total supply of CGT
    pub async fn get_total_supply(&self) -> Result<String> {
        #[derive(serde::Deserialize)]
        struct Response {
            total_supply: String,
        }
        let result: Response = self.client.call("cgt_getTotalSupply", None).await?;
        Ok(result.total_supply)
    }

    /// Get CGT balance for an address
    pub async fn get_balance(&self, address: &str) -> Result<String> {
        let result: CgtBalance = self
            .client
            .call("cgt_getBalance", Some(json!({ "address": address })))
            .await?;
        Ok(result.balance)
    }

    /// Get transaction nonce for an address
    pub async fn get_nonce(&self, address: &str) -> Result<u64> {
        self.client
            .call("cgt_getNonce", Some(json!({ "address": address })))
            .await
    }

    /// Get chain info
    pub async fn get_chain_info(&self) -> Result<ChainInfo> {
        self.client.call("cgt_getChainInfo", None).await
    }

    /// Submit a signed transaction
    pub async fn send_raw_transaction(&self, signed_tx_hex: &str) -> Result<String> {
        #[derive(serde::Deserialize)]
        struct Response {
            tx_hash: String,
        }
        let result: Response = self
            .client
            .call(
                "cgt_sendRawTransaction",
                Some(json!({ "tx_hex": signed_tx_hex })),
            )
            .await?;
        Ok(result.tx_hash)
    }

    /// Get transaction by hash
    pub async fn get_transaction(&self, tx_hash: &str) -> Result<serde_json::Value> {
        self.client
            .call("cgt_getTransaction", Some(json!({ "hash": tx_hash })))
            .await
    }
}

