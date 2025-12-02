# Demiurge Node0 Deployment Guide

This guide explains how to deploy a single Demiurge devnet node (Node0) on Ubuntu 24.04.

## Prerequisites

- Ubuntu 24.04 server
- Root or sudo access
- Internet connection

## Quick Start

### 1. Clone Repository

```bash
# As root or with sudo privileges
cd /opt
git clone <TODO: SET ACTUAL GIT REMOTE URL> demiurge
cd demiurge
```

**Note**: Replace `<TODO: SET ACTUAL GIT REMOTE URL>` with your actual repository URL.

### 2. Run Bootstrap

This single command installs dependencies, builds Demiurge, configures systemd, and starts the node:

```bash
sudo bash deploy/node0/bootstrap_node0.sh
```

**What it does:**
- Installs required system packages (build tools, Rust, etc.)
- Builds the Demiurge chain binary (`target/release/demiurge-chain`)
- Creates a dedicated `demiurge` system user
- Configures systemd service for automatic startup
- Starts the Node0 service

### 3. Check Node Status

View service status:

```bash
sudo systemctl status demiurge-node0.service --no-pager
```

View live logs:

```bash
sudo journalctl -u demiurge-node0.service -f
```

### 4. Test RPC Endpoint

The RPC server listens on `http://127.0.0.1:8545` (or `0.0.0.0:8545` as configured).

Test with the provided script:

```bash
bash deploy/node0/check_rpc.sh
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

Or test manually:

```bash
curl -X POST http://127.0.0.1:8545/rpc \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc": "2.0",
    "method": "getNetworkInfo",
    "params": {},
    "id": 1
  }'
```

## Service Management

### Restart Node

```bash
sudo systemctl restart demiurge-node0.service
```

### Stop Node

```bash
sudo systemctl stop demiurge-node0.service
```

### Start Node

```bash
sudo systemctl start demiurge-node0.service
```

### View Logs

```bash
# Follow logs in real-time
sudo journalctl -u demiurge-node0.service -f

# View last 100 lines
sudo journalctl -u demiurge-node0.service -n 100

# View logs since boot
sudo journalctl -u demiurge-node0.service -b
```

## Configuration

- **Repository Path**: `/opt/demiurge`
- **Node Config**: `/opt/demiurge/chain/configs/node.devnet.toml`
- **Genesis Config**: `/opt/demiurge/chain/configs/genesis.devnet.toml`
- **Database**: `/opt/demiurge/.demiurge/data` (RocksDB)
- **RPC Port**: `8545` (configurable in `node.devnet.toml`)
- **System User**: `demiurge` (created automatically)

## Troubleshooting

### Service Won't Start

1. Check service status:
   ```bash
   sudo systemctl status demiurge-node0.service --no-pager
   ```

2. Check logs:
   ```bash
   sudo journalctl -u demiurge-node0.service -n 50
   ```

3. Verify binary exists:
   ```bash
   ls -lh /opt/demiurge/target/release/demiurge-chain
   ```

4. Verify config file exists:
   ```bash
   ls -lh /opt/demiurge/chain/configs/node.devnet.toml
   ```

### RPC Not Responding

1. Check if service is running:
   ```bash
   sudo systemctl is-active demiurge-node0.service
   ```

2. Check if port is listening:
   ```bash
   sudo netstat -tlnp | grep 8545
   # or
   sudo ss -tlnp | grep 8545
   ```

3. Check firewall rules (if applicable):
   ```bash
   sudo ufw status
   ```

### Permission Issues

Ensure the `demiurge` user owns the repository:

```bash
sudo chown -R demiurge:demiurge /opt/demiurge
```

### Rebuild After Code Changes

If you update the code:

```bash
cd /opt/demiurge
sudo -u demiurge bash deploy/node0/build_demiurge.sh
sudo systemctl restart demiurge-node0.service
```

## Next Steps

- Connect AbyssID Wallet to the RPC endpoint
- Use Mining Gateway to submit work claims
- Monitor node health and performance
- Expand to multi-node network (when P2P is implemented)

## Files Reference

- `deploy/node0/bootstrap_node0.sh` - Main bootstrap script
- `deploy/node0/install_dependencies.sh` - Installs system packages and Rust
- `deploy/node0/build_demiurge.sh` - Builds the Demiurge binary
- `deploy/node0/setup_systemd.sh` - Configures systemd service
- `deploy/node0/demiurge-node0.service` - Systemd unit file
- `deploy/node0/check_rpc.sh` - RPC health check script

