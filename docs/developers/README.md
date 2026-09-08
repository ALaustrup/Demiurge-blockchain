# Developer Guide

Complete guide for building on Demiurge Protocol.

---

## Quick Links

| Resource | Description |
|----------|-------------|
| [RPC Reference](./rpc-reference.md) | All RPC methods |
| [TypeScript SDK](./sdk/typescript.md) | Core SDK |
| [Unreal Engine](./game-engines/unreal.md) | UE5 integration |
| [Unity](./game-engines/unity.md) | Unity integration |

---

## Getting Started

### 1. Install SDK

```bash
npm install @demiurge/sdk
```

### 2. Connect to Network

```typescript
import { DemiurgeClient } from '@demiurge/sdk';

const client = new DemiurgeClient({
  rpcUrl: 'https://rpc.demiurge.cloud:9944'
});

// Test connection
const health = await client.getHealth();
console.log('Connected:', health.connected);
console.log('Block:', health.block_number);
```

### 3. Create Wallet

```typescript
import { Wallet } from '@demiurge/sdk';

// Generate new wallet
const wallet = Wallet.generate();
console.log('Address:', wallet.address);
console.log('Public Key:', wallet.publicKey);

// Save for later
const encrypted = wallet.encrypt('your-password');
localStorage.setItem('wallet', JSON.stringify(encrypted));

// Load existing wallet
const loaded = Wallet.decrypt(encrypted, 'your-password');
```

### 4. Perform Transactions

```typescript
// Check balance
const balance = await client.getBalance(wallet.address);
console.log('Balance:', balance / 100, 'CGT');

// Send transfer
const result = await client.transfer({
  from: wallet.address,
  to: recipientAddress,
  amount: 100, // 1 CGT
  wallet: wallet
});
console.log('TX Hash:', result.tx_hash);
```

---

## SDK Packages

| Package | Purpose | Install |
|---------|---------|---------|
| `@demiurge/sdk` | Core protocol | `npm i @demiurge/sdk` |
| `@demiurge/qor-sdk` | Identity | `npm i @demiurge/qor-sdk` |
| `@demiurge/drc369-sdk` | NFTs | `npm i @demiurge/drc369-sdk` |
| `@demiurge/agent-foundry` | AI Agents | `npm i @demiurge/agent-foundry` |
| `@demiurge/cli` | CLI Tools | `npm i -g @demiurge/cli` |

---

## Common Patterns

### Authentication

```typescript
import { DemiurgeAuth, Wallet } from '@demiurge/sdk';

const auth = new DemiurgeAuth({
  authUrl: 'https://demiurge.cloud/api/v1'
});

// Keypair login (recommended for apps)
const wallet = Wallet.generate();
const session = await auth.loginWithKeypair(wallet);

// QOR ID login (for users)
const session = await auth.loginWithQorId({
  qorId: 'alice#0001',
  password: 'password'
});
```

### Error Handling

```typescript
try {
  const result = await client.transfer({...});
} catch (error) {
  if (error.code === -32010) {
    // Insufficient balance
    console.error('Not enough CGT');
  } else if (error.code === -32602) {
    // Invalid parameters
    console.error('Check your parameters');
  } else {
    console.error('Unknown error:', error.message);
  }
}
```

### Batch Operations

```typescript
// Get multiple balances efficiently
const addresses = ['0x...', '0x...', '0x...'];
const balances = await Promise.all(
  addresses.map(addr => client.getBalance(addr))
);
```

### Subscriptions (WebSocket)

```typescript
const client = new DemiurgeClient({
  rpcUrl: 'wss://rpc.demiurge.cloud:9944'
});

// Subscribe to new blocks
client.subscribeBlocks((block) => {
  console.log('New block:', block.number);
});

// Subscribe to account changes
client.subscribeAccount(myAddress, (update) => {
  console.log('Balance changed:', update.balance);
});
```

---

## NFT Development

### Mint NFT

```typescript
import { DRC369Client } from '@demiurge/drc369-sdk';

const nft = new DRC369Client({
  rpcUrl: 'https://rpc.demiurge.cloud:9944'
});

const result = await nft.mint({
  to: wallet.address,
  tokenUri: 'https://example.com/metadata.json',
  physics: {
    mass: 5.0,
    friction: 0.5,
    restitution: 0.3
  },
  wallet: wallet
});

console.log('Token ID:', result.token_id);
```

### Query NFTs

```typescript
// Get token info
const info = await nft.getTokenInfo(tokenId);
console.log('Owner:', info.owner);

// Get tokens by owner
const tokens = await nft.getTokensByOwner(ownerAddress);

// Get physics
const physics = await nft.getPhysics(tokenId);
console.log('Mass:', physics.mass);
```

### Update Dynamic State

```typescript
// Set state
await nft.setState({
  tokenId: tokenId,
  key: 'kills',
  value: '42',
  wallet: wallet
});

// Get state
const kills = await nft.getState(tokenId, 'kills');
```

---

## Agent Development

### Create Agent

```typescript
import { createAgent } from '@demiurge/agent-foundry';

const agent = await createAgent({
  name: 'TradingBot',
  autonomy: 'bounded',
  spendingLimit: '100 CGT',
  capabilities: ['transfer', 'nft_trade'],
  llm: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY
  }
});

console.log('Agent DID:', agent.did);
console.log('Agent Address:', agent.address);
```

### Agent Actions

```typescript
// Agent performs action
const result = await agent.execute({
  action: 'transfer',
  params: {
    to: recipientAddress,
    amount: 50
  }
});

// Check agent capabilities
const caps = await agent.getCapabilities();
```

---

## Testing

### Local Node

```bash
# Start local node
cd framework
cargo run --release -- \
  --dev \
  --rpc-addr 127.0.0.1:9944

# Connect to local
const client = new DemiurgeClient({
  rpcUrl: 'http://localhost:9944'
});
```

### Testnet

```bash
# Use testnet endpoint
const client = new DemiurgeClient({
  rpcUrl: 'https://testnet.demiurge.cloud:9944'
});
```

### Mock Testing

```typescript
import { MockClient } from '@demiurge/sdk/testing';

const mock = new MockClient();
mock.setBalance('0x...', 10000);

// Test your code
const result = await myFunction(mock);
expect(result.success).toBe(true);
```

---

## Best Practices

### Security

1. **Never expose private keys** in frontend code
2. **Use session keys** for routine operations
3. **Validate all inputs** before RPC calls
4. **Handle errors gracefully**

### Performance

1. **Batch RPC calls** when possible
2. **Cache frequently accessed data**
3. **Use WebSocket** for real-time updates
4. **Paginate large result sets**

### UX

1. **Show loading states** during transactions
2. **Provide clear error messages**
3. **Confirm destructive actions**
4. **Display transaction hashes** for verification

---

## Support

- **GitHub Issues:** https://github.com/ALaustrup/Demiurge-Blockchain/issues
- **Documentation:** https://demiurge.cloud/docs
- **Discord:** Coming soon

---

## Further Reading

- [RPC Reference](./rpc-reference.md) - Complete API documentation
- [Architecture](../architecture/README.md) - System design
- [Specifications](../specifications/) - Protocol specs
