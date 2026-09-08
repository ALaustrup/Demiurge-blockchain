# Spec 01 — Transaction v2, Block v2, State Commitment, Admission

**Status:** design, accepted for Phase 1 (2026-09-08)
**Scope:** `framework/core`, `framework/storage`, `framework/network` (pool), `framework/rpc`, `framework/node`, `framework/modules/{balances,energy,session-keys,drc369}`, `sdk/`, `apps/wallet-extension`
**Supersedes:** the v1 `Transaction { nonce, from, signature, data }` and the v1 `BlockHeader` without author.

This document is normative. Where it conflicts with code comments or older docs, this document wins. Every MUST below has a test.

---

## 1. Goals

1. A transaction is bound to one chain, one account, one nonce. Replay on the same chain, on another chain, or on a fork from the same genesis is rejected.
2. A block is bound to its author. A block whose signature does not verify against a validator's key is rejected before anything else is examined.
3. The state root in a block header commits to the exact post-state, is cheap to compute, and supports inclusion proofs.
4. Energy is enforced at mempool admission, so spam costs the attacker before execution.
5. A session key can act for an account only inside a scope the account signed.
6. An agent account can act only inside a policy its controller signed.
7. Applying a block is atomic: a crash mid-block leaves no partial state.

Non-goals for this spec: multi-node consensus (Spec 02), the WASM VM (Spec 04), fee markets.

---

## 2. Primitives

| Name | Definition |
|------|------------|
| `Hash` | `[u8; 32]`, Blake2b-256 (`blake2::Blake2b<U32>`) |
| `AccountId` | `[u8; 32]`, the Ed25519 public key |
| `Signature` | `[u8; 64]`, Ed25519 |
| `ChainId` | `u32`. Studio local chains use `369_000 + project_index`; the reserved values are `369` (Pleroma mainnet, future), `3690` (public testnet, future), `36900` (devnet). |
| `GenesisHash` | `Hash` of the canonical SCALE encoding of the genesis block header |
| `SpecVersion` | `u32`, incremented on any consensus-breaking runtime change. Phase 1 ships `spec_version = 2`. |

**Domain-separated hashing.** Every hash of a protocol object is `blake2b_256(TAG || bytes)`, where `TAG` is a fixed ASCII string. Tags:

| Tag | Object |
|-----|--------|
| `demiurge:tx:v2` | transaction signing payload |
| `demiurge:txhash:v2` | transaction identity hash (over the full encoded tx incl. signature) |
| `demiurge:header:v2` | block header hash (over the header without the signature field) |
| `demiurge:leaf:v1` | Merkle leaf |
| `demiurge:node:v1` | Merkle internal node |
| `demiurge:grant:v1` | session grant signing payload |
| `demiurge:policy:v1` | agent policy signing payload |

Encoding is `parity-scale-codec` throughout. JSON forms used by RPC are `0x`-prefixed hex of the SCALE bytes.

---

## 3. Transaction v2

```rust
#[derive(Encode, Decode)]
pub struct Transaction {
    pub version: u8,                 // MUST be 2
    pub chain_id: u32,
    pub nonce: u64,
    pub from: AccountId,             // the account whose state changes and whose nonce is consumed
    pub signer: Signer,              // who produced `signature`
    pub energy_limit: u32,           // max energy the sender agrees to spend
    pub call: Call,
    pub signature: Signature,
}

#[derive(Encode, Decode)]
pub enum Signer {
    /// `signature` is by `from` itself.
    Account,
    /// `signature` is by this session key, which MUST hold a valid grant from `from`.
    Session(AccountId),
}

#[derive(Encode, Decode)]
pub enum Call {
    Transfer { to: AccountId, amount: u128 },
    Module { module: ModuleId, call: Vec<u8> },
}

/// Fixed module identifiers. Strings are gone from the wire format.
#[derive(Encode, Decode, Copy, Clone, PartialEq, Eq)]
#[repr(u8)]
pub enum ModuleId {
    Balances = 0,
    Energy = 1,
    SessionKeys = 2,
    Drc369 = 3,
    Accounts = 4,   // agent policies, account metadata (new, §8)
    Staking = 5,    // validator stake/unstake/claim (moves from RPC to tx)
}
```

