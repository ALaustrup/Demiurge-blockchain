# Demiurge Chain Deployment

This directory contains deployment scripts and configuration files for setting up a Demiurge validator node on Ubuntu 24.04 LTS.

## Quick Start

### Prerequisites

- Ubuntu 24.04 LTS server
- Rust toolchain installed (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
- Root or sudo access
- Git

### Deployment Steps

1. **Clone the repository:**
   ```bash
   sudo mkdir -p /opt/demiurge
   sudo git clone <repo-url> /opt/demiurge
   cd /opt/demiurge
   ```

2. **Run the deployment script:**
   ```bash
   sudo chmod +x deploy/deploy-chain.sh
   sudo ./deploy/deploy-chain.sh
   ```

3. **Enable and start the service:**
   ```bash
   sudo systemctl enable demiurge-chain
   sudo systemctl start demiurge-chain
   ```

4. **Verify the node is running:**
   ```bash
   sudo systemctl status demiurge-chain
   sudo journalctl -u demiurge-chain -f
   ```

## What the Deployment Script Does

1. Creates directory structure (`/opt/demiurge/keys`, `/opt/demiurge/configs`, `/opt/demiurge/bin`)
2. Generates validator key if it doesn't exist
3. Copies and injects validator address into genesis configuration
4. Copies node configuration with correct paths
5. Builds the chain binary (`cargo build --release`)
6. Installs binary to `/opt/demiurge/bin/demiurge-chain`
7. Installs systemd service file
8. Sets proper permissions

## Configuration Files

- **Node Config:** `/opt/demiurge/configs/node.toml`
  - RPC binding: `0.0.0.0:8545`
  - Database path: `/opt/demiurge/.demiurge/data`
  
- **Genesis Config:** `/opt/demiurge/configs/genesis.toml`
  - Validator address is automatically injected from the generated key

- **Validator Key:** `/opt/demiurge/keys/validator.key`
  - 32-byte Ed25519 private key
  - Permissions: 600 (owner read/write only)

## Systemd Service

The service file is located at `/etc/systemd/system/demiurge-chain.service` and:
- Runs as root (required for validator operations)
- Auto-restarts on failure
- Logs to systemd journal
- Starts after network is online

## Manual Key Generation

If you need to generate a validator key manually:

```bash
cd /opt/demiurge
cargo build --release --bin demiurge
./target/release/demiurge keygen --output /opt/demiurge/keys/validator.key
```

## Verification

### Check RPC Endpoint

```bash
curl -X POST http://localhost:8545/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "cgt_getChainInfo",
    "params": {},
    "id": 1
  }'
```

Expected response:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "height": 0
  },
  "id": 1
}
```

### Check Validator Address

The validator address is derived from the public key of `/opt/demiurge/keys/validator.key`. You can view it in the logs or extract it:

```bash
./target/release/demiurge keygen --output /opt/demiurge/keys/validator.key
```

## Troubleshooting

### Binary not found
- Ensure `cargo build --release` completed successfully
- Check that binary exists at `/opt/demiurge/target/release/demiurge-chain`

### Permission denied
- Ensure script is run with `sudo`
- Check key file permissions: `ls -la /opt/demiurge/keys/validator.key`

### Service won't start
- Check logs: `sudo journalctl -u demiurge-chain -n 50`
- Verify config files exist: `ls -la /opt/demiurge/configs/`
- Verify database directory is writable: `ls -ld /opt/demiurge/.demiurge/`

### RPC not accessible
- Check firewall: `sudo ufw status`
- Verify RPC binding in config: `grep rpc_host /opt/demiurge/configs/node.toml`
- Test locally: `curl http://127.0.0.1:8545/rpc`

## Files Generated

After deployment, the following structure is created:

```
/opt/demiurge/
├── keys/
│   └── validator.key          # Ed25519 private key (600 permissions)
├── configs/
│   ├── node.toml              # Node configuration
│   └── genesis.toml           # Genesis configuration (validator injected)
├── bin/
│   └── demiurge-chain         # Chain binary
├── .demiurge/
│   └── data/                  # RocksDB database
└── target/
    └── release/
        └── demiurge-chain     # Source binary location
```

## Security Notes

- Validator key is stored with 600 permissions (owner read/write only)
- Service runs as root (required for validator operations)
- RPC is bound to `0.0.0.0:8545` (accessible from network)
- Consider firewall rules to restrict RPC access if needed
