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

use axum::{extract::Extension, routing::post, Json, Router};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tower_http::cors::{Any, CorsLayer};

use crate::config::DEV_FAUCET_AMOUNT;
use crate::core::transaction::{Address, Transaction};
use crate::node::Node;
use crate::runtime::{
    create_urgeid_profile, get_address_by_handle, get_urgeid_profile, record_syzygy, set_handle,
    BankCgtModule, CGT_DECIMALS, CGT_MAX_SUPPLY, CGT_NAME, CGT_SYMBOL, FabricRootHash, ListingId,
    NftDgenModule, NftId, RuntimeModule,
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
pub struct UrgeIDCreateParams {
    pub address: String, // hex string
    pub display_name: String,
    pub bio: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UrgeIDGetParams {
    pub address: String, // hex string
}

#[derive(Debug, Deserialize)]
pub struct UrgeIDRecordSyzygyParams {
    pub address: String, // hex string
    pub amount: u64,     // Syzygy contribution amount
}

#[derive(Debug, Deserialize)]
pub struct UrgeIDSetHandleParams {
    pub address: String, // hex string
    pub handle: String,  // handle without @
}

#[derive(Debug, Deserialize)]
pub struct UrgeIDGetByHandleParams {
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
        .allow_headers(Any);

    Router::new()
        .route("/rpc", post(handle_rpc))
        .layer(cors)
        .layer(Extension(node))
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
                if !crate::runtime::urgeid_registry::is_archon(state, &owner_addr) {
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
        "urgeid_create" => {
            let params: UrgeIDCreateParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(UrgeIDCreateParams {
                        address: String::new(),
                        display_name: String::new(),
                        bio: None,
                    }),
                None => UrgeIDCreateParams {
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
                create_urgeid_profile(state, address, params.display_name, params.bio, current_height)
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
                            "syzygy_score": profile.syzygy_score,
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
                        message: format!("Failed to create UrgeID profile: {}", msg),
                    }),
                    id,
                }),
            }
        }
        "urgeid_get" => {
            let params: UrgeIDGetParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(UrgeIDGetParams {
                        address: String::new(),
                    }),
                None => UrgeIDGetParams {
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

            let profile_opt = node.with_state(|state| get_urgeid_profile(state, &address));

            Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: Some(match profile_opt {
                    Some(profile) => json!({
                        "address": hex::encode(profile.address),
                        "display_name": profile.display_name,
                        "bio": profile.bio,
                        "handle": profile.handle,
                        "syzygy_score": profile.syzygy_score,
                        "badges": profile.badges,
                        "created_at_height": profile.created_at_height,
                    }),
                    None => serde_json::Value::Null,
                }),
                error: None,
                id,
            })
        }
        "urgeid_recordSyzygy" => {
            let params: UrgeIDRecordSyzygyParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(UrgeIDRecordSyzygyParams {
                        address: String::new(),
                        amount: 0,
                    }),
                None => UrgeIDRecordSyzygyParams {
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
                        "syzygy_score": profile.syzygy_score,
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
        "urgeid_setHandle" => {
            let params: UrgeIDSetHandleParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(UrgeIDSetHandleParams {
                        address: String::new(),
                        handle: String::new(),
                    }),
                None => UrgeIDSetHandleParams {
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
                        "syzygy_score": profile.syzygy_score,
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
        "urgeid_getByHandle" => {
            let params: UrgeIDGetByHandleParams = match req.params.as_ref() {
                Some(raw) => serde_json::from_value(raw.clone())
                    .map_err(|e| e.to_string())
                    .unwrap_or(UrgeIDGetByHandleParams {
                        handle: String::new(),
                    }),
                None => UrgeIDGetByHandleParams {
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
                    let profile_opt = node.with_state(|state| get_urgeid_profile(state, &addr));
                    match profile_opt {
                        Some(profile) => Json(JsonRpcResponse {
                            jsonrpc: "2.0".to_string(),
                            result: Some(json!({
                                "address": hex::encode(profile.address),
                                "display_name": profile.display_name,
                                "bio": profile.bio,
                                "handle": profile.handle,
                                "syzygy_score": profile.syzygy_score,
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
                return Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: None,
                    error: Some(JsonRpcError {
                        code: -32601,
                        message: "cgt_devUnsafeTransfer is only available in debug builds".to_string(),
                    }),
                    id,
                });
            }

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