**Signing payload.** `signing_payload = TAG("demiurge:tx:v2") || chain_id || genesis_hash || spec_version || nonce || from || signer || energy_limit || call`, all SCALE-encoded in that order. `genesis_hash` and `spec_version` are NOT carried in the transaction; the verifier supplies them from its own chain state. A transaction therefore cannot be replayed on a chain with a different genesis or a different spec version.

`signature = ed25519_sign(signing_key, blake2b_256(signing_payload))`. The signing key is `from` when `signer == Account`, else the session key.

**Transaction hash.** `tx_hash = blake2b_256(TAG("demiurge:txhash:v2") || scale(tx))`.

**Stateless validity (`Transaction::validate_stateless(chain_id, genesis_hash, spec_version)`):**

- `version == 2`
- `chain_id` matches
- `energy_limit >= BASE_TX_COST`
- signature verifies against the correct key for `signer`
- `call` is well-formed (`Transfer.amount > 0`, `Transfer.to != [0;32]`, `Module.call` decodes for the named module)

**Stateful validity** is defined in §7 (admission) and §9 (execution).

**Wire compatibility.** v1 transactions are not accepted anywhere. There is no migration; Phase 0 removed every producer of v1 transactions.

---

## 4. Account state

Stored by the `Accounts` module under prefix `Acct:`:

```rust
#[derive(Encode, Decode, Default)]
pub struct AccountInfo {
    pub nonce: u64,
    pub kind: AccountKind,
}

#[derive(Encode, Decode)]
pub enum AccountKind {
    User,
    Agent(AgentPolicy),   // §8
}
```

Key: `Acct:` || account. Balances and energy keep their own prefixes.

**Nonce rule.** At execution, `tx.nonce` MUST equal `AccountInfo.nonce` for `tx.from`; the nonce is then incremented **regardless of whether the call succeeds**. Energy is likewise charged regardless. Only the call's own writes are rolled back on failure (§10). This is what makes failed spam cost the sender.

---

## 5. Block v2

```rust
#[derive(Encode, Decode)]
pub struct BlockHeader {
    pub version: u8,                 // MUST be 2
    pub parent_hash: Hash,
    pub number: u64,
    pub timestamp_ms: u64,
    pub author: AccountId,           // validator that produced the block
    pub state_root: Hash,            // §6, post-state of this block
    pub extrinsics_root: Hash,       // Merkle root over tx hashes (§5.1)
    pub receipts_root: Hash,         // Merkle root over receipt hashes (§9)
    pub cvp_proof_root: Option<Hash>,// carried unchanged for the research crate; MAY be None; removed in Spec 02
    pub cvp_epoch: u64,
}

#[derive(Encode, Decode)]
pub struct Block {
    pub header: BlockHeader,
    pub signature: Signature,        // by `author` over header_hash
    pub transactions: Vec<Transaction>,
}
```

`header_hash = blake2b_256(TAG("demiurge:header:v2") || scale(header))`. `block_hash = header_hash`.

**Validity on import (`Block::validate(parent: &BlockHeader, validators: &ValidatorSet, now_ms)`):**

1. `version == 2`
2. `parent_hash == hash(parent)` and `number == parent.number + 1`
3. `timestamp_ms > parent.timestamp_ms` and `timestamp_ms <= now_ms + 15_000`
4. `author` is in `validators` at this height
5. `signature` verifies against `author` over `header_hash`
6. `extrinsics_root == merkle_root(tx hashes)`
7. every tx passes `validate_stateless`
8. after execution: computed `state_root` and `receipts_root` equal the header's

Steps 1–7 MUST run before any state is touched. A block failing any step is discarded and the sending peer, once Spec 02 lands, is penalised.

### 5.1 Merkle root

Binary Merkle tree over ordered leaves with domain separation:

