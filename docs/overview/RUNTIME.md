# Demiurge Runtime Modules

This document describes all runtime modules available in the Demiurge chain. The runtime system uses a modular architecture where each module handles a specific domain of functionality.

**Last Updated**: January 5, 2026  
**Runtime Version**: 1  
**Total Modules**: 9

## Module Registration Order

Modules are registered in a deterministic order (defined in `chain/src/runtime/mod.rs`):

1. `bank_cgt` - CGT token operations
2. `urgeid_registry` - Identity and profile management
3. `nft_dgen` - D-GEN NFT standard
4. `fabric_manager` - P2P Fabric asset management
5. `abyss_registry` - Marketplace listings
6. `developer_registry` - Developer profiles and projects
7. `dev_capsules` - Development capsule management
8. `recursion_registry` - Recursion world management
9. `work_claim` - Work-claim mining rewards

**Important**: Module registration order is versioned and must remain consistent. Changes require incrementing `RUNTIME_VERSION` in `version.rs`.

## Module Details

### 1. Bank CGT Module (`bank_cgt`)

**Purpose**: Handles all Creator God Token (CGT) operations including balances, transfers, minting, and supply management.

#### Constants

- `CGT_NAME`: "Creator God Token"
- `CGT_SYMBOL`: "CGT"
- `CGT_DECIMALS`: 8 (smallest unit: 10^-8 CGT)
- `CGT_MAX_SUPPLY`: 369,000,000,000 CGT * 10^8 = 36,900,000,000,000,000,000 smallest units

#### Public Functions

- `get_balance_cgt(state, address) -> u128`: Get CGT balance for an address (in smallest units)
- `get_nonce_cgt(state, address) -> u64`: Get transaction nonce for an address
- `set_nonce_cgt(state, address, nonce) -> Result<(), String>`: Set transaction nonce
- `get_cgt_total_supply(state) -> u128`: Get total CGT supply (in smallest units)
- `cgt_mint_to(state, to, amount, caller_module) -> Result<(), String>`: Mint CGT to an address (authorized modules only)
- `cgt_burn_from(state, from, amount, caller_module) -> Result<(), String>`: Burn CGT from an address

#### Transaction Calls

- `transfer`: Transfer CGT between addresses
  - Parameters: `{ to: Address, amount: u128 }` (amount in smallest units)
  - Validates balance, updates nonce, enforces max supply

- `mint_to`: Mint CGT (genesis authority only in production)
  - Parameters: `{ to: Address, amount: u128 }`
  - Enforces max supply limit
  - Updates total supply

#### Storage Keys

- Balance: `bank:balance:{address}`
- Nonce: `bank:nonce:{address}`
- Total Supply: `bank_cgt/total_supply`

---

### 2. UrgeID Registry Module (`urgeid_registry`)

**Purpose**: Manages user identity profiles, usernames, handles, Syzygy scores, leveling system, and badges.

#### Data Structures

```rust
pub struct UrgeIDProfile {
    pub address: Address,
    pub display_name: String,
    pub bio: Option<String>,
    pub handle: Option<String>,      // Legacy, use username instead
    pub username: Option<String>,     // Globally unique, normalized
    pub level: u32,                   // Starts at 1
    pub syzygy_score: u64,            // Contribution score
    pub total_cgt_earned_from_rewards: u128,
    pub badges: Vec<String>,
    pub created_at_height: u64,
}
```

#### Public Functions

- `create_urgeid_profile(state, address, display_name, bio, current_height) -> Result<UrgeIDProfile, String>`: Create a new UrgeID profile
- `get_urgeid_profile(state, address) -> Option<UrgeIDProfile>`: Get profile by address
- `set_username(state, caller, username) -> Result<(), String>`: Set globally unique username (3-32 chars, lowercase alphanumeric + dots/underscores)
- `get_address_by_username(state, username) -> Result<Option<Address>, String>`: Resolve username to address
- `set_handle(state, address, handle) -> Result<UrgeIDProfile, String>`: Set handle (legacy, 3-32 chars, lowercase alphanumeric + underscores)
- `get_address_by_handle(state, handle) -> Option<Address>`: Resolve handle to address
- `record_syzygy(state, address, amount) -> Result<(), String>`: Record Syzygy contribution and update level/rewards
- `is_archon(state, address) -> bool`: Check if address has Archon status (for backward compatibility)

