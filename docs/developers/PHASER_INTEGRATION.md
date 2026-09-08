# DRC-SDK: Phaser.js Integration Guide

**Build blockchain-connected browser games with Phaser 3.80+**

> *"The Pleroma manifests in the browser. In Phaser, your scenes become windows to the divine."*

Integrate your Phaser.js game with the Demiurge blockchain to enable CGT rewards, DRC-369 NFTs, and on-chain gameplay.

---

## Overview

Phaser runs natively in the browser, giving you direct access to Web3 wallets like MetaMask. The DRC-SDK Phaser Plugin provides a seamless bridge between your game scenes and the Demiurge blockchain.

### Features

- **Native Web3 Integration**: Direct MetaMask/wallet connection
- **Global Plugin Pattern**: Access `this.demiurge` from any Scene
- **Async Asset Loading**: Load NFT textures at runtime
- **Event-Driven**: Subscribe to blockchain events

### Requirements

- Phaser 3.70+ (or 3.80+)
- Modern browser with ES6 support
- MetaMask or compatible Web3 wallet (for production)

## Quick Start

### 1. Add the HUD Script

Include the Demiurge HUD in your `index.html`:

```html
<script src="/inject-hud.js"></script>
<script type="module" src="main.js"></script>
```

Or load it dynamically:

```javascript
// Fallback for standalone mode
const script = document.createElement('script');
script.src = '/inject-hud.js';
script.onerror = () => {
  window.DemiurgeHUD = { init: () => {}, update: () => {}, isAvailable: false };
};
document.head.appendChild(script);
```

### 2. Initialize the HUD

In your game's boot scene:

```javascript
class BootScene extends Phaser.Scene {
  create() {
    if (window.DemiurgeHUD?.isAvailable) {
      window.DemiurgeHUD.init({
        position: 'top-right',
        onEarn: (amount) => {
          console.log(`Earned ${amount} CGT!`);
        }
      });
    }
    
    this.scene.start('GameScene');
  }
}
```

### 3. Award CGT to Players

When players achieve something reward-worthy:

```javascript
// In your game logic
function onEnemyKilled(enemy) {
  const cgtReward = enemy.isBoss ? 50 : 1;
  
  if (window.DemiurgeHUD?.isAvailable) {
    window.DemiurgeHUD.earnCGT(cgtReward, 'enemy_kill');
  }
  
  // Update local score
  this.score += cgtReward;
  this.updateScoreDisplay();
}
```

## Full Integration Example

### Project Structure

```
my-phaser-game/
├── index.html
├── main.js
├── config.js
├── scenes/
│   ├── BootScene.js
│   ├── MenuScene.js
│   └── GameScene.js
├── entities/
│   └── Player.js
└── assets/
    └── ...
```

### index.html

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Phaser Game</title>
  <script type="importmap">
    {
      "imports": {
        "phaser": "https://esm.sh/phaser@3.70.0"
      }
    }
  </script>
  <style>
    html, body { margin: 0; padding: 0; background: black; }
    #game-container { width: 100%; height: 100vh; }
  </style>
</head>
<body>
  <div id="game-container"></div>
  <script src="/inject-hud.js"></script>
  <script type="module" src="main.js"></script>
</body>
</html>
```

### main.js

```javascript
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1920,
  height: 1080,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scene: [BootScene, MenuScene, GameScene]
};

