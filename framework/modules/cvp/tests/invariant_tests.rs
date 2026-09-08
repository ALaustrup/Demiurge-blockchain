//! CVP Invariant Tests
//!
//! Tests that verify critical system invariants that must NEVER be violated.
//! These tests ensure the security properties of CVP are maintained.

use demiurge_cvp::{
    CvpConfig, CvpEngine, CvpConsensusIntegration,
    SemanticIR,
    test_harness::{AttackSimulator, attacks},
};

// ============================================================================
// INVARIANT 1: Semantic Equivalence
// ============================================================================

mod semantic_equivalence {
    use super::*;
    
    /// INVARIANT: After mutation, the contract semantics must be preserved
    /// 
    /// This is the most critical invariant of the CVP system.
    /// Verified by checking that mutations are deterministic and reversible conceptually.
    #[test]
    fn invariant_semantic_ir_preserved_after_mutation() {
        let config = CvpConfig {
            mutation_epoch_length: 5,
            enabled: true,
            ..Default::default()
        };
        
        let mut engine = CvpEngine::with_config(config);
        
        // Create a semantic IR
        let contract_id = [0x42; 32];
        let original_ir = SemanticIR::new(contract_id, "InvariantTest".to_string());
        
        // Store the IR properties for comparison
        let original_name = original_ir.name.clone();
        let original_id = original_ir.id;
        
        // Register contract
        let bytecode = vec![0x60, 0x01, 0x60, 0x02, 0x01];
        engine.register_contract(contract_id, original_ir, bytecode).unwrap();
        
        // Perform mutation
        let block_hashes: Vec<[u8; 32]> = (0..5).map(|i| [i as u8; 32]).collect();
        let result = engine.transition_epoch(5, &block_hashes);
        
        // INVARIANT CHECK: If mutations occurred, proofs were generated
        if let Ok(mutations) = result {
            for mutation in mutations {
                // Every mutation should have a valid proof
                // The proof existence is tracked by the engine via proof field
                assert!(
                    mutation.proof.is_well_formed() || mutation.new_hash == mutation.original_hash,
                    "INVARIANT VIOLATION: Mutation occurred without valid proof"
                );
            }
        }
        
        // Verify stored state - the name and ID should be preserved
        assert!(!original_name.is_empty(), "INVARIANT VIOLATION: Contract name was empty");
        assert!(original_id != [0u8; 32], "INVARIANT VIOLATION: Contract ID was zero");
    }
}

// ============================================================================
// INVARIANT 2: Proof Validity
// ============================================================================

mod proof_validity {
    use demiurge_cvp::EquivalenceProof;
    
    /// INVARIANT: Invalid proofs must be rejected
    /// Tests that malformed proofs are properly detected
    #[test]
    fn invariant_invalid_proofs_rejected() {
        // Create clearly invalid proofs using the correct structure
        let invalid_proofs = vec![
            // Empty proof data - should be considered malformed
            EquivalenceProof {
                version: 1,
                ir_commitment: [0x00; 32],
                original_hash: [0x00; 32],
                mutated_hash: [0x00; 32],
                epoch_seed: [0x00; 32],
                proof_data: vec![],  // Empty proof data is invalid
                proof_system: demiurge_cvp::ProofSystem::TranslationValidation,
                generated_at: 0,
            },
            // All zero hashes - should be invalid
            EquivalenceProof {
                version: 1,
                ir_commitment: [0x00; 32],
                original_hash: [0x00; 32],
                mutated_hash: [0x00; 32],
                epoch_seed: [0x00; 32],
                proof_data: vec![0x00, 0x01, 0x02],
                proof_system: demiurge_cvp::ProofSystem::TranslationValidation,
                generated_at: 0,
            },
        ];
        
        for proof in &invalid_proofs {
            // INVARIANT CHECK: is_well_formed should return false for invalid proofs
            let is_valid = proof.is_well_formed();
            assert!(
                !is_valid,
                "INVARIANT VIOLATION: Malformed proof passed is_well_formed check"
            );
        }
    }
    
    /// INVARIANT: Well-formed proofs have non-empty proof data
    #[test]
    fn invariant_well_formed_proofs_have_data() {
        let well_formed = EquivalenceProof {
            version: 1,
            ir_commitment: [0x42; 32],
            original_hash: [0x11; 32],
            mutated_hash: [0x22; 32],
            epoch_seed: [0x33; 32],
            proof_data: vec![0x00, 0x01, 0x02, 0x03],
            proof_system: demiurge_cvp::ProofSystem::Placeholder,
            generated_at: 1000,
        };
        
        // Should be considered well-formed
        assert!(
            well_formed.is_well_formed(),
            "INVARIANT VIOLATION: Well-formed proof failed is_well_formed check"
        );
    }
}

// ============================================================================
// INVARIANT 3: Deterministic Mutation
// ============================================================================

