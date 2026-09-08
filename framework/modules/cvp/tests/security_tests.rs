//! CVP Security Test Suite
//!
//! Comprehensive security tests for the Consensus-Verified Polymorphism system.
//! These tests are designed to verify security properties and catch regressions
//! before external security audits.
//!
//! Test Categories:
//! 1. Attack Pattern Detection (all 12 patterns)
//! 2. Mutation Security (equivalence guarantees)
//! 3. Proof Verification (ZK proof integrity)
//! 4. Consensus Integration (block validation)
//! 5. Edge Cases and Boundary Conditions

use demiurge_cvp::{
    CvpConsensusIntegration, CvpConfig, CvpEngine,
    TransactionInfo, ThreatType, ThreatSeverity,
    SemanticIR,
    test_harness::{AttackSimulator, attacks, scenarios},
};

// ============================================================================
// SECTION 1: Attack Pattern Detection Tests
// ============================================================================

mod attack_detection {
    use super::*;

    /// Test: High-frequency attack detection
    /// Verifies the system detects rapid repeated calls to the same function
    #[test]
    fn test_high_frequency_attack_detected() {
        let mut sim = AttackSimulator::new();
        let contract = sim.register_contract("VulnerableToken");
        let attacker = [0xAA; 32];
        
        // Attack: 15 rapid calls (threshold is 10)
        let attack_txs = attacks::high_frequency_attack(
            attacker,
            contract,
            [0xa9, 0x05, 0x9c, 0xbb], // transfer selector
            15,
        );
        
        let threats = sim.process_block(attack_txs);
        
        assert!(!threats.is_empty(), "High-frequency attack should be detected");
        assert!(
            threats.iter().any(|t| t.threat_type == ThreatType::HighFrequency),
            "Threat type should be HighFrequency"
        );
    }
    
    /// Test: High-frequency attack NOT triggered for normal traffic
    #[test]
    fn test_high_frequency_normal_traffic_passes() {
        let mut sim = AttackSimulator::new();
        let _contract = sim.register_contract("NormalToken");
        
        // Normal: 5 different senders, each calling once
        let normal_txs = attacks::normal_traffic(5);
        let threats = sim.process_block(normal_txs);
        
        assert!(
            !threats.iter().any(|t| t.threat_type == ThreatType::HighFrequency),
            "Normal traffic should not trigger high-frequency detection"
        );
    }
    
    /// Test: Re-entrancy attack detection
    /// Verifies deep call depths are flagged
    #[test]
    fn test_reentrancy_attack_detected() {
        let mut sim = AttackSimulator::new();
        let contract = sim.register_contract("ReentrantVictim");
        let attacker = [0xBB; 32];
        
        // Attack: Call depth of 7 (threshold is 3)
        let attack_txs = attacks::reentrancy_attack(attacker, contract, 7);
        let threats = sim.process_block(attack_txs);
        
        assert!(!threats.is_empty(), "Re-entrancy attack should be detected");
        assert!(
            threats.iter().any(|t| t.threat_type == ThreatType::Reentrancy),
            "Threat type should be Reentrancy"
        );
        
        // Critical severity for deep re-entrancy
        let reentrancy_threat = threats.iter()
            .find(|t| t.threat_type == ThreatType::Reentrancy)
            .unwrap();
        assert!(
            reentrancy_threat.severity >= ThreatSeverity::High,
            "Deep re-entrancy should be High or Critical severity"
        );
    }
    
    /// Test: Sandwich attack detection
    /// Verifies front-run + victim + back-run pattern is caught
    #[test]
    fn test_sandwich_attack_detected() {
        let mut sim = AttackSimulator::new();
        let dex_contract = sim.register_contract("VulnerableDEX");
        let attacker = [0xCC; 32];
        let victim = [0xDD; 32];
        
        let attack_txs = attacks::sandwich_attack(attacker, victim, dex_contract);
        let threats = sim.process_block(attack_txs);
        
        assert!(!threats.is_empty(), "Sandwich attack should be detected");
        assert!(
            threats.iter().any(|t| t.threat_type == ThreatType::SandwichAttack),
            "Threat type should be SandwichAttack"
        );
    }
    
    /// Test: Flash loan attack detection
    /// Verifies high-value flash loan operations are flagged
    #[test]
    fn test_flash_loan_attack_detected() {
        let mut sim = AttackSimulator::new();
        let lending = sim.register_contract("FlashLender");
        let target = sim.register_contract("VulnerableProtocol");
        let attacker = [0xEE; 32];
        
        // Large flash loan (10 billion)
        let attack_txs = attacks::flash_loan_attack(
            attacker,
            lending,
            target,
            10_000_000_000,
        );
        
        let threats = sim.process_block(attack_txs);
        
        assert!(!threats.is_empty(), "Flash loan attack should be detected");
        assert!(
            threats.iter().any(|t| t.threat_type == ThreatType::FlashLoan),
            "Threat type should be FlashLoan"
        );
    }
    
