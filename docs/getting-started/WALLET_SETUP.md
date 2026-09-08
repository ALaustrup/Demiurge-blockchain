# Wallet Setup Guide

**Last Updated:** February 4, 2026

This guide walks you through setting up your Demiurge wallet to hold CGT tokens and interact with dApps.

---

## Option 1: Browser Extension (Recommended)

The Demiurge Wallet extension is the easiest way to manage your assets.

### Installation

**Chrome:**
1. Open Chrome Web Store (or load unpacked for development)
2. Search for "Demiurge Wallet"
3. Click "Add to Chrome"
4. Pin the extension for easy access

**Firefox:**
1. Open Firefox Add-ons
2. Search for "Demiurge Wallet"
3. Click "Add to Firefox"

**From Source:**
```bash
cd apps/wallet-extension
npm install
npm run build

# Then load the dist/ folder as unpacked extension
```

### Creating a New Wallet

1. Click the Demiurge icon in your browser toolbar
2. Click **"Create New Wallet"**
3. Set a strong password (8+ characters)
4. **SAVE YOUR RECOVERY PHRASE** - Write down all 12 words in order
5. Confirm your recovery phrase
6. Done! Your wallet is ready

### Importing an Existing Wallet

1. Click the Demiurge icon
2. Click **"Import Existing Wallet"**
3. Enter your 12-word recovery phrase
4. Set a password
5. Done!

### Security Tips

- ✅ Save your recovery phrase on paper, not digitally
- ✅ Never share your recovery phrase with anyone
- ✅ Use a strong, unique password
- ✅ Enable auto-lock for added security
- ❌ Never enter your phrase on websites asking for it

---

## Option 2: CLI Wallet

For developers and power users.

### Generate a Wallet

```bash
# Install CLI
npm install -g @demiurge/cli

# Generate wallet
demiurge wallet generate --output wallet.json
```

Output:
```
✅ Wallet Generated!

Address: 0x1234567890abcdef...
Mnemonic: abandon ability able ... zoo

⚠️  SAVE YOUR MNEMONIC!

Wallet saved to: wallet.json
```

### Import from Mnemonic

```bash
demiurge wallet import --mnemonic "your twelve word phrase here" --output wallet.json
```

### View Wallet Info

```bash
demiurge wallet info
```

---

## Option 3: SDK (Programmatic)

For applications and automated systems.

```typescript
import { Wallet } from '@demiurge/sdk';

// Generate new wallet
const wallet = await Wallet.generate();
console.log('Address:', wallet.address);
console.log('Mnemonic:', wallet.exportMnemonic());

// Import from mnemonic
const imported = await Wallet.fromMnemonic(
  'abandon ability able about above absent ...'
);

// Import from private key
const fromKey = Wallet.fromPrivateKey('0x...');
```

---

## Getting Your First Tokens

### On Testnet (Free)

1. **Via Wallet Extension:**
   - Switch to Testnet network
   - Click "Claim Starter Tokens"

2. **Via CLI:**
   ```bash
   demiurge wallet claim-starter
   ```

3. **Via Web:**
   - Visit https://testnet.demiurge.cloud
   - Connect wallet
   - Click "Claim Tokens"

### On Mainnet

- Transfer from another wallet
- Purchase from an exchange
- Earn through staking or validation

---

## Connecting to dApps

### With Browser Extension

1. Visit a Demiurge-enabled dApp
2. The dApp will prompt for connection
3. Review the connection request
4. Click **"Connect"**
5. Your wallet is now connected

### Manual Connection

If auto-detection fails:

```javascript
// In browser console or dApp
if (window.demiurge) {
  const accounts = await window.demiurge.connect();
  console.log('Connected:', accounts[0]);
}
```

---

## Sending Tokens

### Browser Extension

1. Click the Demiurge icon
2. Click **"Send"**
3. Enter recipient address
4. Enter amount
5. Review details
6. Click **"Confirm"**

### CLI

```bash
demiurge wallet send 0xRECIPIENT 100
```

### SDK

```typescript
const { signature } = await wallet.signTransactionAsync({
  to: recipientAddress,
  amount: '100'
});

const result = await client.transfer({
  from: wallet.address,
  to: recipientAddress,
  amount: '100',
  signature
});
```

---

## Backing Up Your Wallet

### What to Backup

| Item | Purpose | How |
|------|---------|-----|
| Recovery Phrase | Restore wallet anywhere | Write on paper |
| Password | Unlock browser extension | Remember or use password manager |
| wallet.json | CLI wallet file | Copy to secure location |

### Restoring from Backup

**Browser Extension:**
1. Install extension on new device
2. Click "Import Existing"
3. Enter recovery phrase
4. Set new password

**CLI:**
```bash
demiurge wallet import --mnemonic "your phrase"
```

---

## Network Settings

| Network | RPC URL | Use Case |
|---------|---------|----------|
| Mainnet | https://rpc.demiurge.cloud:9944 | Real transactions |
| Testnet | https://testnet.demiurge.cloud:9944 | Testing |
| Devnet | http://localhost:9944 | Local development |

### Switching Networks

**Browser Extension:**
1. Click network dropdown in header
2. Select desired network

**CLI:**
```bash
export DEMIURGE_RPC_URL=https://testnet.demiurge.cloud:9944
```

---

## Troubleshooting

### "Extension not loading"
- Rebuild: `npm run build` in `apps/wallet-extension`
- Reload extension in `chrome://extensions`

### "Wrong password"
- Cannot recover password without recovery phrase
- Import wallet again using recovery phrase

### "Transaction failed"
- Check balance is sufficient
- Verify recipient address is valid
- Check network connection

### More Help
- [Troubleshooting Guide](../troubleshooting/TROUBLESHOOTING.md)
- [GitHub Issues](https://github.com/ALaustrup/Demiurge-Blockchain/issues)

---

## Next Steps

- [Send Your First Transaction](./first-transaction.md)
- [Connect to a dApp](./DAPP_QUICKSTART.md)
- [Stake Your CGT](./VALIDATOR_QUICKSTART.md)
