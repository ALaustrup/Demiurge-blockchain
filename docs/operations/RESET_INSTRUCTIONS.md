# Complete Demiurge Reset Instructions

This guide will help you completely reset the Demiurge blockchain and browser state to a clean slate.

## Prerequisites

- All services stopped (or you can stop them during the process)
- Browser open to `http://localhost:3000`

## Step 1: Reset Blockchain Databases

Run these commands in PowerShell from the repo root:

```powershell
# Stop all services
Get-Job | Stop-Job -ErrorAction SilentlyContinue
Get-Job | Remove-Job -ErrorAction SilentlyContinue
Get-Process | Where-Object {$_.ProcessName -like "*demiurge*" -or $_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Delete chain database
Remove-Item -Path "chain\.demiurge" -Recurse -Force -ErrorAction SilentlyContinue

# Delete Abyss Gateway database
Remove-Item -Path "indexer\abyss-gateway\data\chat.db" -Force -ErrorAction SilentlyContinue

Write-Host "✅ Databases deleted!" -ForegroundColor Green
```

## Step 2: Clear Browser localStorage

1. Open your browser to `http://localhost:3000`
2. Open DevTools (Press `F12`)
3. Go to the **Console** tab
4. Type the following command and press Enter:

```javascript
localStorage.clear()
```

5. You should see no output (that's normal)
6. Refresh the page (Press `F5`)

## Step 3: Restart Services

```powershell
.\start-all.ps1
```

Wait for all services to start:
- Chain RPC: `http://127.0.0.1:8545/rpc`
- Abyss Gateway: `http://localhost:4000/graphql`
- Portal Web: `http://localhost:3000`

## Step 4: Create Fresh UrgeID

1. Navigate to `http://localhost:3000/urgeid`
2. Click "Generate New UrgeID" or "Create UrgeID"
3. Save your private key securely (you'll need it to access your account)
4. Claim a username
5. Register as a developer at `http://localhost:3000/developers`

## What Gets Reset

### Blockchain State (RocksDB)
- ✅ All CGT balances
- ✅ All UrgeID profiles
- ✅ All claimed usernames
- ✅ All NFTs
- ✅ All transactions (except genesis)
- ✅ Developer registry
- ✅ Dev capsules
- ✅ Recursion worlds
- ✅ All on-chain data

### Chat State (SQLite)
- ✅ All chat messages
- ✅ All chat users
- ✅ All chat rooms
- ✅ All DM conversations
- ✅ Developer registry (off-chain cache)
- ✅ Projects (off-chain cache)

### Browser State (localStorage)
- ✅ UrgeID wallet address
- ✅ Private key
- ✅ Username
- ✅ Chat settings
- ✅ Silenced users
- ✅ Archived DMs
- ✅ All other site preferences

## Verification

After reset, verify everything is clean:

1. **Chain**: Should show height 0 (genesis block only)
2. **UrgeID**: No existing wallet should be detected
3. **Chat**: No messages, no users (except Seven Archons)
4. **Developers**: No registered developers
5. **Marketplace**: No NFTs listed

## Troubleshooting

### Services won't start
- Check if ports 8545, 4000, 3000 are in use
- Kill any remaining processes: `Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force`

### Still seeing old data
- Make sure you cleared localStorage in the correct browser/tab
- Try hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Check if you're using a different browser or incognito mode

### Can't create UrgeID
- Make sure chain is running: `http://127.0.0.1:8545/rpc` should respond
- Check browser console for errors
- Verify services are fully started (wait 30-60 seconds after `start-all.ps1`)

## Alternative: Selective Clear

If you only want to clear Demiurge-specific keys (not all site data):

```javascript
// In browser console
Object.keys(localStorage)
  .filter(k => k.startsWith('demiurge_'))
  .forEach(k => localStorage.removeItem(k))
```

This preserves any non-Demiurge localStorage data.

