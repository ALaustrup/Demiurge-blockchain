# CVP (Consensus-Verified Polymorphism) - Research Status

**Status: research prototype. Not a security mechanism. To be reassessed in Phase 7.**

`modules/cvp` stays in the workspace only because `consensus` links against it
(`ConsensusEngine` carries a `CvpConsensusIntegration`). Nothing it produces
should be relied on. Concretely, as of Phase 0:

- **No VM exists.** There is no interpreter or execution engine for the
  "bytecode" CVP manages. Nothing ever runs the bytes; they are opaque blobs
  that get hashed, shuffled and stored.
- **Bytecode is a placeholder.** The DRC-369 "contract" registered by
  `ConsensusEngine::generate_drc369_bytecode` is a hand-written sequence of
  EVM-looking opcode bytes with no semantics behind it.
- **The default `TranslationValidation` proof is unsound.**
  `TranslationValidationVerifier::verify` (`src/proof.rs`):
  - accepts an empty transformation step chain outright
    (`verify_transformation_chain` returns `true` for `steps.is_empty()`);
  - only checks that consecutive steps' `pre_hash`/`post_hash` chain together.
    It never checks that the final `post_hash` equals `proof.mutated_hash`, and
    never hashes the mutated bytecode at all, so the proof is not bound to the
    bytes it claims to certify;
  - the Fiat-Shamir challenge/response only re-derive hashes from fields the
    prover chose, so any internally consistent proof over any bytes verifies.
  The `Placeholder` proof system unconditionally returns `true` and says so.
- **Detectors receive constants.** `ConsensusEngine::transaction_to_cvp_info`
  feeds the threat detectors `gas_used: 100_000`, `success: true`,
  `call_depth: 1` for every transaction, because there is no execution to
  observe. Threat "detections" derived from those fields are not meaningful.
- The `zk-plonky2` feature (real ZK circuits) requires nightly Rust and is not
  built by default; it does not change any of the above.

Do not build product features on CVP output until Phase 7 has decided whether
to implement it properly or remove it.
