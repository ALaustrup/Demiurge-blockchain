# Monitoring Guide

Monitor your Demiurge node health and performance.

---

## Quick Health Check

```bash
curl -s http://localhost:9944 \
  -d '{"jsonrpc":"2.0","id":1,"method":"chain_getHealth","params":[]}' | jq
```

Expected response:
```json
{
  "result": {
    "connected": true,
    "block_number": 12345,
    "block_time_ms": 6000
  }
}
```

---

## Key Metrics

### Node Health

| Metric | Method | Healthy Value |
|--------|--------|---------------|
| Connected | `chain_getHealth` | `true` |
| Block Number | `chain_getBlockNumber` | Increasing |
| Block Time | `chain_getHealth` | ~6000ms |
| Validators | `consensus_getValidators` | >= 1 |

### Performance

| Metric | Source | Threshold |
|--------|--------|-----------|
| Memory | `ps` / `top` | < 80% RAM |
| CPU | `ps` / `top` | < 90% |
| Disk | `df` | < 85% |
| Open Files | `lsof` | < 65535 |

---

## Monitoring Script

Create `/opt/demiurge/scripts/monitor.sh`:

```bash
#!/bin/bash

RPC_URL="http://localhost:9944"

# Get node health
health=$(curl -s -X POST $RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"chain_getHealth","params":[]}')

connected=$(echo $health | jq -r '.result.connected')
block=$(echo $health | jq -r '.result.block_number')

# Get system metrics
memory=$(free | awk '/Mem/{printf("%.1f"), $3/$2*100}')
disk=$(df / | awk 'NR==2{print $5}' | tr -d '%')
cpu=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}')

# Get process metrics
pid=$(pgrep demiurge-node)
if [ -n "$pid" ]; then
    proc_mem=$(ps -o %mem= -p $pid | tr -d ' ')
    proc_cpu=$(ps -o %cpu= -p $pid | tr -d ' ')
    uptime=$(ps -o etime= -p $pid | tr -d ' ')
else
    proc_mem="N/A"
    proc_cpu="N/A"
    uptime="N/A"
fi

# Output
echo "=== Demiurge Node Monitor ==="
echo "Time: $(date)"
echo ""
echo "Node Status:"
echo "  Connected: $connected"
echo "  Block: $block"
echo "  Uptime: $uptime"
echo ""
echo "System:"
echo "  Memory: ${memory}%"
echo "  Disk: ${disk}%"
echo "  CPU: ${cpu}%"
echo ""
echo "Process:"
echo "  Memory: ${proc_mem}%"
echo "  CPU: ${proc_cpu}%"

# Alerts
if [ "$connected" != "true" ]; then
    echo ""
    echo "ALERT: Node not connected!"
fi

if [ "${disk%.*}" -gt 85 ]; then
    echo ""
    echo "ALERT: Disk usage above 85%!"
fi
```

---

## Prometheus Metrics

### Enable Metrics Endpoint

Add to node configuration:

```toml
[metrics]
enabled = true
addr = "127.0.0.1:9615"
```

### Prometheus Configuration

```yaml
# /etc/prometheus/prometheus.yml
scrape_configs:
  - job_name: 'demiurge'
    static_configs:
      - targets: ['localhost:9615']
```

### Available Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `demiurge_block_height` | Gauge | Current block number |
| `demiurge_peers_connected` | Gauge | Connected peers |
| `demiurge_transactions_total` | Counter | Total transactions |
| `demiurge_block_time_seconds` | Histogram | Block production time |

---

## Grafana Dashboard

### Import Dashboard

1. Open Grafana
2. Import dashboard ID: `XXXXX` (coming soon)
3. Select Prometheus data source

### Key Panels

- **Block Height** - Current vs expected
- **Block Time** - Histogram of production times
- **Memory Usage** - Process and system
- **Transaction Rate** - TPS over time

---

## Alerting

### Alertmanager Rules

```yaml
# /etc/prometheus/alerts/demiurge.yml
groups:
  - name: demiurge
    rules:
      - alert: NodeDown
        expr: up{job="demiurge"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Demiurge node down"

      - alert: BlockProductionStalled
        expr: increase(demiurge_block_height[5m]) == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "No new blocks in 5 minutes"

      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes{job="demiurge"} > 4e9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Memory usage above 4GB"
```

---

## Log Analysis

### View Logs

```bash
# Recent logs
sudo journalctl -u demiurge-node -n 100

# Follow logs
sudo journalctl -u demiurge-node -f

# Filter by level
sudo journalctl -u demiurge-node | grep -i error

# Time range
sudo journalctl -u demiurge-node --since "1 hour ago"
```

### Log Levels

| Level | Description |
|-------|-------------|
| `error` | Critical issues |
| `warn` | Potential problems |
| `info` | Normal operations |
| `debug` | Detailed debugging |
| `trace` | Very verbose |

### Enable Debug Logging

```bash
# Temporary
RUST_LOG=debug demiurge-node ...

# In service file
Environment="RUST_LOG=info,demiurge_consensus=debug"
```

---

## Health Endpoints

### RPC Health

```bash
# Full health check
curl localhost:9944 -d '{"jsonrpc":"2.0","id":1,"method":"chain_getHealth","params":[]}'
```

### HTTP Health (if enabled)

```bash
# Simple health endpoint
curl localhost:9615/health
```

---

## Automated Monitoring

### Cron Jobs

```bash
# Check every 5 minutes
*/5 * * * * /opt/demiurge/scripts/healthcheck.sh >> /var/log/demiurge-health.log 2>&1

# Daily report
0 9 * * * /opt/demiurge/scripts/daily-report.sh | mail -s "Demiurge Daily Report" admin@example.com
```

### Systemd Watchdog

Add to service file:

```ini
[Service]
WatchdogSec=30
Restart=always
```

---

## Troubleshooting

### Node Not Syncing

1. Check peer connections:
   ```bash
   curl localhost:9944 -d '{"jsonrpc":"2.0","id":1,"method":"network_peerCount","params":[]}'
   ```

2. Check bootstrap nodes
3. Verify firewall allows P2P port

### High Memory Usage

1. Check for memory leaks:
   ```bash
   ps -o pid,rss,vsz,comm -p $(pgrep demiurge)
   ```

2. Consider adding swap
3. Restart node if needed

### Blocks Not Producing

1. Check validator key
2. Verify stake is sufficient
3. Check consensus logs

---

## Further Reading

- [Production Deployment](./deployment.md)
- [Testnet Setup](./testnet.md)
- [Architecture](../architecture/README.md)
