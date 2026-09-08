# Blockchain Node Setup on Monad

## Current Status

✅ **Core Services Running:**
- PostgreSQL 18 (healthy)
- Redis 7.4 (healthy)
- QOR Auth (healthy, responding on port 8080)

⚠️ **Blockchain Node:**
- Requires external build due to `librocksdb-sys` dependency conflict
- Cannot be built via Docker Compose
- Must be built directly on server

## Building the Blockchain Node

### Option 1: Build on Server (Recommended)

```bash
ssh pleroma
cd /data/Demiurge-Blockchain/blockchain

# Source Rust environment
source ~/.cargo/env

# Check compilation (will show librocksdb-sys conflict)
cargo check --release --bin demiurge-node

# If conflict persists, see workarounds below
```

### Option 2: Use Pre-built Binary

If you have a pre-built binary, copy it to the server:

```bash
scp target/release/demiurge-node pleroma:/data/Demiurge-Blockchain/blockchain/target/release/
```

### Option 3: Build in Docker (Separate Build)

Build the node image separately, bypassing compose:

```bash
ssh pleroma
cd /data/Demiurge-Blockchain/blockchain
docker build -t demiurge-node:latest .
```

## Running the Node

Once built, run the node:

```bash
cd /data/Demiurge-Blockchain/blockchain

# Run as validator
./target/release/demiurge-node \
  --chain demiurge-testnet \
  --name "Pleroma-Validator" \
  --validator \
  --rpc-cors all \
  --rpc-external \
  --prometheus-external \
  --base-path /data/demiurge-node-data
```

## Service Management

### Run as Systemd Service

Create `/etc/systemd/system/demiurge-node.service`:

```ini
[Unit]
Description=Demiurge Blockchain Node
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/data/Demiurge-Blockchain/blockchain
ExecStart=/data/Demiurge-Blockchain/blockchain/target/release/demiurge-node \
  --chain demiurge-testnet \
  --name "Pleroma-Validator" \
  --validator \
  --rpc-cors all \
  --rpc-external \
  --prometheus-external \
  --base-path /data/demiurge-node-data
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable demiurge-node
sudo systemctl start demiurge-node
sudo systemctl status demiurge-node
```

## Monitoring

### Check Node Status
```bash
# Via RPC (when node is running)
curl -H "Content-Type: application/json" -d '{"id":1, "jsonrpc":"2.0", "method": "system_health"}' http://localhost:9944

# Check logs
journalctl -u demiurge-node -f
```

### Resource Usage
```bash
htop                    # System resources
docker stats            # Container resources
df -h /data            # Disk usage
```

## Troubleshooting

### librocksdb-sys Conflict

If you encounter the `librocksdb-sys` conflict:

1. **Check Substrate versions** in `blockchain/node/Cargo.toml`
2. **Try updating dependencies:**
   ```bash
   cargo update
   cargo build --release --bin demiurge-node
   ```
3. **Use external build** (recommended workaround)

### Node Won't Start

- Check logs: `journalctl -u demiurge-node -n 50`
- Verify ports aren't in use: `netstat -tulpn | grep -E '9944|30333'`
- Check disk space: `df -h`
- Verify chain spec exists

### RPC Not Accessible

- Check firewall: `sudo ufw status`
- Verify `--rpc-external` flag is set
- Check binding: `netstat -tulpn | grep 9944`

---

**Note:** The blockchain node is the most resource-intensive component. Ensure adequate CPU (4+ cores) and RAM (8GB+) are available.