new Phaser.Game(config);
```

### scenes/GameScene.js

```javascript
import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.score = 0;
    this.cgtEarned = 0;
  }

  create() {
    // Set up game world
    this.player = this.physics.add.sprite(400, 300, 'player');
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Connect to blockchain (non-blocking)
    this.initBlockchain();
    
    // UI
    this.scoreText = this.add.text(20, 20, 'Score: 0', { fontSize: '32px' });
    this.cgtText = this.add.text(20, 60, 'CGT: 0', { fontSize: '32px', color: '#00ff00' });
  }

  async initBlockchain() {
    if (window.DemiurgeHUD?.isAvailable) {
      // Load player's balance
      const balance = await window.DemiurgeHUD.getBalance();
      this.cgtText.setText(`CGT: ${balance}`);
      
      // Load player's NFT assets
      const assets = await window.DemiurgeHUD.getAssets('ship_skin');
      if (assets.length > 0) {
        this.applyPlayerSkin(assets[0]);
      }
    }
  }

  update() {
    // Player movement
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-300);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(300);
    } else {
      this.player.setVelocityX(0);
    }
  }

  awardCGT(amount, reason) {
    this.cgtEarned += amount;
    
    if (window.DemiurgeHUD?.isAvailable) {
      window.DemiurgeHUD.earnCGT(amount, reason);
    }
    
    this.cgtText.setText(`CGT: ${this.cgtEarned}`);
    
    // Visual feedback
    const popup = this.add.text(this.player.x, this.player.y - 50, `+${amount} CGT`, {
      fontSize: '24px',
      color: '#00ff00'
    });
    
    this.tweens.add({
      targets: popup,
      y: popup.y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => popup.destroy()
    });
  }

  applyPlayerSkin(asset) {
    // Apply DRC-369 NFT skin to player
    if (asset.metadata?.image) {
      this.textures.addBase64(asset.id, asset.metadata.image);
      this.player.setTexture(asset.id);
    }
  }
}
```

## HUD API Reference

### DemiurgeHUD.init(options)

Initialize the HUD overlay.

```javascript
DemiurgeHUD.init({
  position: 'top-right',  // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
  compact: false,         // Use compact mode
  onEarn: (amount) => {}, // Callback when CGT is earned
  onSpend: (amount) => {},// Callback when CGT is spent
  onAssets: () => {}      // Callback when viewing assets
});
```

### DemiurgeHUD.earnCGT(amount, reason)

Award CGT to the player.

```javascript
DemiurgeHUD.earnCGT(10, 'boss_defeat');
DemiurgeHUD.earnCGT(1, 'coin_collect');
```

### DemiurgeHUD.getBalance()

Get player's CGT balance.

```javascript
const balance = await DemiurgeHUD.getBalance();
console.log(`Player has ${balance} CGT`);
```

### DemiurgeHUD.getAssets(type)

Get player's DRC-369 assets.

```javascript
const skins = await DemiurgeHUD.getAssets('ship_skin');
const weapons = await DemiurgeHUD.getAssets('weapon');
```

### DemiurgeHUD.update(data)

Update HUD display.

```javascript
DemiurgeHUD.update({
  balance: '1500',
  energy: { current: 80, max: 100, percentage: 80 }
});
```

## Best Practices

### Performance
- Load blockchain data asynchronously (don't block game start)
- Cache asset data locally
- Batch CGT awards (don't call for every small action)

### User Experience
- Show loading states while fetching blockchain data
- Provide visual feedback for CGT earnings
- Support offline/standalone mode

### Error Handling
```javascript
try {
  await DemiurgeHUD.earnCGT(amount, reason);
} catch (err) {
  console.warn('CGT award failed:', err);
  // Game continues normally
}
```

## Testing

### Local Development
Run your game locally and it will work in standalone mode:

```bash
npx serve .
# Open http://localhost:3000
```

### With Demiurge HUD
Test with the HUD by accessing through the Demiurge hub:

```
https://demiurge.cloud/play/your-game-id
```

## Submission Checklist

- [ ] Game loads without errors
- [ ] HUD integration works (or graceful fallback)
- [ ] CGT rewards are balanced
- [ ] Assets load from local paths (not external CDNs)
- [ ] Responsive scaling works
- [ ] Keyboard/mouse input works in iframe

---

## DRC-SDK Plugin (Advanced)

For more control, use the full DRC-SDK Plugin instead of the HUD script.

### Create the Plugin

**src/plugins/DemiurgePlugin.js**

```javascript
import Phaser from 'phaser';

