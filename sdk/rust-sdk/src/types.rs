/*!
 * Type definitions for Demiurge Blockchain entities
 */

use serde::{Deserialize, Serialize};

pub type Address = String; // 64-char hex string (32 bytes)

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CgtMetadata {
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub max_supply: String,
    pub total_supply: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CgtBalance {
    pub balance: String, // u128 as string
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UrgeIdProfile {
    pub address: String,
    pub display_name: String,
    pub bio: Option<String>,
    pub handle: Option<String>,
    pub username: Option<String>,
    pub level: u32,
    pub syzygy_score: u64,
    pub total_cgt_earned_from_rewards: String,
    pub badges: Vec<String>,
    pub created_at_height: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UrgeIdProgress {
    pub address: String,
    pub level: u32,
    pub syzygy_score: u64,
    pub current_level_threshold: u64,
    pub next_level_threshold: u64,
    pub progress_ratio: f64,
    pub total_cgt_earned_from_rewards: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DGenMetadata {
    pub id: u64,
    pub owner: Address,
    pub creator: Address,
    pub fabric_root_hash: String,
    pub royalty_bps: Option<u16>,
    pub name: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Listing {
    pub id: u64,
    pub nft_id: u64,
    pub seller: Address,
    pub price: String, // CGT in smallest units
    pub created_at: u64,
    pub status: String, // "active" | "sold" | "cancelled"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChainInfo {
    pub height: u64,
    pub block_hash: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RpcRequest {
    pub jsonrpc: String,
    pub method: String,
    pub params: Option<serde_json::Value>,
    pub id: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RpcResponse<T> {
    pub jsonrpc: String,
    pub id: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<RpcError>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RpcError {
    pub code: i32,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<serde_json::Value>,
}

