# Demiurge Runtime Modules

This document describes the runtime modules available in the Demiurge chain.

## CGT Token Module

**Module ID**: `bank_cgt`

The CGT (Creator God Token) module handles all token operations.

### Functions

- `get_balance_cgt(state, address) -> u128`: Get CGT balance for an address
- `cgt_mint_to(state, to, amount, caller_module) -> Result<(), String>`: Mint CGT to an address (authorized modules only)
- `cgt_burn_from(state, from, amount, caller_module) -> Result<(), String>`: Burn CGT from an address
- `get_cgt_total_supply(state) -> u128`: Get total CGT supply

### Transaction Calls

- `transfer`: Transfer CGT between addresses
  - Parameters: `{ to: Address, amount: u128 }`
- `mint_to`: Mint CGT (genesis authority only)
  - Parameters: `{ to: Address, amount: u128 }`

### Constants

- `CGT_MAX_SUPPLY`: 1,000,000,000 CGT * 10^8 = 100,000,000,000,000,000 smallest units
- `CGT_DECIMALS`: 8
- `CGT_SYMBOL`: "CGT"
- `CGT_NAME`: "Creator God Token"

## WorkClaim Mining Module

**Module ID**: `work_claim`

The work-claim module processes work claims from arcade miners (e.g., Mandelbrot game) and mints CGT rewards based on work metrics.

### Functions

- `calculate_reward(depth_metric: f64, active_ms: u64) -> u128`: Calculate CGT reward for a work claim

### Transaction Calls

- `submit`: Submit a work claim
  - Parameters: `{ game_id: String, session_id: String, depth_metric: f64, active_ms: u64, extra: Option<String> }`
  - Validates claim parameters
  - Calculates reward using formula: `(depth_metric * DEPTH_FACTOR + (active_ms / 1000.0) * TIME_FACTOR).min(MAX_REWARD_PER_CLAIM)`
  - Mints CGT to the claim address

### Configuration Constants

- `DEPTH_FACTOR`: 100.0 (CGT per unit of depth_metric)
- `TIME_FACTOR`: 0.1 (CGT per second of active_ms)
- `MAX_REWARD_PER_CLAIM`: 1,000,000 CGT (1M * 10^8 smallest units)
- `MIN_ACTIVE_MS`: 1000 (minimum 1 second of activity)
- `MAX_DEPTH_METRIC`: 1,000,000.0 (reasonable upper bound)

### Validation Rules

- `active_ms` must be >= `MIN_ACTIVE_MS` (1000ms)
- `depth_metric` must be >= 0 and <= `MAX_DEPTH_METRIC`
- `game_id` and `session_id` cannot be empty
- Claim address must match transaction sender

## Other Modules

- `urgeid_registry`: UrgeID profiles and Syzygy tracking
- `nft_dgen`: D-GEN NFT minting and ownership
- `fabric_manager`: Fabric asset management
- `abyss_registry`: Marketplace listings
- `developer_registry`: Developer profiles and projects
- `dev_capsules`: Development capsule management
- `recursion_registry`: Recursion world management

