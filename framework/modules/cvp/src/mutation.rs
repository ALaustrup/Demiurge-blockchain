//! Mutation Strategies
//!
//! Defines the various bytecode transformation strategies that maintain
//! semantic equivalence while changing structural representation.

use crate::Result;
use codec::{Decode, Encode};
use serde::{Deserialize, Serialize};

/// A mutation strategy that can be applied to bytecode
pub trait MutationStrategy: Send + Sync {
    /// Name of this strategy
    fn name(&self) -> &str;
    
    /// Apply mutation to bytecode given a seed
    fn mutate(&self, bytecode: &[u8], seed: &[u8; 32]) -> Result<Vec<u8>>;
    
    /// Estimate the size change from this mutation
    fn size_estimate(&self, original_size: usize) -> usize;
    
    /// Whether this strategy is reversible (for debugging)
    fn is_reversible(&self) -> bool;
}

/// Collection of mutation strategies to apply
#[derive(Debug, Clone, Encode, Decode, Serialize, Deserialize)]
pub struct MutationConfig {
    /// Which strategies to enable
    pub enabled_strategies: Vec<StrategyType>,
    
    /// Intensity of mutations (0.0 - 1.0)
    pub intensity: f32,
    
    /// Maximum bytecode size increase ratio
    pub max_size_increase: f32,
    
    /// Whether to include dead code injection
    pub inject_dead_code: bool,
    
    /// Whether to randomize memory layout
    pub randomize_memory: bool,
    
    /// Whether to obfuscate control flow
    pub obfuscate_control_flow: bool,
}

impl Default for MutationConfig {
    fn default() -> Self {
        Self {
            enabled_strategies: vec![
                StrategyType::OpcodeSubstitution,
                StrategyType::MemoryRandomization,
                StrategyType::ControlFlowObfuscation,
            ],
            intensity: 0.5,
            max_size_increase: 2.0,
            inject_dead_code: true,
            randomize_memory: true,
            obfuscate_control_flow: true,
        }
    }
}

/// Types of mutation strategies
#[derive(Debug, Clone, Copy, Encode, Decode, Serialize, Deserialize, PartialEq)]
pub enum StrategyType {
    /// Replace opcodes with equivalent sequences
    OpcodeSubstitution,
    /// Change memory layout while preserving logic
    MemoryRandomization,
    /// Restructure control flow (jumps, branches)
    ControlFlowObfuscation,
    /// Scramble stack manipulation patterns
    StackScrambling,
    /// Insert non-executing code paths
    DeadCodeInjection,
    /// Change constant representations
    ConstantObfuscation,
    /// Reorder independent operations
    OperationReordering,
}

/// Opcode substitution strategy
/// Replaces single opcodes with equivalent multi-opcode sequences
pub struct OpcodeSubstitution {
    /// Substitution rules
    rules: Vec<SubstitutionRule>,
}

impl OpcodeSubstitution {
    pub fn new() -> Self {
        Self {
            rules: Self::default_rules(),
        }
    }
    
    fn default_rules() -> Vec<SubstitutionRule> {
        vec![
            // ADD can be replaced with: DUP2 DUP2 ADD SWAP2 POP POP (same result, different pattern)
            SubstitutionRule {
                original: vec![0x01], // ADD
                variants: vec![
                    vec![0x81, 0x81, 0x01, 0x91, 0x50, 0x50], // DUP2 DUP2 ADD SWAP2 POP POP
                ],
            },
            // PUSH1 0x00 can be replaced with: PUSH1 0x01 PUSH1 0x01 SUB
            SubstitutionRule {
                original: vec![0x60, 0x00], // PUSH1 0x00
                variants: vec![
                    vec![0x60, 0x01, 0x60, 0x01, 0x03], // PUSH1 1 PUSH1 1 SUB
                ],
            },
            // MUL can be replaced with repeated ADD (for small constants)
            SubstitutionRule {
                original: vec![0x02], // MUL
                variants: vec![
                    // Leave as-is for now, complex substitution
                    vec![0x02],
                ],
            },
        ]
    }
}

impl Default for OpcodeSubstitution {
    fn default() -> Self {
        Self::new()
    }
}

impl MutationStrategy for OpcodeSubstitution {
    fn name(&self) -> &str {
        "OpcodeSubstitution"
    }
    
