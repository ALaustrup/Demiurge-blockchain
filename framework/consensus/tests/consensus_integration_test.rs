//! Integration tests for consensus engine with staking pools, fees, state root
//! and slashing.

use demiurge_consensus::{ConsensusEngine, SlashingTracker, Validator, ValidatorSet};
use demiurge_core::{Block, BlockHeader, Transaction, TransactionData};
use demiurge_storage::MemoryStorage;
use ed25519_dalek::SigningKey;
use rand::rngs::OsRng;

fn create_test_storage() -> MemoryStorage {
    MemoryStorage::new()
}

fn create_test_validator(account: [u8; 32], stake: u128) -> (Validator, SigningKey) {
    let signing_key = SigningKey::generate(&mut OsRng);
    let public_key = signing_key.verifying_key();
    let validator = Validator {
        account,
        stake,
        commission: 10,
        active: true,
        public_key,
    };
    (validator, signing_key)
}

fn test_header(block_number: u64) -> BlockHeader {
    BlockHeader {
        parent_hash: [0u8; 32],
        block_number,
        state_root: [0u8; 32],
        extrinsics_root: [0u8; 32],
        timestamp: 1000,
        cvp_proof_root: None,
        cvp_epoch: 0,
    }
}

fn transfer(from: u8, to: u8, amount: u128) -> Transaction {
    Transaction {
        from: [from; 32],
        nonce: 0,
        data: TransactionData::Transfer {
            to: [to; 32],
            amount,
        },
        signature: [0u8; 64],
    }
}

#[test]
fn test_staking_pool_nomination() {
    let storage = create_test_storage();
    let mut engine = ConsensusEngine::new(storage, 1000);

    // Register validator
    let (validator1, key1) = create_test_validator([1u8; 32], 1000);
    engine.validators.register_validator(validator1);
    engine.register_validator_key([1u8; 32], key1);

    // Nominate validator
    let nominator = [2u8; 32];
    let nomination_amount = 500u128;

    let result = engine.nominate_validator([1u8; 32], nominator, nomination_amount);
    assert!(result.is_ok());

    // Check staking pool was created
    let pool = engine.staking_pools.get(&[1u8; 32]);
    assert!(pool.is_some());
    assert_eq!(pool.unwrap().total_stake(), nomination_amount);
}

#[test]
fn test_nominate_unknown_validator_fails() {
    let storage = create_test_storage();
    let mut engine = ConsensusEngine::new(storage, 1000);

    let result = engine.nominate_validator([9u8; 32], [2u8; 32], 500);
    assert!(result.is_err());
    assert!(!engine.staking_pools.contains_key(&[9u8; 32]));
}

#[test]
fn test_transaction_fee_collection() {
    let storage = create_test_storage();
    let mut engine = ConsensusEngine::new(storage, 1000);

    let block = Block {
        header: test_header(1),
        transactions: vec![transfer(1, 2, 100), transfer(2, 3, 50)],
    };

    // Collect fees (1 CGT per transaction)
    let fees = engine.collect_transaction_fees(&block);
    assert_eq!(fees, 2); // 2 transactions * 1 CGT = 2 CGT
    assert_eq!(engine.get_transaction_fees(), 2);
}

#[test]
fn test_state_root_calculation() {
    let storage = create_test_storage();
    let mut engine = ConsensusEngine::new(storage, 1000);

    // Calculate state root on the empty state
    let empty_root = engine.calculate_state_root().unwrap();

    // Writing a block changes the state and therefore the root
    let block = Block {
        header: test_header(1),
        transactions: vec![],
    };
    engine.store_block(&block).unwrap();

    let root_after = engine.calculate_state_root().unwrap();
    assert_ne!(root_after, empty_root);
    assert_ne!(root_after, [0u8; 32]);
}

#[test]
fn test_state_root_verification() {
    let storage = create_test_storage();
    let engine = ConsensusEngine::new(storage, 1000);

    // Calculate state root
    let calculated_root = engine.calculate_state_root().unwrap();

    // Verify state root
    let result = engine.verify_state_root(calculated_root);
    assert!(result.is_ok());

    // Verify wrong state root fails
    let mut wrong_root = calculated_root;
    wrong_root[0] ^= 0xff;
    let result = engine.verify_state_root(wrong_root);
    assert!(result.is_err());
}

