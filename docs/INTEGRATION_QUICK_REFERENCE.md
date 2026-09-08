# Demiurge Blockchain Integration Quick Reference

## Active Endpoints

### RPC Endpoints (Production)
```
HTTP JSON-RPC:     http://127.0.0.1:19933
WebSocket JSON-RPC: ws://127.0.0.1:19944
Prometheus Metrics: http://127.0.0.1:9615/metrics
P2P Port:          127.0.0.1:30333
```

### Docker Network (Same Host)
```
HTTP JSON-RPC:     http://demiurge-blockchain-node:9933
WebSocket JSON-RPC: ws://demiurge-blockchain-node:9944
Container Name:    demiurge-blockchain-node
Network:           demiurge_default
```

## Service Integration URLs

### For Hub Service

**Node Metadata Query**
```bash
curl -X POST http://127.0.0.1:19933 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"state_getMetadata",
    "params":[],
    "id":1
  }'
```

**Available Pallets**
```javascript
const { ApiPromise, WsProvider } = require('@polkadot/api');

const api = await ApiPromise.create({
  provider: new WsProvider('ws://127.0.0.1:19944')
});

// List all available pallets
api.registry.pallets.forEach(pallet => {
  console.log(pallet.name);
});
```

### For QOR ID Service

**Session Key Rotation**
```bash
curl -X POST http://127.0.0.1:19933 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"author_rotateKeys",
    "params":[],
    "id":1
  }'
```

**Identity Verification**
```javascript
// Link QOR ID to on-chain identity
const tx = api.tx.qorIdentity.setIdentity({
  display: 'Hub User Name',
  web: 'https://hub.demiurge.io',
  email: 'user@example.com',
  riot: 'qor:qor-id-credential'
});

await tx.signAndSend(keyring.getPair(address));
```

## Available Pallets

| Pallet | Module Name | Primary Functions |
|--------|-------------|-------------------|
| **pallet-cgt** | `cgt` | Creator rewards, token emissions |
| **pallet-qor-identity** | `qorIdentity` | User identity, verification |
| **pallet-drc369** | `drc369` | NFT standards, metadata |
| **pallet-game-assets** | `gameAssets` | In-game assets, management |
| **pallet-energy** | `energy` | Energy/staking mechanics |
| **pallet-composable-nfts** | `composableNfts` | Composite NFT creation |
| **pallet-dex** | `dex` | Trading pairs, swaps |
| **pallet-fractional-assets** | `fractionalAssets` | Asset fractionalization |
| **pallet-drc369-ocw** | `drc369Ocw` | Off-chain workers |
| **pallet-governance** | `governance` | DAO proposals, voting |
| **pallet-session-keys** | `sessionKeys` | Validator session keys |
| **pallet-yield-nfts** | `yieldNfts` | Yield-bearing NFTs |

## Common Queries

### Node Status
```bash
# Chain name
curl -X POST http://127.0.0.1:19933 \
  -d '{"jsonrpc":"2.0","method":"system_chain","params":[],"id":1}'

# Node name
curl -X POST http://127.0.0.1:19933 \
  -d '{"jsonrpc":"2.0","method":"system_name","params":[],"id":1}'

# Node version
curl -X POST http://127.0.0.1:19933 \
  -d '{"jsonrpc":"2.0","method":"system_version","params":[],"id":1}'
```

### Account Queries
```bash
# Get account balance
curl -X POST http://127.0.0.1:19933 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"state_call",
    "params":["AccountNonceApi_account_nonce", "ADDRESS_HEX"],
    "id":1
  }'
```

### Block Information
```bash
# Get current block
curl -X POST http://127.0.0.1:19933 \
  -d '{"jsonrpc":"2.0","method":"chain_getHeader","params":[],"id":1}'

# Get finalized block
curl -X POST http://127.0.0.1:19933 \
  -d '{"jsonrpc":"2.0","method":"chain_getFinalizedHead","params":[],"id":1}'

# Get block details
curl -X POST http://127.0.0.1:19933 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"chain_getBlock",
    "params":["0xBLOCK_HASH"],
    "id":1
  }'
```

### Network Information
```bash
# Get connected peers
curl -X POST http://127.0.0.1:19933 \
  -d '{"jsonrpc":"2.0","method":"system_peers","params":[],"id":1}'

# Add reserved peer
curl -X POST http://127.0.0.1:19933 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"system_addReservedPeer",
    "params":["PEER_MULTIADDR"],
    "id":1
  }'
```

## JavaScript/Node.js Integration (Polkadot.js)

