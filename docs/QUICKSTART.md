# Demiurge Quickstart Guide

## Prerequisites

- **Rust** (via rustup): Latest stable version
- **Node.js 18+** and **pnpm**: For the portal web app
- **Git**: For cloning the repository

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/ALaustrup/DEMIURGE.git
cd DEMIURGE
```

### 2. Install Dependencies

```bash
# Install Rust dependencies (automatic on first build)
# Install Node.js dependencies
pnpm install
```

## Running the System

### 1. Start the Chain Node

```bash
cargo run -p demiurge-chain
```

The node will:
- Initialize RocksDB at `.demiurge/data`
- Initialize Genesis Archon with 1,000,000 CGT
- Start JSON-RPC server on `http://127.0.0.1:8545/rpc`

### 2. Start the Portal (Separate Terminal)

```bash
cd apps/portal-web
pnpm dev
```

The portal will be available at `http://localhost:3000`.

## First Steps

### 1. Create Your UrgeID

1. Open `http://localhost:3000` in your browser
2. Click "Create your UrgeID"
3. Generate a keypair (stored in browser localStorage)
4. Enter display name and optional bio
5. Create your on-chain profile

### 2. Get Some CGT

Use the dev faucet (if node is in debug mode):

```bash
# PowerShell
$body = @{
  jsonrpc = "2.0"
  method = "cgt_devFaucet"
  params = @{ address = "YOUR_URGEID_ADDRESS" }
  id = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8545/rpc" -Method Post -Body $body -ContentType "application/json"
```

### 3. Send CGT

1. Go to your UrgeID dashboard (`/urgeid`)
2. Enter recipient address and amount
3. Click "Send CGT"
4. Transaction is signed client-side and submitted
5. Watch transaction status update from "pending" to "confirmed"

### 4. Check Transaction History

Your UrgeID dashboard shows:
- All sent/received transactions
- Transaction hashes
- Status (pending/confirmed/failed)
- Automatic status polling

## RPC Examples

### Get CGT Metadata

```json
{
  "jsonrpc": "2.0",
  "method": "cgt_getMetadata",
  "params": null,
  "id": 1
}
```

### Get UrgeID Profile

```json
{
  "jsonrpc": "2.0",
  "method": "urgeid_get",
  "params": {
    "address": "YOUR_ADDRESS_HEX"
  },
  "id": 1
}
```

### Get Transaction History

```json
{
  "jsonrpc": "2.0",
  "method": "cgt_getTransactionHistory",
  "params": {
    "address": "YOUR_ADDRESS_HEX",
    "limit": 50
  },
  "id": 1
}
```

## Troubleshooting

### Node Won't Start

- Check port 8545 is available
- Ensure `.demiurge/data` directory is writable
- Check for stale LOCK files: `Remove-Item .demiurge/data/LOCK -Force`

### Portal Can't Connect

- Verify node is running: Check `http://127.0.0.1:8545/rpc` responds
- Check CORS is enabled (should be automatic in dev mode)
- Check browser console for errors

### Transaction Fails

- Verify you have sufficient CGT balance
- Check nonce is correct (use `cgt_getNonce`)
- Ensure recipient address is valid hex (64 characters)

## Next Steps

- Read [Architecture Documentation](./architecture.md)
- Explore the [Full API Documentation](./README.md)
- Check out the [Portal Source Code](../apps/portal-web/src)

