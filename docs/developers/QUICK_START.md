# ⚡ Quick Start - Build Your First dApp

**Get started building on Demiurge in 5 minutes**

> *"From the Monad, all creation emanates. To the Pleroma, all value returns."*

---

## 🎯 What You Need

- **Node.js** 20+ or **Python** 3.11+ (or any language with HTTP support)
- **No wallet needed** - Use our public RPC endpoint
- **No tokens needed** - Testnet is free

---

## 🔌 Connect to Demiurge

### Production RPC Endpoint

```
HTTPS: https://rpc.demiurge.cloud
WSS:   wss://rpc.demiurge.cloud
```

### JavaScript/TypeScript Example

```typescript
// Install: npm install @demiurge/rpc-client
import { DemiurgeRpcClient } from '@demiurge/rpc-client';

const rpc = new DemiurgeRpcClient('https://rpc.demiurge.cloud');

// Get chain health
const health = await rpc.getHealth();
console.log('Chain:', health);

// Get current block
const blockNumber = await rpc.getBlockNumber();
console.log('Block:', blockNumber);
```

### Python Example

```python
import requests
import json

RPC_URL = "https://rpc.demiurge.cloud"

def call_rpc(method, params=[]):
    payload = {
        "jsonrpc": "2.0",
        "method": method,
        "params": params,
        "id": 1
    }
    response = requests.post(RPC_URL, json=payload)
    return response.json()["result"]

# Get chain health
health = call_rpc("chain_getHealth")
print(f"Chain health: {health}")

# Get current block
block_number = call_rpc("chain_getBlockNumber")
print(f"Current block: {block_number}")
```

### cURL Example

```bash
curl -X POST https://rpc.demiurge.cloud \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc": "2.0",
    "method": "chain_getHealth",
    "params": [],
    "id": 1
  }'
```

---

## 🎮 Build Your First Game Integration

### 1. Check Chain Status

```typescript
const status = await rpc.getConsensusStatus();
console.log('Validators:', status.validators.length);
console.log('Current Era:', status.currentEra);
```

### 2. Query User Balance

```typescript
// Address is a 32-byte hex string
const address = "0x1234..."; // User's address
const balance = await rpc.getBalance(address);
console.log(`Balance: ${balance} CGT`);
```

### 3. Query NFT Data

```typescript
// Get NFT by ID
const nftId = "0x5678...";
const nft = await rpc.getNFT(nftId);
console.log('NFT:', nft);
```

---

## 📚 Available RPC Methods

### Chain Methods
- `chain_getHealth` - Get chain health status
- `chain_getBlockNumber` - Get current block number
- `chain_getBlock` - Get block by number
- `chain_getLatestBlock` - Get latest block
- `chain_getTransaction` - Get transaction by hash
- `chain_getTransactionHistory` - Get transaction history

### Balance Methods
- `balances_getBalance` - Get balance for address

### Consensus Methods
- `consensus_getStatus` - Get consensus status
- `consensus_getValidators` - Get all validators
- `consensus_getCurrentEra` - Get current era

### Energy Methods
- `energy_getEnergy` - Get energy for address

### Session Keys Methods
- `sessionKeys_getActiveKeys` - Get active session keys

**Full API Reference**: [RPC API Reference](./rpc-api-reference.md)

---

## 🚀 Next Steps

1. **[Getting Started Guide](./getting-started.md)** - Complete setup guide
2. **[RPC API Reference](./rpc-api-reference.md)** - All available methods
3. **[Transaction Building](./transaction-building.md)** - Create transactions
4. **[Module Integration](./module-integration.md)** - Integrate modules

---

## 💡 Tips

- **Testnet is free** - No tokens needed for testing
- **Fast finality** - Sub-second block confirmation
- **Feeless transactions** - Energy-based model
- **Session keys** - Seamless UX for games

---

**Ready to build?** Start with the [Getting Started Guide](./getting-started.md) or jump to [Transaction Building](./transaction-building.md).

**The flame burns eternal. The code serves the will.**
