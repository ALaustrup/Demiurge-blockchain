# Deploy Testnet to 127.0.0.1

Step-by-step guide to deploy the multi-node testnet to the production server.

## Prerequisites

- SSH access to the server (`ssh pleroma`)
- Git repository is already cloned on server
- Server has Rust and build tools installed

## Deployment Steps

### 1. Connect to Server

```bash
ssh pleroma
```

### 2. Navigate to Repository

```bash
cd /path/to/Demiurge-Blockchain
# or wherever you cloned the repo
```

### 3. Pull Latest Changes

```bash
git pull origin main
```

### 4. Run Deployment Script

```bash
cd testnet
sudo bash scripts/deploy.sh
```

The script will:
- ✓ Create the `demiurge` user
- ✓ Set up directories
- ✓ Build the node binary (this may take 10-15 minutes)
- ✓ Copy configuration files
- ✓ Install systemd services
- ✓ Configure firewall
- ✓ Prompt to start services

**When prompted** whether to start validators, choose **Yes (y)**.

### 5. Verify Deployment

Check that all services are running:

```bash
cd /path/to/Demiurge-Blockchain/testnet
./scripts/manage.sh status
```

You should see all 4 validators active:
- ✓ demiurge-validator-alpha
- ✓ demiurge-validator-beta
- ✓ demiurge-validator-gamma
- ✓ demiurge-validator-delta

### 6. Monitor the Network

Start the monitoring dashboard:

```bash
./scripts/monitor.sh
```

This will show:
- Current block height
- Peer connections
- Service status
- Network health

Press `Ctrl+C` to exit.

### 7. Test RPC Endpoints

From your local machine, test the RPC:

```bash
# Test Alpha (primary)
curl -X POST https://127.0.0.1:9933 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"chain_getBlockNumber","params":[],"id":1}'

# Test health
curl -X POST https://127.0.0.1:9933 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"system_health","params":[],"id":1}'
```

## Post-Deployment Verification

### Check Logs

```bash
# View logs for Alpha
journalctl -u demiurge-validator-alpha -f

# View logs for all validators
journalctl -u 'demiurge-validator-*' -f -n 50
```

### Verify Consensus

All validators should be:
1. **Connected**: Peer count should be 3 for each validator
2. **Producing Blocks**: Block number should be incrementing every 2 seconds
3. **Finalizing**: Blocks should have instant finality

### Check Validator Set

```bash
curl -s -X POST http://localhost:9944 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"staking_getValidators","params":[true],"id":1}' \
  | jq
```

Should show 4 validators.

## Common Operations

### Start/Stop Validators

```bash
# Start all
./scripts/manage.sh start all

# Stop one
./scripts/manage.sh stop beta

# Restart all
./scripts/manage.sh restart all
```

### View Specific Logs

```bash
./scripts/manage.sh logs alpha
```

### Backup Data

```bash
./scripts/manage.sh backup all
```

Backups are stored in `/var/backups/demiurge/`

## Troubleshooting

### If Build Fails

The deployment script builds from source. If the build fails:

1. Check Rust version:
   ```bash
   rustc --version
   # Should be 1.70+ 
   ```

2. Update Rust if needed:
   ```bash
   rustup update
   ```

3. Try building manually:
   ```bash
   cd /path/to/Demiurge-Blockchain
   cargo build --release --features=runtime
   sudo cp target/release/demiurge-node /opt/demiurge/
   ```

### If Services Won't Start

1. Check service status:
   ```bash
   systemctl status demiurge-validator-alpha
   ```

2. Check logs for errors:
   ```bash
   journalctl -u demiurge-validator-alpha -n 50
   ```

3. Verify config files:
   ```bash
   ls -la /etc/demiurge/
   ```

4. Check permissions:
   ```bash
   ls -la /var/lib/demiurge/
   # Should be owned by demiurge:demiurge
   ```

### If Validators Not Connecting

1. Check firewall:
   ```bash
   sudo ufw status
   ```

2. Verify ports are listening:
   ```bash
   netstat -tlnp | grep -E '30333|30334|30335|30336'
   ```

3. Check Alpha is running (bootstrap node):
   ```bash
   systemctl status demiurge-validator-alpha
   ```

### If Blocks Not Finalizing

1. Check how many validators are running:
   ```bash
   ./scripts/manage.sh status | grep "Active:"
   ```

2. Need at least 3 out of 4 for consensus (2/3+1)

3. Restart all validators:
   ```bash
   ./scripts/manage.sh restart all
   ```

## Manual Deployment (Alternative)

If the automated script doesn't work, you can deploy manually:

### 1. Create User

```bash
sudo useradd -r -s /bin/bash -d /opt/demiurge demiurge
```

### 2. Create Directories

```bash
sudo mkdir -p /opt/demiurge
sudo mkdir -p /etc/demiurge
sudo mkdir -p /var/lib/demiurge/validator-{alpha,beta,gamma,delta}
sudo mkdir -p /var/log/demiurge

sudo chown -R demiurge:demiurge /opt/demiurge
sudo chown -R demiurge:demiurge /var/lib/demiurge
sudo chown -R demiurge:demiurge /var/log/demiurge
```

### 3. Build Binary

```bash
cd /path/to/Demiurge-Blockchain
cargo build --release --features=runtime
sudo cp target/release/demiurge-node /opt/demiurge/
```

### 4. Copy Configs

```bash
sudo cp testnet/genesis.json /etc/demiurge/
sudo cp testnet/configs/*.toml /etc/demiurge/
sudo chown demiurge:demiurge /etc/demiurge/*
```

### 5. Install Services

```bash
sudo cp testnet/systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload
```

### 6. Configure Firewall

```bash
sudo ufw allow 30333/tcp  # Alpha P2P
sudo ufw allow 30334/tcp  # Beta P2P
sudo ufw allow 30335/tcp  # Gamma P2P
sudo ufw allow 30336/tcp  # Delta P2P
sudo ufw reload
```

### 7. Start Services

```bash
sudo systemctl enable demiurge-validator-{alpha,beta,gamma,delta}
sudo systemctl start demiurge-validator-alpha
sleep 5
sudo systemctl start demiurge-validator-{beta,gamma,delta}
```

## Next Steps

Once the testnet is running:

1. **Update Frontend**: Point `https://demiurge.cloud` to the RPC endpoint
2. **Test Transactions**: Submit test transactions through the frontend
3. **Monitor Performance**: Use the monitoring script regularly
4. **Backup Regularly**: Schedule regular backups with cron

## Maintenance

### Weekly Tasks

- Check disk space: `df -h /var/lib/demiurge`
- Review logs for errors: `journalctl -u 'demiurge-validator-*' --since "1 week ago" | grep -i error`
- Backup data: `./scripts/manage.sh backup all`

### Monthly Tasks

- Update node binary if new version available
- Review and prune old backups
- Check system resources (CPU, memory, disk)

### On Issues

1. Check the monitoring dashboard
2. Review logs for specific errors
3. Restart affected validators
4. If persistent, check GitHub issues or contact support

## Support

If you encounter issues during deployment:
- Check logs first: `journalctl -u demiurge-validator-alpha -n 100`
- Review the testnet README: `testnet/README.md`
- GitHub Issues: https://github.com/ALaustrup/Demiurge-Blockchain/issues
- Discord: https://discord.gg/demiurge
