# @demiurge/sdk

Core TypeScript SDK for the Demiurge Protocol - a next-generation blockchain for gaming and AI.

**Status:** Mainnet v1 with fresh genesis | **Features:** Hybrid auth, DemiurgeAuth class, keypair login

## Installation

```bash
npm install @demiurge/sdk
# or
yarn add @demiurge/sdk
# or
pnpm add @demiurge/sdk
```

## Features

- **DemiurgeClient** - Connect to the Demiurge blockchain RPC
- **DemiurgeAuth** - Hybrid authentication (keypair + QOR ID)
- **DRC369** - Interact with evolving NFTs
- **CVP** - Consensus-Verified Polymorphism utilities
- **Wallet** - Key management and transaction signing

## Quick Start

```typescript
import { DemiurgeClient, DemiurgeAuth, DRC369, Wallet } from '@demiurge/sdk';

// Connect to the network
const client = new DemiurgeClient({
  rpcUrl: 'https://rpc.demiurge.cloud',
});

// Get blockchain info
const blockNumber = await client.getBlockNumber();
console.log('Block:', blockNumber);

// Get balance
const balance = await client.getBalance('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');
console.log('Balance:', balance, 'CGT');

// Work with DRC-369 NFTs
const drc369 = new DRC369(client);
const nft = await drc369.getToken('nft-001');
console.log('NFT:', nft.name);
```

## Keypair Authentication

The SDK supports direct keypair-based authentication:

```typescript
import { DemiurgeAuth, Wallet } from '@demiurge/sdk';

// Initialize auth client
const auth = new DemiurgeAuth({
  authUrl: 'https://demiurge.cloud/api/v1',
});

// Generate a new keypair
const wallet = Wallet.generate();
console.log('Address:', wallet.address);
console.log('Public Key:', wallet.publicKey);

// Register with keypair (creates account linked to your public key)
const registration = await auth.registerWithKeypair(wallet, {
  username: 'myagent',  // Optional: link a QOR ID
});

// Login with keypair (sign a challenge)
const session = await auth.loginWithKeypair(wallet);
console.log('Session Token:', session.token);
console.log('Expires:', session.expiresAt);

// Use session for authenticated requests
const profile = await auth.getProfile(session.token);
```

### Hybrid Authentication

Use either keypair or QOR ID based on your needs:

```typescript
// Option 1: Keypair auth (great for agents and automation)
const session1 = await auth.loginWithKeypair(wallet);

// Option 2: QOR ID auth (great for users)
const session2 = await auth.loginWithQorId({
  username: 'alice#1234',
  password: 'secret',
});

// Both return the same session format
console.log(session1.token);
console.log(session2.token);
```

## API Reference

### DemiurgeClient

```typescript
const client = new DemiurgeClient({
  rpcUrl: 'https://rpc.demiurge.cloud',
  timeout: 30000, // optional
});

// Methods
await client.getBlockNumber();
await client.getBalance(address);
await client.getEnergy(address);
await client.submitTransaction(signedTx);
await client.getTransactionStatus(txHash);
```

### DRC369

```typescript
const drc369 = new DRC369(client);

// Get token info
const token = await drc369.getToken(tokenId);

// Query user's NFTs
const nfts = await drc369.getTokensByOwner(address);

// Get dynamic state
const state = await drc369.getDynamicState(tokenId);
```

### Wallet

```typescript
import { Wallet } from '@demiurge/sdk';

// Generate new keypair
const wallet = Wallet.generate();

// From seed phrase
const wallet = Wallet.fromMnemonic('word1 word2 ...');

// From private key (for agents)
const wallet = Wallet.fromPrivateKey(privateKeyHex);

// Sign transaction
const signature = wallet.sign(txBytes);

// Sign challenge for authentication
const signedChallenge = wallet.signChallenge(challenge);
```

### DemiurgeAuth

```typescript
import { DemiurgeAuth } from '@demiurge/sdk';

const auth = new DemiurgeAuth({
  authUrl: 'https://demiurge.cloud/api/v1',
});

// Keypair authentication
const session = await auth.loginWithKeypair(wallet);

// QOR ID authentication
const session = await auth.loginWithQorId({ username, password });

// Register new account with keypair
const result = await auth.registerWithKeypair(wallet, { username });

// Get profile
const profile = await auth.getProfile(token);

// Refresh session
const newSession = await auth.refreshSession(token);

// Logout
await auth.logout(token);
```

### CVP (Consensus-Verified Polymorphism)

```typescript
import { CVP } from '@demiurge/sdk';

const cvp = new CVP(client);

// Check CVP status for code
const status = await cvp.getStatus(codeHash);

// Verify mutation proof
const isValid = await cvp.verifyProof(proof);
```

## Types

```typescript
import type {
  BlockInfo,
  TransactionInfo,
  TokenInfo,
  DynamicState,
  EnergyInfo,
  CvpStatus,
} from '@demiurge/sdk';
```

## Configuration

### Environment Variables

```bash
DEMIURGE_RPC_URL=https://rpc.demiurge.cloud
```

## Related Packages

- [@demiurge/qor-sdk](https://www.npmjs.com/package/@demiurge/qor-sdk) - Identity SDK
- [@demiurge/drc369-sdk](https://www.npmjs.com/package/@demiurge/drc369-sdk) - NFT SDK with React hooks
- [@demiurge/agent-foundry](https://www.npmjs.com/package/@demiurge/agent-foundry) - AI Agent SDK

## License

MIT - Demiurge Protocol

## Links

- [Documentation](https://demiurge.cloud/docs)
- [GitHub](https://github.com/ALaustrup/Demiurge-Blockchain)
- [Website](https://demiurge.cloud)
