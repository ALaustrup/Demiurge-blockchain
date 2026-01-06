# Bank CGT Module

The `bank_cgt` module manages the native Creator God Token (CGT) for the Demiurge chain. It handles balance tracking, transfers, minting, and supply control.

## Overview

The Bank CGT module is responsible for:
- **Balance Management**: Tracking CGT balances for all addresses (in smallest units, 10^-8)
- **Transfers**: Processing CGT transfers between addresses
- **Minting**: Controlled minting with max supply enforcement
- **Supply Tracking**: Maintaining total supply on-chain
- **Nonce Management**: Tracking transaction nonces per address

## Token Specifications

- **Name**: Creator God Token
- **Symbol**: CGT
- **Decimals**: 8 (smallest unit: 10^-8 CGT)
- **Max Supply**: 369,000,000,000 CGT (369 billion)
- **Storage**: All amounts stored as `u128` in smallest units

## Module Functions

### Balance Operations

#### `get_balance_cgt(state: &State, addr: &Address) -> u128`

Returns the CGT balance for a given address in smallest units.

#### `cgt_transfer(state: &mut State, from: &Address, to: &Address, amount: u128) -> Result<(), String>`

Transfers CGT from one address to another. Validates sufficient balance before transfer.

### Minting Operations

#### `cgt_mint_to(state: &mut State, to: &Address, amount: u128, caller_module: &str) -> Result<(), String>`

Mints new CGT to an address. Only authorized modules can mint:
- `forge` - Block production rewards
- `fabric_manager` - Fabric seeding rewards
- `system` - System-level operations
- `urgeid_registry` - UrgeID level rewards
- `urgeid_level_rewards` - Level-based rewards
- `work_claim` - Arcade mining rewards

**Enforcement:**
- Validates max supply limit
- Updates total supply on-chain
- Rejects minting if it would exceed max supply

### Supply Operations

#### `get_cgt_total_supply(state: &State) -> Result<u128, Error>`

Returns the current total CGT supply from state.

#### `set_cgt_total_supply(state: &mut State, amount: u128) -> Result<(), Error>`

Sets the total CGT supply (used during genesis initialization).

### Nonce Operations

#### `get_nonce_cgt(state: &State, addr: &Address) -> u64`

Returns the current transaction nonce for an address.

#### `set_nonce_cgt(state: &mut State, addr: &Address, nonce: u64) -> Result<(), String>`

Sets the transaction nonce for an address (used by RPC layer).

## Transaction Handlers

### `handle_transfer(tx: &Transaction, state: &mut State) -> Result<(), String>`

Processes a CGT transfer transaction. The payload must contain:
```rust
pub struct TransferParams {
    pub to: Address,
    pub amount: u128,
}
```

**Validation:**
- Checks sufficient balance
- Validates amount > 0
- Prevents self-transfers (optional)

## State Storage

The module uses the following storage keys:
- `bank:balance:{address}` - Balance for each address
- `bank:nonce:{address}` - Nonce for each address
- `bank_cgt/total_supply` - Total CGT supply

## Integration

The Bank CGT module is integrated with:
- **Work Claim Module**: Mints CGT rewards for arcade mining
- **Forge Module**: Mints block production rewards
- **Fabric Manager**: Mints seeding rewards
- **UrgeID Registry**: Mints level-based rewards

## RPC Integration

The module is exposed via RPC endpoints:
- `cgt_getBalance(address)` - Query balance
- `cgt_getTotalSupply()` - Query total supply
- `cgt_getNonce(address)` - Query nonce
- `cgt_buildTransferTx(...)` - Build transfer transaction

## See Also

- [Runtime Modules Overview](../overview/RUNTIME.md)
- [Work Claim Module](WORK_CLAIM_MODULE.md)
- [RPC API](../api/RPC.md)
