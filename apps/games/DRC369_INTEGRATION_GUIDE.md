# DRC-369 Game Integration Guide

## Overview

This guide shows how to integrate DRC-369 NFT assets into your game to:
1. **Unlock in-game content** based on NFT ownership
2. **Mint soulbound achievement NFTs** when players complete milestones
3. **Share assets across multiple games** (interoperability)
4. **Update NFT state dynamically** based on gameplay

---

## Part 1: Asset Architecture

### The DRC-369 Asset Model

```
┌─────────────────────────────────────────────────────────────────┐
│                        DRC-369 NFT                              │
├─────────────────────────────────────────────────────────────────┤
│  tokenId: "drc369-achievement-001"                              │
│  owner: "5GrwvaEF..."  (user's on-chain address)                │
│  isSoulbound: true     (account-bound, non-transferable)        │
│  tokenUri: "ipfs://..." or on-chain JSON                        │
│                                                                 │
│  ┌─────────────── Dynamic State ──────────────┐                 │
│  │  stats/xp: "1500"                          │                 │
│  │  stats/level: "5"                          │                 │
│  │  stats/games_played: "12"                  │                 │
│  │  visual/skin: "gold"                       │                 │
│  │  visual/effects/glow: "true"               │                 │
│  │  achievements/first_win: "1706745600"      │                 │
│  │  games/cosmic-runner/high_score: "50000"   │                 │
│  │  games/cosmic-runner/unlocked: "true"      │                 │
│  └────────────────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Concepts

1. **Soulbound = Account-Bound**: Cannot be sold/transferred. Perfect for achievements.
2. **Dynamic State**: NFT attributes that games can read AND write.
3. **Path-Based Keys**: Hierarchical (e.g., `games/your-game/score`) for organization.
4. **Cross-Game Data**: Games read each other's state for interoperability.

---

## Part 2: Game File Structure

```
apps/games/YOUR_GAME/
├── index.html              # Entry point
├── game.js                 # Main game logic
├── DemiurgeIntegration.js  # NFT/Blockchain integration (copy from template)
├── assets/
│   ├── sprites/
│   │   ├── player_default.png      # Default (no NFT)
│   │   ├── player_gold_skin.png    # Unlocked by NFT
│   │   └── player_legendary.png    # Rare achievement skin
│   ├── audio/
│   └── data/
│       └── nft_assets.json         # NFT → In-game asset mapping
└── thumbnail.png
```

---

## Part 3: The NFT Asset Mapping File

Create `assets/data/nft_assets.json` to define what NFTs unlock:

```json
{
  "version": "1.0.0",
  "gameId": "your-game-id",
  
  "assetClasses": {
    "player_skin": {
      "description": "Player character visual appearance",
      "default": "sprites/player_default.png"
    },
    "trail_effect": {
      "description": "Visual trail behind player",
      "default": null
    },
    "powerup_boost": {
      "description": "Starting powerup multiplier",
      "default": 1.0
    }
  },
  
  "nftUnlocks": [
    {
      "id": "gold_pioneer",
      "name": "Gold Pioneer Skin",
      "description": "Awarded to early Demiurge adopters",
      "conditions": {
        "type": "ownership",
        "check": "hasAchievement",
        "achievementKey": "achievements/early_adopter"
      },
      "unlocks": {
        "player_skin": "sprites/player_gold_skin.png",
        "trail_effect": "effects/gold_trail",
        "powerup_boost": 1.25
      }
    },
    {
      "id": "legendary_champion",
      "name": "Legendary Champion",
      "description": "Complete all games on Demiurge platform",
      "conditions": {
        "type": "dynamicState",
        "check": "valueGreaterThan",
        "path": "stats/games_completed",
        "threshold": 5
      },
      "unlocks": {
        "player_skin": "sprites/player_legendary.png",
        "trail_effect": "effects/rainbow_trail",
        "powerup_boost": 1.5
      }
    },
    {
      "id": "cosmic_runner_master",
      "name": "Cosmic Runner Master",
      "description": "Score 100,000+ in Cosmic Runner (interoperability demo)",
      "conditions": {
        "type": "dynamicState",
        "check": "valueGreaterThan",
        "path": "games/cosmic-runner/high_score",
        "threshold": 100000
      },
      "unlocks": {
        "player_skin": "sprites/player_cosmic.png"
      }
    }
  ],
  
  "mintableAchievements": [
    {
      "id": "first_victory",
      "name": "First Victory",
      "description": "Win your first game",
      "trigger": "onFirstWin",
      "soulbound": true,
      "metadata": {
        "image": "ipfs://QmYourImageHash",
        "attributes": [
          { "trait_type": "Achievement", "value": "First Victory" },
          { "trait_type": "Game", "value": "Your Game Name" },
          { "trait_type": "Rarity", "value": "Common" }
        ]
      },
      "dynamicStateUpdates": {
        "achievements/first_victory": "{timestamp}",
        "stats/achievements_count": "+1"
      }
    },
    {
      "id": "score_master",
      "name": "Score Master",
      "description": "Reach 50,000 points",
      "trigger": "onScoreReached",
      "triggerValue": 50000,
      "soulbound": true,
      "metadata": {
        "image": "ipfs://QmScoreMasterImage",
        "attributes": [
          { "trait_type": "Achievement", "value": "Score Master" },
          { "trait_type": "Game", "value": "Your Game Name" },
          { "trait_type": "Rarity", "value": "Rare" }
        ]
      },
      "dynamicStateUpdates": {
        "achievements/score_master": "{timestamp}",
        "games/{gameId}/high_score": "{score}"
      }
    }
  ]
}
```

---

## Part 4: DemiurgeIntegration.js (The Core Integration File)

Create this file in your game folder:

```javascript
/**
 * DemiurgeIntegration.js
 * 
 * Handles all DRC-369 NFT and blockchain integration for your game.
 * Copy this file and customize for your game's needs.
 */