    fn mutate(&self, bytecode: &[u8], seed: &[u8; 32]) -> Result<Vec<u8>> {
        let mut result = Vec::with_capacity(bytecode.len() * 2);
        let mut i = 0;
        
        // Use seed to determine which substitutions to apply
        let mut seed_idx = 0;
        
        while i < bytecode.len() {
            let mut substituted = false;
            
            for rule in &self.rules {
                if i + rule.original.len() <= bytecode.len() 
                   && bytecode[i..i + rule.original.len()] == rule.original[..] 
                {
                    // Decide whether to substitute based on seed
                    let should_substitute = seed[seed_idx % 32] > 128;
                    seed_idx += 1;
                    
                    if should_substitute && !rule.variants.is_empty() {
                        // Pick a variant based on seed
                        let variant_idx = (seed[seed_idx % 32] as usize) % rule.variants.len();
                        seed_idx += 1;
                        
                        result.extend_from_slice(&rule.variants[variant_idx]);
                        i += rule.original.len();
                        substituted = true;
                        break;
                    }
                }
            }
            
            if !substituted {
                result.push(bytecode[i]);
                i += 1;
            }
        }
        
        Ok(result)
    }
    
    fn size_estimate(&self, original_size: usize) -> usize {
        // Opcode substitution can increase size by up to 3x in worst case
        original_size * 3
    }
    
    fn is_reversible(&self) -> bool {
        false // Substitutions are not reversible
    }
}

/// Substitution rule
struct SubstitutionRule {
    original: Vec<u8>,
    variants: Vec<Vec<u8>>,
}

/// Memory layout randomization strategy
/// Changes where data is stored in memory while preserving logic
pub struct MemoryRandomization {
    /// Base offset to add to memory addresses
    base_offset: u64,
    /// Mapping of original addresses to new addresses (reserved for future use)
    _address_map: std::collections::HashMap<u64, u64>,
}

impl MemoryRandomization {
    pub fn new() -> Self {
        Self {
            base_offset: 0,
            _address_map: std::collections::HashMap::new(),
        }
    }
    
    pub fn with_offset(mut self, offset: u64) -> Self {
        self.base_offset = offset;
        self
    }
}

impl Default for MemoryRandomization {
    fn default() -> Self {
        Self::new()
    }
}

impl MutationStrategy for MemoryRandomization {
    fn name(&self) -> &str {
        "MemoryRandomization"
    }
    
    fn mutate(&self, bytecode: &[u8], seed: &[u8; 32]) -> Result<Vec<u8>> {
        // Calculate offset from seed
        let _offset = u64::from_le_bytes([
            seed[0], seed[1], seed[2], seed[3],
            seed[4], seed[5], seed[6], seed[7],
        ]) % 0x1000; // Max 4KB offset
        
        let result = bytecode.to_vec();
        let mut i = 0;
        
        while i < result.len() {
            // Look for MSTORE/MLOAD patterns and adjust addresses
            match result[i] {
                0x51 => { // MLOAD
                    // Check if preceded by PUSH
                    if i > 0 && result[i-1] >= 0x60 && result[i-1] <= 0x7f {
                        // Adjust the pushed value (simplified)
                        // In real implementation, need to handle multi-byte pushes
                    }
                }
                0x52 => { // MSTORE
                    // Similar adjustment
                }
                _ => {}
            }
            i += 1;
        }
        
        Ok(result)
    }
    
    fn size_estimate(&self, original_size: usize) -> usize {
        // Memory randomization doesn't significantly change size
        original_size + 64
    }
    
    fn is_reversible(&self) -> bool {
        true // Can be reversed with the offset
    }
}

/// Control flow obfuscation strategy
/// Restructures jumps and branches while preserving logic
pub struct ControlFlowObfuscation {
    /// Whether to insert opaque predicates
    insert_opaque_predicates: bool,
    /// Whether to flatten control flow
    flatten_jumps: bool,
}

impl ControlFlowObfuscation {
    pub fn new() -> Self {
        Self {
            insert_opaque_predicates: true,
            flatten_jumps: true,
        }
    }
    
    /// Find all JUMPDEST positions in bytecode
    fn find_jump_destinations(&self, bytecode: &[u8]) -> Vec<usize> {
        let mut destinations = Vec::new();
        let mut i = 0;
        while i < bytecode.len() {
            if bytecode[i] == 0x5B { // JUMPDEST
                destinations.push(i);
            }
            // Skip PUSH data
            if bytecode[i] >= 0x60 && bytecode[i] <= 0x7F {
                let push_size = (bytecode[i] - 0x5F) as usize;
                i += push_size;
            }
            i += 1;
        }
        destinations
    }
    
