# 🔨 Transaction Building Guide

**Complete guide for creating and submitting transactions**

> *"The ancient ritual of transaction creation requires precision and understanding."*

---

## 🎯 Overview

Transactions on Demiurge are:
- **Signed** - Using Ed25519 cryptography
- **Energy-based** - Consume energy instead of fees
- **Fast** - Sub-second confirmation
- **Final** - < 2 seconds finality

---

## 📝 Transaction Structure

### Basic Transaction

```typescript
interface Transaction {
  from: string;           // Sender address (hex)
  to: string;             // Recipient address (hex)
  value: string;          // Amount in Sparks
  nonce: number;          // Transaction nonce
  timestamp: number;      // Unix timestamp
  signature: string;     // Ed25519 signature (hex)
}
```

### Module-Specific Transactions

```typescript
interface ModuleTransaction extends Transaction {
  module: string;         // Module name (e.g., "balances", "drc369")
  method: string;        // Method name (e.g., "transfer", "mint")
  params: any;           // Method parameters
}
```

---

## 🔐 Signing Transactions

### Step 1: Create Transaction Payload

```typescript
import { DemiurgeRpcClient } from '@demiurge/rpc-client';

const client = new DemiurgeRpcClient('https://rpc.demiurge.cloud');

// Get current nonce
const nonce = await client.getNonce('0x1234...');

// Create transaction payload
const txPayload = {
  from: '0x1234...',
  to: '0x5678...',
  value: '1000000000000000000', // 10 CGT
  nonce: nonce,
  timestamp: Math.floor(Date.now() / 1000)
};
```

### Step 2: Serialize Transaction

```typescript
// Serialize transaction for signing
function serializeTransaction(tx: Transaction): Uint8Array {
  const encoder = new TextEncoder();
  const data = JSON.stringify({
    from: tx.from,
    to: tx.to,
    value: tx.value,
    nonce: tx.nonce,
    timestamp: tx.timestamp
  });
  return encoder.encode(data);
}
```

### Step 3: Sign Transaction

```typescript
// Sign transaction with Ed25519
import { SigningKey } from '@noble/ed25519';

const signingKey = SigningKey.fromSeed(seed);
const message = serializeTransaction(txPayload);
const signature = signingKey.sign(message);

// Convert signature to hex
const signatureHex = Buffer.from(signature).toString('hex');
```

### Step 4: Submit Transaction

```typescript
// Submit signed transaction
const result = await client.submitTransaction({
  ...txPayload,
  signature: `0x${signatureHex}`
});

console.log('Transaction hash:', result.hash);
console.log('Status:', result.status);
```

---

## 💰 Balance Transfer Transaction

### Complete Example

```typescript
async function transferCGT(
  from: string,
  to: string,
  amount: string,
  privateKey: Uint8Array
) {
  const client = new DemiurgeRpcClient('https://rpc.demiurge.cloud');
  
  // Check balance
  const balance = await client.getBalance(from);
  const amountBigInt = BigInt(amount);
  
  if (BigInt(balance.free) < amountBigInt) {
    throw new Error('Insufficient balance');
  }
  
  // Check energy
  const energy = await client.getEnergy(from);
  const requiredEnergy = 100; // Transfer requires 100 energy
  
  if (energy.current < requiredEnergy) {
    throw new Error('Insufficient energy');
  }
  
  // Get nonce
  const nonce = await client.getNonce(from);
  
  // Create transaction
  const txPayload = {
    from,
    to,
    value: amount,
    nonce,
    timestamp: Math.floor(Date.now() / 1000),
    module: 'balances',
    method: 'transfer'
  };
  
  // Sign transaction
  const signingKey = SigningKey.fromSeed(privateKey);
  const message = serializeTransaction(txPayload);
  const signature = signingKey.sign(message);
  const signatureHex = Buffer.from(signature).toString('hex');
  
  // Submit transaction
  const result = await client.submitTransaction({
    ...txPayload,
    signature: `0x${signatureHex}`
  });
  
  return result;
}
```

---

## 🎨 NFT Mint Transaction

### Mint DRC-369 NFT

