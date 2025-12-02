# Work Claim Module

The `work_claim` module enables "arcade mining" by processing work claims from external applications (e.g., Mandelbrot game) and issuing CGT rewards based on proof of work.

## Overview

The Work Claim module allows external applications to submit proof of computational work, which is then converted into CGT tokens. This enables a novel "play-to-earn" or "compute-to-earn" model where users can earn CGT by performing work in games or applications.

## Purpose

- Process work claims from arcade miners
- Calculate CGT rewards based on work metrics
- Validate claim parameters
- Mint CGT rewards via the Bank CGT module
- Emit events for claim processing

## Work Claim Structure

### WorkClaimParams

The transaction payload structure:

```rust
pub struct WorkClaimParams {
    pub game_id: String,        // Identifier for the game/application
    pub session_id: String,      // Unique session identifier
    pub depth_metric: f64,       // Metric of work performed (e.g., fractal depth)
    pub active_ms: u64,          // Milliseconds the miner was active
    pub extra: Option<String>,   // Optional metadata
}
```

### WorkClaim

The full work claim structure (includes address from transaction):

```rust
pub struct WorkClaim {
    pub address: Address,        // Miner address (from transaction)
    pub game_id: String,
    pub session_id: String,
    pub depth_metric: f64,
    pub active_ms: u64,
    pub extra: Option<String>,
}
```

## Reward Calculation

Rewards are calculated using the following formula:

```
reward = (depth_metric * DEPTH_FACTOR + (active_ms / 1000.0) * TIME_FACTOR).min(MAX_REWARD_PER_CLAIM)
```

### Constants

- **DEPTH_FACTOR**: `100.0` - CGT per unit of depth_metric
- **TIME_FACTOR**: `0.1` - CGT per second of active time
- **MAX_REWARD_PER_CLAIM**: `1,000,000 CGT` (100,000,000,000,000 smallest units)
- **MIN_ACTIVE_MS**: `1000` - Minimum 1 second of activity required
- **MAX_DEPTH_METRIC**: `1,000,000.0` - Reasonable upper bound

### Example Calculation

For a work claim with:
- `depth_metric = 10.0`
- `active_ms = 5000` (5 seconds)

```
depth_reward = 10.0 * 100.0 = 1000 CGT
time_reward = (5000 / 1000.0) * 0.1 = 0.5 CGT
total_reward = 1000.5 CGT (capped at MAX_REWARD_PER_CLAIM)
```

## Validation Rules

The module enforces the following validation:

1. **active_ms**: Must be at least `MIN_ACTIVE_MS` (1000ms)
2. **depth_metric**: Must be between `0.0` and `MAX_DEPTH_METRIC` (1,000,000.0)
3. **game_id**: Cannot be empty
4. **session_id**: Cannot be empty

## Transaction Handler

### `handle_submit_work_claim(tx: &Transaction, state: &mut State) -> Result<(), String>`

Processes a work claim transaction:

1. Deserializes `WorkClaimParams` from transaction payload
2. Builds full `WorkClaim` with address from transaction
3. Validates claim parameters
4. Calculates CGT reward
5. Mints CGT to the miner's address via `bank_cgt::cgt_mint_to`
6. Emits `WorkClaimProcessed` event (when event system is implemented)

## Module Registration

The module is registered in the runtime with:
- **Module ID**: `"work_claim"`
- **Call ID**: `"submit"`

## Integration

### Bank CGT Module

The Work Claim module integrates with the Bank CGT module to mint rewards:
- Calls `cgt_mint_to(state, &address, reward, "work_claim")`
- The Bank CGT module validates that `work_claim` is an authorized minting module

### RPC Integration

The module is exposed via RPC:
- `cgt_submitWorkClaim(payload)` - Submit a work claim and receive reward estimate

## Events

When the event system is implemented, the module will emit:
- `WorkClaimProcessed { address, game_id, session_id, reward_cgt }`

## Use Cases

1. **Arcade Mining**: Games like Mandelbrot fractals submit work claims
2. **Compute-to-Earn**: Distributed computing applications
3. **Proof-of-Work Games**: Games that require computational effort

## Security Considerations

- Maximum reward per claim prevents abuse
- Minimum active time prevents spam
- Depth metric bounds prevent invalid inputs
- Only authorized modules can mint CGT (enforced by Bank CGT module)

## See Also

- [Runtime Modules Overview](../overview/RUNTIME.md)
- [Bank CGT Module](BANK_CGT.md)
- [RPC API - Work Claim](../api/RPC.md#cgt_submitworkclaim)
