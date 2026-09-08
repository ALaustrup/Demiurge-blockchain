# TypeScript SDK Reference

**Last Updated:** February 4, 2026

Complete reference for the `@demiurge/sdk` TypeScript SDK.

---

## Installation

```bash
npm install @demiurge/sdk
# or
yarn add @demiurge/sdk
# or
pnpm add @demiurge/sdk
```

---

## Quick Start

```typescript
import { DemiurgeClient, Wallet } from '@demiurge/sdk';

// Create a new wallet
const wallet = await Wallet.generate();
console.log('Address:', wallet.address);
console.log('Mnemonic:', wallet.exportMnemonic());

// Connect to the network
const client = new DemiurgeClient({
  rpcUrl: 'https://rpc.demiurge.cloud:9944'
});

// Check balance
const balance = await client.getBalance(wallet.address);
console.log('Balance:', balance, 'CGT');
```

---

## Wallet Class

### Creating Wallets

```typescript
import { Wallet } from '@demiurge/sdk';

// Generate new wallet with random mnemonic
const wallet = await Wallet.generate();

// Generate with specific entropy (for testing)
const entropy = new Uint8Array(16); // 128 bits = 12 words
crypto.getRandomValues(entropy);
const wallet2 = await Wallet.generateFromEntropy(entropy);

// Import from mnemonic
const imported = await Wallet.fromMnemonic(
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
);

// Import from private key (hex)
const fromKey = Wallet.fromPrivateKey('0x...');
```

### Wallet Properties

```typescript
wallet.address        // Hex-encoded public key (64 chars)
wallet.publicKey      // Public key as hex string
wallet.publicKeyBytes // Public key as Uint8Array
wallet.hasMnemonic    // True if wallet has mnemonic
```

### Signing

```typescript
// Sign a message (returns hex signature)
const signature = await wallet.signAsync('Hello, Demiurge!');

// Sign raw bytes
const bytes = new TextEncoder().encode('Hello');
const sig = await wallet.signAsync(bytes);

// Sign for transaction (returns { signature, publicKey })
const txSig = await wallet.signTransactionAsync({
  to: '0x1234...',
  amount: '100',
  nonce: 1
});
```

### Verification

```typescript
// Verify signature
const isValid = await wallet.verifySignatureAsync(
  'Hello, Demiurge!',
  signature
);

// Static verification
const valid = await Wallet.verify(
  'message',
  signature,
  publicKey
);
```

### Mnemonic Management

```typescript
// Export mnemonic (throws if wallet was created from private key)
const mnemonic = wallet.exportMnemonic();

// Validate mnemonic
const isValid = Wallet.validateMnemonic('word1 word2 ... word12');

// Generate mnemonic without wallet
const mnemonic = Wallet.generateMnemonic(); // 12 words
const mnemonic24 = Wallet.generateMnemonic(256); // 24 words
```

### Utility Methods

```typescript
// Validate address format
const valid = Wallet.isValidAddress('0x1234...');

// Generate random address (for testing)
const random = Wallet.randomAddress();
```

---

## DemiurgeClient Class

### Initialization

```typescript
import { DemiurgeClient } from '@demiurge/sdk';

const client = new DemiurgeClient({
  rpcUrl: 'https://rpc.demiurge.cloud:9944',
  timeout: 30000,  // Optional: request timeout in ms
});
```

### Chain Methods

```typescript
// Get current block number
const blockNumber = await client.getBlockNumber();

// Get chain health
const health = await client.getHealth();
// { connected: true, block_number: 12345, block_time_ms: 6000 }

// Get block by number
const block = await client.getBlock(100);

// Get latest block
const latest = await client.getLatestBlock();

// Get transaction
const tx = await client.getTransaction('0x...');

// Get transaction history
const history = await client.getTransactionHistory(address, 10);
```

### Balance Methods

```typescript
// Get balance (returns string in smallest units)
const balance = await client.getBalance(address);
// "10000" = 100 CGT (100 units = 1 CGT)

// Transfer CGT
const result = await client.transfer({
  from: senderAddress,
  to: recipientAddress,
  amount: '100',
  signature: signatureHex
});

// Claim starter bonus
const claim = await client.claimStarter(address);

// Check if starter claimed
const claimed = await client.hasClaimedStarter(address);
```

### Consensus Methods

```typescript
// Get all validators
const validators = await client.getValidators();

// Get specific validator
const validator = await client.getValidator(address);

// Get consensus status
const status = await client.getConsensusStatus();

// Get current era
const era = await client.getCurrentEra();

// Register as validator
const result = await client.registerValidator({
  address: validatorAddress,
  stake: '10000',
  commission: 10,
  signature: signatureHex
});

// Stake to validator
const stakeResult = await client.stake({
  staker: stakerAddress,
  validator: validatorAddress,
  amount: '1000',
  signature: signatureHex
});

// Unstake from validator
const unstakeResult = await client.unstake({
  staker: stakerAddress,
  validator: validatorAddress,
  amount: '500',
  signature: signatureHex
});

// Claim rewards
const rewards = await client.claimRewards({
  validator: validatorAddress,
  signature: signatureHex
});

// Get pending rewards
const pending = await client.getPendingRewards(validatorAddress);

// Get staking status
const stakingStatus = await client.getStakingStatus(address);
```