#### Transaction Calls

- `create_profile`: Create a new UrgeID profile
  - Parameters: `{ display_name: String, bio: Option<String> }`
  - Initializes profile with level 1, syzygy_score 0

- `set_username`: Set or update username
  - Parameters: `{ username: String }`
  - Validates format (3-32 chars, lowercase alphanumeric + dots/underscores)
  - Enforces global uniqueness
  - Updates username mapping

- `set_handle`: Set or update handle (legacy)
  - Parameters: `{ handle: String }`
  - Validates format (3-32 chars, lowercase alphanumeric + underscores)

- `record_syzygy`: Record contribution
  - Parameters: `{ amount: u64 }`
  - Updates syzygy_score
  - Calculates level based on syzygy (level = 1 + (syzygy_score / 1000))
  - Mints CGT rewards for level-ups
  - Awards "Luminary" badge at 10,000 syzygy

#### Username Rules

- Length: 3-32 characters
- Characters: lowercase letters (a-z), numbers (0-9), underscores (_), dots (.)
- Cannot start or end with a dot
- Cannot contain consecutive dots
- Globally unique across all users

#### Leveling System

- Level = 1 + (syzygy_score / 1000)
- Each level-up mints CGT reward: `level * 1000 * 10^8` smallest units
- Rewards are cumulative (e.g., reaching level 5 gives rewards for levels 2, 3, 4, and 5)

#### Badges

- **Luminary**: Awarded when syzygy_score >= 10,000

#### Storage Keys

- Profile: `urgeid/profile:{address}`
- Username mapping: `username/{normalized_username}`
- Handle mapping: `urgeid/handle/{handle}`
- Archon flag: `avatars:archon:{address}`

---

### 3. NFT D-GEN Module (`nft_dgen`)

**Purpose**: Manages D-GEN NFT (D-721 standard) minting, transfers, ownership, and metadata.

#### Data Structures

```rust
pub enum NftClass {
    DGen,      // Standard D-GEN NFT
    DevBadge,  // Developer Badge NFT (auto-minted for developers)
}

pub struct DGenMetadata {
    pub creator: Address,
    pub owner: Address,
    pub fabric_root_hash: [u8; 32],
    pub forge_model_id: Option<[u8; 32]>,
    pub forge_prompt_hash: Option<[u8; 32]>,
    pub royalty_recipient: Option<Address>,
    pub royalty_bps: u16,  // Basis points (0-10000 = 0-100%)
    pub class: Option<NftClass>,
}
```

#### Public Functions

- `get_nft(state, id) -> Option<DGenMetadata>`: Get NFT metadata by ID
- `get_nfts_by_owner(state, owner) -> Vec<NftId>`: Get all NFT IDs owned by an address
- `system_mint_dev_nft(state, owner, username, caller_module) -> Result<NftId, String>`: System function to mint DEV Badge NFT

#### Transaction Calls

- `mint_dgen`: Mint a new D-GEN NFT (Archons only)
  - Parameters: `{ fabric_root_hash: [u8; 32], forge_model_id: Option<[u8; 32]>, forge_prompt_hash: Option<[u8; 32]>, royalty_recipient: Option<Address>, royalty_bps: u16 }`
  - Requires Archon status
  - Assigns sequential NFT ID
  - Sets creator and owner to transaction sender

- `transfer`: Transfer NFT to another address
  - Parameters: `{ token_id: NftId, to: Address }`
  - Validates ownership
  - Updates owner and owner's NFT list

#### Special Features

- **DEV Badge NFTs**: Special NFT class auto-minted when developers register
- **Fabric Root Hash**: Links NFT to P2P Fabric content
- **Royalties**: Configurable royalty recipient and percentage (basis points)

#### Storage Keys

