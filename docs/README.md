# Demiurge

**The Sovereign Digital Pantheon for creators, gamers, and AI.**

Demiurge is a sovereign L1 blockchain where **UrgeIDs** (sovereign identities, also known as "My Void" in the portal) and **Archons** (creators) mint, trade, and experience D-GEN NFTs, streamed over the Fabric P2P network and traded in the Abyss marketplace, powered by the Creator God Token (CGT). The platform includes a full social layer with World Chat, Direct Messages, and media sharing capabilities.

## Concepts

### UrgeID (Sovereign Identity / "My Void")
Every user on Demiurge has an **UrgeID** - a sovereign identity that includes:
- **Profile**: Display name, bio, username (@username)
- **Username**: Globally unique identifier bound to UrgeID address
  - Can be used for transfers, messaging, and lookups
  - Must be 3-32 characters, lowercase letters, numbers, underscores, and dots
  - In the portal UI, logged-in users see "My Void" instead of "UrgeID" in navigation
- **Syzygy Score**: Contribution metric for seeding/serving other creators' content
- **Leveling System**: Automatic level-ups based on Syzygy score, with CGT rewards (10 CGT per level)
  - Level thresholds follow a quadratic progression: BASE × level²
  - Each level-up automatically mints 10 CGT to the user's wallet
- **Badges**: Achievement markers (e.g., "Luminary" for high Syzygy scores)
- **Wallet**: CGT balance and transaction history
- **Chat Identity**: Username-based identity for World Chat and Direct Messages

### Archons (Creators)
Archons are UrgeID users who have "ascended" to creator status. Archons can mint D-GEN NFTs and participate in the creator economy. The Genesis Archon is pre-funded and marked as an Archon during chain initialization.

### CGT (Creator God Token)
CGT is the native token of the Demiurge chain:
- **Name**: Creator God Token
- **Symbol**: CGT
- **Decimals**: 8 (smallest unit: 10^-8 CGT)
- **Max Supply**: 1,000,000,000 CGT (1 billion)
- **Total Supply**: Tracked on-chain, enforced at mint time

The Genesis Archon starts with 1,000,000 CGT (100,000,000,000,000 smallest units).

### Fabric (P2P Content)
Fabric is a P2P content network that anchors immutable content roots. D-GEN NFTs reference Fabric assets via `fabric_root_hash`.

### Abyss (Creator Market & Gateway)
Abyss serves dual purposes:
- **Marketplace**: Native marketplace for D-GEN NFTs, where creators can list their NFTs for sale with programmable royalties
- **Gateway**: GraphQL API server providing chat system, social features, and real-time subscriptions
  - World Chat: Global public chat room
  - Direct Messages: Private conversations between users
  - Media Sharing: Upload images/videos or share from NFT collection
  - Safety Features: "Blur 4 All" for community moderation of inappropriate content

### D-GEN NFTs
D-GEN NFTs are AI-native, provenance-rich NFTs that can be minted by Archons. Each NFT includes:
- `fabric_root_hash`: Reference to Fabric content
- `forge_model_id`: Optional AI model identifier
- `forge_prompt_hash`: Optional AI prompt hash
- `royalty_recipient`: Optional royalty recipient address
- `royalty_bps`: Royalty percentage in basis points (0-10000)

## Quickstart

### 1. Start the Chain

From the repository root:

```bash
cargo run -p demiurge-chain
```

The node will:
- Initialize RocksDB at `.demiurge/data`
- Initialize the Genesis Archon (funded with 1M CGT and marked as Archon)
- Start the JSON-RPC server on `http://127.0.0.1:8545/rpc`

### 2. Start the Portal

In a separate terminal:

```bash
cd apps/portal-web
pnpm install
pnpm dev
```

The portal will be available at `http://localhost:3000`.

### 3. Start Abyss Gateway (Chat System)

In a separate terminal:

```bash
cd indexer/abyss-gateway
pnpm install
pnpm dev
```

The Abyss Gateway will be available at `http://localhost:4000/graphql` and provides:
- GraphQL API for chat system
- SQLite database for message persistence
- Real-time subscriptions for live chat updates

### 4. Visit the Portal

Open `http://localhost:3000` in your browser. You'll see:
- **Live Chain Status**: Real-time chain height, CGT metadata, and total supply
- **Genesis Archon Dashboard**: Balance, Archon status, and owned NFTs
- **Create UrgeID / My Void**: Onboard flow to create your sovereign identity
- **My Void Dashboard**: Profile, CGT balance, Syzygy score, leveling progress, badges, transaction history
- **Send CGT**: Transfer CGT between UrgeIDs using usernames or addresses, with Ed25519 signing
- **Chat System**: World Chat, Direct Messages, and media sharing
- **Mint Test NFT**: Dev-only button to mint a test D-GEN NFT

## Developer Features

### Genesis Archon

The Genesis Archon address is:
```
aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```

This address is:
- Pre-funded with 1,000,000 CGT (100,000,000,000,000 smallest units) during genesis initialization
- Automatically marked as an Archon
- Ready to mint D-GEN NFTs immediately

### UrgeID Onboarding (My Void)

Users can create their UrgeID (accessible via "My Void" in the portal navigation) via the portal:
1. Generate Ed25519 keypair (stored in localStorage)
2. Create on-chain profile with display name and bio
3. Claim a globally unique username (e.g., @oracle)
4. Start earning Syzygy by seeding content
5. Level up automatically as Syzygy score increases (10 CGT reward per level)
6. Access World Chat and Direct Messages using your username

