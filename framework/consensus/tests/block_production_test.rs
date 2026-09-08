//! Unit tests for block production logic

use demiurge_consensus::{ConsensusEngine, Validator};
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

#[test]
fn test_propose_block_success() {
    let storage = create_test_storage();
    let mut engine = ConsensusEngine::new(storage, 1000); // 1 second block time

    // Register validators
    let (validator1, key1) = create_test_validator([1u8; 32], 1000);
    let (validator2, key2) = create_test_validator([2u8; 32], 2000);

    engine.validators.register_validator(validator1);
    engine.validators.register_validator(validator2);
    engine.register_validator_key([1u8; 32], key1);
    engine.register_validator_key([2u8; 32], key2);

    // Create transactions
    let transactions = vec![Transaction {
        from: [3u8; 32],
        nonce: 0,
        data: TransactionData::Transfer {
            to: [4u8; 32],
            amount: 100,
        },
        signature: [0u8; 64],
    }];

    // Proposer selection is deterministic for a given engine state, so ask the
    // engine who the proposer is and propose as that validator.
    let proposer = engine.select_proposer_weighted().unwrap();
    assert!(proposer == [1u8; 32] || proposer == [2u8; 32]);

    let (block, proof) = engine
        .propose_block(transactions.clone(), proposer)
        .expect("selected proposer must be able to propose");

    assert_eq!(block.header.block_number, 1);
    assert_eq!(block.transactions.len(), 1);
    assert_eq!(proof.proposer, proposer);
    assert_ne!(proof.signature, [0u8; 64]);
}

#[test]
fn test_propose_block_invalid_proposer() {
    let storage = create_test_storage();
    let mut engine = ConsensusEngine::new(storage, 1000);

    let (validator1, key1) = create_test_validator([1u8; 32], 1000);
    engine.validators.register_validator(validator1);
    engine.register_validator_key([1u8; 32], key1);

    let transactions = vec![];

    // Try to propose with non-validator account
    let result = engine.propose_block(transactions, [99u8; 32]);
    assert!(result.is_err()); // Should fail - invalid proposer
}

#[test]
fn test_store_and_retrieve_block() {
    let storage = create_test_storage();
    let mut engine = ConsensusEngine::new(storage, 1000);

    // Create a test block
    let block = Block {
        header: test_header(1),
        transactions: vec![],
    };

    // Store block
    let result = engine.store_block(&block);
    assert!(result.is_ok());

    // Retrieve block
    let retrieved = engine.get_block_by_number(1);
    assert!(retrieved.is_ok());
    let retrieved_block = retrieved.unwrap();
    assert!(retrieved_block.is_some());
    assert_eq!(retrieved_block.unwrap().header.block_number, 1);
}

#[test]
fn test_get_latest_block_number() {
    let storage = create_test_storage();
    let engine = ConsensusEngine::new(storage, 1000);

    // Initially should be 0 (genesis)
    let block_number = engine.get_latest_block_number();
    assert!(block_number.is_ok());
    assert_eq!(block_number.unwrap(), 0);
}

#[test]
fn test_weighted_proposer_selection() {
    let storage = create_test_storage();
    let mut engine = ConsensusEngine::new(storage, 1000);

    // Register validators with different stakes
    let (validator1, key1) = create_test_validator([1u8; 32], 1000);
    let (validator2, key2) = create_test_validator([2u8; 32], 2000);
    let (validator3, key3) = create_test_validator([3u8; 32], 3000);

    engine.validators.register_validator(validator1);
    engine.validators.register_validator(validator2);
    engine.validators.register_validator(validator3);
    engine.register_validator_key([1u8; 32], key1);
    engine.register_validator_key([2u8; 32], key2);
    engine.register_validator_key([3u8; 32], key3);

    // Selection is seeded from chain state, so advance the chain between
    // samples by storing empty blocks; otherwise every sample is identical.
    let mut selections = [0u32; 3];
    for n in 1..=100u64 {
        let proposer = engine.select_proposer_weighted().unwrap();
        match proposer {
            p if p == [1u8; 32] => selections[0] += 1,
            p if p == [2u8; 32] => selections[1] += 1,
            p if p == [3u8; 32] => selections[2] += 1,
            _ => panic!("Unexpected proposer"),
        }
        let block = Block {
            header: test_header(n),
            transactions: vec![],
        };
        engine.store_block(&block).unwrap();
    }

    // Every selected proposer must be a registered validator, and the
    // highest-stake validator must be selected at least once.
    assert_eq!(selections.iter().sum::<u32>(), 100);
    assert!(selections[2] > 0, "highest-stake validator was never selected: {:?}", selections);
}
