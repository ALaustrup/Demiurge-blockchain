# CGT Exchange System Setup Guide

**Last Updated**: January 5, 2026

## Current CGT Implementation Summary

### ✅ Fully Implemented

1. **Token Core**:
   - Max supply: 369 billion CGT (enforced)
   - 8 decimals (smallest unit: 10^-8)
   - On-chain balance tracking
   - Total supply tracking

2. **Minting System**:
   - 6 authorized modules can mint
   - Max supply enforcement
   - New user bonus: 5,000 CGT
   - Level rewards: 10 CGT per level-up
   - Work claim rewards: Variable (max 1M CGT per claim)
   - Fabric seeding: From Archon-funded pools

3. **Transfer System**:
   - Ed25519 signed transactions
   - Nonce tracking
   - Balance validation
   - Username resolution (@username → address)

4. **Marketplace Integration**:
   - NFT listings priced in CGT
   - Automatic royalty distribution
   - CGT transfers on purchase

5. **RPC API**:
   - 15+ CGT-related methods
   - Balance queries
   - Transfer building
   - Transaction submission
   - History tracking

### ⚠️ Missing for Exchange

1. **No DEX/Exchange Module**: No on-chain exchange implementation
2. **No Liquidity Pools**: No AMM or order book system
3. **No Cross-Chain Bridge**: Cannot swap CGT for ETH/USDC
4. **No Fee Collection**: Fees currently set to 0
5. **No Price Oracle**: No external price feeds

---

## Exchange System Implementation Plan

### Phase 1: Order Book Exchange (Simplest)

**Timeline**: 2-4 weeks

#### 1.1 Create Exchange Runtime Module

**File**: `chain/src/runtime/exchange.rs`

**Structure**:
```rust
pub struct ExchangeModule;

pub enum OrderType {
    Buy,   // Buy CGT with quote token
    Sell,  // Sell CGT for quote token
}

pub struct Order {
    pub id: OrderId,
    pub order_type: OrderType,
    pub price: u128,      // price in smallest units
    pub amount: u128,     // amount in smallest units
    pub creator: Address,
    pub active: bool,
    pub created_at: u64,
}

pub struct OrderBook {
    pub buy_orders: Vec<Order>,   // sorted by price (highest first)
    pub sell_orders: Vec<Order>,  // sorted by price (lowest first)
}
```

#### 1.2 Transaction Calls

**`create_order`**:
- Parameters: `{ order_type: "buy"|"sell", price: u128, amount: u128 }`
- Validates: Sufficient balance, price > 0, amount > 0
- Creates order and adds to order book
- Locks CGT (for sell orders) or quote token (for buy orders)

**`cancel_order`**:
- Parameters: `{ order_id: OrderId }`
- Validates: Order exists, creator is caller
- Unlocks locked funds
- Marks order as inactive

**`match_orders`**:
- Parameters: `{ order_id: OrderId }` (optional, or match all)
- Matches buy orders with sell orders
- Executes trades at matched prices
- Distributes funds to parties
- Updates order book

#### 1.3 RPC Methods

```rust
// Create order
"exchange_createOrder" => {
    // Build transaction with order params
    // Return unsigned transaction
}

// Cancel order
"exchange_cancelOrder" => {
    // Build cancel transaction
}

// Get order book
"exchange_getOrderBook" => {
    // Return current buy/sell orders
    // Sorted by price
}

// Get my orders
"exchange_getMyOrders" => {
    // Return user's active orders
}

// Match orders (can be called by anyone)
"exchange_matchOrders" => {
    // Match orders and execute trades
}
```

#### 1.4 Storage Keys

- Order by ID: `exchange:order:{id}`
- Orders by creator: `exchange:orders:{address}`
- Buy orders: `exchange:buy_orders`
- Sell orders: `exchange:sell_orders`
- Order counter: `exchange:order_counter`

---

### Phase 2: Liquidity Pools (AMM)

**Timeline**: 4-6 weeks

#### 2.1 Pool Structure

```rust
pub struct LiquidityPool {
    pub pool_id: PoolId,
    pub token_a: Address,      // CGT address
    pub token_b: Address,      // Quote token (ETH, USDC, etc.)
    pub reserve_a: u128,       // CGT reserve
    pub reserve_b: u128,       // Quote token reserve
    pub total_lp_tokens: u128,  // Total LP tokens issued
    pub fee_bps: u16,          // Fee in basis points (e.g., 30 = 0.3%)
}

pub struct LpPosition {
    pub owner: Address,
    pub pool_id: PoolId,
    pub lp_tokens: u128,
}
```

#### 2.2 Constant Product Formula

```
x * y = k
```

Where:
- `x` = reserve_a (CGT)
- `y` = reserve_b (quote token)
- `k` = constant product

**Swap Calculation**:
```
Δy = (y * Δx) / (x + Δx)
```

With fee:
```
Δy = (y * Δx * (10000 - fee_bps)) / ((x + Δx) * 10000)
```

#### 2.3 Pool Operations

