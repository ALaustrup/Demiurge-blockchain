# DRC-SDK: Oracle Backend Implementation Guide

**The Secure Core for Game-to-Blockchain Communication**

> *"The Archons guard the gates between realms. Your Oracle guards the gates between game and chain."*

---

## Overview

The **Oracle Backend** is the critical security layer that connects your game clients to the Demiurge Blockchain. It serves as the trusted intermediary that:

1. **Validates gameplay actions** (anti-cheat)
2. **Signs and submits transactions** (security)
3. **Mints rewards** (CGT/Sparks, XP, items)
4. **Manages session keys** (seamless UX)

### Why You Need an Oracle

| Without Oracle (INSECURE) | With Oracle (SECURE) |
|---------------------------|----------------------|
| Private keys in game client | Private keys on secure server |
| Players can fake kills/rewards | Server validates game state |
| Easy to exploit with memory hacks | All rewards verified server-side |
| Blockchain calls from untrusted code | Only server signs transactions |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GAME CLIENT                                        │
│                     (UE5 / Unity / Godot / Phaser)                          │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ 1. Player kills boss                                                    │ │
│  │ 2. Client sends: { action: "kill_boss", difficulty: 100, ... }          │ │
│  │ 3. Client shows: "+50 CGT" (optimistic UI)                              │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────┬────────────────────────────────────┘
                                         │ HTTPS POST
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ORACLE BACKEND                                     │
│                      (Node.js / Python / Rust)                              │
│                                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                │
│  │ 1. Validate    │  │ 2. Calculate   │  │ 3. Sign & Send │                │
│  │    JWT/Session │──│    Rewards     │──│    Transaction │                │
│  │    Is real?    │  │    Based on    │  │    To chain    │                │
│  │                │  │    difficulty  │  │                │                │
│  └────────────────┘  └────────────────┘  └────────────────┘                │
│                                                                              │
│  🔐 PRIVATE KEY: Stored in env vars / HSM / secrets manager                │
└────────────────────────────────────────┬────────────────────────────────────┘
                                         │ Signed Transaction
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEMIURGE BLOCKCHAIN                                  │
│                      https://rpc.demiurge.cloud                             │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                      │
│  │  pallet-cgt  │  │pallet-drc369 │  │pallet-energy │                      │
│  │   mint()     │  │ add_xp()     │  │  consume()   │                      │
│  └──────────────┘  └──────────────┘  └──────────────┘                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Options

### Option 1: Node.js (Recommended for Web Games)

**Stack**: Node.js 20+, Express, ethers.js/polkadot.js

### Option 2: Python (Recommended for ML/AI Games)

**Stack**: Python 3.11+, FastAPI, web3.py/substrateinterface

### Option 3: Rust (Recommended for High-Performance)

**Stack**: Rust 2024, Axum, subxt

---

## Node.js Implementation

### Project Setup

```bash
mkdir oracle-server
cd oracle-server
npm init -y
npm install express dotenv @polkadot/api @polkadot/keyring jsonwebtoken cors helmet
```

### Project Structure

```
oracle-server/
├── src/
│   ├── index.js          # Entry point
│   ├── config.js         # Configuration
│   ├── routes/
│   │   ├── actions.js    # Gameplay actions
│   │   └── assets.js     # DRC-369 operations
│   ├── services/
│   │   ├── blockchain.js # Chain interaction
│   │   └── rewards.js    # Reward calculation
│   └── middleware/
│       ├── auth.js       # JWT validation
│       └── rateLimit.js  # Rate limiting
├── .env                   # Environment variables
├── .env.example
└── package.json
```

### Configuration

#### .env

```bash
# Server
PORT=3000
NODE_ENV=production

# Blockchain
RPC_URL=https://rpc.demiurge.cloud
WSS_URL=wss://rpc.demiurge.cloud

# SECURITY: Store in secrets manager in production!
ADMIN_SEED="your twelve word seed phrase here never commit this"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRY=1h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Game-specific
GAME_ID=my-awesome-game
```

### Core Files

#### src/config.js

```javascript
import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    blockchain: {
        rpcUrl: process.env.RPC_URL || 'https://rpc.demiurge.cloud',
        wssUrl: process.env.WSS_URL || 'wss://rpc.demiurge.cloud',
        adminSeed: process.env.ADMIN_SEED,
    },
    
    jwt: {
        secret: process.env.JWT_SECRET,
        expiry: process.env.JWT_EXPIRY || '1h',
    },
    
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    },
    
    gameId: process.env.GAME_ID || 'default-game',
};
```

