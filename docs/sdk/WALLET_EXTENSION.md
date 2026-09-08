# Browser Wallet Extension Development Guide

**Last Updated:** February 4, 2026

This guide covers developing with and for the Demiurge Browser Wallet Extension.

---

## Overview

The Demiurge Wallet is a Manifest V3 browser extension that provides:

- Secure key management (Ed25519 + AES-256-GCM)
- BIP39 mnemonic recovery phrases
- dApp integration via `window.demiurge` provider
- Transaction signing and approval
- Multi-network support (mainnet, testnet, devnet)

---

## For dApp Developers

### Detecting the Wallet

```javascript
// Check if Demiurge Wallet is installed
if (typeof window.demiurge !== 'undefined') {
  console.log('Demiurge Wallet detected!');
} else {
  console.log('Please install Demiurge Wallet');
}

// Listen for wallet initialization
window.addEventListener('demiurge#initialized', () => {
  console.log('Wallet is ready');
});
```

### Connecting to the Wallet

```javascript
// Request connection
const accounts = await window.demiurge.request({
  method: 'demiurge_requestAccounts'
});

console.log('Connected:', accounts[0]);

// Or use the convenience method
const accounts = await window.demiurge.connect();
```

### Getting Account Information

```javascript
// Get connected accounts
const accounts = await window.demiurge.getAccounts();

// Get balance
const balance = await window.demiurge.getBalance(accounts[0]);
console.log('Balance:', balance, 'CGT');

// Get current network
const network = await window.demiurge.getNetwork();
console.log('Network:', network.name);

// Get chain ID
const chainId = await window.demiurge.getChainId();
```

### Sending Transactions

```javascript
// Send CGT transfer
const result = await window.demiurge.sendTransaction({
  to: '0x1234567890abcdef...',
  amount: '100'  // Amount in smallest units
});

console.log('Transaction hash:', result.txHash);
```

### Signing Messages

```javascript
// Sign arbitrary message
const signature = await window.demiurge.signMessage(
  'Hello, Demiurge!',
  accounts[0]
);

console.log('Signature:', signature);
```

### Listening to Events

```javascript
// Account changed
window.demiurge.on('accountsChanged', (accounts) => {
  console.log('Active account:', accounts[0]);
});

// Network changed
window.demiurge.on('chainChanged', (chainId) => {
  console.log('Network changed to:', chainId);
});

// Wallet locked
window.demiurge.on('disconnect', () => {
  console.log('Wallet disconnected');
});
```

---

## Complete dApp Integration Example

```typescript
// dapp-integration.ts
import type { DemiurgeProvider } from '@demiurge/sdk';

declare global {
  interface Window {
    demiurge?: DemiurgeProvider;
  }
}

class DemiurgeDApp {
  private provider: DemiurgeProvider | null = null;
  private account: string | null = null;

  async connect(): Promise<string> {
    if (!window.demiurge) {
      throw new Error('Demiurge Wallet not installed');
    }

    this.provider = window.demiurge;
    
    const accounts = await this.provider.connect();
    this.account = accounts[0];
    
    // Set up event listeners
    this.provider.on('accountsChanged', this.handleAccountChange.bind(this));
    this.provider.on('chainChanged', this.handleChainChange.bind(this));
    
    return this.account;
  }

  async getBalance(): Promise<string> {
    if (!this.provider || !this.account) {
      throw new Error('Not connected');
    }
    return this.provider.getBalance(this.account);
  }

  async sendTokens(to: string, amount: string): Promise<{ txHash: string }> {
    if (!this.provider) {
      throw new Error('Not connected');
    }

    return this.provider.sendTransaction({ to, amount });
  }

  private handleAccountChange(accounts: string[]) {
    this.account = accounts[0] || null;
    console.log('Account changed:', this.account);
  }

  private handleChainChange(chainId: string) {
    console.log('Chain changed:', chainId);
    // Reload page or update state
  }

  disconnect() {
    if (this.provider) {
      this.provider.disconnect();
      this.provider = null;
      this.account = null;
    }
  }
}

export const dapp = new DemiurgeDApp();
```

