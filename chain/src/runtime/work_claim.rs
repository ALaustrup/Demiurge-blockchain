//! Work-claim module for arcade mining rewards.
//!
//! This module handles work claims from arcade miners (e.g., Mandelbrot game)
//! and mints CGT rewards based on work metrics (depth, active time, etc.).

use serde::{Deserialize, Serialize};

use super::RuntimeModule;
use crate::core::state::State;
use crate::core::transaction::{Address, Transaction};
use crate::runtime::bank_cgt::cgt_mint_to;

/// Work claim configuration constants
pub const DEPTH_FACTOR: f64 = 100.0; // CGT per unit of depth_metric
pub const TIME_FACTOR: f64 = 0.1; // CGT per second of active_ms
pub const MAX_REWARD_PER_CLAIM: u128 = 1_000_000u128 * 100_000_000u128; // 1M CGT max per claim
pub const MIN_ACTIVE_MS: u64 = 1000; // Minimum 1 second of activity
pub const MAX_DEPTH_METRIC: f64 = 1_000_000.0; // Reasonable upper bound

/// Work claim payload structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkClaim {
    pub address: Address,
    pub game_id: String,
    pub session_id: String,
    pub depth_metric: f64,
    pub active_ms: u64,
    pub extra: Option<String>, // For future-proofing / metadata
}

/// Work claim parameters (for transaction payload)
#[derive(Debug, Serialize, Deserialize)]
pub struct WorkClaimParams {
    pub game_id: String,
    pub session_id: String,
    pub depth_metric: f64,
    pub active_ms: u64,
    pub extra: Option<String>,
}

/// Calculate CGT reward for a work claim
///
/// Formula: `(depth_metric * DEPTH_FACTOR + (active_ms / 1000.0) * TIME_FACTOR).min(MAX_REWARD_PER_CLAIM)`
pub fn calculate_reward(depth_metric: f64, active_ms: u64) -> u128 {
    let depth_reward = depth_metric * DEPTH_FACTOR;
    let time_reward = (active_ms as f64 / 1000.0) * TIME_FACTOR;
    let total_reward = (depth_reward + time_reward) as u128;
    total_reward.min(MAX_REWARD_PER_CLAIM)
}

/// Validate work claim parameters
fn validate_work_claim(claim: &WorkClaim) -> Result<(), String> {
    if claim.active_ms < MIN_ACTIVE_MS {
        return Err(format!(
            "active_ms {} is below minimum {}",
            claim.active_ms, MIN_ACTIVE_MS
        ));
    }

    if claim.depth_metric < 0.0 {
        return Err("depth_metric cannot be negative".to_string());
    }

    if claim.depth_metric > MAX_DEPTH_METRIC {
        return Err(format!(
            "depth_metric {} exceeds maximum {}",
            claim.depth_metric, MAX_DEPTH_METRIC
        ));
    }

    if claim.game_id.is_empty() {
        return Err("game_id cannot be empty".to_string());
    }

    if claim.session_id.is_empty() {
        return Err("session_id cannot be empty".to_string());
    }

    Ok(())
}

/// Process a work claim and mint CGT reward
fn process_work_claim(
    claim: &WorkClaim,
    state: &mut State,
    caller_address: &Address,
) -> Result<u128, String> {
    // Validate claim
    validate_work_claim(claim)?;

    // Ensure claim.address matches transaction sender
    if claim.address != *caller_address {
        return Err("claim.address must match transaction sender".to_string());
    }

    // Calculate reward
    let reward = calculate_reward(claim.depth_metric, claim.active_ms);

    // Mint CGT to the claim address
    cgt_mint_to(state, &claim.address, reward, "work_claim")?;

    Ok(reward)
}

/// WorkClaimModule handles work claims from arcade miners
pub struct WorkClaimModule;

impl WorkClaimModule {
    pub fn new() -> Self {
        Self
    }
}

impl RuntimeModule for WorkClaimModule {
    fn module_id(&self) -> &'static str {
        "work_claim"
    }

    fn dispatch(&self, call_id: &str, tx: &Transaction, state: &mut State) -> Result<(), String> {
        match call_id {
            "submit" => handle_submit_work_claim(tx, state),
            other => Err(format!("work_claim: unknown call_id '{}'", other)),
        }
    }
}

