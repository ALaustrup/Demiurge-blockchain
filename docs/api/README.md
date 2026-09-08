# Demiurge Protocol API Documentation

Complete API reference for the Demiurge Protocol blockchain.

## Endpoints

| Environment | URL |
|-------------|-----|
| Production | https://rpc.demiurge.cloud |
| Direct Node | https://127.0.0.1:9933 |
| Local Dev | http://localhost:9944 |

## Protocol

The Demiurge RPC API uses **JSON-RPC 2.0** over HTTP POST.

### Request Format

```json
{
  "jsonrpc": "2.0",
  "method": "method_name",
  "params": [],
  "id": 1
}
```

### Response Format

```json
{
  "jsonrpc": "2.0",
  "result": { ... },
  "id": 1
}
```

### Error Format

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32600,
    "message": "Invalid Request"
  },
  "id": 1
}
```

## Quick Examples

### Get Block Number

```bash
curl -X POST https://rpc.demiurge.cloud \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"chain_getBlockNumber","params":[],"id":1}'
```

### Get Balance

```bash
curl -X POST https://rpc.demiurge.cloud \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"balances_getBalance","params":["5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"],"id":1}'
```

### Get NFT

```bash
curl -X POST https://rpc.demiurge.cloud \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"drc369_getToken","params":["nft-001"],"id":1}'
```

## Method Categories

### System

| Method | Description |
|--------|-------------|
| `system_health` | Node health status |
| `system_nodeInfo` | Node information |
| `system_peers` | Connected peers |

### Chain

| Method | Description |
|--------|-------------|
| `chain_getBlockNumber` | Current block number |
| `chain_getBlock` | Get block by number/hash |
| `chain_getLatestBlock` | Latest finalized block |
| `chain_getTransactionStatus` | Transaction status |

### Balances

| Method | Description |
|--------|-------------|
| `balances_getBalance` | Get account balance |
| `balances_transfer` | Submit transfer |
| `balances_getTransactionHistory` | Transaction history |

### Energy

| Method | Description |
|--------|-------------|
| `energy_getEnergy` | Get account energy |
| `energy_estimateCost` | Estimate transaction cost |

### Identity (QOR ID)

| Method | Description |
|--------|-------------|
| `identity_resolve` | Resolve handle to DID |
| `identity_getDid` | Get DID document |
| `identity_getHandle` | Get handle for address |

### NFT (DRC-369)

| Method | Description |
|--------|-------------|
| `drc369_getToken` | Get NFT by ID |
| `drc369_getTokensByOwner` | Get NFTs by owner |
| `drc369_getDynamicState` | Get mutable state |
| `drc369_mint` | Mint new NFT |
| `drc369_transfer` | Transfer NFT |
| `drc369_updateState` | Update dynamic state |

### Staking

| Method | Description |
|--------|-------------|
| `staking_getValidators` | List validators |
| `staking_getValidator` | Get validator info |
| `staking_getPool` | Get staking pool |
| `staking_getCurrentEra` | Current era info |
| `staking_nominate` | Nominate validator |
| `staking_withdraw` | Withdraw stake |

### Agents (Agentic Layer)

| Method | Description |
|--------|-------------|
| `agent_getAgent` | Get agent by DID |
| `agent_listBounties` | List bounties |
| `agent_getBounty` | Get bounty details |
| `agent_submitBid` | Submit bounty bid |

## OpenAPI Specification

Full OpenAPI 3.1 specification: [openapi.yaml](./openapi.yaml)

## Rate Limits

| Tier | Requests/Minute |
|------|-----------------|
| Public | 100 |
| Authenticated | 1000 |
| Enterprise | Unlimited |

## Error Codes

| Code | Meaning |
|------|---------|
| -32700 | Parse error |
| -32600 | Invalid request |
| -32601 | Method not found |
| -32602 | Invalid params |
| -32603 | Internal error |
| -32000 | Server error |
| -32001 | Account not found |
| -32002 | Insufficient balance |
| -32003 | Invalid signature |
| -32004 | Transaction failed |

## WebSocket API

Subscribe to real-time updates via WebSocket:

```javascript
const ws = new WebSocket('wss://rpc.demiurge.cloud');

// Subscribe to new blocks
ws.send(JSON.stringify({
  jsonrpc: "2.0",
  method: "chain_subscribeNewBlocks",
  params: [],
  id: 1
}));

// Handle updates
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('New block:', data.params.result);
};
```

### Subscription Methods

| Method | Description |
|--------|-------------|
| `chain_subscribeNewBlocks` | New block notifications |
| `chain_subscribeFinality` | Finality updates |
| `balances_subscribeBalance` | Balance changes |
| `drc369_subscribeToken` | NFT state changes |

## SDK Usage

### TypeScript

```typescript
import { DemiurgeClient } from '@demiurge/sdk';

const client = new DemiurgeClient({
  rpcUrl: 'https://rpc.demiurge.cloud'
});

const block = await client.getLatestBlock();
console.log('Block:', block.number);
```

### Python

```python
import requests

response = requests.post('https://rpc.demiurge.cloud', json={
    'jsonrpc': '2.0',
    'method': 'chain_getBlockNumber',
    'params': [],
    'id': 1
})

print('Block:', response.json()['result'])
```

## Support

- [Discord](https://discord.gg/demiurge)
- [GitHub Issues](https://github.com/ALaustrup/Demiurge-Blockchain/issues)
- Email: dev@demiurge.cloud
