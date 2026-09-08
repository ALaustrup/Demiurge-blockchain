# ScatterTXT: On-Chain Game Engine Integration Plan

## Executive Summary

ScatterTXT is Demiurge's native game engine designed for on-chain gaming. This plan outlines the integration of ScatterTXT with the Demiurge blockchain to enable:
- On-chain game state persistence
- NFT-based game assets with stateful properties (DRC-369)
- Session key authentication for seamless gameplay
- Cross-game asset interoperability
- Real-time blockchain events for multiplayer synchronization

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SCATTERTXT ENGINE                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │   Renderer   │  │   Physics    │  │      Asset Manager       │  │
│  │   (WebGL)    │  │   (2D/3D)    │  │   (NFT + Local Cache)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │    Input     │  │    Audio     │  │    State Synchronizer    │  │
│  │   Handler    │  │   Engine     │  │   (Blockchain Bridge)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│                      BLOCKCHAIN INTEGRATION LAYER                   │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Session Key │  │   DRC-369    │  │       Game Module        │  │
│  │   Manager    │  │   Handler    │  │   (On-Chain Logic)       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │   RPC/WS     │  │   Energy     │  │     Event Emitter        │  │
│  │   Client     │  │   Manager    │  │   (Real-time Updates)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DEMIURGE BLOCKCHAIN                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Balances    │  │   DRC-369    │  │      Game-Assets         │  │
│  │   (CGT)      │  │   (NFTs)     │  │   (Multi-Asset System)   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Session Keys │  │    Energy    │  │      Yield-NFTs          │  │
│  │ (Auth)       │  │ (Regenerate) │  │   (Passive Income)       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Core Engine (4-6 weeks)

### 1.1 ScatterTXT Engine Core

```typescript
// packages/scattertxt/src/engine/Engine.ts

export class ScatterEngine {
  private renderer: WebGLRenderer;
  private physics: PhysicsWorld;
  private assets: AssetManager;
  private blockchain: BlockchainBridge;
  private sessionKey: SessionKeyManager;
  
  constructor(config: EngineConfig) {
    this.blockchain = new BlockchainBridge({
      rpcUrl: 'https://rpc.demiurge.cloud',
      wsUrl: 'wss://rpc.demiurge.cloud/ws',
    });
    
    this.sessionKey = new SessionKeyManager(this.blockchain);
    this.assets = new AssetManager(this.blockchain);
  }
  
  async init(qorId: string): Promise<void> {
    // Authenticate via QOR ID
    await this.sessionKey.authenticate(qorId);
    
    // Load player's on-chain assets
    await this.assets.loadPlayerAssets();
    
    // Subscribe to blockchain events
    this.blockchain.subscribeToEvents();
  }
}
```

### 1.2 Session Key Integration

```typescript
// packages/scattertxt/src/blockchain/SessionKeyManager.ts

export class SessionKeyManager {
  private sessionKey: SessionKey | null = null;
  private expiresAt: number = 0;
  
  async authenticate(qorId: string): Promise<SessionKey> {
    // Request session key from blockchain
    const result = await this.rpc.call('sessionKeys_create', {
      qorId,
      permissions: ['game_actions', 'asset_transfer'],
      expiresIn: 3600 * 24, // 24 hours
    });
    
    this.sessionKey = result.sessionKey;
    this.expiresAt = result.expiresAt;
    
    return this.sessionKey;
  }
  
  async signAction(action: GameAction): Promise<SignedAction> {
    if (!this.sessionKey || Date.now() > this.expiresAt) {
      throw new Error('Session key expired');
    }
    
    return {
      ...action,
      signature: await this.sessionKey.sign(action),
      sessionKeyId: this.sessionKey.id,
    };
  }
}
```

### 1.3 DRC-369 Stateful NFT Handler

```typescript
// packages/scattertxt/src/blockchain/DRC369Handler.ts

export class DRC369Handler {
  async loadGameAsset(tokenId: string): Promise<GameAsset> {
    const nft = await this.rpc.call('drc369_getToken', { tokenId });
    
    return {
      id: nft.id,
      metadata: nft.metadata,
      state: nft.state, // Mutable on-chain state
      equippedItems: nft.state.equipment || [],
      stats: nft.state.stats || {},
      evolution: nft.state.evolution || 0,
    };
  }
  
  async updateAssetState(tokenId: string, stateChange: StateChange): Promise<void> {
    const signedTx = await this.sessionKey.signAction({
      type: 'DRC369_UPDATE_STATE',
      tokenId,
      stateChange,
    });
    
    await this.rpc.call('drc369_submitStateChange', signedTx);
  }
  
  async evolveAsset(tokenId: string): Promise<EvolutionResult> {
    // Trigger on-chain evolution based on accumulated experience
    const result = await this.rpc.call('drc369_evolve', {
      tokenId,
      sessionKey: this.sessionKey.id,
    });
    
    return result;
  }
}
```

