# RPC Endpoint Status & Integration

**Last Updated**: January 22, 2026  
**Status**: ✅ Live and Operational

---

## Production RPC Endpoints

### HTTP JSON-RPC
```
https://rpc.demiurge.cloud
```

### WebSocket JSON-RPC  
```
wss://rpc.demiurge.cloud
```

### Metrics (Prometheus)
```
http://127.0.0.1:9615/metrics
```

---

## Available Pallets (11 Total)

Post-custom-build (compile in progress):

| Pallet | Status | Query Method | Example |
|--------|--------|-------------|---------|
| **pallet-cgt** | ✅ Ready | `query.cgt.*` | Get reward pools |
| **pallet-qor-identity** | ✅ Ready | `query.qorIdentity.*` | Verify user identity |
| **pallet-drc369** | ✅ Ready | `query.drc369.*` | NFT metadata |
| **pallet-game-assets** | ✅ Ready | `query.gameAssets.*` | Asset balances |
| **pallet-composable-nfts** | ✅ Ready | `query.composableNfts.*` | Composite NFTs |
| **pallet-dex** | ✅ Ready | `query.dex.*` | Trading pairs |
| **pallet-fractional-assets** | ✅ Ready | `query.fractionalAssets.*` | Fractional assets |
| **pallet-drc369-ocw** | ✅ Ready | `query.drc369Ocw.*` | Off-chain workers |
| **pallet-governance** | ✅ Ready | `query.governance.*` | Proposals |
| **pallet-session-keys** | ✅ Ready | `query.sessionKeys.*` | Validator keys |
| **pallet-yield-nfts** | ✅ Ready | `query.yieldNfts.*` | Yield NFTs |

---

## Quick Integration

### JavaScript/TypeScript

```typescript
import { ApiPromise, WsProvider } from '@polkadot/api';

// Connect to production RPC
const provider = new WsProvider('wss://rpc.demiurge.cloud');
const api = await ApiPromise.create({ provider });

// Query chain info
const chain = await api.rpc.system.chain();
console.log('Chain:', chain);

// Query account balance
const account = await api.query.system.account('5GrwvaEF...');
console.log('Balance:', account.data.free.toString());

// Get all pallets
api.registry.pallets.forEach(pallet => {
  console.log(pallet.name);
});
```

### HTTP JSON-RPC

```bash
# Get chain name
curl -X POST https://rpc.demiurge.cloud \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"system_chain",
    "params":[],
    "id":1
  }'

# Get current block
curl -X POST https://rpc.demiurge.cloud \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"chain_getHeader",
    "params":[],
    "id":1
  }'
```

### Python

```python
from substrateinterface import SubstrateInterface

substrate = SubstrateInterface(
    url='wss://rpc.demiurge.cloud',
    ss58_format=42
)

# Get chain info
chain = substrate.get_chain()
print(f"Chain: {chain}")

# Query account
account = substrate.query('System', 'Account',
    params=['5GrwvaEF5zXb26Fz9rcQkQJRP64s19S7syE7aYtV5ptPXqV5'])
print(f"Balance: {account['data']['free']}")
```

---

## Common Queries

### Chain Status

```bash
# Check if node is synced
curl https://rpc.demiurge.cloud -X POST \
  -d '{"jsonrpc":"2.0","method":"system_health","params":[],"id":1}' \
  -H "Content-Type: application/json" | jq .
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "peers": 0,
    "isSyncing": false,
    "shouldHavePeers": false
  },
  "id": 1
}
```

### Get Metadata

```bash
curl https://rpc.demiurge.cloud -X POST \
  -d '{"jsonrpc":"2.0","method":"state_getMetadata","params":[],"id":1}' \
  -H "Content-Type: application/json"
```

### Query CGT Reward Pool

```bash
curl https://rpc.demiurge.cloud -X POST \
  -d '{
    "jsonrpc":"2.0",
    "method":"state_getStorage",
    "params":["0x...storage_key..."],
    "id":1
  }' \
  -H "Content-Type: application/json"
```

---

## Rate Limiting

**Current Limits** (per IP):
- HTTP: 100 requests/second
- WebSocket: Unlimited (long-lived connections)
- Burst: 200 requests

**Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1234567890
```

---

## Uptime & SLA

**Target**: 99.9% uptime

**Monitoring**:
- 60-second health checks via `demiurge-rpc-monitor`
- Prometheus metrics collection
- Nginx monitoring

**Failover**: Configured for multi-node deployment

---

## Cost Structure

**Current**: Free public RPC endpoint

**Usage**:
- ✅ Unlimited read queries
- ✅ WebSocket subscriptions
- ✅ Transaction broadcasting
- ✅ Metadata queries

---

## Support & Status

**Status Page**: https://demiurge.cloud/status

**Support**: dev@demiurge.cloud

**Known Issues**: None

---

## Migration Guide

If switching from another RPC endpoint:

### Before (Old Endpoint)
```typescript
const provider = new WsProvider('ws://localhost:9944');
```

### After (New Endpoint)
```typescript
const provider = new WsProvider('wss://rpc.demiurge.cloud');
```

No code changes required beyond the URL!

---

## Performance Tips

### Connection Pooling

```typescript
// Reuse single connection for multiple queries
const api = await ApiPromise.create({ provider });

const results = await Promise.all([
  api.query.system.account(address1),
  api.query.system.account(address2),
  api.query.gameAssets.account(assetId, address)
]);
```

### Batch Queries

```typescript
const results = await api.queryMulti([
  [api.query.system.account, address1],
  [api.query.system.account, address2],
  [api.query.system.account, address3]
]);
```

### Subscribe to Events

```typescript
const unsubscribe = await api.rpc.chain.subscribeFinalizedHeads((header) => {
  console.log(`New finalized block: #${header.number}`);
});
```

---

## Endpoint History

| Date | Change |
|------|--------|
| 2026-01-22 | Production RPC live with official Substrate image |
| 2026-01-22 (post-build) | Custom runtime with 11 pallets activated |

---

**For complete integration documentation**, see [HUB_QOR_INTEGRATION_GUIDE.md](./HUB_QOR_INTEGRATION_GUIDE.md)
