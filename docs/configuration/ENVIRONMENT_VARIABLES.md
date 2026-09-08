# Environment Variables Reference

**Last Updated:** February 4, 2026

Complete reference for all Demiurge Protocol environment variables.

---

## Node Environment Variables

### Core Settings

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `DEMIURGE_CHAIN_ID` | Chain identifier | `demiurge-mainnet-1` | `demiurge-testnet-1` |
| `DEMIURGE_DATA_DIR` | Data storage directory | `./data` | `/var/lib/demiurge` |
| `DEMIURGE_CONFIG` | Path to config file | None | `/etc/demiurge/node.toml` |

### Network Settings

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `DEMIURGE_P2P_ADDR` | P2P listen address | `0.0.0.0:30333` | `0.0.0.0:30334` |
| `DEMIURGE_BOOTNODES` | Comma-separated bootnodes | None | `/ip4/.../p2p/...` |
| `DEMIURGE_MAX_PEERS` | Maximum peer connections | `50` | `100` |

### RPC Settings

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `DEMIURGE_RPC_ADDR` | RPC listen address | `127.0.0.1:9944` | `0.0.0.0:9944` |
| `DEMIURGE_RPC_CORS` | CORS allowed origins | `*` | `https://demiurge.cloud` |
| `DEMIURGE_RPC_MAX_CONN` | Max RPC connections | `100` | `500` |
| `DEMIURGE_WS_ENABLED` | Enable WebSocket | `true` | `false` |

### Validator Settings

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `DEMIURGE_VALIDATOR` | Enable validator mode | `false` | `true` |
| `DEMIURGE_VALIDATOR_KEY` | Validator private key (hex) | None | `0x1234...abcd` |
| `DEMIURGE_COMMISSION` | Commission percentage | `10` | `5` |

### Storage Settings

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `DEMIURGE_CACHE_SIZE` | RocksDB cache (MB) | `256` | `512` |
| `DEMIURGE_PRUNING` | Pruning mode | `archive` | `pruned` |

### Logging Settings

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `DEMIURGE_LOG_LEVEL` | Log verbosity | `info` | `debug` |
| `DEMIURGE_LOG_FORMAT` | Log format | `text` | `json` |
| `DEMIURGE_LOG_FILE` | Log file path | stdout | `/var/log/demiurge.log` |
| `RUST_LOG` | Rust log filter | None | `info,demiurge=debug` |

### Metrics Settings

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `DEMIURGE_METRICS` | Enable Prometheus | `true` | `false` |
| `DEMIURGE_METRICS_PORT` | Metrics port | `9615` | `9616` |

---

## Frontend Environment Variables

### Hub (Next.js)

Create `.env.local` in `apps/hub/`:

```bash
# Required
NEXT_PUBLIC_DEMIURGE_RPC_URL=https://rpc.demiurge.cloud:9944

# WebSocket (for real-time updates)
NEXT_PUBLIC_DEMIURGE_WS_URL=wss://rpc.demiurge.cloud:9944

# Authentication
NEXT_PUBLIC_QOR_AUTH_URL=https://auth.demiurge.cloud/api/v1

# Network Configuration
NEXT_PUBLIC_NETWORK=mainnet
NEXT_PUBLIC_CHAIN_ID=demiurge-mainnet-1

# Feature Flags
NEXT_PUBLIC_ENABLE_TESTNET_FAUCET=false
NEXT_PUBLIC_ENABLE_DEBUG_MODE=false
NEXT_PUBLIC_ENABLE_WALLET_CONNECT=true

# Analytics (optional)
NEXT_PUBLIC_ANALYTICS_ID=

# Build Configuration
NODE_ENV=production
```

### SOPHIA (AI Interface)

Create `.env.local` in `apps/sophia/`:

```bash
# RPC
NEXT_PUBLIC_DEMIURGE_RPC_URL=https://rpc.demiurge.cloud:9944

# AI Configuration
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=...

# Authentication
NEXT_PUBLIC_QOR_AUTH_URL=https://auth.demiurge.cloud/api/v1

# Features
NEXT_PUBLIC_ENABLE_VOICE=true
NEXT_PUBLIC_ENABLE_STREAMING=true
```

