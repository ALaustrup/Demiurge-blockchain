//! Bank module for CGT (Creator God Token) balances and transfers.
//!
//! This module handles:
//! - CGT balance tracking per address (in smallest units, 10^-8)
//! - Transfers between addresses
//! - Minting with max supply enforcement
//! - Total supply tracking

use serde::{Deserialize, Serialize};

use anyhow;

use super::RuntimeModule;
use crate::core::state::State;
use crate::core::transaction::{Address, Transaction};

// Currency metadata
pub const CGT_NAME: &str = "Creator God Token";
pub const CGT_SYMBOL: &str = "CGT";
pub const CGT_DECIMALS: u8 = 8;
pub const CGT_MAX_SUPPLY: u128 = 369_000_000_000u128 * 100_000_000u128; // 369B * 10^8

const PREFIX_BALANCE: &[u8] = b"bank:balance:";
const PREFIX_NONCE: &[u8] = b"bank:nonce:";
const KEY_TOTAL_SUPPLY: &[u8] = b"bank_cgt/total_supply";

/// Helper functions for balance management

fn balance_key(address: &Address) -> Vec<u8> {
    let mut key = Vec::with_capacity(PREFIX_BALANCE.len() + address.len());
    key.extend_from_slice(PREFIX_BALANCE);
    key.extend_from_slice(address);
    key
}

fn nonce_key(address: &Address) -> Vec<u8> {
    let mut key = Vec::with_capacity(PREFIX_NONCE.len() + address.len());
    key.extend_from_slice(PREFIX_NONCE);
    key.extend_from_slice(address);
    key
}

fn get_balance(state: &State, addr: &Address) -> anyhow::Result<u128> {
    state
        .get_raw(&balance_key(addr))
        .and_then(|bytes| bincode::deserialize::<u128>(&bytes).ok())
        .ok_or_else(|| anyhow::anyhow!("failed to deserialize balance"))
        .or_else(|_| Ok(0u128))
}

fn set_balance(state: &mut State, addr: &Address, amount: u128) -> anyhow::Result<()> {
    let bytes = bincode::serialize(&amount).map_err(|e| anyhow::anyhow!("serialization error: {}", e))?;
    state
        .put_raw(balance_key(addr), bytes)
        .map_err(|e| anyhow::anyhow!("state error: {}", e))
}

/// Get total CGT supply from state.
pub fn get_cgt_total_supply(state: &State) -> anyhow::Result<u128> {
    state
        .get_raw(KEY_TOTAL_SUPPLY)
        .and_then(|bytes| bincode::deserialize::<u128>(&bytes).ok())
        .ok_or_else(|| anyhow::anyhow!("failed to deserialize total supply"))
        .or_else(|_| Ok(0u128))
}

/// Set total CGT supply in state.
pub fn set_cgt_total_supply(state: &mut State, amount: u128) -> anyhow::Result<()> {
    let bytes = bincode::serialize(&amount).map_err(|e| anyhow::anyhow!("serialization error: {}", e))?;
    state
        .put_raw(KEY_TOTAL_SUPPLY.to_vec(), bytes)
        .map_err(|e| anyhow::anyhow!("state error: {}", e))
}

fn get_nonce(state: &State, addr: &Address) -> u64 {
    state
        .get_raw(&nonce_key(addr))
        .and_then(|bytes| bincode::deserialize::<u64>(&bytes).ok())
        .unwrap_or(0)
}

/// Public helper for querying nonce (for RPC use).
pub fn get_nonce_cgt(state: &State, addr: &Address) -> u64 {
    get_nonce(state, addr)
}

/// Public helper for setting nonce (for RPC use).
pub fn set_nonce_cgt(state: &mut State, addr: &Address, nonce: u64) -> Result<(), String> {
    set_nonce(state, addr, nonce)
}

fn set_nonce(state: &mut State, addr: &Address, nonce: u64) -> Result<(), String> {
    let bytes = bincode::serialize(&nonce).map_err(|e| e.to_string())?;
    state
        .put_raw(nonce_key(addr), bytes)
        .map_err(|e| e.to_string())
}

/// Public helper for querying CGT balance (for RPC/wallet use).
pub fn get_balance_cgt(state: &State, addr: &Address) -> u128 {
    get_balance(state, addr).unwrap_or(0)
}

