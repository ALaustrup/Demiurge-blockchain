# Demiurge JSON-RPC API

This document describes the JSON-RPC endpoints available on the Demiurge chain node.

## Endpoint

The RPC server runs on `http://localhost:8545/rpc` by default (configurable via node config).

## Request Format

All requests use JSON-RPC 2.0 format:

```json
{
  "jsonrpc": "2.0",
  "method": "method_name",
  "params": { ... },
  "id": 1
}
```

## Methods

### getBalance

Get CGT balance for an address.

**Parameters:**
- `address` (string): Hex-encoded 32-byte address

**Returns:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "balance": "100000000000000"
  },
  "id": 1
}
```

**Example:**
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

### submitWorkClaim

Submit a work claim from an arcade miner to mint CGT rewards.

**Parameters:**
- `address` (string): Hex-encoded 32-byte address (claim recipient)
- `game_id` (string): Game identifier (e.g., "mandelbrot")
- `session_id` (string): Unique session identifier
- `depth_metric` (number): Work depth metric (float)
- `active_ms` (number): Active time in milliseconds (integer, minimum 1000)
- `extra` (string, optional): Additional metadata

**Returns:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "tx_hash": "abc123...",
    "reward_estimate": "1000000000"
  },
  "id": 1
}
```

**Example:**
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
      "active_ms": 5000,
      "extra": null
    },
    "id": 1
  }'
```

### getNetworkInfo

Get network information including chain ID and name.

**Parameters:** None

**Returns:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "chain_id": 77701,
    "name": "Demiurge Devnet",
    "height": 42
  },
  "id": 1
}
```

**Example:**
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

### submitTransaction

Submit a raw transaction to the mempool (existing endpoint, now supports work-claim transactions).

**Parameters:**
- `tx` (string): Hex-encoded transaction bytes

**Returns:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "accepted": true,
    "tx_hash": "abc123..."
  },
  "id": 1
}
```

## Other Available Methods

- `cgt_getChainInfo`: Get chain height
- `cgt_getBalance`: Get CGT balance (alias for `getBalance`)
- `cgt_sendRawTransaction`: Submit raw transaction (alias for `submitTransaction`)
- `cgt_isArchon`: Check Archon status
- `cgt_getNftsByOwner`: Get NFTs by owner
- `cgt_getListing`: Get marketplace listing
- `cgt_getFabricAsset`: Get Fabric asset
- Various UrgeID, Developer, DevCapsule, and Recursion endpoints

See the codebase for the full list of available methods.