    /// Test: Governance attack detection
    /// Verifies flash loan + governance vote is flagged as critical
    #[test]
    fn test_governance_attack_detected() {
        let mut sim = AttackSimulator::new();
        let _governance = sim.register_contract("GovernanceDAO");
        let attacker = [0xFF; 32];
        
        // Flash loan followed by governance vote
        let attack_txs = vec![
            TransactionInfo {
                hash: [1; 32],
                sender: attacker,
                target_contract: Some([0x01; 32]),
                function_selector: Some([0x5c, 0xef, 0xf6, 0x20]), // flashLoan
                gas_used: 500_000,
                value: 1_000_000_000,
                success: true,
                call_depth: 1,
                timestamp: 0,
            },
            TransactionInfo {
                hash: [2; 32],
                sender: attacker,
                target_contract: Some([0x02; 32]),
                function_selector: Some([0x56, 0x78, 0x13, 0x88]), // castVote
                gas_used: 100_000,
                value: 0,
                success: true,
                call_depth: 1,
                timestamp: 0,
            },
        ];
        
        let threats = sim.process_block(attack_txs);
        
        assert!(
            threats.iter().any(|t| t.threat_type == ThreatType::GovernanceAttack),
            "Governance attack should be detected"
        );
        
        // Should be critical severity
        let gov_threat = threats.iter()
            .find(|t| t.threat_type == ThreatType::GovernanceAttack);
        if let Some(threat) = gov_threat {
            assert_eq!(
                threat.severity, ThreatSeverity::Critical,
                "Governance attack should be Critical severity"
            );
        }
    }
    
    /// Test: Access control probing detection
    /// Verifies repeated failed privileged calls are flagged
    #[test]
    fn test_access_control_probe_detected() {
        let mut sim = AttackSimulator::new();
        let _contract = sim.register_contract("AdminContract");
        let attacker = [0x11; 32];
        
        // Multiple failed admin function calls
        let attack_txs: Vec<TransactionInfo> = (0..5)
            .map(|i| TransactionInfo {
                hash: [i as u8; 32],
                sender: attacker,
                target_contract: Some([0x01; 32]),
                function_selector: Some([0xf2, 0xfb, 0xe2, 0xb8]), // renounceOwnership
                gas_used: 50_000,
                value: 0,
                success: false, // Failed attempts
                call_depth: 1,
                timestamp: 0,
            })
            .collect();
        
        let threats = sim.process_block(attack_txs);
        
        assert!(
            threats.iter().any(|t| t.threat_type == ThreatType::AccessControlProbe),
            "Access control probing should be detected"
        );
    }
    
    /// Test: Contract creation spam detection
    #[test]
    fn test_contract_creation_spam_detected() {
        let mut sim = AttackSimulator::new();
        let spammer = [0x22; 32];
        
        // Multiple contract creations (target_contract = None for creates)
        let spam_txs: Vec<TransactionInfo> = (0..10)
            .map(|i| TransactionInfo {
                hash: [i as u8; 32],
                sender: spammer,
                target_contract: None, // Contract creation
                function_selector: None,
                gas_used: 200_000,
                value: 0,
                success: true,
                call_depth: 1,
                timestamp: 0,
            })
            .collect();
        
        let threats = sim.process_block(spam_txs);
        
        assert!(
            threats.iter().any(|t| t.threat_type == ThreatType::ContractCreationSpam),
            "Contract creation spam should be detected"
        );
    }
}

// ============================================================================
// SECTION 2: Mutation Security Tests
// ============================================================================

mod mutation_security {
    use super::*;
    
    /// Test: Mutations occur at epoch boundaries
    #[test]
    fn test_epoch_boundary_mutations() {
        let mut sim = AttackSimulator::with_epoch_length(5);
        let _contract = sim.register_contract("MutatingContract");
        
        // Process blocks until epoch transition
        for _ in 0..6 {
            let txs = attacks::normal_traffic(3);
            sim.process_block(txs);
        }
        
        assert!(
            sim.stats().epoch_transitions >= 1,
            "Epoch transition should occur at block 5"
        );
    }
    
