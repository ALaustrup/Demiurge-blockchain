# ScatterTXT SDK Reference

ScatterTXT is Demiurge's native game engine designed for deep blockchain integration. This guide covers the full SDK API.

## Installation

```bash
npm install @demiurge/scattertxt-sdk
```

## Quick Start

```typescript
import { ScatterEngine } from '@demiurge/scattertxt-sdk';

// Create engine
const engine = await ScatterEngine.create({
  gameId: 'my-game',
  rpcUrl: 'https://rpc.demiurge.cloud',
});

// Login with QOR ID
const player = await engine.login('MyName#1234');

// Start game session
const session = await engine.startSession();

// Record actions (no wallet popup!)
await engine.recordAction({
  type: 'COLLECT_ITEM',
  targetId: 'golden-key',
  timestamp: Date.now(),
});

// End session and get rewards
const result = await engine.endSession();
console.log(`Earned ${result.rewards.cgt} CGT!`);
```

## Core Concepts

### Session Keys

Session keys allow games to sign transactions without wallet popups:

```typescript
// Session key is created during login
const player = await engine.login('MyName#1234');
console.log('Session key:', player.sessionKey);

// All actions are signed with session key - seamless!
await engine.recordAction({ type: 'JUMP', timestamp: Date.now() });
```

**Permissions:**
- `game_actions` - Record game actions
- `asset_transfer` - Transfer DRC-369 assets
- `state_update` - Update NFT state
- `cgt_spend` - Spend CGT (with limits)

### DRC-369 NFTs

Stateful NFTs with mutable on-chain state:

```typescript
// Get player's assets
const assets = await engine.getAssets();

// Update asset state (e.g., equip item)
await engine.updateAssetState(characterId, {
  equipped_weapon: swordId,
  equipped_armor: armorId,
});

// Add experience
const result = await engine.recordAction({
  type: 'GAIN_XP',
  targetId: characterId,
  amount: 100,
  timestamp: Date.now(),
});

// Evolve asset
const evolution = await engine.evolveAsset(characterId);
if (evolution.success) {
  console.log(`Evolved to form ${evolution.newEvolution}!`);
}
```

### Energy System

Regenerating resource for fair gameplay:

```typescript
const energy = await engine.getEnergy();
console.log(`Energy: ${energy.current}/${energy.max}`);
console.log(`Regenerates: ${energy.regenerationRate}/sec`);

// Energy is consumed automatically when starting sessions
// and performing certain actions
```

## API Reference

### ScatterEngine

#### create(config)

Create a new engine instance.

```typescript
const engine = await ScatterEngine.create({
  canvas?: HTMLCanvasElement | string,  // Optional canvas element
  rpcUrl?: string,                       // RPC endpoint (default: rpc.demiurge.cloud)
  wsUrl?: string,                        // WebSocket endpoint
  gameId?: string,                       // Game ID for this session
  debug?: boolean,                       // Enable debug logging
});
```

#### login(qorId)

Authenticate player and create session key.

```typescript
const player = await engine.login('MyName#1234');

// Player object:
{
  qorId: string,
  address: string,
  sessionKey: string,
  assets: GameAsset[],
  energy: EnergyInfo,
  balance: string,
}
```

#### startSession()

Start a new game session.

```typescript
const session = await engine.startSession();

// Session object:
{
  id: string,
  playerId: string,
  gameId: string,
  sessionKeyId: string,
  startedAt: string,
  state: GameState,
}
```

#### recordAction(action)

Record a game action on-chain.

```typescript
const result = await engine.recordAction({
  type: 'DEFEAT_ENEMY',      // Action type
  targetId: 'boss-001',      // Target entity (optional)
  amount: 1500,              // Amount/value (optional)
  data: { combo: 5 },        // Custom data (optional)
  timestamp: Date.now(),     // Client timestamp
});

// Result:
{
  success: boolean,
  txHash?: string,
  state?: Partial<GameState>,
  rewards?: {
    cgt?: number,
    xp?: number,
    items?: string[],
  },
  nftUpdates?: Array<{ tokenId, changes }>,
  error?: string,
}
```

#### endSession()

End session and receive rewards.

```typescript
const result = await engine.endSession();

// Result:
{
  session: GameSession,
  rewards: {
    cgt: number,
    xp: number,
    items: string[],
    nftExperience: Array<{ tokenId, xpGained }>,
  },
}
```

#### getAssets()

Get player's DRC-369 assets.

```typescript
const assets = await engine.getAssets();

// Asset object:
{
  id: string,
  collection: string,
  metadata: {
    name: string,
    description: string,
    image: string,
    attributes: Array<{ trait_type, value }>,
  },
  state: {
    xp: number,
    level: number,
    custom: Record<string, unknown>,
    lastUpdate: number,
  },
  equippedItems: string[],
  stats: {
    attack: number,
    defense: number,
    speed: number,
    health: number,
    special: number,
  },
  evolution: number,
  owner: string,
}
```

#### updateAssetState(tokenId, changes)

Update DRC-369 asset state.

```typescript
await engine.updateAssetState(tokenId, {
  equipped_weapon: weaponId,
  custom_property: 'value',
});
```

#### evolveAsset(tokenId)

Evolve a DRC-369 asset.