---

## CLI Environment Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `DEMIURGE_RPC_URL` | RPC endpoint | `https://rpc.demiurge.cloud:9944` | `http://localhost:9944` |
| `DEMIURGE_NETWORK` | Network name | `mainnet` | `testnet` |
| `DEMIURGE_WALLET_PATH` | Default wallet path | `./wallet.json` | `~/.demiurge/wallet.json` |
| `DEMIURGE_OUTPUT_FORMAT` | Output format | `table` | `json` |
| `NO_COLOR` | Disable colors | Not set | `1` |

---

## SDK Environment Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `DEMIURGE_RPC_URL` | Default RPC URL | None | `https://rpc.demiurge.cloud:9944` |
| `DEMIURGE_WS_URL` | Default WebSocket URL | None | `wss://rpc.demiurge.cloud:9944` |
| `DEMIURGE_TIMEOUT` | Request timeout (ms) | `30000` | `60000` |

---

## Docker Environment Variables

For Docker deployments, pass via `docker-compose.yml` or `-e` flag:

```yaml
# docker-compose.yml
services:
  node:
    environment:
      - NODE_NAME=node1
      - NODE_KEY=0x1111...
      - VALIDATOR_ENABLED=true
      - BOOTNODES=/ip4/127.0.0.1/tcp/30333/p2p/...
      - RPC_CORS=*
      - LOG_LEVEL=info
      - DATA_DIR=/data
```

Or via command line:

```bash
docker run -e VALIDATOR_ENABLED=true -e NODE_KEY=0x1234... demiurge-node
```

---

## Systemd Environment Variables

For systemd services, create an environment file:

```bash
# /etc/demiurge/environment
DEMIURGE_DATA_DIR=/var/lib/demiurge/data
DEMIURGE_RPC_ADDR=127.0.0.1:9944
DEMIURGE_P2P_ADDR=0.0.0.0:30333
DEMIURGE_LOG_LEVEL=info
DEMIURGE_VALIDATOR=true
DEMIURGE_VALIDATOR_KEY=0x...
```

Reference in service file:

```ini
[Service]
EnvironmentFile=/etc/demiurge/environment
ExecStart=/usr/local/bin/demiurge-node
```

---

## Security Considerations

### Sensitive Variables

These variables contain sensitive data and should be protected:

| Variable | Contains | Protection Method |
|----------|----------|-------------------|
| `DEMIURGE_VALIDATOR_KEY` | Private key | Use secrets manager, file permissions |
| `OPENAI_API_KEY` | API key | Environment secrets |
| `ANTHROPIC_API_KEY` | API key | Environment secrets |

### Best Practices

1. **Never commit secrets to version control**
   ```bash
   # Add to .gitignore
   .env.local
   .env.production
   *.key
   ```

2. **Use secrets managers in production**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Kubernetes Secrets

3. **Restrict file permissions**
   ```bash
   chmod 600 /etc/demiurge/environment
   chown demiurge:demiurge /etc/demiurge/environment
   ```

4. **Use environment-specific files**
   ```
   .env.development
   .env.staging
   .env.production
   ```

---

## Debugging Environment Variables

### Check Current Values

```bash
# Linux/macOS
env | grep DEMIURGE

# Windows PowerShell
Get-ChildItem Env: | Where-Object { $_.Name -match "DEMIURGE" }
```

### Test Configuration

```bash
# Start node with debug logging
DEMIURGE_LOG_LEVEL=debug demiurge-node

# Or
RUST_LOG=debug,demiurge=trace demiurge-node
```

---

## Related Documentation

- [Configuration Reference](./CONFIGURATION_REFERENCE.md)
- [Complete Setup Guide](../developers/COMPLETE_SETUP_GUIDE.md)
- [Docker Testnet](../deployment/DOCKER_TESTNET.md)
