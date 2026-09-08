//! CVP Attack Simulation Test Harness
//!
//! Provides tools for simulating various attack patterns to test
//! the CVP detection and response system.

use crate::{
    CvpConsensusIntegration, CvpConfig, TransactionInfo,
    Threat, ThreatType,
    SemanticIR, ContractId,
};
use std::collections::HashMap;

/// Attack simulation harness
pub struct AttackSimulator {
    /// CVP integration instance
    cvp: CvpConsensusIntegration,
    
    /// Current simulated block number
    current_block: u64,
    
    /// Simulated block hashes
    block_hashes: Vec<[u8; 32]>,
    
    /// Statistics
    stats: SimulationStats,
}

/// Simulation statistics
#[derive(Debug, Default, Clone)]
pub struct SimulationStats {
    pub blocks_processed: u64,
    pub transactions_processed: u64,
    pub threats_detected: u64,
    pub threats_by_type: HashMap<ThreatType, u64>,
    pub threats_by_severity: HashMap<u8, u64>, // Severity as u8
    pub epoch_transitions: u64,
    pub mutations_performed: u64,
    pub emergency_mutations: u64,
}

impl SimulationStats {
    pub fn record_threat(&mut self, threat: &Threat) {
        self.threats_detected += 1;
        *self.threats_by_type.entry(threat.threat_type).or_insert(0) += 1;
        *self.threats_by_severity.entry(threat.severity as u8).or_insert(0) += 1;
    }
}

impl AttackSimulator {
    /// Create a new attack simulator
    pub fn new() -> Self {
        let config = CvpConfig {
            mutation_epoch_length: 10, // Short epochs for testing
            enabled: true,
            log_mutations: true,
            ..Default::default()
        };
        
        Self {
            cvp: CvpConsensusIntegration::new(config),
            current_block: 0,
            block_hashes: Vec::new(),
            stats: SimulationStats::default(),
        }
    }
    
    /// Create with custom epoch length
    pub fn with_epoch_length(epoch_length: u64) -> Self {
        let config = CvpConfig {
            mutation_epoch_length: epoch_length,
            enabled: true,
            log_mutations: true,
            ..Default::default()
        };
        
        Self {
            cvp: CvpConsensusIntegration::new(config),
            current_block: 0,
            block_hashes: Vec::new(),
            stats: SimulationStats::default(),
        }
    }
    
    /// Register a test contract
    pub fn register_contract(&self, name: &str) -> ContractId {
        use blake2::{Blake2b512, Digest};
        
        let mut hasher = Blake2b512::new();
        hasher.update(name.as_bytes());
        let hash = hasher.finalize();
        let mut id = [0u8; 32];
        id.copy_from_slice(&hash[..32]);
        
        let ir = SemanticIR::new(id, name.to_string());
        let bytecode = vec![0x60, 0x01, 0x60, 0x02, 0x01]; // Dummy bytecode
        
        self.cvp.register_contract(id, ir, bytecode).ok();
        
        id
    }
    
    /// Process a block with transactions
    pub fn process_block(&mut self, transactions: Vec<TransactionInfo>) -> Vec<Threat> {
        self.current_block += 1;
        
        // Generate block hash
        let block_hash = self.generate_block_hash(self.current_block);
        self.block_hashes.push(block_hash);
        if self.block_hashes.len() > 10 {
            self.block_hashes.remove(0);
        }
        
        self.stats.blocks_processed += 1;
        self.stats.transactions_processed += transactions.len() as u64;
        
        // Process through CVP
        let result = self.cvp.on_block_finalized(
            self.current_block,
            block_hash,
            &transactions,
        ).unwrap();
        
        // Update stats
        for threat in &result.threats_detected {
            self.stats.record_threat(threat);
        }
        
        if !result.epoch_mutations.is_empty() {
            self.stats.epoch_transitions += 1;
            self.stats.mutations_performed += result.epoch_mutations.len() as u64;
        }
        
        self.stats.emergency_mutations += result.emergency_mutations.len() as u64;
        
        result.threats_detected
    }
    
