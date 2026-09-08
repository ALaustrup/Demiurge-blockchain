//! CVP Proof Performance Benchmarks
//!
//! Phase 3: Measures proof generation and verification performance
//! across different proof systems and bytecode sizes.
//!
//! Run with: cargo bench --package demiurge-cvp --features zk-plonky2

use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId, Throughput};
use demiurge_cvp::{
    SemanticIR, SemanticFunction, ContractId, PolymorphicCompiler,
    MutationConfig, CompositeMutation, StrategyType, Bytecode,
    EquivalenceProof, ProofGenerator, ProofVerifier, ProofSystem,
    TranslationValidationGenerator, TranslationValidationVerifier,
    CvpEngine, CvpConfig,
};

#[cfg(feature = "zk-plonky2")]
use demiurge_cvp::plonky2_circuits::{Plonky2ProofGenerator, Plonky2ProofVerifier};

use std::time::Duration;

/// Create a test Semantic IR with specified complexity
fn create_test_ir(complexity: usize) -> SemanticIR {
    let id: ContractId = [1u8; 32];
    let mut ir = SemanticIR::new(id, format!("TestContract_{}", complexity));
    
    // Add functions based on complexity
    for i in 0..complexity {
        let selector = [
            ((i >> 24) & 0xFF) as u8,
            ((i >> 16) & 0xFF) as u8,
            ((i >> 8) & 0xFF) as u8,
            (i & 0xFF) as u8,
        ];
        
        let func = SemanticFunction::new(selector, format!("func_{}", i))
            .with_input("param1", demiurge_cvp::Type::Uint256)
            .with_input("param2", demiurge_cvp::Type::Address);
        
        ir.add_function(func);
    }
    
    ir
}

/// Create test bytecode of specified size
fn create_test_bytecode(size: usize) -> Vec<u8> {
    let mut bytecode = Vec::with_capacity(size);
    
    // Create realistic bytecode pattern
    // Function selector dispatch
    bytecode.extend_from_slice(&[0x60, 0x00, 0x35]); // PUSH1 0 CALLDATALOAD
    bytecode.extend_from_slice(&[0x60, 0xE0, 0x1C]); // PUSH1 0xE0 SHR
    
    // Fill remaining with realistic opcodes
    let opcodes = [0x01, 0x02, 0x03, 0x04, 0x05, 0x10, 0x11, 0x14, 0x15, 0x16,
                   0x50, 0x51, 0x52, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5A,
                   0x60, 0x61, 0x80, 0x81, 0x90, 0x91, 0xF3, 0xFD];
    
    while bytecode.len() < size {
        for opcode in &opcodes {
            if bytecode.len() >= size {
                break;
            }
            bytecode.push(*opcode);
        }
    }
    
    bytecode.truncate(size);
    bytecode
}

/// Create epoch seed
fn create_epoch_seed(epoch: u64) -> [u8; 32] {
    use sha2::{Sha256, Digest};
    let mut hasher = Sha256::new();
    hasher.update(b"EPOCH_SEED_V1");
    hasher.update(epoch.to_le_bytes());
    let hash = hasher.finalize();
    let mut seed = [0u8; 32];
    seed.copy_from_slice(&hash);
    seed
}

/// Benchmark Translation Validation proof generation
fn bench_translation_validation_proof_gen(c: &mut Criterion) {
    let mut group = c.benchmark_group("TranslationValidation_ProofGen");
    
    // Test different bytecode sizes
    let sizes = [64, 256, 1024, 4096];
    
    for size in sizes {
        let ir = create_test_ir(10);
        let original = create_test_bytecode(size);
        let mutated = create_test_bytecode(size);
        let epoch_seed = create_epoch_seed(1);
        
        let generator = TranslationValidationGenerator::new(ir.clone());
        
        group.throughput(Throughput::Bytes(size as u64));
        group.bench_with_input(
            BenchmarkId::from_parameter(format!("{}B", size)),
            &(ir.clone(), original.clone(), mutated.clone(), epoch_seed),
            |b, (ir, original, mutated, seed)| {
                b.iter(|| {
                    generator.generate_proof(
                        black_box(ir),
                        black_box(original),
                        black_box(mutated),
                        black_box(seed),
                    )
                });
            },
        );
    }
    
    group.finish();
}

