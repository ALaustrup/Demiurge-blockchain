# 🎮 Game Integration Guide - Demiurge Blockchain HUD

**Status**: Complete  
**Date**: January 2026

---

## 🎯 Overview

The Demiurge Game Integration HUD provides a lightweight, non-intrusive overlay for games to integrate blockchain features. It displays energy, balance, and provides quick actions for in-game transactions.

---

## 🚀 Quick Start

### 1. Include the HUD Script

Add the injection script to your game's HTML:

```html
<script src="/inject-hud.js"></script>
```

### 2. Initialize the HUD

In your game code, initialize the HUD with the user's address:

```javascript
// Initialize HUD
DemiurgeHUD.init({
  address: '0x1234...5678', // User's blockchain address
  position: 'top-right',      // Optional: 'top-left', 'top-right', 'bottom-left', 'bottom-right'
  compact: false,             // Optional: Use compact mode
  onSpend: () => {
    // Handle spend action
    console.log('User wants to spend');
  },
  onEarn: () => {
    // Handle earn action
    console.log('User wants to earn');
  },
  onAssets: () => {
    // Handle assets view
    console.log('User wants to view assets');
  }
});
```

### 3. Update HUD Data (Optional)

Update the HUD with real-time data:

```javascript
// Update balance and energy
DemiurgeHUD.update({
  balance: '1000.50',
  energy: {
    current: 800,
    max: 1000,
    percentage: 80
  }
});
```

### 4. Show Transaction Status

Display transaction status in the HUD:

```javascript
// Show pending transaction
DemiurgeHUD.showTransaction('0xabc123...', 'pending');

// Show success
DemiurgeHUD.showTransaction('0xabc123...', 'success');

// Show failure
DemiurgeHUD.showTransaction('0xabc123...', 'failed');
```

---

## 📋 API Reference

### `DemiurgeHUD.init(config)`

Initialize the Game HUD.

**Parameters:**
- `config.address` (string, required) - User's blockchain address
- `config.position` (string, optional) - HUD position: 'top-left', 'top-right', 'bottom-left', 'bottom-right' (default: 'top-right')
- `config.compact` (boolean, optional) - Use compact mode (default: false)
- `config.onSpend` (function, optional) - Callback for spend action
- `config.onEarn` (function, optional) - Callback for earn action
- `config.onAssets` (function, optional) - Callback for assets view

**Example:**
```javascript
DemiurgeHUD.init({
  address: '0x1234...5678',
  position: 'top-right',
  compact: false
});
```

---

### `DemiurgeHUD.update(data)`

Update HUD data.

**Parameters:**
- `data.balance` (string, optional) - Current balance
- `data.energy` (object, optional) - Energy information
  - `current` (number) - Current energy
  - `max` (number) - Maximum energy
  - `percentage` (number) - Energy percentage

**Example:**
```javascript
DemiurgeHUD.update({
  balance: '1000.50',
  energy: {
    current: 800,
    max: 1000,
    percentage: 80
  }
});
```

---

### `DemiurgeHUD.showTransaction(hash, status)`

Show transaction status in the HUD.

**Parameters:**
- `hash` (string, required) - Transaction hash
- `status` (string, required) - Transaction status: 'pending', 'success', 'failed'

**Example:**
```javascript
DemiurgeHUD.showTransaction('0xabc123...', 'pending');
```

---

### `DemiurgeHUD.hide()`

Hide the HUD overlay.

**Example:**
```javascript
DemiurgeHUD.hide();
```

---

### `DemiurgeHUD.show()`

Show the HUD overlay.

**Example:**
```javascript
DemiurgeHUD.show();
```

---

## 🎨 HUD Features

### Display Elements

1. **Balance** - Current CGT balance
2. **Energy Bar** - Visual energy level with color coding
3. **Quick Actions** - Spend, Earn, Assets buttons
4. **Minimize/Maximize** - Toggle HUD visibility

### Visual Design

