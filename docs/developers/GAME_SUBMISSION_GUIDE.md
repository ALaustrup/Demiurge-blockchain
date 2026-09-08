# Game Submission Guide

This guide explains how to submit your game to the Demiurge blockchain and get it approved for public play.

## Overview

Demiurge is an open gaming platform that allows developers to:
- Register games on-chain with a stake deposit
- Earn revenue from player transactions
- Integrate DRC-369 NFT assets
- Access the global player base

## Prerequisites

1. **QOR ID Account** - Create one at [demiurge.cloud/social](https://demiurge.cloud/social)
2. **CGT Balance** - Minimum 1000 CGT for registration stake
3. **Hosted Game** - Your game must be hosted on IPFS or a web server
4. **Demiurge Integration** - Follow our [Game Integration Guide](./GAME_INTEGRATION_GUIDE.md)

## Submission Process

### Step 1: Prepare Your Game

Ensure your game meets these requirements:

- **Entry Point**: Must have an `index.html` file
- **Self-Contained**: All assets should be bundled or accessible via HTTPS
- **Blockchain Integration**: Include the Demiurge HUD script (optional but recommended)
- **Responsive**: Should work at various resolutions
- **No Malware**: Games are scanned for malicious code

### Step 2: Choose Your Category

| Category | Description | Examples |
|----------|-------------|----------|
| **Miner** | Games focused on earning CGT/Sparks | Clicker games, mining simulators |
| **DRC-369** | Games with NFT integration | RPGs with equipment, collectibles |
| **Casual** | Fun games without blockchain rewards | Puzzles, arcade games |
| **Multiplayer** | Real-time multiplayer games | Battle royale, racing |
| **Adventure** | Story-driven RPG/adventure | Quest games, exploration |

### Step 3: Select Your Engine

We support multiple game engines:

- **[Phaser.js](./PHASER_INTEGRATION.md)** - Popular 2D web game framework
- **[ScatterTXT](./SCATTERTXT_SDK.md)** - Demiurge native engine with deep blockchain integration
- **[Unity WebGL](./UNITY_WEBGL_INTEGRATION.md)** - Export Unity games to web
- **[Unreal Engine](./UNREAL_WEBGL_INTEGRATION.md)** - HTML5 exports from Unreal
- **[Rosebud.ai](./ROSEBUD_INTEGRATION.md)** - AI-generated games
- **Custom** - Any HTML5/JavaScript game

### Step 4: Stake CGT

A minimum stake of **1000 CGT** is required to register a game.

**Why stake?**
- Prevents spam registrations
- Shows commitment to the platform
- Returned when you remove your game
- Higher stakes may get faster approval

### Step 5: Submit for Review

1. Go to [demiurge.cloud/games/submit](https://demiurge.cloud/games/submit)
2. Fill in game details (title, description, URL)
3. Select category and engine
4. Set your stake amount
5. Confirm and submit

### Step 6: Approval Process

Our review team checks for:

- ✅ Game loads and plays correctly
- ✅ No malicious code or exploits
- ✅ Blockchain integration works properly
- ✅ Appropriate content
- ✅ Quality and polish

**Timeline**: Most games are reviewed within 24-48 hours.

## Revenue Sharing

Default revenue split for CGT earned in your game:

| Recipient | Share |
|-----------|-------|
| Developer | 70% |
| Treasury | 20% |
| Stakers | 10% |

You can customize this in your game settings after approval.

## After Approval

Once approved, your game will:

1. Appear in the [Games Directory](https://demiurge.cloud/games)
2. Be playable by all users
3. Earn CGT from player activity
4. Show in category filters
5. Be eligible for featuring

## Updating Your Game

To update a registered game:

1. Upload new version to your hosting
2. Go to your game's settings page
3. Update the game URL if needed
4. Changes take effect immediately

## Withdrawing Your Game

To remove your game and get your stake back:

1. Go to your game's settings
2. Click "Deactivate Game"
3. Confirm withdrawal
4. Stake is returned to your wallet

Note: You cannot withdraw stake while the game is active.

## Best Practices

### Performance
- Optimize assets for web (compress images, minify JS)
- Test on various devices and browsers
- Implement loading screens for large games

### Player Experience
- Include clear instructions
- Support keyboard and mouse/touch
- Save progress (use our GameData API)

### Blockchain Integration
- Use session keys for seamless gameplay
- Show CGT earnings clearly
- Integrate DRC-369 assets where appropriate

## Support

- **Discord**: [discord.gg/demiurge](https://discord.gg/demiurge)
- **Documentation**: [docs.demiurge.cloud](https://docs.demiurge.cloud)
- **Email**: developers@demiurge.cloud

## FAQ

**Q: Can I submit a game I didn't create?**
A: No, you must own the rights to the game.

**Q: What if my game is rejected?**
A: You'll receive feedback and can resubmit after making changes.

**Q: How do I earn more from my game?**
A: Higher engagement = more CGT earned. Focus on retention and fun gameplay.

**Q: Can I have multiple games?**
A: Yes! Each requires its own stake.