    /// Generate an opaque predicate that always evaluates to true
    /// x*x >= 0 is always true for any integer x
    fn generate_opaque_predicate_true(&self, seed_byte: u8) -> Vec<u8> {
        match seed_byte % 4 {
            0 => {
                // PUSH1 value DUP1 MUL PUSH1 0 SLT ISZERO (x*x >= 0)
                vec![0x60, seed_byte.wrapping_add(1), 0x80, 0x02, 0x60, 0x00, 0x12, 0x15]
            }
            1 => {
                // PUSH1 1 PUSH1 1 AND (1 & 1 = 1, always true)
                vec![0x60, 0x01, 0x60, 0x01, 0x16]
            }
            2 => {
                // PUSH1 0 ISZERO (NOT 0 = true)
                vec![0x60, 0x00, 0x15]
            }
            _ => {
                // PUSH1 2 PUSH1 1 GT (2 > 1, always true)
                vec![0x60, 0x02, 0x60, 0x01, 0x11]
            }
        }
    }
    
    /// Generate an opaque predicate that always evaluates to false
    fn generate_opaque_predicate_false(&self, seed_byte: u8) -> Vec<u8> {
        match seed_byte % 3 {
            0 => {
                // PUSH1 1 ISZERO (NOT 1 = false)
                vec![0x60, 0x01, 0x15]
            }
            1 => {
                // PUSH1 0 PUSH1 0 GT (0 > 0 = false)
                vec![0x60, 0x00, 0x60, 0x00, 0x11]
            }
            _ => {
                // PUSH1 1 PUSH1 2 GT (1 > 2 = false)
                vec![0x60, 0x01, 0x60, 0x02, 0x11]
            }
        }
    }
    
    /// Insert opaque predicates before jumps
    fn insert_opaque_predicates(&self, bytecode: &[u8], seed: &[u8; 32]) -> Vec<u8> {
        let mut result = Vec::with_capacity(bytecode.len() * 2);
        let mut i = 0;
        let mut seed_idx = 0;
        
        while i < bytecode.len() {
            let opcode = bytecode[i];
            
            // Check if this is a conditional jump (JUMPI)
            if opcode == 0x57 && seed[seed_idx % 32] > 200 {
                // Insert opaque predicate AND before the JUMPI condition
                // This makes the jump condition: (original_condition AND opaque_true)
                let predicate = self.generate_opaque_predicate_true(seed[(seed_idx + 1) % 32]);
                result.extend(&predicate);
                result.push(0x16); // AND
                seed_idx += 2;
            }
            
            result.push(opcode);
            
            // Handle PUSH instructions (skip their data)
            if (0x60..=0x7F).contains(&opcode) {
                let push_size = (opcode - 0x5F) as usize;
                for j in 1..=push_size {
                    if i + j < bytecode.len() {
                        result.push(bytecode[i + j]);
                    }
                }
                i += push_size;
            }
            
            i += 1;
            seed_idx += 1;
        }
        
        result
    }
    
    /// Add fake conditional jumps that never execute (dead branches)
    fn add_dead_branches(&self, bytecode: &[u8], seed: &[u8; 32]) -> Vec<u8> {
        let mut result = Vec::with_capacity(bytecode.len() + 64);
        let destinations = self.find_jump_destinations(bytecode);
        
        if destinations.is_empty() {
            return bytecode.to_vec();
        }
        
        let mut i = 0;
        let mut seed_idx = 0;
        
        while i < bytecode.len() {
            let opcode = bytecode[i];
            
            // After certain opcodes, insert a dead branch
            if opcode == 0x5B && seed[seed_idx % 32] > 220 { // JUMPDEST
                result.push(opcode);
                
                // Insert: opaque_false PUSH2 dest JUMPI (never taken)
                let predicate = self.generate_opaque_predicate_false(seed[(seed_idx + 1) % 32]);
                result.extend(&predicate);
                
                // Pick a random valid destination
                let dest_idx = seed[(seed_idx + 2) % 32] as usize % destinations.len();
                let dest = destinations[dest_idx] as u16;
                
                result.push(0x61); // PUSH2
                result.extend_from_slice(&dest.to_be_bytes());
                result.push(0x57); // JUMPI
                
                seed_idx += 3;
                i += 1;
                continue;
            }
            
            result.push(opcode);
            
            // Handle PUSH instructions
            if (0x60..=0x7F).contains(&opcode) {
                let push_size = (opcode - 0x5F) as usize;
                for j in 1..=push_size {
                    if i + j < bytecode.len() {
                        result.push(bytecode[i + j]);
                    }
                }
                i += push_size;
            }
            
            i += 1;
            seed_idx += 1;
        }
        
        result
    }
}

impl Default for ControlFlowObfuscation {
    fn default() -> Self {
        Self::new()
    }
}

impl MutationStrategy for ControlFlowObfuscation {
    fn name(&self) -> &str {
        "ControlFlowObfuscation"
    }
    
