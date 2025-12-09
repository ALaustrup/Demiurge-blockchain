#!/bin/bash
# IGNITION SEQUENCE: "THE ARCHON PULSE"
# PHASE OMEGA PART VI: Activates the Prime Archon per-block enforcement

set -e

echo "🔥 IGNITION SEQUENCE: THE ARCHON PULSE"
echo ""

# STEP 1: Stop the Node (Clean Shutdown)
echo "STEP 1: Stopping demiurge-node0..."
sudo systemctl stop demiurge-node0
echo "✅ Node stopped"
echo "Waiting 3 seconds for RocksDB locks to flush..."
sleep 3

# STEP 2: Rebuild the Node with Archon Enforcement
echo ""
echo "STEP 2: Rebuilding chain with Archon enforcement..."
cd chain
cargo clean
cargo build --release
echo "✅ Build complete"

# STEP 3: Deploy Updated Binary to Server
echo ""
echo "STEP 3: Deploying binary to server..."
echo "⚠️  MANUAL STEP REQUIRED:"
echo "   Run from your local machine:"
echo "   scp target/release/demiurge-chain ubuntu@51.210.209.112:/opt/demiurge/target/release/"
echo ""
read -p "Press Enter after binary has been deployed..."

# STEP 4: Restart the Node with the Pulse Enabled
echo ""
echo "STEP 4: Restarting node..."
sudo systemctl restart demiurge-node0
echo "✅ Node restarted"
echo ""
echo "⚠️  MANUAL STEP REQUIRED:"
echo "   Tail logs with: sudo journalctl -u demiurge-node0 -f"
echo "   Look for:"
echo "   [ARCHON_EVENT] Heartbeat evaluated"
echo "   [ARCHON_DIRECTIVE] A0: State unified"
echo "   [ARCHON_HEARTBEAT] Pulse initialized"
echo ""
read -p "Press Enter after verifying logs show Archon events..."

# STEP 5: Verify RPC Exposure
echo ""
echo "STEP 5: Verifying RPC exposure..."
echo "⚠️  MANUAL STEP REQUIRED:"
echo "   Run from your workstation:"
echo "   curl -X POST https://rpc.demiurge.cloud/rpc \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"jsonrpc\":\"2.0\",\"method\":\"archon_state\",\"params\":[],\"id\":1}'"
echo ""
read -p "Press Enter after RPC test succeeds..."

# STEP 6: AbyssOS Synchronization
echo ""
echo "STEP 6: AbyssOS Synchronization"
echo "⚠️  MANUAL VERIFICATION REQUIRED:"
echo "   Open AbyssOS → Archon Panel"
echo "   Verify:"
echo "   - Archon state updating every 500ms"
echo "   - Directives table showing A0 pulses"
echo "   - Diagnostics panel with green checks"
echo "   - Heartbeat indicator animating"
echo ""
read -p "Press Enter after AbyssOS verification..."

# STEP 7: Seal the First Pulse
echo ""
echo "STEP 7: Sealing the first pulse..."
PULSE_LOG="/opt/demiurge/PULSE_LOG.txt"
echo "$(date -u) — PRIME ARCHON PULSE IGNITED" | sudo tee -a "$PULSE_LOG"
echo "✅ Pulse logged"

# Generate pulse seal
cd /opt/demiurge
if [ -f "scripts/update-sovereignty-seal.ts" ]; then
    echo "Generating PULSE_SEAL.json..."
    sudo node scripts/update-sovereignty-seal.ts
    echo "✅ Pulse seal generated"
else
    echo "⚠️  update-sovereignty-seal.ts not found, creating PULSE_SEAL.json manually..."
    sudo tee /opt/demiurge/PULSE_SEAL.json > /dev/null <<EOF
{
  "archon_pulse": "IGNITED",
  "pulse_height": 0,
  "execution_mode": "per_block_enforcement",
  "ignited_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "ACTIVE"
}
EOF
    echo "✅ PULSE_SEAL.json created"
fi

echo ""
echo "🎉 IGNITION SEQUENCE COMPLETE"
echo "THE ARCHON PULSE IS NOW ACTIVE"
echo "THE FLAME BURNS ETERNAL. THE CODE SERVES THE WILL."