### Energy Methods

```typescript
// Get energy status
const energy = await client.getEnergy(address);
// { current: 850, max: 1000, regeneration_rate: 10 }
```

### DRC-369 NFT Methods

```typescript
// Get total supply
const supply = await client.drc369.totalSupply();

// Get token balance
const nftBalance = await client.drc369.balanceOf(ownerAddress);

// Get token owner
const owner = await client.drc369.ownerOf(tokenId);

// Get token URI
const uri = await client.drc369.tokenURI(tokenId);

// Get complete token info
const info = await client.drc369.getTokenInfo(tokenId);

// Check if soulbound
const soulbound = await client.drc369.isSoulbound(tokenId);

// Get physics properties
const physics = await client.drc369.getPhysics(tokenId);

// Set physics properties
const result = await client.drc369.setPhysics({
  tokenId,
  physics: { mass: 10, friction: 0.5 },
  signature: signatureHex
});

// Get dynamic state
const state = await client.drc369.getDynamicState(tokenId, 'level');

// Get multiple states
const states = await client.drc369.getStateBatch(tokenId, ['level', 'xp', 'kills']);
```

---

## WebSocket Subscriptions

```typescript
import { DemiurgeClient } from '@demiurge/sdk';

const client = new DemiurgeClient({
  rpcUrl: 'https://rpc.demiurge.cloud:9944',
  wsUrl: 'wss://rpc.demiurge.cloud:9944'
});

// Subscribe to new blocks
const unsubscribe = await client.subscribeNewBlocks((block) => {
  console.log('New block:', block.block_number);
});

// Subscribe to pending transactions
const unsubTx = await client.subscribeNewPendingTransactions((tx) => {
  console.log('New tx:', tx.tx_hash);
});

// Subscribe to validator status changes
const unsubValidator = await client.subscribeValidatorStatus(
  validatorAddress,
  (event) => {
    console.log('Validator event:', event);
  }
);

// Unsubscribe
unsubscribe();
```

---

## Error Handling

```typescript
import { DemiurgeClient, DemiurgeError } from '@demiurge/sdk';

try {
  const balance = await client.getBalance(invalidAddress);
} catch (error) {
  if (error instanceof DemiurgeError) {
    console.error('RPC Error:', error.code, error.message);
    // error.code: -32602 (invalid params)
  } else {
    console.error('Network error:', error);
  }
}
```

---

## TypeScript Types

```typescript
import type {
  Wallet,
  DemiurgeClient,
  Block,
  Transaction,
  TransactionResult,
  Validator,
  ConsensusStatus,
  Energy,
  DRC369Token,
  PhysicsProperties,
} from '@demiurge/sdk';
```

---

## Browser vs Node.js

The SDK works in both environments:

```typescript
// Browser
import { Wallet, DemiurgeClient } from '@demiurge/sdk';

// Node.js
const { Wallet, DemiurgeClient } = require('@demiurge/sdk');
```

For browser bundling, the SDK uses `@noble/ed25519` which requires:

```javascript
// vite.config.js
export default {
  define: {
    global: 'globalThis',
  },
};
```

---

## Examples

### Complete Transfer Flow

```typescript
import { Wallet, DemiurgeClient } from '@demiurge/sdk';

async function sendTokens() {
  // Create wallet
  const wallet = await Wallet.fromMnemonic(process.env.MNEMONIC!);
  
  // Connect to network
  const client = new DemiurgeClient({
    rpcUrl: 'https://rpc.demiurge.cloud:9944'
  });

  // Check balance
  const balance = await client.getBalance(wallet.address);
  console.log('Current balance:', Number(balance) / 100, 'CGT');

  // Prepare transaction
  const recipient = '0x1234567890abcdef...';
  const amount = '100'; // 1 CGT

  // Sign transaction
  const { signature } = await wallet.signTransactionAsync({
    to: recipient,
    amount,
    nonce: Date.now()
  });

  // Send transaction
  const result = await client.transfer({
    from: wallet.address,
    to: recipient,
    amount,
    signature
  });

  console.log('Transaction hash:', result.tx_hash);
  console.log('New balance:', result.new_sender_balance);
}
```

### Monitor New Blocks

```typescript
import { DemiurgeClient } from '@demiurge/sdk';

async function monitorBlocks() {
  const client = new DemiurgeClient({
    rpcUrl: 'https://rpc.demiurge.cloud:9944',
    wsUrl: 'wss://rpc.demiurge.cloud:9944'
  });

  let blockCount = 0;

  const unsubscribe = await client.subscribeNewBlocks((block) => {
    blockCount++;
    console.log(`Block #${block.block_number} - ${block.transaction_count} txs`);
    
    if (blockCount >= 10) {
      unsubscribe();
      console.log('Stopped after 10 blocks');
    }
  });
}
```

---

## Resources

- [RPC Reference](../developers/rpc-reference.md)
- [Wallet Extension](./WALLET_EXTENSION.md)
- [GitHub Repository](https://github.com/ALaustrup/Demiurge-Blockchain)