/// Internal helper for modules to directly set balances.
///
/// This is used by other runtime modules (e.g., fabric_manager, abyss_registry)
/// to perform balance operations without going through the bank_cgt transfer call.
/// Use with caution - this bypasses nonce checks and other validations.
pub(crate) fn set_balance_for_module(
    state: &mut State,
    addr: &Address,
    amount: u128,
) -> Result<(), String> {
    set_balance(state, addr, amount).map_err(|e| e.to_string())
}

/// Mint CGT to an address with max supply enforcement.
///
/// # Arguments
/// - `state`: Mutable state reference
/// - `to`: Recipient address
/// - `amount`: Amount to mint (in smallest units, 10^-8)
/// - `caller_module`: Module ID calling this function (for authorization)
///
/// # Returns
/// - `Ok(())` if minting succeeded
/// - `Err(String)` if max supply would be exceeded or caller is not authorized
pub fn cgt_mint_to(
    state: &mut State,
    to: &Address,
    amount: u128,
    caller_module: &str,
) -> Result<(), String> {
    // Enforce allowed minting modules
    let allowed_modules = ["forge", "fabric_manager", "system", "urgeid_registry", "urgeid_level_rewards", "work_claim"];
    if !allowed_modules.contains(&caller_module) {
        return Err(format!(
            "module '{}' is not authorized to mint CGT",
            caller_module
        ));
    }

    // Check total supply
    let current_total = get_cgt_total_supply(state).map_err(|e| e.to_string())?;
    let new_total = current_total
        .checked_add(amount)
        .ok_or("total supply overflow")?;

    if new_total > CGT_MAX_SUPPLY {
        return Err(format!(
            "CGT_MAX_SUPPLY exceeded: {} > {}",
            new_total, CGT_MAX_SUPPLY
        ));
    }

    // Update balance
    let current_balance = get_balance(state, to).map_err(|e| e.to_string())?;
    let new_balance = current_balance
        .checked_add(amount)
        .ok_or("balance overflow")?;
    set_balance(state, to, new_balance).map_err(|e| e.to_string())?;

    // Update total supply
    set_cgt_total_supply(state, new_total).map_err(|e| e.to_string())?;

    Ok(())
}

/// Burn CGT from an address.
///
/// # Arguments
/// - `state`: Mutable state reference
/// - `from`: Address to burn from
/// - `amount`: Amount to burn (in smallest units, 10^-8)
/// - `caller_module`: Module ID calling this function (for authorization)
///
/// # Returns
/// - `Ok(())` if burning succeeded
/// - `Err(String)` if insufficient balance or caller is not authorized
pub fn cgt_burn_from(
    state: &mut State,
    from: &Address,
    amount: u128,
    caller_module: &str,
) -> Result<(), String> {
    // Only system module can burn for now
    if caller_module != "system" {
        return Err(format!(
            "module '{}' is not authorized to burn CGT",
            caller_module
        ));
    }

    // Check balance
    let current_balance = get_balance(state, from).map_err(|e| e.to_string())?;
    if current_balance < amount {
        return Err("insufficient balance for burn".into());
    }

    // Update balance
    let new_balance = current_balance - amount;
    set_balance(state, from, new_balance).map_err(|e| e.to_string())?;

    // Update total supply
    let current_total = get_cgt_total_supply(state).map_err(|e| e.to_string())?;
    let new_total = current_total
        .checked_sub(amount)
        .ok_or("total supply underflow")?;
    set_cgt_total_supply(state, new_total).map_err(|e| e.to_string())?;

    Ok(())
}

/// Transfer parameters
#[derive(Debug, Serialize, Deserialize)]
pub struct TransferParams {
    pub to: Address,
    pub amount: u128,
}

/// Mint parameters
#[derive(Debug, Serialize, Deserialize)]
pub struct MintToParams {
    pub to: Address,
    pub amount: u128,
}

/// BankCgtModule handles CGT token operations
pub struct BankCgtModule;

impl BankCgtModule {
    pub fn new() -> Self {
        Self
    }
}

impl RuntimeModule for BankCgtModule {
    fn module_id(&self) -> &'static str {
        "bank_cgt"
    }

    fn dispatch(&self, call_id: &str, tx: &Transaction, state: &mut State) -> Result<(), String> {
        match call_id {
            "transfer" => handle_transfer(tx, state),
            "mint_to" => handle_mint_to(tx, state),
            other => Err(format!("bank_cgt: unknown call_id '{}'", other)),
        }
    }
}