### CGT Transfers

CGT can be transferred between UrgeIDs using either:
- **Username**: `@oracle` or `oracle` (automatically resolved to address)
- **Address**: `0992f7f1c561ac4c2f4d10debc2c7cbbaf0ffa5bb0796d8291462d4aeb11fc4c` (64-character hex)

Transfer flow:
1. Enter recipient as username or address
2. Portal automatically resolves usernames to addresses
3. Build unsigned transaction (server-side)
4. Sign with Ed25519 (client-side)
5. Submit signed transaction
6. Track transaction hash and poll for confirmation
7. View transaction history (local + on-chain)

### Dev Faucet

In debug builds, you can use the `cgt_devFaucet` RPC method to mint 10,000 CGT to any address:

```json
{
  "jsonrpc": "2.0",
  "method": "cgt_devFaucet",
  "params": {
    "address": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  },
  "id": 1
}
```

**Note**: The dev faucet is only available in debug builds (`cargo run`). It is disabled in release builds.

### Chat System

Demiurge includes a full social layer powered by the Abyss Gateway:

- **World Chat**: Global public chat room for all users
- **Direct Messages**: Private conversations between any two users
- **Media Sharing**: Upload images/videos from device or share from NFT collection
- **Safety Features**: "Blur 4 All" allows any user to blur inappropriate media for the entire community
- **The Seven Archons**: Special NPC users that can be messaged (future AI integration planned)
- **Username-Based Identity**: All messages are linked to UrgeID usernames
- **Real-time Updates**: GraphQL subscriptions for live message delivery

Access chat at `/chat` in the portal after logging in via "My Void".

### D-GEN NFT Mint Flow

Mint a D-GEN NFT via the `cgt_mintDgenNft` RPC method:

```json
{
  "jsonrpc": "2.0",
  "method": "cgt_mintDgenNft",
  "params": {
    "owner": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "fabric_root_hash": "0000000000000000000000000000000000000000000000000000000000000000",
    "forge_model_id": null,
    "forge_prompt_hash": null,
    "name": "Genesis Relic",
    "description": "A test D-GEN NFT"
  },
  "id": 1
}
```

**Requirements**:
- The `owner` address must be an Archon
- `fabric_root_hash` must be a 64-character hex string (32 bytes)

## JSON-RPC API

The Demiurge node exposes the following JSON-RPC methods:

### Chain Info
- `cgt_getChainInfo`: Get current chain height

### CGT Currency
- `cgt_getMetadata`: Get CGT currency metadata (name, symbol, decimals, maxSupply, totalSupply)
- `cgt_getTotalSupply`: Get current total CGT supply
- `cgt_getBalance`: Get CGT balance for an address (returns string in smallest units)
- `cgt_getNonce`: Get transaction nonce for an address

### UrgeID Identity
- `urgeid_create`: Create a new UrgeID profile
- `urgeid_get`: Get UrgeID profile by address
- `urgeid_recordSyzygy`: Record Syzygy contribution (increments score, awards badges, levels up, mints CGT rewards)
- `urgeid_getProgress`: Get leveling progression info (level, thresholds, progress ratio, CGT rewards)
- `urgeid_setHandle`: Set a unique handle (@username) for an UrgeID (legacy)
- `urgeid_getByHandle`: Get UrgeID profile by handle (legacy)
- `urgeid_setUsername`: Set a globally unique username for an UrgeID
- `urgeid_resolveUsername`: Resolve username to UrgeID address
- `urgeid_getProfileByUsername`: Get full UrgeID profile by username

### Wallet & Archon Status
- `cgt_isArchon`: Check if an address has Archon status

### NFTs
- `cgt_getNftsByOwner`: Get all NFTs owned by an address
- `cgt_mintDgenNft`: Mint a new D-GEN NFT (Archons only)

### Marketplace
- `cgt_getListing`: Get marketplace listing by ID
- `cgt_getFabricAsset`: Get Fabric asset by root hash

### Transactions
- `cgt_buildTransferTx`: Build a transfer transaction (returns unsigned tx hex)
- `cgt_signTransaction`: Attach Ed25519 signature to unsigned transaction
- `cgt_sendRawTransaction`: Submit a signed transaction to the mempool (returns tx_hash)
- `cgt_getTransaction`: Get transaction by hash
- `cgt_getTransactionHistory`: Get transaction history for an address
- `cgt_getBlockByHeight`: Get a block by height (stubbed for now)

### Dev Tools
- `cgt_devFaucet`: Mint CGT to an address (debug builds only)
- `cgt_devUnsafeTransfer`: Direct transfer without signature (debug builds only)

## Architecture

See [docs/architecture.md](./architecture.md) for detailed architecture documentation.

## Project Structure

```
DEMIURGE/
├── chain/                 # Rust L1 blockchain node
│   ├── src/
│   │   ├── core/         # Core types (Block, Transaction, State)
│   │   ├── runtime/      # Runtime modules (bank_cgt, nft_dgen, etc.)
│   │   ├── forge.rs       # Forge PoW implementation
│   │   ├── node.rs        # Node structure and state management
│   │   ├── rpc.rs         # JSON-RPC server
│   │   └── main.rs        # Entry point
│   └── Cargo.toml
├── apps/
│   ├── portal-web/        # Next.js portal website
│   └── desktop/           # Qt desktop app (optional)
├── indexer/               # Indexer services (optional)
├── docs/                  # Documentation
└── Cargo.toml            # Rust workspace root
```

## License

[Add your license here]

