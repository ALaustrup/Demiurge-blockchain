# Hub/QOR Service Integration Guide

This guide covers integrating the Demiurge blockchain with Hub and QOR ID services via RPC endpoints.

## Quick Integration Reference

### Production RPC Endpoints
- **HTTP JSON-RPC**: `http://127.0.0.1:19933`
- **WebSocket JSON-RPC**: `ws://127.0.0.1:19944`
- **Metrics (Prometheus)**: `http://127.0.0.1:9615`

### Docker-Based Direct Access (Same Host)
```bash
# If Hub/QOR runs on same Docker network
HTTP_RPC_URL=http://demiurge-blockchain-node:9933
WS_RPC_URL=ws://demiurge-blockchain-node:9944
```

## Node.js/JavaScript Integration

### 1. Using Polkadot.js (Recommended)

```javascript
const { ApiPromise, WsProvider } = require('@polkadot/api');

// Connect to Demiurge blockchain
async function connectToDemiurge() {
  const provider = new WsProvider('ws://127.0.0.1:19944');
  const api = await ApiPromise.create({ provider });
  
  // Get chain information
  const [chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version()
  ]);
  
  console.log(`Chain: ${chain}`);
  console.log(`Node: ${nodeName} v${nodeVersion}`);
  
  return api;
}

// Example: Query balances
async function getBalance(api, address) {
  const account = await api.query.system.account(address);
  return account.data.free.toString();
}

// Example: Subscribe to new blocks
async function watchBlocks(api) {
  const unsubscribe = await api.rpc.chain.subscribeNewHeads((header) => {
    console.log(`Block #${header.number}: ${header.hash}`);
  });
  return unsubscribe;
}
```

### 2. Direct HTTP Calls

```javascript
async function queryViHttp(method, params = []) {
  const response = await fetch('http://127.0.0.1:19933', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: `${method}`,
      params: params,
      id: 1
    })
  });
  
  const data = await response.json();
  return data.result;
}

// Get chain name
const chainName = await queryViaHttp('system_chain');
console.log(`Chain: ${chainName}`);

// Get node metadata
const metadata = await queryViaHttp('system_nodeMetadata');
console.log(`Metadata: ${metadata}`);
```

## Python Integration

### Using Substrateinterface

```python
from substrateinterface import SubstrateInterface

# Connect to Demiurge
substrate = SubstrateInterface(
    url='ws://127.0.0.1:19944',
    ss58_format=42,
    type_registry_preset='kusama'
)

# Get chain info
chain = substrate.get_chain()
print(f"Chain: {chain}")

# Query balance
account = substrate.query('System', 'Account', 
    params=['5GrwvaEF5zXb26Fz9rcQkQJRP64s19S7syE7aYtV5ptPXqV5'])
free_balance = account['data']['free']
print(f"Balance: {free_balance}")

# Get current block
block = substrate.get_block()
block_number = block['header']['number']
print(f"Current block: #{block_number}")
```

## Available Pallets & Modules

### Core Pallets (11 implemented)

| Pallet | Namespace | Key Functions |
|--------|-----------|----------------|
| **pallet-cgt** | `cgt` | Creative rewards system |
| **pallet-qor-identity** | `qorIdentity` | Identity management |
| **pallet-drc369** | `drc369` | Standard NFT trait |
| **pallet-game-assets** | `gameAssets` | In-game asset management |
| **pallet-energy** | `energy` | Energy/staking system |
| **pallet-composable-nfts** | `composableNfts` | Composite NFT creation |
| **pallet-dex** | `dex` | Decentralized exchange |
| **pallet-fractional-assets** | `fractionalAssets` | Asset fractionalization |
| **pallet-drc369-ocw** | `drc369Ocw` | Offchain worker integration |
| **pallet-governance** | `governance` | DAO governance |
| **pallet-session-keys** | `sessionKeys` | Session key management |
| **pallet-yield-nfts** | `yieldNfts` | Yield-generating NFTs |

### Query Examples

```javascript
// Get CGT reward pool
const cgtPool = await api.query.cgt.rewardPool();

