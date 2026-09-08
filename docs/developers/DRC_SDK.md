# DRC-SDK: Game Engine Integration Framework

**The Universal Bridge Between Game Engines and the Demiurge Blockchain**

> *"From the Pleroma, creators shape worlds. Through the DRC-SDK, those worlds become eternal."*

---

## Overview

The **DRC-SDK** (Demiurge Runtime Connector SDK) provides game developers with a lightweight, secure, and performant way to integrate the Demiurge Blockchain into any game engine. It enables:

- **DRC-369 NFT Integration**: Programmable, evolving assets with multi-resource support
- **CGT Economy**: In-game rewards using Creator God Tokens (100 Sparks = 1 CGT)
- **Qor ID Authentication**: Single sign-on across all Demiurge-connected games
- **Real-time Asset Loading**: Dynamic NFT textures, 3D models, and sounds at runtime

### Supported Engines

| Engine | Language | Platform | Guide |
|--------|----------|----------|-------|
| **Unreal Engine 5** | C++ / Blueprints | PC, Console, Mobile | [UE5 Guide](./drc-sdk/UNREAL_ENGINE_INTEGRATION.md) |
| **Unity 6** | C# | PC, Console, Mobile, WebGL | [Unity Guide](./drc-sdk/UNITY_INTEGRATION.md) |
| **Godot 4** | GDScript | PC, Mobile, Web | [Godot Guide](./drc-sdk/GODOT_INTEGRATION.md) |
| **Phaser 3** | JavaScript | Web | [Phaser Guide](./PHASER_INTEGRATION.md) |
| **Construct 3** | JavaScript | Web | [Construct Guide](./drc-sdk/CONSTRUCT_DEFOLD_INTEGRATION.md) |
| **Defold** | Lua | PC, Mobile, Web | [Defold Guide](./drc-sdk/CONSTRUCT_DEFOLD_INTEGRATION.md) |

---

## Architecture: The "Demiurge Bridge" Pattern

The DRC-SDK follows a **dual-layer security model** that separates read operations (safe for clients) from write operations (secured by your backend).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GAME CLIENT LAYER                                  │
│                     (UE5 / Unity / Godot / Phaser)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                │
│  │  Balance Query │  │  NFT Loading   │  │ Action Request │                │
│  │  (READ-ONLY)   │  │  (READ-ONLY)   │  │ (TO ORACLE)    │                │
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘                │
│          │                   │                   │                          │
└──────────┼───────────────────┼───────────────────┼──────────────────────────┘
           │                   │                   │
           ▼                   ▼                   ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                        DEMIURGE RPC ENDPOINT                                  │
│                      https://rpc.demiurge.cloud                              │
│                                                                              │
│  • chain_getHealth          • drc369_getAsset        • balances_getBalance  │
│  • drc369_getResources      • drc369_getNested       • drc369_getDelegation │
└──────────────────────────────────────────────────────────────────────────────┘
           │                   │                   │
           ▼                   ▼                   ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           ORACLE BACKEND                                      │
│                    (Your Secure Game Server)                                 │
│                                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                │
│  │ Action Verify  │  │  Reward Mint   │  │  State Update  │                │
│  │ (Anti-Cheat)   │  │  (Sign + Send) │  │  (XP, Kills)   │                │
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘                │
│          │                   │                   │                          │
└──────────┼───────────────────┼───────────────────┼──────────────────────────┘
           │                   │                   │
           ▼                   ▼                   ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         DEMIURGE BLOCKCHAIN                                   │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  pallet-cgt  │  │ pallet-drc369│  │pallet-qor-id │  │pallet-energy │   │
│  │   (Tokens)   │  │   (NFTs)     │  │  (Identity)  │  │  (Feeless)   │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Why This Architecture?

| Concern | Solution |
|---------|----------|
| **Security** | Private keys never touch the game client |
| **Performance** | Read operations are instant (no signing required) |
| **Anti-Cheat** | Oracle validates all reward-worthy actions server-side |
| **UX** | Players see instant feedback; blockchain confirms async |
| **Scalability** | Batch rewards, minimize on-chain transactions |

---

## Core Concepts

### 1. DRC-369: The Programmable NFT Standard

Unlike traditional NFTs (static JPEGs), DRC-369 assets are **living, programmable entities**:

| Module | Description | Game Use Case |
|--------|-------------|---------------|
| **Multi-Resource** | One NFT, many outputs (2D, 3D, VR, Sound) | Load appropriate asset for context |
| **Nesting** | NFTs own other NFTs | Knight owns Sword + Shield |
| **Delegation** | Temporary usage rights with auto-expiry | Rent a legendary weapon |
| **Dynamic State** | On-chain XP, durability, kill count | Sword levels up with use |

