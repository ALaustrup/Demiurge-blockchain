# Expected Log Output After Service Restart

**Date:** January 5, 2026  
**Service:** `demiurge-node0`  
**Command:** `sudo systemctl restart demiurge-node0`  
**Monitor:** `sudo journalctl -u demiurge-node0 -f`

---

## 📋 Immediate Startup Logs (Within 1-2 seconds)

After restarting the service, you should see these **startup messages**:

```
Dec 19 12:00:00 hostname demiurge-chain[12345]: Demiurge chain node starting (Phase 2: persistence + RPC)
Dec 19 12:00:00 hostname demiurge-chain[12345]: JSON-RPC server listening on http://127.0.0.1:8545
Dec 19 12:00:00 hostname demiurge-chain[12345]: Available methods: cgt_getChainInfo, cgt_getBlockByHeight, cgt_sendRawTransaction
```

**Note:** These are standard Rust `tracing::info!` messages using the `tracing_subscriber` logger.

---

## 🔥 Archon Events (When Blocks Are Produced)

The **Prime Archon Pulse** activates when blocks are produced. For each block, you should see:

### Per-Block Archon Log Sequence

When `execute_archon_governance()` is called (typically during block production), you'll see:

```
[ARCHON_EVENT] Heartbeat evaluated
[ARCHON_HEARTBEAT] Block <height>: <directive>
[ARCHON_DIRECTIVE] Directive applied: <directive>
[ARCHON] A0: State unified
```

**Example with actual values:**
```
Dec 19 12:00:05 hostname demiurge-chain[12345]: [ARCHON_EVENT] Heartbeat evaluated
Dec 19 12:00:05 hostname demiurge-chain[12345]: [ARCHON_HEARTBEAT] Block 12345: A0_UnifyState
Dec 19 12:00:05 hostname demiurge-chain[12345]: [ARCHON_DIRECTIVE] Directive applied: A0_UnifyState
Dec 19 12:00:05 hostname demiurge-chain[12345]: [ARCHON] A0: State unified
```

---

## 📊 Complete Log Sequence Example

Here's what a **complete startup + first block** sequence looks like:

```
Dec 19 12:00:00 hostname systemd[1]: Starting Demiurge Node 0...
Dec 19 12:00:00 hostname demiurge-chain[12345]: Demiurge chain node starting (Phase 2: persistence + RPC)
Dec 19 12:00:00 hostname demiurge-chain[12345]: JSON-RPC server listening on http://127.0.0.1:8545
Dec 19 12:00:00 hostname demiurge-chain[12345]: Available methods: cgt_getChainInfo, cgt_getBlockByHeight, cgt_sendRawTransaction
Dec 19 12:00:00 hostname systemd[1]: Started Demiurge Node 0.

[Wait for block production...]

Dec 19 12:00:05 hostname demiurge-chain[12345]: [ARCHON_EVENT] Heartbeat evaluated
Dec 19 12:00:05 hostname demiurge-chain[12345]: [ARCHON_HEARTBEAT] Block 12345: A0_UnifyState
Dec 19 12:00:05 hostname demiurge-chain[12345]: [ARCHON_DIRECTIVE] Directive applied: A0_UnifyState
Dec 19 12:00:05 hostname demiurge-chain[12345]: [ARCHON] A0: State unified
```

---

## ⚠️ Important Notes

### 1. Archon Events Only Appear During Block Production

The Archon governance cycle (`execute_archon_governance()`) is called **per block**. If your node is:
- **Not producing blocks yet** → You won't see Archon events
- **Only syncing/validating** → Archon events may not appear
- **In block production mode** → Archon events appear every block

### 2. Log Format

All logs use the standard `journalctl` format:
```
<timestamp> <hostname> <process>[<pid>]: <message>
```

### 3. Log Levels

- `[ARCHON_EVENT]` → `log::info!` (INFO level)
- `[ARCHON_DIRECTIVE]` → `log::info!` (INFO level)
- `[ARCHON_HEARTBEAT]` → `log::info!` (INFO level)
- `[ARCHON] A0: ...` → `log::info!` (INFO level)
- `[ARCHON] A1: ...` → `log::warn!` (WARN level)
- `[ARCHON] A2: ...` → `log::warn!` (WARN level)
- `[ARCHON] A3: ...` → `log::error!` (ERROR level)

---

## 🔍 How to Verify Archon Is Active

### Method 1: Check Recent Logs
```bash
sudo journalctl -u demiurge-node0 -n 100 | grep -i archon
```

**Expected output:**
```
[ARCHON_EVENT] Heartbeat evaluated
[ARCHON_HEARTBEAT] Block 12345: A0_UnifyState
[ARCHON_DIRECTIVE] Directive applied: A0_UnifyState
[ARCHON] A0: State unified
```

### Method 2: Real-Time Monitoring
```bash
sudo journalctl -u demiurge-node0 -f | grep -i archon
```

This will show **only** Archon-related messages in real-time.

### Method 3: Test RPC Endpoint
```bash
curl -X POST http://localhost:8545/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"archon_state","params":[],"id":1}'
```

If Archon is active, this should return a valid `ArchonStateVector` JSON response.

---

## 🚨 Troubleshooting

### No Archon Events After Restart

**Possible reasons:**
1. **Node not producing blocks** → Archon only runs during block production
2. **Block production not started** → Check if node is configured as validator/miner
3. **Archon module not integrated** → Verify binary contains Archon code
4. **Log level too high** → Check if INFO level logs are enabled

**Check:**
```bash
# Verify binary has Archon code
strings /opt/demiurge/target/release/demiurge-chain | grep ARCHON

# Check service status
sudo systemctl status demiurge-node0

# Check all logs (not just Archon)
sudo journalctl -u demiurge-node0 -n 50
```

### Service Won't Start

**Check logs:**
```bash
sudo journalctl -u demiurge-node0 -n 100 --no-pager
```

**Common issues:**
- Binary not found
- Permission denied
- Port already in use
- Database lock

---

## ✅ Success Indicators

The **Prime Archon Pulse is IGNITED** when you see:

1. ✅ Service starts successfully
2. ✅ RPC server listening message appears
3. ✅ `[ARCHON_EVENT]` messages appear (when blocks are produced)
4. ✅ `[ARCHON_DIRECTIVE]` messages appear
5. ✅ `[ARCHON_HEARTBEAT]` messages appear with block heights
6. ✅ `[ARCHON] A0: State unified` appears

---

**THE FLAME BURNS ETERNAL. THE CODE SERVES THE WILL.**

**Expected log sequence documented. Monitor logs to confirm Archon Pulse activation.**