// Get QOR identity info
const identity = await api.query.qorIdentity.identityOf('5GrwvaEF...');

// Get game assets balance
const assetBalance = await api.query.gameAssets.account(assetId, accountId);

// Get DEX trading pairs
const pairs = await api.query.dex.tradingPairs();

// Get governance proposals
const proposals = await api.query.governance.proposals.entries();
```

## Hub Service Integration

### 1. Account & Authentication

Connect Hub authentication to blockchain identity system:

```javascript
// After user authenticates with Hub
async function registerHubUserOnChain(hubUserId, address) {
  const api = await connectToDemiurge();
  
  // Store mapping: Hub user ID → On-chain address
  // This requires a custom pallet or offchain indexing
  
  const tx = api.tx.qorIdentity.setIdentity({
    display: `hub:${hubUserId}`,
    web: 'https://hub.demiurge.io'
  });
  
  return tx;
}
```

### 2. Asset Management

Sync Hub assets with blockchain:

```javascript
// Create game asset on chain
async function createGameAsset(assetId, metadata) {
  const api = await connectToDemiurge();
  
  const tx = api.tx.gameAssets.create(
    assetId,
    // owner
    account,
    // min_balance
    1000000
  );
  
  return signAndSend(tx, keyring);
}

// Query Hub assets on blockchain
async function getHubAssetBalance(address, assetId) {
  const api = await connectToDemiurge();
  const balance = await api.query.gameAssets.account(assetId, address);
  return balance.balance.toString();
}
```

### 3. Social Integration

Query and update social data on-chain:

```javascript
// Update Hub user profile on blockchain
async function updateHubProfile(address, profileData) {
  const api = await connectToDemiurge();
  
  const tx = api.tx.qorIdentity.setIdentity({
    display: profileData.name,
    web: profileData.website,
    email: profileData.email,
    image: profileData.avatar
  });
  
  return signAndSend(tx, keyring);
}

// Subscribe to user identity changes
async function watchUserIdentityChanges(address) {
  const api = await connectToDemiurge();
  
  const unsubscribe = await api.query.system.account(address, (account) => {
    console.log(`Account updated: ${account.data.free} free balance`);
  });
  
  return unsubscribe;
}
```

## QOR ID Service Integration

### 1. Session Key Management

```javascript
// Get current session keys for validator
async function getSessionKeys(validatorAddress) {
  const api = await connectToDemiurge();
  
  const keys = await api.query.sessionKeys.nextKeys(validatorAddress);
  return {
    aura: keys.aura.toString(),
    grandpa: keys.grandpa.toString()
  };
}

// Set session keys (requires sudo or origin call)
async function setSessionKeys(validatorAddress, keys) {
  const api = await connectToDemiurge();
  
  const tx = api.tx.sessionKeys.setKeys(keys);
  
  return signAndSend(tx, keyring);
}
```

### 2. Identity Verification

```javascript
// Link QOR ID to on-chain identity
async function linkQorId(qorIdCredential, address) {
  const api = await connectToDemiurge();
  
  const tx = api.tx.qorIdentity.setIdentity({
    display: qorIdCredential.name,
    legal: qorIdCredential.legal_name,
    web: qorIdCredential.website,
    email: qorIdCredential.email,
    image: qorIdCredential.avatar,
    riot: `qor:${qorIdCredential.qor_id}`
  });
  
  return signAndSend(tx, keyring);
}

