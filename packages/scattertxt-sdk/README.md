# ScatterTXT SDK

The official game engine SDK for building on-chain games on Demiurge Blockchain.

## Features

- **Session Key Authentication** - No wallet popups during gameplay
- **DRC-369 Stateful NFTs** - Game assets with mutable on-chain state
- **Real-time Events** - WebSocket subscriptions for multiplayer sync
- **Energy System** - Regenerating resource for fair gameplay
- **Cross-game Interoperability** - Assets work across all ScatterTXT games

## Installation

```bash
npm install @demiurge/scattertxt-sdk
```

## Quick Start

```typescript
import { ScatterEngine } from '@demiurge/scattertxt-sdk';

// Initialize the engine
const engine = await ScatterEngine.create({
  gameId: 'my-awesome-game',
  rpcUrl: 'https://rpc.demiurge.cloud',
});

// Login with QOR ID
const player = await engine.login('MyName#1234');
console.log(`Logged in with ${player.assets.length} assets`);

// Start a game session
const session = await engine.startSession();

// Record game actions (no wallet popup!)
await engine.recordAction({
  type: 'COLLECT_ITEM',
  targetId: 'golden-key',
  timestamp: Date.now(),
});

// End session and receive rewards
const result = await engine.endSession();
console.log(`Earned ${result.rewards.cgt} CGT!`);
```

## Core Concepts

### Session Keys

Session keys allow games to record actions on-chain without requiring wallet confirmation for each action. They are:

- **Ephemeral** - Created for each session, expire after 24 hours
- **Permission-scoped** - Limited to specific actions (game_actions, asset_transfer, etc.)
- **Revocable** - Can be revoked at any time by the user

```typescript
// Session keys are created automatically during login
const player = await engine.login('MyName#1234');

// Actions are signed with the session key - no popup!
await engine.recordAction({
  type: 'DEFEAT_ENEMY',
  targetId: 'boss-dragon-001',
  amount: 1500, // damage dealt
  timestamp: Date.now(),
});
```

### DRC-369 Stateful NFTs

DRC-369 NFTs can store mutable on-chain state, enabling:

- Equipment and inventory systems
- Experience and leveling
- Evolution mechanics
- Cross-game asset interoperability

```typescript
// Get player's assets
const assets = await engine.getAssets();

// Update asset state (e.g., equip item)
await engine.updateAssetState(characterId, {
  equipped_weapon: swordId,
  equipped_armor: armorId,
});

// Evolve an asset
const result = await engine.evolveAsset(characterId);
if (result.success) {
  console.log(`Evolved to level ${result.newEvolution}!`);
}
```

### Energy System

Energy prevents exploitation and creates natural gameplay pacing:

- Regenerates over time (configurable rate)
- Consumed when starting sessions or performing actions
- Can be boosted with items or staking

```typescript
// Check energy before action
const energy = await engine.getEnergy();
console.log(`Energy: ${energy.current}/${energy.max}`);

// Energy is automatically consumed by game actions
```

### Real-time Events

Subscribe to blockchain events for multiplayer synchronization:

```typescript
// Subscribe to game events
engine.subscribeToEvents((event) => {
  switch (event.type) {
    case 'PLAYER_JOINED':
      addPlayerToScene(event.data.playerId);
      break;
    case 'ITEM_COLLECTED':
      removeItemFromWorld(event.data.itemId);
      break;
  }
});
```

## API Reference

### ScatterEngine

| Method | Description |
|--------|-------------|
| `create(config)` | Create a new engine instance |
| `login(qorId)` | Authenticate with QOR ID |
| `startSession()` | Start a game session |
| `recordAction(action)` | Record an action on-chain |
| `endSession()` | End session and receive rewards |
| `getAssets()` | Get player's DRC-369 assets |
| `updateAssetState(tokenId, changes)` | Update NFT state |
| `evolveAsset(tokenId)` | Evolve a DRC-369 asset |
| `getEnergy()` | Get current energy info |
| `subscribeToEvents(callback)` | Subscribe to real-time events |
| `disconnect()` | Disconnect and cleanup |

### Types

```typescript
interface ScatterConfig {
  canvas?: HTMLCanvasElement | string;
  rpcUrl?: string;
  wsUrl?: string;
  gameId?: string;
  debug?: boolean;
}

interface GameAction {
  type: string;
  data?: Record<string, unknown>;
  timestamp: number;
  targetId?: string;
  amount?: number;
}

interface GameAsset {
  id: string;
  collection: string;
  metadata: AssetMetadata;
  state: AssetState;
  equippedItems: string[];
  stats: AssetStats;
  evolution: number;
  owner: string;
}
```

## Examples

### Simple Clicker Game

```typescript
import { ScatterEngine } from '@demiurge/scattertxt-sdk';

async function main() {
  const engine = await ScatterEngine.create({ gameId: 'clicker' });
  const player = await engine.login(prompt('Enter QOR ID:'));
  const session = await engine.startSession();

  let clicks = 0;
  
  document.getElementById('button').onclick = async () => {
    clicks++;
    await engine.recordAction({
      type: 'CLICK',
      amount: 1,
      timestamp: Date.now(),
    });
  };

  // End session after 5 minutes
  setTimeout(async () => {
    const result = await engine.endSession();
    alert(`You clicked ${clicks} times and earned ${result.rewards.cgt} CGT!`);
  }, 300000);
}
```

### RPG with Equipment

```typescript
import { ScatterEngine } from '@demiurge/scattertxt-sdk';

async function equipWeapon(engine, characterId, weaponId) {
  await engine.updateAssetState(characterId, {
    equipped_weapon: weaponId,
  });
  console.log('Weapon equipped!');
}

async function defeatEnemy(engine, enemyId, damage) {
  const result = await engine.recordAction({
    type: 'DEFEAT_ENEMY',
    targetId: enemyId,
    amount: damage,
    timestamp: Date.now(),
  });

  if (result.rewards?.xp) {
    console.log(`Gained ${result.rewards.xp} XP!`);
  }
}
```

## License

MIT License - See LICENSE file for details.
