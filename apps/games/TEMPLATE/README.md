# Demiurge Game Template

This template provides everything you need to create a DRC-369 NFT-enabled game for the Demiurge platform.

## Quick Start

1. **Copy this folder** to `apps/games/YOUR_GAME_NAME/`

2. **Edit `assets/data/nft_assets.json`**:
   - Set your `gameId`
   - Define `assetClasses` (skins, effects, etc.)
   - Configure `nftUnlocks` (what NFTs unlock)
   - Create `mintableAchievements` (NFTs players can earn)

3. **Add your game code** and integrate with `DemiurgeIntegration.js`:

```javascript
// Initialize
const demiurge = new DemiurgeIntegration('your-game-id', {
  mockMode: true, // Set false when deploying
  onAssetsLoaded: (assets) => {
    // Apply unlocked skins/effects
    const skin = demiurge.getAsset('player_skin');
    player.setSkin(skin);
  },
  onAchievementMinted: (achievement) => {
    showPopup(`🏆 ${achievement.name} unlocked!`);
  }
});

await demiurge.initialize();

// In your game logic:
async function onGameWin(score) {
  // Award achievement (mints soulbound NFT)
  await demiurge.awardAchievement('first_play', { score });
  
  // Update high score
  await demiurge.updateGameState('high_score', score);
  
  // Add XP
  await demiurge.addXP(Math.floor(score / 100));
}
```

## Files

| File | Purpose |
|------|---------|
| `DemiurgeIntegration.js` | Main integration library |
| `BlockchainManager.js` | Legacy wallet/balance API |
| `assets/data/nft_assets.json` | NFT unlock configuration |

## Key Features

### 1. Asset Unlocking
```javascript
const skin = demiurge.getAsset('player_skin'); // Returns unlocked or default
```

### 2. Achievement Minting
```javascript
await demiurge.awardAchievement('high_scorer', { score: 15000 });
```

### 3. Cross-Game Interoperability
```javascript
// Read another game's data
const otherScore = await demiurge.getOtherGameState('cosmic-runner', 'high_score');
if (otherScore > 50000) {
  unlockSpecialContent();
}
```

### 4. Dynamic State
```javascript
// Read
const xp = await demiurge.getNFTState('stats/xp');

// Write
await demiurge.incrementStat('stats/games_played');
await demiurge.updateGameState('high_score', 75000);
```

## Testing

Set `mockMode: true` to test without blockchain connection:

```javascript
const demiurge = new DemiurgeIntegration('your-game-id', {
  mockMode: true
});
```

Mock mode simulates:
- Wallet connection
- NFT ownership
- Achievement minting
- State updates

## See Also

- [DRC369_INTEGRATION_GUIDE.md](../DRC369_INTEGRATION_GUIDE.md) - Full documentation
- [Demiurge SDK](../../../sdk/) - TypeScript SDK for advanced use cases
