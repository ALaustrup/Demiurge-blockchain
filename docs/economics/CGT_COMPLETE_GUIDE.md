# Creator God Token (CGT) - Complete Implementation Guide

**Last Updated**: January 5, 2026

## Overview

Creator God Token (CGT) is the native currency of the Demiurge blockchain. It serves as the economic backbone for all on-chain activities, from transaction fees to marketplace purchases, content rewards, and creator monetization.

---

## Token Specifications

### Core Properties

- **Name**: Creator God Token
- **Symbol**: CGT
- **Decimals**: 8 (smallest unit: 10^-8 CGT)
- **Max Supply**: 369,000,000,000 CGT (369 billion)
- **Storage Format**: All amounts stored as `u128` in smallest units
- **Total Supply Formula**: `1,000,000,000 * 10^8 = 100,000,000,000,000,000` smallest units

### Technical Implementation

- **Module**: `bank_cgt` (first module in runtime registration order)
- **Storage Keys**:
  - Balance: `bank:balance:{address}`
  - Nonce: `bank:nonce:{address}`
  - Total Supply: `bank_cgt/total_supply`
- **Transaction Signing**: Ed25519 signatures
- **State Backend**: RocksDB (production) or in-memory (testing)

---

## Distribution Mechanisms

### 1. New User Bonus

**Amount**: 5,000 CGT per new AbyssID registration

**Method**: On-chain minting via `cgt_devFaucet` RPC method

**Restriction**: Users cannot send CGT until they mint or swap a DRC-369 NFT

**Purpose**: Welcome bonus to enable initial platform usage

**Implementation**:
- Minted via `cgt_mint_to()` with caller_module `"system"`
- Automatically triggers on AbyssID registration
- Enforced by `has_minted_nft` flag check before transfers

### 2. Level-Up Rewards (UrgeID)

**Amount**: 10 CGT per level-up

**Formula**: Level = 1 + (syzygy_score / 1000)

**Reward Calculation**: 
- Each level-up mints `10 * 10^8` smallest units (10 CGT)
- Rewards are cumulative (reaching level 5 gives rewards for levels 2, 3, 4, and 5)

**Module**: `urgeid_level_rewards` (authorized to mint)

**Example**:
- User reaches level 2 (1,000 syzygy): Receives 10 CGT
- User reaches level 3 (2,000 syzygy): Receives 10 CGT (total: 20 CGT)
- User reaches level 5 (4,000 syzygy): Receives 10 CGT (total: 40 CGT)

### 3. Work Claim Mining

**Purpose**: Rewards for arcade miners (e.g., Mandelbrot game exploration)

**Formula**: 
```
reward = (depth_metric * 100.0 + (active_ms / 1000.0) * 0.1).min(1,000,000 CGT)
```

**Constants**:
- `DEPTH_FACTOR`: 100.0 CGT per unit of depth_metric
- `TIME_FACTOR`: 0.1 CGT per second of active_ms
- `MAX_REWARD_PER_CLAIM`: 1,000,000 CGT (1M * 10^8 smallest units)
- `MIN_ACTIVE_MS`: 1000 (minimum 1 second)

**Module**: `work_claim` (authorized to mint)

**Validation**:
- `active_ms >= 1000` (1 second minimum)
- `depth_metric >= 0 && depth_metric <= 1,000,000.0`
- `game_id` and `session_id` cannot be empty

### 4. Fabric Seeding Rewards

**Purpose**: Rewards for P2P content seeders via Proof-of-Delivery

**Mechanism**:
- Archons register Fabric assets with initial CGT fee pools
- Seeders earn CGT from pools when they serve content
- Rewards distributed via `fabric_manager::reward_seeder()`

**Module**: `fabric_manager` (authorized to mint, but actually transfers from pools)

**Flow**:
1. Archon registers asset with `initial_pool_cgt` amount
2. CGT deducted from Archon's balance and added to pool
3. Seeders submit Proof-of-Delivery claims
4. System distributes CGT from pool to seeders

### 5. Block Production Rewards (Forge)

**Purpose**: Rewards for Forge miners who produce blocks

**Module**: `forge` (authorized to mint)

**Status**: Implementation pending (module exists but minting logic not yet implemented)

### 6. Compute Work Rewards

**Purpose**: Rewards for verifiable compute jobs

**Module**: `forge` (authorized to mint)

**Status**: Future implementation

---

