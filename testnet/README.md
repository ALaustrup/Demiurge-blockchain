# Demiurge Local Testnet

**Status:** Configuration for a 4-validator local testnet. **Multi-node consensus is not yet implemented** (see `STATUS.md`); until Phase 2 lands, these nodes will each produce their own chain. There is no hosted mainnet or testnet.

**Known issue:** the genesis files and validator configs in this directory still use well-known Substrate development keys (Alice/Bob/Charlie/Dave). They must be regenerated before any network is exposed beyond localhost (tracked for Phase 2).

## Testnet Overview

This testnet runs **4 validator nodes** on a single server to simulate a decentralized network:

| Validator | RPC Port | WebSocket | P2P Port | Role |
|-----------|----------|-----------|----------|------|
| Alpha     | 9944     | 9933      | 30333    | Bootstrap node |
| Beta      | 9945     | 9934      | 30334    | Secondary |
| Gamma     | 9946     | 9935      | 30335    | Tertiary |
| Delta     | 9947     | 9936      | 30336    | Quaternary |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Server (127.0.0.1)                  │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Alpha     │  │    Beta     │  │   Gamma     │        │
│  │ (Bootstrap) │  │             │  │             │        │
│  │   :30333    │←─┤   :30334    │←─┤   :30335    │←┐      │
│  └─────────────┘  └─────────────┘  └─────────────┘ │      │
│        ↓                                            │      │
│  ┌─────────────┐                                    │      │
│  │   Delta     │                                    │      │
│  │   :30336    │────────────────────────────────────┘      │
│  └─────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
```

All validators connect to **Alpha** as the bootstrap node, then discover each other via libp2p.

## Quick Start

### 1. Deploy the Testnet

```bash
cd testnet
sudo bash scripts/deploy.sh
```

This will:
- Create the `demiurge` user
- Build and install the node binary
- Copy configuration files
- Install systemd services
- Configure firewall rules

### 2. Start All Validators

```bash
./scripts/manage.sh start all
```

Or start individually:
```bash
./scripts/manage.sh start alpha
./scripts/manage.sh start beta
./scripts/manage.sh start gamma
./scripts/manage.sh start delta
```

### 3. Monitor the Network

```bash
./scripts/monitor.sh
```

This displays a real-time dashboard showing:
- Block height
- Peer connections
- Service status
- Network health

## Management Commands

The `manage.sh` script provides convenient commands:

```bash
# Start/stop validators
./scripts/manage.sh start <validator|all>
./scripts/manage.sh stop <validator|all>
./scripts/manage.sh restart <validator|all>

# Check status
./scripts/manage.sh status [validator]

# View logs
./scripts/manage.sh logs alpha

# Backup data
./scripts/manage.sh backup all

# Clean data (⚠️ destructive)
./scripts/manage.sh clean all
```

## Manual Operations

### Check Service Status

```bash
systemctl status demiurge-validator-alpha
systemctl status demiurge-validator-beta
systemctl status demiurge-validator-gamma
systemctl status demiurge-validator-delta
```

### View Logs

```bash
# Follow logs for a specific validator
journalctl -u demiurge-validator-alpha -f

# View recent logs
journalctl -u demiurge-validator-beta -n 100

# View logs for all validators
journalctl -u 'demiurge-validator-*' -f
```

### RPC Queries

```bash
# Get block number (Alpha)
curl -X POST http://localhost:9944 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"chain_getBlockNumber","params":[],"id":1}'

# Check health (Beta)
curl -X POST http://localhost:9945 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"system_health","params":[],"id":1}'