- NFT metadata: `nft:token:{id}`
- Owner's NFTs: `nft:owner:{address}`
- NFT counter: `nft:counter`
- DEV Badge tracking: `nft:dev_badge:{address}`

---

### 4. Fabric Manager Module (`fabric_manager`)

**Purpose**: Manages P2P Fabric asset registration and CGT fee pools for seeder rewards.

#### Data Structures

```rust
pub struct FabricAsset {
    pub owner: Address,
    pub fabric_root_hash: [u8; 32],
    pub pool_cgt_total: u128,
    pub pool_cgt_remaining: u128,
}
```

#### Public Functions

- `get_fabric_asset(state, root_hash) -> Option<FabricAsset>`: Get Fabric asset by root hash

#### Transaction Calls

- `register_asset`: Register a Fabric asset with initial CGT pool
  - Parameters: `{ fabric_root_hash: [u8; 32], initial_pool_cgt: u128 }`
  - Creates asset record
  - Transfers CGT from caller to fee pool

- `reward_seeder`: Distribute CGT reward to a seeder
  - Parameters: `{ fabric_root_hash: [u8; 32], seeder: Address, amount_cgt: u128 }`
  - Validates asset exists
  - Checks pool has sufficient balance
  - Transfers CGT from pool to seeder
  - Updates pool remaining balance

#### Use Cases

- Archons register Fabric content with initial reward pool
- Seeders earn CGT for serving content (Proof-of-Delivery)
- Fee pools ensure sustainable seeder incentives

#### Storage Keys

- Asset: `fabric:asset:{fabric_root_hash}`

---

### 5. Abyss Registry Module (`abyss_registry`)

**Purpose**: Manages NFT marketplace listings, purchases, and royalty distribution.

#### Data Structures

```rust
pub struct Listing {
    pub id: ListingId,
    pub token_id: NftId,
    pub seller: Address,
    pub price_cgt: u128,  // Price in smallest CGT units
    pub active: bool,
}
```

#### Public Functions

- `get_listing(state, id) -> Option<Listing>`: Get listing by ID
- `get_all_active_listings(state) -> Vec<Listing>`: Get all active marketplace listings

#### Transaction Calls

- `create_listing`: Create a marketplace listing
  - Parameters: `{ token_id: NftId, price_cgt: u128 }`
  - Validates NFT ownership
  - Creates listing with sequential ID
  - Sets seller to transaction sender

- `cancel_listing`: Cancel an active listing
  - Parameters: `{ listing_id: ListingId }`
  - Validates seller ownership
  - Marks listing as inactive

- `buy_listing`: Purchase an NFT from marketplace
  - Parameters: `{ listing_id: ListingId }`
  - Validates listing is active
  - Transfers CGT from buyer to seller
  - Distributes royalties to creator (if configured)
  - Transfers NFT ownership
  - Marks listing as inactive

#### Royalty Distribution

- If NFT has `royalty_recipient` and `royalty_bps`:
  - Royalty = `price_cgt * royalty_bps / 10000`
  - Seller receives: `price_cgt - royalty`
  - Creator receives: `royalty`

#### Storage Keys

- Listing: `abyss:listing:{id}`
- Listing counter: `abyss:listing:counter`

---

### 6. Developer Registry Module (`developer_registry`)

**Purpose**: Manages developer profiles, project registration, and reputation tracking.

#### Data Structures

```rust
pub struct DeveloperProfile {
    pub address: Address,
    pub username: String,  // Must match UrgeID username
    pub projects: Vec<String>,  // Project slugs
    pub reputation: u64,
    pub created_at: u64,
}
```

#### Public Functions

- `register_developer(state, address, username, current_height) -> Result<(), String>`: Register a new developer
- `get_developer_profile(state, address) -> Option<DeveloperProfile>`: Get developer profile
- `get_developer_by_username(state, username) -> Option<Address>`: Resolve developer username to address
- `get_all_developers(state) -> Vec<Address>`: Get all registered developer addresses
- `add_project(state, address, project_slug) -> Result<(), String>`: Add project to developer
- `get_project_maintainers(state, project_slug) -> Vec<Address>`: Get maintainers for a project