## Authorized Minting Modules

Only the following modules can mint CGT (enforced in `cgt_mint_to()`):

1. **`forge`** - Block production rewards (future)
2. **`fabric_manager`** - Fabric seeding rewards (via pools)
3. **`system`** - System-level operations (genesis, new user bonuses)
4. **`urgeid_registry`** - UrgeID level rewards (legacy)
5. **`urgeid_level_rewards`** - Level-based rewards (current)
6. **`work_claim`** - Arcade mining rewards

**Security**: Any module not in this list will receive an error: `"module 'X' is not authorized to mint CGT"`

---

## Usage & Utilities

### 1. Transaction Fees

**Current Status**: Fees are set to 0 in most transactions (TODO: implement dynamic fees)

**Planned Implementation**:
- Dynamic fee calculation based on:
  - Transaction size/complexity
  - Network congestion
  - Priority level

**Fee Collection**: Currently fees are effectively burned (TODO: implement fee collection/burning)

### 2. Marketplace Operations

**Abyss Registry** (`abyss_registry` module):
- NFT listings priced in CGT
- Purchases transfer CGT from buyer to seller
- Royalties automatically distributed in CGT
- Royalty formula: `royalty = price_cgt * royalty_bps / 10000`

**Example Flow**:
1. Creator lists NFT for 100 CGT with 10% royalty (1,000 bps)
2. Buyer purchases NFT
3. Seller receives: 90 CGT (100 - 10)
4. Creator receives: 10 CGT (royalty)

### 3. Content Delivery (Fabric)

**Seeder Rewards**:
- Archons register Fabric assets with CGT fee pools
- Seeders earn CGT via Proof-of-Delivery
- Rewards distributed from pools (not minted, transferred from pools)

### 4. Transfers Between Users

**Format**: CGT transfers between AbyssID addresses

**Recipient Formats**:
- Username: `@username` (automatically resolved to address)
- Address: 64-character hex string (e.g., `0992f7f1...fc4c`)

**Transaction Flow**:
1. User builds transfer transaction via `cgt_buildTransferTx`
2. Transaction signed with Ed25519 private key
3. Transaction submitted via `cgt_sendRawTransaction`
4. Balance updated on-chain
5. Nonce incremented

---

## Restrictions & Policies

### Send Restriction

**Policy**: New users cannot send CGT until they have minted or swapped a DRC-369 NFT.

**Rationale**:
- Encourages platform engagement
- Prevents spam/abuse of new user bonuses
- Ensures users understand NFT minting before transferring tokens

**Implementation**:
- `has_minted_nft` flag tracked in database
- Flag set automatically when:
  - User uploads a file (auto-minted as DRC-369)
  - User mints a DRC-369 asset manually
  - User swaps an NFT from another chain
- `canSendCgt()` function checks flag before allowing transfers

**Enforcement**: Frontend checks flag before building transfer transactions.

### Max Supply Enforcement

**Policy**: Total CGT supply cannot exceed 369 billion CGT

**Enforcement**:
- Checked at mint time in `cgt_mint_to()`
- Minting fails if `current_total + amount > CGT_MAX_SUPPLY`
- Error message: `"CGT_MAX_SUPPLY exceeded: {new_total} > {max_supply}"`

**Invariant Check**: Runtime includes supply invariant verification

---

## RPC API Methods

### Balance & Supply Queries

#### `cgt_getBalance`
Get CGT balance for an address.

**Parameters**:
```json
{
  "address": "0x0992f7f1..."
}
```

**Response**:
```json
{
  "balance": "5000000000000"  // in smallest units
}
```

#### `cgt_getTotalSupply`
Get total CGT supply.

**Response**:
```json
{
  "totalSupply": "100000000000000000"  // in smallest units
}
```

#### `cgt_getMetadata`
Get CGT currency metadata.

**Response**:
```json
{
  "name": "Creator God Token",
  "symbol": "CGT",
  "decimals": 8,
  "maxSupply": "100000000000000000",
  "totalSupply": "100000000000000000"
}
```

#### `cgt_getNonce`
Get transaction nonce for an address.

**Parameters**:
```json
{
  "address": "0x0992f7f1..."
}
```

**Response**:
```json
{
  "nonce": 5
}
```

### Transfer Operations

#### `cgt_buildTransferTx`
Build an unsigned transfer transaction.