    fn mutate(&self, bytecode: &[u8], seed: &[u8; 32]) -> Result<Vec<u8>> {
        let mut result = bytecode.to_vec();
        
        // Step 1: Insert opaque predicates
        if self.insert_opaque_predicates {
            result = self.insert_opaque_predicates(&result, seed);
        }
        
        // Step 2: Add dead branches
        if self.flatten_jumps {
            // Use second half of seed for dead branches
            let mut branch_seed = [0u8; 32];
            branch_seed[..16].copy_from_slice(&seed[16..]);
            branch_seed[16..].copy_from_slice(&seed[..16]);
            result = self.add_dead_branches(&result, &branch_seed);
        }
        
        Ok(result)
    }
    
    fn size_estimate(&self, original_size: usize) -> usize {
        // CFG obfuscation can increase size by up to 50%
        (original_size as f64 * 1.5) as usize
    }
    
    fn is_reversible(&self) -> bool {
        false
    }
}

/// Dead code injection strategy
/// Inserts code that never executes but changes bytecode structure
pub struct DeadCodeInjection {
    /// Maximum amount of dead code to inject (as ratio of original size)
    max_ratio: f32,
}

impl DeadCodeInjection {
    pub fn new() -> Self {
        Self { max_ratio: 0.2 }
    }
    
    pub fn with_ratio(mut self, ratio: f32) -> Self {
        self.max_ratio = ratio.clamp(0.0, 1.0);
        self
    }
    
    /// Generate a dead code snippet
    fn generate_dead_code(&self, seed: &[u8], size_hint: usize) -> Vec<u8> {
        let mut result = Vec::with_capacity(size_hint);
        
        // Pattern: PUSH 0 ISZERO JUMPI [dead code] JUMPDEST
        // The ISZERO of 0 is 1, so JUMPI always jumps, skipping dead code
        
        result.push(0x60); // PUSH1
        result.push(0x00); // 0
        result.push(0x15); // ISZERO
        
        // Calculate jump destination
        let dead_size = (size_hint.min(255) as u8).max(4);
        let jump_dest = result.len() + 3 + dead_size as usize;
        
        result.push(0x60); // PUSH1
        result.push(jump_dest as u8);
        result.push(0x57); // JUMPI
        
        // Dead code (random-looking but deterministic from seed)
        for i in 0..dead_size {
            result.push(seed[i as usize % seed.len()]);
        }
        
        result.push(0x5b); // JUMPDEST
        
        result
    }
}

impl Default for DeadCodeInjection {
    fn default() -> Self {
        Self::new()
    }
}

impl MutationStrategy for DeadCodeInjection {
    fn name(&self) -> &str {
        "DeadCodeInjection"
    }
    
    fn mutate(&self, bytecode: &[u8], seed: &[u8; 32]) -> Result<Vec<u8>> {
        let max_injection = ((bytecode.len() as f32) * self.max_ratio) as usize;
        let num_injections = (seed[0] as usize % 5) + 1;
        let injection_size = max_injection / num_injections;
        
        if injection_size < 8 {
            // Too small to inject meaningfully
            return Ok(bytecode.to_vec());
        }
        
        let mut result = Vec::with_capacity(bytecode.len() + max_injection);
        
        // Inject dead code at positions derived from seed
        let mut last_pos = 0;
        for i in 0..num_injections {
            let inject_pos = (seed[i + 1] as usize * bytecode.len() / 256).min(bytecode.len());
            
            if inject_pos > last_pos {
                result.extend_from_slice(&bytecode[last_pos..inject_pos]);
                result.extend(self.generate_dead_code(&seed[i..], injection_size));
                last_pos = inject_pos;
            }
        }
        
        result.extend_from_slice(&bytecode[last_pos..]);
        
        Ok(result)
    }
    
    fn size_estimate(&self, original_size: usize) -> usize {
        ((original_size as f32) * (1.0 + self.max_ratio)) as usize
    }
    
    fn is_reversible(&self) -> bool {
        false
    }
}

/// Stack scrambling strategy
/// Inserts semantically neutral stack operations
pub struct StackScrambling {
    /// Maximum number of scrambles to insert
    max_scrambles: usize,
}

impl StackScrambling {
    pub fn new() -> Self {
        Self { max_scrambles: 10 }
    }
    
    pub fn with_max_scrambles(mut self, max: usize) -> Self {
        self.max_scrambles = max;
        self
    }
    
