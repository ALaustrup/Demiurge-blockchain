# Configuration Reference

**Last Updated:** February 4, 2026

Complete reference for all Demiurge Protocol configuration options.

---

## Node Configuration (TOML)

The node can be configured via a TOML file passed with `--config`:

```bash
demiurge-node --config /etc/demiurge/node.toml
```

### Complete Configuration Example

```toml
# /etc/demiurge/node.toml

[chain]
# Unique chain identifier
chain_id = "demiurge-mainnet-1"

# Path to genesis file
genesis_path = "/etc/demiurge/genesis.json"

# Block time in milliseconds
block_time_ms = 6000

[network]
# Listen addresses for P2P connections
listen_addresses = [
  "/ip4/0.0.0.0/tcp/30333",
  "/ip6/::/tcp/30333"
]

# Bootstrap nodes for peer discovery
bootnodes = [
  "/ip4/127.0.0.1/tcp/30333/p2p/12D3KooW...",
]

# Maximum number of connected peers
max_peers = 50

# Minimum number of peers before syncing
min_peers = 3

# Enable mDNS local discovery
mdns_enabled = true

# Kademlia DHT for peer discovery
kademlia_enabled = true

[rpc]
# Enable RPC server
enabled = true

# RPC listen address
listen_address = "127.0.0.1:9944"

# Enable WebSocket support
ws_enabled = true

# CORS allowed origins
cors = ["*"]

# Maximum concurrent connections
max_connections = 100

# Request timeout in seconds
timeout_secs = 30

# Enable subscription methods
subscriptions_enabled = true

# Maximum subscriptions per connection
max_subscriptions = 100

[validator]
# Enable block production
enabled = false

# Validator account (hex-encoded private key)
# WARNING: Store securely, consider using environment variable
account = ""

# Commission rate (percentage)
commission = 10

[storage]
# Data directory path
path = "/var/lib/demiurge/data"

# RocksDB cache size in MB
cache_size_mb = 256

# Write buffer size in MB
write_buffer_mb = 64

# Enable compression
compression = true

# Pruning mode: "archive" or "pruned"
pruning = "archive"

# Number of blocks to keep if pruned
pruning_keep_blocks = 256

[logging]
# Log level: trace, debug, info, warn, error
level = "info"

# Log format: "text" or "json"
format = "text"

# Log file path (optional, defaults to stdout)
file = "/var/log/demiurge/node.log"

# Enable colored output
colors = true

# Log specific modules at different levels
[logging.filters]
"demiurge_consensus" = "debug"
"demiurge_network" = "info"
"demiurge_rpc" = "info"

[metrics]
# Enable Prometheus metrics
enabled = true

# Metrics endpoint port
port = 9615

# Metrics endpoint address
address = "127.0.0.1"

[telemetry]
# Enable telemetry reporting
enabled = false

# Telemetry endpoint
endpoint = "wss://telemetry.demiurge.cloud/submit"

# Node name for telemetry
name = "my-node"

[security]
# Enable rate limiting
rate_limit_enabled = true

# Requests per second limit
rate_limit_rps = 100

# Enable request size limit
max_request_size_kb = 1024

# Enable response size limit
max_response_size_kb = 10240
```

---

## Command Line Arguments

All configuration can be overridden via command line:

```bash
demiurge-node [OPTIONS]
```

### General Options

| Flag | Description | Default |
|------|-------------|---------|
| `--config <path>` | Path to config file | None |
| `--chain <id>` | Chain identifier | `demiurge-mainnet-1` |
| `--genesis <path>` | Genesis file path | Built-in |
| `--version` | Print version and exit | - |
| `--help` | Print help and exit | - |

### Network Options

| Flag | Description | Default |
|------|-------------|---------|
| `--p2p-addr <addr>` | P2P listen address | `0.0.0.0:30333` |
| `--bootnodes <list>` | Comma-separated bootnodes | None |
| `--max-peers <n>` | Maximum peers | `50` |
| `--no-mdns` | Disable mDNS | Enabled |

### RPC Options

| Flag | Description | Default |
|------|-------------|---------|
| `--rpc-addr <addr>` | RPC listen address | `127.0.0.1:9944` |
| `--rpc-cors <origins>` | CORS origins | `*` |
| `--rpc-max-connections <n>` | Max connections | `100` |
| `--no-rpc` | Disable RPC | Enabled |
| `--no-ws` | Disable WebSocket | Enabled |

### Validator Options

| Flag | Description | Default |
|------|-------------|---------|
| `--validator` | Enable validator mode | Disabled |
| `--validator-key <hex>` | Validator private key | None |

### Storage Options

| Flag | Description | Default |
|------|-------------|---------|
| `--data-dir <path>` | Data directory | `./data` |
| `--cache-size <mb>` | Cache size in MB | `256` |
| `--pruning <mode>` | Pruning mode | `archive` |

### Logging Options

| Flag | Description | Default |
|------|-------------|---------|
| `--log-level <level>` | Log level | `info` |
| `--log-format <fmt>` | Log format | `text` |
| `--log-file <path>` | Log file path | stdout |