#### src/services/blockchain.js

```javascript
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { config } from '../config.js';

let api = null;
let adminKeyring = null;

/**
 * Initialize connection to Demiurge blockchain
 */
export async function initBlockchain() {
    console.log('[Blockchain] Connecting to:', config.blockchain.wssUrl);
    
    const provider = new WsProvider(config.blockchain.wssUrl);
    api = await ApiPromise.create({ provider });
    
    // Initialize admin keyring for signing
    const keyring = new Keyring({ type: 'sr25519' });
    adminKeyring = keyring.addFromUri(config.blockchain.adminSeed);
    
    console.log('[Blockchain] Connected. Admin address:', adminKeyring.address);
    
    // Listen for new blocks (optional, for logging)
    api.rpc.chain.subscribeNewHeads((header) => {
        console.log(`[Blockchain] Block #${header.number}`);
    });
    
    return api;
}

/**
 * Get balance for an address
 * @param {string} address - Wallet address
 * @returns {Object} Balance info
 */
export async function getBalance(address) {
    const account = await api.query.system.account(address);
    return {
        free: account.data.free.toString(),
        reserved: account.data.reserved.toString(),
        frozen: account.data.frozen.toString(),
    };
}

/**
 * Mint CGT to a player
 * @param {string} toAddress - Recipient address
 * @param {number} amountSparks - Amount in Sparks (100 Sparks = 1 CGT)
 * @returns {Object} Transaction result
 */
export async function mintCGT(toAddress, amountSparks) {
    console.log(`[Blockchain] Minting ${amountSparks} Sparks to ${toAddress}`);
    
    // Use pallet-cgt mint function
    const tx = api.tx.cgt.mint(toAddress, amountSparks);
    
    return new Promise((resolve, reject) => {
        tx.signAndSend(adminKeyring, ({ status, events, dispatchError }) => {
            if (status.isInBlock) {
                console.log(`[Blockchain] Tx in block: ${status.asInBlock}`);
                
                // Check for errors
                if (dispatchError) {
                    if (dispatchError.isModule) {
                        const decoded = api.registry.findMetaError(dispatchError.asModule);
                        reject(new Error(`${decoded.section}.${decoded.name}`));
                    } else {
                        reject(new Error(dispatchError.toString()));
                    }
                    return;
                }
                
                resolve({
                    success: true,
                    blockHash: status.asInBlock.toString(),
                    events: events.map(e => e.event.method),
                });
            }
        }).catch(reject);
    });
}

/**
 * Add experience to a DRC-369 asset
 * @param {string} assetUuid - Asset UUID
 * @param {number} xpAmount - XP to add
 * @returns {Object} Transaction result
 */
export async function addAssetExperience(assetUuid, xpAmount) {
    console.log(`[Blockchain] Adding ${xpAmount} XP to asset ${assetUuid}`);
    
    const tx = api.tx.drc369.addExperience(assetUuid, xpAmount);
    
    return new Promise((resolve, reject) => {
        tx.signAndSend(adminKeyring, ({ status, dispatchError }) => {
            if (status.isInBlock) {
                if (dispatchError) {
                    reject(new Error(dispatchError.toString()));
                    return;
                }
                resolve({ success: true, blockHash: status.asInBlock.toString() });
            }
        }).catch(reject);
    });
}

/**
 * Increment kill count on a DRC-369 asset
 * @param {string} assetUuid - Asset UUID
 * @returns {Object} Transaction result
 */
export async function incrementAssetKillCount(assetUuid) {
    const tx = api.tx.drc369.incrementKillCount(assetUuid);
    
    return new Promise((resolve, reject) => {
        tx.signAndSend(adminKeyring, ({ status, dispatchError }) => {
            if (status.isInBlock) {
                if (dispatchError) {
                    reject(new Error(dispatchError.toString()));
                    return;
                }
                resolve({ success: true });
            }
        }).catch(reject);
    });
}

/**
 * Decrease durability on a DRC-369 asset
 * @param {string} assetUuid - Asset UUID
 * @param {number} amount - Amount to decrease
 * @returns {Object} Transaction result
 */
export async function decreaseAssetDurability(assetUuid, amount) {
    const tx = api.tx.drc369.updateDurability(assetUuid, -amount);
    
    return new Promise((resolve, reject) => {
        tx.signAndSend(adminKeyring, ({ status, dispatchError }) => {
            if (status.isInBlock) {
                if (dispatchError) {
                    reject(new Error(dispatchError.toString()));
                    return;
                }
                resolve({ success: true });
            }
        }).catch(reject);
    });
}