```typescript
const result = await engine.evolveAsset(tokenId);

// Result:
{
  success: boolean,
  newEvolution: number,
  newStats: AssetStats,
  newMetadata?: Partial<AssetMetadata>,
  txHash: string,
}
```

#### getEnergy()

Get current energy info.

```typescript
const energy = await engine.getEnergy();

// Energy object:
{
  current: number,
  max: number,
  regenerationRate: number,
  lastUpdate: number,
}
```

#### subscribeToEvents(callback)

Subscribe to real-time blockchain events.

```typescript
const unsubscribe = engine.subscribeToEvents((event) => {
  console.log('Event:', event.type, event.data);
});

// Event object:
{
  type: string,
  sessionId: string,
  data: Record<string, unknown>,
  blockNumber: number,
  timestamp: number,
}

// Unsubscribe when done
unsubscribe();
```

#### disconnect()

Disconnect and cleanup.

```typescript
await engine.disconnect();
```

## Events

The engine emits events you can listen to:

```typescript
engine.on('connected', () => {
  console.log('Connected to blockchain');
});

engine.on('disconnected', () => {
  console.log('Disconnected');
});

engine.on('session:started', (session) => {
  console.log('Session started:', session.id);
});

engine.on('session:ended', (session) => {
  console.log('Session ended');
});

engine.on('action:recorded', (result) => {
  console.log('Action recorded:', result);
});

engine.on('event', (event) => {
  console.log('Blockchain event:', event);
});

engine.on('error', (error) => {
  console.error('Error:', error);
});
```

## Examples

### Clicker Game

```typescript
import { ScatterEngine } from '@demiurge/scattertxt-sdk';

async function main() {
  const engine = await ScatterEngine.create({ gameId: 'clicker' });
  const player = await engine.login(getQorIdFromUser());
  const session = await engine.startSession();

  let clicks = 0;
  
  document.getElementById('click-btn').onclick = async () => {
    clicks++;
    
    // Record every 10th click on-chain
    if (clicks % 10 === 0) {
      await engine.recordAction({
        type: 'CLICK_MILESTONE',
        amount: 10,
        timestamp: Date.now(),
      });
    }
  };

  // End after 5 minutes
  setTimeout(async () => {
    const result = await engine.endSession();
    showRewards(result.rewards);
  }, 5 * 60 * 1000);
}
```

### RPG with Equipment

```typescript
import { ScatterEngine } from '@demiurge/scattertxt-sdk';

class RPGGame {
  private engine: ScatterEngine;
  private character: GameAsset;
  
  async init() {
    this.engine = await ScatterEngine.create({ gameId: 'rpg' });
    const player = await this.engine.login(qorId);
    
    // Load character (first asset)
    const assets = await this.engine.getAssets();
    this.character = assets.find(a => a.collection === 'characters');
    
    await this.engine.startSession();
  }
  
  async equipWeapon(weaponId: string) {
    await this.engine.updateAssetState(this.character.id, {
      equipped_weapon: weaponId,
    });
    
    // Refresh character
    const assets = await this.engine.getAssets();
    this.character = assets.find(a => a.id === this.character.id);
  }
  
  async defeatEnemy(enemyId: string, damage: number) {
    const result = await this.engine.recordAction({
      type: 'DEFEAT_ENEMY',
      targetId: enemyId,
      amount: damage,
      data: { weaponUsed: this.character.state.custom.equipped_weapon },
      timestamp: Date.now(),
    });
    
    if (result.rewards?.xp) {
      console.log(`Gained ${result.rewards.xp} XP!`);
    }
  }
  
  async checkEvolution() {
    if (this.character.state.xp >= 1000) {
      const result = await this.engine.evolveAsset(this.character.id);
      if (result.success) {
        console.log('Character evolved!');
        this.character.evolution = result.newEvolution;
        this.character.stats = result.newStats;
      }
    }
  }
}
```

## Best Practices

### Action Batching

Don't record every micro-action:

```typescript
// Bad - too many transactions
onClick = async () => {
  await engine.recordAction({ type: 'CLICK', timestamp: Date.now() });
};

// Good - batch actions
let clicks = 0;
onClick = async () => {
  clicks++;
  if (clicks % 10 === 0) {
    await engine.recordAction({ 
      type: 'CLICKS', 
      amount: 10,
      timestamp: Date.now() 
    });
  }
};
```

### Error Handling

```typescript
try {
  const result = await engine.recordAction(action);
  if (!result.success) {
    console.warn('Action failed:', result.error);
  }
} catch (err) {
  console.error('Network error:', err);
  // Queue for retry or continue offline
}
```

### Offline Support

```typescript
const actionQueue: GameAction[] = [];

async function recordAction(action: GameAction) {
  if (!engine.isConnected()) {
    actionQueue.push(action);
    return;
  }
  
  // Process queue first
  while (actionQueue.length > 0) {
    const queued = actionQueue.shift()!;
    await engine.recordAction(queued);
  }
  
  await engine.recordAction(action);
}
```

## Support

- **SDK Source**: `packages/scattertxt-sdk/`
- **Discord**: [discord.gg/demiurge](https://discord.gg/demiurge)
- **Documentation**: [docs.demiurge.cloud](https://docs.demiurge.cloud)