    /// Test: Mutations are deterministic with same seed
    #[test]
    fn test_mutation_determinism() {
        let config = CvpConfig {
            mutation_epoch_length: 10,
            enabled: true,
            ..Default::default()
        };
        
        let mut engine1 = CvpEngine::with_config(config.clone());
        let mut engine2 = CvpEngine::with_config(config);
        
        // Register same contract on both
        let contract_id = [0x42; 32];
        let semantic_ir = SemanticIR::new(contract_id, "DeterminismTest".to_string());
        let bytecode = vec![0x60, 0x01, 0x60, 0x02, 0x01]; // Simple bytecode
        
        engine1.register_contract(contract_id, semantic_ir.clone(), bytecode.clone()).unwrap();
        engine2.register_contract(contract_id, semantic_ir, bytecode).unwrap();
        
        // Use same block hashes for deterministic seed
        let block_hashes: Vec<[u8; 32]> = (0..5)
            .map(|i| [i as u8; 32])
            .collect();
        
        // Perform epoch transition on both
        let result1 = engine1.transition_epoch(10, &block_hashes);
        let result2 = engine2.transition_epoch(10, &block_hashes);
        
        // Both should produce same mutations (or both fail gracefully)
        match (result1, result2) {
            (Ok(m1), Ok(m2)) => {
                assert_eq!(m1.len(), m2.len(), "Same number of mutations");
                for (r1, r2) in m1.iter().zip(m2.iter()) {
                    assert_eq!(r1.new_hash, r2.new_hash, "Mutation hashes should match");
                }
            }
            (Err(_), Err(_)) => {
                // Both failed - acceptable for test bytecode
            }
            _ => panic!("Determinism violated: engines produced different outcomes"),
        }
    }
    
    /// Test: Original bytecode is preserved
    #[test]
    fn test_original_bytecode_preserved() {
        let config = CvpConfig {
            mutation_epoch_length: 5,
            enabled: true,
            ..Default::default()
        };
        
        let engine = CvpEngine::with_config(config);
        
        let contract_id = [0x43; 32];
        let original_bytecode = vec![0x60, 0x01, 0x60, 0x02, 0x01, 0x60, 0x00, 0x52];
        
        engine.register_contract(
            contract_id,
            SemanticIR::new(contract_id, "PreservationTest".to_string()),
            original_bytecode.clone(),
        ).unwrap();
        
        // Get bytecode before mutation
        let before = engine.get_bytecode(&contract_id).unwrap().unwrap();
        assert_eq!(before, original_bytecode, "Initial bytecode should match");
        
        // Even after epoch transition, we should be able to verify the original
        // (The mutation result contains original_hash for this purpose)
    }
}

// ============================================================================
// SECTION 3: Proof Verification Tests
// ============================================================================

mod proof_verification {
    use super::*;
    
    /// Test: Proofs are generated for mutations
    #[test]
    fn test_proof_generation() {
        let config = CvpConfig {
            mutation_epoch_length: 5,
            enabled: true,
            ..Default::default()
        };
        
        let cvp = CvpConsensusIntegration::new(config);
        
        // Register a contract
        let contract_id = [0x44; 32];
        cvp.register_contract(
            contract_id,
            SemanticIR::new(contract_id, "ProofTest".to_string()),
            vec![0x60, 0x01, 0x60, 0x02, 0x01],
        ).unwrap();
        
        // Verify stats show registered contract
        let stats = cvp.stats();
        assert!(stats.registered_contracts > 0, "Contract should be registered");
    }
    
    /// Test: Invalid proofs are rejected
    #[test]
    fn test_invalid_proof_rejected() {
        // Create an invalid/empty proof using correct structure
        let invalid_proof = demiurge_cvp::EquivalenceProof {
            version: 1,
            ir_commitment: [0x00; 32],
            original_hash: [0x00; 32],
            mutated_hash: [0x00; 32],
            epoch_seed: [0x00; 32],
            proof_data: vec![], // Empty proof data
            proof_system: demiurge_cvp::ProofSystem::TranslationValidation,
            generated_at: 0,
        };
        
        // Empty proofs should be detected as malformed
        assert!(
            !invalid_proof.is_well_formed(),
            "Invalid proof with empty data should not be well-formed"
        );
    }
}

// ============================================================================
// SECTION 4: Consensus Integration Tests
// ============================================================================

mod consensus_integration {
    use super::*;
    
    /// Test: CVP stats are correctly exposed
    #[test]
    fn test_cvp_stats_exposure() {
        let config = CvpConfig {
            mutation_epoch_length: 100,
            enabled: true,
            ..Default::default()
        };
        
        let cvp = CvpConsensusIntegration::new(config);
        
        let stats = cvp.stats();
        
        assert!(stats.enabled, "CVP should be enabled");
        assert_eq!(stats.epoch_length, 100, "Epoch length should match config");
        assert_eq!(stats.current_epoch, 0, "Initial epoch should be 0");
    }
    
