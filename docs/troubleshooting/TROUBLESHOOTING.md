# Troubleshooting Guide

**Last Updated:** February 4, 2026

Solutions to common issues when working with the Demiurge Protocol.

---

## Quick Diagnostics

Run these commands to quickly diagnose issues:

```bash
# Check node health
curl -X POST http://localhost:9944 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"chain_getHealth","params":[]}'

# Check block production
curl -X POST http://localhost:9944 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"chain_getBlockNumber","params":[]}'

# Check CLI connectivity
demiurge chain status
```

---

## Node Issues

### Node Won't Start

**Symptoms:** Node crashes immediately or fails to start

**Solutions:**

1. **Check port availability**
   ```bash
   # Linux/macOS
   lsof -i :9944
   lsof -i :30333
   
   # Windows
   netstat -ano | findstr :9944
   ```

2. **Check data directory permissions**
   ```bash
   ls -la /path/to/data
   # Should be readable/writable by current user
   chmod 755 /path/to/data
   ```

3. **Check Rust version**
   ```bash
   rustc --version
   # Should be 1.75+
   rustup update
   ```

4. **Clean build**
   ```bash
   cd framework
   cargo clean
   cargo build --release
   ```

### Node Not Producing Blocks

**Symptoms:** Block number stays the same

**Solutions:**

1. **Check if validator is enabled**
   ```bash
   # In node config or command line
   --validator-enabled true
   ```

2. **Check validator registration**
   ```bash
   demiurge validator status
   ```

3. **Check peer connections**
   ```bash
   curl -X POST http://localhost:9944 \
     -d '{"jsonrpc":"2.0","id":1,"method":"system_peers","params":[]}'
   ```

### Node Syncing Slowly

**Symptoms:** Block height increasing slowly

**Solutions:**

1. **Add more peers**
   ```bash
   --bootnodes /ip4/127.0.0.1/tcp/30333/p2p/...
   ```

2. **Increase cache size**
   ```bash
   --cache-size 512  # MB
   ```

3. **Check network bandwidth**
   ```bash
   # Install speedtest-cli
   speedtest-cli
   ```

---

## RPC Issues

### RPC Not Responding

**Symptoms:** Connection refused or timeout

**Solutions:**

1. **Check node is running**
   ```bash
   # Linux
   systemctl status demiurge-node
   
   # Docker
   docker ps | grep demiurge
   ```

2. **Check RPC binding address**
   ```bash
   # Bind to all interfaces for external access
   --rpc-addr 0.0.0.0:9944
   
   # Bind to localhost only for local access
   --rpc-addr 127.0.0.1:9944
   ```

3. **Check firewall**
   ```bash
   # Linux
   sudo ufw allow 9944/tcp
   
   # Check iptables
   sudo iptables -L -n | grep 9944
   ```

### RPC Returns Errors

**Common error codes:**

| Code | Meaning | Solution |
|------|---------|----------|
| -32700 | Parse error | Check JSON syntax |
| -32600 | Invalid request | Check method name and params |
| -32601 | Method not found | Update SDK/CLI version |
| -32602 | Invalid params | Check parameter types and count |
| -32603 | Internal error | Check node logs |

---

## Wallet Issues

### Wallet Extension Not Loading

**Symptoms:** Extension icon missing or grayed out

**Solutions:**

1. **Rebuild extension**
   ```bash
   cd apps/wallet-extension
   npm install
   npm run build
   ```

2. **Reload in Chrome**
   - Go to `chrome://extensions`
   - Click reload icon on Demiurge Wallet
   - Or remove and re-add the extension

3. **Check console for errors**
   - Right-click extension icon > Inspect popup
   - Check for JavaScript errors

### Wallet Won't Unlock

**Symptoms:** Password rejected

**Solutions:**

1. **Check caps lock**

2. **Clear and reimport**
   - Settings > Clear All Data
   - Import using mnemonic

3. **Check for corrupt storage**
   - Chrome: `chrome://settings/siteData`
   - Search for "demiurge"
   - Clear data