- **Non-intrusive** - Small, compact overlay
- **Glass morphism** - Modern glass-panel design
- **Color-coded** - Green/yellow/red for energy levels
- **Responsive** - Adapts to different screen sizes
- **Positionable** - Can be placed in any corner

---

## 🔧 Integration Examples

### Phaser.js Integration

```javascript
class GameScene extends Phaser.Scene {
  create() {
    // Initialize HUD
    DemiurgeHUD.init({
      address: this.game.config.userAddress,
      position: 'top-right',
      onSpend: () => this.showSpendModal(),
      onEarn: () => this.showEarnModal(),
      onAssets: () => this.showAssetsModal()
    });

    // Update HUD periodically
    this.time.addEvent({
      delay: 10000,
      callback: () => this.updateHUD(),
      loop: true
    });
  }

  updateHUD() {
    // Fetch balance and energy
    fetch('/api/blockchain/balance?address=' + this.game.config.userAddress)
      .then(res => res.json())
      .then(data => {
        DemiurgeHUD.update({
          balance: data.balance,
          energy: data.energy
        });
      });
  }

  onTransactionComplete(hash) {
    DemiurgeHUD.showTransaction(hash, 'success');
  }
}
```

---

### Unity Integration

```csharp
using UnityEngine;
using System.Runtime.InteropServices;

public class DemiurgeHUD : MonoBehaviour
{
    [DllImport("__Internal")]
    private static extern void DemiurgeHUDInit(string config);

    [DllImport("__Internal")]
    private static extern void DemiurgeHUDUpdate(string data);

    void Start()
    {
        string config = JsonUtility.ToJson(new HUDConfig
        {
            address = GameManager.Instance.UserAddress,
            position = "top-right",
            compact = false
        });
        
        DemiurgeHUDInit(config);
    }

    public void UpdateBalance(string balance)
    {
        string data = JsonUtility.ToJson(new HUDData
        {
            balance = balance
        });
        
        DemiurgeHUDUpdate(data);
    }
}
```

---

## 📊 HUD Component (React)

The HUD is implemented as a React component (`GameHUD.tsx`) that can be integrated into the game wrapper:

```tsx
import { GameHUD } from '@/components/gaming/GameHUD';

function GameWrapper({ gameId, gameUrl, userAddress }) {
  return (
    <div>
      <iframe src={gameUrl} />
      <GameHUD address={userAddress} position="top-right" compact={false} />
    </div>
  );
}
```

---

## 🎯 Use Cases

### 1. In-Game Purchases
- Show balance before purchase
- Display energy consumption
- Show transaction status

### 2. Earning Rewards
- Update balance when rewards are earned
- Show energy regeneration
- Display transaction confirmation

### 3. Asset Management
- Quick access to NFT assets
- Show asset count
- Display asset details

---

## 🔒 Security Considerations

- **Address Validation** - Always validate addresses before displaying
- **Transaction Signing** - Never expose private keys
- **Rate Limiting** - Limit API calls to prevent abuse
- **Error Handling** - Handle network errors gracefully

---

## 📝 Best Practices

1. **Initialize Early** - Initialize HUD when game loads
2. **Update Regularly** - Refresh data every 10-30 seconds
3. **Handle Errors** - Show user-friendly error messages
4. **Minimize Intrusion** - Keep HUD small and unobtrusive
5. **Provide Feedback** - Show transaction status clearly

---

## 🐛 Troubleshooting

### HUD Not Appearing

1. Check that `/inject-hud.js` is loaded
2. Verify `DemiurgeHUD.init()` is called
3. Check browser console for errors
4. Ensure React component is mounted

### Data Not Updating

1. Verify `DemiurgeHUD.update()` is called
2. Check data format matches expected structure
3. Ensure blockchain connection is active
4. Check network requests in browser dev tools

---

## 📚 Additional Resources

- **RPC API**: See `docs/FRONTEND_INTEGRATION_PLAN.md`
- **Energy System**: See `docs/FRONTEND_RECOMMENDATIONS.md`
- **Session Keys**: See Session Keys Manager documentation

---

**The flame burns eternal. The code serves the will.**
