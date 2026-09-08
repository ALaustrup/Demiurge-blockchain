//! # Vector-State Kernel
//!
//! Persistent on-chain memory for autonomous agents.
//! Provides episodic, semantic, and procedural memory storage
//! with vector similarity search.

use alloc::{format, string::{String, ToString}, vec::Vec, vec};
use core::cmp::Ordering;
use codec::{Decode, Encode};
use scale_info::TypeInfo;
use serde::{Deserialize, Serialize};

use crate::agent_did::AgentDid;
use crate::error::AgenticError;

/// Memory type classification
#[derive(Debug, Clone, Copy, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub enum MemoryType {
    /// Specific events/experiences
    Episodic,
    /// General knowledge/facts
    Semantic,
    /// Skills/patterns/strategies
    Procedural,
    /// Working memory (short-term)
    Working,
}

/// A single memory entry
#[derive(Debug, Clone, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct VectorMemory {
    /// Unique memory ID
    pub memory_id: [u8; 32],
    
    /// Agent owner
    pub agent_did: String,
    
    /// Memory type
    pub memory_type: MemoryType,
    
    /// Embedding vector (768 dimensions typical)
    /// Stored as bytes to avoid f32 TypeInfo issues
    pub embedding: Vec<u8>,
    
    /// Embedding dimension
    pub embedding_dim: u32,
    
    /// Raw content (may be encrypted)
    pub content: Vec<u8>,
    
    /// Content summary (for quick retrieval)
    pub summary: String,
    
    /// Associated DRC-369 asset IDs
    pub asset_context: Vec<[u8; 32]>,
    
    /// Creation timestamp
    pub created_at: u64,
    
    /// Last accessed timestamp
    pub last_accessed: u64,
    
    /// Access count
    pub access_count: u32,
    
    /// Importance score (0-100)
    pub importance: u8,
    
    /// VCP that generated this memory (if AI-derived)
    pub inference_proof: Option<[u8; 32]>,
    
    /// Tags for filtering
    pub tags: Vec<String>,
    
    /// Is memory archived (moved to cold storage)
    pub archived: bool,
}

impl VectorMemory {
    /// Create a new memory entry
    pub fn new(
        agent_did: &AgentDid,
        memory_type: MemoryType,
        content: Vec<u8>,
        summary: String,
    ) -> Self {
        let mut hasher = blake3::Hasher::new();
        hasher.update(&agent_did.unique_id);
        hasher.update(&current_timestamp().to_le_bytes());
        hasher.update(&content);
        let memory_id: [u8; 32] = hasher.finalize().into();
        
        let now = current_timestamp();
        
        Self {
            memory_id,
            agent_did: agent_did.did_string.clone(),
            memory_type,
            embedding: Vec::new(), // Set separately
            embedding_dim: 0,
            content,
            summary,
            asset_context: Vec::new(),
            created_at: now,
            last_accessed: now,
            access_count: 0,
            importance: 50, // Default medium importance
            inference_proof: None,
            tags: Vec::new(),
            archived: false,
        }
    }
    
    /// Set embedding vector
    pub fn set_embedding(&mut self, embedding: &[f32]) {
        self.embedding_dim = embedding.len() as u32;
        // Convert f32 to bytes
        self.embedding = embedding.iter()
            .flat_map(|f| f.to_le_bytes())
            .collect();
    }
    
    /// Get embedding as f32 slice
    pub fn get_embedding(&self) -> Vec<f32> {
        self.embedding.chunks_exact(4)
            .map(|chunk| {
                let bytes: [u8; 4] = chunk.try_into().unwrap();
                f32::from_le_bytes(bytes)
            })
            .collect()
    }
    
    /// Record access
    pub fn record_access(&mut self) {
        self.last_accessed = current_timestamp();
        self.access_count += 1;
    }
    
    /// Calculate decay factor (older = lower priority)
    pub fn decay_factor(&self) -> f32 {
        let age_days = (current_timestamp() - self.created_at) / (24 * 60 * 60);
        let base_decay = 0.99_f32.powi(age_days as i32);
        let access_boost = (self.access_count as f32 / 100.0).min(1.0);
        base_decay * (1.0 + access_boost)
    }
    
    /// Effective importance (importance * decay * recency)
    pub fn effective_importance(&self) -> f32 {
        self.importance as f32 * self.decay_factor()
    }
}

