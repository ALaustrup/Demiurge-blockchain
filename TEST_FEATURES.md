# Testing Guide: Usernames, Leveling & Username-Aware Transfers

## Prerequisites
1. Chain node running on `http://127.0.0.1:8545`
2. Portal running on `http://localhost:3000`

## Test 1: Create UrgeID Profile

1. Navigate to `http://localhost:3000/urgeid`
2. Click "Generate UrgeID Vault"
3. Fill in:
   - Display Name: `TestUser`
   - Bio: `Testing username and leveling features`
4. Click "Create UrgeID Profile"
5. ✅ Verify: Profile created, dashboard loads

## Test 2: Claim Username

1. In the dashboard, find the "Username" section
2. Enter a username (e.g., `testuser123`)
3. Click "Claim"
4. ✅ Verify: Username appears as `@testuser123` above the address
5. ✅ Verify: Copy button works

## Test 3: Username Validation

1. Try invalid usernames:
   - Too short: `ab` (should fail)
   - Invalid chars: `test@user` (should fail)
   - Already taken: Try claiming the same username twice (second should fail)
2. ✅ Verify: Error messages appear

## Test 4: Level & Progression Display

1. In dashboard, find "Progress & Contribution" section
2. ✅ Verify: Shows "Level: Lv. 1"
3. ✅ Verify: Shows "Syzygy Score: 0"
4. ✅ Verify: Progress bar shows 0% (or minimal progress)
5. ✅ Verify: Shows "CGT from level rewards: 0"

## Test 5: Record Syzygy & Level Up

Using PowerShell or curl, test the RPC:

```powershell
# Get your address from the portal dashboard
$address = "YOUR_ADDRESS_HERE"

# Record 5,000 Syzygy (should level up to level 2)
$body = @{
    jsonrpc = "2.0"
    method = "urgeid_recordSyzygy"
    params = @{
        address = $address
        amount = 5000
    }
    id = 1
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8545/rpc" -Method Post -Body $body -ContentType "application/json"
$response.result | ConvertTo-Json -Depth 5
```

Expected:
- ✅ Syzygy score increases
- ✅ Level increases (should be level 2 or 3 depending on thresholds)
- ✅ CGT balance increases (10 CGT per level)

## Test 6: Check Progress RPC

```powershell
$body = @{
    jsonrpc = "2.0"
    method = "urgeid_getProgress"
    params = @{
        address = $address
    }
    id = 1
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8545/rpc" -Method Post -Body $body -ContentType "application/json"
$response.result | ConvertTo-Json -Depth 5
```

Expected:
- ✅ Returns level, syzygyScore, thresholds, progressRatio
- ✅ progressRatio is between 0 and 1

## Test 7: Resolve Username

```powershell
$body = @{
    jsonrpc = "2.0"
    method = "urgeid_resolveUsername"
    params = @{
        username = "testuser123"
    }
    id = 1
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8545/rpc" -Method Post -Body $body -ContentType "application/json"
$response.result | ConvertTo-Json -Depth 5
```

Expected:
- ✅ Returns address matching your UrgeID

## Test 8: Get Profile by Username

```powershell
$body = @{
    jsonrpc = "2.0"
    method = "urgeid_getProfileByUsername"
    params = @{
        username = "testuser123"
    }
    id = 1
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8545/rpc" -Method Post -Body $body -ContentType "application/json"
$response.result | ConvertTo-Json -Depth 5
```

Expected:
- ✅ Returns full profile with username, level, syzygy_score, etc.

## Test 9: Portal Progress Bar Update

1. Record Syzygy via RPC (Test 5)
2. Refresh the portal dashboard
3. ✅ Verify: Progress bar updates
4. ✅ Verify: Level increases in UI
5. ✅ Verify: CGT balance shows rewards

## Test 10: Multiple Level Ups

Record enough Syzygy to level up multiple times:

```powershell
# Record 50,000 Syzygy (should level up multiple times)
$body = @{
    jsonrpc = "2.0"
    method = "urgeid_recordSyzygy"
    params = @{
        address = $address
        amount = 50000
    }
    id = 1
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8545/rpc" -Method Post -Body $body -ContentType "application/json"
```

Expected:
- ✅ Multiple level-ups occur
- ✅ CGT rewards accumulate (10 CGT per level)
- ✅ Progress bar resets for new level

## Test 11: Username-Aware Transfers

### Setup:
1. Create two UrgeIDs in the portal (use incognito window for the second one)
2. Claim username `testuser` for the first UrgeID
3. Note both addresses

### Test 11a: Transfer using Username

1. From the second UrgeID dashboard, go to "Send CGT" section
2. Enter `@testuser` or `testuser` in the recipient field
3. ✅ Verify: Confirmation shows `@testuser (xxxxx...xxxxx)`
4. Enter amount (e.g., `1.0` CGT)
5. Click "Send"
6. ✅ Verify: Transaction succeeds, status shows "pending" then "confirmed"
7. ✅ Verify: Transaction history shows the transfer

### Test 11b: Transfer using Address

1. In the same "Send CGT" section
2. Enter the first UrgeID's full 64-character address
3. ✅ Verify: Confirmation shows `Recipient: xxxxx...xxxxx`
4. Enter amount and click "Send"
5. ✅ Verify: Transaction succeeds

### Test 11c: Invalid Username

1. Enter an invalid username (e.g., `@nonexistent`)
2. ✅ Verify: Error message appears: "No UrgeID found for this username"
3. ✅ Verify: Send button is disabled

### Test 11d: RPC Username Resolution

```powershell
# Resolve username to address
$body = @{
    jsonrpc = "2.0"
    method = "urgeid_resolveUsername"
    params = @{
        username = "testuser"
    }
    id = 1
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8545/rpc" -Method Post -Body $body -ContentType "application/json"
$response.result | ConvertTo-Json -Depth 5
```

Expected:
- ✅ Returns address matching the first UrgeID

Record enough Syzygy to level up multiple times:

```powershell
# Record 50,000 Syzygy (should level up multiple times)
$body = @{
    jsonrpc = "2.0"
    method = "urgeid_recordSyzygy"
    params = @{
        address = $address
        amount = 50000
    }
    id = 1
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8545/rpc" -Method Post -Body $body -ContentType "application/json"
```

Expected:
- ✅ Multiple level-ups occur
- ✅ CGT rewards accumulate (10 CGT per level)
- ✅ Progress bar resets for new level

## Troubleshooting

- **Chain not responding**: Check `cargo run -p demiurge-chain` is running
- **Portal not loading**: Check `pnpm dev` is running on port 3000
- **RPC errors**: Check chain logs for detailed error messages
- **Username already taken**: Use a different username or clear chain state (delete `.demiurge/` folder)