**Parameters**:
```json
{
  "from": "0x0992f7f1...",
  "to": "0xabc123...",
  "amount": "1000000000",  // in smallest units
  "nonce": 5,
  "fee": 0  // optional, defaults to 0
}
```

**Response**:
```json
{
  "unsigned_tx_hex": "0x..."
}
```

#### `cgt_signTransaction`
Sign a transaction (client-side or server-side).

**Parameters**:
```json
{
  "tx_hex": "0x...",
  "signature_hex": "0x..."
}
```

**Response**:
```json
{
  "tx_hex": "0x..."  // signed transaction
}
```

#### `cgt_sendRawTransaction`
Submit a signed transaction to the mempool.

**Parameters**:
```json
{
  "tx_hex": "0x..."  // signed transaction hex
}
```

**Response**:
```json
{
  "tx_hash": "0x..."
}
```

### Development Tools

#### `cgt_devFaucet`
Request CGT from dev faucet (debug builds only).

**Parameters**:
```json
{
  "address": "0x0992f7f1..."
}
```

**Response**:
```json
{
  "tx_hash": "0x...",
  "balance": "5000000000000"  // new balance
}
```

**Amount**: 10,000 CGT per request (in dev mode)

#### `cgt_devUnsafeTransfer`
Direct transfer without signature (debug builds only).

**Parameters**:
```json
{
  "from": "0x0992f7f1...",
  "to": "0xabc123...",
  "amount": "1000000000"
}
```

**Warning**: Only available in debug builds, bypasses signature verification.

### Transaction History

#### `cgt_getTransactionHistory`
Get transaction history for an address.

**Parameters**:
```json
{
  "address": "0x0992f7f1...",
  "limit": 100  // optional
}
```

**Response**:
```json
{
  "transactions": [
    {
      "hash": "0x...",
      "from": "0x...",
      "to": "0x...",
      "amount": "1000000000",
      "timestamp": 1234567890,
      "status": "confirmed"
    }
  ]
}
```

#### `cgt_getTransaction`
Get transaction by hash.

**Parameters**:
```json
{
  "hash": "0x..."
}
```

---

## Wallet Integration

### Frontend Wallet (Portal Web)

**Location**: `apps/portal-web/src/app/haven/page.tsx` (Haven page)

**Features**:
- Balance display
- Send CGT to usernames or addresses
- Transaction history
- Username resolution

**Key Functions**:
- `cgtToSmallest(cgt: number)`: Convert CGT to smallest units
- `cgtFromSmallest(amount: string)`: Convert smallest units to CGT
- `buildTransferTx()`: Build transfer transaction
- `sendRawTransaction()`: Submit signed transaction

### Mobile API

**Location**: `apps/portal-web/src/lib/mobileApi.ts`

**Function**: `sendCgt()`

**Features**:
- Send CGT by username or address
- Automatic username resolution
- Transaction signing and submission

### TypeScript SDK

**Location**: `sdk/ts-sdk/src/cgt.ts`

**Class**: `CgtApi`

**Methods**:
- `getMetadata()`: Get CGT metadata
- `getTotalSupply()`: Get total supply
- `getBalance(address)`: Get balance
- `getBalanceFormatted(address)`: Get balance as number
- `getNonce(address)`: Get transaction nonce
- `buildTransfer(from, to, amount, nonce?)`: Build transfer transaction
- `sendRawTransaction(signedTxHex)`: Submit transaction
- `getTransaction(txHash)`: Get transaction by hash
- `getTransactionHistory(address, limit?)`: Get transaction history
- `requestFaucet(address)`: Request from dev faucet

---

## Exchange System Setup

### Current Status

**No DEX/Exchange Implemented**: There is currently no decentralized exchange (DEX) or liquidity pool system for CGT.

### Recommended Exchange Implementation

#### Option 1: Simple Order Book Exchange

**Components Needed**:

1. **Order Book Module** (`exchange` runtime module):
   - Buy/sell orders stored on-chain
   - Order matching engine
   - Price discovery mechanism

2. **Liquidity Pools** (optional):
   - Automated Market Maker (AMM) pools
   - CGT/ETH, CGT/USDC pairs
   - Liquidity provider rewards

3. **Bridge Integration**:
   - Cross-chain bridge for ETH/USDC
   - Wrapped token support (wETH, wUSDC)
   - Bridge security and validation

#### Option 2: Integration with Existing DEX

