# Testnet Quickstart

**Last Updated:** February 4, 2026

Join the Demiurge testnet to test features without risking real assets.

---

## Testnet Overview

The Demiurge testnet provides:

- **Free test tokens** - Claim from faucet
- **Same features as mainnet** - Full functionality
- **Safe experimentation** - No real value at stake
- **Faster iteration** - Test before mainnet deployment

---

## Quick Start

### 1. Configure Network

**Browser Wallet:**
1. Open Demiurge Wallet extension
2. Click network selector (top right)
3. Select "Testnet"

**CLI:**
```bash
export DEMIURGE_RPC_URL=https://testnet.demiurge.cloud:9944
```

**SDK:**
```typescript
const client = new DemiurgeClient({
  rpcUrl: 'https://testnet.demiurge.cloud:9944'
});
```

---

### 2. Get Test Tokens

**Via Wallet Extension:**
1. Ensure you're on testnet
2. Click "Claim Starter Tokens"
3. Receive 100 tCGT instantly

**Via CLI:**
```bash
demiurge wallet claim-starter
```

**Via Web Faucet:**
1. Visit https://testnet.demiurge.cloud/faucet
2. Enter your wallet address
3. Click "Request Tokens"
4. Receive 100 tCGT

---

### 3. Verify Connection

```bash
# Check you're on testnet
demiurge chain status
```

Expected output:
```
🔗 Demiurge Chain Status
═══════════════════════════════════════

Network:     Testnet
Chain ID:    demiurge-testnet-1
Block:       #45,678
Validators:  3 active
Status:      ✅ Healthy
```

---

## Network Details

| Property | Value |
|----------|-------|
| **Network Name** | Demiurge Testnet |
| **Chain ID** | `demiurge-testnet-1` |
| **RPC URL (HTTP)** | `https://testnet.demiurge.cloud:9944` |
| **RPC URL (WS)** | `wss://testnet.demiurge.cloud:9944` |
| **Block Time** | 6 seconds |
| **Token Symbol** | tCGT |
| **Explorer** | https://testnet.demiurge.cloud/explorer |

---

## What to Test

### 1. Token Transfers

```bash
# Send tokens
demiurge wallet send 0xRECIPIENT 50

# Check balance
demiurge wallet balance
```

### 2. Validator Operations

```bash
# Register as validator (testnet only)
demiurge validator register --stake 1000 --commission 5

# Check validators
demiurge validator list
```

### 3. NFT Operations

```bash
# Create NFT
demiurge nft mint --uri "ipfs://..."

# Get NFT info
demiurge nft info TOKEN_ID
```

### 4. dApp Integration

Update your dApp to use testnet:

```typescript
const client = new DemiurgeClient({
  rpcUrl: 'https://testnet.demiurge.cloud:9944',
  wsUrl: 'wss://testnet.demiurge.cloud:9944'
});
```

### 5. WebSocket Subscriptions

```javascript
const ws = new WebSocket('wss://testnet.demiurge.cloud:9944');

ws.onopen = () => {
  ws.send(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'chain_subscribeNewBlocks',
    params: []
  }));
};

ws.onmessage = (event) => {
  console.log('New block:', JSON.parse(event.data));
};
```

---

## Running a Local Testnet

For development, run your own local testnet:

### Single Node

```bash
cd framework

./target/release/demiurge-node \
  --data-dir ./testnet-data \
  --rpc-addr 0.0.0.0:9944 \
  --p2p-addr 0.0.0.0:30333 \
  --validator
```

### Multi-Node (Docker)

```bash
cd docker

# Start 4-node testnet
docker compose -f docker-compose.testnet.yml up -d

# Check status
docker compose -f docker-compose.testnet.yml ps
```

See [Docker Testnet Guide](../deployment/DOCKER_TESTNET.md) for details.

---

## Differences from Mainnet

| Feature | Mainnet | Testnet |
|---------|---------|---------|
| Tokens | CGT (real value) | tCGT (no value) |
| Faucet | No | Yes (100 tCGT free) |
| Validators | Production nodes | Test nodes |
| Stability | High | May be reset |
| Purpose | Real transactions | Testing only |

---

## Testnet Resets

The testnet may be reset periodically to:
- Apply major upgrades
- Clear accumulated state
- Test genesis procedures

**Before a reset:**
- Export any important data
- Back up wallet (mnemonic works across resets)

**After a reset:**
- Claim new test tokens
- Re-register as validator if needed
- Redeploy contracts/NFTs

---

## Troubleshooting

### "Network not available"

1. Check internet connection
2. Verify RPC URL: `https://testnet.demiurge.cloud:9944`
3. Try direct IP if DNS issues

### "Already claimed starter"

Starter bonus is once per address. Create a new wallet:
```bash
demiurge wallet generate --output new-wallet.json
```

### "Transaction failed"

1. Check balance (need tCGT for transactions)
2. Verify recipient address format
3. Check testnet is online: `demiurge chain status`

### "Validator registration failed"

1. Ensure minimum stake (1,000 tCGT)
2. Check you have enough balance
3. Verify wallet is unlocked

---

## Reporting Issues

Found a bug? Help us improve!

1. **Check existing issues:**
   https://github.com/ALaustrup/Demiurge-Blockchain/issues

2. **Create new issue with:**
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Error messages/logs
   - Network (testnet/mainnet)

---

## Transitioning to Mainnet

When ready for mainnet:

1. **Update network configuration**
   ```bash
   export DEMIURGE_RPC_URL=https://rpc.demiurge.cloud:9944
   ```

2. **Acquire real CGT**
   - Transfer from exchange
   - Earn through staking

3. **Test thoroughly first**
   - Use testnet for all testing
   - Only use mainnet for production

---

## Resources

- [5-Minute Quickstart](./5-MINUTE_QUICKSTART.md)
- [Wallet Setup](./WALLET_SETUP.md)
- [Docker Testnet](../deployment/DOCKER_TESTNET.md)
- [Troubleshooting](../troubleshooting/TROUBLESHOOTING.md)
