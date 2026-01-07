//! JSON-RPC server implementation using Axum.
//!
//! This module provides HTTP/JSON-RPC endpoints for interacting with the
//! Demiurge chain node. Supported methods:
//! - cgt_getChainInfo: Get current chain status
//! - cgt_getBlockByHeight: Get a block by height (stubbed for now)
//! - cgt_sendRawTransaction: Submit a transaction to the mempool
//! - cgt_getBalance: Get CGT balance by address
//! - cgt_isArchon: Check Archon status by address
//! - cgt_getNftsByOwner: Get NFTs owned by an address
//! - cgt_getListing: Get marketplace listing by ID
//! - cgt_getFabricAsset: Get Fabric asset by root hash

use std::sync::Arc;
use std::time::Duration;

use axum::{extract::Extension, routing::post, Json, Router};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tower_http::cors::{Any, CorsLayer};
use tower_http::timeout::TimeoutLayer;
use tower_http::limit::RequestBodyLimitLayer;

#[cfg(debug_assertions)]
use crate::config::DEV_FAUCET_AMOUNT;
use crate::core::transaction::{Address, Transaction};
use crate::node::Node;
use crate::runtime::{
    create_abyssid_profile, get_address_by_handle, get_address_by_username, get_abyssid_profile,
    record_syzygy, set_handle, set_username, BankCgtModule, CGT_DECIMALS,
    CGT_MAX_SUPPLY, CGT_NAME, CGT_SYMBOL, FabricRootHash, ListingId, NftDgenModule, NftId,
    RuntimeModule, get_all_developers, get_developer_by_username, get_developer_profile,
    get_project_maintainers, DeveloperProfile, create_capsule, get_capsule, list_capsules_by_owner,
    update_capsule_status, CapsuleStatus,
};
use crate::runtime::{
    create_world, get_world, list_worlds_by_owner,
};
use crate::runtime::work_claim::{calculate_reward, WorkClaimParams};
use crate::runtime::activity_log::{
    get_activity, get_activities_for_address, get_activity_stats, get_recent_activities,
    ActivityType,
};
use crate::runtime::cgt_staking::{
    get_stake_info, get_total_staked, get_staking_stats, calculate_pending_rewards,
};
use crate::runtime::treasury::{
    get_treasury_balance, get_treasury_stats, get_total_fees_collected,
    get_total_burned, get_total_validator_rewards, get_validator_rewards,
    calculate_fee, FEE_RATE_BPS, MIN_FEE, MAX_FEE,
    TREASURY_SHARE_BPS, BURN_SHARE_BPS, VALIDATOR_SHARE_BPS,
};
use crate::runtime::premium::{
    get_effective_tier, get_premium_status, get_stake_tier, get_subscription,
    can_use_storage, get_storage_used, PremiumTier,
    FREE_STORAGE, ARCHON_STORAGE, GENESIS_STORAGE,
    ARCHON_MONTHLY_COST, GENESIS_MONTHLY_COST,
    ARCHON_STAKE_REQUIREMENT, GENESIS_STAKE_REQUIREMENT,
};

/// JSON-RPC request envelope.
#[derive(Debug, Deserialize)]
pub struct JsonRpcRequest<T> {
    /// JSON-RPC version (should be "2.0").
    pub jsonrpc: String,
    /// Method name (e.g., "cgt_getChainInfo").
    pub method: String,
    /// Method parameters (can be null or an object).
    pub params: Option<T>,
    /// Request ID for matching responses.
    pub id: Option<Value>,
}

/// JSON-RPC response envelope.
#[derive(Debug, Serialize)]
pub struct JsonRpcResponse<R> {
    /// JSON-RPC version (should be "2.0").
    pub jsonrpc: String,
    /// Result value (null if error occurred).
    pub result: Option<R>,
    /// Error object (null if successful).
    pub error: Option<JsonRpcError>,
    /// Request ID matching the request.
    pub id: Option<Value>,
}

/// JSON-RPC error object.
#[derive(Debug, Serialize)]
pub struct JsonRpcError {
    /// Error code (standard JSON-RPC codes or custom).
    pub code: i32,
    /// Human-readable error message.
    pub message: String,
}

/// Request parameter structs for new methods

#[derive(Debug, Deserialize)]
pub struct GetBalanceParams {
    pub address: String, // hex string
}

#[derive(Debug, Deserialize)]
pub struct GetNonceParams {
    pub address: String, // hex string
}

#[derive(Debug, Deserialize)]
pub struct DevTransferParams {
    pub from: String, // hex string
    pub to: String,   // hex string
    pub amount: String, // amount in smallest units (u128 as string)
    pub fee: Option<u64>, // optional fee, defaults to 0
}

#[derive(Debug, Deserialize)]
pub struct BuildTransferTxParams {
    pub from: String,    // hex string
    pub to: String,       // hex string
    pub amount: String,   // amount in smallest units (u128 as string)
    pub nonce: u64,
    pub fee: Option<u64>, // optional fee, defaults to 0
}

#[derive(Debug, Deserialize)]
pub struct GetTxParams {
    pub tx_hash: String, // hex string
}

#[derive(Debug, Deserialize)]
pub struct GetTxHistoryParams {
    pub address: String, // hex string
    pub limit: Option<usize>, // optional limit, defaults to 50
}

#[derive(Debug, Deserialize)]
pub struct AbyssIDSetUsernameParams {
    pub address: String, // hex string
    pub username: String,
}

#[derive(Debug, Deserialize)]
pub struct AbyssIDResolveUsernameParams {
    pub username: String,
}

#[derive(Debug, Deserialize)]
pub struct AbyssIDGetProfileByUsernameParams {
    pub username: String,
}

#[derive(Debug, Deserialize)]
pub struct AbyssIDGetProgressParams {
    pub address: String, // hex string
}

#[derive(Debug, Deserialize)]
pub struct GetUserAnalyticsParams {
    pub address: String, // hex string
}

#[derive(Debug, Deserialize)]
pub struct CreateListingParams {
    pub token_id: u64,
    pub price_cgt: String, // string to handle large numbers
}

#[derive(Debug, Deserialize)]
pub struct CancelListingParams {
    pub listing_id: u64,
}

#[derive(Debug, Deserialize)]
pub struct BuyListingParams {
    pub listing_id: u64,
}

#[derive(Debug, Deserialize)]
pub struct SignTxParams {
    pub tx_hex: String,      // unsigned transaction hex
    pub signature: String,   // signature hex (64 bytes = 128 hex chars)
}

#[derive(Debug, Deserialize)]
pub struct IsArchonParams {
    pub address: String,
}

#[derive(Debug, Deserialize)]
pub struct GetNftsByOwnerParams {
    pub address: String,
}

#[derive(Debug, Deserialize)]
pub struct GetListingParams {
    pub listing_id: u64,
}

#[derive(Debug, Deserialize)]
pub struct GetFabricAssetParams {
    pub fabric_root_hash: String, // hex string
}

#[derive(Debug, Deserialize)]
pub struct RegisterDeveloperParams {
    pub address: String,
    pub username: String,
    pub signed_tx_hex: String,
}

#[derive(Debug, Deserialize)]
pub struct ClaimDevNftParams {
    pub address: String, // hex address
}

#[derive(Debug, Deserialize)]
pub struct GetDeveloperProfileParams {
    pub address: Option<String>,
    pub username: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AddProjectParams {
    pub address: String,
    pub project_slug: String,
    pub signed_tx_hex: String,
}

#[derive(Debug, Deserialize)]
pub struct GetProjectMaintainersParams {
    pub project_slug: String,
}

#[derive(Debug, Deserialize)]
pub struct DevCapsuleCreateParams {
    pub owner: String, // hex address
    pub project_slug: String,
    pub notes: String,
}

#[derive(Debug, Deserialize)]
pub struct DevCapsuleGetParams {
    pub id: u64,
}

#[derive(Debug, Deserialize)]
pub struct DevCapsuleListByOwnerParams {
    pub owner: String, // hex address
}

#[derive(Debug, Deserialize)]
pub struct DevCapsuleUpdateStatusParams {
    pub id: u64,
    pub status: String, // "draft" | "live" | "paused" | "archived"
}

#[derive(Debug, Deserialize)]
pub struct RecursionCreateWorldParams {
    pub owner: String, // hex address
    pub world_id: String,
    pub title: String,
    pub description: String,
    pub fabric_root_hash: String, // hex-encoded Fabric root hash
}

#[derive(Debug, Deserialize)]
pub struct RecursionGetWorldParams {
    pub world_id: String,
}

#[derive(Debug, Deserialize)]
pub struct RecursionListWorldsByOwnerParams {
    pub owner: String, // hex address
}

#[derive(Debug, Deserialize)]
pub struct SubmitWorkClaimParams {
    pub address: String, // hex string
    pub game_id: String,
    pub session_id: String,
    pub depth_metric: f64,
    pub active_ms: u64,
    pub extra: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct DevFaucetParams {
    pub address: String, // hex string
}

#[derive(Debug, Deserialize)]
pub struct MintDgenNftParams {
    pub owner: String, // hex string
    pub forge_model_id: Option<String>, // hex string (optional)
    pub forge_prompt_hash: Option<String>, // hex string (optional)
    pub fabric_root_hash: String, // hex string
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AbyssIDCreateParams {
    pub address: String, // hex string
    pub display_name: String,
    pub bio: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AbyssIDGetParams {
    pub address: String, // hex string
}

#[derive(Debug, Deserialize)]
pub struct AbyssIDRecordSyzygyParams {
    pub address: String, // hex string
    pub amount: u64,     // Syzygy contribution amount
}

#[derive(Debug, Deserialize)]
pub struct AbyssIDSetHandleParams {
    pub address: String, // hex string
    pub handle: String,  // handle without @
}

#[derive(Debug, Deserialize)]
pub struct AbyssIDGetByHandleParams {
    pub handle: String, // handle without @
}

/// Helper functions for parsing hex addresses and hashes

fn parse_address_hex(s: &str) -> Result<Address, String> {
    let bytes = hex::decode(s).map_err(|e| format!("invalid address hex: {}", e))?;
    if bytes.len() != 32 {
        return Err("address must be 32 bytes".into());
    }
    let mut addr = [0u8; 32];
    addr.copy_from_slice(&bytes);
    Ok(addr)
}

fn parse_root_hash_hex(s: &str) -> Result<FabricRootHash, String> {
    let bytes = hex::decode(s).map_err(|e| format!("invalid fabric_root_hash hex: {}", e))?;
    if bytes.len() != 32 {
        return Err("fabric_root_hash must be 32 bytes".into());
    }
    let mut root = [0u8; 32];
    root.copy_from_slice(&bytes);
    Ok(root)
}

/// Create the JSON-RPC router.
///
/// # Arguments
/// - `node`: Shared reference to the Node instance
///
/// # Returns
/// An Axum Router configured with the RPC endpoint and CORS support
pub fn rpc_router(node: Arc<Node>) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any)
        .max_age(Duration::from_secs(3600)); // Cache CORS preflight for 1 hour

    // Request timeout - 30 seconds for most operations
    let timeout = TimeoutLayer::new(Duration::from_secs(30));
    
    // Limit request body size to 1MB
    let body_limit = RequestBodyLimitLayer::new(1024 * 1024);