**Options**:
- Uniswap V3 integration (if on Ethereum)
- SushiSwap integration
- Custom bridge to major DEXes

**Requirements**:
- Bridge contract for CGT
- Wrapped CGT (wCGT) token on target chain
- Liquidity provision incentives

### Setup Steps for Exchange System

#### Phase 1: Basic Exchange Module

1. **Create Exchange Runtime Module**:
   ```rust
   // chain/src/runtime/exchange.rs
   pub struct ExchangeModule;
   
   // Order types
   pub enum OrderType {
       Buy,   // Buy CGT with other token
       Sell,  // Sell CGT for other token
   }
   
   pub struct Order {
       pub id: OrderId,
       pub order_type: OrderType,
       pub price: u128,  // price in smallest units
       pub amount: u128, // amount in smallest units
       pub creator: Address,
       pub active: bool,
   }
   ```

2. **RPC Methods**:
   - `exchange_createOrder`: Create buy/sell order
   - `exchange_cancelOrder`: Cancel active order
   - `exchange_matchOrders`: Match orders (can be called by anyone)
   - `exchange_getOrderBook`: Get current order book
   - `exchange_getMyOrders`: Get user's orders

3. **Order Matching Logic**:
   - Match buy orders with sell orders
   - Price-time priority
   - Partial fills supported

#### Phase 2: Liquidity Pools (AMM)

1. **Pool Module**:
   ```rust
   pub struct LiquidityPool {
       pub token_a: Address,  // CGT address
       pub token_b: Address,  // Other token (ETH, USDC, etc.)
       pub reserve_a: u128,
       pub reserve_b: u128,
       pub total_lp_tokens: u128,
   }
   ```

2. **Pool Operations**:
   - `pool_addLiquidity`: Add liquidity to pool
   - `pool_removeLiquidity`: Remove liquidity
   - `pool_swap`: Swap tokens via pool
   - `pool_getPrice`: Get current price

3. **Constant Product Formula** (Uniswap-style):
   ```
   x * y = k
   (x + Δx) * (y - Δy) = k
   ```

#### Phase 3: Cross-Chain Bridge

1. **Bridge Contract** (on target chain, e.g., Ethereum):
   - Lock CGT on Demiurge
   - Mint wCGT on Ethereum
   - Burn wCGT to unlock CGT

2. **Bridge Validators**:
   - Multi-sig or validator set
   - Verify lock transactions on Demiurge
   - Mint/burn on target chain

3. **Security**:
   - Time locks for large transfers
   - Daily limits
   - Validator slashing

### Recommended Implementation Order

1. **Start with Order Book** (simplest):
   - On-chain order matching
   - CGT-to-CGT trading (for testing)
   - No external dependencies

2. **Add Liquidity Pools**:
   - AMM for price discovery
   - LP token rewards
   - Fee collection (0.3% per swap)

3. **Implement Bridge**:
   - Connect to Ethereum/Polygon
   - Enable CGT ↔ ETH/USDC swaps
   - Integrate with major DEXes

---

## Economic Model

### Token Flow

1. **Minting**: New CGT created via authorized modules
2. **Distribution**: CGT distributed to users (rewards, bonuses)
3. **Usage**: CGT used for fees, purchases, transfers
4. **Burning**: (Future) CGT can be burned for deflationary pressure

### Incentive Alignment

- **Creators**: Earn CGT from content sales, royalties, seeding
- **Miners**: Earn CGT from block production and compute work
- **Users**: Receive CGT for platform engagement and NFT creation
- **Network**: CGT fees secure the network and prevent spam

### Current Distribution Breakdown

- **New User Bonuses**: 5,000 CGT per user
- **Level Rewards**: 10 CGT per level-up
- **Work Claims**: Variable (based on depth/time metrics, max 1M CGT per claim)
- **Fabric Seeding**: Variable (from Archon-funded pools)
- **Block Production**: Not yet implemented
- **Compute Work**: Not yet implemented

---

## Security Considerations

### Minting Authorization

- Only 6 authorized modules can mint
- Authorization checked at runtime
- Unauthorized mint attempts fail with clear error

### Supply Enforcement

- Max supply checked before every mint
- Total supply tracked on-chain
- Invariant verification in runtime

### Transfer Security

- Ed25519 signature verification
- Nonce tracking prevents replay attacks
- Balance validation before transfers
- Send restrictions prevent abuse

### Fee Security

