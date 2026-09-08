# Testnet Deployment Status

## ✅ Deployment Complete

**Date:** January 30, 2026  
**Server:** 127.0.0.1 (pleroma)

## Deployed Validators

| Validator | RPC Port | P2P Port | Status | PID |
|-----------|----------|----------|--------|-----|
| Alpha     | 9948     | 30337    | ✅ Active | Running |
| Beta      | 9945     | 30334    | ✅ Active | Running |
| Gamma     | 9946     | 30335    | ✅ Active | Running |
| Delta     | 9947     | 30336    | ✅ Active | Running |

## Validator Keys

Validator keys are stored in:
- `/var/lib/demiurge/validator-alpha/validator.key`
- `/var/lib/demiurge/validator-beta/validator.key`
- `/var/lib/demiurge/validator-gamma/validator.key`
- `/var/lib/demiurge/validator-delta/validator.key`

**⚠️ Important:** These keys are generated on the server. Back them up securely!

## Genesis Configuration

- **Chain ID:** `demiurge-testnet-multinode`
- **Block Time:** 2000ms (2 seconds)
- **Era Length:** 1000 blocks
- **Genesis File:** `/etc/demiurge/genesis.json`

### Genesis Validators

| Validator | Account (Hex) | Initial Stake | Balance |
|-----------|---------------|---------------|---------|
| Alpha     | `df1c9110...` | 10,000 CGT    | 100,000 CGT |
| Beta      | `3c95ea85...` | 8,000 CGT     | 80,000 CGT |
| Gamma     | `c4d4ba7d...` | 6,000 CGT     | 60,000 CGT |
| Delta     | `8291a1f3...` | 5,000 CGT     | 50,000 CGT |

## Management Commands

### Check Status

```bash
systemctl status demiurge-validator-{alpha,beta,gamma,delta}

# Or use the management script
cd ~/Demiurge-Blockchain/testnet
./scripts/manage.sh status
```

### View Logs

```bash
# All validators
journalctl -u 'demiurge-validator-*' -f

# Specific validator
journalctl -u demiurge-validator-alpha -f
```

### Start/Stop Validators

```bash
# Using systemctl
systemctl start demiurge-validator-alpha
systemctl stop demiurge-validator-beta
systemctl restart demiurge-validator-gamma

# Using management script
cd ~/Demiurge-Blockchain/testnet
./scripts/manage.sh start alpha
./scripts/manage.sh stop beta
./scripts/manage.sh restart all
```

### Monitor Network

```bash
cd ~/Demiurge-Blockchain/testnet
./scripts/monitor.sh
```

## RPC Endpoints

Test the validators via RPC:

```bash
# Alpha
curl -X POST http://localhost:9948 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"system_health","params":[],"id":1}'

# Beta
curl -X POST http://localhost:9945 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"system_health","params":[],"id":1}'

# Gamma
curl -X POST http://localhost:9946 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"system_health","params":[],"id":1}'

# Delta
curl -X POST http://localhost:9947 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"system_health","params":[],"id":1}'
```

## Network Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 Server (127.0.0.1)                 │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │  Alpha   │  │   Beta   │  │  Gamma   │  │  Delta  ││
│  │  :30337  │──│  :30334  │──│  :30335  │──│ :30336  ││
│  │  :9948   │  │  :9945   │  │  :9946   │  │ :9947   ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Original Node (Production)                     │   │
│  │  127.0.0.1:9944, 0.0.0.0:30333                  │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Consensus Testing

With 4 validators, the network requires **3 out of 4 (2/3+1)** validators to reach consensus.

### Test Scenarios

1. **All Validators Running** ✅
   - Network should produce blocks every 2 seconds
   - Instant finality with BFT consensus

2. **One Validator Down**
   - Stop one validator: `systemctl stop demiurge-validator-delta`
   - Network should continue (3/4 active)
   - Test: `./scripts/manage.sh stop delta`

3. **Two Validators Down** (Network Halts)
   - Stop two validators: Network cannot reach consensus
   - Restart to recover: `./scripts/manage.sh start all`

4. **Validator Rotation**
   - Check logs to see different validators proposing blocks
   - Proposer selection based on stake weight

## Files and Directories

- **Binary:** `/opt/demiurge/demiurge-node`
- **Data:** `/var/lib/demiurge/validator-{alpha,beta,gamma,delta}/`
- **Config:** `/etc/demiurge/`
- **Services:** `/etc/systemd/system/demiurge-validator-*.service`
- **Logs:** `journalctl -u demiurge-validator-*`

## Firewall Rules

P2P ports are open:
- 30334/tcp (Beta)
- 30335/tcp (Gamma)
- 30336/tcp (Delta)
- 30337/tcp (Alpha)

RPC ports are localhost-only for security.

## Auto-Start on Boot

All validators are enabled to start automatically on server reboot:

```bash
systemctl is-enabled demiurge-validator-{alpha,beta,gamma,delta}
# Output: enabled (all)
```

## Backup

### Backup Validator Keys

```bash
cd ~/Demiurge-Blockchain/testnet
./scripts/manage.sh backup all
```

Backups are stored in `/var/backups/demiurge/`

### Manual Backup

```bash
sudo tar -czf validator-keys-backup.tar.gz /var/lib/demiurge/validator-*/validator.key
```

## Troubleshooting

### Validators Not Starting

```bash
# Check logs
journalctl -u demiurge-validator-alpha -n 50

# Check ports
netstat -tlnp | grep demiurge

# Restart
systemctl restart demiurge-validator-alpha
```

### Port Conflicts

If you see "Address already in use" errors:

```bash
# Find conflicting process
sudo netstat -tlnp | grep :30337

# Kill old process if needed
sudo kill -9 <PID>

# Restart validator
systemctl restart demiurge-validator-alpha
```

### Low Peer Count

Validators should connect to each other via P2P. Check logs for connection messages.

## Next Steps

1. ✅ Validators deployed and running
2. ⏳ Monitor block production
3. ⏳ Test consensus scenarios
4. ⏳ Integrate with frontend (update RPC endpoints)
5. ⏳ Performance testing
6. ⏳ Multi-server deployment (true decentralization)

## Production Notes

**Current Setup:** Single-server multi-node testnet  
**Purpose:** Testing consensus, BFT, validator rotation  
**Next Phase:** Deploy validators across multiple servers for true decentralization

## Support

- Logs: `journalctl -u demiurge-validator-alpha -f`
- Status: `systemctl status demiurge-validator-alpha`
- Manage: `~/Demiurge-Blockchain/testnet/scripts/manage.sh`
- Monitor: `~/Demiurge-Blockchain/testnet/scripts/monitor.sh`

---

**Deployment completed by:** Automated deployment script  
**Last updated:** January 30, 2026