---

## Phase 2: On-Chain Game Logic (6-8 weeks)

### 2.1 Game Module (Rust)

```rust
// framework/modules/game-engine/src/lib.rs

#[derive(Clone, Encode, Decode)]
pub struct GameSession {
    pub player: QorId,
    pub game_id: GameId,
    pub session_key: SessionKeyId,
    pub started_at: u64,
    pub state: GameState,
}

#[derive(Clone, Encode, Decode)]
pub struct GameState {
    pub score: u64,
    pub level: u32,
    pub checkpoints: Vec<Checkpoint>,
    pub inventory: Vec<AssetId>,
}

impl GameEngine {
    /// Start a new game session
    pub fn start_session(
        player: QorId,
        game_id: GameId,
        session_key: SessionKeyId,
    ) -> Result<GameSession, Error> {
        // Verify session key permissions
        SessionKeys::verify_permission(&session_key, Permission::GameActions)?;
        
        // Consume energy for starting game
        Energy::consume(&player, GAME_START_COST)?;
        
        let session = GameSession {
            player,
            game_id,
            session_key,
            started_at: timestamp(),
            state: GameState::default(),
        };
        
        Sessions::insert(&session.id, session.clone());
        emit_event(Event::GameStarted { player, game_id });
        
        Ok(session)
    }
    
    /// Record game action (called by session key, no wallet popup)
    pub fn record_action(
        session_id: SessionId,
        action: GameAction,
        signature: Signature,
    ) -> Result<ActionResult, Error> {
        let session = Sessions::get(&session_id)?;
        
        // Verify action signature from session key
        verify_session_signature(&session.session_key, &action, &signature)?;
        
        // Apply action to game state
        let result = apply_action(&mut session.state, action)?;
        
        // If action affects NFT, update DRC-369 state
        if let Some(nft_update) = result.nft_update {
            DRC369::update_state(&nft_update.token_id, nft_update.changes)?;
        }
        
        // Emit event for real-time clients
        emit_event(Event::ActionRecorded { session_id, action, result });
        
        Ok(result)
    }
    
    /// End session and persist final state
    pub fn end_session(session_id: SessionId) -> Result<GameResult, Error> {
        let session = Sessions::take(&session_id)?;
        
        // Calculate rewards based on performance
        let rewards = calculate_rewards(&session.state);
        
        // Distribute CGT rewards
        if rewards.cgt > 0 {
            Balances::mint(&session.player, rewards.cgt)?;
        }
        
        // Update NFT states with earned experience
        for (token_id, exp) in rewards.nft_experience {
            DRC369::add_experience(&token_id, exp)?;
        }
        
        Ok(GameResult { session, rewards })
    }
}
```

### 2.2 Energy System Integration

```rust
// Regenerating energy for gameplay

impl Energy {
    pub fn consume(player: &QorId, amount: u64) -> Result<(), Error> {
        let mut energy = PlayerEnergy::get(player);
        
        // Regenerate energy based on time elapsed
        energy.regenerate();
        
        if energy.current < amount {
            return Err(Error::InsufficientEnergy);
        }
        
        energy.current -= amount;
        PlayerEnergy::insert(player, energy);
        
        Ok(())
    }
    
    fn regenerate(&mut self) {
        let elapsed = timestamp() - self.last_update;
        let regen = (elapsed / REGEN_INTERVAL) * REGEN_RATE;
        
        self.current = std::cmp::min(self.current + regen, self.max);
        self.last_update = timestamp();
    }
}
```

---

## Phase 3: Client SDK & Tools (4-6 weeks)

### 3.1 ScatterTXT SDK

```typescript
// packages/scattertxt-sdk/src/index.ts

export class ScatterTXT {
  private engine: ScatterEngine;
  private connection: BlockchainConnection;
  
  static async create(config: ScatterConfig): Promise<ScatterTXT> {
    const instance = new ScatterTXT();
    
    // Connect to Demiurge RPC
    instance.connection = await BlockchainConnection.create({
      httpUrl: config.rpcUrl || 'https://rpc.demiurge.cloud',
      wsUrl: config.wsUrl || 'wss://rpc.demiurge.cloud/ws',
    });
    
    // Initialize engine
    instance.engine = new ScatterEngine({
      canvas: config.canvas,
      blockchain: instance.connection,
    });
    
    return instance;
  }
  
  // Authenticate player
  async login(qorId: string): Promise<Player> {
    const sessionKey = await this.engine.sessionKey.authenticate(qorId);
    const assets = await this.engine.assets.loadPlayerAssets();
    
    return {
      qorId,
      sessionKey,
      assets,
      energy: await this.getEnergy(),
    };
  }
  
  // Start a game session
  async startGame(gameId: string): Promise<GameSession> {
    return this.connection.call('gameEngine_startSession', {
      gameId,
      sessionKey: this.engine.sessionKey.id,
    });
  }
  
  // Record game action (signed with session key, no popup)
  async recordAction(action: GameAction): Promise<void> {
    const signed = await this.engine.sessionKey.signAction(action);
    await this.connection.call('gameEngine_recordAction', signed);
  }
  
  // Real-time event subscription
  onGameEvent(callback: (event: GameEvent) => void): Unsubscribe {
    return this.connection.subscribe('gameEngine_events', callback);
  }
}
```