**`add_liquidity`**:
- Parameters: `{ pool_id: PoolId, amount_a: u128, amount_b: u128 }`
- Validates: Ratios match current pool ratio (within slippage tolerance)
- Mints LP tokens proportional to contribution
- Updates reserves

**`remove_liquidity`**:
- Parameters: `{ pool_id: PoolId, lp_tokens: u128 }`
- Validates: User owns sufficient LP tokens
- Burns LP tokens
- Returns proportional amounts of both tokens

**`swap`**:
- Parameters: `{ pool_id: PoolId, token_in: Address, amount_in: u128, min_amount_out: u128 }`
- Validates: Sufficient input balance, min output (slippage protection)
- Calculates output using constant product formula
- Applies fee (0.3% default)
- Updates reserves
- Transfers tokens

#### 2.4 RPC Methods

```rust
// Create pool
"pool_createPool" => {
    // Create new liquidity pool
    // Initialize with initial liquidity
}

// Add liquidity
"pool_addLiquidity" => {
    // Add tokens to pool
    // Receive LP tokens
}

// Remove liquidity
"pool_removeLiquidity" => {
    // Burn LP tokens
    // Receive proportional tokens
}

// Swap tokens
"pool_swap" => {
    // Swap via pool
    // Calculate price using AMM formula
}

// Get pool info
"pool_getPool" => {
    // Return pool reserves, price, etc.
}

// Get price
"pool_getPrice" => {
    // Calculate current price from reserves
}
```

---

### Phase 3: Cross-Chain Bridge

**Timeline**: 8-12 weeks

#### 3.1 Bridge Architecture

**On Demiurge Chain**:
- Lock CGT when user wants to bridge
- Emit bridge event
- Validators observe and verify

**On Target Chain (Ethereum/Polygon)**:
- Bridge contract receives lock verification
- Mints wrapped CGT (wCGT) on target chain
- Burns wCGT to unlock CGT on Demiurge

#### 3.2 Bridge Module

```rust
pub struct BridgeModule;

pub struct BridgeLock {
    pub lock_id: LockId,
    pub user: Address,
    pub amount: u128,
    pub target_chain: String,
    pub target_address: String,
    pub status: BridgeStatus,
    pub created_at: u64,
}

pub enum BridgeStatus {
    Locked,
    Minted,
    Failed,
}
```

#### 3.3 Bridge Operations

**`lock_for_bridge`**:
- Parameters: `{ amount: u128, target_chain: String, target_address: String }`
- Locks CGT in bridge contract
- Emits bridge event
- Creates lock record

**`unlock_from_bridge`**:
- Parameters: `{ lock_id: LockId, proof: BridgeProof }`
- Validates proof from target chain
- Unlocks CGT to user
- Marks lock as completed

#### 3.4 Security Measures

1. **Multi-Sig Validators**:
   - Set of trusted validators
   - Require N-of-M signatures
   - Slashing for misbehavior

2. **Time Locks**:
   - Large transfers require time delay
   - Prevents instant bridge attacks

3. **Daily Limits**:
   - Maximum bridge volume per day
   - Prevents mass exodus

4. **Proof Verification**:
   - Verify burn proofs from target chain
   - Cryptographic verification
   - Replay attack prevention

---

## Implementation Checklist

### Exchange Module (Order Book)

- [ ] Create `chain/src/runtime/exchange.rs`
- [ ] Implement `Order` and `OrderBook` structures
- [ ] Implement `create_order` transaction handler
- [ ] Implement `cancel_order` transaction handler
- [ ] Implement `match_orders` transaction handler
- [ ] Add exchange module to runtime registration
- [ ] Create RPC methods:
  - [ ] `exchange_createOrder`
  - [ ] `exchange_cancelOrder`
  - [ ] `exchange_getOrderBook`
  - [ ] `exchange_getMyOrders`
  - [ ] `exchange_matchOrders`
- [ ] Add storage keys and serialization
- [ ] Write unit tests
- [ ] Update documentation

### Liquidity Pools (AMM)

- [ ] Create `chain/src/runtime/liquidity_pool.rs`
- [ ] Implement `LiquidityPool` structure
- [ ] Implement constant product formula
- [ ] Implement `add_liquidity` handler
- [ ] Implement `remove_liquidity` handler
- [ ] Implement `swap` handler
- [ ] Add pool module to runtime registration
- [ ] Create RPC methods:
  - [ ] `pool_createPool`
  - [ ] `pool_addLiquidity`
  - [ ] `pool_removeLiquidity`
  - [ ] `pool_swap`
  - [ ] `pool_getPool`
  - [ ] `pool_getPrice`
- [ ] Add LP token tracking
- [ ] Implement fee collection
- [ ] Write unit tests
- [ ] Update documentation

### Cross-Chain Bridge