### Basic Setup
```javascript
const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring } = require('@polkadot/keyring');

// Connect
const provider = new WsProvider('ws://127.0.0.1:19944');
const api = await ApiPromise.create({ provider });

// Keyring for signing
const keyring = new Keyring({ type: 'sr25519', ss58Format: 42 });
const account = keyring.addFromMnemonic('twelve word mnemonic phrase here');

console.log(`Connected to: ${await api.rpc.system.chain()}`);
```

### Query Examples
```javascript
// Query storage
const account = await api.query.system.account('5GrwvaEF5zXb26Fz9rcQkQJRP64s19S7syE7aYtV5ptPXqV5');
console.log(`Nonce: ${account.nonce}`);
console.log(`Free balance: ${account.data.free}`);

// Batch queries
const results = await api.queryMulti([
  [api.query.system.account, address1],
  [api.query.system.account, address2],
  [api.query.gameAssets.account, assetId]
]);

// Subscribe to events
const unsubscribe = await api.query.system.events((events) => {
  events.forEach(record => {
    const { event, phase } = record;
    console.log(`Event: ${event.section}.${event.method}`);
  });
});
```

### Transaction Examples
```javascript
// Transfer
const tx = api.tx.balances.transferAllowDeath(address, amount);
const hash = await tx.signAndSend(account);

// Staking
const tx = api.tx.staking.bond(amount, 'Staked');
const hash = await tx.signAndSend(account);

// Governance
const tx = api.tx.governance.submitProposal(proposalData);
const hash = await tx.signAndSend(account);

// Listen for result
api.once('finalized', (header) => {
  console.log(`Transaction finalized at block #${header.number}`);
});
```

## Python Integration (Substrateinterface)

```python
from substrateinterface import SubstrateInterface

substrate = SubstrateInterface(
    url='ws://127.0.0.1:19944',
    ss58_format=42,
    type_registry_preset='kusama'
)

# Query balance
account = substrate.query('System', 'Account',
    params=['5GrwvaEF5zXb26Fz9rcQkQJRP64s19S7syE7aYtV5ptPXqV5'])
print(f"Free balance: {account['data']['free']}")

# Subscribe to events
def callback(obj, update_nr, subscription_handler):
    if 'data' in obj:
        for event in obj['data']:
            print(f"Event: {event['event']['module']['prefix']}.{event['event']['call_index']}")

substrate.subscribe_block_headers(callback)
```

## Health Monitoring

### Check Node Health
```bash
# Via RPC health endpoint
curl -f http://127.0.0.1:19933/health || echo "Unhealthy"

# Check specific RPC methods
curl -s -X POST http://127.0.0.1:19933 \
  -d '{"jsonrpc":"2.0","method":"system_health","params":[],"id":1}' | jq '.result'
```

### Monitor Metrics (Prometheus)
```bash
# Get all metrics
curl -s http://127.0.0.1:9615/metrics | head -50

# Grep specific metrics
curl -s http://127.0.0.1:9615/metrics | grep substrate_node
curl -s http://127.0.0.1:9615/metrics | grep block_height
curl -s http://127.0.0.1:9615/metrics | grep network_peers
```

## Docker Commands

```bash
# View logs
docker logs demiurge-blockchain-node
docker logs -f --tail 50 demiurge-blockchain-node

# Inspect container
docker inspect demiurge-blockchain-node | jq '.[] | {State, NetworkSettings}'

# Get network info
docker network inspect demiurge_default

# Check resource usage
docker stats demiurge-blockchain-node
```

## Current Build Status

- **Node Image**: Custom build in progress (started ~08:05 UTC)
- **Status**: Compiling with all 11 pallets
- **ETA**: 30-60 minutes
- **Output**: Docker image `localhost:5000/demiurge-node:latest`

**Monitor Build**:
```bash
ssh pleroma "tail -50 ~/demiurge/build.log"
```

## Post-Build Next Steps

1. Verify build completion
2. Deploy custom Docker image
3. Extract and encode genesis WASM
4. Deploy custom chain specification
5. Verify all RPC endpoints responding
6. Run integration tests with Hub/QOR
7. Configure multi-node setup (optional)

See [POST_BUILD_DEPLOYMENT.md](./POST_BUILD_DEPLOYMENT.md) for detailed steps.

## Support & Documentation

- [Blockchain Deployment Guide](./BLOCKCHAIN_NODE_DEPLOYMENT.md)
- [Advanced Multi-Node Deployment](./ADVANCED_MULTI_NODE_DEPLOYMENT.md)
- [Hub/QOR Integration Guide](./HUB_QOR_INTEGRATION_GUIDE.md)
- [Post-Build Deployment](./POST_BUILD_DEPLOYMENT.md)

## Emergency Contacts

**Server Admin**: ubuntu@127.0.0.1
**SSH Key**: ~/.ssh/id_ed25519
**Build Script**: ~/demiurge/scripts/build-on-server.sh
**Docker Registry**: localhost:5000 (on pleroma)