### 3.2 Game Developer Template

```typescript
// Example: Simple on-chain game using ScatterTXT

import { ScatterTXT, GameAction } from '@demiurge/scattertxt-sdk';

async function main() {
  // Initialize ScatterTXT
  const scatter = await ScatterTXT.create({
    canvas: document.getElementById('game-canvas'),
    rpcUrl: 'https://rpc.demiurge.cloud',
  });
  
  // Login with QOR ID
  const player = await scatter.login('player-qor-id');
  console.log(`Logged in with ${player.assets.length} assets`);
  
  // Start game session
  const session = await scatter.startGame('scatter-adventure');
  
  // Game loop with on-chain actions
  scatter.onGameEvent((event) => {
    if (event.type === 'ITEM_COLLECTED') {
      updateUI(event.item);
    }
  });
  
  // Player collects item - recorded on-chain
  async function collectItem(itemId: string) {
    await scatter.recordAction({
      type: 'COLLECT_ITEM',
      itemId,
      timestamp: Date.now(),
    });
  }
  
  // End game and receive rewards
  async function endGame() {
    const result = await scatter.endSession(session.id);
    console.log(`Earned ${result.rewards.cgt} CGT!`);
  }
}
```

---

## Phase 4: Multiplayer & Advanced Features (8-12 weeks)

### 4.1 Real-time Multiplayer Sync

```typescript
// WebSocket-based multiplayer synchronization

export class MultiplayerManager {
  private ws: WebSocket;
  private players: Map<string, PlayerState> = new Map();
  
  async joinRoom(roomId: string): Promise<void> {
    this.ws.send(JSON.stringify({
      type: 'JOIN_ROOM',
      roomId,
      sessionKey: this.sessionKey.id,
    }));
    
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      
      switch (msg.type) {
        case 'PLAYER_JOINED':
          this.players.set(msg.playerId, msg.state);
          break;
        case 'STATE_UPDATE':
          this.syncState(msg.playerId, msg.state);
          break;
        case 'ACTION_BROADCAST':
          this.applyRemoteAction(msg.action);
          break;
      }
    };
  }
  
  broadcastAction(action: GameAction): void {
    this.ws.send(JSON.stringify({
      type: 'BROADCAST_ACTION',
      action,
      signature: this.sessionKey.sign(action),
    }));
  }
}
```

### 4.2 On-Chain Leaderboards

```rust
// Permanent, verifiable leaderboards

#[derive(Clone, Encode, Decode)]
pub struct LeaderboardEntry {
    pub player: QorId,
    pub score: u64,
    pub game_id: GameId,
    pub achieved_at: u64,
    pub proof_hash: Hash, // Merkle proof of game session
}

impl Leaderboard {
    pub fn submit_score(
        session_id: SessionId,
        final_score: u64,
    ) -> Result<Option<u32>, Error> {
        let session = Sessions::get(&session_id)?;
        
        // Generate proof of valid game session
        let proof = generate_session_proof(&session);
        
        let entry = LeaderboardEntry {
            player: session.player,
            score: final_score,
            game_id: session.game_id,
            achieved_at: timestamp(),
            proof_hash: proof.hash(),
        };
        
        // Insert into sorted leaderboard
        let rank = Leaderboards::insert(&session.game_id, entry)?;
        
        // Distribute prizes for top ranks
        if let Some(prize) = get_rank_prize(&session.game_id, rank) {
            Balances::mint(&session.player, prize)?;
        }
        
        Ok(rank)
    }
}
```

---

## Implementation Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1** | 4-6 weeks | Core engine, session keys, DRC-369 handler |
| **Phase 2** | 6-8 weeks | On-chain game module, energy integration |
| **Phase 3** | 4-6 weeks | Client SDK, developer tools, templates |
| **Phase 4** | 8-12 weeks | Multiplayer, leaderboards, advanced features |

**Total: 22-32 weeks to full production**

---

## Key Benefits

1. **No Wallet Popups** - Session keys allow seamless gameplay
2. **Stateful NFTs** - Game assets evolve on-chain (DRC-369)
3. **Cross-Game Interop** - Assets work across all ScatterTXT games
4. **Provable Fairness** - All game logic verifiable on-chain
5. **Passive Income** - Yield-bearing NFTs earn while playing
6. **Energy Economy** - Regenerating resource prevents exploitation