    /// Generate a deterministic block hash
    fn generate_block_hash(&self, block_number: u64) -> [u8; 32] {
        use blake2::{Blake2b512, Digest};
        let mut hasher = Blake2b512::new();
        hasher.update(b"test_block_");
        hasher.update(block_number.to_le_bytes());
        let hash = hasher.finalize();
        let mut result = [0u8; 32];
        result.copy_from_slice(&hash[..32]);
        result
    }
    
    /// Get current stats
    pub fn stats(&self) -> &SimulationStats {
        &self.stats
    }
    
    /// Get CVP stats
    pub fn cvp_stats(&self) -> crate::integration::CvpStats {
        self.cvp.stats()
    }
    
    /// Reset the simulator
    pub fn reset(&mut self) {
        self.current_block = 0;
        self.block_hashes.clear();
        self.stats = SimulationStats::default();
    }
}

impl Default for AttackSimulator {
    fn default() -> Self {
        Self::new()
    }
}

/// Attack pattern generators
pub mod attacks {
    use super::*;
    
    /// Generate a high-frequency attack pattern
    /// 
    /// Simulates an attacker calling the same function many times in one block
    pub fn high_frequency_attack(
        attacker: [u8; 32],
        target_contract: ContractId,
        function_selector: [u8; 4],
        num_calls: usize,
    ) -> Vec<TransactionInfo> {
        (0..num_calls)
            .map(|i| TransactionInfo {
                hash: generate_tx_hash(i as u64, &attacker),
                sender: attacker,
                target_contract: Some(target_contract),
                function_selector: Some(function_selector),
                gas_used: 50_000,
                value: 0,
                success: true,
                call_depth: 1,
                timestamp: 0,
            })
            .collect()
    }
    
    /// Generate a re-entrancy attack pattern
    /// 
    /// Simulates deep call depth from re-entrant calls
    pub fn reentrancy_attack(
        attacker: [u8; 32],
        target_contract: ContractId,
        call_depth: u8,
    ) -> Vec<TransactionInfo> {
        vec![TransactionInfo {
            hash: generate_tx_hash(0, &attacker),
            sender: attacker,
            target_contract: Some(target_contract),
            function_selector: Some([0xa9, 0x05, 0x9c, 0xbb]), // transfer
            gas_used: 500_000, // High gas for deep calls
            value: 1_000_000,
            success: true,
            call_depth,
            timestamp: 0,
        }]
    }
    
    /// Generate a sandwich attack pattern
    /// 
    /// Attacker front-runs victim, then back-runs
    pub fn sandwich_attack(
        attacker: [u8; 32],
        victim: [u8; 32],
        target_contract: ContractId,
    ) -> Vec<TransactionInfo> {
        vec![
            // Front-run: attacker buys
            TransactionInfo {
                hash: generate_tx_hash(1, &attacker),
                sender: attacker,
                target_contract: Some(target_contract),
                function_selector: Some([0x7f, 0xf3, 0x6a, 0xb5]), // swap
                gas_used: 150_000,
                value: 100_000,
                success: true,
                call_depth: 1,
                timestamp: 0,
            },
            // Victim's transaction
            TransactionInfo {
                hash: generate_tx_hash(2, &victim),
                sender: victim,
                target_contract: Some(target_contract),
                function_selector: Some([0x38, 0xed, 0x17, 0x39]), // swapExactTokens
                gas_used: 150_000,
                value: 50_000,
                success: true,
                call_depth: 1,
                timestamp: 0,
            },
            // Back-run: attacker sells
            TransactionInfo {
                hash: generate_tx_hash(3, &attacker),
                sender: attacker,
                target_contract: Some(target_contract),
                function_selector: Some([0x7f, 0xf3, 0x6a, 0xb5]), // swap
                gas_used: 150_000,
                value: 0,
                success: true,
                call_depth: 1,
                timestamp: 0,
            },
        ]
    }
    
    /// Generate a flash loan attack pattern
    pub fn flash_loan_attack(
        attacker: [u8; 32],
        lending_contract: ContractId,
        target_contract: ContractId,
        loan_amount: u128,
    ) -> Vec<TransactionInfo> {
        vec![
            // Flash loan borrow
            TransactionInfo {
                hash: generate_tx_hash(1, &attacker),
                sender: attacker,
                target_contract: Some(lending_contract),
                function_selector: Some([0x5c, 0xef, 0xf6, 0x20]), // flashLoan
                gas_used: 1_000_000,
                value: loan_amount,
                success: true,
                call_depth: 1,
                timestamp: 0,
            },
            // Attack action
            TransactionInfo {
                hash: generate_tx_hash(2, &attacker),
                sender: attacker,
                target_contract: Some(target_contract),
                function_selector: Some([0xa9, 0x05, 0x9c, 0xbb]), // transfer
                gas_used: 500_000,
                value: loan_amount / 2,
                success: true,
                call_depth: 3,
                timestamp: 0,
            },
        ]
    }
    