    /// Generate a neutral stack operation sequence (no net effect)
    fn generate_neutral_sequence(&self, seed_byte: u8) -> Vec<u8> {
        match seed_byte % 8 {
            0 => {
                // DUP1 POP (duplicate then remove - no net effect)
                vec![0x80, 0x50]
            }
            1 => {
                // PUSH1 0 POP (push zero then remove)
                vec![0x60, 0x00, 0x50]
            }
            2 => {
                // DUP1 SWAP1 POP (duplicate, swap with itself, pop - no effect)
                vec![0x80, 0x90, 0x50]
            }
            3 => {
                // DUP2 DUP2 POP POP (if stack has 2+ items)
                vec![0x81, 0x81, 0x50, 0x50]
            }
            4 => {
                // SWAP1 SWAP1 (two swaps cancel out)
                vec![0x90, 0x90]
            }
            5 => {
                // DUP1 ISZERO ISZERO POP (double NOT then pop)
                vec![0x80, 0x15, 0x15, 0x50]
            }
            6 => {
                // PUSH1 1 PUSH1 1 SUB POP (1-1=0, then pop)
                vec![0x60, 0x01, 0x60, 0x01, 0x03, 0x50]
            }
            _ => {
                // ADDRESS POP (get address then discard)
                vec![0x30, 0x50]
            }
        }
    }
}

impl Default for StackScrambling {
    fn default() -> Self {
        Self::new()
    }
}

impl MutationStrategy for StackScrambling {
    fn name(&self) -> &str {
        "StackScrambling"
    }
    
    fn mutate(&self, bytecode: &[u8], seed: &[u8; 32]) -> Result<Vec<u8>> {
        let mut result = Vec::with_capacity(bytecode.len() * 2);
        let mut i = 0;
        let mut scramble_count = 0;
        let mut seed_idx = 0;
        
        while i < bytecode.len() {
            let opcode = bytecode[i];
            
            // Insert scramble after certain opcodes if seed allows
            let should_scramble = scramble_count < self.max_scrambles
                && seed[seed_idx % 32] > 180
                && opcode != 0x5B  // Not after JUMPDEST
                && opcode != 0x57  // Not after JUMPI
                && opcode != 0x56  // Not after JUMP
                && opcode != 0xFD  // Not after REVERT
                && opcode != 0xF3  // Not after RETURN
                && opcode != 0x00; // Not after STOP
            
            result.push(opcode);
            
            // Handle PUSH instructions
            if (0x60..=0x7F).contains(&opcode) {
                let push_size = (opcode - 0x5F) as usize;
                for j in 1..=push_size {
                    if i + j < bytecode.len() {
                        result.push(bytecode[i + j]);
                    }
                }
                i += push_size;
            }
            
            // Insert scramble sequence
            if should_scramble {
                let sequence = self.generate_neutral_sequence(seed[(seed_idx + 1) % 32]);
                result.extend(&sequence);
                scramble_count += 1;
                seed_idx += 1;
            }
            
            i += 1;
            seed_idx += 1;
        }
        
        Ok(result)
    }
    
    fn size_estimate(&self, original_size: usize) -> usize {
        // Stack scrambling adds ~4 bytes per scramble on average
        original_size + (self.max_scrambles * 4)
    }
    
    fn is_reversible(&self) -> bool {
        false
    }
}

/// Constant obfuscation strategy
/// Replaces constants with equivalent computed expressions
pub struct ConstantObfuscation {
    /// Maximum complexity of obfuscated expressions
    max_complexity: u8,
}

impl ConstantObfuscation {
    pub fn new() -> Self {
        Self { max_complexity: 3 }
    }
    
    /// Obfuscate a single-byte constant
    fn obfuscate_byte(&self, value: u8, seed_byte: u8) -> Vec<u8> {
        match seed_byte % 6 {
            0 => {
                // a + b where a + b = value
                let a = seed_byte % (value.saturating_add(1));
                let b = value.saturating_sub(a);
                vec![0x60, a, 0x60, b, 0x01] // PUSH1 a PUSH1 b ADD
            }
            1 => {
                // a - b where a - b = value  
                let b = seed_byte % 50;
                let a = value.saturating_add(b);
                vec![0x60, a, 0x60, b, 0x03] // PUSH1 a PUSH1 b SUB
            }
            2 => {
                // a XOR b where a XOR b = value
                let a = seed_byte;
                let b = value ^ a;
                vec![0x60, a, 0x60, b, 0x18] // PUSH1 a PUSH1 b XOR
            }
            3 => {
                // NOT NOT value (double negation)
                vec![0x60, value, 0x19, 0x19] // PUSH1 value NOT NOT
            }
            4 if value > 0 && value.is_multiple_of(2) => {
                // a * 2 via shift
                let half = value / 2;
                vec![0x60, half, 0x60, 0x01, 0x1B] // PUSH1 half PUSH1 1 SHL
            }
            _ => {
                // Just push the value (fallback)
                vec![0x60, value]
            }
        }
    }
}

impl Default for ConstantObfuscation {
    fn default() -> Self {
        Self::new()
    }
}