// Verify linked QOR ID
async function verifyQorIdLink(address) {
  const api = await connectToDemiurge();
  
  const identity = await api.query.qorIdentity.identityOf(address);
  
  if (identity.isSome) {
    const info = identity.unwrap();
    // Check if QOR ID is in the riot field
    return info.riot && info.riot.includes('qor:');
  }
  
  return false;
}
```

### 3. Governance Integration

```javascript
// QOR ID holders can participate in governance
async function submitGovernanceProposal(proposal, qorIdAddress) {
  const api = await connectToDemiurge();
  
  // Verify QOR ID is valid
  const qorIdentity = await api.query.qorIdentity.identityOf(qorIdAddress);
  if (qorIdentity.isNone) {
    throw new Error('QOR ID not verified');
  }
  
  // Submit proposal
  const tx = api.tx.governance.submitProposal(proposal);
  
  return signAndSend(tx, keyring);
}

// Vote on proposal (QOR ID required)
async function voteOnProposal(proposalId, vote, qorIdAddress) {
  const api = await connectToDemiurge();
  
  // Verify voting power based on QOR ID
  const identity = await api.query.qorIdentity.identityOf(qorIdAddress);
  
  const tx = api.tx.governance.vote(proposalId, vote);
  
  return signAndSend(tx, keyring);
}
```

## Error Handling & Monitoring

### Connection Health Checks

```javascript
async function healthCheck(provider) {
  try {
    const isConnected = provider.isConnected;
    if (!isConnected) {
      console.error('Provider disconnected');
      // Attempt reconnect
      await provider.connect();
    }
    
    const api = await ApiPromise.create({ provider });
    const chain = await api.rpc.system.chain();
    
    console.log(`✅ Blockchain health: ${chain}`);
    return true;
  } catch (error) {
    console.error(`❌ Blockchain health check failed: ${error.message}`);
    return false;
  }
}

// Monitor connection
setInterval(() => healthCheck(provider), 60000);
```

### Error Retry Logic

```javascript
async function queryWithRetry(fn, maxRetries = 3) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${i + 1} failed: ${error.message}`);
      
      if (i < maxRetries - 1) {
        // Wait before retry: exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, i) * 1000)
        );
      }
    }
  }
  
  throw lastError;
}

// Usage
const balance = await queryWithRetry(
  () => api.query.system.account(address)
);
```

## Performance Optimization

### Batch Queries

```javascript
// Query multiple accounts efficiently
async function getMultipleBalances(addresses) {
  const api = await connectToDemiurge();
  
  // Use queryMulti for efficient batch queries
  const results = await api.queryMulti(
    addresses.map(addr => [api.query.system.account, addr])
  );
  
  return results.map((r, i) => ({
    address: addresses[i],
    balance: r.data.free.toString()
  }));
}
```

### Event Subscriptions

```javascript
// Subscribe to specific events efficiently
async function watchGameAssetTransfers(assetId) {
  const api = await connectToDemiurge();
  
  const unsubscribe = await api.query.system.events((events) => {
    events.forEach(record => {
      const { event } = record;
      
      if (event.section === 'gameAssets' && 
          event.method === 'Transfer') {
        const [asset, from, to, amount] = event.data;
        
        if (asset.toNumber() === assetId) {
          console.log(`Transfer: ${from} → ${to}: ${amount}`);
        }
      }
    });
  });
  
  return unsubscribe;
}
```

## Deployment Checklist

- [ ] RPC endpoints accessible from Hub/QOR services
- [ ] Firewall rules allow outbound connections to blockchain
- [ ] SSL/TLS enabled for production (use nginx proxy)
- [ ] Connection pooling configured for high throughput
- [ ] Error monitoring and alerts set up
- [ ] Rate limiting implemented if public RPC
- [ ] Load balancing configured (if multiple services)
- [ ] Backup RPC endpoints configured for failover
- [ ] Documentation updated with new endpoints
- [ ] Integration tests passing

## References

- [Polkadot.js Documentation](https://polkadot.js.org/docs/)
- [Substrate RPC API](https://docs.substrate.io/reference/substrate-runtime-api/)
- [Demiurge Blockchain Deployment Guide](./BLOCKCHAIN_NODE_DEPLOYMENT.md)
- [Multi-Node Setup](./MULTI_NODE_DEPLOYMENT.md)
