//! Merkle tree for state verification

use blake2::{Blake2b512, Digest};

/// Simple Merkle tree implementation
pub struct MerkleTree;

impl MerkleTree {
    /// Calculate Merkle root from leaves
    pub fn root(leaves: &[[u8; 32]]) -> [u8; 32] {
        if leaves.is_empty() {
            return [0u8; 32];
        }

        if leaves.len() == 1 {
            return leaves[0];
        }

        // Simple binary tree
        let mut current = leaves.to_vec();
        while current.len() > 1 {
            let mut next = Vec::new();
            for chunk in current.chunks(2) {
                if chunk.len() == 2 {
                    let mut hasher = Blake2b512::new();
                    hasher.update(chunk[0]);
                    hasher.update(chunk[1]);
                    let hash = hasher.finalize();
                    let mut result = [0u8; 32];
                    result.copy_from_slice(&hash[..32]);
                    next.push(result);
                } else {
                    next.push(chunk[0]);
                }
            }
            current = next;
        }

        current[0]
    }
}