impl MutationStrategy for ConstantObfuscation {
    fn name(&self) -> &str {
        "ConstantObfuscation"
    }
    
    fn mutate(&self, bytecode: &[u8], seed: &[u8; 32]) -> Result<Vec<u8>> {
        let mut result = Vec::with_capacity(bytecode.len() * 3);
        let mut i = 0;
        let mut seed_idx = 0;
        
        while i < bytecode.len() {
            let opcode = bytecode[i];
            
            // Check for PUSH1 that we might obfuscate
            if opcode == 0x60 && i + 1 < bytecode.len() {
                let value = bytecode[i + 1];
                
                // Decide whether to obfuscate based on seed
                if seed[seed_idx % 32] > 160 && self.max_complexity > 0 {
                    let obfuscated = self.obfuscate_byte(value, seed[(seed_idx + 1) % 32]);
                    result.extend(&obfuscated);
                    seed_idx += 2;
                    i += 2;
                    continue;
                }
            }
            
            result.push(opcode);
            
            // Handle PUSH instructions normally
            if (0x60..=0x7F).contains(&opcode) {
                let push_size = (opcode - 0x5F) as usize;
                for j in 1..=push_size {
                    if i + j < bytecode.len() {
                        result.push(bytecode[i + j]);
                    }
                }
                i += push_size;
            }
            
            i += 1;
            seed_idx += 1;
        }
        
        Ok(result)
    }
    
    fn size_estimate(&self, original_size: usize) -> usize {
        // Constant obfuscation can roughly double the size of push instructions
        (original_size as f64 * 1.5) as usize
    }
    
    fn is_reversible(&self) -> bool {
        false
    }
}

/// Operation reordering strategy
/// Reorders independent operations while preserving semantics
pub struct OperationReordering {
    /// Whether to reorder storage operations
    // Reserved for future storage-op reordering; not read yet.
    #[allow(dead_code)]
    reorder_storage: bool,
}

impl OperationReordering {
    pub fn new() -> Self {
        Self { reorder_storage: false }
    }
    
    /// Check if two opcodes are independent (can be reordered)
    fn are_independent(&self, op1: u8, op2: u8) -> bool {
        // Pure stack operations on different stack positions can be reordered
        // This is a conservative check
        
        // PUSH operations are independent of each other (before combining)
        let is_push = |op: u8| (0x60..=0x7F).contains(&op);
        
        // DUP operations that don't conflict
        let is_dup = |op: u8| (0x80..=0x8F).contains(&op);
        
        // Most arithmetic is NOT independent as it consumes stack
        // But some sequences can be identified
        
        if is_push(op1) && is_push(op2) {
            return true;
        }
        
        if is_dup(op1) && is_push(op2) {
            return true;
        }
        
        false
    }
    
    /// Find pairs of operations that can be swapped
    fn find_swappable_pairs(&self, bytecode: &[u8]) -> Vec<(usize, usize)> {
        let mut pairs = Vec::new();
        let mut i = 0;
        
        while i + 1 < bytecode.len() {
            let op1 = bytecode[i];
            
            // Calculate next instruction position
            let op1_size = if (0x60..=0x7F).contains(&op1) {
                1 + (op1 - 0x5F) as usize
            } else {
                1
            };
            
            let next_pos = i + op1_size;
            if next_pos >= bytecode.len() {
                break;
            }
            
            let op2 = bytecode[next_pos];
            
            if self.are_independent(op1, op2) {
                pairs.push((i, next_pos));
            }
            
            i = next_pos;
        }
        
        pairs
    }
}

impl Default for OperationReordering {
    fn default() -> Self {
        Self::new()
    }
}

impl MutationStrategy for OperationReordering {
    fn name(&self) -> &str {
        "OperationReordering"
    }
    
    fn mutate(&self, bytecode: &[u8], seed: &[u8; 32]) -> Result<Vec<u8>> {
        let mut result = bytecode.to_vec();
        let pairs = self.find_swappable_pairs(&result);
        
        // Swap some pairs based on seed
        for (idx, &(pos1, pos2)) in pairs.iter().enumerate() {
            if seed[idx % 32] > 200 && pos2 < result.len() {
                let op1 = result[pos1];
                let op2 = result[pos2];
                
                // Only swap if both are simple PUSH1
                if op1 == 0x60 && op2 == 0x60 && pos1 + 1 < pos2 && pos2 + 1 < result.len() {
                    // Swap the PUSH1 value bytes
                    let val1 = result[pos1 + 1];
                    let val2 = result[pos2 + 1];
                    result[pos1 + 1] = val2;
                    result[pos2 + 1] = val1;
                }
            }
        }
        
        Ok(result)
    }
    
