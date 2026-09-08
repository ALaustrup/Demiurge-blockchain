# @demiurge/drc369-sdk

TypeScript SDK for DRC-369 Evolving NFTs with CVP Protection - Dynamic NFTs that grow with your players.

## Installation

```bash
npm install @demiurge/drc369-sdk
# or
yarn add @demiurge/drc369-sdk
# or
pnpm add @demiurge/drc369-sdk
```

## Features

- **Evolving NFTs** - NFTs with mutable state that changes over time
- **CVP Protection** - Consensus-Verified Polymorphism prevents unauthorized mutations
- **Physics Metadata** - Built-in support for game physics properties
- **React Hooks** - First-class React integration
- **Real-time Updates** - Subscribe to NFT state changes

## Quick Start

```typescript
import { DRC369Client } from '@demiurge/drc369-sdk';

const client = new DRC369Client({
  rpcUrl: 'https://rpc.demiurge.cloud',
});

// Get NFT with dynamic state
const nft = await client.getToken('nft-001');
console.log('Name:', nft.name);
console.log('Level:', nft.dynamicState.level);
console.log('XP:', nft.dynamicState.xp);

// Subscribe to state changes
client.subscribe('nft-001', (newState) => {
  console.log('NFT evolved!', newState);
});
```

## React Integration

```tsx
import { useDRC369, DRC369Provider } from '@demiurge/drc369-sdk/react';

// Wrap your app
function App() {
  return (
    <DRC369Provider rpcUrl="https://rpc.demiurge.cloud">
      <MyComponent />
    </DRC369Provider>
  );
}

// Use the hook
function MyNFT({ tokenId }: { tokenId: string }) {
  const { token, loading, error, refresh } = useDRC369(tokenId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>{token.name}</h2>
      <p>Level: {token.dynamicState.level}</p>
      <p>XP: {token.dynamicState.xp}</p>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

## API Reference

### DRC369Client

```typescript
import { DRC369Client } from '@demiurge/drc369-sdk';

const client = new DRC369Client({
  rpcUrl: 'https://rpc.demiurge.cloud',
});

// Get single token
const token = await client.getToken(tokenId);

// Get all tokens for owner
const tokens = await client.getTokensByOwner(address);

// Get dynamic state only
const state = await client.getDynamicState(tokenId);

// Subscribe to changes
const unsubscribe = client.subscribe(tokenId, (state) => {
  console.log('New state:', state);
});

// Unsubscribe when done
unsubscribe();
```

### Token Structure

```typescript
interface DRC369Token {
  id: string;
  name: string;
  description: string;
  image: string;
  owner: string;
  creator: string;
  collection?: string;
  royalty: number; // basis points (500 = 5%)
  
  // Static attributes
  attributes: {
    trait_type: string;
    value: string | number;
  }[];
  
  // Dynamic state (mutable)
  dynamicState: {
    level: number;
    xp: number;
    health?: number;
    energy?: number;
    [key: string]: any;
  };
  
  // Physics metadata (for games)
  physics?: {
    mass: number;
    friction: number;
    restitution: number;
    velocity?: { x: number; y: number; z: number };
  };
  
  // CVP protection
  cvp?: {
    codeHash: string;
    lastVerified: number;
    mutations: number;
  };
}
```

### Minting NFTs

```typescript
// Prepare metadata
const metadata = {
  name: 'Epic Sword',
  description: 'A legendary weapon',
  image: 'ipfs://...',
  attributes: [
    { trait_type: 'Rarity', value: 'Legendary' },
    { trait_type: 'Damage', value: 100 },
  ],
  dynamicState: {
    level: 1,
    xp: 0,
    durability: 100,
  },
};

// Mint (requires signed transaction)
const txHash = await client.mint(metadata, royaltyBps, signature);
```

### Updating Dynamic State

```typescript
// Update state (requires signature from owner or authorized key)
const txHash = await client.updateState(tokenId, {
  level: 5,
  xp: 2500,
  achievements: ['first_blood', 'explorer'],
}, signature);
```

## Types

```typescript
import type {
  DRC369Token,
  DRC369Metadata,
  DynamicState,
  PhysicsMetadata,
  CVPStatus,
  TokenEvent,
} from '@demiurge/drc369-sdk';
```

## Events

```typescript
import { DRC369Events } from '@demiurge/drc369-sdk';

client.on(DRC369Events.STATE_UPDATED, (event) => {
  console.log('Token updated:', event.tokenId);
  console.log('New state:', event.state);
});

client.on(DRC369Events.TRANSFERRED, (event) => {
  console.log('Token transferred:', event.tokenId);
  console.log('From:', event.from, 'To:', event.to);
});
```

## Configuration

### Environment Variables

```bash
DEMIURGE_RPC_URL=https://rpc.demiurge.cloud
```

## Related Packages

- [@demiurge/sdk](https://www.npmjs.com/package/@demiurge/sdk) - Core Protocol SDK
- [@demiurge/qor-sdk](https://www.npmjs.com/package/@demiurge/qor-sdk) - Identity SDK
- [@demiurge/agent-foundry](https://www.npmjs.com/package/@demiurge/agent-foundry) - AI Agent SDK

## License

MIT - Demiurge Protocol

## Links

- [DRC-369 Specification](https://demiurge.cloud/docs/drc369)
- [Documentation](https://demiurge.cloud/docs)
- [GitHub](https://github.com/ALaustrup/Demiurge-Blockchain)
- [Website](https://demiurge.cloud)
