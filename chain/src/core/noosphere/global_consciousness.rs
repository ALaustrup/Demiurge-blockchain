//! Global Consciousness
//!
//! PHASE OMEGA PART IV: Maintains shared semantic embeddings across nodes

use std::collections::HashMap;
use serde::{Deserialize, Serialize};

/// Semantic embedding
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SemanticEmbedding {
    pub concept: String,
    pub vector: Vec<f64>, // Embedding vector
    pub strength: f64,
    pub node_contributions: HashMap<String, f64>, // Node ID -> contribution
}

/// Global Consciousness
pub struct GlobalConsciousness {
    embeddings: HashMap<String, SemanticEmbedding>,
    embedding_dim: usize,
}

impl GlobalConsciousness {
    /// Create new global consciousness
    pub fn new(embedding_dim: usize) -> Self {
        Self {
            embeddings: HashMap::new(),
            embedding_dim,
        }
    }

    /// Add or update embedding
    pub fn update_embedding(&mut self, concept: String, vector: Vec<f64>, node_id: String) {
        if vector.len() != self.embedding_dim {
            return; // Invalid dimension
        }
        
        let embedding = self.embeddings.entry(concept.clone())
            .or_insert_with(|| SemanticEmbedding {
                concept: concept.clone(),
                vector: vec![0.0; self.embedding_dim],
                strength: 0.0,
                node_contributions: HashMap::new(),
            });
        
        // Merge with existing (weighted average)
        for (i, val) in vector.iter().enumerate() {
            embedding.vector[i] = (embedding.vector[i] + val) / 2.0;
        }
        
        embedding.node_contributions.insert(node_id, 1.0);
        embedding.strength = (embedding.strength + 1.0).min(1.0);
    }

    /// Get embedding
    pub fn get_embedding(&self, concept: &str) -> Option<&SemanticEmbedding> {
        self.embeddings.get(concept)
    }

    /// Get all embeddings
    pub fn get_all_embeddings(&self) -> &HashMap<String, SemanticEmbedding> {
        &self.embeddings
    }

    /// Compute similarity between concepts
    pub fn compute_similarity(&self, concept1: &str, concept2: &str) -> Option<f64> {
        let emb1 = self.embeddings.get(concept1)?;
        let emb2 = self.embeddings.get(concept2)?;
        
        // Cosine similarity
        let dot_product: f64 = emb1.vector.iter()
            .zip(emb2.vector.iter())
            .map(|(a, b)| a * b)
            .sum();
        
        let norm1: f64 = emb1.vector.iter().map(|x| x * x).sum::<f64>().sqrt();
        let norm2: f64 = emb2.vector.iter().map(|x| x * x).sum::<f64>().sqrt();
        
        if norm1 > 0.0 && norm2 > 0.0 {
            Some(dot_product / (norm1 * norm2))
        } else {
            Some(0.0)
        }
    }
}

impl Default for GlobalConsciousness {
    fn default() -> Self {
        Self::new(128) // 128-dimensional embeddings
    }
}
