# 🌐 P2P Features Guide

**Complete guide to peer-to-peer trading and features**

> *"From the Monad, all creation emanates. To the Pleroma, all value returns."*

---

## 🎯 Overview

Demiurge provides powerful P2P (peer-to-peer) features for:
- **Trading NFTs** - Direct NFT trading
- **Atomic Swaps** - Trustless asset swaps
- **Marketplace** - Decentralized marketplace
- **Social Features** - Creator interactions

---

## 💱 Trading NFTs

### Direct NFT Trading

```typescript
import { DemiurgeRpcClient } from '@demiurge/rpc-client';

const client = new DemiurgeRpcClient('https://rpc.demiurge.cloud');

// List NFT for sale
await client.listNFTForSale({
  nft_uuid: 'nft-001',
  price: '1000000000000000000', // 10 CGT
  currency: 'CGT',
  seller: '0x1234...'
});
```

### Buy NFT

```typescript
// Buy listed NFT
await client.buyNFT({
  nft_uuid: 'nft-001',
  buyer: '0x5678...',
  price: '1000000000000000000',
  signature: '0x...'
});
```

### Cancel Listing

```typescript
// Cancel NFT listing
await client.cancelNFTListing('nft-001');
```

---

## 🔄 Atomic Swaps

### What are Atomic Swaps?

Atomic swaps allow **trustless** asset exchanges:
- **No intermediaries** - Direct peer-to-peer
- **Atomic** - Either both succeed or both fail
- **Secure** - On-chain verification

### Create Atomic Swap

```typescript
// Create swap offer
const swap = await client.createAtomicSwap({
  offerer: '0x1234...',
  offered_asset: {
    type: 'NFT',
    uuid: 'nft-001'
  },
  requested_asset: {
    type: 'NFT',
    uuid: 'nft-002'
  },
  expires_at_block: 99999
});
```

### Accept Atomic Swap

```typescript
// Accept swap offer
await client.acceptAtomicSwap({
  swap_id: swap.id,
  accepter: '0x5678...',
  signature: '0x...'
});
```

### Cancel Atomic Swap

```typescript
// Cancel swap (only before acceptance)
await client.cancelAtomicSwap(swap.id);
```

---

## 🏪 Marketplace

### Browse Marketplace

```typescript
// Get all listings
const listings = await client.getMarketplaceListings({
  category: 'NFT',
  min_price: '1000000000000000000',
  max_price: '10000000000000000000',
  sort_by: 'price_asc'
});

console.log('Available listings:', listings.length);
```

### Search Marketplace

```typescript
// Search marketplace
const results = await client.searchMarketplace({
  query: 'cyber samurai',
  filters: {
    min_level: 5,
    max_level: 10,
    rarity: 'legendary'
  }
});

console.log('Search results:', results);
```

### Create Collection Listing

```typescript
// List entire collection
await client.listCollection({
  collection_uuid: 'collection-001',
  price: '100000000000000000000', // 1000 CGT
  seller: '0x1234...'
});
```

---

## 👥 Social Features

### Follow Creators

```typescript
// Follow a creator
await client.followCreator('0x1234...', '0x5678...');
```

### Get Creator Feed

```typescript
// Get creator's latest NFTs
const feed = await client.getCreatorFeed('0x5678...');
console.log('Creator feed:', feed);
```

### Share NFTs

```typescript
// Share NFT on social
await client.shareNFT({
  nft_uuid: 'nft-001',
  platform: 'twitter',
  message: 'Check out my new NFT!'
});
```

---

## 🎁 Gifting

### Gift NFT

```typescript
// Gift NFT to another user
await client.giftNFT({
  nft_uuid: 'nft-001',
  from: '0x1234...',
  to: '0x5678...',
  message: 'Happy birthday!'
});
```

### Gift CGT

```typescript
// Gift CGT tokens
await client.giftCGT({
  from: '0x1234...',
  to: '0x5678...',
  amount: '1000000000000000000', // 10 CGT
  message: 'Thanks for your help!'
});
```

---

## 🔐 Escrow Services

### Create Escrow

```typescript
// Create escrow for trade
const escrow = await client.createEscrow({
  seller: '0x1234...',
  buyer: '0x5678...',
  asset: {
    type: 'NFT',
    uuid: 'nft-001'
  },
  price: '1000000000000000000',
  expires_at_block: 99999
});
```

### Release Escrow

```typescript
// Release escrow (seller confirms)
await client.releaseEscrow(escrow.id, '0x1234...');
```

### Refund Escrow

```typescript
// Refund escrow (if expired or cancelled)
await client.refundEscrow(escrow.id);
```

---

## 📊 Trading Analytics

### Get Trading History

```typescript
// Get your trading history
const history = await client.getTradingHistory('0x1234...');
console.log('Total trades:', history.length);
console.log('Total volume:', history.reduce((sum, trade) => sum + BigInt(trade.price), BigInt(0)));
```

### Get NFT Price History

```typescript
// Get price history for NFT
const priceHistory = await client.getNFTPriceHistory('nft-001');
console.log('Price history:', priceHistory);
```

### Get Market Statistics

```typescript
// Get market statistics
const stats = await client.getMarketStatistics();
console.log('Total volume (24h):', stats.volume_24h);
console.log('Total sales (24h):', stats.sales_24h);
console.log('Average price:', stats.average_price);
```

---

## 🛡️ Security Best Practices

1. **Verify Recipients** - Always verify recipient addresses
2. **Check Swap Details** - Verify swap terms before accepting
3. **Monitor Expiry** - Don't let swaps expire with your assets locked
4. **Use Escrow** - Use escrow for high-value trades
5. **Report Scams** - Report suspicious activity

---

## 💡 Tips for Successful Trading

1. **Research Prices** - Check recent sales before listing
2. **Set Fair Prices** - Price competitively but fairly
3. **Be Patient** - Don't rush into trades
4. **Build Reputation** - Complete trades successfully
5. **Use Collections** - Bundle NFTs for better prices

---

## 🔗 Related Documentation

- **[Asset Management](./asset-management.md)** - Managing your assets
- **[DRC-369 Guide](./drc369-complete-guide.md)** - NFT standard
- **[Mining Operations](./mining-operations.md)** - Earning rewards

---

**The flame burns eternal. The code serves the will.**
