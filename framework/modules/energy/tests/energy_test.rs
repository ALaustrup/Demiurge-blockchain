//! Unit tests for energy module

use demiurge_module_energy::{EnergyModule, constants};
use demiurge_storage::{backend::StorageBackend, Storage};
use codec::Encode;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

fn create_test_storage() -> StorageBackend {
    static COUNTER: AtomicU64 = AtomicU64::new(0);
    let counter = COUNTER.fetch_add(1, Ordering::Relaxed);
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let test_dir = format!("/tmp/demiurge_test_energy_{}_{}", timestamp, counter);

    StorageBackend::new(&test_dir).unwrap()
}

fn set_block_number(storage: &mut StorageBackend, block: u64) {
    let key = b"System:BlockNumber";
    storage.put(key, &block.encode());
}

#[test]
fn test_consume_energy_success() {
    let mut storage = create_test_storage();
    set_block_number(&mut storage, 1);
    
    let account = [1u8; 32];
    let amount = 5u64; // Less than REGENERATION_RATE
    
    // Regenerate energy first (1 block passed, so REGENERATION_RATE = 10)
    EnergyModule::regenerate_energy(&storage, account).unwrap();
    
    // Consume energy
    let result = EnergyModule::consume_energy(&storage, account, amount);
    assert!(result.is_ok());
    
    // Check energy balance
    let energy = EnergyModule::get_energy(&storage, account).unwrap();
    assert_eq!(energy, constants::REGENERATION_RATE - amount);
}

#[test]
fn test_consume_energy_insufficient() {
    let mut storage = create_test_storage();
    set_block_number(&mut storage, 100);
    
    let account = [1u8; 32];
    let amount = constants::MAX_ENERGY + 1;
    
    // Try to consume more than max energy
    let result = EnergyModule::consume_energy(&storage, account, amount);
    assert!(result.is_err());
}

#[test]
fn test_regenerate_energy() {
    let mut storage = create_test_storage();
    set_block_number(&mut storage, 100);
    
    let account = [1u8; 32];
    
    // Regenerate energy (100 blocks passed from 0, so 100 * REGENERATION_RATE = 1000, capped at MAX_ENERGY)
    EnergyModule::regenerate_energy(&storage, account).unwrap();
    
    // Check energy balance (should be MAX_ENERGY since 100 blocks passed)
    let energy = EnergyModule::get_energy(&storage, account).unwrap();
    assert_eq!(energy, constants::MAX_ENERGY);
}

#[test]
fn test_regenerate_energy_multiple_blocks() {
    let mut storage = create_test_storage();
    set_block_number(&mut storage, 1);
    
    let account = [1u8; 32];
    
    // First regeneration (1 block passed from 0, so 1 * REGENERATION_RATE = 10)
    EnergyModule::regenerate_energy(&storage, account).unwrap();
    let energy1 = EnergyModule::get_energy(&storage, account).unwrap();
    assert_eq!(energy1, constants::REGENERATION_RATE);
    
    // Advance block number
    set_block_number(&mut storage, 6);
    
    // Regenerate again (5 blocks passed: 6 - 1 = 5, so 5 * REGENERATION_RATE = 50)
    EnergyModule::regenerate_energy(&storage, account).unwrap();
    let energy2 = EnergyModule::get_energy(&storage, account).unwrap();
    assert_eq!(energy2, constants::REGENERATION_RATE * 6); // 10 + 50 = 60
}

#[test]
fn test_regenerate_energy_max_cap() {
    let mut storage = create_test_storage();
    set_block_number(&mut storage, 100);
    
    let account = [1u8; 32];
    
    // Advance many blocks
    set_block_number(&mut storage, 1000);
    
    // Regenerate energy
    EnergyModule::regenerate_energy(&storage, account).unwrap();
    
    // Energy should be capped at MAX_ENERGY
    let energy = EnergyModule::get_energy(&storage, account).unwrap();
    assert_eq!(energy, constants::MAX_ENERGY);
}

#[test]
fn test_sponsor_transaction() {
    let mut storage = create_test_storage();
    set_block_number(&mut storage, 100);
    
    let developer = [1u8; 32];
    let user = [2u8; 32];
    
    // Advance many blocks to get enough energy
    set_block_number(&mut storage, 200);
    
    // Regenerate energy for developer (should get 200 * REGENERATION_RATE = 2000, capped at MAX_ENERGY = 1000)
    EnergyModule::regenerate_energy(&storage, developer).unwrap();
    
    // Sponsor user's transaction
    let result = EnergyModule::sponsor_transaction(&storage, developer, user);
    assert!(result.is_ok());
    
    // Check developer's energy was consumed
    let developer_energy = EnergyModule::get_energy(&storage, developer).unwrap();
    assert_eq!(developer_energy, constants::MAX_ENERGY - constants::BASE_TX_COST);
}

#[test]
fn test_sponsor_transaction_insufficient_energy() {
    let mut storage = create_test_storage();
    set_block_number(&mut storage, 1);
    
    let developer = [1u8; 32];
    let user = [2u8; 32];
    
    // Regenerate a little energy (not enough for BASE_TX_COST)
    EnergyModule::regenerate_energy(&storage, developer).unwrap();
    // Developer now has REGENERATION_RATE (10), but BASE_TX_COST is 100
    
    // Try to sponsor - should fail (insufficient energy)
    let result = EnergyModule::sponsor_transaction(&storage, developer, user);
    assert!(result.is_err());
}