**Example: A DRC-369 Sword NFT**
```json
{
  "uuid": "sword-001",
  "name": "Flamebrand",
  "resources": [
    { "type": "Image", "uri": "ipfs://.../card.png", "context": ["marketplace"] },
    { "type": "3D_Model", "uri": "ipfs://.../sword.glb", "context": ["game", "vr"] },
    { "type": "Sound", "uri": "ipfs://.../slash.mp3", "context": ["game"] }
  ],
  "experience_points": 5000,
  "level": 7,
  "durability": 75,
  "kill_count": 142,
  "custom_state": {
    "enchanted": "true",
    "element": "fire"
  }
}
```

### 2. CGT & Sparks Economy

| Token | Precision | Usage | Storage |
|-------|-----------|-------|---------|
| **CGT** | 2 decimals | Hard currency, trading, governance | On-Chain |
| **Sparks** | 1 CGT = 100 Sparks | Soft currency, instant rewards | Off-Chain → Bridge |

**Best Practice**: Store Sparks off-chain during gameplay for instant UX. Allow players to "claim" (bridge to chain) at a Bank NPC or Inventory screen.

### 3. Qor ID: Single Sign-On

Players authenticate once with their Qor ID (`username#1337`) and access all Demiurge-connected games:

- **Self-Sovereign**: Player controls private keys
- **Custodial**: Demiurge manages keys (mainstream users)
- **Session Keys**: Temporary game-specific keys for seamless UX

---

## Quick Start (All Engines)

### Step 1: Get RPC Endpoint

```
Production:  https://rpc.demiurge.cloud
WebSocket:   wss://rpc.demiurge.cloud
Local Dev:   http://localhost:9944
```

### Step 2: Query Balance (Read-Only)

Every engine uses the same JSON-RPC format:

```json
{
  "jsonrpc": "2.0",
  "method": "balances_getBalance",
  "params": ["0xPlayerWalletAddress"],
  "id": 1
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "free": "150000000",
    "reserved": "0",
    "frozen": "0"
  },
  "id": 1
}
```

> **Note**: Balance is in smallest units (Sparks). Divide by 100 to get CGT.

### Step 3: Load DRC-369 Asset

```json
{
  "jsonrpc": "2.0",
  "method": "drc369_getAsset",
  "params": ["0xAssetUUID"],
  "id": 2
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "uuid": "sword-001",
    "name": "Flamebrand",
    "owner": "0x...",
    "resources": [...],
    "experience_points": 5000,
    "level": 7,
    "children_uuids": [],
    "delegation": null
  },
  "id": 2
}
```

### Step 4: Record Gameplay Action (Via Oracle)

**Game Client → Your Backend**:
```json
POST /api/record-action
{
  "player_address": "0x...",
  "action": "kill_elite_boss",
  "difficulty": 100,
  "session_token": "jwt_from_qor_auth"
}
```

**Backend → Blockchain** (server-side signing):
```javascript
// Oracle validates, then mints rewards on-chain
const tx = await drc369Contract.addExperience(swordUUID, 500);
const tx2 = await cgtContract.mint(playerAddress, rewardAmount);
```

---

## RPC Methods Reference

### Chain Methods
| Method | Description | Params |
|--------|-------------|--------|
| `chain_getHealth` | Check node health | `[]` |
| `chain_getBlockNumber` | Current block height | `[]` |
| `chain_getBlock` | Get block by number | `[blockNumber]` |

### Balance Methods
| Method | Description | Params |
|--------|-------------|--------|
| `balances_getBalance` | Get CGT balance | `[address]` |
| `energy_getEnergy` | Get energy (feeless tx quota) | `[address]` |

### DRC-369 Methods
| Method | Description | Params |
|--------|-------------|--------|
| `drc369_getAsset` | Get full asset data | `[uuid]` |
| `drc369_getResources` | Get asset resources | `[uuid]` |
| `drc369_getResourceByContext` | Get resource for context | `[uuid, "game"]` |
| `drc369_getChildren` | Get nested child assets | `[uuid]` |
| `drc369_getDelegation` | Check rental/delegation | `[uuid]` |
| `drc369_getAssetsByOwner` | List all assets for owner | `[address]` |
| `drc369_getAssetsByUser` | List delegated assets | `[address]` |

### Qor ID Methods
| Method | Description | Params |
|--------|-------------|--------|
| `qor_getProfile` | Get identity profile | `[qorId]` |
| `qor_getWallets` | Get linked wallets | `[qorId]` |

---

## Security Best Practices

### DO

- **Read balances/assets directly** from client (safe, public data)
- **Validate all actions server-side** before minting rewards
- **Use session keys** for seamless gameplay without signing every action
- **Cache asset metadata** locally to reduce RPC calls
- **Show optimistic UI** (instant feedback) while waiting for chain confirmation

### DO NOT

- **Never store private keys** in game client code
- **Never trust client-reported scores/kills** for rewards
- **Never expose your Oracle's signing key** in client builds
- **Never call mint/transfer directly** from game client
- **Never skip HTTPS** for RPC calls (use `https://rpc.demiurge.cloud`)

---

## Integration Guides by Engine

