//! Fabric manager module for anchoring P2P Fabric assets and managing CGT fee pools.
//!
//! This module handles:
//! - Registration of Fabric assets (by fabric_root_hash)
//! - CGT fee pool management for seeder rewards
//! - Distribution of rewards to seeders

use serde::{Deserialize, Serialize};

use super::bank_cgt::{get_balance_cgt, set_balance_for_module};
use super::RuntimeModule;
use crate::core::state::State;
use crate::core::transaction::{Address, Transaction};

const PREFIX_FABRIC_ASSET: &[u8] = b"fabric:asset:";

/// Fabric root hash type
pub type FabricRootHash = [u8; 32];

/// Fabric asset with fee pool information
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FabricAsset {
    pub owner: Address, // Archon who registered it
    pub fabric_root_hash: FabricRootHash,
    pub pool_cgt_total: u128,     // total CGT originally allocated
    pub pool_cgt_remaining: u128, // remaining CGT to distribute
}

/// Register asset parameters
#[derive(Debug, Serialize, Deserialize)]
pub struct RegisterAssetParams {
    pub fabric_root_hash: FabricRootHash,
    pub initial_pool_cgt: u128,
}

/// Reward seeder parameters
#[derive(Debug, Serialize, Deserialize)]
pub struct RewardSeederParams {
    pub fabric_root_hash: FabricRootHash,
    pub seeder: Address,
    pub amount_cgt: u128,
}

/// Helper functions for Fabric asset management

fn asset_key(root: &FabricRootHash) -> Vec<u8> {
    let mut key = Vec::from(PREFIX_FABRIC_ASSET);
    key.extend_from_slice(root);
    key
}

fn load_asset(state: &State, root: &FabricRootHash) -> Option<FabricAsset> {
    state
        .get_raw(&asset_key(root))
        .and_then(|bytes| bincode::deserialize::<FabricAsset>(&bytes).ok())
}

fn store_asset(state: &mut State, asset: &FabricAsset) -> Result<(), String> {
    let bytes = bincode::serialize(asset).map_err(|e| e.to_string())?;
    state
        .put_raw(asset_key(&asset.fabric_root_hash), bytes)
        .map_err(|e| e.to_string())
}

/// Public helper for querying Fabric asset (for RPC/SDK use).
pub fn get_fabric_asset(state: &State, root: &FabricRootHash) -> Option<FabricAsset> {
    load_asset(state, root)
}

/// FabricManagerModule handles Fabric asset registration and seeder rewards
pub struct FabricManagerModule;

impl FabricManagerModule {
    pub fn new() -> Self {
        Self
    }
}

impl RuntimeModule for FabricManagerModule {
    fn module_id(&self) -> &'static str {
        "fabric_manager"
    }

    fn dispatch(&self, call_id: &str, tx: &Transaction, state: &mut State) -> Result<(), String> {
        match call_id {
            "register_asset" => handle_register_asset(tx, state),
            "reward_seeder" => handle_reward_seeder(tx, state),
            other => Err(format!("fabric_manager: unknown call_id '{}'", other)),
        }
    }
}

fn handle_register_asset(tx: &Transaction, state: &mut State) -> Result<(), String> {
    let params: RegisterAssetParams =
        bincode::deserialize(&tx.payload).map_err(|e| e.to_string())?;

    // Ensure not already registered
    if load_asset(state, &params.fabric_root_hash).is_some() {
        return Err("Fabric asset already registered".into());
    }

    // Charge the Archon initial_pool_cgt from their CGT balance.
    let from_balance = get_balance_cgt(state, &tx.from);
    if from_balance < params.initial_pool_cgt {
        return Err("insufficient CGT to seed Fabric fee pool".into());
    }

    // Deduct from Archon using bank_cgt's helpers.
    let new_balance = from_balance - params.initial_pool_cgt;
    set_balance_for_module(state, &tx.from, new_balance)?;

    let asset = FabricAsset {
        owner: tx.from,
        fabric_root_hash: params.fabric_root_hash,
        pool_cgt_total: params.initial_pool_cgt,
        pool_cgt_remaining: params.initial_pool_cgt,
    };

    store_asset(state, &asset)?;

    Ok(())
}

fn handle_reward_seeder(tx: &Transaction, state: &mut State) -> Result<(), String> {
    let params: RewardSeederParams =
        bincode::deserialize(&tx.payload).map_err(|e| e.to_string())?;

    let mut asset = load_asset(state, &params.fabric_root_hash)
        .ok_or_else(|| "Fabric asset not found".to_string())?;

    if params.amount_cgt == 0 {
        return Err("reward amount must be > 0".into());
    }

    if asset.pool_cgt_remaining < params.amount_cgt {
        return Err("insufficient pool_cgt_remaining for reward".into());
    }

    // Deduct from pool
    asset.pool_cgt_remaining -= params.amount_cgt;
    store_asset(state, &asset)?;

    // Credit seeder
    let current_seeder_balance = get_balance_cgt(state, &params.seeder);
    let new_seeder_balance = current_seeder_balance
        .checked_add(params.amount_cgt)
        .ok_or("overflow crediting seeder")?;

    set_balance_for_module(state, &params.seeder, new_seeder_balance)?;

    Ok(())
}
