# 📦 Asset Management Guide

**Complete guide for managing your digital assets on Demiurge**

> *"From the Monad, all creation emanates. To the Pleroma, all value returns."*

---

## 🎯 Overview

Demiurge provides powerful tools for managing your digital assets:
- **NFTs** - DRC-369 stateful NFTs
- **CGT Tokens** - Native currency
- **Game Assets** - Multi-asset system
- **Collections** - Organize your assets

---

## 💰 Managing CGT Tokens

### Check Your Balance

```typescript
import { DemiurgeRpcClient } from '@demiurge/rpc-client';

const client = new DemiurgeRpcClient('https://rpc.demiurge.cloud');

// Get balance
const balance = await client.getBalance('0x1234...');
console.log('Balance:', balance.free, 'Sparks');
console.log('Balance:', Number(balance.free) / 100, 'CGT');
```

### Transfer Tokens

```typescript
// Transfer CGT tokens
await client.transfer({
  from: '0x1234...',
  to: '0x5678...',
  amount: '1000000000000000000', // 10 CGT (in Sparks)
  signature: '0x...'
});
```

### Understanding Sparks and CGT

- **1 CGT = 100 Sparks**
- **Smallest unit = 1 Spark (0.01 CGT)**
- All on-chain values are in Sparks
- Display values in CGT for users

---

## 🎨 Managing NFTs

### View Your NFT Collection

```typescript
// Get all NFTs you own
const nfts = await client.getOwnedNFTs('0x1234...');
console.log('Your NFTs:', nfts.length);

nfts.forEach(nft => {
  console.log('NFT:', nft.name);
  console.log('UUID:', nft.uuid);
  console.log('Level:', nft.state.level);
});
```

### Transfer NFTs

```typescript
// Transfer NFT to another address
await client.transferNFT(nftUuid, '0x5678...');
```

### Nest NFTs (Inventory System)

```typescript
// Add child NFT to parent
await client.nestNFT(parentUuid, childUuid);

// Remove child NFT
await client.unnestNFT(parentUuid, childUuid);
```

### Equip Items

```typescript
// Equip item in slot
await client.equipItem(characterUuid, itemUuid, 'RightHand');
```

---

## 🎮 Managing Game Assets

### Multi-Asset System

Games can create their own asset types:

```typescript
// Create game asset
const asset = await client.createGameAsset({
  game_id: 'my-game',
  asset_type: 'weapon',
  name: 'Legendary Sword',
  properties: {
    damage: 100,
    durability: 1000
  }
});
```

### Transfer Game Assets

```typescript
// Transfer game asset
await client.transferGameAsset(assetUuid, '0x5678...');
```

---

## 📊 Organizing Collections

### Create Collection

```typescript
// Create collection
const collection = await client.createCollection({
  name: 'My Legendary Items',
  description: 'Collection of my best NFTs'
});
```

### Add NFTs to Collection

```typescript
// Add NFT to collection
await client.addToCollection(collectionUuid, nftUuid);
```

### View Collection

```typescript
// Get collection NFTs
const collectionNFTs = await client.getCollectionNFTs(collectionUuid);
console.log('Collection size:', collectionNFTs.length);
```

---

## 🔄 Asset Evolution

### Monitor NFT Evolution

```typescript
// Track NFT level progression
async function trackEvolution(nftUuid) {
  const nft = await client.getNFT(nftUuid);
  console.log('Current level:', nft.state.level);
  console.log('XP:', nft.state.experience_points);
  console.log('XP to next level:', calculateXPForNextLevel(nft.state.level));
}
```

### Upgrade Assets

```typescript
// Upgrade asset (if supported)
await client.upgradeAsset(assetUuid, {
  upgrade_type: 'enhancement',
  cost: '1000000000000000000' // 10 CGT
});
```

---

## 💎 Asset Valuation

### Check Asset Value

```typescript
// Get asset market value
const value = await client.getAssetValue(nftUuid);
console.log('Market value:', value.price, 'CGT');
console.log('Last sale:', value.last_sale);
```

### Price History

```typescript
// Get price history
const history = await client.getPriceHistory(nftUuid);
console.log('Price history:', history);
```

---

## 🔐 Security Best Practices

1. **Backup Your Assets** - Keep records of all asset UUIDs
2. **Verify Transfers** - Always verify recipient addresses
3. **Monitor Energy** - Ensure sufficient energy for operations
4. **Use Session Keys** - Use session keys for game integrations
5. **Check Permissions** - Verify permissions before operations

---

## 📱 Wallet Integration

### Connect Wallet

```typescript
// Connect to wallet
const wallet = await connectWallet();
console.log('Connected address:', wallet.address);
```

### Sign Transactions

```typescript
// Sign transaction
const signature = await wallet.signTransaction({
  from: wallet.address,
  to: '0x5678...',
  amount: '1000000000000000000'
});
```

---

## 🔗 Related Documentation

- **[DRC-369 Guide](./drc369-complete-guide.md)** - Stateful NFT standard
- **[Mining Operations](./mining-operations.md)** - Earning rewards
- **[P2P Features](./p2p-features.md)** - Trading assets

---

**The flame burns eternal. The code serves the will.**
