# Validator Quickstart

**Last Updated:** February 4, 2026

This guide covers how to become a validator on the Demiurge network and start earning rewards.

---

## Overview

Validators secure the network by:
- Producing blocks
- Participating in consensus
- Earning CGT rewards

**Requirements:**
- Minimum stake: 1,000 CGT
- 24/7 uptime recommended
- Stable network connection

---

## Prerequisites

### Software
- Demiurge CLI installed
- Wallet with sufficient CGT

### Hardware (Recommended)
| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 4 GB | 8 GB |
| CPU | 2 cores | 4 cores |
| Storage | 50 GB SSD | 100 GB NVMe |
| Network | 10 Mbps | 100 Mbps |

---

## Step 1: Set Up Your Node

### Option A: Docker (Easiest)

```bash
# Pull and run
docker run -d \
  --name demiurge-validator \
  -p 30333:30333 \
  -p 9944:9944 \
  -v demiurge-data:/data \
  -e VALIDATOR_ENABLED=true \
  -e NODE_KEY=YOUR_NODE_KEY_HEX \
  demiurge/node:latest
```

### Option B: Build from Source

```bash
# Clone repository
git clone https://github.com/ALaustrup/Demiurge-Blockchain.git
cd Demiurge-Blockchain/framework

# Build
cargo build --release

# Run validator
./target/release/demiurge-node \
  --validator \
  --validator-key YOUR_PRIVATE_KEY \
  --data-dir ./data \
  --rpc-addr 0.0.0.0:9944 \
  --p2p-addr 0.0.0.0:30333
```

### Option C: Docker Compose (Multi-Node)

See [Docker Testnet Guide](../deployment/DOCKER_TESTNET.md) for full multi-node setup.

---

## Step 2: Verify Node is Running

```bash
# Check node health
curl -X POST http://localhost:9944 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"chain_getHealth","params":[]}'
```

Expected response:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "connected": true,
    "block_number": 12345
  },
  "id": 1
}
```

---

## Step 3: Prepare Your Wallet

Ensure your wallet has enough CGT for staking:

```bash
# Check balance
demiurge wallet balance

# You need at least 1,000 CGT to register as validator
```

---

## Step 4: Register as Validator

```bash
demiurge validator register --stake 10000 --commission 5
```

Options:
- `--stake <amount>`: Initial stake (min 1,000 CGT)
- `--commission <rate>`: Your commission rate (0-100%)
- `--wallet <path>`: Path to wallet file

**Output:**
```
🚀 Registering Validator...

Address: 0x1234...abcdef
Stake: 10,000 CGT
Commission: 5%

✅ Validator Registered!

Status: Active (next era)
Estimated APY: 12%
```

---

## Step 5: Monitor Your Validator

### Check Status

```bash
demiurge validator status
```

Output:
```
Validator Status
═══════════════════════════════════════

Address: 0x1234...abcdef
Status: Active
Stake: 10,000 CGT
Commission: 5%
Pending Rewards: 125 CGT
Uptime: 99.8%
```

### View Node Logs

```bash
# Docker
docker logs -f demiurge-validator

# Systemd
journalctl -u demiurge-node -f
```

### Check Metrics

If Prometheus is enabled, metrics are available at `http://localhost:9615/metrics`.

---

## Step 6: Claim Rewards

Rewards accumulate each era (~1 hour). Claim them anytime:

```bash
demiurge validator claim-rewards
```

Output:
```
💰 Claiming Rewards...

Pending: 125 CGT
Commission earned: 25 CGT
Staker rewards: 100 CGT

✅ Rewards Claimed!

Amount: 125 CGT
New Balance: 10,125 CGT
```

---

## Managing Your Validator

### Add More Stake

```bash
demiurge validator stake 5000
```

### Reduce Stake

```bash
demiurge validator unstake 2000
```

**Note:** Unstaking has a 7-day unbonding period.

### Change Commission

```bash
demiurge validator set-commission 8
```

### View Other Validators

```bash
demiurge validator list
```

---

## Delegating to Other Validators

If you don't want to run a node, you can delegate to an existing validator:

```bash
# Stake to another validator
demiurge validator stake 1000 --validator 0xVALIDATOR_ADDRESS
```

You'll earn a share of rewards minus their commission.

---

## Best Practices

### Security

1. **Protect your validator key**
   - Store securely, never share
   - Use environment variables or secrets manager

2. **Set up monitoring**
   - Alert on downtime
   - Monitor block production

3. **Use a dedicated server**
   - Don't run other services
   - Ensure stable power and network

### Performance

1. **Use SSD storage**
   - NVMe preferred
   - Avoid HDD

2. **Ensure low latency**
   - Close to other validators
   - Fast network connection

3. **Keep software updated**
   - Regular updates for security
   - Subscribe to announcements

### Uptime

1. **Use systemd**
   - Auto-restart on crash
   - Start on boot

2. **Set up failover**
   - Backup node ready
   - Quick switch procedure

---

## Systemd Service Setup

Create `/etc/systemd/system/demiurge-validator.service`:

```ini
[Unit]
Description=Demiurge Validator Node
After=network.target

[Service]
Type=simple
User=demiurge
ExecStart=/usr/local/bin/demiurge-node \
  --validator \
  --config /etc/demiurge/node.toml
Restart=always
RestartSec=10
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable demiurge-validator
sudo systemctl start demiurge-validator
```

---

## Troubleshooting

### Node won't sync
- Check network connectivity
- Verify bootnodes are correct
- Check firewall allows port 30333

### Not producing blocks
- Verify validator is registered
- Check stake meets minimum
- Ensure node is synced

### Low rewards
- Check your uptime
- Verify you're in the active set
- Check commission rate isn't too high

See [Troubleshooting Guide](../troubleshooting/TROUBLESHOOTING.md) for more.

---

## Economics

### Rewards Calculation

```
Your Rewards = (Your Stake / Total Stake) × Era Rewards × (1 - Commission)
```

### Example

- Total staked: 1,000,000 CGT
- Your stake: 10,000 CGT (1%)
- Era rewards: 1,000 CGT
- Your share: 10 CGT per era

With 5% commission on delegated stake, you also earn:
- Delegated to you: 50,000 CGT
- Commission: 5% × (50,000/1,000,000 × 1,000) = 2.5 CGT

---

## Next Steps

- [Validator CLI Reference](../developers/VALIDATOR_CLI.md)
- [Complete Setup Guide](../developers/COMPLETE_SETUP_GUIDE.md)
- [Monitoring Guide](../operations/monitoring.md)
