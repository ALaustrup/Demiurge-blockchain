# RPC Status Fix Instructions

## Issue
The RPC endpoint is returning 502 Bad Gateway, indicating the chain service is not running or not accessible.

## Current Configuration
- **RPC Port**: 8545 (configured in `chain/configs/node.toml`)
- **Nginx Proxy**: `rpc.demiurge.cloud` → `http://127.0.0.1:8545/`
- **Service Name**: `Node1` (systemd service)

## Fix Steps

### 1. Check Chain Service Status
```bash
ssh -i ~/.ssh/Node1 ubuntu@51.210.209.112
sudo systemctl status Node1
```

### 2. If Service is Not Running
```bash
sudo systemctl start Node1
sudo systemctl enable Node1  # Enable on boot
```

### 3. Check Service Logs
```bash
sudo journalctl -u Node1 -f --no-pager
```

### 4. Verify RPC Port is Listening
```bash
sudo netstat -tlnp | grep 8545
# or
sudo ss -tlnp | grep 8545
```

### 5. Test RPC Endpoint Locally
```bash
curl -X POST http://127.0.0.1:8545/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"cgt_getChainInfo","params":[],"id":1}'
```

### 6. If Service Needs Restart
```bash
sudo systemctl restart Node1
```

### 7. Verify Nginx Configuration
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Expected Response
A successful RPC call should return:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "height": <number>,
    "chain_id": 77701,
    "name": "Demiurge Mainnet"
  },
  "id": 1
}
```

## Frontend Improvements
The frontend has been updated with:
- Improved error handling in `useChainStatus.ts`
- 10-second timeout (increased from 5 seconds)
- Better error messages
- Automatic retry functionality

## Monitoring
To monitor RPC status:
```bash
# Watch service logs
sudo journalctl -u Node1 -f

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test RPC endpoint
watch -n 5 'curl -s -X POST https://rpc.demiurge.cloud/rpc -H "Content-Type: application/json" -d "{\"jsonrpc\":\"2.0\",\"method\":\"cgt_getChainInfo\",\"params\":[],\"id\":1}"'
```