# Get validators
curl -X POST http://localhost:9944 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"staking_getValidators","params":[true],"id":1}'
```

## Configuration Files

### Genesis (`genesis.json`)

Defines the initial chain state:
- 4 validators with pre-allocated stake
- Initial balances for accounts
- QOR ID handles
- Module configurations

### Node Configs (`configs/validator-*.toml`)

Each validator has its own configuration:
- Network ports (unique per validator)
- RPC/WebSocket endpoints
- Pruning mode (Archive for Alpha, Constrained for others)
- Logging levels

### Systemd Services (`systemd/*.service`)

Service files that:
- Run as the `demiurge` user
- Auto-restart on failure
- Security hardening enabled
- Resource limits configured

## Testing Scenarios

### 1. Basic Consensus

With all 4 validators running, the network should:
- Produce blocks every ~2 seconds
- Achieve instant finality with BFT
- Rotate proposers based on stake

**Test:**
```bash
# Check if blocks are being produced
watch -n 1 'curl -s -X POST http://localhost:9944 -H "Content-Type: application/json" -d "{\"jsonrpc\":\"2.0\",\"method\":\"chain_getBlockNumber\",\"params\":[],\"id\":1}" | jq -r .result'
```

### 2. Byzantine Fault Tolerance

With 3/4 validators (2/3+1), the network should continue:

**Test:**
```bash
# Stop one validator
./scripts/manage.sh stop delta

# Network should continue producing blocks
./scripts/monitor.sh
```

### 3. Network Partition Recovery

Simulate a network split and recovery:

**Test:**
```bash
# Stop two validators
./scripts/manage.sh stop beta
./scripts/manage.sh stop gamma

# Network should halt (< 2/3 validators)

# Restart validators
./scripts/manage.sh start beta
./scripts/manage.sh start gamma

# Network should recover and continue
```

### 4. Validator Rotation

Test block proposer selection:

**Test:**
```bash
# Check which validator proposed each block
journalctl -u 'demiurge-validator-*' | grep "Block proposed by"
```

### 5. Cross-Shard Communication

(Future) Once sharding is enabled:

**Test:**
```bash
# Send cross-shard transaction
# Monitor message passing between shards
```

## Troubleshooting

### Validators Not Connecting

1. Check if Alpha is running (bootstrap node):
   ```bash
   systemctl status demiurge-validator-alpha
   ```

2. Check firewall:
   ```bash
   sudo ufw status
   ```

3. Verify P2P ports are open:
   ```bash
   netstat -tlnp | grep -E '30333|30334|30335|30336'
   ```

### Low Peer Count

1. Check logs for connection errors:
   ```bash
   journalctl -u demiurge-validator-beta | grep -i "connection\|peer"
   ```

2. Ensure bootstrap node is reachable:
   ```bash
   telnet localhost 30333
   ```

### Blocks Not Finalizing

1. Check validator count:
   ```bash
   curl -s -X POST http://localhost:9944 \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"staking_getValidators","params":[true],"id":1}' \
     | jq -r '.result | length'
   ```

2. Ensure at least 3/4 validators are running:
   ```bash
   ./scripts/manage.sh status
   ```

### High Memory Usage

1. Check data directory size:
   ```bash
   du -sh /var/lib/demiurge/*
   ```

2. Consider pruning for non-archive nodes (already configured in Beta/Gamma/Delta)

## Performance Metrics

Expected performance with 4 validators:

| Metric | Target |
|--------|--------|
| Block Time | 2 seconds |
| Finality | Instant (BFT) |
| TPS | 500-1000 |
| Memory per Validator | 512MB-2GB |
| CPU per Validator | 1-2 cores |

## Security Notes

- **Keys**: Validator keys should be generated securely and backed up
- **Firewall**: Only P2P ports should be exposed publicly
- **RPC**: RPC ports are restricted to localhost
- **User**: Validators run as unprivileged `demiurge` user
- **Updates**: Keep the node binary updated

## Network Upgrade Process

To upgrade the network:

1. Build new binary:
   ```bash
   cd /path/to/Demiurge-Blockchain
   cargo build --release
   ```

2. Stop all validators:
   ```bash
   ./scripts/manage.sh stop all
   ```

3. Replace binary:
   ```bash
   sudo cp target/release/demiurge-node /opt/demiurge/
   ```

4. Restart validators:
   ```bash
   ./scripts/manage.sh start all
   ```

## Cleanup

To completely remove the testnet:

```bash
# Stop all services
./scripts/manage.sh stop all

# Disable services
sudo systemctl disable demiurge-validator-{alpha,beta,gamma,delta}

# Remove files
sudo rm -rf /var/lib/demiurge
sudo rm -rf /opt/demiurge
sudo rm -rf /etc/demiurge
sudo rm /etc/systemd/system/demiurge-validator-*.service

# Reload systemd
sudo systemctl daemon-reload

# Remove user
sudo userdel demiurge
```

## Additional Resources

- [Consensus Documentation](../docs/consensus.md)
- [RPC API Reference](../docs/api/)
- [Validator Guide](../docs/validators.md)
- [Troubleshooting Guide](../docs/troubleshooting.md)

## Support

For issues or questions:
- GitHub Issues: https://github.com/ALaustrup/Demiurge-Blockchain/issues
- Discord: https://discord.gg/demiurge
- Email: dev@demiurge.cloud