- `leaf_i = blake2b_256(TAG("demiurge:leaf:v1") || item_i)`
- `node = blake2b_256(TAG("demiurge:node:v1") || left || right)`
- An odd node at any level is paired with `blake2b_256(TAG("demiurge:node:v1") || node || EMPTY)` where `EMPTY = [0u8;32]`. Odd nodes are never promoted unchanged (this closes the duplicate-leaf malleability in the v1 tree).
- Empty list → root `blake2b_256(TAG("demiurge:leaf:v1"))`.

Provide `merkle_root(&[Hash]) -> Hash` and `merkle_proof(&[Hash], index) -> Vec<(Hash, Side)>` with `verify_proof`.

---

## 6. State commitment

Replace the full-database rescan with a versioned Jellyfish Merkle Tree.

- Crate: `jmt` (Penumbra's `jmt`, Apache-2.0). Hash function: Blake2b-256 via its `SimpleHasher` trait.
- Version = block number. Genesis state is version 0.
- Key hashing: `jmt::KeyHash::with::<Blake2b256>(raw_key)`. Raw keys remain the existing `Prefix:...` byte strings, so modules do not change.
- `StateTree` sits between the runtime and RocksDB:

```rust
pub trait StateTree {
    fn get(&self, version: u64, key: &[u8]) -> Option<Vec<u8>>;
    /// Apply a batch of writes as a new version; returns the new root.
    fn put_batch(&mut self, version: u64, writes: Vec<(Vec<u8>, Option<Vec<u8>>)>) -> Result<Hash>;
    fn root(&self, version: u64) -> Result<Hash>;
    fn prove(&self, version: u64, key: &[u8]) -> Result<(Option<Vec<u8>>, SparseMerkleProof)>;
}
```

- RocksDB layout: column families `nodes` (JMT nodes), `values` (key → value at latest version, for fast reads), `blocks`, `headers`, `receipts`, `meta`. One database. The separate `data/consensus` directory is deleted.
- Write path: the runtime executes a block against an `Overlay { reads: cache, writes: BTreeMap<key, Option<value>> }`. On success the overlay becomes one JMT batch and one RocksDB `WriteBatch` (nodes + values + block + receipts + meta) committed atomically. On failure nothing is written.
- `Storage` trait from Phase 0 stays as the module-facing API; `Overlay` implements it. `commit()` and `state_root()` on `Overlay` are removed; the node owns commit.
- Pruning: keep all versions in Phase 1. Snapshots and pruning are Spec 02.

Exit test: two nodes on different machines applying the same 10k transactions from the same genesis produce identical `state_root` at every height.

---

## 7. Mempool and admission

`TransactionPool` is replaced by `Mempool`:

- Indexed by sender: `BTreeMap<AccountId, BTreeMap<nonce, Tx>>` plus `by_hash`.
- Limits: `MAX_PER_SENDER = 64`, `MAX_TOTAL = 16_384`, `MAX_TX_BYTES = 64 KiB`.
- **Admission checks (`Mempool::admit(tx, view: &dyn StateView)`)**, in order, each producing a distinct error:
  1. size ≤ `MAX_TX_BYTES`
  2. `validate_stateless`
  3. not already present (by hash)
  4. `nonce ∈ [account.nonce, account.nonce + MAX_PER_SENDER)`; a tx with a nonce already occupied by a *different* tx from the same sender is rejected (no replacement in Phase 1)
  5. **energy**: `projected_energy(from, now_block) - reserved_energy(from) >= tx.energy_limit`, where `reserved_energy` sums `energy_limit` of that sender's queued txs. Projection uses the same regen formula as the module.
  6. **session scope** (if `signer == Session(k)`): a grant `(from, k)` exists, is unexpired, permits `call.module` (and call index if restricted), and the spend cap admits `call`'s value if it is a `Transfer`
  7. **agent policy** (if `from` is an `Agent`): §8 admission rules
  8. sender queue length < `MAX_PER_SENDER`; total < `MAX_TOTAL` (when full, reject rather than evict)
- **Ready set**: for each sender, the contiguous run starting at `account.nonce`. Block building takes ready txs in FIFO arrival order across senders, up to `MAX_BLOCK_TXS = 2_000` and `MAX_BLOCK_BYTES = 2 MiB`.
- After a block is applied: remove included txs; drop any queued tx whose nonce is now below the account nonce; re-check energy for the sender's remaining queue and drop what no longer fits.
- Every rejection increments a per-peer counter (used in Spec 02) and is returned to RPC callers as a structured error `{code, reason}`.

Energy module change: add `EnergyModule::projected(storage, account, at_block) -> u64` (pure), used by both admission and execution so the two cannot disagree.

---

## 8. Session grants and agent policies

### 8.1 Session grants (replaces v1 `SessionKeys:<primary>:<key> → expiry`)

```rust
#[derive(Encode, Decode)]
pub struct SessionGrant {
    pub version: u8,                  // 1
    pub primary: AccountId,
    pub session_key: AccountId,
    pub allowed_modules: Vec<ModuleId>,       // empty = none; grant is useless but valid
    pub allowed_calls: Option<Vec<u8>>,       // call indices within the module; None = any
    pub spend_cap: u128,                      // total CGT this key may move via Transfer, in Sparks
    pub expires_at: u64,                      // block number, exclusive
    pub game_id: Option<Hash>,                // informational; Studio uses it to label grants
}
```

- Created only by a `Module { SessionKeys, Authorize(grant) }` transaction whose `from == grant.primary` and `signer == Account`. A session key cannot mint or extend its own grant.
- Storage: `Sess:` || primary || session_key → `(SessionGrant, spent: u128)`.
- `Revoke(session_key)` deletes it; only `primary` may revoke, with `signer == Account`.
- At execution, a session-signed `Transfer` increments `spent`; if `spent + amount > spend_cap` the call fails (nonce and energy still consumed).
- `MAX_GRANT_DURATION = 604_800` blocks (14 days at 2 s). `on_finalize` sweeps up to 256 expired grants per block.

### 8.2 Agent policies

```rust
#[derive(Encode, Decode)]
pub struct AgentPolicy {
    pub controller: AccountId,
    pub per_tx_cap: u128,             // Sparks
    pub daily_cap: u128,              // Sparks, window = 43_200 blocks
    pub allowed_modules: Vec<ModuleId>,
    pub frozen: bool,
    // bookkeeping, not signed:
    pub window_start: u64,
    pub spent_in_window: u128,
}
```

- An account becomes an agent by a `Module { Accounts, SetAgentPolicy { agent, policy } }` transaction signed by `policy.controller`. The agent's own key cannot change its policy. Setting `controller == agent` is rejected.
- `Freeze { agent }` / `Unfreeze { agent }`: controller only. A frozen agent's transactions are rejected at admission and at execution.
- Admission and execution both enforce: `call.module ∈ allowed_modules`; for `Transfer`, `amount <= per_tx_cap` and `spent_in_window + amount <= daily_cap`.
- `RotateController { agent, new_controller }`: current controller only.

---

## 9. Execution and receipts

```rust
#[derive(Encode, Decode)]
pub struct Receipt {
    pub tx_hash: Hash,
    pub outcome: Outcome,            // Ok | Failed(ErrorCode)
    pub energy_used: u32,
    pub events: Vec<Event>,          // module-emitted, SCALE
}
```

`receipt_hash = blake2b_256(scale(receipt))`; `receipts_root = merkle_root(receipt hashes)`.

Execution of one transaction, in order:

1. Load `AccountInfo(from)`. Reject block if `tx.nonce != nonce` (a block containing a bad-nonce tx is invalid; this can only happen with a malicious author).
2. Charge energy: `cost = energy_cost(call)`, MUST be `<= tx.energy_limit`; deduct from `from`'s projected energy. If insufficient the block is invalid (admission already guaranteed it for honest authors).
3. Increment nonce. (Steps 1–3 are committed even if step 5 fails.)
4. Session/agent checks as in §8 (execution copy; admission may be stale).
5. Dispatch `call` inside a nested overlay. On `Err`, discard the nested overlay, record `Failed(code)`.
6. Append receipt.

Energy costs (Sparks are unrelated; energy is its own unit): `Transfer 100`, `Drc369::Mint 500`, `Drc369::Transfer 200`, `Drc369::AddXp 50`, `SessionKeys::* 100`, `Accounts::* 100`, `Staking::* 300`, other module calls `100`. These are constants in `core::energy_cost` and are the only fee table until Spec 04 introduces fuel.

`BASE_TX_COST` in the energy module becomes `100`. `MAX_ENERGY = 10_000`, `REGEN_PER_BLOCK = 20` (so a fresh account can send one transfer every 5 blocks sustained, 100 in a burst). Cold-start fix: an account with no `Energy:LastUpdate` gets `MAX_ENERGY` on first touch, not `blocks_since_genesis * regen`.

---

## 10. Module fixes required by this spec

**balances**
- `EXISTENTIAL_DEPOSIT` becomes `1` Spark and the dust check works. A transfer that would leave `0 < balance < ED` is rejected.
- All arithmetic `checked_*`; overflow is an error, never a panic.
- `Mint` and `Burn` are privileged: only reachable from staking rewards (§11) and treasury (governance, later). No transaction can call them.

**drc369**
- `Mint` requires the caller to be the collection owner or a registered minter. Collections: `Drc369:Coll:` || id → `{ owner, minters: Vec<AccountId>, max_supply: Option<u64>, minted: u64 }`. `CreateCollection` is a new call. Tokens carry `collection: u64`.
- `TransferWithPayment` debits the buyer and credits seller and creator through `balances` inside the same overlay, or fails atomically.
- `Nest` walks ancestors and rejects cycles; depth ≤ 8. `Transfer` of a nested child is rejected unless the caller owns the root.
- `UpdateState` may no longer set `xp` or `level`; only `AddXp` changes them, and only callers in the collection's `minters` (games) may call `AddXp`.
- `Rent`, `EndRent`, `Freeze`, `Unfreeze` become extrinsics backed by the existing `rental.rs`/`security.rs` code; the other unreachable library files (`fractional`, `royalty_distributor`, `metaverse`, `physics_integration`) move to `framework/research/drc369-extras/`.

**session-keys** — replaced by §8.1.

**staking (consensus)** — §11.

---

## 11. Staking as transactions

`Staking` module (new crate `modules/staking`, moves logic out of `consensus/src/staking.rs`):

- Calls: `Register { commission_bps }`, `Stake { validator, amount }`, `Unstake { validator, amount }`, `Claim`, `SetCommission { bps }`.
- `Stake` moves CGT from the staker's free balance to `Staking:Bonded:` (a locked ledger the balances module honours: free balance = total − bonded − unbonding). `Unstake` moves to `Staking:Unbonding:` with `release_at = now + 302_400` blocks (7 days); `Claim` releases matured entries.
- Era rewards (`consensus` calls `Staking::pay_era`) mint into `Balances` via the privileged path, respecting the 13B cap, and credit validators and nominators pro rata after commission. Nothing accrues in memory.
- The validator set for block authorship at height `h` is the set of registered validators with `bonded >= MIN_STAKE (10_000 CGT)` as of the era start containing `h`.

The RPC methods `consensus_registerValidator`, `stake`, `unstake`, `claimRewards`, `updateCommission` were removed in Phase 0 and are not restored; clients build a `Staking` transaction.

---

## 12. RPC surface (delta)

New or changed:

| Method | Params | Returns |
|--------|--------|---------|
| `chain_getInfo` | — | `{ chain_id, genesis_hash, spec_version, block_time_ms, latest_number }` |
| `chain_getNonce` | `account` | `u64` (account nonce, **not** including mempool) |
| `chain_getNextNonce` | `account` | `u64` (account nonce + queued) |
| `author_submitExtrinsic` | `0x` SCALE tx | `tx_hash` or structured error |
| `author_pendingExtrinsics` | — | `[tx_hash]` |
| `chain_getReceipt` | `tx_hash` | `Receipt` + block number, or null |
| `state_getProof` | `key_hex, block_number?` | `{ value, proof }` |
| `energy_getEnergy` | `account` | `{ current, projected_next_block, max, regen }` |
| `session_getGrants` | `account` | `[SessionGrant + spent]` |
| `accounts_getInfo` | `account` | `AccountInfo` |
| `chain_subscribeNewHeads` | — | header stream (the Phase 0 finding that subscription sends are never awaited is fixed here) |

Removed: `balances_hasClaimedStarter`, `sessionKeys_getActiveKeys`, `consensus_getPendingRewards` (replaced by `staking_getLedger`).

---

## 13. SDK and wallet alignment

- `sdk/src/tx.ts` implements `encodeTransaction`, `signingPayload`, `txHash` exactly per §3, with test vectors generated from the Rust implementation and checked in at `framework/core/tests/vectors/tx_v2.json`. The TypeScript tests load the same file.
- The wallet extension's `demiurge-tx-v0` placeholder is replaced by the SDK encoder. `numericChainId` values become `369 / 3690 / 36900`, and Studio projects put their `chain_id` in `project.json`.
- The Hub's `transaction-builder.ts` uses the SDK; no other RPC client in the tree may encode transactions.

---

## 14. Tests that gate Phase 1 exit

| Area | Test |
|------|------|
| core | Property test: any single-byte mutation of a signed tx fails `validate_stateless`. |
| core | Vectors: 20 fixed txs → known payload, signature (fixed key), hash; shared with TypeScript. |
| core | Merkle: root and proof for 0, 1, 2, 3, 7, 8, 1000 leaves; odd-leaf duplication attack rejected. |
| storage | JMT root equal across two independent applications; proof verifies; batch atomicity under injected crash. |
| mempool | Nonce gaps hold; out-of-order arrival becomes ready in order; energy reservation rejects the 101st transfer from a fresh account; per-sender cap. |
| runtime | Failed call consumes nonce and energy and rolls back writes. |
| session | Session key cannot exceed spend cap, cannot call disallowed module, cannot extend own grant. |
| agent | Frozen agent rejected; daily cap enforced across window boundary. |
| drc369 | Unauthorised mint rejected; paid transfer moves CGT atomically; cycle rejected; XP only via `AddXp`. |
| staking | Rewards appear in balances; total supply never exceeds cap; unbonding matures at the right height. |
| node | Integration: start node, submit 10k transfers over RPC from 100 accounts, all included within 60 s, replay of any tx rejected, restart node and state root unchanged. |
| block | Block with wrong author signature rejected before execution; block with bad nonce rejected. |

Exit criterion from `ROADMAP.md`: *10k signed transfers over RPC; replays rejected; state root reproducible from genesis on a second machine.*

---

## 15. Work breakdown

| # | Workstream | Crates | Depends on |
|---|-----------|--------|------------|
| A | Transaction v2, Block v2, hashing, Merkle, Accounts module (nonce, kinds), receipts | core, modules/accounts (new) | — |
| B | Overlay + JMT state tree + single RocksDB + atomic commit | storage, node (db open) | — |
| C | Energy constants and `projected`, session grants, agent policy enforcement in runtime | modules/energy, modules/session-keys, modules/accounts, core/runtime | A |
| D | DRC-369 fixes, collections, rental/freeze extrinsics, research move | modules/drc369 | A (ModuleId only) |
| E | Staking module + rewards to balances + balances ED/overflow/privilege | modules/staking (new), modules/balances, consensus | A |
| F | Mempool, admission, block building | network/pool → core/mempool | A, C |
| G | RPC delta, node wiring, subscriptions fixed | rpc, node | A, B, F |
| H | SDK tx encoder + vectors, wallet extension alignment, Hub transaction-builder | sdk, apps/wallet-extension, apps/hub | A |
| I | Integration test harness (10k tx) | framework/tests (new) | G |

A, B, D, E can start immediately and in parallel. C after A. F after C. G after B and F. H after A's vectors exist. I last.
