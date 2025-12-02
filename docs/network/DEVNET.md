# Demiurge Devnet Setup Guide

This guide explains how to run a local devnet instance of the Demiurge chain.

## Prerequisites

- Rust toolchain (stable, 2021 edition)
- Cargo installed

## Quick Start

### 1. Build the Chain

```bash
cd chain
cargo build --release
```

### 2. Start a Devnet Node

The node will automatically initialize genesis state on first run:

```bash
cargo run --release --bin demiurge-chain
```

Or use the release binary:

```bash
./target/release/demiurge-chain
```

The node will:
- Create a RocksDB database at `.demiurge/data`
- Initialize genesis state (mint CGT to Genesis Archon)
- Start JSON-RPC server on `http://127.0.0.1:8545`

### 3. Verify Node is Running

Check the RPC endpoint:

```bash
curl -X POST http://localhost:8545/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "getNetworkInfo",
    "params": {},
    "id": 1
  }'
```

Expected response:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "chain_id": 77701,
    "name": "Demiurge Devnet",
    "height": 0
  },
  "id": 1
}
```

## Configuration Files

Configuration files are located in `chain/configs/`:

- `genesis.devnet.toml`: Genesis state configuration (initial allocations, validators)
- `node.devnet.toml`: Node configuration (RPC port, DB path, etc.)

**Note**: Currently, the node uses hardcoded configuration. Config file support will be added in a future update.

## Example RPC Calls

### Get Balance

```bash
curl -X POST http://localhost:8545/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "getBalance",
    "params": {
      "address": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    },
    "id": 1
  }'
```

### Submit Work Claim

```bash
curl -X POST http://localhost:8545/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "submitWorkClaim",
    "params": {
      "address": "1111111111111111111111111111111111111111111111111111111111111111",
      "game_id": "mandelbrot",
      "session_id": "session_123",
      "depth_metric": 10.5,
      "active_ms": 5000
    },
    "id": 1
  }'
```

### Submit Raw Transaction

```bash
# First, build a transaction (see SDK documentation)
# Then submit it:
curl -X POST http://localhost:8545/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "submitTransaction",
    "params": {
      "tx": "hex_encoded_transaction_bytes"
    },
    "id": 1
  }'
```

## Database

The node stores all state in RocksDB at `.demiurge/data` (relative to the working directory).

To reset the devnet:
```bash
rm -rf .demiurge/data
```

The node will reinitialize genesis state on the next start.

## Network Expansion

Currently, the devnet runs as a single node. To expand to multiple nodes:

1. Configure P2P networking (future feature)
2. Start additional nodes with different DB paths
3. Connect nodes via P2P protocol

## Troubleshooting

**Port already in use**: Change the RPC port in `chain/src/main.rs` or use a different port via environment variable (future feature).

**Database locked**: Ensure only one node instance is running per database path.

**Genesis not initializing**: Check that `.demiurge/data` directory is writable.

## Next Steps

- Connect AbyssID Wallet to the devnet RPC endpoint
- Use Mining Gateway to submit work claims
- Test CGT transfers and other operations
- Expand to multi-node network (when P2P is implemented)