```typescript
async function mintNFT(
  owner: string,
  nftData: {
    name: string;
    description: string;
    resources: any[];
    initial_state: any;
  },
  privateKey: Uint8Array
) {
  const client = new DemiurgeRpcClient('https://rpc.demiurge.cloud');
  
  // Check energy
  const energy = await client.getEnergy(owner);
  const requiredEnergy = 500; // Mint requires 500 energy
  
  if (energy.current < requiredEnergy) {
    throw new Error('Insufficient energy');
  }
  
  // Get nonce
  const nonce = await client.getNonce(owner);
  
  // Create transaction
  const txPayload = {
    from: owner,
    to: '0x0000...', // System address
    value: '0',
    nonce,
    timestamp: Math.floor(Date.now() / 1000),
    module: 'drc369',
    method: 'mint',
    params: nftData
  };
  
  // Sign and submit
  const signingKey = SigningKey.fromSeed(privateKey);
  const message = serializeTransaction(txPayload);
  const signature = signingKey.sign(message);
  const signatureHex = Buffer.from(signature).toString('hex');
  
  const result = await client.submitTransaction({
    ...txPayload,
    signature: `0x${signatureHex}`
  });
  
  return result;
}
```

---

## ⚡ Energy Considerations

### Check Energy Before Transaction

```typescript
async function checkEnergyForTransaction(
  address: string,
  transactionType: string
): Promise<boolean> {
  const client = new DemiurgeRpcClient('https://rpc.demiurge.cloud');
  
  // Energy costs by transaction type
  const energyCosts = {
    transfer: 100,
    mint_nft: 500,
    transfer_nft: 200,
    stake: 1000,
    unstake: 1000
  };
  
  const energy = await client.getEnergy(address);
  const requiredEnergy = energyCosts[transactionType] || 100;
  
  return energy.current >= requiredEnergy;
}
```

### Wait for Energy Regeneration

```typescript
async function waitForEnergy(
  address: string,
  requiredEnergy: number
): Promise<void> {
  const client = new DemiurgeRpcClient('https://rpc.demiurge.cloud');
  
  while (true) {
    const energy = await client.getEnergy(address);
    
    if (energy.current >= requiredEnergy) {
      return;
    }
    
    // Calculate blocks needed
    const energyNeeded = requiredEnergy - energy.current;
    const blocksNeeded = Math.ceil(energyNeeded / energy.regeneration_rate);
    
    console.log(`Waiting ${blocksNeeded} blocks for energy...`);
    
    // Wait for blocks (approximately 1 second per block)
    await new Promise(resolve => setTimeout(resolve, blocksNeeded * 1000));
  }
}
```

---

## 📊 Transaction Status Tracking

### Track Transaction

```typescript
async function trackTransaction(
  txHash: string,
  timeout: number = 30000
): Promise<any> {
  const client = new DemiurgeRpcClient('https://rpc.demiurge.cloud');
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const tx = await client.getTransaction(txHash);
    
    if (tx.status === 'confirmed') {
      return tx;
    }
    
    if (tx.status === 'failed') {
      throw new Error(`Transaction failed: ${tx.error}`);
    }
    
    // Wait 1 second before checking again
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error('Transaction timeout');
}
```

---

## 🔧 Error Handling

### Handle Transaction Errors

```typescript
try {
  const result = await transferCGT(from, to, amount, privateKey);
  console.log('Transaction successful:', result.hash);
} catch (error) {
  if (error.message.includes('Insufficient balance')) {
    console.error('Not enough balance');
  } else if (error.message.includes('Insufficient energy')) {
    console.error('Not enough energy');
  } else if (error.message.includes('Invalid signature')) {
    console.error('Invalid transaction signature');
  } else {
    console.error('Transaction failed:', error);
  }
}
```

---

## 📝 Best Practices

1. **Check Energy First** - Always check energy before creating transaction
2. **Handle Nonces** - Use correct nonce to prevent replay attacks
3. **Verify Signatures** - Always verify signatures before submission
4. **Track Status** - Monitor transaction status until confirmed
5. **Handle Errors** - Implement proper error handling

---

## 🔗 Related Documentation

- **[Chain Operations](./chain-operations.md)** - Querying blockchain state
- **[RPC API Reference](./rpc-api-reference.md)** - RPC methods
- **[Module Integration](./module-integration.md)** - Module-specific transactions

---

**The flame burns eternal. The code serves the will.**