/// Context injected from DRC-369 assets
#[derive(Debug, Clone, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct AssetContext {
    /// Asset token ID
    pub token_id: [u8; 32],
    
    /// Asset name
    pub name: String,
    
    /// Physics properties (JSON)
    pub physics_json: String,
    
    /// Current state (XP, level, etc.)
    pub state_json: String,
    
    /// Rarity
    pub rarity: String,
    
    /// Custom attributes
    pub attributes: Vec<(String, String)>,
}

/// Full context for agent operation
#[derive(Debug, Clone, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct AgentContext {
    /// Agent DID
    pub agent_did: String,
    
    /// Agent's mission/system prompt
    pub mission: String,
    
    /// Current working memory
    pub working_memory: Vec<VectorMemory>,
    
    /// Relevant retrieved memories
    pub retrieved_memories: Vec<VectorMemory>,
    
    /// Asset context (if interacting with assets)
    pub asset_context: Vec<AssetContext>,
    
    /// Current timestamp
    pub timestamp: u64,
    
    /// Available tools
    pub available_tools: Vec<String>,
}

impl AgentContext {
    /// Create new context
    pub fn new(agent_did: &AgentDid, mission: String) -> Self {
        Self {
            agent_did: agent_did.did_string.clone(),
            mission,
            working_memory: Vec::new(),
            retrieved_memories: Vec::new(),
            asset_context: Vec::new(),
            timestamp: current_timestamp(),
            available_tools: Vec::new(),
        }
    }
    
    /// Convert to prompt string
    pub fn to_prompt_context(&self) -> String {
        let mut context = String::new();
        
        // Mission
        context.push_str(&format!("## Mission\n{}\n\n", self.mission));
        
        // Memories
        if !self.retrieved_memories.is_empty() {
            context.push_str("## Relevant Memories\n");
            for mem in &self.retrieved_memories {
                context.push_str(&format!("- [{}] {}\n", 
                    format!("{:?}", mem.memory_type), 
                    mem.summary
                ));
            }
            context.push_str("\n");
        }
        
        // Asset context
        if !self.asset_context.is_empty() {
            context.push_str("## Asset Context\n");
            for asset in &self.asset_context {
                context.push_str(&format!("### {}\n", asset.name));
                context.push_str(&format!("- Physics: {}\n", asset.physics_json));
                context.push_str(&format!("- State: {}\n", asset.state_json));
                context.push_str(&format!("- Rarity: {}\n", asset.rarity));
            }
            context.push_str("\n");
        }
        
        // Tools
        if !self.available_tools.is_empty() {
            context.push_str("## Available Tools\n");
            for tool in &self.available_tools {
                context.push_str(&format!("- {}\n", tool));
            }
        }
        
        context
    }
}

/// Vector-State Kernel for agent memory
#[derive(Debug, Default)]
pub struct VectorStateKernel {
    /// All memories by ID
    memories: alloc::collections::BTreeMap<[u8; 32], VectorMemory>,
    
    /// Memories indexed by agent
    by_agent: alloc::collections::BTreeMap<String, Vec<[u8; 32]>>,
    
    /// Total memory count
    total_count: u64,
    
    /// Max memories per agent
    max_per_agent: usize,
}

impl VectorStateKernel {
    /// Create new kernel
    pub fn new(max_per_agent: usize) -> Self {
        Self {
            max_per_agent,
            ..Default::default()
        }
    }
    
    /// Store a memory
    pub fn store(&mut self, memory: VectorMemory) -> Result<[u8; 32], AgenticError> {
        let memory_id = memory.memory_id;
        let agent = memory.agent_did.clone();
        
        // Check limit and archive if needed
        let needs_archive = self.by_agent.get(&agent)
            .map(|ids| ids.len() >= self.max_per_agent)
            .unwrap_or(false);
        
        if needs_archive {
            self.archive_oldest(&agent)?;
        }
        
        let agent_memories = self.by_agent.entry(agent).or_default();
        agent_memories.push(memory_id);
        self.memories.insert(memory_id, memory);
        self.total_count += 1;
        
        Ok(memory_id)
    }
    
    /// Retrieve a memory by ID
    pub fn get(&mut self, memory_id: &[u8; 32]) -> Option<&mut VectorMemory> {
        if let Some(mem) = self.memories.get_mut(memory_id) {
            mem.record_access();
            Some(mem)
        } else {
            None
        }
    }
    