export { api };
```

#### src/services/rewards.js

```javascript
/**
 * Reward configuration by action type
 */
const REWARD_TABLE = {
    // Enemy kills
    'kill_goblin': { baseSparks: 5, xpBase: 10 },
    'kill_goblin_elite': { baseSparks: 20, xpBase: 50 },
    'kill_boss_dragon': { baseSparks: 500, xpBase: 1000 },
    
    // Quests
    'quest_tutorial_complete': { baseSparks: 100, xpBase: 200 },
    'quest_daily_complete': { baseSparks: 50, xpBase: 100 },
    
    // Exploration
    'discover_secret': { baseSparks: 25, xpBase: 0 },
    'first_visit_dungeon': { baseSparks: 75, xpBase: 0 },
    
    // Crafting
    'craft_item_common': { baseSparks: 2, xpBase: 5 },
    'craft_item_rare': { baseSparks: 10, xpBase: 25 },
    'craft_item_legendary': { baseSparks: 100, xpBase: 250 },
    
    // Default for unknown actions
    'default': { baseSparks: 1, xpBase: 1 },
};

/**
 * Calculate rewards based on action and difficulty
 * @param {string} actionId - Action identifier
 * @param {number} difficulty - Difficulty rating (0-100)
 * @param {Object} metadata - Additional context
 * @returns {Object} Calculated rewards
 */
export function calculateRewards(actionId, difficulty = 0, metadata = {}) {
    const config = REWARD_TABLE[actionId] || REWARD_TABLE['default'];
    
    // Difficulty multiplier (1.0 to 2.0 based on difficulty 0-100)
    const difficultyMultiplier = 1.0 + (difficulty / 100);
    
    // Calculate base rewards
    let sparks = Math.floor(config.baseSparks * difficultyMultiplier);
    let xp = Math.floor(config.xpBase * difficultyMultiplier);
    
    // Bonus multipliers from metadata
    if (metadata.streak && metadata.streak > 1) {
        const streakBonus = 1 + (Math.min(metadata.streak, 10) * 0.05); // Max 50% bonus
        sparks = Math.floor(sparks * streakBonus);
        xp = Math.floor(xp * streakBonus);
    }
    
    if (metadata.first_kill) {
        sparks *= 2;
        xp *= 2;
    }
    
    // Cap maximum rewards to prevent exploits
    sparks = Math.min(sparks, 10000); // Max 100 CGT per action
    xp = Math.min(xp, 50000);
    
    return {
        sparks,
        xp,
        cgt: sparks / 100, // For display purposes
        bonuses: {
            difficulty: difficultyMultiplier,
            streak: metadata.streak || 0,
        }
    };
}

/**
 * Validate action is legitimate (anti-cheat)
 * @param {string} playerAddress - Player wallet address
 * @param {string} actionId - Action type
 * @param {Object} metadata - Action context
 * @returns {Object} Validation result
 */
export function validateAction(playerAddress, actionId, metadata = {}) {
    const errors = [];
    
    // Check timestamp is recent (within 5 minutes)
    if (metadata.timestamp) {
        const actionTime = new Date(metadata.timestamp).getTime();
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (now - actionTime > fiveMinutes) {
            errors.push('Action timestamp too old');
        }
        
        if (actionTime > now + 60000) {
            errors.push('Action timestamp in future');
        }
    }
    
    // Check position is valid (if provided)
    if (metadata.position_x !== undefined || metadata.position_y !== undefined) {
        const x = parseFloat(metadata.position_x);
        const y = parseFloat(metadata.position_y);
        
        // Example: Check position is within world bounds
        if (x < -10000 || x > 10000 || y < -10000 || y > 10000) {
            errors.push('Invalid position');
        }
    }
    
    // Add more validation rules based on your game logic:
    // - Check if player was in correct zone for this kill
    // - Check if boss spawn timing matches
    // - Check if quest was actually active
    // - Rate limit kills per minute
    
    return {
        valid: errors.length === 0,
        errors
    };
}
```

#### src/routes/actions.js

```javascript
import { Router } from 'express';
import { mintCGT, addAssetExperience, incrementAssetKillCount } from '../services/blockchain.js';
import { calculateRewards, validateAction } from '../services/rewards.js';

const router = Router();

/**
 * POST /api/record-action
 * Records a gameplay action and distributes rewards
 */