#### Transaction Calls

- `register`: Register as a developer
  - Parameters: `{ username: String }`
  - Validates username format (3-32 chars, lowercase alphanumeric + underscore)
  - Enforces username uniqueness
  - Auto-mints DEV Badge NFT
  - Creates developer profile with reputation 0

- `add_project`: Add a project to developer profile
  - Parameters: `{ project_slug: String }`
  - Validates slug format
  - Adds to developer's projects list
  - Creates project maintainer mapping

#### Auto-Minting

- When a developer registers, the system automatically mints a DEV Badge NFT
- DEV Badge has special `fabric_root_hash`: `0xDE5BAD6E...` (constant)
- NFT class is set to `NftClass::DevBadge`

#### Storage Keys

- Profile: `developer/profile:{address}`
- Username mapping: `developer/username:{username}`
- Project maintainers: `developer/project:{project_slug}`
- All developers: `developer/all`

---

### 7. Dev Capsules Module (`dev_capsules`)

**Purpose**: Manages development capsules - project-bound execution environments tracked on-chain.

#### Data Structures

```rust
pub enum CapsuleStatus {
    Draft,
    Live,
    Paused,
    Archived,
}

pub struct DevCapsule {
    pub id: u64,
    pub owner: Address,
    pub project_slug: String,
    pub status: CapsuleStatus,
    pub created_at: u64,
    pub updated_at: u64,
    pub notes: String,
}
```

#### Public Functions

- `create_capsule(state, owner, project_slug, notes, created_at) -> Result<DevCapsule, String>`: Create a new capsule
- `get_capsule(state, id) -> Option<DevCapsule>`: Get capsule by ID
- `list_capsules_by_owner(state, owner) -> Vec<DevCapsule>`: List all capsules owned by address
- `list_capsules_by_project(state, project_slug) -> Vec<DevCapsule>`: List all capsules for a project
- `update_capsule_status(state, id, status) -> Result<DevCapsule, String>`: Update capsule status
- `update_capsule_notes(state, id, notes) -> Result<DevCapsule, String>`: Update capsule notes

#### Transaction Calls

- `create`: Create a new development capsule
  - Parameters: `{ project_slug: String, notes: String }`
  - Validates project_slug (1-100 characters)
  - Assigns sequential capsule ID
  - Initial status: `Draft`

- `update_status`: Update capsule status
  - Parameters: `{ id: u64, status: String }` (draft, live, paused, archived)
  - Validates ownership
  - Updates status and `updated_at` timestamp

- `update_notes`: Update capsule notes
  - Parameters: `{ id: u64, notes: String }`
  - Validates ownership
  - Updates notes and `updated_at` timestamp

#### Use Cases

- Track development environments per project
- Manage deployment states (draft → live → paused → archived)
- Store project-specific notes and metadata

#### Storage Keys

- Capsule by ID: `capsule:by_id:{id}`
- Capsules by owner: `capsule:by_owner:{address}`
- Capsules by project: `capsule:by_project:{project_slug}`
- Capsule counter: `capsule:counter`

---

### 8. Recursion Registry Module (`recursion_registry`)

**Purpose**: Manages Recursion Worlds - chain-native game worlds with Fabric content.

#### Data Structures

```rust
pub struct RecursionWorldMeta {
    pub world_id: String,
    pub owner: Address,
    pub title: String,
    pub description: String,
    pub fabric_root_hash: String,  // Hex-encoded
    pub created_at: u64,
}
```

#### Public Functions

- `create_world(state, owner, world_id, title, description, fabric_root_hash, created_at) -> Result<RecursionWorldMeta, String>`: Create a new Recursion World
- `get_world(state, world_id) -> Option<RecursionWorldMeta>`: Get world by ID
- `list_worlds_by_owner(state, owner) -> Vec<RecursionWorldMeta>`: List all worlds owned by address

#### Transaction Calls

- `create`: Create a new Recursion World
  - Parameters: `{ world_id: String, title: String, description: String, fabric_root_hash: String }`
  - Validates world_id (1-100 characters)
  - Enforces world_id uniqueness
  - Links world to Fabric content via root hash

