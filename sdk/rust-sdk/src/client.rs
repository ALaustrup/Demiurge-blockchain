/*!
 * Core RPC client for Demiurge Blockchain
 */

use crate::error::{DemiurgeError, Result};
use crate::types::{RpcRequest, RpcResponse};
use reqwest::Client;
use std::time::Duration;

pub struct DemiurgeClient {
    rpc_url: String,
    http_client: Client,
    retries: u32,
    retry_delay: Duration,
}

impl DemiurgeClient {
    pub fn new(rpc_url: impl Into<String>) -> Self {
        Self {
            rpc_url: rpc_url.into(),
            http_client: Client::builder()
                .timeout(Duration::from_secs(30))
                .build()
                .expect("Failed to create HTTP client"),
            retries: 3,
            retry_delay: Duration::from_millis(1000),
        }
    }

    pub fn with_retries(mut self, retries: u32) -> Self {
        self.retries = retries;
        self
    }

    pub fn with_retry_delay(mut self, delay: Duration) -> Self {
        self.retry_delay = delay;
        self
    }

    /// Call an RPC method with automatic retries and error handling
    pub async fn call<T>(&self, method: &str, params: Option<serde_json::Value>) -> Result<T>
    where
        T: serde::de::DeserializeOwned,
    {
        let mut last_error: Option<DemiurgeError> = None;

        for attempt in 0..=self.retries {
            let request = RpcRequest {
                jsonrpc: "2.0".to_string(),
                method: method.to_string(),
                params: params.clone(),
                id: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_millis() as u64,
            };

            match self.http_client
                .post(&self.rpc_url)
                .json(&request)
                .send()
                .await
            {
                Ok(response) => {
                    if !response.status().is_success() {
                        last_error = Some(DemiurgeError::Http(format!(
                            "HTTP {}: {}",
                            response.status(),
                            response.status().canonical_reason().unwrap_or("Unknown")
                        )));
                        if attempt < self.retries {
                            tokio::time::sleep(self.retry_delay * (attempt + 1)).await;
                            continue;
                        }
                        break;
                    }

                    let rpc_response: RpcResponse<T> = response.json().await?;

                    if let Some(error) = rpc_response.error {
                        // Don't retry on certain RPC errors
                        if error.code == -32602 || error.code == -32603 {
                            return Err(DemiurgeError::Rpc(error.message));
                        }
                        last_error = Some(DemiurgeError::Rpc(error.message));
                        if attempt < self.retries {
                            tokio::time::sleep(self.retry_delay * (attempt + 1)).await;
                            continue;
                        }
                        break;
                    }

                    if let Some(result) = rpc_response.result {
                        return Ok(result);
                    }

                    last_error = Some(DemiurgeError::Rpc(
                        "RPC response missing result".to_string(),
                    ));
                }
                Err(e) => {
                    last_error = Some(DemiurgeError::Http(e.to_string()));
                    if attempt < self.retries {
                        tokio::time::sleep(self.retry_delay * (attempt + 1)).await;
                        continue;
                    }
                }
            }
        }

        // All retries exhausted
        Err(last_error.unwrap_or_else(|| {
            DemiurgeError::Other("RPC call failed after retries".to_string())
        }))
    }

    pub fn rpc_url(&self) -> &str {
        &self.rpc_url
    }
}

