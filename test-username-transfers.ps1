# Test Script for Username-Aware Transfers
# This script helps test the username transfer feature

$RPC_URL = "http://127.0.0.1:8545/rpc"

function Test-Rpc {
    param(
        [string]$Method,
        [object]$Params
    )
    
    $body = @{
        jsonrpc = "2.0"
        method = $Method
        params = $Params
        id = 1
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri $RPC_URL -Method Post -Body $body -ContentType "application/json"
        return $response
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
        return $null
    }
}

Write-Host "`n=== Testing Username-Aware Transfers ===`n" -ForegroundColor Cyan

# Check chain status
Write-Host "1. Checking chain status..." -ForegroundColor Yellow
$chainInfo = Test-Rpc -Method "cgt_getChainInfo" -Params $null
if ($chainInfo) {
    Write-Host "   ✅ Chain height: $($chainInfo.result.height)" -ForegroundColor Green
} else {
    Write-Host "   ❌ Chain not responding. Make sure it's running!" -ForegroundColor Red
    exit 1
}

Write-Host "`n2. Manual Testing Steps:" -ForegroundColor Yellow
Write-Host "   Open http://localhost:3000/urgeid in your browser" -ForegroundColor White
Write-Host "`n   Step 1: Create First UrgeID" -ForegroundColor Cyan
Write-Host "   - Click 'Generate New UrgeID'" -ForegroundColor White
Write-Host "   - Note the address (copy it)" -ForegroundColor White
Write-Host "   - Claim a username (e.g., 'testuser')" -ForegroundColor White
Write-Host "`n   Step 2: Create Second UrgeID" -ForegroundColor Cyan
Write-Host "   - Sign out (or use incognito/another browser)" -ForegroundColor White
Write-Host "   - Click 'Generate New UrgeID' again" -ForegroundColor White
Write-Host "   - Note this address too" -ForegroundColor White
Write-Host "`n   Step 3: Test Username Transfer" -ForegroundColor Cyan
Write-Host "   - From the second UrgeID, go to 'Send CGT' section" -ForegroundColor White
Write-Host "   - Enter '@testuser' or 'testuser' in recipient field" -ForegroundColor White
Write-Host "   - Verify it shows: '@testuser (xxxxx...xxxxx)'" -ForegroundColor White
Write-Host "   - Enter an amount and click 'Send'" -ForegroundColor White
Write-Host "   - Verify transaction succeeds" -ForegroundColor White
Write-Host "`n   Step 4: Test Address Transfer" -ForegroundColor Cyan
Write-Host "   - Enter the first UrgeID's full address" -ForegroundColor White
Write-Host "   - Verify it shows: 'Recipient: xxxxx...xxxxx'" -ForegroundColor White
Write-Host "   - Enter an amount and click 'Send'" -ForegroundColor White
Write-Host "   - Verify transaction succeeds" -ForegroundColor White

Write-Host "`n3. Quick RPC Test (if you have addresses):" -ForegroundColor Yellow
Write-Host "   To test username resolution via RPC:" -ForegroundColor White
Write-Host "   .\test-username-transfers.ps1 -Username 'testuser' -Address1 'ADDR1' -Address2 'ADDR2'`n" -ForegroundColor Cyan

param(
    [string]$Username = "",
    [string]$Address1 = "",
    [string]$Address2 = ""
)

if ($Username -and $Address1 -and $Address2) {
    Write-Host "Testing with provided addresses...`n" -ForegroundColor Green
    
    # Test username resolution
    Write-Host "4. Testing username resolution..." -ForegroundColor Yellow
    $resolve = Test-Rpc -Method "urgeid_resolveUsername" -Params @{
        username = $Username
    }
    if ($resolve -and -not $resolve.error) {
        Write-Host "   ✅ Username '$Username' resolves to: $($resolve.result.address)" -ForegroundColor Green
        if ($resolve.result.address -eq $Address1) {
            Write-Host "   ✅ Matches expected address!" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Address mismatch (expected: $Address1)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ❌ Username resolution failed" -ForegroundColor Red
    }
    
    # Test profile by username
    Write-Host "`n5. Testing profile lookup by username..." -ForegroundColor Yellow
    $profile = Test-Rpc -Method "urgeid_getProfileByUsername" -Params @{
        username = $Username
    }
    if ($profile -and -not $profile.error -and $profile.result) {
        Write-Host "   ✅ Profile found:" -ForegroundColor Green
        Write-Host "      Address: $($profile.result.address)" -ForegroundColor White
        Write-Host "      Username: $($profile.result.username)" -ForegroundColor White
        Write-Host "      Level: $($profile.result.level)" -ForegroundColor White
    } else {
        Write-Host "   ❌ Profile lookup failed" -ForegroundColor Red
    }
    
    Write-Host "`n✅ RPC tests completed! Now test in the portal UI.`n" -ForegroundColor Green
}