router.post('/record-action', async (req, res) => {
    try {
        const { player_address, action, difficulty, timestamp, metadata } = req.body;
        
        // Validate request
        if (!player_address || !action) {
            return res.status(400).json({
                success: false,
                error: 'Missing player_address or action'
            });
        }
        
        console.log(`[Action] ${action} from ${player_address} (difficulty: ${difficulty})`);
        
        // Validate action is legitimate (anti-cheat)
        const validation = validateAction(player_address, action, { ...metadata, timestamp });
        if (!validation.valid) {
            console.warn(`[Action] Rejected: ${validation.errors.join(', ')}`);
            return res.status(400).json({
                success: false,
                error: 'Action validation failed',
                details: validation.errors
            });
        }
        
        // Calculate rewards
        const rewards = calculateRewards(action, difficulty, metadata);
        console.log(`[Action] Rewards: ${rewards.sparks} Sparks, ${rewards.xp} XP`);
        
        // Execute blockchain transactions
        const results = {
            cgt: null,
            xp: null,
            killCount: null
        };
        
        // Mint CGT rewards
        if (rewards.sparks > 0) {
            try {
                results.cgt = await mintCGT(player_address, rewards.sparks);
            } catch (err) {
                console.error('[Action] CGT mint failed:', err.message);
            }
        }
        
        // Add XP to equipped weapon (if applicable)
        if (rewards.xp > 0 && metadata.weapon_uuid) {
            try {
                results.xp = await addAssetExperience(metadata.weapon_uuid, rewards.xp);
            } catch (err) {
                console.error('[Action] XP add failed:', err.message);
            }
        }
        
        // Increment kill count (if kill action)
        if (action.startsWith('kill_') && metadata.weapon_uuid) {
            try {
                results.killCount = await incrementAssetKillCount(metadata.weapon_uuid);
            } catch (err) {
                console.error('[Action] Kill count failed:', err.message);
            }
        }
        
        // Return success
        return res.json({
            success: true,
            reward_amount: rewards.sparks,
            reward_cgt: rewards.cgt,
            reward_xp: rewards.xp,
            tx_hash: results.cgt?.blockHash || null,
            bonuses: rewards.bonuses
        });
        
    } catch (error) {
        console.error('[Action] Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * POST /api/batch-claim
 * Batch claim accumulated off-chain Sparks
 */
router.post('/batch-claim', async (req, res) => {
    try {
        const { player_address, amount, session_hash } = req.body;
        
        if (!player_address || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Missing player_address or amount'
            });
        }
        
        // Validate amount is reasonable (max 100,000 Sparks per batch)
        const sparks = parseInt(amount);
        if (isNaN(sparks) || sparks <= 0 || sparks > 100000) {
            return res.status(400).json({
                success: false,
                error: 'Invalid amount (max 100,000 Sparks per batch)'
            });
        }
        
        // TODO: Verify session_hash matches server-side accumulated balance
        // This prevents players from claiming more than they earned
        
        // Mint the batch
        const result = await mintCGT(player_address, sparks);
        
        return res.json({
            success: true,
            amount: sparks,
            cgt: sparks / 100,
            tx_hash: result.blockHash
        });
        
    } catch (error) {
        console.error('[BatchClaim] Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

export default router;
```

#### src/middleware/auth.js

```javascript
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

/**
 * JWT Authentication Middleware
 */
export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
        // Allow unauthenticated requests for some endpoints
        req.user = null;
        return next();
    }
    
    jwt.verify(token, config.jwt.secret, (err, user) => {
        if (err) {
            console.warn('[Auth] Invalid token:', err.message);
            return res.status(403).json({ error: 'Invalid token' });
        }
        
        req.user = user;
        next();
    });
}

/**
 * Require authentication (use after authenticateToken)
 */
export function requireAuth(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
}
```

#### src/middleware/rateLimit.js

```javascript
import { config } from '../config.js';

const requestCounts = new Map();

/**
 * Rate Limiting Middleware
 */
export function rateLimit(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const key = `${ip}-${req.path}`;
    const now = Date.now();
    
    // Get or create request tracking
    let tracking = requestCounts.get(key);
    if (!tracking || now - tracking.windowStart > config.rateLimit.windowMs) {
        tracking = {
            windowStart: now,
            count: 0
        };
    }
    
    tracking.count++;
    requestCounts.set(key, tracking);
    
    // Check limit
    if (tracking.count > config.rateLimit.max) {
        console.warn(`[RateLimit] Exceeded for ${ip} on ${req.path}`);
        return res.status(429).json({
            error: 'Too many requests',
            retryAfter: Math.ceil((tracking.windowStart + config.rateLimit.windowMs - now) / 1000)
        });
    }
    
    next();
}

// Clean up old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, tracking] of requestCounts.entries()) {
        if (now - tracking.windowStart > config.rateLimit.windowMs * 2) {
            requestCounts.delete(key);
        }
    }
}, 60000);
```

#### src/index.js

```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { initBlockchain } from './services/blockchain.js';
import actionsRouter from './routes/actions.js';
import { authenticateToken } from './middleware/auth.js';
import { rateLimit } from './middleware/rateLimit.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: '*', // Configure for your domains in production
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON
app.use(express.json());

// Rate limiting
app.use(rateLimit);

// Authentication (optional for some routes)
app.use(authenticateToken);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', gameId: config.gameId });
});

