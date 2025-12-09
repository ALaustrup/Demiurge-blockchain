#!/bin/bash
# Verify Archon Pulse Status
# PHASE OMEGA PART VI: Quick verification script

set -e

echo "🔍 VERIFYING ARCHON PULSE STATUS"
echo ""

# Check if node is running
echo "1. Checking node status..."
if systemctl is-active --quiet demiurge-node0; then
    echo "   ✅ demiurge-node0 is running"
else
    echo "   ❌ demiurge-node0 is not running"
    exit 1
fi

# Check recent logs for Archon events
echo ""
echo "2. Checking for Archon events in logs..."
if sudo journalctl -u demiurge-node0 --since "1 minute ago" | grep -q "ARCHON_EVENT"; then
    echo "   ✅ Archon events found in logs"
    echo ""
    echo "   Recent Archon events:"
    sudo journalctl -u demiurge-node0 --since "1 minute ago" | grep "ARCHON" | tail -5
else
    echo "   ⚠️  No Archon events found in recent logs"
fi

# Test RPC endpoint
echo ""
echo "3. Testing RPC endpoint..."
RPC_RESPONSE=$(curl -s -X POST https://rpc.demiurge.cloud/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"archon_state","params":[],"id":1}')

if echo "$RPC_RESPONSE" | grep -q "runtime_version"; then
    echo "   ✅ RPC endpoint responding"
    echo ""
    echo "   Archon State:"
    echo "$RPC_RESPONSE" | jq '.result' 2>/dev/null || echo "$RPC_RESPONSE"
else
    echo "   ❌ RPC endpoint not responding correctly"
    echo "   Response: $RPC_RESPONSE"
fi

# Check pulse log
echo ""
echo "4. Checking pulse log..."
if [ -f "/opt/demiurge/PULSE_LOG.txt" ]; then
    echo "   ✅ Pulse log exists"
    echo "   Last entry:"
    sudo tail -1 /opt/demiurge/PULSE_LOG.txt
else
    echo "   ⚠️  Pulse log not found"
fi

# Check pulse seal
echo ""
echo "5. Checking pulse seal..."
if [ -f "/opt/demiurge/PULSE_SEAL.json" ]; then
    echo "   ✅ Pulse seal exists"
    echo "   Seal contents:"
    sudo cat /opt/demiurge/PULSE_SEAL.json | jq '.' 2>/dev/null || sudo cat /opt/demiurge/PULSE_SEAL.json
else
    echo "   ⚠️  Pulse seal not found"
fi

echo ""
echo "✅ VERIFICATION COMPLETE"