#[test]
fn test_era_reward_distribution_with_staking_pools() {
    let storage = create_test_storage();
    let mut engine = ConsensusEngine::new(storage, 1000);

    // Register validators
    let (validator1, key1) = create_test_validator([1u8; 32], 1000);
    let (validator2, key2) = create_test_validator([2u8; 32], 2000);

    engine.validators.register_validator(validator1);
    engine.validators.register_validator(validator2);
    engine.register_validator_key([1u8; 32], key1);
    engine.register_validator_key([2u8; 32], key2);

    // Create staking pools and nominate
    engine.nominate_validator([1u8; 32], [3u8; 32], 500).unwrap();
    engine.nominate_validator([2u8; 32], [4u8; 32], 1000).unwrap();

    // Accumulate transaction fees
    let dummy_block = Block {
        header: test_header(1),
        transactions: vec![transfer(1, 2, 100)],
    };
    for _ in 0..1000 {
        engine.collect_transaction_fees(&dummy_block);
    }
    assert_eq!(engine.get_transaction_fees(), 1000);

    // Staking pools exist for both validators
    assert!(engine.staking_pools.contains_key(&[1u8; 32]));
    assert!(engine.staking_pools.contains_key(&[2u8; 32]));

    // With a one-block era, storing block 1 crosses an era boundary: rewards are
    // distributed and the fee counter is reset.
    assert_eq!(engine.current_era(), 0);
    engine.set_era_length(1);
    engine.store_block(&dummy_block).unwrap();
    engine.transition_era().unwrap(); // no-op if store_block already transitioned
    assert_eq!(engine.current_era(), 1);
    assert_eq!(engine.get_transaction_fees(), 0);
}

#[test]
fn test_slashing_double_signing() {
    // The engine's slashing tracker and storage are private; exercise the
    // tracker directly against a validator set, which is what the engine does.
    let mut storage = create_test_storage();
    let mut validators = ValidatorSet::new();
    let mut slashing = SlashingTracker::new();

    let (validator1, _key1) = create_test_validator([1u8; 32], 10000);
    validators.register_validator(validator1);

    let block = Block {
        header: test_header(1),
        transactions: vec![],
    };

    // Record signature first time (should succeed)
    assert!(slashing.record_signature([1u8; 32], &block).is_ok());

    // Record signature second time (should fail - double signing)
    assert!(slashing.record_signature([1u8; 32], &block).is_err());

    // Slash for double signing
    let slash_amount = slashing
        .slash_double_signing(&mut storage, &mut validators, [1u8; 32])
        .unwrap();

    // Verify validator was slashed (5% of 10000 = 500)
    let validator = validators.get_validator(&[1u8; 32]).unwrap();
    assert_eq!(validator.stake, 9500);
    assert_eq!(slash_amount, 500);
}

#[test]
fn test_slashing_downtime() {
    let mut storage = create_test_storage();
    let mut validators = ValidatorSet::new();
    let mut slashing = SlashingTracker::new();

    let (validator1, _key1) = create_test_validator([1u8; 32], 10000);
    validators.register_validator(validator1);

    // Record 10 missed blocks (threshold)
    for i in 1..=10 {
        slashing.record_missed_block(&mut storage, [1u8; 32], i);
    }
    assert_eq!(slashing.get_missed_blocks([1u8; 32]), 10);

    // Check if should slash
    assert!(slashing.should_slash_downtime([1u8; 32]));

    // Slash for downtime
    let slash_amount = slashing
        .slash_downtime(&mut storage, &mut validators, [1u8; 32], 10)
        .unwrap();

    // 10 blocks * 0.1% = 1% (capped at 10%)
    assert!(slash_amount > 0);

    // Verify validator stake decreased
    let validator = validators.get_validator(&[1u8; 32]).unwrap();
    assert!(validator.stake < 10000);
}