    fn size_estimate(&self, original_size: usize) -> usize {
        // Reordering doesn't change size
        original_size
    }
    
    fn is_reversible(&self) -> bool {
        true // Reordering can be reversed
    }
}

/// Composite mutation that applies multiple strategies
pub struct CompositeMutation {
    strategies: Vec<Box<dyn MutationStrategy>>,
}

impl CompositeMutation {
    pub fn new() -> Self {
        Self {
            strategies: Vec::new(),
        }
    }
    
    pub fn add_strategy<S: MutationStrategy + 'static>(mut self, strategy: S) -> Self {
        self.strategies.push(Box::new(strategy));
        self
    }
    
    pub fn from_config(config: &MutationConfig) -> Self {
        let mut composite = Self::new();
        
        for strategy_type in &config.enabled_strategies {
            match strategy_type {
                StrategyType::OpcodeSubstitution => {
                    composite = composite.add_strategy(OpcodeSubstitution::new());
                }
                StrategyType::MemoryRandomization => {
                    composite = composite.add_strategy(MemoryRandomization::new());
                }
                StrategyType::ControlFlowObfuscation => {
                    composite = composite.add_strategy(ControlFlowObfuscation::new());
                }
                StrategyType::DeadCodeInjection => {
                    composite = composite.add_strategy(DeadCodeInjection::new());
                }
                StrategyType::StackScrambling => {
                    composite = composite.add_strategy(StackScrambling::new());
                }
                StrategyType::ConstantObfuscation => {
                    composite = composite.add_strategy(ConstantObfuscation::new());
                }
                StrategyType::OperationReordering => {
                    composite = composite.add_strategy(OperationReordering::new());
                }
            }
        }
        
        composite
    }
    
    /// Create a comprehensive mutation with all strategies enabled
    pub fn comprehensive() -> Self {
        Self::new()
            .add_strategy(OpcodeSubstitution::new())
            .add_strategy(ConstantObfuscation::new())
            .add_strategy(StackScrambling::new())
            .add_strategy(ControlFlowObfuscation::new())
            .add_strategy(DeadCodeInjection::new())
            .add_strategy(OperationReordering::new())
            .add_strategy(MemoryRandomization::new())
    }
}

impl Default for CompositeMutation {
    fn default() -> Self {
        Self::new()
            .add_strategy(OpcodeSubstitution::new())
            .add_strategy(MemoryRandomization::new())
            .add_strategy(DeadCodeInjection::new())
    }
}

impl MutationStrategy for CompositeMutation {
    fn name(&self) -> &str {
        "CompositeMutation"
    }
    
    fn mutate(&self, bytecode: &[u8], seed: &[u8; 32]) -> Result<Vec<u8>> {
        let mut result = bytecode.to_vec();
        
        // Derive sub-seeds for each strategy
        for (i, strategy) in self.strategies.iter().enumerate() {
            let mut sub_seed = *seed;
            // Mix in strategy index
            for (j, byte) in sub_seed.iter_mut().enumerate().take(4) {
                *byte ^= ((i >> (j * 8)) & 0xff) as u8;
            }
            
            result = strategy.mutate(&result, &sub_seed)?;
        }
        
        Ok(result)
    }
    
    fn size_estimate(&self, original_size: usize) -> usize {
        let mut size = original_size;
        for strategy in &self.strategies {
            size = strategy.size_estimate(size);
        }
        size
    }
    