- Currently fees are effectively burned
- Future: Fee collection and burning for deflationary pressure

---

## Monitoring & Analytics

### Key Metrics to Track

1. **Supply Metrics**:
   - Total supply
   - Circulating supply
   - Minting rate (CGT per day)
   - Distribution by source (bonuses, rewards, etc.)

2. **Usage Metrics**:
   - Transaction volume
   - Average transaction size
   - Active wallets
   - CGT velocity (transactions per CGT)

3. **Economic Metrics**:
   - Average balance per user
   - Top holders distribution
   - Marketplace volume
   - Fee collection (when implemented)

### RPC Endpoints for Monitoring

- `cgt_getTotalSupply`: Track total supply
- `cgt_getMetadata`: Get currency info
- `cgt_getTransactionHistory`: Analyze transaction patterns

---

## Future Enhancements

### Deflationary Mechanisms

1. **Fee Burning**:
   - Burn transaction fees
   - Burn marketplace fees
   - Burn NFT minting fees

2. **Buyback & Burn**:
   - Use marketplace fees to buy CGT
   - Burn purchased CGT
   - Create deflationary pressure

### Staking & Governance

1. **Staking**:
   - Stake CGT for network security
   - Validator rewards
   - Slashing for misbehavior

2. **Governance**:
   - Vote with staked CGT
   - Propose changes
   - Treasury management

### Cross-Chain Integration

1. **Bridges**:
   - Ethereum bridge (wCGT)
   - Polygon bridge
   - Solana bridge

2. **Multi-Token Support**:
   - CGT as base currency
   - Support for ETH, USDC, etc.
   - Cross-chain swaps

---

## Quick Start Guide

### For Users

1. **Get CGT**:
   - Register AbyssID → Receive 5,000 CGT bonus
   - Level up → Receive 10 CGT per level
   - Submit work claims → Earn CGT from mining
   - Seed Fabric content → Earn CGT from pools

2. **Use CGT**:
   - Send to other users (username or address)
   - Buy NFTs in Abyss marketplace
   - Pay transaction fees (when implemented)
   - Fund Fabric seeding pools

3. **View Balance**:
   - Check "My Void" dashboard
   - Use `cgt_getBalance` RPC method
   - View in Haven wallet page

### For Developers

1. **Query Balance**:
   ```typescript
   const balance = await sdk.cgt.getBalance(address);
   const formatted = await sdk.cgt.getBalanceFormatted(address);
   ```

2. **Send CGT**:
   ```typescript
   const { unsignedTxHex, nonce } = await sdk.cgt.buildTransfer(
     fromAddress,
     toAddress,
     100.5  // 100.5 CGT
   );
   // Sign transaction (client-side)
   const signedTxHex = await signTransaction(unsignedTxHex, privateKey);
   const txHash = await sdk.cgt.sendRawTransaction(signedTxHex);
   ```

3. **Monitor Supply**:
   ```typescript
   const metadata = await sdk.cgt.getMetadata();
   console.log(`Total Supply: ${metadata.totalSupply}`);
   console.log(`Max Supply: ${metadata.maxSupply}`);
   ```

---

## Troubleshooting

### Common Issues

1. **"Insufficient balance"**:
   - Check balance with `cgt_getBalance`
   - Ensure amount + fee <= balance
   - Verify smallest units conversion

2. **"Invalid nonce"**:
   - Get current nonce with `cgt_getNonce`
   - Use correct nonce in transaction
   - Nonce must increment sequentially

3. **"Cannot send CGT"**:
   - Check `has_minted_nft` flag
   - Mint or swap an NFT first
   - Flag set automatically on file upload

4. **"CGT_MAX_SUPPLY exceeded"**:
   - Max supply reached (369 billion CGT)
   - No more CGT can be minted
   - Consider implementing burning

---

## Conclusion

CGT is a fully functional native currency with:
- ✅ Complete minting system (6 authorized modules)
- ✅ Transfer system with security restrictions
- ✅ Marketplace integration
- ✅ Reward mechanisms (level-ups, work claims, seeding)
- ✅ Max supply enforcement
- ✅ RPC API for all operations

**Next Steps for Exchange**:
1. Implement order book exchange module
2. Add liquidity pools (AMM)
3. Build cross-chain bridge
4. Integrate with major DEXes

The foundation is solid. The exchange system is the next major milestone for CGT adoption and liquidity.