    Router::new()
        .route("/rpc", post(handle_rpc))
        .route("/health", axum::routing::get(health_check))
        .layer(cors)
        .layer(timeout)
        .layer(body_limit)
        .layer(Extension(node))
}

/// Health check endpoint for load balancers and monitoring
async fn health_check() -> &'static str {
    "OK"
}

/// Handle JSON-RPC requests.
///
/// This function dispatches requests to the appropriate handler based on
/// the method name. Unsupported methods return a "Method not found" error.
async fn handle_rpc(
    Extension(node): Extension<Arc<Node>>,
    Json(req): Json<JsonRpcRequest<Value>>,
) -> Json<JsonRpcResponse<Value>> {
    let id = req.id.clone();

    match req.method.as_str() {
        "cgt_getChainInfo" => {
            let info = node.chain_info();
            Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: Some(json!({ "height": info.height })),
                error: None,
                id,
            })
        }
        "cgt_getBalance" => {
            let params: GetBalanceParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(GetBalanceParams {
                        address: String::new(),
                    }),
                None => GetBalanceParams {
                    address: String::new(),
                },
            };

            match parse_address_hex(&params.address) {
                Ok(addr) => {
                    let balance = node.get_balance_cgt(&addr);
                    Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: Some(json!({ "balance": balance.to_string() })),
                        error: None,
                        id,
                    })
                }
                Err(msg) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: None,
                    error: Some(JsonRpcError {
                        code: -32602,
                        message: msg,
                    }),
                    id,
                }),
            }
        }
        "cgt_isArchon" => {
            let params: IsArchonParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(IsArchonParams {
                        address: String::new(),
                    }),
                None => IsArchonParams {
                    address: String::new(),
                },
            };

            match parse_address_hex(&params.address) {
                Ok(addr) => {
                    let flag = node.is_archon(&addr);
                    Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: Some(json!({ "is_archon": flag })),
                        error: None,
                        id,
                    })
                }
                Err(msg) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: None,
                    error: Some(JsonRpcError {
                        code: -32602,
                        message: msg,
                    }),
                    id,
                }),
            }
        }
        "cgt_getNftsByOwner" => {
            let params: GetNftsByOwnerParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(GetNftsByOwnerParams {
                        address: String::new(),
                    }),
                None => GetNftsByOwnerParams {
                    address: String::new(),
                },
            };

            match parse_address_hex(&params.address) {
                Ok(owner) => {
                    let ids: Vec<NftId> = node.get_nfts_by_owner(&owner);
                    // Fetch metadata for each
                    let nfts: Vec<Value> = ids
                        .into_iter()
                        .map(|id| {
                            if let Some(meta) = node.get_nft(id) {
                                json!({
                                    "id": id,
                                    "owner": hex::encode(meta.owner),
                                    "creator": hex::encode(meta.creator),
                                    "fabric_root_hash": hex::encode(meta.fabric_root_hash),
                                    "royalty_bps": meta.royalty_bps,
                                })
                            } else {
                                json!({ "id": id, "missing": true })
                            }
                        })
                        .collect();

                    Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: Some(json!({ "nfts": nfts })),
                        error: None,
                        id,
                    })
                }
                Err(msg) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: None,
                    error: Some(JsonRpcError {
                        code: -32602,
                        message: msg,
                    }),
                    id,
                }),
            }
        }
        "cgt_getListing" => {
            let params: GetListingParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(GetListingParams { listing_id: 0 }),
                None => GetListingParams { listing_id: 0 },
            };

            let listing_opt = node.get_listing(params.listing_id as ListingId);
            Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: Some(json!(listing_opt)),
                error: None,
                id,
            })
        }
        "cgt_getAllListings" => {
            let listings = node.get_all_active_listings();
            Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: Some(json!({ "listings": listings })),
                error: None,
                id,
            })
        }
        "cgt_buildCreateListingTx" => {
            let params: CreateListingParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(CreateListingParams {
                        token_id: 0,
                        price_cgt: "0".to_string(),
                    }),
                None => CreateListingParams {
                    token_id: 0,
                    price_cgt: "0".to_string(),
                },
            };

            let address = match req.params.as_ref().and_then(|p| p.get("from")) {
                Some(addr_val) => {
                    let addr_str = addr_val.as_str().unwrap_or("");
                    match parse_address_hex(addr_str) {
                        Ok(addr) => addr,
                        Err(e) => {
                            return Json(JsonRpcResponse {
                                jsonrpc: "2.0".to_string(),
                                result: None,
                                error: Some(JsonRpcError {
                                    code: -32602,
                                    message: format!("invalid address: {}", e),
                                }),
                                id,
                            });
                        }
                    }
                }
                None => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: "missing 'from' address".to_string(),
                        }),
                        id,
                    });
                }
            };

            let nonce = node.get_nonce(&address);
            let price_cgt = match params.price_cgt.parse::<u128>() {
                Ok(p) => p,
                Err(e) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: format!("invalid price: {}", e),
                        }),
                        id,
                    });
                }
            };

            use crate::runtime::abyss_registry::CreateListingParams as CreateParams;
            let create_params = CreateParams {
                token_id: params.token_id as NftId,
                price_cgt,
            };
            let payload = match bincode::serialize(&create_params) {
                Ok(p) => p,
                Err(e) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32603,
                            message: format!("serialization error: {}", e),
                        }),
                        id,
                    });
                }
            };

            let tx = Transaction {
                from: address,
                nonce,
                module_id: "abyss_registry".to_string(),
                call_id: "create_listing".to_string(),
                payload,
                fee: 1000, // Default fee
                signature: vec![],
            };

            let tx_hex = match bincode::serialize(&tx) {
                Ok(bytes) => hex::encode(bytes),
                Err(e) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32603,
                            message: format!("serialization error: {}", e),
                        }),
                        id,
                    });
                }
            };

            Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: Some(json!({ "tx_hex": tx_hex })),
                error: None,
                id,
            })
        }
        "cgt_buildCancelListingTx" => {
            let params: CancelListingParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(CancelListingParams { listing_id: 0 }),
                None => CancelListingParams { listing_id: 0 },
            };

            let address = match req.params.as_ref().and_then(|p| p.get("from")) {
                Some(addr_val) => {
                    let addr_str = addr_val.as_str().unwrap_or("");
                    match parse_address_hex(addr_str) {
                        Ok(addr) => addr,
                        Err(e) => {
                            return Json(JsonRpcResponse {
                                jsonrpc: "2.0".to_string(),
                                result: None,
                                error: Some(JsonRpcError {
                                    code: -32602,
                                    message: format!("invalid address: {}", e),
                                }),
                                id,
                            });
                        }
                    }
                }
                None => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: "missing 'from' address".to_string(),
                        }),
                        id,
                    });
                }
            };

            let nonce = node.get_nonce(&address);

            use crate::runtime::abyss_registry::CancelListingParams as CancelParams;
            let cancel_params = CancelParams {
                listing_id: params.listing_id as ListingId,
            };
            let payload = match bincode::serialize(&cancel_params) {
                Ok(p) => p,
                Err(e) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32603,
                            message: format!("serialization error: {}", e),
                        }),
                        id,
                    });
                }
            };

            let tx = Transaction {
                from: address,
                nonce,
                module_id: "abyss_registry".to_string(),
                call_id: "cancel_listing".to_string(),
                payload,
                fee: 1000,
                signature: vec![],
            };

            let tx_hex = match bincode::serialize(&tx) {
                Ok(bytes) => hex::encode(bytes),
                Err(e) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32603,
                            message: format!("serialization error: {}", e),
                        }),
                        id,
                    });
                }
            };

            Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: Some(json!({ "tx_hex": tx_hex })),
                error: None,
                id,
            })
        }
        "cgt_buildBuyListingTx" => {
            let params: BuyListingParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(BuyListingParams { listing_id: 0 }),
                None => BuyListingParams { listing_id: 0 },
            };

            let address = match req.params.as_ref().and_then(|p| p.get("from")) {
                Some(addr_val) => {
                    let addr_str = addr_val.as_str().unwrap_or("");
                    match parse_address_hex(addr_str) {
                        Ok(addr) => addr,
                        Err(e) => {
                            return Json(JsonRpcResponse {
                                jsonrpc: "2.0".to_string(),
                                result: None,
                                error: Some(JsonRpcError {
                                    code: -32602,
                                    message: format!("invalid address: {}", e),
                                }),
                                id,
                            });
                        }
                    }
                }
                None => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: "missing 'from' address".to_string(),
                        }),
                        id,
                    });
                }
            };

            let nonce = node.get_nonce(&address);

            use crate::runtime::abyss_registry::BuyListingParams as BuyParams;
            let buy_params = BuyParams {
                listing_id: params.listing_id as ListingId,
            };
            let payload = match bincode::serialize(&buy_params) {
                Ok(p) => p,
                Err(e) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32603,
                            message: format!("serialization error: {}", e),
                        }),
                        id,
                    });
                }
            };

            let tx = Transaction {
                from: address,
                nonce,
                module_id: "abyss_registry".to_string(),
                call_id: "buy_listing".to_string(),
                payload,
                fee: 1000,
                signature: vec![],
            };

            let tx_hex = match bincode::serialize(&tx) {
                Ok(bytes) => hex::encode(bytes),
                Err(e) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32603,
                            message: format!("serialization error: {}", e),
                        }),
                        id,
                    });
                }
            };

            Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: Some(json!({ "tx_hex": tx_hex })),
                error: None,
                id,
            })
        }
        "cgt_getFabricAsset" => {
            let params: GetFabricAssetParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(GetFabricAssetParams {
                        fabric_root_hash: String::new(),
                    }),
                None => GetFabricAssetParams {
                    fabric_root_hash: String::new(),
                },
            };

            match parse_root_hash_hex(&params.fabric_root_hash) {
                Ok(root) => {
                    let asset_opt = node.get_fabric_asset(&root);
                    Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: Some(json!(asset_opt)),
                        error: None,
                        id,
                    })
                }
                Err(msg) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: None,
                    error: Some(JsonRpcError {
                        code: -32602,
                        message: msg,
                    }),
                    id,
                }),
            }
        }
        "cgt_getBlockByHeight" => {
            let height = req
                .params
                .as_ref()
                .and_then(|p| p.get("height"))
                .and_then(|v| v.as_u64())
                .unwrap_or(0);

            let block = node.get_block_by_height(height);

            Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: Some(serde_json::to_value(block).unwrap_or(Value::Null)),
                error: None,
                id,
            })
        }
        "cgt_devFaucet" => {
            #[cfg(not(debug_assertions))]
            {
                return Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: None,
                    error: Some(JsonRpcError {
                        code: -32601,
                        message: "Dev faucet not available in release mode".to_string(),
                    }),
                    id,
                });
            }

            #[cfg(debug_assertions)]
            {
                let params: DevFaucetParams = match req.params.as_ref() {
                    Some(raw) => serde_json::from_value(raw.clone())
                        .map_err(|e| e.to_string())
                        .unwrap_or(DevFaucetParams {
                            address: String::new(),
                        }),
                    None => DevFaucetParams {
                        address: String::new(),
                    },
                };

                match parse_address_hex(&params.address) {
                    Ok(addr) => {
                        // Mint CGT directly via state mutation
                        let result: Result<u128, String> = node.with_state_mut(|state| {
                            let bank_module = BankCgtModule::new();
                            let mint_params = crate::runtime::bank_cgt::MintToParams {
                                to: addr,
                                amount: DEV_FAUCET_AMOUNT,
                            };
                            let mint_tx = Transaction {
                                from: [0u8; 32], // Genesis authority
                                nonce: 0,
                                module_id: "bank_cgt".to_string(),
                                call_id: "mint_to".to_string(),
                                payload: bincode::serialize(&mint_params)
                                    .map_err(|e| format!("serialization error: {}", e))?,
                                fee: 0,
                                signature: vec![],
                            };
                            bank_module
                                .dispatch("mint_to", &mint_tx, state)
                                .map_err(|e| format!("mint failed: {}", e))?;

                            // Get new balance
                            let balance = crate::runtime::bank_cgt::get_balance_cgt(state, &addr);
                            Ok(balance)
                        });

                        match result {
                            Ok(new_balance) => Json(JsonRpcResponse {
                                jsonrpc: "2.0".to_string(),
                                result: Some(json!({
                                    "ok": true,
                                    "new_balance": new_balance.to_string()
                                })),
                                error: None,
                                id,
                            }),
                            Err(msg) => Json(JsonRpcResponse {
                                jsonrpc: "2.0".to_string(),
                                result: None,
                                error: Some(JsonRpcError {
                                    code: -32603,
                                    message: format!("Faucet error: {}", msg),
                                }),
                                id,
                            }),
                        }
                    }
                    Err(msg) => Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: msg,
                        }),
                        id,
                    }),
                }
            }
        }
        "cgt_mintDgenNft" => {
            let params: MintDgenNftParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(MintDgenNftParams {
                        owner: String::new(),
                        forge_model_id: None,
                        forge_prompt_hash: None,
                        fabric_root_hash: String::new(),
                        name: String::new(),
                        description: None,
                    }),
                None => MintDgenNftParams {
                    owner: String::new(),
                    forge_model_id: None,
                    forge_prompt_hash: None,
                    fabric_root_hash: String::new(),
                    name: String::new(),
                    description: None,
                },
            };

            let owner_addr = match parse_address_hex(&params.owner) {
                Ok(addr) => addr,
                Err(msg) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: format!("invalid owner address: {}", msg),
                        }),
                        id,
                    });
                }
            };

            let fabric_hash = match parse_address_hex(&params.fabric_root_hash) {
                Ok(hash) => hash,
                Err(msg) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: format!("invalid fabric_root_hash: {}", msg),
                        }),
                        id,
                    });
                }
            };

            let forge_model_id = match params
                .forge_model_id
                .as_ref()
                .map(|s| parse_address_hex(s))
                .transpose()
            {
                Ok(Some(hash)) => Some(hash),
                Ok(None) => None,
                Err(e) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: format!("invalid forge_model_id: {}", e),
                        }),
                        id,
                    });
                }
            };

            let forge_prompt_hash = match params
                .forge_prompt_hash
                .as_ref()
                .map(|s| parse_address_hex(s))
                .transpose()
            {
                Ok(Some(hash)) => Some(hash),
                Ok(None) => None,
                Err(e) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: format!("invalid forge_prompt_hash: {}", e),
                        }),
                        id,
                    });
                }
            };

            // For dev mode, we'll use Genesis Archon as the signer if owner is Genesis Archon
            // Otherwise, we'll bypass signature checks and mint directly
            let result = node.with_state_mut(|state| {
                // Check if owner is Archon (required for minting)
                if !crate::runtime::abyssid_registry::is_archon(state, &owner_addr) {
                    return Err("only Archons may mint D-GEN NFTs".to_string());
                }

                let nft_module = NftDgenModule::new();
                let mint_params = crate::runtime::nft_dgen::MintDgenParams {
                    fabric_root_hash: fabric_hash,
                    forge_model_id,
                    forge_prompt_hash,
                    royalty_recipient: None,
                    royalty_bps: 0,
                };

                let mint_tx = Transaction {
                    from: owner_addr,
                    nonce: 0, // For dev, we skip nonce checks
                    module_id: "nft_dgen".to_string(),
                    call_id: "mint_dgen".to_string(),
                    payload: bincode::serialize(&mint_params)
                        .map_err(|e| format!("serialization error: {}", e))?,
                    fee: 0,
                    signature: vec![],
                };

                nft_module
                    .dispatch("mint_dgen", &mint_tx, state)
                    .map_err(|e| format!("mint failed: {}", e))?;

                // Get the newly minted NFT ID (it will be the current counter - 1)
                let nft_ids = crate::runtime::nft_dgen::get_nfts_by_owner(state, &owner_addr);
                let nft_id = nft_ids.last().copied().ok_or("NFT not found after minting")?;
                let nft_meta = crate::runtime::nft_dgen::get_nft(state, nft_id)
                    .ok_or("NFT metadata not found")?;

                Ok((nft_id, nft_meta))
            });

            match result {
                Ok((nft_id, nft_meta)) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: Some(json!({
                        "nft_id": nft_id,
                        "owner": hex::encode(nft_meta.owner),
                        "fabric_root_hash": hex::encode(nft_meta.fabric_root_hash),
                        "forge_model_id": nft_meta.forge_model_id.map(hex::encode),
                        "forge_prompt_hash": nft_meta.forge_prompt_hash.map(hex::encode),
                    })),
                    error: None,
                    id,
                }),
                Err(msg) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: None,
                    error: Some(JsonRpcError {
                        code: -32603,
                        message: format!("Mint error: {}", msg),
                    }),
                    id,
                }),
            }
        }
        "abyssid_create" => {
            let params: AbyssIDCreateParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(AbyssIDCreateParams {
                        address: String::new(),
                        display_name: String::new(),
                        bio: None,
                    }),
                None => AbyssIDCreateParams {
                    address: String::new(),
                    display_name: String::new(),
                    bio: None,
                },
            };

            let address = match parse_address_hex(&params.address) {
                Ok(addr) => addr,
                Err(msg) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: format!("invalid address: {}", msg),
                        }),
                        id,
                    });
                }
            };

            let current_height = node.chain_info().height;

            let result = node.with_state_mut(|state| {
                create_abyssid_profile(state, address, params.display_name, params.bio, current_height)
            });

            match result {
                Ok(profile) => {
                    // In dev mode, optionally mint starter CGT
                    #[cfg(debug_assertions)]
                    {
                        let _ = node.with_state_mut(|state| {
                            let bank_module = BankCgtModule::new();
                            let mint_params = crate::runtime::bank_cgt::MintToParams {
                                to: address,
                                amount: 1_000, // Small starter allowance
                            };
                            let mint_tx = Transaction {
                                from: [0u8; 32],
                                nonce: 0,
                                module_id: "bank_cgt".to_string(),
                                call_id: "mint_to".to_string(),
                                payload: bincode::serialize(&mint_params)
                                    .map_err(|e| format!("serialization error: {}", e))?,
                                fee: 0,
                                signature: vec![],
                            };
                            bank_module.dispatch("mint_to", &mint_tx, state)
                        });
                    }

                    Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: Some(json!({
                            "address": hex::encode(profile.address),
                            "display_name": profile.display_name,
                            "bio": profile.bio,
                            "handle": profile.handle,
                            "username": profile.username,
                            "level": profile.level,
                            "syzygy_score": profile.syzygy_score,
                            "total_cgt_earned_from_rewards": profile.total_cgt_earned_from_rewards.to_string(),
                            "badges": profile.badges,
                            "created_at_height": profile.created_at_height,
                        })),
                        error: None,
                        id,
                    })
                }
                Err(msg) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: None,
                    error: Some(JsonRpcError {
                        code: -32603,
                        message: format!("Failed to create AbyssID profile: {}", msg),
                    }),
                    id,
                }),
            }
        }
        "abyssid_get" => {
            let params: AbyssIDGetParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(AbyssIDGetParams {
                        address: String::new(),
                    }),
                None => AbyssIDGetParams {
                    address: String::new(),
                },
            };

            let address = match parse_address_hex(&params.address) {
                Ok(addr) => addr,
                Err(msg) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: format!("invalid address: {}", msg),
                        }),
                        id,
                    });
                }
            };

            let profile_opt = node.with_state(|state| get_abyssid_profile(state, &address));

            Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: Some(match profile_opt {
                    Some(profile) => json!({
                        "address": hex::encode(profile.address),
                        "display_name": profile.display_name,
                        "bio": profile.bio,
                        "handle": profile.handle,
                        "username": profile.username,
                        "level": profile.level,
                        "syzygy_score": profile.syzygy_score,
                        "total_cgt_earned_from_rewards": profile.total_cgt_earned_from_rewards.to_string(),
                        "badges": profile.badges,
                        "created_at_height": profile.created_at_height,
                    }),
                    None => serde_json::Value::Null,
                }),
                error: None,
                id,
            })
        }
        "abyssid_recordSyzygy" => {
            let params: AbyssIDRecordSyzygyParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(AbyssIDRecordSyzygyParams {
                        address: String::new(),
                        amount: 0,
                    }),
                None => AbyssIDRecordSyzygyParams {
                    address: String::new(),
                    amount: 0,
                },
            };

            let address = match parse_address_hex(&params.address) {
                Ok(addr) => addr,
                Err(msg) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: format!("invalid address: {}", msg),
                        }),
                        id,
                    });
                }
            };

            let result = node.with_state_mut(|state| {
                record_syzygy(state, address, params.amount)
            });

            match result {
                Ok(profile) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: Some(json!({
                        "address": hex::encode(profile.address),
                        "level": profile.level,
                        "syzygy_score": profile.syzygy_score,
                        "total_cgt_earned_from_rewards": profile.total_cgt_earned_from_rewards.to_string(),
                        "badges": profile.badges,
                    })),
                    error: None,
                    id,
                }),
                Err(msg) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: None,
                    error: Some(JsonRpcError {
                        code: -32603,
                        message: format!("Failed to record Syzygy: {}", msg),
                    }),
                    id,
                }),
            }
        }
        "abyssid_setHandle" => {
            let params: AbyssIDSetHandleParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(AbyssIDSetHandleParams {
                        address: String::new(),
                        handle: String::new(),
                    }),
                None => AbyssIDSetHandleParams {
                    address: String::new(),
                    handle: String::new(),
                },
            };

            let address = match parse_address_hex(&params.address) {
                Ok(addr) => addr,
                Err(msg) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: format!("invalid address: {}", msg),
                        }),
                        id,
                    });
                }
            };

            let result = node.with_state_mut(|state| {
                set_handle(state, address, params.handle)
            });

            match result {
                Ok(profile) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: Some(json!({
                        "address": hex::encode(profile.address),
                        "display_name": profile.display_name,
                        "bio": profile.bio,
                        "handle": profile.handle,
                        "username": profile.username,
                        "level": profile.level,
                        "syzygy_score": profile.syzygy_score,
                        "total_cgt_earned_from_rewards": profile.total_cgt_earned_from_rewards.to_string(),
                        "badges": profile.badges,
                        "created_at_height": profile.created_at_height,
                    })),
                    error: None,
                    id,
                }),
                Err(msg) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: None,
                    error: Some(JsonRpcError {
                        code: -32603,
                        message: format!("Failed to set handle: {}", msg),
                    }),
                    id,
                }),
            }
        }
        "abyssid_getByHandle" => {
            let params: AbyssIDGetByHandleParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(AbyssIDGetByHandleParams {
                        handle: String::new(),
                    }),
                None => AbyssIDGetByHandleParams {
                    handle: String::new(),
                },
            };

            // Normalize handle (lowercase, trim)
            let normalized = params.handle.trim().to_lowercase();

            let address_opt = node.with_state(|state| {
                get_address_by_handle(state, &normalized)
            });

            match address_opt {
                Some(addr) => {
                    let profile_opt = node.with_state(|state| get_abyssid_profile(state, &addr));
                    match profile_opt {
                        Some(profile) => Json(JsonRpcResponse {
                            jsonrpc: "2.0".to_string(),
                            result: Some(json!({
                                "address": hex::encode(profile.address),
                                "display_name": profile.display_name,
                                "bio": profile.bio,
                                "handle": profile.handle,
                                "username": profile.username,
                                "level": profile.level,
                                "syzygy_score": profile.syzygy_score,
                                "total_cgt_earned_from_rewards": profile.total_cgt_earned_from_rewards.to_string(),
                                "badges": profile.badges,
                                "created_at_height": profile.created_at_height,
                            })),
                            error: None,
                            id,
                        }),
                        None => Json(JsonRpcResponse {
                            jsonrpc: "2.0".to_string(),
                            result: Some(serde_json::Value::Null),
                            error: None,
                            id,
                        }),
                    }
                }
                None => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: Some(serde_json::Value::Null),
                    error: None,
                    id,
                }),
            }
        }
        "abyssid_setUsername" => {
            let params: AbyssIDSetUsernameParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(AbyssIDSetUsernameParams {
                        address: String::new(),
                        username: String::new(),
                    }),
                None => AbyssIDSetUsernameParams {
                    address: String::new(),
                    username: String::new(),
                },
            };

            let address = match parse_address_hex(&params.address) {
                Ok(addr) => addr,
                Err(msg) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: format!("invalid address: {}", msg),
                        }),
                        id,
                    });
                }
            };

            let result = node.with_state_mut(|state| {
                set_username(state, &address, &params.username)
            });

            match result {
                Ok(()) => {
                    // Reload profile to return updated state
                    let profile_opt = node.with_state(|state| get_abyssid_profile(state, &address));
                    match profile_opt {
                        Some(profile) => Json(JsonRpcResponse {
                            jsonrpc: "2.0".to_string(),
                            result: Some(json!({
                                "address": hex::encode(profile.address),
                                "username": profile.username,
                            })),
                            error: None,
                            id,
                        }),
                        None => Json(JsonRpcResponse {
                            jsonrpc: "2.0".to_string(),
                            result: None,
                            error: Some(JsonRpcError {
                                code: -32603,
                                message: "Profile not found after setting username".to_string(),
                            }),
                            id,
                        }),
                    }
                }
                Err(msg) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: None,
                    error: Some(JsonRpcError {
                        code: -32603,
                        message: format!("Failed to set username: {}", msg),
                    }),
                    id,
                }),
            }
        }
        "abyssid_resolveUsername" => {
            let params: AbyssIDResolveUsernameParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(AbyssIDResolveUsernameParams {
                        username: String::new(),
                    }),
                None => AbyssIDResolveUsernameParams {
                    username: String::new(),
                },
            };

            let address_opt = node.with_state(|state| {
                get_address_by_username(state, &params.username)
            });

            match address_opt {
                Ok(Some(addr)) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: Some(json!({
                        "address": hex::encode(addr),
                    })),
                    error: None,
                    id,
                }),
                Ok(None) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: None,
                    error: Some(JsonRpcError {
                        code: -32602,
                        message: "Username not found".to_string(),
                    }),
                    id,
                }),
                Err(msg) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: None,
                    error: Some(JsonRpcError {
                        code: -32602,
                        message: format!("Invalid username: {}", msg),
                    }),
                    id,
                }),
            }
        }
        "abyssid_getProfileByUsername" => {
            let params: AbyssIDGetProfileByUsernameParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(AbyssIDGetProfileByUsernameParams {
                        username: String::new(),
                    }),
                None => AbyssIDGetProfileByUsernameParams {
                    username: String::new(),
                },
            };

            let address_opt = node.with_state(|state| {
                get_address_by_username(state, &params.username)
            });

            match address_opt {
                Ok(Some(addr)) => {
                    let profile_opt = node.with_state(|state| get_abyssid_profile(state, &addr));
                    match profile_opt {
                        Some(profile) => Json(JsonRpcResponse {
                            jsonrpc: "2.0".to_string(),
                            result: Some(json!({
                                "address": hex::encode(profile.address),
                                "display_name": profile.display_name,
                                "bio": profile.bio,
                                "handle": profile.handle,
                                "username": profile.username,
                                "level": profile.level,
                                "syzygy_score": profile.syzygy_score,
                                "total_cgt_earned_from_rewards": profile.total_cgt_earned_from_rewards.to_string(),
                                "badges": profile.badges,
                                "created_at_height": profile.created_at_height,
                            })),
                            error: None,
                            id,
                        }),
                        None => Json(JsonRpcResponse {
                            jsonrpc: "2.0".to_string(),
                            result: Some(serde_json::Value::Null),
                            error: None,
                            id,
                        }),
                    }
                }
                Ok(None) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: Some(serde_json::Value::Null),
                    error: None,
                    id,
                }),
                Err(msg) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: None,
                    error: Some(JsonRpcError {
                        code: -32602,
                        message: format!("Invalid username: {}", msg),
                    }),
                    id,
                }),
            }
        }
        "abyssid_getProgress" => {
            let params: AbyssIDGetProgressParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(AbyssIDGetProgressParams {
                        address: String::new(),
                    }),
                None => AbyssIDGetProgressParams {
                    address: String::new(),
                },
            };

            let address = match parse_address_hex(&params.address) {
                Ok(addr) => addr,
                Err(msg) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: format!("invalid address: {}", msg),
                        }),
                        id,
                    });
                }
            };

            let profile_opt = node.with_state(|state| get_abyssid_profile(state, &address));
            match profile_opt {
                Some(profile) => {
                    use crate::runtime::abyssid_registry::level_threshold;
                    
                    let current_level = profile.level;
                    let current_threshold = level_threshold(current_level);
                    let next_threshold = level_threshold(current_level + 1);
                    let syzygy_score = profile.syzygy_score;
                    
                    // Calculate progress ratio (0.0 to 1.0)
                    let progress_denominator = next_threshold.saturating_sub(current_threshold);
                    let progress_numerator = syzygy_score.saturating_sub(current_threshold);
                    let progress_ratio = if progress_denominator > 0 {
                        progress_numerator as f64 / progress_denominator as f64
                    } else {
                        0.0
                    };
                    
                    Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: Some(json!({
                            "address": hex::encode(profile.address),
                            "level": profile.level,
                            "syzygyScore": profile.syzygy_score,
                            "currentLevelThreshold": current_threshold,
                            "nextLevelThreshold": next_threshold,
                            "progressRatio": progress_ratio,
                            "totalCgtEarnedFromRewards": profile.total_cgt_earned_from_rewards.to_string(),
                        })),
                        error: None,
                        id,
                    })
                }
                None => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: None,
                    error: Some(JsonRpcError {
                        code: -32602,
                        message: "AbyssID profile not found".to_string(),
                    }),
                    id,
                }),
            }
        }
        "cgt_sendRawTransaction" => {
            let tx_hex = req
                .params
                .as_ref()
                .and_then(|p| p.get("tx"))
                .and_then(|v| v.as_str())
                .unwrap_or("");

            let bytes = match hex::decode(tx_hex) {
                Ok(b) => b,
                Err(e) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602, // Invalid params
                            message: format!("invalid tx hex: {}", e),
                        }),
                        id,
                    })
                }
            };

            let tx = match crate::core::transaction::Transaction::from_bytes(&bytes) {
                Ok(tx) => tx,
                Err(e) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602, // Invalid params
                            message: format!("invalid tx encoding: {}", e),
                        }),
                        id,
                    })
                }
            };

            match node.submit_transaction(tx) {
                Ok(tx_hash) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: Some(json!({ "accepted": true, "tx_hash": tx_hash })),
                    error: None,
                    id,
                }),
                Err(msg) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: None,
                    error: Some(JsonRpcError {
                        code: -32603,
                        message: msg,
                    }),
                    id,
                }),
            }
        }
        "cgt_getMetadata" => {
            let total_supply = node.get_cgt_total_supply();
            Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: Some(json!({
                    "name": CGT_NAME,
                    "symbol": CGT_SYMBOL,
                    "decimals": CGT_DECIMALS,
                    "maxSupply": CGT_MAX_SUPPLY.to_string(),
                    "totalSupply": total_supply.to_string(),
                })),
                error: None,
                id,
            })
        }
        "cgt_getTotalSupply" => {
            let total_supply = node.get_cgt_total_supply();
            Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: Some(json!({
                    "totalSupply": total_supply.to_string(),
                })),
                error: None,
                id,
            })
        }
        "cgt_getNonce" => {
            let params: GetNonceParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(GetNonceParams {
                        address: String::new(),
                    }),
                None => GetNonceParams {
                    address: String::new(),
                },
            };

            match parse_address_hex(&params.address) {
                Ok(addr) => {
                    let nonce = node.get_nonce(&addr);
                    Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: Some(json!({ "nonce": nonce })),
                        error: None,
                        id,
                    })
                }
                Err(msg) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: None,
                    error: Some(JsonRpcError {
                        code: -32602,
                        message: msg,
                    }),
                    id,
                }),
            }
        }
        "cgt_devUnsafeTransfer" => {
            // Dev-only: unsafe transfer without signature verification
            #[cfg(not(debug_assertions))]
            {
                Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: None,
                    error: Some(JsonRpcError {
                        code: -32601,
                        message: "cgt_devUnsafeTransfer is only available in debug builds".to_string(),
                    }),
                    id,
                })
            }
            #[cfg(debug_assertions)]
            {
                let params: DevTransferParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(DevTransferParams {
                        from: String::new(),
                        to: String::new(),
                        amount: String::new(),
                        fee: Some(0),
                    }),
                None => DevTransferParams {
                    from: String::new(),
                    to: String::new(),
                    amount: String::new(),
                    fee: Some(0),
                },
            };

            let from_addr = match parse_address_hex(&params.from) {
                Ok(addr) => addr,
                Err(msg) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: format!("invalid 'from' address: {}", msg),
                        }),
                        id,
                    });
                }
            };

            let to_addr = match parse_address_hex(&params.to) {
                Ok(addr) => addr,
                Err(msg) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: format!("invalid 'to' address: {}", msg),
                        }),
                        id,
                    });
                }
            };

            let amount = match params.amount.parse::<u128>() {
                Ok(a) => a,
                Err(e) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: format!("invalid amount: {}", e),
                        }),
                        id,
                    });
                }
            };

            let fee = params.fee.unwrap_or(0) as u128;

            let result: Result<(u128, u128), String> = node.with_state_mut(|state| {
                use crate::runtime::bank_cgt::{get_balance_cgt, set_balance_for_module, get_nonce_cgt, set_nonce_cgt};

                // Get nonce
                let current_nonce = get_nonce_cgt(state, &from_addr);
                
                // Check balance
                let from_balance = get_balance_cgt(state, &from_addr);
                let total = amount.checked_add(fee).ok_or_else(|| "overflow".to_string())?;
                
                if from_balance < total {
                    return Err("insufficient balance for amount + fee".to_string());
                }

                // Get recipient balance
                let to_balance = get_balance_cgt(state, &to_addr);

                // Update balances
                let new_from_balance = from_balance - total;
                let new_to_balance = to_balance
                    .checked_add(amount)
                    .ok_or_else(|| "overflow on recipient".to_string())?;

                set_balance_for_module(state, &from_addr, new_from_balance)?;
                set_balance_for_module(state, &to_addr, new_to_balance)?;
                set_nonce_cgt(state, &from_addr, current_nonce + 1)?;

                Ok((new_from_balance, new_to_balance))
            });

            match result {
                Ok((from_balance, to_balance)) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: Some(json!({
                        "ok": true,
                        "from_balance": from_balance.to_string(),
                        "to_balance": to_balance.to_string(),
                    })),
                    error: None,
                    id,
                }),
                Err(msg) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: None,
                    error: Some(JsonRpcError {
                        code: -32603,
                        message: format!("Transfer failed: {}", msg),
                    }),
                    id,
                }),
            }
            }
        }
        "cgt_buildTransferTx" => {
            // Helper to build and serialize a transfer transaction
            let params: BuildTransferTxParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(BuildTransferTxParams {
                        from: String::new(),
                        to: String::new(),
                        amount: String::new(),
                        nonce: 0,
                        fee: Some(0),
                    }),
                None => BuildTransferTxParams {
                    from: String::new(),
                    to: String::new(),
                    amount: String::new(),
                    nonce: 0,
                    fee: Some(0),
                },
            };

            let from_addr = match parse_address_hex(&params.from) {
                Ok(addr) => addr,
                Err(msg) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: format!("invalid 'from' address: {}", msg),
                        }),
                        id,
                    });
                }
            };

            let to_addr = match parse_address_hex(&params.to) {
                Ok(addr) => addr,
                Err(msg) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: format!("invalid 'to' address: {}", msg),
                        }),
                        id,
                    });
                }
            };

            let amount = match params.amount.parse::<u128>() {
                Ok(a) => a,
                Err(e) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: format!("invalid amount: {}", e),
                        }),
                        id,
                    });
                }
            };

            let fee = params.fee.unwrap_or(0);

            // Build transfer params
            use crate::runtime::bank_cgt::TransferParams;
            let transfer_params = TransferParams {
                to: to_addr,
                amount,
            };

            // Serialize payload
            let payload = match bincode::serialize(&transfer_params) {
                Ok(p) => p,
                Err(e) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32603,
                            message: format!("failed to serialize payload: {}", e),
                        }),
                        id,
                    });
                }
            };

            // Build transaction (signature will be added client-side)
            // For now, we return unsigned transaction
            // Client will decode, add signature, re-encode
            let tx = crate::core::transaction::Transaction {
                from: from_addr,
                nonce: params.nonce,
                module_id: "bank_cgt".to_string(),
                call_id: "transfer".to_string(),
                payload,
                fee,
                signature: vec![], // Client will sign and add this
            };

            // Serialize transaction to bytes
            let tx_bytes = match tx.to_bytes() {
                Ok(b) => b,
                Err(e) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32603,
                            message: format!("failed to serialize transaction: {}", e),
                        }),
                        id,
                    });
                }
            };

            // Return hex-encoded transaction
            Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: Some(json!({
                    "tx_hex": hex::encode(&tx_bytes),
                })),
                error: None,
                id,
            })
        }
        "cgt_signTransaction" => {
            // Attach signature to an unsigned transaction
            let params: SignTxParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(SignTxParams {
                        tx_hex: String::new(),
                        signature: String::new(),
                    }),
                None => SignTxParams {
                    tx_hex: String::new(),
                    signature: String::new(),
                },
            };

            // Decode unsigned transaction from hex
            let tx_bytes = match hex::decode(&params.tx_hex) {
                Ok(b) => b,
                Err(e) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: format!("invalid tx_hex: {}", e),
                        }),
                        id,
                    });
                }
            };

            let mut tx = match Transaction::from_bytes(&tx_bytes) {
                Ok(t) => t,
                Err(e) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: format!("failed to deserialize transaction: {}", e),
                        }),
                        id,
                    });
                }
            };

            // Decode signature from hex (should be 64 bytes = 128 hex chars)
            let signature_bytes = match hex::decode(&params.signature) {
                Ok(b) => {
                    if b.len() != 64 {
                        return Json(JsonRpcResponse {
                            jsonrpc: "2.0".to_string(),
                            result: None,
                            error: Some(JsonRpcError {
                                code: -32602,
                                message: format!("signature must be 64 bytes (got {} bytes)", b.len()),
                            }),
                            id,
                        });
                    }
                    b
                }
                Err(e) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: format!("invalid signature hex: {}", e),
                        }),
                        id,
                    });
                }
            };

            // Attach signature to transaction
            tx.signature = signature_bytes;

            // Re-serialize signed transaction
            let signed_tx_bytes = match tx.to_bytes() {
                Ok(b) => b,
                Err(e) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32603,
                            message: format!("failed to serialize signed transaction: {}", e),
                        }),
                        id,
                    });
                }
            };

            // Return hex-encoded signed transaction
            Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: Some(json!({
                    "tx_hex": hex::encode(&signed_tx_bytes),
                })),
                error: None,
                id,
            })
        }
        "cgt_getTransactionHistory" => {
            let params: GetTxHistoryParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(GetTxHistoryParams {
                        address: String::new(),
                        limit: Some(50),
                    }),
                None => GetTxHistoryParams {
                    address: String::new(),
                    limit: Some(50),
                },
            };

            let address = match parse_address_hex(&params.address) {
                Ok(addr) => addr,
                Err(msg) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: format!("invalid address: {}", msg),
                        }),
                        id,
                    });
                }
            };

            let limit = params.limit.unwrap_or(50);
            let tx_hashes = node.get_transactions_for_address(&address, limit);

            Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: Some(json!({
                    "transactions": tx_hashes,
                })),
                error: None,
                id,
            })
        }
        "abyssid_getAnalytics" => {
            let params: GetUserAnalyticsParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(GetUserAnalyticsParams {
                        address: String::new(),
                    }),
                None => GetUserAnalyticsParams {
                    address: String::new(),
                },
            };

            let address = match parse_address_hex(&params.address) {
                Ok(addr) => addr,
                Err(msg) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: format!("invalid address: {}", msg),
                        }),
                        id,
                    });
                }
            };

            // Get profile for basic stats
            let profile_opt = node.with_state(|state| get_abyssid_profile(state, &address));
            
            // Get transaction history
            let tx_hashes = node.get_transactions_for_address(&address, 1000);
            let total_transactions = tx_hashes.len();
            
            // Get balance
            let balance = node.get_balance_cgt(&address);
            
            // Get NFTs
            let nfts = node.get_nfts_by_owner(&address);
            let total_nfts = nfts.len();
            
            // Check if Archon
            let is_archon = node.is_archon(&address);
            
            // Calculate CGT volume (simplified - count transactions as activity)
            // In production, decode payloads to get actual transfer amounts
            let cgt_volume = 0u128; // TODO: Calculate from transaction payloads
            
            match profile_opt {
                Some(profile) => {
                    Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: Some(json!({
                            "address": hex::encode(profile.address),
                            "level": profile.level,
                            "syzygyScore": profile.syzygy_score,
                            "totalCgtEarnedFromRewards": profile.total_cgt_earned_from_rewards.to_string(),
                            "badges": profile.badges,
                            "balance": balance.to_string(),
                            "totalTransactions": total_transactions,
                            "totalNfts": total_nfts,
                            "isArchon": is_archon,
                            "cgtVolume": cgt_volume.to_string(),
                            "createdAtHeight": profile.created_at_height,
                        })),
                        error: None,
                        id,
                    })
                }
                None => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: Some(json!({
                        "address": hex::encode(address),
                        "level": 0,
                        "syzygyScore": 0,
                        "totalCgtEarnedFromRewards": "0",
                        "badges": [],
                        "balance": balance.to_string(),
                        "totalTransactions": total_transactions,
                        "totalNfts": total_nfts,
                        "isArchon": is_archon,
                        "cgtVolume": cgt_volume.to_string(),
                        "createdAtHeight": null,
                    })),
                    error: None,
                    id,
                }),
            }
        }
        "dev_registerDeveloper" => {
            let params: RegisterDeveloperParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(RegisterDeveloperParams {
                        address: String::new(),
                        username: String::new(),
                        signed_tx_hex: String::new(),
                    }),
                None => RegisterDeveloperParams {
                    address: String::new(),
                    username: String::new(),
                    signed_tx_hex: String::new(),
                },
            };

            let address = match parse_address_hex(&params.address) {
                Ok(addr) => addr,
                Err(msg) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: format!("invalid address: {}", msg),
                        }),
                        id,
                    });
                }
            };

            // TODO: Verify signed transaction
            // For now, just register directly
            let result = node.with_state_mut(|state| {
                crate::runtime::register_developer(address, params.username, 0, state)
            });

            match result {
                Ok(_) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: Some(json!({ "ok": true })),
                    error: None,
                    id,
                }),
                Err(msg) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: None,
                    error: Some(JsonRpcError {
                        code: -32000,
                        message: msg,
                    }),
                    id,
                }),
            }
        }
        "dev_claimDevNft" => {
            let params: ClaimDevNftParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(ClaimDevNftParams {
                        address: String::new(),
                    }),
                None => ClaimDevNftParams {
                    address: String::new(),
                },
            };

            let address = match parse_address_hex(&params.address) {
                Ok(addr) => addr,
                Err(msg) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: format!("invalid address: {}", msg),
                        }),
                        id,
                    });
                }
            };

            // Claim DEV NFT by dispatching to developer_registry module
            let result = node.with_state_mut(|state| {
                use crate::core::transaction::Transaction;
                let dev_module = crate::runtime::DeveloperRegistryModule::new();
                let tx = Transaction {
                    from: address,
                    nonce: 0,
                    module_id: "developer_registry".to_string(),
                    call_id: "claim_dev_nft".to_string(),
                    payload: vec![],
                    fee: 0,
                    signature: vec![],
                };
                dev_module.dispatch("claim_dev_nft", &tx, state)
            });

            match result {
                Ok(_) => {
                    // Get the minted NFT ID by checking owner's NFTs
                    let nft_id = node.with_state(|state| {
                        use crate::runtime::nft_dgen::{get_nfts_by_owner, get_nft, FABRIC_ROOT_DEV_BADGE};
                        let owner_nfts = get_nfts_by_owner(state, &address);
                        // Find the DEV Badge NFT
                        for id in owner_nfts {
                            if let Some(nft) = get_nft(state, id) {
                                if nft.fabric_root_hash == FABRIC_ROOT_DEV_BADGE {
                                    return Some(id);
                                }
                            }
                        }
                        None
                    });

                    Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: Some(json!({
                            "ok": true,
                            "nft_id": nft_id,
                        })),
                        error: None,
                        id,
                    })
                }
                Err(msg) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: None,
                    error: Some(JsonRpcError {
                        code: -32000,
                        message: msg,
                    }),
                    id,
                }),
            }
        }
        "dev_getDeveloperProfile" => {
            let params: GetDeveloperProfileParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(GetDeveloperProfileParams {
                        address: None,
                        username: None,
                    }),
                None => GetDeveloperProfileParams {
                    address: None,
                    username: None,
                },
            };

            let profile_opt = if let Some(addr_str) = params.address {
                let address = match parse_address_hex(&addr_str) {
                    Ok(addr) => addr,
                    Err(_) => {
                        return Json(JsonRpcResponse {
                            jsonrpc: "2.0".to_string(),
                            result: Some(serde_json::Value::Null),
                            error: None,
                            id,
                        });
                    }
                };
                node.with_state(|state| get_developer_profile(&address, state))
            } else if let Some(username) = params.username {
                node.with_state(|state| {
                    get_developer_by_username(&username, state)
                        .and_then(|addr| get_developer_profile(&addr, state))
                })
            } else {
                None
            };

            match profile_opt {
                Some(profile) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: Some(json!({
                        "address": hex::encode(profile.address),
                        "username": profile.username,
                        "projects": profile.projects,
                        "reputation": profile.reputation,
                        "created_at": profile.created_at,
                    })),
                    error: None,
                    id,
                }),
                None => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: Some(serde_json::Value::Null),
                    error: None,
                    id,
                }),
            }
        }
        "dev_getDevelopers" => {
            let developers = node.with_state(|state| get_all_developers(state));
            let profiles: Vec<DeveloperProfile> = developers
                .iter()
                .filter_map(|addr| node.with_state(|state| get_developer_profile(addr, state)))
                .collect();

            Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: Some(json!(profiles.iter().map(|p| json!({
                    "address": hex::encode(p.address),
                    "username": p.username,
                    "projects": p.projects,
                    "reputation": p.reputation,
                    "created_at": p.created_at,
                })).collect::<Vec<_>>())),
                error: None,
                id,
            })
        }
        "dev_addProject" => {
            let params: AddProjectParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(AddProjectParams {
                        address: String::new(),
                        project_slug: String::new(),
                        signed_tx_hex: String::new(),
                    }),
                None => AddProjectParams {
                    address: String::new(),
                    project_slug: String::new(),
                    signed_tx_hex: String::new(),
                },
            };

            let address = match parse_address_hex(&params.address) {
                Ok(addr) => addr,
                Err(msg) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: format!("invalid address: {}", msg),
                        }),
                        id,
                    });
                }
            };

            // TODO: Verify signed transaction
            let result = node.with_state_mut(|state| {
                crate::runtime::add_project(address, params.project_slug, state)
            });

            match result {
                Ok(_) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: Some(json!({ "ok": true })),
                    error: None,
                    id,
                }),
                Err(msg) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: None,
                    error: Some(JsonRpcError {
                        code: -32000,
                        message: msg,
                    }),
                    id,
                }),
            }
        }
        "dev_getProjectMaintainers" => {
            let params: GetProjectMaintainersParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(GetProjectMaintainersParams {
                        project_slug: String::new(),
                    }),
                None => GetProjectMaintainersParams {
                    project_slug: String::new(),
                },
            };

            let maintainers = node.with_state(|state| {
                get_project_maintainers(&params.project_slug, state)
            });

            Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: Some(json!(maintainers.iter().map(|addr| hex::encode(addr)).collect::<Vec<_>>())),
                error: None,
                id,
            })
        }
        "archon_state" => {
            let asv = match node.archon_last_state.read() {
                Ok(guard) => guard.clone(),
                Err(_) => {
                    log::error!("archon_last_state rwlock poisoned");
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32603,
                            message: "Internal error: archon state lock poisoned".to_string(),
                        }),
                        id,
                    });
                }
            };
            let result_value = match serde_json::to_value(asv) {
                Ok(v) => v,
                Err(e) => {
                    log::error!("Failed to serialize ASV: {}", e);
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32603,
                            message: format!("Failed to serialize Archon state: {}", e),
                        }),
                        id,
                    });
                }
            };
            Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: Some(result_value),
                error: None,
                id,
            })
        }
        "cgt_getTransaction" => {
            let params: GetTxParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(GetTxParams {
                        tx_hash: String::new(),
                    }),
                None => GetTxParams {
                    tx_hash: String::new(),
                },
            };

            let tx = node.get_transaction_by_hash(&params.tx_hash);
            match tx {
                Some(t) => {
                    let tx_hash = t.hash().unwrap_or_default();
                    Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: Some(json!({
                            "from": hex::encode(t.from),
                            "nonce": t.nonce,
                            "module_id": t.module_id,
                            "call_id": t.call_id,
                            "payload": hex::encode(&t.payload),
                            "fee": t.fee,
                            "signature": hex::encode(&t.signature),
                            "hash": hex::encode(&tx_hash),
                        })),
                        error: None,
                        id,
                    })
                }
                None => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: Some(serde_json::Value::Null),
                    error: None,
                    id,
                }),
            }
        }
        "devCapsule_create" => {
            let params: DevCapsuleCreateParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(DevCapsuleCreateParams {
                        owner: String::new(),
                        project_slug: String::new(),
                        notes: String::new(),
                    }),
                None => DevCapsuleCreateParams {
                    owner: String::new(),
                    project_slug: String::new(),
                    notes: String::new(),
                },
            };

            let owner_addr = match parse_address_hex(&params.owner) {
                Ok(addr) => addr,
                Err(msg) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: format!("Invalid owner address: {}", msg),
                        }),
                        id,
                    });
                }
            };

            let current_height = node.chain_info().height;

            let result = node.with_state_mut(|state| {
                create_capsule(state, &owner_addr, &params.project_slug, &params.notes, current_height)
            });

            match result {
                Ok(capsule) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: Some(json!({
                        "id": capsule.id,
                        "owner": hex::encode(capsule.owner),
                        "project_slug": capsule.project_slug,
                        "status": match capsule.status {
                            CapsuleStatus::Draft => "draft",
                            CapsuleStatus::Live => "live",
                            CapsuleStatus::Paused => "paused",
                            CapsuleStatus::Archived => "archived",
                        },
                        "created_at": capsule.created_at,
                        "updated_at": capsule.updated_at,
                        "notes": capsule.notes,
                    })),
                    error: None,
                    id,
                }),
                Err(msg) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: None,
                    error: Some(JsonRpcError {
                        code: -32000,
                        message: msg,
                    }),
                    id,
                }),
            }
        }
        "devCapsule_get" => {
            let params: DevCapsuleGetParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(DevCapsuleGetParams { id: 0 }),
                None => DevCapsuleGetParams { id: 0 },
            };

            let capsule_opt = node.with_state(|state| get_capsule(state, params.id));

            match capsule_opt {
                Some(capsule) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: Some(json!({
                        "id": capsule.id,
                        "owner": hex::encode(capsule.owner),
                        "project_slug": capsule.project_slug,
                        "status": match capsule.status {
                            CapsuleStatus::Draft => "draft",
                            CapsuleStatus::Live => "live",
                            CapsuleStatus::Paused => "paused",
                            CapsuleStatus::Archived => "archived",
                        },
                        "created_at": capsule.created_at,
                        "updated_at": capsule.updated_at,
                        "notes": capsule.notes,
                    })),
                    error: None,
                    id,
                }),
                None => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: Some(serde_json::Value::Null),
                    error: None,
                    id,
                }),
            }
        }
        "devCapsule_listByOwner" => {
            let params: DevCapsuleListByOwnerParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(DevCapsuleListByOwnerParams {
                        owner: String::new(),
                    }),
                None => DevCapsuleListByOwnerParams {
                    owner: String::new(),
                },
            };

            let owner_addr = match parse_address_hex(&params.owner) {
                Ok(addr) => addr,
                Err(msg) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: format!("Invalid owner address: {}", msg),
                        }),
                        id,
                    });
                }
            };

            let capsules = node.with_state(|state| list_capsules_by_owner(state, &owner_addr));

            Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: Some(json!(capsules.iter().map(|capsule| json!({
                    "id": capsule.id,
                    "owner": hex::encode(capsule.owner),
                    "project_slug": capsule.project_slug,
                    "status": match capsule.status {
                        CapsuleStatus::Draft => "draft",
                        CapsuleStatus::Live => "live",
                        CapsuleStatus::Paused => "paused",
                        CapsuleStatus::Archived => "archived",
                    },
                    "created_at": capsule.created_at,
                    "updated_at": capsule.updated_at,
                    "notes": capsule.notes,
                })).collect::<Vec<_>>())),
                error: None,
                id,
            })
        }
        "devCapsule_updateStatus" => {
            let params: DevCapsuleUpdateStatusParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(DevCapsuleUpdateStatusParams {
                        id: 0,
                        status: String::new(),
                    }),
                None => DevCapsuleUpdateStatusParams {
                    id: 0,
                    status: String::new(),
                },
            };

            let status = match params.status.as_str() {
                "draft" => CapsuleStatus::Draft,
                "live" => CapsuleStatus::Live,
                "paused" => CapsuleStatus::Paused,
                "archived" => CapsuleStatus::Archived,
                _ => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: "Invalid status. Must be one of: draft, live, paused, archived".to_string(),
                        }),
                        id,
                    });
                }
            };

            let current_height = node.chain_info().height;

            let result = node.with_state_mut(|state| {
                // Verify capsule exists and get it first
                let capsule_opt = get_capsule(state, params.id);
                match capsule_opt {
                    Some(_) => update_capsule_status(state, params.id, status, current_height),
                    None => Err("Capsule not found".to_string()),
                }
            });

            match result {
                Ok(capsule) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: Some(json!({
                        "id": capsule.id,
                        "owner": hex::encode(capsule.owner),
                        "project_slug": capsule.project_slug,
                        "status": match capsule.status {
                            CapsuleStatus::Draft => "draft",
                            CapsuleStatus::Live => "live",
                            CapsuleStatus::Paused => "paused",
                            CapsuleStatus::Archived => "archived",
                        },
                        "created_at": capsule.created_at,
                        "updated_at": capsule.updated_at,
                        "notes": capsule.notes,
                    })),
                    error: None,
                    id,
                }),
                Err(msg) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: None,
                    error: Some(JsonRpcError {
                        code: -32000,
                        message: msg,
                    }),
                    id,
                }),
            }
        }
        "recursion_createWorld" => {
            let params: RecursionCreateWorldParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(RecursionCreateWorldParams {
                        owner: String::new(),
                        world_id: String::new(),
                        title: String::new(),
                        description: String::new(),
                        fabric_root_hash: String::new(),
                    }),
                None => RecursionCreateWorldParams {
                    owner: String::new(),
                    world_id: String::new(),
                    title: String::new(),
                    description: String::new(),
                    fabric_root_hash: String::new(),
                },
            };

            let owner_addr = match parse_address_hex(&params.owner) {
                Ok(addr) => addr,
                Err(msg) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: format!("Invalid owner address: {}", msg),
                        }),
                        id,
                    });
                }
            };

            let current_height = node.chain_info().height;

            let result = node.with_state_mut(|state| {
                create_world(
                    state,
                    &owner_addr,
                    params.world_id,
                    params.title,
                    params.description,
                    params.fabric_root_hash,
                    current_height,
                )
            });

            match result {
                Ok(world) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: Some(json!({
                        "world_id": world.world_id,
                        "owner": hex::encode(world.owner),
                        "title": world.title,
                        "description": world.description,
                        "fabric_root_hash": world.fabric_root_hash,
                        "created_at": world.created_at,
                    })),
                    error: None,
                    id,
                }),
                Err(msg) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: None,
                    error: Some(JsonRpcError {
                        code: -32000,
                        message: msg,
                    }),
                    id,
                }),
            }
        }
        "recursion_getWorld" => {
            let params: RecursionGetWorldParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(RecursionGetWorldParams {
                        world_id: String::new(),
                    }),
                None => RecursionGetWorldParams {
                    world_id: String::new(),
                },
            };

            let world_opt = node.with_state(|state| get_world(state, &params.world_id));

            match world_opt {
                Some(world) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: Some(json!({
                        "world_id": world.world_id,
                        "owner": hex::encode(world.owner),
                        "title": world.title,
                        "description": world.description,
                        "fabric_root_hash": world.fabric_root_hash,
                        "created_at": world.created_at,
                    })),
                    error: None,
                    id,
                }),
                None => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: Some(serde_json::Value::Null),
                    error: None,
                    id,
                }),
            }
        }
        "recursion_listWorldsByOwner" => {
            let params: RecursionListWorldsByOwnerParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(RecursionListWorldsByOwnerParams {
                        owner: String::new(),
                    }),
                None => RecursionListWorldsByOwnerParams {
                    owner: String::new(),
                },
            };

            let owner_addr = match parse_address_hex(&params.owner) {
                Ok(addr) => addr,
                Err(msg) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: format!("Invalid owner address: {}", msg),
                        }),
                        id,
                    });
                }
            };

            let worlds = node.with_state(|state| list_worlds_by_owner(state, &owner_addr));

            Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: Some(json!(worlds.iter().map(|world| json!({
                    "world_id": world.world_id,
                    "owner": hex::encode(world.owner),
                    "title": world.title,
                    "description": world.description,
                    "fabric_root_hash": world.fabric_root_hash,
                    "created_at": world.created_at,
                })).collect::<Vec<_>>())),
                error: None,
                id,
            })
        }
        "submitWorkClaim" => {
            let params: SubmitWorkClaimParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(SubmitWorkClaimParams {
                        address: String::new(),
                        game_id: String::new(),
                        session_id: String::new(),
                        depth_metric: 0.0,
                        active_ms: 0,
                        extra: None,
                    }),
                None => SubmitWorkClaimParams {
                    address: String::new(),
                    game_id: String::new(),
                    session_id: String::new(),
                    depth_metric: 0.0,
                    active_ms: 0,
                    extra: None,
                },
            };

            let address = match parse_address_hex(&params.address) {
                Ok(addr) => addr,
                Err(msg) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: format!("invalid address: {}", msg),
                        }),
                        id,
                    });
                }
            };

            // Calculate reward estimate
            let reward_estimate = calculate_reward(params.depth_metric, params.active_ms);

            // Build work claim params
            let work_claim_params = WorkClaimParams {
                game_id: params.game_id,
                session_id: params.session_id,
                depth_metric: params.depth_metric,
                active_ms: params.active_ms,
                extra: params.extra,
            };

            // Get nonce
            let nonce = node.get_nonce(&address);

            // Serialize payload
            let payload = match bincode::serialize(&work_claim_params) {
                Ok(p) => p,
                Err(e) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32603,
                            message: format!("failed to serialize payload: {}", e),
                        }),
                        id,
                    });
                }
            };

            // Build transaction
            let tx = Transaction {
                from: address,
                nonce,
                module_id: "work_claim".to_string(),
                call_id: "submit".to_string(),
                payload,
                fee: 0, // Work claims typically have no fee
                signature: vec![],
            };

            // Submit transaction
            match node.submit_transaction(tx) {
                Ok(tx_hash) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: Some(json!({
                        "tx_hash": tx_hash,
                        "reward_estimate": reward_estimate.to_string(),
                    })),
                    error: None,
                    id,
                }),
                Err(msg) => Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: None,
                    error: Some(JsonRpcError {
                        code: -32603,
                        message: msg,
                    }),
                    id,
                }),
            }
        }
        "getNetworkInfo" => {
            // Get chain info for chain_id and name
            let info = node.chain_info();
            
            // For devnet, use a fixed chain_id (77701)
            // In production, this would come from config
            let chain_id = 77701u64;
            let chain_name = "Demiurge Devnet".to_string();

            Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: Some(json!({
                    "chain_id": chain_id,
                    "name": chain_name,
                    "height": info.height,
                })),
                error: None,
                id,
            })
        }

        // ============================================
        // Activity Log RPC Methods
        // ============================================
        
        "activity_getStats" => {
            #[derive(Deserialize)]
            struct Params {
                address: String,
            }
            
            let params: Params = match req.params.as_ref() {
                Some(p) => match serde_json::from_value(p.clone()) {
                    Ok(parsed) => parsed,
                    Err(e) => {
                        return Json(JsonRpcResponse {
                            jsonrpc: "2.0".to_string(),
                            result: None,
                            error: Some(JsonRpcError {
                                code: -32602,
                                message: format!("Invalid params: {}", e),
                            }),
                            id,
                        });
                    }
                },
                None => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: "Missing params".to_string(),
                        }),
                        id,
                    });
                }
            };
            
            let addr_hex = params.address.strip_prefix("0x").unwrap_or(&params.address);
            let address = match hex::decode(addr_hex) {
                Ok(bytes) if bytes.len() == 32 => {
                    let mut arr = [0u8; 32];
                    arr.copy_from_slice(&bytes);
                    arr
                }
                _ => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: "Invalid address format".to_string(),
                        }),
                        id,
                    });
                }
            };
            
            let stats = node.with_state(|state| get_activity_stats(state, &address));
            
            Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: Some(json!({
                    "total_activities": stats.total_activities,
                    "transfers_sent": stats.transfers_sent,
                    "transfers_received": stats.transfers_received,
                    "total_cgt_sent": stats.total_cgt_sent.to_string(),
                    "total_cgt_received": stats.total_cgt_received.to_string(),
                    "nfts_minted": stats.nfts_minted,
                    "nfts_transferred": stats.nfts_transferred,
                    "work_claims": stats.work_claims,
                    "total_work_rewards": stats.total_work_rewards.to_string(),
                    "listings_created": stats.listings_created,
                    "purchases_made": stats.purchases_made,
                })),
                error: None,
                id,
            })
        }
        
        "activity_getHistory" => {
            #[derive(Deserialize)]
            struct Params {
                address: String,
                activity_type: Option<String>,
                limit: Option<u64>,
                offset: Option<u64>,
            }
            
            let params: Params = match req.params.as_ref() {
                Some(p) => match serde_json::from_value(p.clone()) {
                    Ok(parsed) => parsed,
                    Err(e) => {
                        return Json(JsonRpcResponse {
                            jsonrpc: "2.0".to_string(),
                            result: None,
                            error: Some(JsonRpcError {
                                code: -32602,
                                message: format!("Invalid params: {}", e),
                            }),
                            id,
                        });
                    }
                },
                None => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: "Missing params".to_string(),
                        }),
                        id,
                    });
                }
            };
            
            let addr_hex = params.address.strip_prefix("0x").unwrap_or(&params.address);
            let address = match hex::decode(addr_hex) {
                Ok(bytes) if bytes.len() == 32 => {
                    let mut arr = [0u8; 32];
                    arr.copy_from_slice(&bytes);
                    arr
                }
                _ => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: "Invalid address format".to_string(),
                        }),
                        id,
                    });
                }
            };
            
            let activity_type = params.activity_type.map(|s| ActivityType::from_str(&s));
            let limit = params.limit.unwrap_or(50).min(100);
            let offset = params.offset.unwrap_or(0);
            
            let activities = node.with_state(|state| {
                get_activities_for_address(state, &address, activity_type, limit, offset)
            });
            
            let entries: Vec<_> = activities.iter().map(|a| {
                json!({
                    "id": a.id,
                    "address": format!("0x{}", hex::encode(a.address)),
                    "activity_type": a.activity_type.as_str(),
                    "block_height": a.block_height,
                    "timestamp": a.timestamp,
                    "target": a.target.map(|t| format!("0x{}", hex::encode(t))),
                    "amount": a.amount.map(|a| a.to_string()),
                    "reference_id": a.reference_id.clone(),
                    "metadata": a.metadata.clone(),
                })
            }).collect();
            
            Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: Some(json!({
                    "activities": entries,
                    "count": entries.len(),
                })),
                error: None,
                id,
            })
        }
        
        "activity_getRecent" => {
            #[derive(Deserialize)]
            struct Params {
                limit: Option<u64>,
            }
            
            let params: Params = req.params.as_ref()
                .and_then(|p| serde_json::from_value(p.clone()).ok())
                .unwrap_or(Params { limit: None });
            
            let limit = params.limit.unwrap_or(20).min(100);
            
            let activities = node.with_state(|state| get_recent_activities(state, limit));
            
            let entries: Vec<_> = activities.iter().map(|a| {
                json!({
                    "id": a.id,
                    "address": format!("0x{}", hex::encode(a.address)),
                    "activity_type": a.activity_type.as_str(),
                    "block_height": a.block_height,
                    "timestamp": a.timestamp,
                    "target": a.target.map(|t| format!("0x{}", hex::encode(t))),
                    "amount": a.amount.map(|a| a.to_string()),
                    "reference_id": a.reference_id.clone(),
                    "metadata": a.metadata.clone(),
                })
            }).collect();
            
            Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: Some(json!({
                    "activities": entries,
                    "count": entries.len(),
                })),
                error: None,
                id,
            })
        }
        
        "activity_get" => {
            #[derive(Deserialize)]
            struct Params {
                id: u64,
            }
            
            let params: Params = match req.params.as_ref() {
                Some(p) => match serde_json::from_value(p.clone()) {
                    Ok(parsed) => parsed,
                    Err(e) => {
                        return Json(JsonRpcResponse {
                            jsonrpc: "2.0".to_string(),
                            result: None,
                            error: Some(JsonRpcError {
                                code: -32602,
                                message: format!("Invalid params: {}", e),
                            }),
                            id,
                        });
                    }
                },
                None => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: "Missing params".to_string(),
                        }),
                        id,
                    });
                }
            };
            
            match node.with_state(|state| get_activity(state, params.id)) {
                Some(a) => {
                    Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: Some(json!({
                            "id": a.id,
                            "address": format!("0x{}", hex::encode(a.address)),
                            "activity_type": a.activity_type.as_str(),
                            "block_height": a.block_height,
                            "timestamp": a.timestamp,
                            "target": a.target.map(|t| format!("0x{}", hex::encode(t))),
                            "amount": a.amount.map(|a| a.to_string()),
                            "reference_id": a.reference_id.clone(),
                            "metadata": a.metadata.clone(),
                        })),
                        error: None,
                        id,
                    })
                }
                None => {
                    Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32000,
                            message: "Activity not found".to_string(),
                        }),
                        id,
                    })
                }
            }
        }

        // ============================================
        // CGT Staking RPC Methods
        // ============================================
        
        "staking_getInfo" => {
            #[derive(Deserialize)]
            struct Params {
                address: String,
            }
            
            let params: Params = match req.params.as_ref() {
                Some(p) => match serde_json::from_value(p.clone()) {
                    Ok(parsed) => parsed,
                    Err(e) => {
                        return Json(JsonRpcResponse {
                            jsonrpc: "2.0".to_string(),
                            result: None,
                            error: Some(JsonRpcError {
                                code: -32602,
                                message: format!("Invalid params: {}", e),
                            }),
                            id,
                        });
                    }
                },
                None => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: "Missing params".to_string(),
                        }),
                        id,
                    });
                }
            };
            
            let address: Address = match hex::decode(params.address.strip_prefix("0x").unwrap_or(&params.address)) {
                Ok(bytes) if bytes.len() == 32 => {
                    let mut addr = [0u8; 32];
                    addr.copy_from_slice(&bytes);
                    addr
                }
                _ => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: "Invalid address format".to_string(),
                        }),
                        id,
                    });
                }
            };
            
            let current_time = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_secs())
                .unwrap_or(0);
            
            let stake_info = node.with_state(|state| get_stake_info(state, &address));
            let pending_rewards = calculate_pending_rewards(&stake_info, current_time);
            
            Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: Some(json!({
                    "amount": stake_info.amount.to_string(),
                    "stake_timestamp": stake_info.stake_timestamp,
                    "pending_rewards": pending_rewards.to_string(),
                    "last_reward_calculation": stake_info.last_reward_calculation,
                    "unstake_requested_at": stake_info.unstake_requested_at,
                    "unstake_amount": stake_info.unstake_amount.to_string(),
                    "has_pending_unstake": stake_info.unstake_requested_at > 0,
                })),
                error: None,
                id,
            })
        }
        
        "staking_getStats" => {
            let stats = node.with_state(|state| get_staking_stats(state));
            
            Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: Some(json!({
                    "total_staked": stats.total_staked.to_string(),
                    "apy_bps": stats.apy_bps,
                    "apy_percent": stats.apy_bps as f64 / 100.0,
                    "min_stake": stats.min_stake.to_string(),
                    "lock_period_secs": stats.lock_period_secs,
                    "lock_period_days": stats.lock_period_secs / (24 * 60 * 60),
                })),
                error: None,
                id,
            })
        }
        
        "staking_getTotalStaked" => {
            let total = node.with_state(|state| get_total_staked(state));
            
            Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: Some(json!({
                    "total_staked": total.to_string(),
                })),
                error: None,
                id,
            })
        }

        // ============================================
        // Treasury RPC Methods
        // ============================================
        
        "treasury_getStats" => {
            let stats = node.with_state(|state| get_treasury_stats(state));
            
            Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: Some(json!({
                    "balance": stats.balance.to_string(),
                    "total_fees_collected": stats.total_fees_collected.to_string(),
                    "total_burned": stats.total_burned.to_string(),
                    "total_validator_rewards": stats.total_validator_rewards.to_string(),
                    "fee_rate_bps": stats.fee_rate_bps,
                    "fee_rate_percent": stats.fee_rate_bps as f64 / 100.0,
                    "treasury_share_bps": stats.treasury_share_bps,
                    "treasury_share_percent": stats.treasury_share_bps as f64 / 100.0,
                    "burn_share_bps": stats.burn_share_bps,
                    "burn_share_percent": stats.burn_share_bps as f64 / 100.0,
                    "validator_share_bps": stats.validator_share_bps,
                    "validator_share_percent": stats.validator_share_bps as f64 / 100.0,
                })),
                error: None,
                id,
            })
        }
        
        "treasury_getBalance" => {
            let balance = node.with_state(|state| get_treasury_balance(state));
            
            Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: Some(json!({
                    "balance": balance.to_string(),
                })),
                error: None,
                id,
            })
        }
        
        "treasury_calculateFee" => {
            #[derive(Deserialize)]
            struct Params {
                amount: String,
            }
            
            let params: Params = match req.params.as_ref() {
                Some(p) => match serde_json::from_value(p.clone()) {
                    Ok(parsed) => parsed,
                    Err(e) => {
                        return Json(JsonRpcResponse {
                            jsonrpc: "2.0".to_string(),
                            result: None,
                            error: Some(JsonRpcError {
                                code: -32602,
                                message: format!("Invalid params: {}", e),
                            }),
                            id,
                        });
                    }
                },
                None => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: "Missing params".to_string(),
                        }),
                        id,
                    });
                }
            };
            
            let amount: u128 = match params.amount.parse() {
                Ok(a) => a,
                Err(_) => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: "Invalid amount".to_string(),
                        }),
                        id,
                    });
                }
            };
            
            let fee = calculate_fee(amount);
            
            Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: Some(json!({
                    "amount": amount.to_string(),
                    "fee": fee.to_string(),
                    "total": (amount + fee).to_string(),
                })),
                error: None,
                id,
            })
        }
        
        // ============================================
        // Premium Tier RPC Methods
        // ============================================
        
        "premium_getStatus" => {
            #[derive(Deserialize)]
            struct Params {
                address: String,
            }
            
            let params: Params = match req.params.as_ref() {
                Some(p) => match serde_json::from_value(p.clone()) {
                    Ok(parsed) => parsed,
                    Err(e) => {
                        return Json(JsonRpcResponse {
                            jsonrpc: "2.0".to_string(),
                            result: None,
                            error: Some(JsonRpcError {
                                code: -32602,
                                message: format!("Invalid params: {}", e),
                            }),
                            id,
                        });
                    }
                },
                None => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: "Missing params".to_string(),
                        }),
                        id,
                    });
                }
            };
            
            let address: Address = match hex::decode(params.address.strip_prefix("0x").unwrap_or(&params.address)) {
                Ok(bytes) if bytes.len() == 32 => {
                    let mut addr = [0u8; 32];
                    addr.copy_from_slice(&bytes);
                    addr
                }
                _ => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: "Invalid address format".to_string(),
                        }),
                        id,
                    });
                }
            };
            
            let current_time = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_secs())
                .unwrap_or(0);
            
            let status = node.with_state(|state| get_premium_status(state, &address, current_time));
            
            let tier_name = match status.effective_tier {
                PremiumTier::Free => "Free",
                PremiumTier::Archon => "Archon",
                PremiumTier::Genesis => "Genesis",
            };
            
            Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: Some(json!({
                    "effective_tier": tier_name,
                    "effective_tier_id": status.effective_tier as u8,
                    "subscription_tier": match status.subscription_tier {
                        PremiumTier::Free => "Free",
                        PremiumTier::Archon => "Archon",
                        PremiumTier::Genesis => "Genesis",
                    },
                    "stake_tier": match status.stake_tier {
                        PremiumTier::Free => "Free",
                        PremiumTier::Archon => "Archon",
                        PremiumTier::Genesis => "Genesis",
                    },
                    "subscription_expires_at": status.subscription_expires_at,
                    "staked_amount": status.staked_amount.to_string(),
                    "storage_limit": status.storage_limit,
                    "storage_limit_gb": status.storage_limit / (1024 * 1024 * 1024),
                    "storage_used": status.storage_used,
                    "storage_used_gb": status.storage_used as f64 / (1024.0 * 1024.0 * 1024.0),
                    "storage_available": status.storage_limit.saturating_sub(status.storage_used),
                })),
                error: None,
                id,
            })
        }
        
        "premium_getTiers" => {
            Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: Some(json!({
                    "tiers": [
                        {
                            "id": 0,
                            "name": "Free",
                            "monthly_cost": "0",
                            "stake_requirement": "0",
                            "storage_limit": FREE_STORAGE,
                            "storage_limit_gb": FREE_STORAGE / (1024 * 1024 * 1024),
                            "features": ["basic_storage", "standard_processing"]
                        },
                        {
                            "id": 1,
                            "name": "Archon",
                            "monthly_cost": ARCHON_MONTHLY_COST.to_string(),
                            "stake_requirement": ARCHON_STAKE_REQUIREMENT.to_string(),
                            "storage_limit": ARCHON_STORAGE,
                            "storage_limit_gb": ARCHON_STORAGE / (1024 * 1024 * 1024),
                            "features": ["extended_storage", "priority_processing", "profile_badge", "priority_support", "early_access"]
                        },
                        {
                            "id": 2,
                            "name": "Genesis",
                            "monthly_cost": GENESIS_MONTHLY_COST.to_string(),
                            "stake_requirement": GENESIS_STAKE_REQUIREMENT.to_string(),
                            "storage_limit": GENESIS_STORAGE,
                            "storage_limit_gb": GENESIS_STORAGE / (1024 * 1024 * 1024),
                            "features": ["extended_storage", "priority_processing", "profile_badge", "priority_support", "early_access", "exclusive_themes", "governance_bonus", "custom_handle", "direct_support"]
                        }
                    ]
                })),
                error: None,
                id,
            })
        }
        
        "premium_canUseStorage" => {
            #[derive(Deserialize)]
            struct Params {
                address: String,
                additional_bytes: u64,
            }
            
            let params: Params = match req.params.as_ref() {
                Some(p) => match serde_json::from_value(p.clone()) {
                    Ok(parsed) => parsed,
                    Err(e) => {
                        return Json(JsonRpcResponse {
                            jsonrpc: "2.0".to_string(),
                            result: None,
                            error: Some(JsonRpcError {
                                code: -32602,
                                message: format!("Invalid params: {}", e),
                            }),
                            id,
                        });
                    }
                },
                None => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: "Missing params".to_string(),
                        }),
                        id,
                    });
                }
            };
            
            let address: Address = match hex::decode(params.address.strip_prefix("0x").unwrap_or(&params.address)) {
                Ok(bytes) if bytes.len() == 32 => {
                    let mut addr = [0u8; 32];
                    addr.copy_from_slice(&bytes);
                    addr
                }
                _ => {
                    return Json(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32602,
                            message: "Invalid address format".to_string(),
                        }),
                        id,
                    });
                }
            };
            
            let current_time = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_secs())
                .unwrap_or(0);
            
            let can_use = node.with_state(|state| can_use_storage(state, &address, params.additional_bytes, current_time));
            let status = node.with_state(|state| get_premium_status(state, &address, current_time));
            
            Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: Some(json!({
                    "can_use": can_use,
                    "current_used": status.storage_used,
                    "limit": status.storage_limit,
                    "requested": params.additional_bytes,
                    "would_use": status.storage_used + params.additional_bytes,
                })),
                error: None,
                id,
            })
        }

        _ => Json(JsonRpcResponse {
            jsonrpc: "2.0".to_string(),
            result: None,
            error: Some(JsonRpcError {
                code: -32601, // Method not found
                message: "Method not found".to_string(),
            }),
            id,
        }),
    }
}
