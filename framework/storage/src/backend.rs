//! Storage backend implementation
//!
//! Provides efficient key-value storage with prefix iteration support
//! for hierarchical state queries (critical for DRC-369 state trees).
//!
//! Note: All write operations use &self (not &mut self) to support
//! usage through Arc in RPC handlers. Both RocksDB and MemoryStorage
//! provide interior mutability to make this safe.

use thiserror::Error;
use std::collections::HashMap;
use std::sync::RwLock;

/// Storage trait with prefix iteration support
/// 
/// Uses &self for write operations to support Arc-based sharing in RPC handlers.
/// Implementations must provide thread-safe interior mutability.
pub trait Storage: Send + Sync {
    /// Get a value by key
    fn get(&self, key: &[u8]) -> Option<Vec<u8>>;
    
    /// Put a key-value pair (uses interior mutability)
    fn put(&self, key: &[u8], value: &[u8]);
    
    /// Delete a key (uses interior mutability)
    fn delete(&self, key: &[u8]);
    
    /// Commit changes and return root hash
    fn commit(&self) -> Result<[u8; 32], StorageError>;
    
    /// Calculate current state root without committing
    fn state_root(&self) -> Result<[u8; 32], StorageError>;
    
    /// Iterate over all keys with a given prefix
    /// Returns (key, value) pairs in lexicographic order
    fn prefix_iter(&self, prefix: &[u8]) -> Box<dyn Iterator<Item = (Vec<u8>, Vec<u8>)> + '_>;
    
    /// Count keys with a given prefix (more efficient than iterating)
    fn prefix_count(&self, prefix: &[u8]) -> usize {
        self.prefix_iter(prefix).count()
    }
    
    /// Check if any key exists with the given prefix
    fn prefix_exists(&self, prefix: &[u8]) -> bool {
        self.prefix_iter(prefix).next().is_some()
    }
}

/// In-memory storage for testing (thread-safe with RwLock)
pub struct MemoryStorage {
    data: RwLock<HashMap<Vec<u8>, Vec<u8>>>,
}

impl Default for MemoryStorage {
    fn default() -> Self {
        Self::new()
    }
}

impl MemoryStorage {
    pub fn new() -> Self {
        Self {
            data: RwLock::new(HashMap::new()),
        }
    }
}

impl Storage for MemoryStorage {
    fn get(&self, key: &[u8]) -> Option<Vec<u8>> {
        self.data.read().unwrap().get(key).cloned()
    }

    fn put(&self, key: &[u8], value: &[u8]) {
        self.data.write().unwrap().insert(key.to_vec(), value.to_vec());
    }

    fn delete(&self, key: &[u8]) {
        self.data.write().unwrap().remove(key);
    }

    fn commit(&self) -> Result<[u8; 32], StorageError> {
        use blake2::{Blake2b512, Digest};
        use crate::merkle::MerkleTree;
        
        let data = self.data.read().unwrap();
        
        // Sort keys for deterministic ordering
        let mut keys: Vec<_> = data.keys().cloned().collect();
        keys.sort();
        
        // Create leaves from key-value hashes
        let leaves: Vec<[u8; 32]> = keys.iter()
            .filter_map(|key| {
                data.get(key).map(|value| {
                    let mut hasher = Blake2b512::new();
                    hasher.update(key);
                    hasher.update(value);
                    let hash = hasher.finalize();
                    let mut leaf = [0u8; 32];
                    leaf.copy_from_slice(&hash[..32]);
                    leaf
                })
            })
            .collect();
        
        // Calculate Merkle root
        Ok(MerkleTree::root(&leaves))
    }
    
    fn state_root(&self) -> Result<[u8; 32], StorageError> {
        use blake2::{Blake2b512, Digest};
        use crate::merkle::MerkleTree;
        
        let data = self.data.read().unwrap();
        
        // Sort keys for deterministic ordering
        let mut keys: Vec<_> = data.keys().cloned().collect();
        keys.sort();
        
        // Create leaves from key-value hashes
        let leaves: Vec<[u8; 32]> = keys.iter()
            .filter_map(|key| {
                data.get(key).map(|value| {
                    let mut hasher = Blake2b512::new();
                    hasher.update(key);
                    hasher.update(value);
                    let hash = hasher.finalize();
                    let mut leaf = [0u8; 32];
                    leaf.copy_from_slice(&hash[..32]);
                    leaf
                })
            })
            .collect();
        
        // Calculate Merkle root
        Ok(MerkleTree::root(&leaves))
    }
    