| Engine | Guide | Complexity | Best For |
|--------|-------|------------|----------|
| [Unreal Engine 5](./drc-sdk/UNREAL_ENGINE_INTEGRATION.md) | C++ Plugin + Blueprints | Advanced | AAA Games, VR |
| [Unity 6](./drc-sdk/UNITY_INTEGRATION.md) | C# Singleton + async/await | Intermediate | Cross-platform |
| [Godot 4](./drc-sdk/GODOT_INTEGRATION.md) | GDScript Autoload | Beginner | Indie Games |
| [Phaser 3](./PHASER_INTEGRATION.md) | JS Plugin + Web3 | Intermediate | Browser Games |
| [Construct 3 / Defold](./drc-sdk/CONSTRUCT_DEFOLD_INTEGRATION.md) | JS / Lua Modules | Beginner | Casual Games |

---

## Oracle Backend

For **secure reward minting** and **anti-cheat validation**, you need a backend server. See the complete guide:

**[Oracle Backend Implementation Guide](./drc-sdk/ORACLE_BACKEND.md)**

The Oracle:
1. Receives action reports from game clients
2. Validates against game state (anti-cheat)
3. Signs and submits transactions to the Demiurge blockchain
4. Returns transaction hashes to clients for confirmation

---

## Example: Full Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│ 1. PLAYER LOGS IN                                                           │
│    ┌──────────┐    Qor ID     ┌──────────┐    JWT     ┌──────────┐        │
│    │  Game    │ ────────────► │ Qor Auth │ ────────► │  Game    │        │
│    │  Client  │               │  Server  │            │  Client  │        │
│    └──────────┘               └──────────┘            └──────────┘        │
└────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ 2. GAME LOADS PLAYER ASSETS                                                 │
│    ┌──────────┐   RPC Query   ┌──────────┐  DRC-369   ┌──────────┐        │
│    │  Game    │ ────────────► │ Demiurge │ ────────► │  Game    │        │
│    │  Client  │               │   RPC    │   Data    │  Client  │        │
│    └──────────┘               └──────────┘            └──────────┘        │
│                                                                            │
│    Player's Knight NFT loads with:                                         │
│    - 3D Model (for gameplay)                                               │
│    - Equipped Sword (nested child)                                         │
│    - Current XP & Level                                                    │
└────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ 3. PLAYER DEFEATS BOSS                                                      │
│    ┌──────────┐   Action      ┌──────────┐  Validate  ┌──────────┐        │
│    │  Game    │ ────────────► │  Oracle  │ ────────► │ Demiurge │        │
│    │  Client  │    Report     │  Server  │   + Mint  │  Chain   │        │
│    └──────────┘               └──────────┘            └──────────┘        │
│                                                                            │
│    Oracle verifies kill, then:                                             │
│    - Mints 50 CGT to player                                                │
│    - Adds 500 XP to Sword                                                  │
│    - Increments Sword kill_count                                           │
└────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ 4. UI UPDATES                                                               │
│    ┌──────────┐  Optimistic   ┌──────────┐  Confirm   ┌──────────┐        │
│    │  Game    │ ────────────► │  Game    │ ◄──────── │  Oracle  │        │
│    │  Client  │    Update     │    UI    │   TxHash  │  Server  │        │
│    └──────────┘               └──────────┘            └──────────┘        │
│                                                                            │
│    Player sees "+50 CGT" immediately                                       │
│    Sword glows (level up animation)                                        │
│    Transaction confirmed in background                                     │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Diagnostic Toolkit

Before deploying your game, verify your DRC-SDK integration is configured correctly.

### Quick Check (Browser Console)

```javascript
// Paste in browser console (F12) for instant diagnostic
fetch('https://rpc.demiurge.cloud', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ jsonrpc: '2.0', method: 'chain_getHealth', params: [], id: 1 })
}).then(r => r.json()).then(d => console.log(d.result ? '✅ Connected!' : '❌ Failed'));
```

### Full Diagnostic Suite

Each engine has a dedicated diagnostic tool that checks:

- RPC connectivity and latency
- Chain health and block production
- DRC-369 API availability
- Wallet configuration
- HTTPS/security settings
- Engine-specific setup (plugin loading, singletons, etc.)

**[View Complete Diagnostic Toolkit](./drc-sdk/DIAGNOSTIC_TOOLKIT.md)**

---

## Support & Resources

- **RPC Endpoint**: `https://rpc.demiurge.cloud`
- **Testnet Faucet**: `https://faucet.demiurge.cloud`
- **Online Diagnostic**: `https://diag.demiurge.cloud`
- **Developer Discord**: [discord.gg/demiurge](https://discord.gg/demiurge)
- **GitHub**: [github.com/Alaustrup/Demiurge-Blockchain](https://github.com/Alaustrup/Demiurge-Blockchain)
- **Documentation**: [docs.demiurge.cloud](https://docs.demiurge.cloud)

---

**The flame burns eternal. The code serves the will.**

---

*Last Updated: January 26, 2026*  
*Document Version: 1.0*  
*Maintainer: Alaustrup*