    /// Generate normal transaction traffic
    pub fn normal_traffic(num_txs: usize) -> Vec<TransactionInfo> {
        (0..num_txs)
            .map(|i| {
                let sender = [i as u8; 32];
                TransactionInfo {
                    hash: generate_tx_hash(i as u64, &sender),
                    sender,
                    target_contract: Some([0x01; 32]),
                    function_selector: Some([0xa9, 0x05, 0x9c, 0xbb]),
                    gas_used: 50_000,
                    value: 1000,
                    success: true,
                    call_depth: 1,
                    timestamp: 0,
                }
            })
            .collect()
    }
    
    /// Generate deterministic transaction hash
    fn generate_tx_hash(nonce: u64, sender: &[u8; 32]) -> [u8; 32] {
        use blake2::{Blake2b512, Digest};
        let mut hasher = Blake2b512::new();
        hasher.update(sender);
        hasher.update(nonce.to_le_bytes());
        let hash = hasher.finalize();
        let mut result = [0u8; 32];
        result.copy_from_slice(&hash[..32]);
        result
    }
}

/// Pre-built test scenarios
pub mod scenarios {
    use super::*;
    use attacks::*;
    
    /// Run a complete attack simulation scenario
    pub fn run_mixed_attack_scenario() -> SimulationStats {
        let mut sim = AttackSimulator::with_epoch_length(10);
        
        // Register test contracts
        let token_contract = sim.register_contract("TestToken");
        let dex_contract = sim.register_contract("TestDEX");
        let lending_contract = sim.register_contract("TestLending");
        
        let attacker = [0xAA; 32];
        let victim = [0xBB; 32];
        
        println!("=== CVP Attack Simulation ===\n");
        
        // Block 1-5: Normal traffic
        println!("Blocks 1-5: Normal traffic...");
        for _ in 0..5 {
            let txs = normal_traffic(5);
            let threats = sim.process_block(txs);
            if !threats.is_empty() {
                println!("  Threats detected: {:?}", threats.len());
            }
        }
        
        // Block 6: High-frequency attack
        println!("\nBlock 6: High-frequency attack (15 calls)...");
        let attack_txs = high_frequency_attack(
            attacker,
            token_contract,
            [0xa9, 0x05, 0x9c, 0xbb],
            15,
        );
        let threats = sim.process_block(attack_txs);
        for threat in &threats {
            println!("  THREAT: {:?} - {}", threat.threat_type, threat.description);
        }
        
        // Block 7: Re-entrancy attack
        println!("\nBlock 7: Re-entrancy attack (depth 7)...");
        let attack_txs = reentrancy_attack(attacker, token_contract, 7);
        let threats = sim.process_block(attack_txs);
        for threat in &threats {
            println!("  THREAT: {:?} - {}", threat.threat_type, threat.description);
        }
        
        // Block 8: Sandwich attack
        println!("\nBlock 8: Sandwich attack...");
        let attack_txs = sandwich_attack(attacker, victim, dex_contract);
        let threats = sim.process_block(attack_txs);
        for threat in &threats {
            println!("  THREAT: {:?} - {}", threat.threat_type, threat.description);
        }
        
        // Block 9: Flash loan attack
        println!("\nBlock 9: Flash loan attack...");
        let attack_txs = flash_loan_attack(
            attacker,
            lending_contract,
            token_contract,
            10_000_000_000, // 10B
        );
        let threats = sim.process_block(attack_txs);
        for threat in &threats {
            println!("  THREAT: {:?} - {}", threat.threat_type, threat.description);
        }
        
        // Block 10: Epoch transition (mutations should occur)
        println!("\nBlock 10: Epoch transition...");
        let txs = normal_traffic(3);
        let _threats = sim.process_block(txs);
        
        // Blocks 11-15: More normal traffic
        println!("\nBlocks 11-15: Post-mutation normal traffic...");
        for _ in 0..5 {
            let txs = normal_traffic(5);
            sim.process_block(txs);
        }
        
        // Print summary
        println!("\n=== Simulation Complete ===\n");
        let stats = sim.stats();
        println!("Blocks processed: {}", stats.blocks_processed);
        println!("Transactions processed: {}", stats.transactions_processed);
        println!("Threats detected: {}", stats.threats_detected);
        println!("Threats by type:");
        for (threat_type, count) in &stats.threats_by_type {
            println!("  {:?}: {}", threat_type, count);
        }
        println!("Epoch transitions: {}", stats.epoch_transitions);
        println!("Mutations performed: {}", stats.mutations_performed);
        println!("Emergency mutations: {}", stats.emergency_mutations);
        
        let cvp_stats = sim.cvp_stats();
        println!("\nCVP Engine Stats:");
        println!("  Current epoch: {}", cvp_stats.current_epoch);
        println!("  Registered contracts: {}", cvp_stats.registered_contracts);
        println!("  Total mutations: {}", cvp_stats.total_mutations);
        
        stats.clone()
    }
    
