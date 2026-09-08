# dApp Quickstart

**Last Updated:** February 4, 2026

Build your first Demiurge-integrated dApp in minutes.

---

## Overview

This guide covers:
- Connecting to user wallets
- Reading blockchain data
- Signing and sending transactions
- Real-time updates via WebSocket

---

## Prerequisites

- Node.js 18+
- Basic React/JavaScript knowledge
- Demiurge Wallet Extension installed (for testing)

---

## Quick Setup

### 1. Create Project

```bash
npx create-next-app@latest my-dapp
cd my-dapp

# Install Demiurge SDK
npm install @demiurge/sdk
```

### 2. Add Type Definitions

Create `types/demiurge.d.ts`:

```typescript
interface DemiurgeProvider {
  connect(): Promise<string[]>;
  disconnect(): void;
  getAccounts(): Promise<string[]>;
  getBalance(address: string): Promise<string>;
  getNetwork(): Promise<{ name: string; chainId: string }>;
  getChainId(): Promise<string>;
  signMessage(message: string, address: string): Promise<string>;
  sendTransaction(tx: { to: string; amount: string }): Promise<{ txHash: string }>;
  request(args: { method: string; params?: any[] }): Promise<any>;
  on(event: string, handler: (...args: any[]) => void): void;
  removeListener(event: string, handler: (...args: any[]) => void): void;
}

declare global {
  interface Window {
    demiurge?: DemiurgeProvider;
  }
}

export {};
```

---

## Core Integration

### Detecting the Wallet

```typescript
// hooks/useDemiurge.ts
import { useState, useEffect, useCallback } from 'react';

export function useDemiurge() {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [isConnected, setIsConnected] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if wallet is installed
    const checkWallet = () => {
      setIsInstalled(typeof window.demiurge !== 'undefined');
    };

    checkWallet();
    
    // Listen for wallet initialization
    window.addEventListener('demiurge#initialized', checkWallet);
    return () => window.removeEventListener('demiurge#initialized', checkWallet);
  }, []);

  const connect = useCallback(async () => {
    if (!window.demiurge) {
      throw new Error('Demiurge Wallet not installed');
    }

    const accounts = await window.demiurge.connect();
    setAccount(accounts[0]);
    setIsConnected(true);

    // Get initial balance
    const bal = await window.demiurge.getBalance(accounts[0]);
    setBalance(bal);

    return accounts[0];
  }, []);

  const disconnect = useCallback(() => {
    if (window.demiurge) {
      window.demiurge.disconnect();
    }
    setAccount(null);
    setIsConnected(false);
    setBalance('0');
  }, []);

  return {
    account,
    balance,
    isConnected,
    isInstalled,
    connect,
    disconnect,
  };
}
```

### Connect Button Component

```tsx
// components/ConnectButton.tsx
'use client';

import { useDemiurge } from '@/hooks/useDemiurge';

export function ConnectButton() {
  const { account, isConnected, isInstalled, connect, disconnect } = useDemiurge();

  if (!isInstalled) {
    return (
      <a
        href="https://demiurge.cloud/wallet"
        target="_blank"
        className="px-4 py-2 bg-purple-600 text-white rounded-lg"
      >
        Install Wallet
      </a>
    );
  }

  if (isConnected && account) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">
          {account.slice(0, 8)}...{account.slice(-6)}
        </span>
        <button
          onClick={disconnect}
          className="px-4 py-2 bg-red-500 text-white rounded-lg"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      className="px-4 py-2 bg-purple-600 text-white rounded-lg"
    >
      Connect Wallet
    </button>
  );
}
```

---

## Reading Data

### Using the SDK

```typescript
import { DemiurgeClient } from '@demiurge/sdk';

const client = new DemiurgeClient({
  rpcUrl: 'https://rpc.demiurge.cloud:9944'
});

// Get block number
const block = await client.getBlockNumber();

// Get balance
const balance = await client.getBalance(address);

// Get validators
const validators = await client.getValidators();

// Get NFT info
const nft = await client.drc369.getTokenInfo(tokenId);
```

### Using the Wallet Provider

```typescript
// Direct RPC calls through wallet
const blockNumber = await window.demiurge.request({
  method: 'chain_getBlockNumber',
  params: []
});

const balance = await window.demiurge.getBalance(account);
```

---

## Sending Transactions

### Transfer CGT

