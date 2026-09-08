# 5-Minute Quickstart

**Last Updated:** February 4, 2026

Get running with Demiurge in under 5 minutes.

---

## Prerequisites

- Node.js 18+ installed
- A terminal/command prompt

---

## Step 1: Install the CLI (30 seconds)

```bash
npm install -g @demiurge/cli
```

Verify:
```bash
demiurge --version
```

---

## Step 2: Generate a Wallet (30 seconds)

```bash
demiurge wallet generate --output my-wallet.json
```

Output:
```
✅ Wallet Generated!

Address: 0x1234567890abcdef...
Mnemonic: word1 word2 word3 ... word12

⚠️  SAVE YOUR MNEMONIC! This is the only way to recover your wallet.

Wallet saved to: my-wallet.json
```

**Important:** Save your mnemonic phrase securely!

---

## Step 3: Check Chain Status (30 seconds)

```bash
demiurge chain status
```

Output:
```
🔗 Demiurge Chain Status
═══════════════════════════════════════

Network:     Mainnet
Block:       #12,345
Validators:  5 active
Status:      ✅ Healthy

RPC:         https://rpc.demiurge.cloud:9944
```

---

## Step 4: Claim Starter Tokens (1 minute)

On testnet, claim free tokens:

```bash
demiurge wallet claim-starter
```

Output:
```
💰 Claiming Starter Bonus...

Address: 0x1234...abcdef
Amount:  100 CGT

✅ Starter Bonus Claimed!

New Balance: 100 CGT
```

---

## Step 5: Check Your Balance (30 seconds)

```bash
demiurge wallet balance
```

Output:
```
💰 Wallet Balance
═══════════════════════════════════════

Address: 0x1234...abcdef
Balance: 100 CGT
Energy:  1000/1000 ⚡
```

---

## Step 6: Send a Transaction (1 minute)

```bash
demiurge wallet send 0xRECIPIENT_ADDRESS 10
```

Output:
```
📤 Sending CGT...

From:   0x1234...abcdef
To:     0x9876...5432
Amount: 10 CGT

✅ Transaction Sent!

TX Hash: 0xabc123...
New Balance: 90 CGT
```

---

## You're Done! 🎉

In under 5 minutes, you've:

- ✅ Installed the Demiurge CLI
- ✅ Generated a wallet with recovery phrase
- ✅ Connected to the network
- ✅ Claimed starter tokens
- ✅ Sent your first transaction

---

## What's Next?

| I want to... | Guide |
|--------------|-------|
| Build a dApp | [dApp Quickstart](./DAPP_QUICKSTART.md) |
| Run a validator | [Validator Quickstart](./VALIDATOR_QUICKSTART.md) |
| Use the SDK | [TypeScript SDK](../sdk/TYPESCRIPT_SDK.md) |
| Install browser wallet | [Wallet Extension](../sdk/WALLET_EXTENSION.md) |
| Set up development | [Complete Setup Guide](../developers/COMPLETE_SETUP_GUIDE.md) |

---

## Quick Code Example

```typescript
import { DemiurgeClient, Wallet } from '@demiurge/sdk';

// Create wallet
const wallet = await Wallet.generate();
console.log('Address:', wallet.address);

// Connect to network
const client = new DemiurgeClient({
  rpcUrl: 'https://rpc.demiurge.cloud:9944'
});

// Check balance
const balance = await client.getBalance(wallet.address);
console.log('Balance:', balance, 'CGT');
```

---

## Troubleshooting

**CLI not found:**
```bash
# Check npm global path
npm bin -g

# Add to PATH if needed
export PATH="$PATH:$(npm bin -g)"
```

**Connection failed:**
```bash
# Check network connectivity
curl https://rpc.demiurge.cloud:9944
```

**More help:** [Troubleshooting Guide](../troubleshooting/TROUBLESHOOTING.md)
