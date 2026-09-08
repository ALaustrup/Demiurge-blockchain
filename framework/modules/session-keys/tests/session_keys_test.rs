//! Unit tests for session keys module

use demiurge_module_session_keys::{SessionKeysModule, constants};
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
    let test_dir = format!("/tmp/demiurge_test_session_keys_{}_{}", timestamp, counter);

    StorageBackend::new(&test_dir).unwrap()
}

fn set_block_number(storage: &mut StorageBackend, block: u64) {
    let key = b"System:BlockNumber";
    storage.put(key, &block.encode());
}

#[test]
fn test_authorize_session_key_success() {
    let mut storage = create_test_storage();
    set_block_number(&mut storage, 100);
    
    let primary_account = [1u8; 32];
    let session_key = [2u8; 32];
    let duration = 1000u64;
    
    // Authorize session key
    let result = SessionKeysModule::authorize_session_key(&storage, primary_account, session_key, duration);
    assert!(result.is_ok());
    
    // Check if session key is valid
    let is_valid = SessionKeysModule::is_session_key_valid(&storage, primary_account, session_key).unwrap();
    assert!(is_valid);
}

#[test]
fn test_authorize_session_key_invalid_duration_zero() {
    let mut storage = create_test_storage();
    set_block_number(&mut storage, 100);
    
    let primary_account = [1u8; 32];
    let session_key = [2u8; 32];
    let duration = 0u64;
    
    // Try to authorize with zero duration - should fail
    let result = SessionKeysModule::authorize_session_key(&storage, primary_account, session_key, duration);
    assert!(result.is_err());
}

#[test]
fn test_authorize_session_key_invalid_duration_too_long() {
    let mut storage = create_test_storage();
    set_block_number(&mut storage, 100);
    
    let primary_account = [1u8; 32];
    let session_key = [2u8; 32];
    let duration = constants::MAX_SESSION_DURATION + 1;
    
    // Try to authorize with duration exceeding max - should fail
    let result = SessionKeysModule::authorize_session_key(&storage, primary_account, session_key, duration);
    assert!(result.is_err());
}

#[test]
fn test_revoke_session_key_success() {
    let mut storage = create_test_storage();
    set_block_number(&mut storage, 100);
    
    let primary_account = [1u8; 32];
    let session_key = [2u8; 32];
    let duration = 1000u64;
    
    // Authorize session key
    SessionKeysModule::authorize_session_key(&storage, primary_account, session_key, duration).unwrap();
    
    // Revoke session key
    let result = SessionKeysModule::revoke_session_key(&storage, primary_account, session_key);
    assert!(result.is_ok());
    
    // Check if session key is no longer valid
    let is_valid = SessionKeysModule::is_session_key_valid(&storage, primary_account, session_key).unwrap();
    assert!(!is_valid);
}

#[test]
fn test_revoke_session_key_not_found() {
    let mut storage = create_test_storage();
    set_block_number(&mut storage, 100);
    
    let primary_account = [1u8; 32];
    let session_key = [2u8; 32];
    
    // Try to revoke non-existent session key - should fail
    let result = SessionKeysModule::revoke_session_key(&storage, primary_account, session_key);
    assert!(result.is_err());
}

#[test]
fn test_session_key_expiry() {
    let mut storage = create_test_storage();
    set_block_number(&mut storage, 100);
    
    let primary_account = [1u8; 32];
    let session_key = [2u8; 32];
    let duration = 1000u64;
    
    // Authorize session key
    SessionKeysModule::authorize_session_key(&storage, primary_account, session_key, duration).unwrap();
    
    // Check validity at current block
    let is_valid = SessionKeysModule::is_session_key_valid(&storage, primary_account, session_key).unwrap();
    assert!(is_valid);
    
    // Advance block number past expiry
    set_block_number(&mut storage, 1101); // 100 + 1000 + 1
    
    // Session key should now be expired
    let is_valid = SessionKeysModule::is_session_key_valid(&storage, primary_account, session_key).unwrap();
    assert!(!is_valid);
}

#[test]
fn test_multiple_session_keys() {
    let mut storage = create_test_storage();
    set_block_number(&mut storage, 100);
    
    let primary_account = [1u8; 32];
    let session_key1 = [2u8; 32];
    let session_key2 = [3u8; 32];
    let duration = 1000u64;
    
    // Authorize first session key
    SessionKeysModule::authorize_session_key(&storage, primary_account, session_key1, duration).unwrap();
    
    // Authorize second session key
    SessionKeysModule::authorize_session_key(&storage, primary_account, session_key2, duration).unwrap();
    
    // Both should be valid
    assert!(SessionKeysModule::is_session_key_valid(&storage, primary_account, session_key1).unwrap());
    assert!(SessionKeysModule::is_session_key_valid(&storage, primary_account, session_key2).unwrap());
    
    // Revoke first key
    SessionKeysModule::revoke_session_key(&storage, primary_account, session_key1).unwrap();
    
    // First should be invalid, second should still be valid
    assert!(!SessionKeysModule::is_session_key_valid(&storage, primary_account, session_key1).unwrap());
    assert!(SessionKeysModule::is_session_key_valid(&storage, primary_account, session_key2).unwrap());
}