    /// Search memories by similarity (returns cloned results)
    pub fn search(
        &mut self,
        agent_did: &AgentDid,
        query_embedding: &[f32],
        limit: usize,
        memory_type: Option<MemoryType>,
    ) -> Vec<VectorMemory> {
        let agent_memory_ids = match self.by_agent.get(&agent_did.did_string) {
            Some(ids) => ids.clone(),
            None => return Vec::new(),
        };
        
        let mut scored: Vec<([u8; 32], f32)> = agent_memory_ids.iter()
            .filter_map(|id| {
                let mem = self.memories.get(id)?;
                
                // Filter by type if specified
                if let Some(mt) = memory_type {
                    if mem.memory_type != mt {
                        return None;
                    }
                }
                
                // Skip archived
                if mem.archived {
                    return None;
                }
                
                let similarity = cosine_similarity(query_embedding, &mem.get_embedding());
                Some((*id, similarity * mem.effective_importance()))
            })
            .collect();
        
        // Sort by score descending
        scored.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(Ordering::Equal));
        
        // Take top N, record access, and clone
        let top_ids: Vec<[u8; 32]> = scored.iter().take(limit).map(|(id, _)| *id).collect();
        
        let mut results = Vec::new();
        for id in top_ids {
            if let Some(mem) = self.memories.get_mut(&id) {
                mem.record_access();
                results.push(mem.clone());
            }
        }
        results
    }
    
    /// Get memories by tag
    pub fn by_tag(&self, agent_did: &AgentDid, tag: &str) -> Vec<VectorMemory> {
        self.by_agent.get(&agent_did.did_string)
            .map(|ids| {
                ids.iter()
                    .filter_map(|id| self.memories.get(id))
                    .filter(|m| m.tags.contains(&tag.to_string()) && !m.archived)
                    .cloned()
                    .collect()
            })
            .unwrap_or_default()
    }
    
    /// Archive oldest low-importance memory
    fn archive_oldest(&mut self, agent: &str) -> Result<(), AgenticError> {
        let ids = self.by_agent.get(agent)
            .ok_or(AgenticError::MemoryNotFound)?;
        
        // Find lowest importance
        let to_archive = ids.iter()
            .filter_map(|id| {
                let mem = self.memories.get(id)?;
                if mem.archived { return None; }
                Some((*id, mem.effective_importance()))
            })
            .min_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(Ordering::Equal))
            .map(|(id, _)| id);
        
        if let Some(id) = to_archive {
            if let Some(mem) = self.memories.get_mut(&id) {
                mem.archived = true;
            }
        }
        
        Ok(())
    }
    
    /// Get agent's working memory
    pub fn working_memory(&self, agent_did: &AgentDid) -> Vec<VectorMemory> {
        self.by_agent.get(&agent_did.did_string)
            .map(|ids| {
                ids.iter()
                    .filter_map(|id| self.memories.get(id))
                    .filter(|m| m.memory_type == MemoryType::Working && !m.archived)
                    .cloned()
                    .collect()
            })
            .unwrap_or_default()
    }
    
    /// Clear working memory
    pub fn clear_working_memory(&mut self, agent_did: &AgentDid) {
        if let Some(ids) = self.by_agent.get(&agent_did.did_string) {
            for id in ids {
                if let Some(mem) = self.memories.get_mut(id) {
                    if mem.memory_type == MemoryType::Working {
                        mem.archived = true;
                    }
                }
            }
        }
    }
    
    /// Get memory stats for agent
    pub fn stats(&self, agent_did: &AgentDid) -> MemoryStats {
        let ids = self.by_agent.get(&agent_did.did_string);
        
        if let Some(ids) = ids {
            let mut stats = MemoryStats::default();
            
            for id in ids {
                if let Some(mem) = self.memories.get(id) {
                    stats.total += 1;
                    if mem.archived {
                        stats.archived += 1;
                    } else {
                        match mem.memory_type {
                            MemoryType::Episodic => stats.episodic += 1,
                            MemoryType::Semantic => stats.semantic += 1,
                            MemoryType::Procedural => stats.procedural += 1,
                            MemoryType::Working => stats.working += 1,
                        }
                    }
                }
            }
            
            stats
        } else {
            MemoryStats::default()
        }
    }
}