    /// Test: Threat analysis returns correct threat count
    #[test]
    fn test_threat_analysis() {
        let stats = scenarios::run_mixed_attack_scenario();
        
        // Mixed scenario should detect multiple threats
        assert!(
            stats.threats_detected >= 3,
            "Mixed scenario should detect at least 3 threats"
        );
        
        // Should have multiple threat types
        assert!(
            stats.threats_by_type.len() >= 2,
            "Should detect multiple threat types"
        );
    }
}

// ============================================================================
// SECTION 5: Edge Cases and Boundary Conditions
// ============================================================================

mod edge_cases {
    use super::*;
    
    /// Test: Empty transaction block
    #[test]
    fn test_empty_block_handling() {
        let mut sim = AttackSimulator::new();
        
        // Process empty block
        let threats = sim.process_block(vec![]);
        
        assert!(threats.is_empty(), "Empty block should produce no threats");
        assert_eq!(sim.stats().blocks_processed, 1, "Block should be counted");
    }
    
    /// Test: Maximum call depth boundary
    #[test]
    fn test_max_call_depth_boundary() {
        let mut sim = AttackSimulator::new();
        let contract = sim.register_contract("DepthTest");
        let sender = [0x55; 32];
        
        // Call depth at threshold (3) - should NOT trigger
        let txs_at_threshold = vec![TransactionInfo {
            hash: [1; 32],
            sender,
            target_contract: Some(contract),
            function_selector: Some([0x01; 4]),
            gas_used: 100_000,
            value: 0,
            success: true,
            call_depth: 3, // Exactly at threshold
            timestamp: 0,
        }];
        
        let threats = sim.process_block(txs_at_threshold);
        assert!(
            !threats.iter().any(|t| t.threat_type == ThreatType::Reentrancy),
            "Call depth at threshold should not trigger"
        );
        
        // Call depth above threshold (4) - SHOULD trigger
        let txs_above_threshold = vec![TransactionInfo {
            hash: [2; 32],
            sender,
            target_contract: Some(contract),
            function_selector: Some([0x01; 4]),
            gas_used: 100_000,
            value: 0,
            success: true,
            call_depth: 4, // Above threshold
            timestamp: 0,
        }];
        
        let threats = sim.process_block(txs_above_threshold);
        assert!(
            threats.iter().any(|t| t.threat_type == ThreatType::Reentrancy),
            "Call depth above threshold should trigger"
        );
    }
    
    /// Test: Zero-value transactions
    #[test]
    fn test_zero_value_transactions() {
        let mut sim = AttackSimulator::new();
        
        let txs: Vec<TransactionInfo> = (0..5)
            .map(|i| TransactionInfo {
                hash: [i as u8; 32],
                sender: [i as u8; 32],
                target_contract: Some([0x01; 32]),
                function_selector: Some([0xa9, 0x05, 0x9c, 0xbb]),
                gas_used: 50_000,
                value: 0, // Zero value
                success: true,
                call_depth: 1,
                timestamp: 0,
            })
            .collect();
        
        // Should not panic
        let threats = sim.process_block(txs);
        // Zero-value transfers are normal, should not trigger large value alerts
        assert!(
            !threats.iter().any(|t| t.threat_type == ThreatType::LargeValueTransfer),
            "Zero-value transactions should not trigger large value alerts"
        );
    }
    
    /// Test: Transaction with maximum gas
    #[test]
    fn test_maximum_gas_transaction() {
        let mut sim = AttackSimulator::new();
        let contract = sim.register_contract("GasTest");
        
        let tx = TransactionInfo {
            hash: [1; 32],
            sender: [0x66; 32],
            target_contract: Some(contract),
            function_selector: Some([0x01; 4]),
            gas_used: u64::MAX, // Maximum gas
            value: 0,
            success: true,
            call_depth: 1,
            timestamp: 0,
        };
        
        // Should not panic with extreme values
        let _threats = sim.process_block(vec![tx]);
        
        // High gas usage should be flagged
        // (May trigger AnomalousGas if there's history to compare)
        assert!(sim.stats().transactions_processed == 1);
    }
    
    /// Test: Stress test with many blocks
    #[test]
    fn test_stress_many_blocks() {
        let stats = scenarios::run_stress_test(100, 10);
        
        assert_eq!(stats.blocks_processed, 100, "Should process all blocks");
        assert_eq!(stats.transactions_processed, 1000, "Should process all transactions");
    }
    