#### Use Cases

- Register game worlds on-chain
- Link worlds to P2P Fabric content
- Track world ownership and metadata
- Enable world discovery and browsing

#### Storage Keys

- World: `recursion:world:{world_id}`
- Worlds by owner: `recursion:worlds_by_owner:{address}`

---

### 9. Work Claim Module (`work_claim`)

**Purpose**: Processes work claims from arcade miners (e.g., Mandelbrot game) and mints CGT rewards based on work metrics.

#### Configuration Constants

- `DEPTH_FACTOR`: 100.0 (CGT per unit of depth_metric)
- `TIME_FACTOR`: 0.1 (CGT per second of active_ms)
- `MAX_REWARD_PER_CLAIM`: 1,000,000 CGT (1M * 10^8 smallest units)
- `MIN_ACTIVE_MS`: 1000 (minimum 1 second of activity)
- `MAX_DEPTH_METRIC`: 1,000,000.0 (reasonable upper bound)

#### Public Functions

- `calculate_reward(depth_metric: f64, active_ms: u64) -> u128`: Calculate CGT reward for a work claim
  - Formula: `(depth_metric * DEPTH_FACTOR + (active_ms / 1000.0) * TIME_FACTOR).min(MAX_REWARD_PER_CLAIM)`
  - Returns reward in smallest CGT units

#### Transaction Calls

- `submit`: Submit a work claim
  - Parameters: `{ game_id: String, session_id: String, depth_metric: f64, active_ms: u64, extra: Option<String> }`
  - Validates:
    - `active_ms >= MIN_ACTIVE_MS` (1000ms minimum)
    - `depth_metric >= 0 && depth_metric <= MAX_DEPTH_METRIC`
    - `game_id` and `session_id` cannot be empty
  - Calculates reward using `calculate_reward()`
  - Mints CGT to claim address via `bank_cgt::cgt_mint_to()`

#### Validation Rules

- `active_ms` must be >= 1000 (1 second minimum)
- `depth_metric` must be >= 0 and <= 1,000,000.0
- `game_id` and `session_id` cannot be empty strings
- Claim address must match transaction sender

#### Use Cases

- Arcade game miners submit work claims
- Mandelbrot set exploration rewards
- Verifiable compute work rewards
- Proof-of-Work alternative rewards

---

## Module Interaction

### Cross-Module Dependencies

- **Abyss Registry** → **NFT D-GEN**: Transfers NFTs during purchases
- **Abyss Registry** → **Bank CGT**: Handles CGT transfers and royalties
- **Developer Registry** → **NFT D-GEN**: Auto-mints DEV Badge NFTs
- **Fabric Manager** → **Bank CGT**: Manages CGT fee pools
- **Work Claim** → **Bank CGT**: Mints CGT rewards

### Module Isolation

- Each module manages its own storage keys (using prefixes)
- Modules communicate via public functions, not direct state access
- State mutations are atomic per transaction

---

## Runtime Integrity

The runtime system includes integrity checks to ensure:

- Module registration order is deterministic
- Module count matches expected value (9 modules)
- Module IDs match expected sequence

See `chain/src/runtime/version.rs` for integrity verification logic.

---

## Transaction Flow

1. Transaction received via RPC (`cgt_sendRawTransaction`)
2. Transaction validated (signature, nonce, balance for fees)
3. Runtime dispatches to appropriate module based on `module_id`
4. Module executes `call_id` with transaction payload
5. State updates are committed atomically
6. Transaction hash stored for tracking

---

## Storage Architecture

All modules use the same state abstraction:

- **Backend**: RocksDB (production) or in-memory (testing)
- **Key-Value Store**: Simple `get_raw`/`put_raw` interface
- **Serialization**: Bincode for Rust types
- **Key Prefixes**: Each module uses unique prefixes to avoid collisions

---

*For API documentation, see [RPC API](../api/RPC.md). For architecture details, see [Architecture Overview](ARCHITECTURE_DEMIURGE_CURRENT.md).*