- [ ] Design bridge architecture
- [ ] Create bridge contract on target chain (Ethereum)
- [ ] Create `chain/src/runtime/bridge.rs`
- [ ] Implement `lock_for_bridge` handler
- [ ] Implement `unlock_from_bridge` handler
- [ ] Set up validator set
- [ ] Implement proof verification
- [ ] Add security measures (time locks, limits)
- [ ] Create RPC methods:
  - [ ] `bridge_lock`
  - [ ] `bridge_unlock`
  - [ ] `bridge_getLocks`
- [ ] Write integration tests
- [ ] Security audit
- [ ] Update documentation

---

## Recommended Development Order

### Week 1-2: Order Book Exchange

1. **Day 1-2**: Design order book data structures
2. **Day 3-5**: Implement order creation and cancellation
3. **Day 6-8**: Implement order matching logic
4. **Day 9-10**: Add RPC methods
5. **Day 11-12**: Testing and bug fixes
6. **Day 13-14**: Documentation and integration

### Week 3-4: Testing & Refinement

1. Test order book with multiple users
2. Test order matching edge cases
3. Performance optimization
4. Frontend integration (order book UI)

### Week 5-8: Liquidity Pools

1. **Week 5**: Design AMM structure
2. **Week 6**: Implement pool creation and liquidity management
3. **Week 7**: Implement swap logic with fees
4. **Week 8**: Testing and frontend integration

### Week 9-12: Cross-Chain Bridge

1. **Week 9**: Design bridge architecture
2. **Week 10**: Implement bridge contract (Ethereum)
3. **Week 11**: Implement bridge module (Demiurge)
4. **Week 12**: Security audit and testing

---

## Frontend Integration

### Order Book UI

**Location**: `apps/portal-web/src/app/exchange/page.tsx`

**Features**:
- Display buy/sell orders
- Create new orders
- Cancel own orders
- View order history
- Real-time order book updates

### Liquidity Pool UI

**Features**:
- View pool reserves and price
- Add/remove liquidity
- Swap tokens
- View LP token balance
- Historical price charts

### Bridge UI

**Features**:
- Lock CGT for bridging
- View bridge status
- Unlock CGT from bridge
- Bridge history

---

## Testing Strategy

### Unit Tests

- Order creation/cancellation
- Order matching logic
- Pool swap calculations
- Bridge lock/unlock
- Fee calculations

### Integration Tests

- End-to-end order book flow
- Pool liquidity management
- Cross-chain bridge simulation
- Multi-user scenarios

### Security Tests

- Reentrancy attacks
- Integer overflow
- Unauthorized access
- Edge cases (zero amounts, max values)

---

## Economic Considerations

### Fee Structure

**Order Book**:
- Maker fee: 0% (reward for providing liquidity)
- Taker fee: 0.2% (paid by order matcher)

**Liquidity Pools**:
- Swap fee: 0.3% (standard Uniswap rate)
- Fee distribution: 100% to LP providers

**Bridge**:
- Bridge fee: 0.1% (covers validator costs)
- Minimum fee: 1 CGT

### Liquidity Incentives

1. **LP Rewards**:
   - Earn swap fees
   - Potential token rewards (future)

2. **Early Liquidity**:
   - Bonus rewards for first LPs
   - Reduced fees for early adopters

3. **Market Making**:
   - Rewards for order book makers
   - Spread incentives

---

## Security Best Practices

### Smart Contract Security

1. **Reentrancy Protection**:
   - Use checks-effects-interactions pattern
   - Lock mechanisms

2. **Integer Overflow**:
   - Use checked arithmetic
   - Validate all calculations

3. **Access Control**:
   - Only authorized modules can mint
   - User can only cancel own orders

4. **Slippage Protection**:
   - Min output amounts
   - Max price deviation

### Bridge Security

1. **Multi-Sig Validators**:
   - Require 3-of-5 signatures
   - Rotating validator set

2. **Time Locks**:
   - 24-hour lock for >10,000 CGT
   - 1-hour lock for <1,000 CGT

3. **Daily Limits**:
   - 1,000,000 CGT per day
   - Per-user limits

4. **Proof Verification**:
   - Cryptographic proofs
   - Replay attack prevention

---

## Monitoring & Analytics

### Key Metrics

1. **Exchange Metrics**:
   - Daily trading volume
   - Number of orders
   - Order fill rate
   - Average order size

2. **Pool Metrics**:
   - Total liquidity
   - Swap volume
   - Fee collection
   - Price impact

3. **Bridge Metrics**:
   - Bridge volume
   - Lock/unlock frequency
   - Bridge fees collected
   - Bridge failures

### Dashboard

Create monitoring dashboard:
- Real-time exchange stats
- Pool analytics
- Bridge status
- Economic indicators

---

## Conclusion

CGT is **fully functional** as a native currency with:
- ✅ Complete minting and distribution
- ✅ Secure transfer system
- ✅ Marketplace integration
- ✅ Reward mechanisms

**Next Critical Step**: Implement exchange system for liquidity and price discovery.

**Recommended Path**:
1. Start with order book (simplest, no external dependencies)
2. Add liquidity pools (better price discovery)
3. Build bridge (connect to external markets)

The foundation is solid. The exchange system will unlock CGT's full potential as a tradeable asset.
