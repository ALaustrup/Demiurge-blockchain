# Quick Start Guide

Get started with Demiurge Protocol in 5 minutes.

**Last Updated:** February 4, 2026

---

## Prerequisites

- Node.js 18+ or Rust 1.70+
- Internet connection to reach `rpc.demiurge.cloud`

---

## Option 1: Install the Browser Wallet (Recommended)

The easiest way to interact with Demiurge:

1. **Install the Extension**
   - Download from Chrome Web Store or Firefox Add-ons
   - Or build from source: `cd apps/wallet-extension && npm install && npm run build`

2. **Create or Import Wallet**
   - Click the Demiurge icon in your browser toolbar
   - Choose "Create New Wallet" or "Import Existing"
   - Set a strong password and backup your recovery phrase

3. **Get Started**
   - Visit any Demiurge-enabled dApp
   - The wallet will prompt for connection approval
   - Claim your starter CGT bonus on testnet

---

## Option 2: Use the Web Platform

The fastest way to explore Demiurge:

1. Visit https://demiurge.cloud
2. Create an account (QOR ID or keypair)
3. Claim your starter CGT bonus
4. Explore the dashboard

---

## Option 3: Use the CLI

```bash
# Install the CLI
npm install -g @demiurge/cli

# Start interactive shell
demiurge

# Or use command mode
demiurge chain status
```

### Common CLI Commands

```bash
# Check chain status
demiurge chain status

# Generate a wallet
demiurge wallet generate --output my-wallet.json

# Check balance
demiurge wallet balance <address>

# Send CGT
demiurge wallet send <to-address> <amount>

# Validator operations
demiurge validator list
demiurge validator register --stake 1000
demiurge validator claim-rewards
```

---

## Option 4: Use the SDK

```bash
npm install @demiurge/sdk
```

```typescript
import { DemiurgeClient, Wallet } from '@demiurge/sdk';

// Create a new wallet
const wallet = await Wallet.generate();
console.log('Address:', wallet.address);
console.log('Mnemonic:', wallet.exportMnemonic());

// Or import from mnemonic
const imported = await Wallet.fromMnemonic('your twelve word recovery phrase here ...');

const client = new DemiurgeClient({
  rpcUrl: 'https://rpc.demiurge.cloud'
});

// Get current block number
const block = await client.getBlockNumber();
console.log('Current block:', block);

// Get balance
const balance = await client.getBalance(wallet.address);
console.log('Balance:', balance, 'CGT');

// Sign and send transaction
const signature = await wallet.signTransactionAsync({
  to: 'recipient-address',
  amount: '100'
});
```

---

## Option 5: Direct RPC Calls

```bash
curl -X POST https://rpc.demiurge.cloud:9944 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"chain_getBlockNumber","params":[]}'
```

Response:
```json
{"jsonrpc":"2.0","result":277,"id":1}
```

---

## Next Steps

- [Installation Guide](./installation.md) - Set up your development environment
- [First Transaction](./first-transaction.md) - Send your first transfer
- [RPC Reference](../developers/rpc-reference.md) - All available RPC methods
- [DRC-369 Specification](../specifications/drc369.md) - Create dynamic NFTs

---

## Live Endpoints

| Service | URL |
|---------|-----|
| Frontend | https://demiurge.cloud |
| RPC | https://rpc.demiurge.cloud:9944 |
| Direct IP | http://127.0.0.1:9944 |

---

**Need help?** Open an issue on [GitHub](https://github.com/ALaustrup/Demiurge-Blockchain/issues)
