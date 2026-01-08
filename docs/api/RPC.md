# JSON-RPC API Reference

DEMIURGE Chain exposes a JSON-RPC 2.0 API on port 8545.

## Endpoint

- **Local:** `http://localhost:8545/rpc`
- **Production:** `https://rpc.demiurge.cloud/rpc`

## Request Format

```json
{
  "jsonrpc": "2.0",
  "method": "method_name",
  "params": {},
  "id": 1
}
```

## Methods

### Chain Information

#### `cgt_getChainInfo`
Get current chain status.

```bash
curl -X POST http://localhost:8545/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"cgt_getChainInfo","params":{},"id":1}'
```

Response:
```json
{"jsonrpc":"2.0","result":{"height":0},"id":1}
```

#### `getNetworkInfo`
Get network information.

### Balance & Transfers

#### `cgt_getBalance`
Get CGT balance for an address.

```json
{
  "method": "cgt_getBalance",
  "params": {"address": "0x..."}
}
```

#### `cgt_sendRawTransaction`
Submit a signed transaction.

```json
{
  "method": "cgt_sendRawTransaction",
  "params": {"tx_hex": "..."}
}
```

### Identity

#### `cgt_isArchon`
Check if address has Archon status.

#### `qorid_get`
Get QOR ID profile for address.

```json
{
  "method": "qorid_get",
  "params": {"address": "0x..."}
}
```

#### `qorid_getProgress`
Get QOR ID progression info (level, thresholds, progress).

### NFTs

#### `cgt_getNftsByOwner`
Get all NFTs owned by address.

#### `cgt_getListing`
Get marketplace listing by ID.

### Transactions

#### `cgt_getTransactionsByAddress`
Get transaction history for address.

#### `cgt_getTransactionByHash`
Get transaction by hash.

### Work Claims

#### `submitWorkClaim`
Submit mining work claim.

## Error Codes

| Code | Message |
|------|---------|
| -32600 | Invalid Request |
| -32601 | Method not found |
| -32602 | Invalid params |
| -32603 | Internal error |

## CORS

Production endpoint has CORS enabled for:
- `https://demiurge.cloud`
- `https://demiurge.guru`

## Rate Limiting

Recommended: Implement rate limiting on public endpoints.

---

See [chain/src/rpc.rs](../../chain/src/rpc.rs) for full implementation.