fn handle_submit_work_claim(tx: &Transaction, state: &mut State) -> Result<(), String> {
    // Deserialize work claim parameters
    let params: WorkClaimParams = bincode::deserialize(&tx.payload)
        .map_err(|e| format!("failed to deserialize WorkClaimParams: {}", e))?;

    // Build full WorkClaim with address from transaction
    let claim = WorkClaim {
        address: tx.from,
        game_id: params.game_id,
        session_id: params.session_id,
        depth_metric: params.depth_metric,
        active_ms: params.active_ms,
        extra: params.extra,
    };

    // Process the claim and mint reward
    let reward = process_work_claim(&claim, state, &tx.from)?;

    // TODO: Emit event (when event system is implemented)
    // Event::WorkClaimProcessed {
    //     address: claim.address,
    //     game_id: claim.game_id,
    //     session_id: claim.session_id,
    //     reward_cgt: reward,
    // }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::state::State;
    use crate::runtime::bank_cgt::get_balance_cgt;

    #[test]
    fn test_calculate_reward() {
        // Test basic reward calculation
        let reward1 = calculate_reward(10.0, 5000); // 10 depth, 5 seconds
        assert!(reward1 > 0);

        // Test max cap
        let reward2 = calculate_reward(1_000_000.0, 1_000_000_000);
        assert_eq!(reward2, MAX_REWARD_PER_CLAIM);

        // Test minimum time
        let reward3 = calculate_reward(1.0, 1000); // 1 depth, 1 second
        assert!(reward3 > 0);
    }

    #[test]
    fn test_validate_work_claim() {
        let valid_claim = WorkClaim {
            address: [1u8; 32],
            game_id: "mandelbrot".to_string(),
            session_id: "session_123".to_string(),
            depth_metric: 10.0,
            active_ms: 5000,
            extra: None,
        };
        assert!(validate_work_claim(&valid_claim).is_ok());

        // Test minimum active_ms
        let invalid_time = WorkClaim {
            active_ms: 500, // Below minimum
            ..valid_claim.clone()
        };
        assert!(validate_work_claim(&invalid_time).is_err());

        // Test negative depth
        let invalid_depth = WorkClaim {
            depth_metric: -1.0,
            ..valid_claim.clone()
        };
        assert!(validate_work_claim(&invalid_depth).is_err());

        // Test empty game_id
        let invalid_game = WorkClaim {
            game_id: String::new(),
            ..valid_claim.clone()
        };
        assert!(validate_work_claim(&invalid_game).is_err());
    }

    #[test]
    fn test_process_work_claim() {
        let mut state = State::in_memory();
        let address = [1u8; 32];

        let claim = WorkClaim {
            address,
            game_id: "mandelbrot".to_string(),
            session_id: "session_123".to_string(),
            depth_metric: 10.0,
            active_ms: 5000,
            extra: None,
        };

        let reward = process_work_claim(&claim, &mut state, &address).unwrap();
        assert!(reward > 0);

        // Check balance was updated
        let balance = get_balance_cgt(&state, &address);
        assert_eq!(balance, reward);
    }

    #[test]
    fn test_work_claim_module_dispatch() {
        let mut state = State::in_memory();
        let address = [1u8; 32];

        let params = WorkClaimParams {
            game_id: "mandelbrot".to_string(),
            session_id: "session_123".to_string(),
            depth_metric: 10.0,
            active_ms: 5000,
            extra: None,
        };

        let tx = Transaction {
            from: address,
            nonce: 0,
            module_id: "work_claim".to_string(),
            call_id: "submit".to_string(),
            payload: bincode::serialize(&params).unwrap(),
            fee: 0,
            signature: vec![],
        };

        let module = WorkClaimModule::new();
        let result = module.dispatch("submit", &tx, &mut state);
        assert!(result.is_ok());

        // Check balance was minted
        let balance = get_balance_cgt(&state, &address);
        assert!(balance > 0);
    }

    #[test]
    fn test_address_mismatch() {
        let mut state = State::in_memory();
        let sender = [1u8; 32];
        let claim_address = [2u8; 32];

        let claim = WorkClaim {
            address: claim_address, // Different from sender
            game_id: "mandelbrot".to_string(),
            session_id: "session_123".to_string(),
            depth_metric: 10.0,
            active_ms: 5000,
            extra: None,
        };

        let result = process_work_claim(&claim, &mut state, &sender);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("address must match"));
    }
}