/// Benchmark Translation Validation proof verification
fn bench_translation_validation_verify(c: &mut Criterion) {
    let mut group = c.benchmark_group("TranslationValidation_Verify");
    
    let sizes = [64, 256, 1024, 4096];
    
    for size in sizes {
        let ir = create_test_ir(10);
        let original = create_test_bytecode(size);
        let mutated = create_test_bytecode(size);
        let epoch_seed = create_epoch_seed(1);
        
        let generator = TranslationValidationGenerator::new(ir.clone());
        let verifier = TranslationValidationVerifier::new(ir.clone());
        
        // Generate proof first
        let proof = generator.generate_proof(&ir, &original, &mutated, &epoch_seed)
            .expect("Proof generation should succeed");
        
        group.throughput(Throughput::Bytes(size as u64));
        group.bench_with_input(
            BenchmarkId::from_parameter(format!("{}B", size)),
            &proof,
            |b, proof| {
                b.iter(|| {
                    verifier.verify_proof(black_box(proof))
                });
            },
        );
    }
    
    group.finish();
}

/// Benchmark bytecode mutation
fn bench_mutation(c: &mut Criterion) {
    let mut group = c.benchmark_group("Bytecode_Mutation");
    
    let sizes = [64, 256, 1024, 4096, 16384];
    
    for size in sizes {
        let bytecode = create_test_bytecode(size);
        let epoch_seed = create_epoch_seed(1);
        
        let mutation = CompositeMutation::with_strategies(
            vec![
                StrategyType::OpcodeSubstitution,
                StrategyType::MemoryRandomization,
                StrategyType::ControlFlowObfuscation,
            ],
            &MutationConfig::default(),
        );
        
        group.throughput(Throughput::Bytes(size as u64));
        group.bench_with_input(
            BenchmarkId::from_parameter(format!("{}B", size)),
            &bytecode,
            |b, bytecode| {
                b.iter(|| {
                    mutation.mutate(black_box(bytecode), black_box(&epoch_seed))
                });
            },
        );
    }
    
    group.finish();
}

/// Benchmark individual mutation strategies
fn bench_individual_strategies(c: &mut Criterion) {
    let mut group = c.benchmark_group("Individual_Strategies");
    group.sample_size(100);
    
    let bytecode = create_test_bytecode(1024);
    let epoch_seed = create_epoch_seed(1);
    let config = MutationConfig::default();
    
    let strategies = [
        ("OpcodeSubstitution", StrategyType::OpcodeSubstitution),
        ("MemoryRandomization", StrategyType::MemoryRandomization),
        ("ControlFlowObfuscation", StrategyType::ControlFlowObfuscation),
        ("DeadCodeInjection", StrategyType::DeadCodeInjection),
        ("StackScrambling", StrategyType::StackScrambling),
        ("ConstantObfuscation", StrategyType::ConstantObfuscation),
        ("OperationReordering", StrategyType::OperationReordering),
    ];
    
    for (name, strategy_type) in strategies {
        let mutation = CompositeMutation::with_strategies(vec![strategy_type], &config);
        
        group.bench_function(name, |b| {
            b.iter(|| {
                mutation.mutate(black_box(&bytecode), black_box(&epoch_seed))
            });
        });
    }
    
    group.finish();
}

