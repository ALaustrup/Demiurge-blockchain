# Demiurge TypeScript SDK

High-level TypeScript SDK for interacting with the Demiurge Blockchain.

## Installation

```bash
npm install @demiurge/ts-sdk
# or
pnpm add @demiurge/ts-sdk
```

## Usage

```typescript
import { DemiurgeSDK } from '@demiurge/ts-sdk';

// Initialize SDK
const sdk = new DemiurgeSDK({
  rpcUrl: 'http://127.0.0.1:8545/rpc',
});

// Get CGT balance
const balance = await sdk.cgt.getBalanceFormatted('0x...');

// Get UrgeID profile
const profile = await sdk.urgeid.getProfile('0x...');

// Get NFTs
const nfts = await sdk.nft.getNftsByOwner('0x...');

// Browse marketplace
const listings = await sdk.marketplace.getAllListings();
```

## API Reference

See the [full documentation](../../docs/sdk-ts.md) for complete API reference.

## License

MIT