    fn prefix_iter(&self, prefix: &[u8]) -> Box<dyn Iterator<Item = (Vec<u8>, Vec<u8>)> + '_> {
        let prefix = prefix.to_vec();
        let data = self.data.read().unwrap();
        
        // Collect matching entries and sort by key
        let mut entries: Vec<_> = data
            .iter()
            .filter(|(k, _)| k.starts_with(&prefix))
            .map(|(k, v)| (k.clone(), v.clone()))
            .collect();
        
        entries.sort_by(|a, b| a.0.cmp(&b.0));
        
        Box::new(entries.into_iter())
    }
}

/// Storage backend using RocksDB
pub struct StorageBackend {
    db: rocksdb::DB,
}

impl StorageBackend {
    pub fn new(path: &str) -> Result<Self, StorageError> {
        let db = rocksdb::DB::open_default(path)
            .map_err(|e| StorageError::DatabaseError(e.to_string()))?;
        Ok(Self { db })
    }
}

impl Storage for StorageBackend {
    fn get(&self, key: &[u8]) -> Option<Vec<u8>> {
        self.db.get(key).ok().flatten()
    }

    fn put(&self, key: &[u8], value: &[u8]) {
        // RocksDB has interior mutability - put is thread-safe
        let _ = self.db.put(key, value);
    }

    fn delete(&self, key: &[u8]) {
        // RocksDB has interior mutability - delete is thread-safe
        let _ = self.db.delete(key);
    }

    fn commit(&self) -> Result<[u8; 32], StorageError> {
        use blake2::{Blake2b512, Digest};
        use rocksdb::IteratorMode;
        use crate::merkle::MerkleTree;
        
        // Flush to disk (RocksDB flush is internally thread-safe)
        self.db.flush().map_err(|e| StorageError::DatabaseError(e.to_string()))?;
        
        // Collect all key-value pairs and create leaf hashes
        let mut leaves = Vec::new();
        let iter = self.db.iterator(IteratorMode::Start);
        
        for (key, value) in iter.flatten() {
            let mut hasher = Blake2b512::new();
            hasher.update(&key);
            hasher.update(&value);
            let hash = hasher.finalize();
            let mut leaf = [0u8; 32];
            leaf.copy_from_slice(&hash[..32]);
            leaves.push(leaf);
        }
        
        // Calculate Merkle root from leaves
        Ok(MerkleTree::root(&leaves))
    }
    
    fn state_root(&self) -> Result<[u8; 32], StorageError> {
        use blake2::{Blake2b512, Digest};
        use rocksdb::IteratorMode;
        use crate::merkle::MerkleTree;
        
        // Collect all key-value pairs and create leaf hashes
        let mut leaves = Vec::new();
        let iter = self.db.iterator(IteratorMode::Start);
        
        for (key, value) in iter.flatten() {
            let mut hasher = Blake2b512::new();
            hasher.update(&key);
            hasher.update(&value);
            let hash = hasher.finalize();
            let mut leaf = [0u8; 32];
            leaf.copy_from_slice(&hash[..32]);
            leaves.push(leaf);
        }
        
        // Calculate Merkle root from leaves
        Ok(MerkleTree::root(&leaves))
    }
    
    fn prefix_iter(&self, prefix: &[u8]) -> Box<dyn Iterator<Item = (Vec<u8>, Vec<u8>)> + '_> {
        use rocksdb::IteratorMode;
        
        let prefix = prefix.to_vec();
        let iter = self.db.iterator(IteratorMode::From(&prefix, rocksdb::Direction::Forward));
        
        Box::new(
            iter.take_while(move |result| {
                match result {
                    Ok((k, _)) => k.starts_with(&prefix),
                    Err(_) => false,
                }
            })
            .filter_map(|result| {
                result.ok().map(|(k, v)| (k.to_vec(), v.to_vec()))
            })
        )
    }
}

#[derive(Error, Debug)]
pub enum StorageError {
    #[error("Database error: {0}")]
    DatabaseError(String),
}