```typescript
async function sendTokens(to: string, amount: string) {
  if (!window.demiurge) throw new Error('Wallet not connected');

  const result = await window.demiurge.sendTransaction({
    to,
    amount
  });

  console.log('Transaction hash:', result.txHash);
  return result;
}
```

### Sign Message

```typescript
async function signMessage(message: string) {
  if (!window.demiurge) throw new Error('Wallet not connected');

  const accounts = await window.demiurge.getAccounts();
  const signature = await window.demiurge.signMessage(message, accounts[0]);
  
  return signature;
}
```

---

## Real-Time Updates

### WebSocket Subscriptions

```typescript
// hooks/useBlockchainUpdates.ts
import { useEffect, useState } from 'react';

export function useNewBlocks() {
  const [latestBlock, setLatestBlock] = useState<number>(0);

  useEffect(() => {
    const ws = new WebSocket('wss://rpc.demiurge.cloud:9944');

    ws.onopen = () => {
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'chain_subscribeNewBlocks',
        params: []
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.params?.result?.block_number) {
        setLatestBlock(data.params.result.block_number);
      }
    };

    return () => ws.close();
  }, []);

  return latestBlock;
}
```

---

## Complete Example

```tsx
// app/page.tsx
'use client';

import { useState } from 'react';
import { useDemiurge } from '@/hooks/useDemiurge';
import { ConnectButton } from '@/components/ConnectButton';

export default function Home() {
  const { account, balance, isConnected } = useDemiurge();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!window.demiurge || !recipient || !amount) return;

    setLoading(true);
    try {
      const result = await window.demiurge.sendTransaction({
        to: recipient,
        amount
      });
      setTxHash(result.txHash);
    } catch (error) {
      console.error('Transaction failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">My Demiurge dApp</h1>
        
        <div className="mb-4">
          <ConnectButton />
        </div>

        {isConnected && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-100 rounded-lg">
              <p>Account: {account?.slice(0, 16)}...</p>
              <p>Balance: {Number(balance) / 100} CGT</p>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="Recipient address"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Amount (CGT)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2 border rounded"
              />
              <button
                onClick={handleSend}
                disabled={loading}
                className="w-full p-2 bg-purple-600 text-white rounded"
              >
                {loading ? 'Sending...' : 'Send CGT'}
              </button>
            </div>

            {txHash && (
              <div className="p-4 bg-green-100 rounded-lg">
                <p>Transaction sent!</p>
                <p className="text-sm break-all">{txHash}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
```

---

## Best Practices

### Error Handling

```typescript
try {
  const result = await window.demiurge.sendTransaction({ to, amount });
} catch (error: any) {
  if (error.code === 4001) {
    // User rejected
    console.log('User cancelled the transaction');
  } else if (error.code === -32602) {
    // Invalid params
    console.log('Invalid transaction parameters');
  } else {
    console.error('Transaction failed:', error);
  }
}
```

### Listen for Account Changes

```typescript
useEffect(() => {
  if (!window.demiurge) return;

  const handleAccountsChanged = (accounts: string[]) => {
    setAccount(accounts[0] || null);
  };

  const handleChainChanged = (chainId: string) => {
    // Reload on network change
    window.location.reload();
  };

  window.demiurge.on('accountsChanged', handleAccountsChanged);
  window.demiurge.on('chainChanged', handleChainChanged);

  return () => {
    window.demiurge?.removeListener('accountsChanged', handleAccountsChanged);
    window.demiurge?.removeListener('chainChanged', handleChainChanged);
  };
}, []);
```

### Check Network

```typescript
async function ensureCorrectNetwork() {
  if (!window.demiurge) return;

  const network = await window.demiurge.getNetwork();
  
  if (network.chainId !== 'demiurge-mainnet-1') {
    // Prompt user to switch networks
    alert('Please switch to Demiurge Mainnet');
    return false;
  }
  
  return true;
}
```

---

## Testing

1. Install Demiurge Wallet Extension
2. Switch to Testnet
3. Claim test tokens
4. Run your dApp: `npm run dev`
5. Connect and test transactions

---

## Resources

- [Wallet Extension Guide](../sdk/WALLET_EXTENSION.md)
- [TypeScript SDK](../sdk/TYPESCRIPT_SDK.md)
- [RPC Reference](../developers/rpc-reference.md)
- [Example dApps](https://github.com/ALaustrup/Demiurge-Blockchain/tree/main/examples)