---

## Environment Variables

Environment variables override config file and command line:

| Variable | Description | Example |
|----------|-------------|---------|
| `DEMIURGE_CHAIN_ID` | Chain identifier | `demiurge-mainnet-1` |
| `DEMIURGE_DATA_DIR` | Data directory | `/var/lib/demiurge` |
| `DEMIURGE_RPC_ADDR` | RPC address | `0.0.0.0:9944` |
| `DEMIURGE_P2P_ADDR` | P2P address | `0.0.0.0:30333` |
| `DEMIURGE_VALIDATOR_KEY` | Validator key (hex) | `0x1234...` |
| `DEMIURGE_LOG_LEVEL` | Log level | `debug` |
| `RUST_LOG` | Rust logging filter | `info,demiurge=debug` |

---

## Genesis Configuration

The genesis file defines the initial chain state:

```json
{
  "chain_id": "demiurge-mainnet-1",
  "timestamp": 1706745600,
  "initial_validators": [
    {
      "address": "0x0000...0001",
      "stake": "1000000",
      "commission": 5
    }
  ],
  "initial_balances": [
    {
      "address": "0x00000000000000000000000000000000DEMIURGE",
      "balance": "100000000000"
    }
  ],
  "parameters": {
    "block_time_ms": 6000,
    "max_validators": 100,
    "min_stake": "1000",
    "unbonding_period_eras": 168,
    "era_length_blocks": 600,
    "starter_bonus_amount": "10000",
    "energy_max": 1000,
    "energy_regen_per_block": 10
  }
}
```

---

## Frontend Configuration

### Hub (.env.local)

```bash
# RPC Configuration
NEXT_PUBLIC_DEMIURGE_RPC_URL=https://rpc.demiurge.cloud:9944
NEXT_PUBLIC_DEMIURGE_WS_URL=wss://rpc.demiurge.cloud:9944

# Authentication
NEXT_PUBLIC_QOR_AUTH_URL=https://auth.demiurge.cloud/api/v1

# Network
NEXT_PUBLIC_NETWORK=mainnet
NEXT_PUBLIC_CHAIN_ID=demiurge-mainnet-1

# Features
NEXT_PUBLIC_ENABLE_TESTNET_FAUCET=false
NEXT_PUBLIC_ENABLE_DEBUG_MODE=false

# Analytics (optional)
NEXT_PUBLIC_ANALYTICS_ID=
```

### Wallet Extension

Network configuration in `shared/types.ts`:

```typescript
export const NETWORKS: Record<string, NetworkConfig> = {
  mainnet: {
    name: 'Demiurge Mainnet',
    rpcUrl: 'https://rpc.demiurge.cloud:9944',
    chainId: 'demiurge-mainnet-1',
    explorerUrl: 'https://demiurge.cloud/explorer',
    symbol: 'CGT',
    decimals: 2,
  },
  testnet: {
    name: 'Demiurge Testnet',
    rpcUrl: 'https://testnet.demiurge.cloud:9944',
    chainId: 'demiurge-testnet-1',
    explorerUrl: 'https://testnet.demiurge.cloud/explorer',
    symbol: 'tCGT',
    decimals: 2,
  },
  devnet: {
    name: 'Local Development',
    rpcUrl: 'http://localhost:9944',
    chainId: 'demiurge-devnet-1',
    explorerUrl: 'http://localhost:3000/explorer',
    symbol: 'dCGT',
    decimals: 2,
  },
};
```

---

## SDK Configuration

```typescript
import { DemiurgeClient } from '@demiurge/sdk';

const client = new DemiurgeClient({
  // Required
  rpcUrl: 'https://rpc.demiurge.cloud:9944',
  
  // Optional
  wsUrl: 'wss://rpc.demiurge.cloud:9944',
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
});
```

---

## CLI Configuration

### Config File (~/.demiurge/config.json)

```json
{
  "rpcUrl": "https://rpc.demiurge.cloud:9944",
  "network": "mainnet",
  "defaultWallet": "~/.demiurge/wallet.json",
  "outputFormat": "table",
  "colors": true
}
```

### Environment Variables

```bash
export DEMIURGE_RPC_URL=https://rpc.demiurge.cloud:9944
export DEMIURGE_NETWORK=mainnet
export DEMIURGE_WALLET_PATH=~/.demiurge/wallet.json
```

---

## Docker Configuration

See [Docker Testnet](../deployment/DOCKER_TESTNET.md) for container configuration.

---

## Configuration Priority

Configuration is applied in this order (later overrides earlier):

1. Built-in defaults
2. Config file (TOML)
3. Environment variables
4. Command line arguments

---

## Related Documentation

- [Environment Variables](./ENVIRONMENT_VARIABLES.md)
- [Complete Setup Guide](../developers/COMPLETE_SETUP_GUIDE.md)
- [Production Deployment](../deployment/PRODUCTION_DEPLOYMENT.md)
