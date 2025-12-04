#!/usr/bin/env bash
# Check RPC endpoint health for Demiurge Node0

set -euo pipefail

# RPC endpoint (from node.devnet.toml: rpc_port = 8545)
RPC_HOST="${RPC_HOST:-127.0.0.1}"
RPC_PORT="${RPC_PORT:-8545}"
RPC_URL="http://${RPC_HOST}:${RPC_PORT}/rpc"

echo "[NODE0] Checking RPC endpoint: ${RPC_URL}"

# Check if curl is installed
if ! command -v curl &> /dev/null; then
    echo "Error: curl is not installed." >&2
    echo "Install it with: sudo apt-get install -y curl" >&2
    exit 1
fi

# Send getNetworkInfo request
RESPONSE=$(curl -s -X POST "${RPC_URL}" \
    -H 'Content-Type: application/json' \
    -d '{
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getNetworkInfo",
        "params": []
    }' || echo "ERROR")

# Check if we got a valid response
if [[ "${RESPONSE}" == "ERROR" ]] || [[ -z "${RESPONSE}" ]]; then
    echo "Error: RPC endpoint is not responding." >&2
    echo "Check if the service is running:" >&2
    echo "  sudo systemctl status demiurge-node0.service" >&2
    echo "Check logs:" >&2
    echo "  sudo journalctl -u demiurge-node0.service -n 50" >&2
    exit 1
fi

# Pretty print JSON response (if jq is available, otherwise just print)
if command -v jq &> /dev/null; then
    echo "[NODE0] RPC Response:"
    echo "${RESPONSE}" | jq .
else
    echo "[NODE0] RPC Response:"
    echo "${RESPONSE}"
    echo ""
    echo "Tip: Install 'jq' for pretty JSON output: sudo apt-get install -y jq"
fi

# Check if response contains expected fields
if echo "${RESPONSE}" | grep -q "chain_id"; then
    echo ""
    echo "[NODE0] ✓ RPC endpoint is healthy!"
    exit 0
else
    echo ""
    echo "Warning: RPC response may be invalid." >&2
    exit 1
fi