fn handle_transfer(tx: &Transaction, state: &mut State) -> Result<(), String> {
    let params: TransferParams = bincode::deserialize(&tx.payload).map_err(|e| e.to_string())?;

    // Simple nonce check
    let current_nonce = get_nonce(state, &tx.from);
    if tx.nonce != current_nonce {
        return Err(format!(
            "invalid nonce: expected {}, got {}",
            current_nonce, tx.nonce
        ));
    }

    let from_balance = get_balance(state, &tx.from).map_err(|e| e.to_string())?;
    let to_balance = get_balance(state, &params.to).map_err(|e| e.to_string())?;

    let fee = tx.fee as u128;
    let total = params.amount.checked_add(fee).ok_or("overflow")?;

    if from_balance < total {
        return Err("insufficient balance for amount + fee".into());
    }

    let new_from_balance = from_balance - total;
    let new_to_balance = to_balance
        .checked_add(params.amount)
        .ok_or("overflow on recipient")?;

    set_balance(state, &tx.from, new_from_balance).map_err(|e| e.to_string())?;
    set_balance(state, &params.to, new_to_balance).map_err(|e| e.to_string())?;

    // Increment nonce
    set_nonce(state, &tx.from, current_nonce + 1)?;

    // TODO: handle fee routing (burn or pool); for now, fee is effectively burned.

    Ok(())
}

fn handle_mint_to(tx: &Transaction, state: &mut State) -> Result<(), String> {
    // For Phase 3, keep this extremely simple:
    // Allow minting only if tx.from is all zeros (a pseudo "genesis" authority).
    if tx.from != [0u8; 32] {
        return Err("mint_to can only be called by genesis authority (all-zero address)".into());
    }

    let params: MintToParams = bincode::deserialize(&tx.payload).map_err(|e| e.to_string())?;

    // Use the new cgt_mint_to function with max supply enforcement
    // Caller module is "system" for genesis mints
    cgt_mint_to(state, &params.to, params.amount, "system")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::state::State;
    use crate::core::transaction::{Address, Transaction};

    #[test]
    fn test_get_balance_default_zero() {
        let state = State::in_memory();
        let addr = [1u8; 32];
        assert_eq!(get_balance_cgt(&state, &addr), 0);
    }

    #[test]
    fn test_mint_to_and_get_balance() {
        let mut state = State::in_memory();
        let addr = [1u8; 32];
        let genesis = [0u8; 32];

        // Mint via genesis authority
        let params = MintToParams {
            to: addr,
            amount: 1000,
        };
        let tx = Transaction {
            from: genesis,
            nonce: 0,
            module_id: "bank_cgt".to_string(),
            call_id: "mint_to".to_string(),
            payload: bincode::serialize(&params).unwrap(),
            fee: 0,
            signature: vec![],
        };

        let module = BankCgtModule::new();
        module.dispatch("mint_to", &tx, &mut state).unwrap();

        assert_eq!(get_balance_cgt(&state, &addr), 1000);
        assert_eq!(get_cgt_total_supply(&state).unwrap(), 1000);
    }

    #[test]
    fn test_transfer() {
        let mut state = State::in_memory();
        let from = [1u8; 32];
        let to = [2u8; 32];
        let genesis = [0u8; 32];

        // First mint to 'from'
        let mint_params = MintToParams {
            to: from,
            amount: 1000,
        };
        let mint_tx = Transaction {
            from: genesis,
            nonce: 0,
            module_id: "bank_cgt".to_string(),
            call_id: "mint_to".to_string(),
            payload: bincode::serialize(&mint_params).unwrap(),
            fee: 0,
            signature: vec![],
        };

        let module = BankCgtModule::new();
        module.dispatch("mint_to", &mint_tx, &mut state).unwrap();

        // Now transfer
        let transfer_params = TransferParams { to, amount: 300 };
        let transfer_tx = Transaction {
            from,
            nonce: 0,
            module_id: "bank_cgt".to_string(),
            call_id: "transfer".to_string(),
            payload: bincode::serialize(&transfer_params).unwrap(),
            fee: 10,
            signature: vec![],
        };

        module
            .dispatch("transfer", &transfer_tx, &mut state)
            .unwrap();

        assert_eq!(get_balance_cgt(&state, &from), 690); // 1000 - 300 - 10
        assert_eq!(get_balance_cgt(&state, &to), 300);
    }

    #[test]
    fn test_max_supply_enforcement() {
        let mut state = State::in_memory();
        let addr = [1u8; 32];

        // Try to mint more than max supply
        let result = cgt_mint_to(&mut state, &addr, CGT_MAX_SUPPLY + 1, "system");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("CGT_MAX_SUPPLY exceeded"));
    }
}