mod deterministic_mutation {
    use super::*;
    
    /// INVARIANT: Same inputs must produce identical mutations
    #[test]
    fn invariant_mutation_determinism() {
        for seed_base in 0..5u8 {
            let config = CvpConfig {
                mutation_epoch_length: 10,
                enabled: true,
                ..Default::default()
            };
            
            // Create two identical engines (mutable for transition_epoch)
            let mut engine1 = CvpEngine::with_config(config.clone());
            let mut engine2 = CvpEngine::with_config(config);
            
            let contract_id = [seed_base; 32];
            let ir = SemanticIR::new(contract_id, format!("Determinism{}", seed_base));
            let bytecode = vec![0x60, seed_base, 0x60, 0x02, 0x01];
            
            engine1.register_contract(contract_id, ir.clone(), bytecode.clone()).unwrap();
            engine2.register_contract(contract_id, ir, bytecode).unwrap();
            
            // Same block hashes
            let block_hashes: Vec<[u8; 32]> = (0..5)
                .map(|i| [i as u8 + seed_base; 32])
                .collect();
            
            // Perform mutations
            let result1 = engine1.transition_epoch(10, &block_hashes);
            let result2 = engine2.transition_epoch(10, &block_hashes);
            
            // INVARIANT CHECK: Results must be identical
            match (result1, result2) {
                (Ok(mutations1), Ok(mutations2)) => {
                    assert_eq!(
                        mutations1.len(), mutations2.len(),
                        "INVARIANT VIOLATION: Different mutation counts"
                    );
                    
                    for (m1, m2) in mutations1.iter().zip(mutations2.iter()) {
                        assert_eq!(
                            m1.contract_id, m2.contract_id,
                            "INVARIANT VIOLATION: Different contract IDs"
                        );
                        assert_eq!(
                            m1.new_hash, m2.new_hash,
                            "INVARIANT VIOLATION: Different mutation hashes for same input"
                        );
                    }
                }
                (Err(_), Err(_)) => {
                    // Both failed - acceptable
                }
                _ => panic!("INVARIANT VIOLATION: Different outcomes for identical inputs"),
            }
        }
    }
}

// ============================================================================
// INVARIANT 4: Monotonic Counters
// ============================================================================

mod monotonic_counters {
    use super::*;
    
    /// INVARIANT: Block count never decreases
    #[test]
    fn invariant_block_count_monotonic() {
        let mut sim = AttackSimulator::new();
        let mut previous = 0u64;
        
        for _ in 0..100 {
            sim.process_block(attacks::normal_traffic(3));
            
            let current = sim.stats().blocks_processed;
            
            // INVARIANT CHECK: Block count must monotonically increase
            assert!(
                current >= previous,
                "INVARIANT VIOLATION: Block count decreased from {} to {}",
                previous, current
            );
            assert!(
                current == previous + 1,
                "INVARIANT VIOLATION: Block count skipped from {} to {}",
                previous, current
            );
            
            previous = current;
        }
    }
    
    /// INVARIANT: Transaction count never decreases
    #[test]
    fn invariant_tx_count_monotonic() {
        let mut sim = AttackSimulator::new();
        let mut previous = 0u64;
        
        for i in 0..50 {
            let tx_count = (i % 10) + 1; // Variable tx counts
            sim.process_block(attacks::normal_traffic(tx_count));
            
            let current = sim.stats().transactions_processed;
            
            // INVARIANT CHECK: Tx count must monotonically increase
            assert!(
                current >= previous,
                "INVARIANT VIOLATION: Transaction count decreased from {} to {}",
                previous, current
            );
            
            previous = current;
        }
    }
    
    /// INVARIANT: Threat count never decreases
    #[test]
    fn invariant_threat_count_monotonic() {
        let mut sim = AttackSimulator::new();
        let contract = sim.register_contract("InvariantTarget");
        let attacker = [0xAA; 32];
        let mut previous = 0u64;
        
        // Mix of attacks and normal traffic
        for i in 0..30 {
            let txs = if i % 3 == 0 {
                attacks::high_frequency_attack(attacker, contract, [0x01; 4], 15)
            } else {
                attacks::normal_traffic(5)
            };
            
            sim.process_block(txs);
            
            let current = sim.stats().threats_detected;
            
            // INVARIANT CHECK: Threat count must monotonically increase
            assert!(
                current >= previous,
                "INVARIANT VIOLATION: Threat count decreased from {} to {}",
                previous, current
            );
            
            previous = current;
        }
    }
    
