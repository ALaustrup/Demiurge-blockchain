# Complete RPC Fix Guide

## Problem
The RPC endpoint is not working because:
1. The chain binary on the server is a Windows PE32+ executable, not a Linux binary
2. The chain service (`demiurge-node1.service`) cannot execute the Windows binary
3. The service keeps restarting and failing with "Exec format error"

## Solution

### Option 1: Build on Server (Recommended)

1. **Clone the repository on the server:**
```bash
ssh -i ~/.ssh/Node1 ubuntu@51.210.209.112
cd /opt/demiurge
sudo git clone <your-repo-url> .  # or pull if already exists
sudo chown -R ubuntu:ubuntu /opt/demiurge
```

2. **Install Rust (if not installed):**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source ~/.cargo/env
```

3. **Build the chain:**
```bash
cd /opt/demiurge
cargo build --release -p demiurge-chain
```

4. **Install the Linux binary:**
```bash
sudo cp target/release/demiurge-chain /opt/demiurge/bin/demiurge-chain
sudo chmod +x /opt/demiurge/bin/demiurge-chain
sudo chown root:root /opt/demiurge/bin/demiurge-chain
```

5. **Verify the binary:**
```bash
file /opt/demiurge/bin/demiurge-chain
# Should show: ELF 64-bit LSB executable, x86-64, version 1 (SYSV), dynamically linked...
```

6. **Start the service:**
```bash
sudo systemctl reset-failed demiurge-node1
sudo systemctl start demiurge-node1
sudo systemctl status demiurge-node1
```

7. **Verify RPC is working:**
```bash
sleep 5
sudo ss -tlnp | grep 8545
curl -X POST -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","method":"cgt_getChainInfo","params":[],"id":1}' http://localhost:8545/rpc
```

### Option 2: Use Docker (Alternative)

If you prefer containerized deployment, use the Docker setup in `deploy/docker/`.

### Option 3: Cross-compile from Windows

This requires setting up cross-compilation toolchain, which is more complex.

## Verification

After fixing, verify:
1. Service is running: `sudo systemctl status demiurge-node1`
2. RPC port is listening: `sudo ss -tlnp | grep 8545`
3. RPC responds: `curl -X POST ... http://localhost:8545/rpc`
4. Web interface shows "connected" status

## Service Configuration

The service file is at `/etc/systemd/system/demiurge-node1.service`:
- ExecStart: `/opt/demiurge/bin/demiurge-chain --genesis /opt/demiurge/genesis/genesis.toml --config /opt/demiurge/config/node.toml --data-dir /opt/demiurge/data --validator-key /opt/demiurge/keys/validator.key`
- WorkingDirectory: `/opt/demiurge/`
- User: `root`

## Troubleshooting

- **"Exec format error"**: Binary is wrong architecture - rebuild for Linux
- **"Permission denied"**: Check file permissions with `ls -la /opt/demiurge/bin/demiurge-chain`
- **Service won't start**: Check logs with `sudo journalctl -u demiurge-node1 -f`
- **RPC not responding**: Check if chain is fully synced and validator key is correct

