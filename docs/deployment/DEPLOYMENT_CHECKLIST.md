# Prime Archon Pulse - Deployment Checklist

**Date:** January 5, 2026  
**Status:** Ready for Deployment

---

## ✅ Pre-Deployment Verification

- [x] All compilation errors resolved
- [x] Binary builds successfully
- [x] Archon modules integrated
- [x] RPC endpoint configured
- [x] Ignition scripts prepared

---

## 📦 Step 1: Build Binary (Local)

**Status:** ✅ Complete

```powershell
cd C:\Repos\DEMIURGE\chain
cargo build --release
```

**Expected Output:**
- Binary location: `target/release/demiurge-chain.exe` (Windows) or `target/release/demiurge-chain` (Linux)
- Size: ~10-50 MB (depending on optimizations)
- No compilation errors

---

## 🚀 Step 2: Deploy to Server

**⚠️ Manual Step Required**

You need to transfer the binary to your server. Choose one method:

### Option A: SCP (from Windows PowerShell)

```powershell
# If you have OpenSSH installed
scp target/release/demiurge-chain ubuntu@51.210.209.112:/opt/demiurge/target/release/
```

**Note:** You'll be prompted for your SSH password or use SSH key authentication.

### Option B: SCP (from WSL/Linux)

```bash
scp target/release/demiurge-chain ubuntu@51.210.209.112:/opt/demiurge/target/release/
```

### Option C: Manual Upload

1. Use WinSCP, FileZilla, or similar SFTP client
2. Connect to `51.210.209.112` as user `ubuntu`
3. Navigate to `/opt/demiurge/target/release/`
4. Upload `demiurge-chain` binary
5. Set executable permissions: `chmod +x demiurge-chain`

---

## 🔥 Step 3: Run Ignition Sequence

**⚠️ Requires SSH Access to Server**

SSH into your server and run:

```bash
ssh ubuntu@51.210.209.112
cd /opt/demiurge
sudo bash scripts/ignition-archon-pulse.sh
```

**Or follow manual steps from `IGNITION_SEQUENCE.md`:**

1. **Stop the Node:**
   ```bash
   sudo systemctl stop demiurge-node0
   ```

2. **Backup Old Binary (optional but recommended):**
   ```bash
   sudo cp /opt/demiurge/target/release/demiurge-chain /opt/demiurge/target/release/demiurge-chain.backup
   ```

3. **Replace Binary:**
   ```bash
   sudo cp /tmp/demiurge-chain /opt/demiurge/target/release/demiurge-chain
   sudo chmod +x /opt/demiurge/target/release/demiurge-chain
   ```

4. **Restart Service:**
   ```bash
   sudo systemctl restart demiurge-node0
   ```

5. **Monitor Logs:**
   ```bash
   sudo journalctl -u demiurge-node0 -f
   ```

**Look for these Archon events within 3 seconds:**
- `[ARCHON_EVENT] Heartbeat evaluated`
- `[ARCHON_DIRECTIVE] A0: State unified`
- `[ARCHON_HEARTBEAT] Pulse initialized`

---

## ✅ Step 4: Verify Archon Pulse

### 4.1 Check Node Logs

```bash
sudo journalctl -u demiurge-node0 -n 50 | grep ARCHON
```

**Expected Output:**
```
[ARCHON_EVENT] Heartbeat evaluated
[ARCHON_DIRECTIVE] A0: State unified
[ARCHON_HEARTBEAT] Pulse initialized at height: 12345
```

### 4.2 Test RPC Endpoint

From your local machine or server:

```bash
curl -X POST https://rpc.demiurge.cloud/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"archon_state","params":[],"id":1}'
```

**Expected Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "runtime_version": "0.1.0",
    "state_root": "0x...",
    "node_id": "node-0",
    "invariants_ok": true,
    "integrity_hash": "...",
    "block_height": 12345,
    "timestamp": 1234567890,
    "runtime_registry_hash": "...",
    "sdk_compatibility_hash": "...",
    "sovereignty_seal_hash": "..."
  },
  "id": 1
}
```

### 4.3 Verify AbyssOS Integration

1. Open AbyssOS portal
2. Navigate to Archon Panel
3. Verify:
   - Archon state updates every 500ms
   - Directives table shows A0 pulses
   - Diagnostics panel shows green checks
   - Heartbeat indicator animates

---

## 🎯 Step 5: Generate Pulse Seal

After successful verification:

```bash
cd /opt/demiurge
sudo bash scripts/generate-pulse-seal.sh
```

This creates `PULSE_SEAL.json` with:
- Archon pulse status
- Current block height
- Execution mode
- Component hashes

---

## 🚨 Troubleshooting

### Binary Not Found
```bash
# Check if binary exists
ls -lh /opt/demiurge/target/release/demiurge-chain

# Check permissions
sudo chmod +x /opt/demiurge/target/release/demiurge-chain
```

### Service Won't Start
```bash
# Check service status
sudo systemctl status demiurge-node0

# Check logs for errors
sudo journalctl -u demiurge-node0 -n 100
```

### No Archon Events in Logs
```bash
# Verify binary is new version
/opt/demiurge/target/release/demiurge-chain --version

# Check if Archon module is loaded
strings /opt/demiurge/target/release/demiurge-chain | grep ARCHON
```

### RPC Endpoint Not Responding
```bash
# Check if RPC server is running
netstat -tlnp | grep 8545

# Test locally
curl -X POST http://localhost:8545/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"archon_state","params":[],"id":1}'
```

---

## 📋 Post-Deployment Checklist

- [ ] Binary deployed successfully
- [ ] Service restarted without errors
- [ ] Archon events appear in logs
- [ ] RPC endpoint responds correctly
- [ ] AbyssOS shows Archon state
- [ ] Pulse seal generated
- [ ] All diagnostics pass

---

## 🎉 Success Criteria

The Prime Archon Pulse is **IGNITED** when:

1. ✅ Node logs show `[ARCHON_EVENT]` messages every block
2. ✅ RPC `archon_state` returns valid ASV
3. ✅ AbyssOS displays real-time Archon presence
4. ✅ `PULSE_SEAL.json` confirms ignition

---

**THE FLAME BURNS ETERNAL. THE CODE SERVES THE WILL.**

**Ready for deployment. Execute with precision.**
