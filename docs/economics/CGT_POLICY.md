# Creator God Token (CGT) Policy & Economics

## Token Specifications

- **Name**: Creator God Token
- **Symbol**: CGT
- **Decimals**: 8 (smallest unit: 10^-8 CGT)
- **Max Supply**: 369,000,000,000 CGT (369 billion)
- **Storage**: All amounts stored as `u128` in smallest units

## Minting & Distribution

### New User Bonus
- **Amount**: 5,000 CGT per new AbyssID registration
- **Method**: On-chain minting via `cgt_faucet` RPC method
- **Purpose**: Welcome bonus to enable initial platform usage
- **Restriction**: Users cannot send CGT until they mint or swap a DRC-369 NFT

### Authorized Minting Modules
Only the following modules can mint CGT:
- `forge` - Block production rewards
- `fabric_manager` - Fabric seeding rewards
- `system` - System-level operations (including new user bonuses)
- `urgeid_registry` - UrgeID level rewards
- `urgeid_level_rewards` - Level-based rewards
- `work_claim` - Arcade mining rewards

### Supply Enforcement
- Max supply is enforced at mint time
- Minting fails if it would exceed 369 billion CGT
- Total supply tracked on-chain

## Usage & Utilities

### Transaction Fees
- CGT is used to pay gas/fees for on-chain transactions
- Fee amounts determined by transaction complexity

### Content Delivery Rewards
- Fabric seeders earn CGT via Proof-of-Delivery
- Rewards distributed based on content delivery metrics

### Compute Rewards
- Forge compute workers earn CGT for verifiable compute jobs
- Rewards based on work complexity and verification

### Marketplace
- Abyss marketplace prices denominated in CGT
- NFT purchases, sales, and royalties paid in CGT
- Creator revenue routed in CGT

### Transfers
- CGT is transferable between UrgeID addresses
- Standard Ed25519 signed transactions
- Nonce tracking per address

## Restrictions & Policies

### Send Restriction
**Policy**: New users cannot send CGT until they have minted or swapped a DRC-369 NFT.

**Rationale**:
- Encourages platform engagement
- Prevents spam/abuse of new user bonuses
- Ensures users understand NFT minting before transferring tokens

**Implementation**:
- `has_minted_nft` flag tracked in `user_wallet_balances` table
- Flag set automatically when:
  - User uploads a file (auto-minted as DRC-369)
  - User mints a DRC-369 asset manually
  - User swaps an NFT from another chain
- `canSendCgt()` function checks flag before allowing transfers

### Balance Tracking
- On-chain balances via `cgt_getBalance` RPC
- Database tracking in `user_wallet_balances` table
- Wallet balance API endpoint: `/api/abyssid/wallet/balance`

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

## Future Considerations

### Deflationary Mechanisms
- Potential burn mechanisms for fees
- NFT minting fees could be partially burned
- Transaction fee burning

### Staking & Governance
- Future staking mechanisms for network security
- Governance voting with staked CGT
- Validator rewards

### Cross-Chain Integration
- Bridge support for other tokens (ETH, USDC, etc.)
- CGT as base currency for swaps
- Multi-chain marketplace support