/// Memory statistics
#[derive(Debug, Clone, Default, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct MemoryStats {
    pub total: u64,
    pub episodic: u64,
    pub semantic: u64,
    pub procedural: u64,
    pub working: u64,
    pub archived: u64,
}

/// Cosine similarity between two vectors
fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    if a.len() != b.len() || a.is_empty() {
        return 0.0;
    }
    
    let dot: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    let mag_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
    let mag_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();
    
    if mag_a == 0.0 || mag_b == 0.0 {
        return 0.0;
    }
    
    dot / (mag_a * mag_b)
}

/// Store a memory
pub fn store_memory(
    kernel: &mut VectorStateKernel,
    agent_did: &AgentDid,
    memory_type: MemoryType,
    content: Vec<u8>,
    summary: String,
    embedding: &[f32],
    importance: u8,
) -> Result<[u8; 32], AgenticError> {
    let mut memory = VectorMemory::new(agent_did, memory_type, content, summary);
    memory.set_embedding(embedding);
    memory.importance = importance;
    
    kernel.store(memory)
}

/// Query memories by similarity
pub fn query_memories(
    kernel: &mut VectorStateKernel,
    agent_did: &AgentDid,
    query_embedding: &[f32],
    limit: usize,
) -> Vec<VectorMemory> {
    kernel.search(agent_did, query_embedding, limit, None)
}

/// Inject DRC-369 asset context
pub fn inject_asset_context(
    agent_context: &mut AgentContext,
    token_id: [u8; 32],
    name: String,
    physics_json: String,
    state_json: String,
    rarity: String,
    attributes: Vec<(String, String)>,
) {
    agent_context.asset_context.push(AssetContext {
        token_id,
        name,
        physics_json,
        state_json,
        rarity,
        attributes,
    });
}

/// Helper to get current timestamp
fn current_timestamp() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::agent_did::create_agent_did;
    use crate::agent_did::AutonomyLevel;
    
    #[test]
    fn test_memory_creation() {
        let controller = b"controller";
        let did = create_agent_did(controller, AutonomyLevel::Bounded, vec![]).unwrap();
        
        let mut memory = VectorMemory::new(
            &did,
            MemoryType::Episodic,
            b"test content".to_vec(),
            "Test memory".into(),
        );
        
        let embedding = vec![0.1, 0.2, 0.3, 0.4];
        memory.set_embedding(&embedding);
        
        let retrieved = memory.get_embedding();
        assert_eq!(retrieved.len(), 4);
    }
    
    #[test]
    fn test_vector_kernel() {
        let controller = b"controller";
        let did = create_agent_did(controller, AutonomyLevel::Bounded, vec![]).unwrap();
        
        let mut kernel = VectorStateKernel::new(100);
        
        let mut memory = VectorMemory::new(
            &did,
            MemoryType::Semantic,
            b"knowledge".to_vec(),
            "Test fact".into(),
        );
        memory.set_embedding(&[0.5, 0.5, 0.5, 0.5]);
        
        let id = kernel.store(memory).unwrap();
        
        let stats = kernel.stats(&did);
        assert_eq!(stats.semantic, 1);
        
        // Search
        let results = kernel.search(&did, &[0.4, 0.5, 0.6, 0.5], 10, None);
        assert_eq!(results.len(), 1);
    }
    
    #[test]
    fn test_cosine_similarity() {
        let a = vec![1.0, 0.0, 0.0];
        let b = vec![1.0, 0.0, 0.0];
        assert!((cosine_similarity(&a, &b) - 1.0).abs() < 0.0001);
        
        let c = vec![0.0, 1.0, 0.0];
        assert!(cosine_similarity(&a, &c).abs() < 0.0001);
    }
    
    #[test]
    fn test_agent_context() {
        let controller = b"controller";
        let did = create_agent_did(controller, AutonomyLevel::Bounded, vec![]).unwrap();
        
        let mut ctx = AgentContext::new(&did, "You are a trading agent.".into());
        
        inject_asset_context(
            &mut ctx,
            [1u8; 32],
            "Legendary Sword".into(),
            r#"{"mass": 2.5}"#.into(),
            r#"{"level": 10}"#.into(),
            "Legendary".into(),
            vec![("damage".into(), "100".into())],
        );
        
        let prompt = ctx.to_prompt_context();
        assert!(prompt.contains("trading agent"));
        assert!(prompt.contains("Legendary Sword"));
    }
}