export default class DemiurgePlugin extends Phaser.Plugins.BasePlugin {
    constructor(pluginManager) {
        super(pluginManager);
        this.rpcUrl = "https://rpc.demiurge.cloud";
        this.oracleUrl = "https://api.yourgame.com";
        this.walletAddress = null;
        this.cachedBalance = { sparks: 0, cgt: 0 };
        this.cachedAssets = [];
    }

    start() {
        this.events = new Phaser.Events.EventEmitter();
    }

    /**
     * Connect MetaMask wallet
     */
    async connectWallet() {
        if (typeof window.ethereum === 'undefined') {
            console.warn("[Demiurge] No wallet found. Install MetaMask.");
            this.events.emit('WALLET_ERROR', 'No wallet found');
            return null;
        }

        try {
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            this.walletAddress = accounts[0];
            console.log(`[Demiurge] Connected: ${this.walletAddress}`);
            
            this.events.emit('WALLET_CONNECTED', this.walletAddress);
            await this.fetchBalances();
            
            return this.walletAddress;
        } catch (error) {
            console.error("[Demiurge] Connection rejected:", error);
            this.events.emit('WALLET_ERROR', error.message);
            return null;
        }
    }

    /**
     * Fetch CGT/Sparks balance
     */
    async fetchBalances() {
        if (!this.walletAddress) return null;

        const payload = {
            jsonrpc: "2.0",
            method: "balances_getBalance",
            params: [this.walletAddress],
            id: Math.floor(Math.random() * 1000000)
        };

        try {
            const response = await fetch(this.rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            
            if (data.result) {
                const sparks = parseInt(data.result.free || "0");
                this.cachedBalance = {
                    sparks,
                    cgt: sparks / 100 // 100 Sparks = 1 CGT
                };
                this.events.emit('BALANCES_UPDATED', this.cachedBalance);
            }
            
            return this.cachedBalance;
        } catch (err) {
            console.error("[Demiurge] Balance error:", err);
            return null;
        }
    }

    /**
     * Fetch owned DRC-369 assets
     */
    async fetchAssets() {
        if (!this.walletAddress) return [];

        const payload = {
            jsonrpc: "2.0",
            method: "drc369_getAssetsByOwner",
            params: [this.walletAddress],
            id: Math.floor(Math.random() * 1000000)
        };

        try {
            const response = await fetch(this.rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            this.cachedAssets = data.result?.assets || [];
            this.events.emit('ASSETS_LOADED', this.cachedAssets);
            
            return this.cachedAssets;
        } catch (err) {
            console.error("[Demiurge] Assets error:", err);
            return [];
        }
    }

    /**
     * Record gameplay action (Oracle validated)
     */
    async recordAction(actionId, difficulty = 0, metadata = {}) {
        if (!this.walletAddress) {
            console.warn("[Demiurge] No wallet connected");
            return { success: false };
        }

        console.log(`[Demiurge] Recording: ${actionId}`);

        try {
            const response = await fetch(`${this.oracleUrl}/api/record-action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player_address: this.walletAddress,
                    action: actionId,
                    difficulty,
                    timestamp: new Date().toISOString(),
                    metadata
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.events.emit('ACTION_SUCCESS', { actionId, reward: result.reward_amount });
                await this.fetchBalances(); // Refresh balance
            } else {
                this.events.emit('ACTION_FAILED', { actionId, error: result.error });
            }
            
            return result;
        } catch (err) {
            console.error("[Demiurge] Action error:", err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Load NFT texture into Phaser
     */
    loadNFTTexture(key, url) {
        const loader = this.pluginManager.game.load;
        loader.crossOrigin = 'anonymous';
        loader.image(key, url);
        
        loader.once(`filecomplete-image-${key}`, () => {
            console.log(`[Demiurge] Texture loaded: ${key}`);
            this.events.emit('NFT_LOADED', key);
        });

        loader.start();
    }

    /**
     * Get resource URL for context
     */
    getResourceForContext(asset, context = 'game') {
        if (!asset?.resources) return null;
        
        let best = null;
        let bestPriority = -1;
        
        for (const res of asset.resources) {
            if (res.context?.includes(context) && (res.priority || 0) > bestPriority) {
                best = res;
                bestPriority = res.priority || 0;
            }
        }
        
        return best?.uri || null;
    }
}
```

### Register the Plugin

**src/main.js**

```javascript
import Phaser from 'phaser';
import DemiurgePlugin from './plugins/DemiurgePlugin';
import GameScene from './scenes/GameScene';
import UIScene from './scenes/UIScene';

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    scene: [GameScene, UIScene],
    plugins: {
        global: [
            {
                key: 'Demiurge',
                plugin: DemiurgePlugin,
                start: true,
                mapping: 'demiurge' // Access as this.demiurge
            }
        ]
    }
};

new Phaser.Game(config);
```

### Use in Scenes

**src/scenes/GameScene.js**

```javascript
export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        // Subscribe to Demiurge events
        this.demiurge.events.on('BALANCES_UPDATED', (balance) => {
            this.updateBalanceUI(balance);
        });

        this.demiurge.events.on('ACTION_SUCCESS', ({ actionId, reward }) => {
            this.showRewardPopup(reward);
        });

        // Connect wallet on start
        this.demiurge.connectWallet();

        // Create game objects
        this.createPlayer();
        this.createEnemies();
    }

    onEnemyKilled(enemy) {
        // Record action
        this.demiurge.recordAction('kill_enemy', enemy.difficulty, {
            enemy_type: enemy.type
        });

        // Show optimistic feedback
        this.showFloatingText('+10 Sparks', enemy.x, enemy.y);
    }

    async loadPlayerSkin() {
        const assets = await this.demiurge.fetchAssets();
        const skin = assets.find(a => a.name.includes('skin'));
        
        if (skin) {
            const url = this.demiurge.getResourceForContext(skin, 'game');
            if (url) {
                this.demiurge.loadNFTTexture('player_skin', url);
                
                this.demiurge.events.once('NFT_LOADED', (key) => {
                    if (key === 'player_skin') {
                        this.player.setTexture('player_skin');
                    }
                });
            }
        }
    }
}
```

---

## Economy Strategy

### Soft Currency (Sparks) - Optimistic UI

For high-frequency rewards:

```javascript
// Track pending sparks locally
let pendingSparks = 0;

function onCoinCollect() {
    pendingSparks += 1;
    updateUI(pendingSparks); // Instant feedback
}

// Batch sync every 30 seconds
setInterval(() => {
    if (pendingSparks > 0) {
        this.demiurge.recordAction('batch_collect', 0, { amount: pendingSparks });
        pendingSparks = 0;
    }
}, 30000);
```

### Hard Currency (CGT) - Verified

For significant transactions, always wait for confirmation:

```javascript
async function purchaseItem(itemId) {
    const result = await this.demiurge.recordAction('purchase', 0, { item_id: itemId });
    
    if (result.success) {
        grantItem(itemId);
    } else {
        showError('Purchase failed');
    }
}
```

---

## Security Considerations

### CORS

Your Oracle backend must allow cross-origin requests:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Client-Side Cheating

Browser games are vulnerable to inspection. **Never**:
- Trust client-reported scores
- Mint rewards directly from client
- Store private keys in JavaScript

**Always**:
- Validate actions server-side (Oracle)
- Use session tokens for authentication
- Rate limit API calls

---

## Support

- **Examples**: See `/games/galaga-creator/` for a complete example
- **Discord**: [discord.gg/demiurge](https://discord.gg/demiurge)
- **Documentation**: [docs.demiurge.cloud](https://docs.demiurge.cloud)
- **DRC-SDK Overview**: [DRC_SDK.md](./DRC_SDK.md)
- **Oracle Backend**: [ORACLE_BACKEND.md](./drc-sdk/ORACLE_BACKEND.md)

---

**The Pleroma manifests in the browser. The code serves the will.**

---

*Last Updated: January 26, 2026*  
*Document Version: 2.0 (DRC-SDK Integration)*  
*Maintainer: Alaustrup*