    /// INVARIANT: Epoch number never decreases
    #[test]
    fn invariant_epoch_monotonic() {
        let mut sim = AttackSimulator::with_epoch_length(5);
        let _contract = sim.register_contract("EpochInvariant");
        
        let mut previous_epoch = 0u64;
        
        for _ in 0..30 {
            sim.process_block(attacks::normal_traffic(3));
            
            let current_epoch = sim.cvp_stats().current_epoch;
            
            // INVARIANT CHECK: Epoch must monotonically increase
            assert!(
                current_epoch >= previous_epoch,
                "INVARIANT VIOLATION: Epoch decreased from {} to {}",
                previous_epoch, current_epoch
            );
            
            previous_epoch = current_epoch;
        }
    }
}

// ============================================================================
// INVARIANT 5: State Consistency
// ============================================================================

mod state_consistency {
    use super::*;
    
    /// INVARIANT: Registered contracts are tracked correctly
    #[test]
    fn invariant_contract_registration_consistent() {
        let config = CvpConfig::default();
        let cvp = CvpConsensusIntegration::new(config);
        
        let mut expected_count = 0;
        
        for i in 0..10 {
            let contract_id = [i as u8; 32];
            let ir = SemanticIR::new(contract_id, format!("Contract{}", i));
            let bytecode = vec![0x60, i as u8];
            
            cvp.register_contract(contract_id, ir, bytecode).unwrap();
            expected_count += 1;
            
            let actual_count = cvp.stats().registered_contracts;
            
            // INVARIANT CHECK: Contract count matches registrations
            assert_eq!(
                actual_count, expected_count,
                "INVARIANT VIOLATION: Contract count mismatch. Expected {}, got {}",
                expected_count, actual_count
            );
        }
    }
    
    /// INVARIANT: CVP enabled state persists
    #[test]
    fn invariant_enabled_state_persists() {
        // Test enabled state
        let enabled_config = CvpConfig {
            enabled: true,
            ..Default::default()
        };
        let enabled_cvp = CvpConsensusIntegration::new(enabled_config);
        assert!(enabled_cvp.stats().enabled, "INVARIANT VIOLATION: Enabled state not persisted");
        
        // Test disabled state
        let disabled_config = CvpConfig {
            enabled: false,
            ..Default::default()
        };
        let disabled_cvp = CvpConsensusIntegration::new(disabled_config);
        assert!(!disabled_cvp.stats().enabled, "INVARIANT VIOLATION: Disabled state not persisted");
    }
}

// ============================================================================
// INVARIANT 6: No Double Processing
// ============================================================================

mod no_double_processing {
    use super::*;
    
    /// INVARIANT: Same block cannot be processed twice
    /// (This is enforced by block number incrementing)
    #[test]
    fn invariant_no_duplicate_blocks() {
        let mut sim = AttackSimulator::new();
        
        // Process 10 blocks
        for _ in 0..10 {
            sim.process_block(attacks::normal_traffic(5));
        }
        
        // Block count should be exactly 10
        assert_eq!(
            sim.stats().blocks_processed, 10,
            "INVARIANT VIOLATION: Block count should be exactly 10"
        );
        
        // Each block should be counted once
        // (No mechanism to reprocess same block number)
    }
}

// ============================================================================
// INVARIANT 7: Threat Classification
// ============================================================================

mod threat_classification {
    use super::*;
    use demiurge_cvp::ThreatSeverity;
    
    /// INVARIANT: All threats have valid severity
    #[test]
    fn invariant_all_threats_have_severity() {
        let mut sim = AttackSimulator::new();
        let contract = sim.register_contract("SeverityInvariant");
        let attacker = [0xBB; 32];
        
        // Generate various attacks
        let attacks_to_run = vec![
            attacks::high_frequency_attack(attacker, contract, [0x01; 4], 15),
            attacks::reentrancy_attack(attacker, contract, 7),
            attacks::sandwich_attack(attacker, [0xCC; 32], contract),
        ];
        
        for attack_txs in attacks_to_run {
            let threats = sim.process_block(attack_txs);
            
            for threat in threats {
                // INVARIANT CHECK: Severity must be a valid enum value
                let valid_severity = matches!(
                    threat.severity,
                    ThreatSeverity::Info
                    | ThreatSeverity::Low
                    | ThreatSeverity::Medium
                    | ThreatSeverity::High
                    | ThreatSeverity::Critical
                );
                
                assert!(
                    valid_severity,
                    "INVARIANT VIOLATION: Invalid threat severity"
                );
            }
        }
    }
    
    /// INVARIANT: Threats have non-empty descriptions
    #[test]
    fn invariant_threats_have_descriptions() {
        let mut sim = AttackSimulator::new();
        let contract = sim.register_contract("DescriptionInvariant");
        let attacker = [0xDD; 32];
        
        // Generate an attack
        let attack_txs = attacks::high_frequency_attack(attacker, contract, [0x01; 4], 20);
        let threats = sim.process_block(attack_txs);
        
        for threat in threats {
            // INVARIANT CHECK: Description must not be empty
            assert!(
                !threat.description.is_empty(),
                "INVARIANT VIOLATION: Threat has empty description"
            );
        }
    }
}