---

## For Extension Developers

### Project Structure

```
apps/wallet-extension/
├── manifest.json          # Extension manifest (V3)
├── package.json           # Dependencies
├── vite.config.ts         # Build configuration
├── background/
│   ├── service-worker.ts  # Background script
│   ├── keyring.ts         # Key management
│   └── rpc-handler.ts     # RPC communication
├── content/
│   ├── inject.ts          # Content script
│   └── provider.ts        # window.demiurge provider
├── popup/
│   ├── index.html         # Popup entry
│   ├── main.tsx           # React entry
│   ├── App.tsx            # Main component
│   ├── store.ts           # Zustand state
│   ├── components/        # Reusable components
│   └── screens/           # Screen components
└── shared/
    ├── types.ts           # TypeScript types
    └── messages.ts        # Message definitions
```

### Key Architecture

1. **Background Service Worker**: Manages wallet state, handles RPC calls, stores encrypted keys
2. **Content Script**: Bridges web pages and background script
3. **Provider**: Injected `window.demiurge` object for dApps
4. **Popup UI**: React-based user interface

### Building the Extension

```bash
cd apps/wallet-extension

# Development build (with hot reload)
npm run dev

# Production build
npm run build

# Output: dist/
```

### Key Management

The wallet uses industry-standard cryptography:

- **Key Generation**: Ed25519 via `@noble/ed25519`
- **Mnemonic**: BIP39 via `@scure/bip39`
- **Encryption**: PBKDF2 (100,000 iterations) + AES-256-GCM

```typescript
// Example: Key derivation
import { generateMnemonic, mnemonicToSeed } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import * as ed25519 from '@noble/ed25519';

// Generate mnemonic
const mnemonic = generateMnemonic(wordlist, 128); // 12 words

// Derive seed
const seed = await mnemonicToSeed(mnemonic);

// Derive Ed25519 keypair
const privateKey = seed.slice(0, 32);
const publicKey = await ed25519.getPublicKeyAsync(privateKey);
```

### Adding New Features

1. **Add message type** in `shared/messages.ts`
2. **Handle message** in `background/service-worker.ts`
3. **Add UI** in `popup/screens/`
4. **Update store** in `popup/store.ts`

---

## Network Configuration

The wallet supports multiple networks:

| Network | RPC URL | Chain ID |
|---------|---------|----------|
| Mainnet | https://rpc.demiurge.cloud:9944 | demiurge-mainnet-1 |
| Testnet | https://testnet.demiurge.cloud:9944 | demiurge-testnet-1 |
| Devnet | http://localhost:9944 | demiurge-devnet-1 |

---

## Security Considerations

1. **Never store unencrypted private keys**
2. **Auto-lock after inactivity** (configurable timeout)
3. **Clear sensitive data from memory** when locked
4. **Validate all RPC responses** before displaying
5. **Require user approval** for all transactions

---

## Testing

### Manual Testing

1. Load extension in Chrome
2. Create/import wallet
3. Connect to a dApp
4. Sign transactions
5. Test network switching

### Automated Testing

```bash
# Run unit tests
npm test

# Run e2e tests (requires built extension)
npm run test:e2e
```

---

## Publishing

### Chrome Web Store

1. Build production: `npm run build`
2. Create ZIP of `dist/` folder
3. Upload to Chrome Developer Dashboard
4. Submit for review

### Firefox Add-ons

1. Build production: `npm run build:firefox`
2. Create ZIP of `dist/` folder
3. Upload to Firefox Add-on Developer Hub
4. Submit for review

---

## Resources

- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)
- [Ed25519 Specification](https://ed25519.cr.yp.to/)
- [BIP39 Specification](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
- [Demiurge RPC Reference](../developers/rpc-reference.md)