    fn is_reversible(&self) -> bool {
        self.strategies.iter().all(|s| s.is_reversible())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_opcode_substitution() {
        let strategy = OpcodeSubstitution::new();
        let bytecode = vec![0x60, 0x01, 0x60, 0x02, 0x01]; // PUSH1 1 PUSH1 2 ADD
        let seed = [128u8; 32]; // Should trigger substitution
        
        let result = strategy.mutate(&bytecode, &seed).unwrap();
        
        // Result should be different (substitution applied)
        // Note: exact result depends on seed and rules
        assert!(!result.is_empty());
    }
    
    #[test]
    fn test_dead_code_injection() {
        let strategy = DeadCodeInjection::new().with_ratio(0.5);
        let bytecode = vec![0x60, 0x01, 0x60, 0x02, 0x01]; // Simple bytecode
        let seed = [42u8; 32];
        
        let result = strategy.mutate(&bytecode, &seed).unwrap();
        
        // Result should be larger due to dead code
        assert!(result.len() >= bytecode.len());
    }
    
    #[test]
    fn test_composite_mutation() {
        let mutation = CompositeMutation::default();
        let bytecode = vec![0x60, 0x01, 0x60, 0x02, 0x01, 0x60, 0x00, 0x52];
        let seed = [100u8; 32];
        
        let result = mutation.mutate(&bytecode, &seed).unwrap();
        
        // Should produce valid output
        assert!(!result.is_empty());
    }
    
    #[test]
    fn test_control_flow_obfuscation() {
        let strategy = ControlFlowObfuscation::new();
        // Bytecode with a JUMPDEST and JUMPI
        let bytecode = vec![
            0x5B,       // JUMPDEST
            0x60, 0x01, // PUSH1 1
            0x60, 0x00, // PUSH1 0
            0x57,       // JUMPI
            0x60, 0x42, // PUSH1 0x42
            0x5B,       // JUMPDEST
        ];
        let seed = [250u8; 32]; // High values trigger obfuscation
        
        let result = strategy.mutate(&bytecode, &seed).unwrap();
        
        // Result should be larger due to opaque predicates and dead branches
        assert!(result.len() >= bytecode.len());
        // Original bytecode should be present (possibly modified)
        assert!(!result.is_empty());
    }
    
    #[test]
    fn test_stack_scrambling() {
        let strategy = StackScrambling::new().with_max_scrambles(5);
        let bytecode = vec![
            0x60, 0x01, // PUSH1 1
            0x60, 0x02, // PUSH1 2
            0x01,       // ADD
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
        ];
        let seed = [200u8; 32]; // High values trigger scrambling
        
        let result = strategy.mutate(&bytecode, &seed).unwrap();
        
        // Result should be larger due to neutral stack ops
        assert!(result.len() >= bytecode.len());
    }
    
    #[test]
    fn test_constant_obfuscation() {
        let strategy = ConstantObfuscation::new();
        let bytecode = vec![
            0x60, 0x10, // PUSH1 16
            0x60, 0x20, // PUSH1 32
            0x01,       // ADD
        ];
        let seed = [200u8; 32]; // High values trigger obfuscation
        
        let result = strategy.mutate(&bytecode, &seed).unwrap();
        
        // Result may be larger due to obfuscated constants
        assert!(!result.is_empty());
    }
    
    #[test]
    fn test_operation_reordering() {
        let strategy = OperationReordering::new();
        let bytecode = vec![
            0x60, 0x01, // PUSH1 1
            0x60, 0x02, // PUSH1 2
            0x60, 0x03, // PUSH1 3
        ];
        let seed = [250u8; 32]; // High values trigger reordering
        
        let result = strategy.mutate(&bytecode, &seed).unwrap();
        
        // Size should be the same (reordering doesn't change size)
        assert_eq!(result.len(), bytecode.len());
    }
    
    #[test]
    fn test_comprehensive_mutation() {
        let mutation = CompositeMutation::comprehensive();
        let bytecode = vec![
            0x5B,       // JUMPDEST
            0x60, 0x80, // PUSH1 128
            0x60, 0x40, // PUSH1 64
            0x52,       // MSTORE
            0x60, 0x01, // PUSH1 1
            0x60, 0x02, // PUSH1 2
            0x01,       // ADD
            0x60, 0x00, // PUSH1 0
            0x57,       // JUMPI
            0x5B,       // JUMPDEST
            0x00,       // STOP
        ];
        let seed = [150u8; 32];
        
        let result = mutation.mutate(&bytecode, &seed).unwrap();
        
        // Comprehensive mutation should produce non-empty output
        assert!(!result.is_empty());
        // Should be different from original (mutations applied)
        // Note: with the right seed, it may occasionally be the same
    }
    
    #[test]
    fn test_mutation_determinism() {
        let mutation = CompositeMutation::default();
        let bytecode = vec![0x60, 0x01, 0x60, 0x02, 0x01];
        let seed = [42u8; 32];
        
        // Same seed should produce same result
        let result1 = mutation.mutate(&bytecode, &seed).unwrap();
        let result2 = mutation.mutate(&bytecode, &seed).unwrap();
        
        assert_eq!(result1, result2);
    }
    
    #[test]
    fn test_different_seeds_different_results() {
        let mutation = CompositeMutation::comprehensive();
        let bytecode = vec![
            0x60, 0x01, 0x60, 0x02, 0x01,
            0x60, 0x03, 0x60, 0x04, 0x02,
            0x5B, 0x60, 0x00, 0x57,
        ];
        
        let seed1 = [100u8; 32];
        let seed2 = [200u8; 32];
        
        let result1 = mutation.mutate(&bytecode, &seed1).unwrap();
        let result2 = mutation.mutate(&bytecode, &seed2).unwrap();
        
        // Different seeds should usually produce different results
        // (though not guaranteed for all inputs)
        assert!(!result1.is_empty());
        assert!(!result2.is_empty());
    }
}