### Transaction Fails to Sign

**Symptoms:** Signing error or timeout

**Solutions:**

1. **Check wallet is unlocked**

2. **Verify account has balance**
   ```javascript
   const balance = await window.demiurge.getBalance(address);
   ```

3. **Check network connectivity**
   ```javascript
   const network = await window.demiurge.getNetwork();
   console.log('Network:', network);
   ```

---

## SDK Issues

### SDK Build Fails

**Symptoms:** TypeScript errors during build

**Solutions:**

1. **Update dependencies**
   ```bash
   cd sdk
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Check Node.js version**
   ```bash
   node --version  # Should be 18+
   nvm use 20
   ```

3. **Check TypeScript version**
   ```bash
   npx tsc --version
   ```

### SDK Signing Fails

**Symptoms:** Invalid signature errors

**Solutions:**

1. **Check address format**
   ```typescript
   // Address should be 64 hex chars (without 0x prefix)
   const valid = Wallet.isValidAddress(address);
   ```

2. **Use async signing in browser**
   ```typescript
   // Browser requires async
   const sig = await wallet.signAsync(message);
   
   // Not sync version
   // const sig = wallet.sign(message); // May fail
   ```

---

## CLI Issues

### CLI Command Not Found

**Symptoms:** `demiurge: command not found`

**Solutions:**

1. **Install globally**
   ```bash
   npm install -g @demiurge/cli
   ```

2. **Check npm path**
   ```bash
   npm bin -g
   # Add to PATH if not present
   ```

3. **Use npx**
   ```bash
   npx @demiurge/cli chain status
   ```

### CLI Connection Failed

**Symptoms:** RPC connection errors

**Solutions:**

1. **Set RPC URL**
   ```bash
   export DEMIURGE_RPC_URL=http://localhost:9944
   
   # Or use flag
   demiurge --rpc-url http://localhost:9944 chain status
   ```

2. **Check network connectivity**
   ```bash
   curl http://localhost:9944
   ```

---

## Docker Issues

### Containers Won't Start

**Symptoms:** Containers exit immediately

**Solutions:**

1. **Check logs**
   ```bash
   docker compose -f docker-compose.testnet.yml logs
   ```

2. **Rebuild images**
   ```bash
   docker compose -f docker-compose.testnet.yml build --no-cache
   ```

3. **Check resources**
   ```bash
   docker system df
   docker system prune -f
   ```

### Containers Can't Connect

**Symptoms:** Nodes don't see each other

**Solutions:**

1. **Check network**
   ```bash
   docker network ls
   docker network inspect docker_demiurge-testnet
   ```

2. **Check DNS resolution**
   ```bash
   docker exec -it docker-node1-1 ping node2
   ```

---

## Common Error Messages

### "Insufficient Balance"

**Cause:** Account doesn't have enough CGT

**Solution:**
- Check balance: `demiurge wallet balance <address>`
- Claim starter: `demiurge wallet claim-starter`
- Request from faucet (testnet)

### "Invalid Signature"

**Cause:** Signature doesn't match message or public key

**Solution:**
- Ensure correct private key is used
- Check message encoding (UTF-8)
- Verify public key matches address

### "Transaction Already Known"

**Cause:** Same transaction submitted twice

**Solution:**
- Wait for confirmation
- Use unique nonce for each transaction

### "Account Not Found"

**Cause:** Account has no on-chain state

**Solution:**
- Send some CGT to the account first
- Claim starter bonus

---

## Getting Help

If you can't resolve an issue:

1. **Check GitHub Issues**
   https://github.com/ALaustrup/Demiurge-Blockchain/issues

2. **Open New Issue**
   Include:
   - Operating system
   - Node/Rust versions
   - Full error message
   - Steps to reproduce

3. **Join Discord**
   https://discord.gg/demiurge

---

## Related Documentation

- [Complete Setup Guide](../developers/COMPLETE_SETUP_GUIDE.md)
- [RPC Reference](../developers/rpc-reference.md)
- [Docker Testnet](../deployment/DOCKER_TESTNET.md)