// API routes
app.use('/api', actionsRouter);

// Error handler
app.use((err, req, res, next) => {
    console.error('[Error]', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function start() {
    try {
        // Connect to blockchain
        await initBlockchain();
        
        // Start HTTP server
        app.listen(config.port, () => {
            console.log(`[Oracle] Server running on port ${config.port}`);
            console.log(`[Oracle] Game ID: ${config.gameId}`);
            console.log(`[Oracle] Environment: ${config.nodeEnv}`);
        });
    } catch (error) {
        console.error('[Oracle] Failed to start:', error);
        process.exit(1);
    }
}

start();
```

---

## Deployment

### Docker Deployment

#### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src ./src

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "src/index.js"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  oracle:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - RPC_URL=https://rpc.demiurge.cloud
      - WSS_URL=wss://rpc.demiurge.cloud
      - ADMIN_SEED=${ADMIN_SEED}
      - JWT_SECRET=${JWT_SECRET}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Systemd Service (Linux)

```ini
# /etc/systemd/system/demiurge-oracle.service
[Unit]
Description=Demiurge Oracle Backend
After=network.target

[Service]
Type=simple
User=oracle
WorkingDirectory=/opt/oracle-server
ExecStart=/usr/bin/node src/index.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
EnvironmentFile=/opt/oracle-server/.env

[Install]
WantedBy=multi-user.target
```

---

## Security Best Practices

### 1. Private Key Management

**NEVER** commit your admin seed phrase to git.

Options for production:
- **Environment variables** (basic)
- **AWS Secrets Manager** / **HashiCorp Vault** (recommended)
- **Hardware Security Module (HSM)** (enterprise)

### 2. Rate Limiting

Implement per-IP and per-player limits:
- Actions: 100/minute per player
- Batch claims: 10/hour per player
- Global: 10,000/minute total

### 3. Action Validation

Always validate:
- Timestamp is recent (within 5 minutes)
- Player position makes sense
- Action matches game state
- Kill counts are physically possible

### 4. Logging & Monitoring

Log all:
- Successful rewards
- Failed validations
- Blockchain errors
- Rate limit hits

Use tools like Datadog, Prometheus, or CloudWatch.

### 5. Network Security

- **HTTPS only** (use Let's Encrypt)
- **Firewall** all ports except 443
- **DDoS protection** (Cloudflare, AWS Shield)
- **VPN** for admin access

---

## Testing

### Local Testing

```bash
# Start Oracle
npm start

# Test health
curl http://localhost:3000/health

# Test action
curl -X POST http://localhost:3000/api/record-action \
  -H "Content-Type: application/json" \
  -d '{
    "player_address": "0x1234567890abcdef...",
    "action": "kill_goblin",
    "difficulty": 50,
    "timestamp": "2026-01-26T12:00:00Z",
    "metadata": {
      "enemy_type": "Elite Goblin"
    }
  }'
```

### Integration Testing

Create a test player address on testnet and verify:
1. CGT balance increases after action
2. XP is added to equipped weapon
3. Kill count increments
4. Rate limiting works

---

## Next Steps

1. **[DRC-SDK Main Guide](../DRC_SDK.md)** - Overview of all engines
2. **[DRC-369 Architecture](../../blockchain/DRC369_ARCHITECTURE.md)** - NFT system details
3. **[CGT Tokenomics](../../blockchain/CGT_TOKENOMICS.md)** - Token economics

---

**The Archons guard the gates between realms. The code serves the will.**

---

*Last Updated: January 26, 2026*  
*Document Version: 1.0*  
*Maintainer: Alaustrup*