/// Benchmark CVP engine epoch transitions
fn bench_epoch_transition(c: &mut Criterion) {
    let mut group = c.benchmark_group("CVP_Engine_Epoch");
    group.sample_size(50);
    group.measurement_time(Duration::from_secs(10));
    
    // Test with different numbers of registered contracts
    let contract_counts = [1, 5, 10, 25];
    
    for count in contract_counts {
        let engine = CvpEngine::with_config(CvpConfig {
            mutation_epoch_length: 100,
            enabled: true,
            log_mutations: false,
            ..Default::default()
        });
        
        // Register contracts
        for i in 0..count {
            let mut id = [0u8; 32];
            id[0] = i as u8;
            let ir = create_test_ir(5);
            let bytecode = create_test_bytecode(512);
            let _ = engine.register_contract(id, ir, bytecode);
        }
        
        group.bench_with_input(
            BenchmarkId::from_parameter(format!("{}_contracts", count)),
            &count,
            |b, _| {
                let mut block_num = 100u64;
                b.iter(|| {
                    let seed = create_epoch_seed(block_num / 100);
                    let _ = black_box(engine.process_epoch(block_num, seed));
                    block_num += 100;
                });
            },
        );
    }
    
    group.finish();
}

/// Plonky2 proof generation benchmark (only when feature is enabled)
#[cfg(feature = "zk-plonky2")]
fn bench_plonky2_proof_gen(c: &mut Criterion) {
    use demiurge_cvp::plonky2_circuits::{CvpPublicInputs, CvpWitness, WitnessStep};
    
    let mut group = c.benchmark_group("Plonky2_ProofGen");
    group.sample_size(10);
    group.measurement_time(Duration::from_secs(30));
    
    // Plonky2 circuit is fixed size, so we benchmark different witness complexities
    let complexities = [1, 5, 10];
    
    for complexity in complexities {
        let ir = create_test_ir(complexity);
        let original = create_test_bytecode(256);
        let mutated = create_test_bytecode(256);
        let epoch_seed = create_epoch_seed(1);
        
        let generator = Plonky2ProofGenerator::new(&ir)
            .expect("Should create generator");
        
        group.bench_with_input(
            BenchmarkId::from_parameter(format!("{}_funcs", complexity)),
            &(ir.clone(), original.clone(), mutated.clone(), epoch_seed),
            |b, (ir, original, mutated, seed)| {
                b.iter(|| {
                    generator.generate_proof(
                        black_box(ir),
                        black_box(original),
                        black_box(mutated),
                        black_box(seed),
                    )
                });
            },
        );
    }
    
    group.finish();
}

/// Plonky2 proof verification benchmark
#[cfg(feature = "zk-plonky2")]
fn bench_plonky2_verify(c: &mut Criterion) {
    let mut group = c.benchmark_group("Plonky2_Verify");
    group.sample_size(50);
    
    let ir = create_test_ir(5);
    let original = create_test_bytecode(256);
    let mutated = create_test_bytecode(256);
    let epoch_seed = create_epoch_seed(1);
    
    let generator = Plonky2ProofGenerator::new(&ir)
        .expect("Should create generator");
    let verifier = Plonky2ProofVerifier::new(&ir)
        .expect("Should create verifier");
    
    // Generate proof first
    let proof = generator.generate_proof(&ir, &original, &mutated, &epoch_seed)
        .expect("Proof generation should succeed");
    
    group.bench_function("verify_proof", |b| {
        b.iter(|| {
            verifier.verify_proof(black_box(&proof))
        });
    });
    
    group.finish();
}

// Criterion group configuration
#[cfg(not(feature = "zk-plonky2"))]
criterion_group!(
    benches,
    bench_translation_validation_proof_gen,
    bench_translation_validation_verify,
    bench_mutation,
    bench_individual_strategies,
    bench_epoch_transition,
);

#[cfg(feature = "zk-plonky2")]
criterion_group!(
    benches,
    bench_translation_validation_proof_gen,
    bench_translation_validation_verify,
    bench_mutation,
    bench_individual_strategies,
    bench_epoch_transition,
    bench_plonky2_proof_gen,
    bench_plonky2_verify,
);

criterion_main!(benches);
