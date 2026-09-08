# 📦 Module Specifications - Demiurge Blockchain

**Complete specifications for all modules in the custom framework**

---

## 📋 Module List

1. [System Module](#1-system-module)
2. [Balances Module](#2-balances-module)
3. [QOR Identity Module](#3-qor-identity-module)
4. [DRC-369 Module](#4-drc-369-module)
5. [Game Assets Module](#5-game-assets-module)
6. [Energy Module](#6-energy-module)
7. [Composable NFTs Module](#7-composable-nfts-module)
8. [DEX Module](#8-dex-module)
9. [Fractional Assets Module](#9-fractional-assets-module)
10. [Session Keys Module](#10-session-keys-module)
11. [Yield NFTs Module](#11-yield-nfts-module)
12. [Governance Module](#12-governance-module)
13. [ZK Module](#13-zk-module)
14. [Off-Chain Workers Module](#14-off-chain-workers-module)

---

## 1. System Module

**Purpose**: Core blockchain functionality

**Functions**:
- Account management
- Block production
- Event emission
- Extrinsic handling

**Storage**:
- Accounts
- Block number
- Events
- Extrinsics

**Events**:
- `AccountCreated`
- `ExtrinsicExecuted`
- `BlockFinalized`

---

## 2. Balances Module

**Purpose**: CGT token management

**Token Details**:
- **Name**: Creator God Token
- **Symbol**: CGT
- **Total Supply**: 13,000,000,000 (fixed)
- **Precision**: 2 decimals
- **Smallest Unit**: 1 Spark = 0.01 CGT
- **Conversion**: 100 Sparks = 1 CGT

**Functions**:
- `transfer(to, amount)` - Transfer CGT
- `mint(to, amount)` - Mint new CGT (governance only)
- `burn(from, amount)` - Burn CGT
- `reserve(account, amount)` - Reserve CGT
- `unreserve(account, amount)` - Unreserve CGT

**Storage**:
- Account balances
- Total supply
- Reserves

**Events**:
- `Transfer { from, to, amount }`
- `Minted { to, amount }`
- `Burned { from, amount }`

---

## 3. QOR Identity Module

**Purpose**: Username-based identity system

**Status**: ✅ Service-based (not a module)

**Location**: `services/qor-auth/`

**Features**:
- Username registration
- Reputation tracking
- Achievement system
- Social graph

**Integration**: REST API + Blockchain client

---

## 4. DRC-369 Module

**Purpose**: Stateful NFT standard

**Features**:
- NFT minting
- Ownership tracking
- State management (XP, level, stats)
- Multi-resource support
- Soulbound capability
- Evolvable NFTs

**Functions**:
- `mint(owner, metadata)` - Mint NFT
- `transfer(from, to, nft_id)` - Transfer NFT
- `update_state(nft_id, state)` - Update NFT state
- `set_soulbound(nft_id, soulbound)` - Set soulbound status
- `add_resource(nft_id, resource)` - Add resource

**Storage**:
- NFT ownership
- NFT metadata
- NFT state
- Resources

**Events**:
- `NftMinted { nft_id, owner }`
- `NftTransferred { nft_id, from, to }`
- `StateUpdated { nft_id, state }`

---

## 5. Game Assets Module

**Purpose**: Multi-asset system for games

**Features**:
- Multiple asset types per game
- Feeless transfers
- Developer controls
- Cross-game compatibility

**Functions**:
- `create_asset(game_id, asset_type)` - Create asset type
- `mint(game_id, asset_type, to, amount)` - Mint assets
- `transfer(game_id, asset_type, from, to, amount)` - Transfer assets
- `burn(game_id, asset_type, from, amount)` - Burn assets

**Storage**:
- Asset types
- Asset balances
- Game configurations

**Events**:
- `AssetCreated { game_id, asset_type }`
- `AssetTransferred { game_id, asset_type, from, to, amount }`

---

## 6. Energy Module

**Purpose**: Regenerating transaction costs

**Features**:
- Energy regeneration over time
- Transaction costs in energy
- Developer sponsorship
- Time-based limits

**Functions**:
- `consume_energy(account, amount)` - Consume energy
- `regenerate_energy(account)` - Regenerate energy
- `sponsor_transaction(developer, user)` - Sponsor user's transaction

**Storage**:
- Energy balances
- Last update time
- Regeneration rate

**Events**:
- `EnergyConsumed { account, amount }`
- `EnergyRegenerated { account, amount }`

---

## 7. Composable NFTs Module

**Purpose**: Equippable and nested NFTs

**Features**:
- Equipment slots
- Nesting support
- Slot management
- Visual composition

**Functions**:
- `equip(character_nft, item_nft, slot)` - Equip item
- `unequip(character_nft, slot)` - Unequip item
- `nest(parent_nft, child_nft)` - Nest NFT
- `unnest(parent_nft, child_nft)` - Unnest NFT

**Storage**:
- Equipment slots
- Nested NFTs
- Slot configurations

**Events**:
- `ItemEquipped { character_nft, item_nft, slot }`
- `NftNested { parent_nft, child_nft }`

---

## 8. DEX Module

**Purpose**: Automatic liquidity and swaps

**Features**:
- Automatic liquidity pairs
- Token swaps
- LP tokens
- Price discovery

**Functions**:
- `create_pair(currency_id)` - Create liquidity pair
- `add_liquidity(currency_id, native_amount, currency_amount)` - Add liquidity
- `swap(currency_id, amount_in, min_amount_out)` - Swap tokens
- `remove_liquidity(currency_id, lp_amount)` - Remove liquidity

**Storage**:
- Liquidity pairs
- Reserves
- LP token balances

**Events**:
- `PairCreated { currency_id }`
- `SwapExecuted { currency_id, amount_in, amount_out }`

---

## 9. Fractional Assets Module

**Purpose**: Guild-owned assets with scheduling

**Features**:
- Shared ownership
- Time-based access
- Voting rights
- Fair distribution

**Functions**:
- `create_fractional_asset(base_nft, total_shares)` - Create fractional asset
- `purchase_shares(asset_id, shares)` - Purchase shares
- `request_access(asset_id, duration)` - Request access
- `vote(asset_id, proposal)` - Vote on proposal

**Storage**:
- Fractional assets
- Share ownership
- Access schedules
- Votes

**Events**:
- `FractionalAssetCreated { asset_id, total_shares }`
- `SharesPurchased { asset_id, buyer, shares }`
- `AccessGranted { asset_id, user, duration }`

---

## 10. Session Keys Module

**Purpose**: Temporary game authorization

**Features**:
- Temporary authorization
- Auto-expiration
- Granular permissions
- No wallet popups

**Functions**:
- `authorize_session_key(primary_account, session_key, duration)` - Authorize key
- `revoke_session_key(primary_account, session_key)` - Revoke key
- `get_active_keys(primary_account)` - Get active keys
- `is_valid(primary_account, session_key)` - Check validity

**Storage**:
- Session keys
- Expiration times
- Permissions

**Events**:
- `SessionKeyAuthorized { primary_account, session_key, expiry }`
- `SessionKeyRevoked { primary_account, session_key }`

---

## 11. Yield NFTs Module

**Purpose**: NFTs that earn passive income

**Features**:
- Staking NFTs
- Revenue sharing
- Time-based rewards
- Compound interest

**Functions**:
- `stake_nft(nft_id, duration)` - Stake NFT
- `unstake_nft(nft_id)` - Unstake NFT
- `claim_yield(nft_id)` - Claim yield
- `share_revenue(nft_id, amount)` - Share revenue (game)

**Storage**:
- Staking info
- Yield pools
- Revenue shares

**Events**:
- `NftStaked { nft_id, duration }`
- `YieldClaimed { nft_id, amount }`
- `RevenueShared { nft_id, amount }`

---

## 12. Governance Module

**Purpose**: On-chain governance

**Features**:
- Proposal system
- Voting mechanism
- Treasury management
- Upgrade mechanism

**Functions**:
- `propose(proposal)` - Create proposal
- `vote(proposal_id, vote)` - Vote on proposal
- `execute(proposal_id)` - Execute proposal
- `treasury_spend(amount, recipient)` - Spend from treasury

**Storage**:
- Proposals
- Votes
- Treasury balance

**Events**:
- `ProposalCreated { proposal_id }`
- `VoteCast { proposal_id, voter, vote }`
- `ProposalExecuted { proposal_id }`

---

## 13. ZK Module 🆕

**Purpose**: Zero-knowledge privacy features

**Features**:
- Private transactions
- Anonymous voting
- Private NFT transfers
- Privacy-preserving games

**Functions**:
- `private_transfer(proof)` - Private transfer
- `anonymous_vote(proposal_id, proof)` - Anonymous vote
- `private_nft_transfer(nft_id, proof)` - Private NFT transfer
- `generate_proof(action, secret)` - Generate ZK proof

**Storage**:
- Privacy pool
- Anonymous votes
- Private transactions

**Events**:
- `PrivateTransferExecuted { proof_hash }`
- `AnonymousVoteCast { proposal_id }`

---

## 14. Off-Chain Workers Module

**Purpose**: External data integration

**Features**:
- Game data fetching
- External API integration
- Scheduled tasks
- Data aggregation

**Functions**:
- `register_data_source(game_id, source)` - Register source
- `fetch_data(source_id)` - Fetch data
- `schedule_task(task, interval)` - Schedule task

**Storage**:
- Data sources
- Scheduled tasks
- Fetched data

**Events**:
- `DataSourceRegistered { game_id, source }`
- `DataFetched { source_id, data }`

---

## 🔗 Module Dependencies

```
System Module (base)
    ├── Balances Module
    ├── QOR Identity (service)
    ├── DRC-369 Module
    │   ├── Composable NFTs Module
    │   ├── Yield NFTs Module
    │   └── Fractional Assets Module
    ├── Game Assets Module
    ├── Energy Module
    ├── DEX Module
    ├── Session Keys Module
    ├── Governance Module
    ├── ZK Module
    └── Off-Chain Workers Module
```

---

**Last Updated**: 2024-12-19  
**Status**: Specifications Complete
