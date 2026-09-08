//! Unit tests for balances module

use demiurge_module_balances::{BalancesModule, constants};
use demiurge_storage::backend::StorageBackend;

#[test]
fn test_transfer_success() {
    let storage = create_test_storage();
    
    // Create two accounts
    let alice = [1u8; 32];
    let bob = [2u8; 32];
    let amount = 1000u128; // 10 CGT
    
    // Mint to Alice
    BalancesModule::mint(&storage, alice, 5000).unwrap();
    
    // Transfer from Alice to Bob
    let result = BalancesModule::transfer(&storage, alice, bob, amount);
    assert!(result.is_ok());
    
    // Check balances
    let alice_balance = BalancesModule::get_balance(&storage, alice).unwrap();
    let bob_balance = BalancesModule::get_balance(&storage, bob).unwrap();
    
    assert_eq!(alice_balance, 4000); // 5000 - 1000
    assert_eq!(bob_balance, 1000);   // 0 + 1000
}

#[test]
fn test_transfer_insufficient_balance() {
    let storage = create_test_storage();
    
    let alice = [1u8; 32];
    let bob = [2u8; 32];
    let amount = 1000u128;
    
    // Mint small amount to Alice
    BalancesModule::mint(&storage, alice, 500).unwrap();
    
    // Try to transfer more than Alice has
    let result = BalancesModule::transfer(&storage, alice, bob, amount);
    assert!(result.is_err());
    
    // Balances should be unchanged
    let alice_balance = BalancesModule::get_balance(&storage, alice).unwrap();
    let bob_balance = BalancesModule::get_balance(&storage, bob).unwrap();
    
    assert_eq!(alice_balance, 500);
    assert_eq!(bob_balance, 0);
}

#[test]
fn test_transfer_zero_amount() {
    let storage = create_test_storage();
    
    let alice = [1u8; 32];
    let bob = [2u8; 32];
    
    BalancesModule::mint(&storage, alice, 1000).unwrap();
    
    // Try to transfer zero
    let result = BalancesModule::transfer(&storage, alice, bob, 0);
    assert!(result.is_err());
}

#[test]
fn test_transfer_existential_deposit() {
    let storage = create_test_storage();
    
    let alice = [1u8; 32];
    let bob = [2u8; 32];
    
    // Mint more than existential deposit to Alice
    // Use a larger amount to ensure we can test properly
    let mint_amount = 10000u128; // 100 CGT
    BalancesModule::mint(&storage, alice, mint_amount).unwrap();
    
    // Try to transfer all but existential deposit (should succeed)
    let transfer_amount = mint_amount - constants::EXISTENTIAL_DEPOSIT;
    let result = BalancesModule::transfer(&storage, alice, bob, transfer_amount);
    assert!(result.is_ok());
    
    // Alice should have exactly existential deposit left
    let alice_balance = BalancesModule::get_balance(&storage, alice).unwrap();
    assert_eq!(alice_balance, constants::EXISTENTIAL_DEPOSIT);
    
    // Try to transfer the remaining existential deposit (should fail)
    let result = BalancesModule::transfer(&storage, alice, bob, constants::EXISTENTIAL_DEPOSIT);
    assert!(result.is_err());
}

#[test]
fn test_mint_success() {
    let storage = create_test_storage();
    
    let alice = [1u8; 32];
    let amount = 1000u128;
    
    let result = BalancesModule::mint(&storage, alice, amount);
    assert!(result.is_ok());
    
    let balance = BalancesModule::get_balance(&storage, alice).unwrap();
    assert_eq!(balance, amount);
}

#[test]
fn test_mint_total_supply_limit() {
    let storage = create_test_storage();
    
    let alice = [1u8; 32];
    
    // Try to mint more than total supply
    let result = BalancesModule::mint(&storage, alice, constants::TOTAL_SUPPLY + 1);
    assert!(result.is_err());
}

#[test]
fn test_burn_success() {
    let storage = create_test_storage();
    
    let alice = [1u8; 32];
    let mint_amount = 5000u128;
    let burn_amount = 2000u128;
    
    BalancesModule::mint(&storage, alice, mint_amount).unwrap();
    
    let result = BalancesModule::burn(&storage, alice, burn_amount);
    assert!(result.is_ok());
    
    let balance = BalancesModule::get_balance(&storage, alice).unwrap();
    assert_eq!(balance, mint_amount - burn_amount);
}

#[test]
fn test_burn_insufficient_balance() {
    let storage = create_test_storage();
    
    let alice = [1u8; 32];
    
    BalancesModule::mint(&storage, alice, 500).unwrap();
    
    // Try to burn more than available
    let result = BalancesModule::burn(&storage, alice, 1000);
    assert!(result.is_err());
}

#[test]
fn test_get_balance_nonexistent_account() {
    let storage = create_test_storage();
    
    let account = [99u8; 32];
    let balance = BalancesModule::get_balance(&storage, account).unwrap();
    
    assert_eq!(balance, 0);
}

#[test]
fn test_multiple_transfers() {
    let storage = create_test_storage();
    
    let alice = [1u8; 32];
    let bob = [2u8; 32];
    let charlie = [3u8; 32];
    
    // Mint to Alice
    BalancesModule::mint(&storage, alice, 10000).unwrap();
    
    // Transfer to Bob
    BalancesModule::transfer(&storage, alice, bob, 3000).unwrap();
    
    // Transfer to Charlie
    BalancesModule::transfer(&storage, alice, charlie, 2000).unwrap();
    
    // Transfer from Bob to Charlie
    BalancesModule::transfer(&storage, bob, charlie, 1000).unwrap();
    
    // Check final balances
    assert_eq!(BalancesModule::get_balance(&storage, alice).unwrap(), 5000);
    assert_eq!(BalancesModule::get_balance(&storage, bob).unwrap(), 2000);
    assert_eq!(BalancesModule::get_balance(&storage, charlie).unwrap(), 3000);
}

/// Create a test storage backend
fn create_test_storage() -> StorageBackend {
    use std::sync::atomic::{AtomicU64, Ordering};
    use std::time::{SystemTime, UNIX_EPOCH};
    
    static COUNTER: AtomicU64 = AtomicU64::new(0);
    let counter = COUNTER.fetch_add(1, Ordering::Relaxed);
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let test_dir = format!("/tmp/demiurge_test_balances_{}_{}", timestamp, counter);
    
    StorageBackend::new(&test_dir).unwrap()
}