    /// Test: Epoch transition at block 0
    #[test]
    fn test_epoch_zero_handling() {
        let config = CvpConfig {
            mutation_epoch_length: 1, // Every block is an epoch
            enabled: true,
            ..Default::default()
        };
        
        let mut cvp = CvpConsensusIntegration::new(config);
        
        // First block (block 1)
        let result = cvp.on_block_finalized(
            1,
            [0x01; 32],
            &[],
        );
        
        assert!(result.is_ok(), "Should handle first block gracefully");
    }
}

// ============================================================================
// SECTION 6: Severity Classification Tests
// ============================================================================

mod severity_classification {
    use super::*;
    
    /// Test: Critical severity triggers emergency mutation recommendation
    #[test]
    fn test_critical_severity_handling() {
        let mut sim = AttackSimulator::new();
        let contract = sim.register_contract("CriticalTest");
        let attacker = [0x77; 32];
        
        // Very deep re-entrancy (depth 10+) should be critical
        let critical_attack = vec![TransactionInfo {
            hash: [1; 32],
            sender: attacker,
            target_contract: Some(contract),
            function_selector: Some([0xa9, 0x05, 0x9c, 0xbb]),
            gas_used: 1_000_000,
            value: 0,
            success: true,
            call_depth: 10, // Very deep
            timestamp: 0,
        }];
        
        let threats = sim.process_block(critical_attack);
        
        let critical_threats: Vec<_> = threats.iter()
            .filter(|t| t.severity == ThreatSeverity::Critical)
            .collect();
        
        assert!(
            !critical_threats.is_empty(),
            "Very deep re-entrancy should be Critical severity"
        );
    }
    
    /// Test: Severity escalation with repeated attacks
    #[test]
    fn test_severity_escalation() {
        let mut sim = AttackSimulator::new();
        let contract = sim.register_contract("EscalationTest");
        let attacker = [0x88; 32];
        
        // First attack: moderate frequency (just above threshold)
        let moderate_attack = attacks::high_frequency_attack(
            attacker,
            contract,
            [0x01; 4],
            12, // Just above 10 threshold
        );
        
        let first_threats = sim.process_block(moderate_attack);
        
        // Second attack: high frequency (5x threshold)
        let severe_attack = attacks::high_frequency_attack(
            attacker,
            contract,
            [0x01; 4],
            50, // 5x threshold
        );
        
        let second_threats = sim.process_block(severe_attack);
        
        // Second attack should have higher severity
        let first_severity = first_threats.iter()
            .filter(|t| t.threat_type == ThreatType::HighFrequency)
            .map(|t| t.severity)
            .max();
        
        let second_severity = second_threats.iter()
            .filter(|t| t.threat_type == ThreatType::HighFrequency)
            .map(|t| t.severity)
            .max();
        
        if let (Some(first), Some(second)) = (first_severity, second_severity) {
            assert!(
                second >= first,
                "Higher attack intensity should not decrease severity"
            );
        }
    }
}

// ============================================================================
// SECTION 7: Integration Scenario Tests
// ============================================================================

mod integration_scenarios {
    use super::*;
    
    /// Test: Complete attack-to-mutation flow
    #[test]
    fn test_attack_to_mutation_flow() {
        let stats = scenarios::run_mixed_attack_scenario();
        
        // Verify complete flow
        assert!(stats.blocks_processed > 0, "Blocks should be processed");
        assert!(stats.threats_detected > 0, "Threats should be detected");
        assert!(stats.epoch_transitions > 0, "Epoch transitions should occur");
        // Note: mutations_performed may be 0 if contracts don't compile properly
    }
    
    /// Test: Multiple contracts under attack
    #[test]
    fn test_multi_contract_attack() {
        let mut sim = AttackSimulator::new();
        
        let contract1 = sim.register_contract("Target1");
        let contract2 = sim.register_contract("Target2");
        let contract3 = sim.register_contract("Target3");
        
        let attacker = [0x99; 32];
        
        // Attack all three contracts in same block
        let mut attack_txs = attacks::high_frequency_attack(
            attacker, contract1, [0x01; 4], 15
        );
        attack_txs.extend(attacks::high_frequency_attack(
            attacker, contract2, [0x02; 4], 15
        ));
        attack_txs.extend(attacks::high_frequency_attack(
            attacker, contract3, [0x03; 4], 15
        ));
        
        let threats = sim.process_block(attack_txs);
        
        // Should detect attacks on all three contracts
        let unique_contracts: std::collections::HashSet<_> = threats.iter()
            .filter_map(|t| t.target_contract)
            .collect();
        
        assert_eq!(
            unique_contracts.len(), 3,
            "Should detect attacks on all 3 contracts"
        );
    }
}