class DemiurgeIntegration {
  constructor(gameId, options = {}) {
    this.gameId = gameId;
    this.isConnected = false;
    this.userAddress = null;
    this.qorId = null;
    this.userNFT = null;  // The user's main achievement NFT
    this.unlockedAssets = {};
    this.assetConfig = null;
    
    // Callbacks
    this.onConnectionChange = options.onConnectionChange || (() => {});
    this.onAssetsLoaded = options.onAssetsLoaded || (() => {});
    this.onAchievementMinted = options.onAchievementMinted || (() => {});
    
    // Check if running in Demiurge Hub
    this.hubAvailable = typeof window !== 'undefined' && window.DemiurgeHUD;
    
    // Mock mode for development
    this.mockMode = options.mockMode || !this.hubAvailable;
    
    if (this.mockMode) {
      console.log('[Demiurge] Running in mock mode - NFT features simulated');
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Initialize the integration
   * Call this when your game starts
   */
  async initialize() {
    // Load asset configuration
    try {
      const response = await fetch('assets/data/nft_assets.json');
      this.assetConfig = await response.json();
      console.log('[Demiurge] Asset config loaded:', this.assetConfig.nftUnlocks.length, 'unlockables');
    } catch (error) {
      console.warn('[Demiurge] Could not load asset config:', error);
      this.assetConfig = { assetClasses: {}, nftUnlocks: [], mintableAchievements: [] };
    }

    // Auto-connect if in Hub
    if (this.hubAvailable) {
      await this.connect();
    }

    return this;
  }

  /**
   * Connect to user's wallet and load their NFT data
   */
  async connect() {
    if (this.mockMode) {
      // Simulate connection
      this.isConnected = true;
      this.userAddress = 'mock_address_' + Math.random().toString(36).substr(2, 9);
      this.qorId = 'MockUser#0001';
      this.userNFT = this._createMockNFT();
      await this._processNFTUnlocks();
      this.onConnectionChange(true);
      return true;
    }

    try {
      // Get user info from DemiurgeHUD
      this.qorId = await window.DemiurgeHUD.getQORID();
      this.userAddress = await window.DemiurgeHUD.getWalletAddress();
      
      // Load user's achievement NFT (or create tracking if none exists)
      this.userNFT = await this._loadUserNFT();
      
      this.isConnected = true;
      
      // Process what assets are unlocked
      await this._processNFTUnlocks();
      
      this.onConnectionChange(true);
      return true;
    } catch (error) {
      console.error('[Demiurge] Connection failed:', error);
      this.isConnected = false;
      this.onConnectionChange(false);
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ASSET UNLOCKING (Reading NFT State)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get the asset to use for a given class
   * Returns the best unlocked asset or the default
   * 
   * @example
   * const skinPath = demiurge.getAsset('player_skin');
   * player.setSprite(skinPath);
   */
  getAsset(assetClass) {
    // Check if we have an unlocked asset for this class
    if (this.unlockedAssets[assetClass]) {
      return this.unlockedAssets[assetClass];
    }
    
    // Return default
    if (this.assetConfig?.assetClasses?.[assetClass]) {
      return this.assetConfig.assetClasses[assetClass].default;
    }
    
    return null;
  }

  /**
   * Check if a specific unlock is active
   * 
   * @example
   * if (demiurge.hasUnlock('gold_pioneer')) {
   *   showGoldBadge();
   * }
   */
  hasUnlock(unlockId) {
    return this.unlockedAssets._unlockIds?.includes(unlockId) || false;
  }

  /**
   * Get all active unlocks
   */
  getActiveUnlocks() {
    return this.unlockedAssets._unlockIds || [];
  }

  /**
   * Process NFT data to determine unlocked assets
   * Called automatically on connect
   */
  async _processNFTUnlocks() {
    if (!this.assetConfig?.nftUnlocks) return;

    this.unlockedAssets = { _unlockIds: [] };

    for (const unlock of this.assetConfig.nftUnlocks) {
      const isUnlocked = await this._checkUnlockCondition(unlock.conditions);
      
      if (isUnlocked) {
        console.log('[Demiurge] Unlocked:', unlock.name);
        this.unlockedAssets._unlockIds.push(unlock.id);
        
        // Apply unlocked assets (later unlocks override earlier)
        for (const [assetClass, assetValue] of Object.entries(unlock.unlocks)) {
          this.unlockedAssets[assetClass] = assetValue;
        }
      }
    }

    this.onAssetsLoaded(this.unlockedAssets);
  }

  /**
   * Check if an unlock condition is met
   */
  async _checkUnlockCondition(condition) {
    if (!this.userNFT) return false;

    switch (condition.type) {
      case 'ownership':
        // Check if user has a specific achievement
        if (condition.check === 'hasAchievement') {
          const value = await this.getNFTState(condition.achievementKey);
          return value !== null && value !== '';
        }
        break;

      case 'dynamicState':
        const stateValue = await this.getNFTState(condition.path);
        if (stateValue === null) return false;

        if (condition.check === 'valueGreaterThan') {
          return parseFloat(stateValue) > condition.threshold;
        }
        if (condition.check === 'valueEquals') {
          return stateValue === condition.value;
        }
        if (condition.check === 'exists') {
          return true;
        }
        break;
    }

    return false;
  }

  // ═══════════════════════════════════════════════════════════════
  // NFT STATE READING
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get a value from the user's NFT dynamic state
   * 
   * @example
   * const highScore = await demiurge.getNFTState('games/my-game/high_score');
   * const level = await demiurge.getNFTState('stats/level');
   */
  async getNFTState(path) {
    if (this.mockMode) {
      return this.userNFT?.dynamicState?.[path] || null;
    }

    if (!this.userNFT?.tokenId) return null;

    try {
      return await window.DemiurgeHUD.getNFTState(this.userNFT.tokenId, path);
    } catch (error) {
      console.warn('[Demiurge] Failed to get NFT state:', path, error);
      return null;
    }
  }

  /**
   * Get multiple state values efficiently
   * 
   * @example
   * const stats = await demiurge.getNFTStateBatch([
   *   'stats/xp',
   *   'stats/level',
   *   'games/my-game/high_score'
   * ]);
   */
  async getNFTStateBatch(paths) {
    if (this.mockMode) {
      return paths.map(path => ({
        path,
        value: this.userNFT?.dynamicState?.[path] || null
      }));
    }

    if (!this.userNFT?.tokenId) {
      return paths.map(path => ({ path, value: null }));
    }

    try {
      return await window.DemiurgeHUD.getNFTStateBatch(this.userNFT.tokenId, paths);
    } catch (error) {
      console.warn('[Demiurge] Failed to get NFT state batch:', error);
      return paths.map(path => ({ path, value: null }));
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ACHIEVEMENT MINTING (Writing to Chain)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Award an achievement - mints/updates NFT on chain
   * 
   * @example
   * // When player wins for the first time
   * await demiurge.awardAchievement('first_victory', { score: 12500 });
   */
  async awardAchievement(achievementId, context = {}) {
    const achievement = this.assetConfig?.mintableAchievements?.find(
      a => a.id === achievementId
    );

    if (!achievement) {
      console.warn('[Demiurge] Unknown achievement:', achievementId);
      return { success: false, error: 'Unknown achievement' };
    }

    // Check if already awarded
    const existingPath = `achievements/${achievementId}`;
    const existing = await this.getNFTState(existingPath);
    if (existing) {
      console.log('[Demiurge] Achievement already awarded:', achievementId);
      return { success: false, error: 'Already awarded', alreadyAwarded: true };
    }

    if (this.mockMode) {
      console.log('[Demiurge] [MOCK] Would mint achievement:', achievement.name);
      
      // Update mock state
      const timestamp = Math.floor(Date.now() / 1000);
      this.userNFT.dynamicState[existingPath] = timestamp.toString();
      
      // Process state updates
      for (const [key, value] of Object.entries(achievement.dynamicStateUpdates || {})) {
        const processedKey = key.replace('{gameId}', this.gameId);
        let processedValue = value
          .replace('{timestamp}', timestamp.toString())
          .replace('{score}', context.score?.toString() || '0');
        
        if (processedValue.startsWith('+')) {
          const current = parseInt(this.userNFT.dynamicState[processedKey] || '0');
          processedValue = (current + parseInt(processedValue)).toString();
        }
        
        this.userNFT.dynamicState[processedKey] = processedValue;
      }

      this.onAchievementMinted(achievement);
      
      // Re-process unlocks in case this achievement unlocks something
      await this._processNFTUnlocks();

      return { 
        success: true, 
        mock: true,
        achievement: achievement,
        message: `Achievement "${achievement.name}" awarded (mock mode)`
      };
    }

    try {
      // Call the Demiurge Hub to mint the achievement
      const result = await window.DemiurgeHUD.mintAchievement({
        achievementId,
        gameId: this.gameId,
        name: achievement.name,
        description: achievement.description,
        soulbound: achievement.soulbound !== false, // Default to soulbound
        metadata: achievement.metadata,
        dynamicStateUpdates: this._processStateUpdates(achievement.dynamicStateUpdates, context),
      });

      if (result.success) {
        this.onAchievementMinted(achievement);
        
        // Re-process unlocks
        await this._processNFTUnlocks();
      }

      return result;
    } catch (error) {
      console.error('[Demiurge] Failed to mint achievement:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update game-specific state on the NFT
   * 
   * @example
   * // Save high score
   * await demiurge.updateGameState('high_score', 75000);
   */
  async updateGameState(key, value) {
    const path = `games/${this.gameId}/${key}`;
    
    if (this.mockMode) {
      this.userNFT.dynamicState[path] = value.toString();
      console.log('[Demiurge] [MOCK] Updated state:', path, '=', value);
      return { success: true, mock: true };
    }

    try {
      return await window.DemiurgeHUD.setNFTState(this.userNFT.tokenId, path, value.toString());
    } catch (error) {
      console.error('[Demiurge] Failed to update game state:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Increment a stat (useful for counters)
   * 
   * @example
   * await demiurge.incrementStat('stats/games_played');
   */
  async incrementStat(path, amount = 1) {
    const current = parseInt(await this.getNFTState(path) || '0');
    const newValue = current + amount;
    
    if (this.mockMode) {
      this.userNFT.dynamicState[path] = newValue.toString();
      return { success: true, newValue };
    }

    try {
      await window.DemiurgeHUD.setNFTState(this.userNFT.tokenId, path, newValue.toString());
      return { success: true, newValue };
    } catch (error) {
      console.error('[Demiurge] Failed to increment stat:', error);
      return { success: false, error: error.message };
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // CROSS-GAME INTEROPERABILITY
  // ═══════════════════════════════════════════════════════════════

  /**
   * Check if player has achieved something in another game
   * This is the key to interoperability!
   * 
   * @example
   * // Check if player mastered Cosmic Runner
   * const cosmicMaster = await demiurge.getOtherGameState('cosmic-runner', 'high_score');
   * if (cosmicMaster > 100000) {
   *   unlockSpecialSkin();
   * }
   */
  async getOtherGameState(gameId, key) {
    const path = `games/${gameId}/${key}`;
    return this.getNFTState(path);
  }

  /**
   * Get player's global stats (shared across all games)
   * 
   * @example
   * const playerLevel = await demiurge.getGlobalStat('level');
   * const totalXP = await demiurge.getGlobalStat('xp');
   */
  async getGlobalStat(statName) {
    return this.getNFTState(`stats/${statName}`);
  }

  /**
   * Add XP to the player (updates global level)
   */
  async addXP(amount) {
    return this.incrementStat('stats/xp', amount);
  }

  // ═══════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════

  async _loadUserNFT() {
    // In real implementation, this finds or creates the user's achievement NFT
    try {
      const nft = await window.DemiurgeHUD.getUserAchievementNFT();
      return nft;
    } catch (error) {
      console.warn('[Demiurge] Could not load user NFT:', error);
      return null;
    }
  }

  _createMockNFT() {
    return {
      tokenId: 'mock-nft-' + Date.now(),
      owner: this.userAddress,
      isSoulbound: true,
      dynamicState: {
        'stats/xp': '500',
        'stats/level': '2',
        'stats/games_played': '5',
        'achievements/early_adopter': '1706745600', // Already has this achievement
      }
    };
  }

  _processStateUpdates(updates, context) {
    if (!updates) return {};
    
    const processed = {};
    const timestamp = Math.floor(Date.now() / 1000);
    
    for (const [key, value] of Object.entries(updates)) {
      const processedKey = key.replace('{gameId}', this.gameId);
      const processedValue = value
        .replace('{timestamp}', timestamp.toString())
        .replace('{score}', context.score?.toString() || '0');
      processed[processedKey] = processedValue;
    }
    
    return processed;
  }

  /**
   * Disconnect from wallet
   */
  disconnect() {
    this.isConnected = false;
    this.userAddress = null;
    this.qorId = null;
    this.userNFT = null;
    this.unlockedAssets = {};
    this.onConnectionChange(false);
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DemiurgeIntegration;
}
if (typeof window !== 'undefined') {
  window.DemiurgeIntegration = DemiurgeIntegration;
}
```

---

## Part 5: Game Implementation Example

Here's how to use the integration in your game:

```javascript
// game.js

// Initialize Demiurge integration
const demiurge = new DemiurgeIntegration('your-game-id', {
  mockMode: false, // Set true for local development
  
  onConnectionChange: (connected) => {
    if (connected) {
      console.log('Connected as:', demiurge.qorId);
      loadPlayerAssets();
    } else {
      useDefaultAssets();
    }
  },
  
  onAssetsLoaded: (assets) => {
    console.log('Unlocked assets:', assets);
    applyUnlockedSkins();
  },
  
  onAchievementMinted: (achievement) => {
    showAchievementPopup(achievement.name, achievement.description);
  }
});

// Start the integration
await demiurge.initialize();

// ══════════════════════════════════════════════════════════════════
// LOADING ASSETS BASED ON NFT OWNERSHIP
// ══════════════════════════════════════════════════════════════════

function loadPlayerAssets() {
  // Get the best skin the player has unlocked
  const skinPath = demiurge.getAsset('player_skin');
  if (skinPath) {
    player.loadSprite(skinPath);
  }

  // Get powerup boost (returns number or default)
  const boost = demiurge.getAsset('powerup_boost') || 1.0;
  player.setBoostMultiplier(boost);

  // Check for specific unlocks
  if (demiurge.hasUnlock('gold_pioneer')) {
    showGoldBadgeNextToName();
  }
}

// ══════════════════════════════════════════════════════════════════
// CROSS-GAME UNLOCKS (INTEROPERABILITY)
// ══════════════════════════════════════════════════════════════════

async function checkCrossGameUnlocks() {
  // Player who mastered "Cosmic Runner" gets a special item in THIS game
  const cosmicScore = await demiurge.getOtherGameState('cosmic-runner', 'high_score');
  if (cosmicScore && parseInt(cosmicScore) > 100000) {
    unlockCosmicPowerup(); // This game rewards skill from another game!
  }

  // Check global player level for difficulty scaling
  const playerLevel = await demiurge.getGlobalStat('level');
  if (playerLevel && parseInt(playerLevel) > 10) {
    enableHardModeOption();
  }
}

// ══════════════════════════════════════════════════════════════════
// AWARDING ACHIEVEMENTS (MINTING NFTs)
// ══════════════════════════════════════════════════════════════════

async function onGameWin(score) {
  // Track the win
  await demiurge.incrementStat('stats/games_played');
  
  // Update high score if needed
  const currentHigh = parseInt(await demiurge.getNFTState(`games/${demiurge.gameId}/high_score`) || '0');
  if (score > currentHigh) {
    await demiurge.updateGameState('high_score', score);
  }

  // Award first victory achievement (mints soulbound NFT!)
  const firstWin = await demiurge.awardAchievement('first_victory', { score });
  if (firstWin.success && !firstWin.alreadyAwarded) {
    showBigCelebration('🏆 FIRST VICTORY!');
  }

  // Check for score milestones
  if (score >= 50000) {
    await demiurge.awardAchievement('score_master', { score });
  }

  // Add XP based on score
  await demiurge.addXP(Math.floor(score / 100));
}

// ══════════════════════════════════════════════════════════════════
// READING PLAYER STATS FOR PERSONALIZATION
// ══════════════════════════════════════════════════════════════════

async function showPlayerStats() {
  const stats = await demiurge.getNFTStateBatch([
    'stats/xp',
    'stats/level',
    'stats/games_played',
    `games/${demiurge.gameId}/high_score`
  ]);

  ui.showStats({
    xp: stats[0].value || 0,
    level: stats[1].value || 1,
    gamesPlayed: stats[2].value || 0,
    highScore: stats[3].value || 0
  });
}
```

---

## Part 6: Visual Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                         GAME START                                  │
└────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌──────────────────────┐
                    │  demiurge.initialize()│
                    └──────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
          ┌─────────────────┐     ┌─────────────────┐
          │ Load nft_assets │     │  Connect Wallet │
          │     .json       │     │  (if in Hub)    │
          └─────────────────┘     └─────────────────┘
                    │                       │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌──────────────────────┐
                    │  Load User's NFT     │
                    │  Achievement Token   │
                    └──────────────────────┘
                                │
                                ▼
                    ┌──────────────────────┐
                    │  Read Dynamic State  │
                    │  - achievements/*    │
                    │  - stats/*           │
                    │  - games/other-game/*│
                    └──────────────────────┘
                                │
                                ▼
                    ┌──────────────────────┐
                    │  Process Unlocks     │
                    │  (check conditions)  │
                    └──────────────────────┘
                                │
                                ▼
                    ┌──────────────────────┐
                    │  onAssetsLoaded()    │
                    │  Apply skins, boosts │
                    └──────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                        GAMEPLAY                                     │
│                                                                     │
│   Player completes objective → awardAchievement('milestone')        │
│                                    │                                │
│                                    ▼                                │
│                         ┌──────────────────┐                        │
│                         │ Mint Soulbound   │                        │
│                         │ Achievement NFT  │                        │
│                         └──────────────────┘                        │
│                                    │                                │
│                                    ▼                                │
│                         ┌──────────────────┐                        │
│                         │ Update Dynamic   │                        │
│                         │ State On-Chain   │                        │
│                         └──────────────────┘                        │
│                                    │                                │
│                                    ▼                                │
│                         ┌──────────────────┐                        │
│                         │ Re-check Unlocks │                        │
│                         │ (new skins?)     │                        │
│                         └──────────────────┘                        │
└────────────────────────────────────────────────────────────────────┘
```

---

## Part 7: Interoperability Demo

### How Game A Unlocks Content in Game B

**Cosmic Runner** (Game A) stores high scores:
```javascript
// In Cosmic Runner, when game ends:
await demiurge.updateGameState('high_score', 150000);
// This writes: games/cosmic-runner/high_score = "150000"
```

**Your Game** (Game B) reads it and unlocks content:
```javascript
// In Your Game's nft_assets.json:
{
  "id": "cosmic_runner_master",
  "conditions": {
    "type": "dynamicState",
    "check": "valueGreaterThan",
    "path": "games/cosmic-runner/high_score",  // Reading OTHER game's data!
    "threshold": 100000
  },
  "unlocks": {
    "player_skin": "sprites/player_cosmic.png"
  }
}
```

**Result**: Players who master Cosmic Runner automatically unlock a special skin in Your Game!

---

## Summary Checklist

Before adding your game to the repo:

- [ ] Create `assets/data/nft_assets.json` with your unlockables and achievements
- [ ] Copy `DemiurgeIntegration.js` to your game folder
- [ ] Add asset files for NFT unlocks (skins, effects, etc.)
- [ ] Implement `onAssetsLoaded` to apply unlocked content
- [ ] Call `awardAchievement()` at appropriate milestones
- [ ] Test in mock mode first, then in Demiurge Hub

---

## Ready to Add Your Game

Once you add your game to `apps/games/YOUR_GAME/`, I will:

1. Register it in the game registry with DRC-369 support
2. Connect the Hub's DemiurgeHUD API to your integration
3. Set up the achievement NFT minting endpoint
4. Deploy and test on-chain