    /// Run a stress test with many blocks
    pub fn run_stress_test(num_blocks: u64, txs_per_block: usize) -> SimulationStats {
        let mut sim = AttackSimulator::with_epoch_length(100);
        
        // Register contracts
        let _token = sim.register_contract("StressToken");
        
        println!("Running stress test: {} blocks, {} txs/block", num_blocks, txs_per_block);
        
        for i in 0..num_blocks {
            let txs = normal_traffic(txs_per_block);
            sim.process_block(txs);
            
            if (i + 1) % 100 == 0 {
                println!("  Processed {} blocks...", i + 1);
            }
        }
        
        let stats = sim.stats();
        println!("\nStress Test Complete:");
        println!("  Blocks: {}", stats.blocks_processed);
        println!("  Transactions: {}", stats.transactions_processed);
        println!("  Epoch transitions: {}", stats.epoch_transitions);
        
        stats.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use attacks::*;
    
    #[test]
    fn test_high_frequency_detection() {
        let mut sim = AttackSimulator::new();
        let contract = sim.register_contract("TestContract");
        
        // Normal traffic should not trigger
        let normal = normal_traffic(5);
        let threats = sim.process_block(normal);
        assert!(threats.is_empty());
        
        // High frequency should trigger
        let attack = high_frequency_attack([0xAA; 32], contract, [0x01; 4], 15);
        let threats = sim.process_block(attack);
        
        assert!(!threats.is_empty());
        assert!(threats.iter().any(|t| t.threat_type == ThreatType::HighFrequency));
    }
    
    #[test]
    fn test_reentrancy_detection() {
        let mut sim = AttackSimulator::new();
        let contract = sim.register_contract("TestContract");
        
        // Deep call depth should trigger
        let attack = reentrancy_attack([0xAA; 32], contract, 7);
        let threats = sim.process_block(attack);
        
        assert!(!threats.is_empty());
        assert!(threats.iter().any(|t| t.threat_type == ThreatType::Reentrancy));
    }
    
    #[test]
    fn test_sandwich_detection() {
        let mut sim = AttackSimulator::new();
        let contract = sim.register_contract("TestDEX");
        
        let attack = sandwich_attack([0xAA; 32], [0xBB; 32], contract);
        let threats = sim.process_block(attack);
        
        assert!(!threats.is_empty());
        assert!(threats.iter().any(|t| t.threat_type == ThreatType::SandwichAttack));
    }
    
    #[test]
    fn test_epoch_transition() {
        let mut sim = AttackSimulator::with_epoch_length(5);
        let _contract = sim.register_contract("TestContract");
        
        // Process 6 blocks to trigger epoch transition
        for _ in 0..6 {
            let txs = normal_traffic(3);
            sim.process_block(txs);
        }
        
        assert!(sim.stats().epoch_transitions >= 1);
    }
    
    #[test]
    fn test_mixed_scenario() {
        let stats = scenarios::run_mixed_attack_scenario();
        
        // Should detect multiple threat types
        assert!(stats.threats_detected > 0);
        assert!(stats.threats_by_type.len() >= 2);
    }
}
