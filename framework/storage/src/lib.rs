//! Storage layer - key-value store with Merkle tree support

pub mod backend;
pub mod merkle;

pub use backend::{Storage, StorageBackend, MemoryStorage, StorageError};
pub use merkle::MerkleTree;
