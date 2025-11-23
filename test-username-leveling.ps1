# Quick Test Script for Username & Leveling Features
# Usage: .\test-username-leveling.ps1

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

Write-Host "`n=== Testing Username & Leveling Features ===`n" -ForegroundColor Cyan

# Test 1: Check chain status
Write-Host "1. Checking chain status..." -ForegroundColor Yellow
$chainInfo = Test-Rpc -Method "cgt_getChainInfo" -Params $null
if ($chainInfo) {
    Write-Host "   ✅ Chain height: $($chainInfo.result.height)" -ForegroundColor Green
} else {
    Write-Host "   ❌ Chain not responding. Make sure it's running!" -ForegroundColor Red
    exit 1
}

# Test 2: Create a test UrgeID (if you have an address)
Write-Host "`n2. To test username/leveling:" -ForegroundColor Yellow
Write-Host "   a) Go to http://localhost:3000/urgeid" -ForegroundColor White
Write-Host "   b) Create an UrgeID profile" -ForegroundColor White
Write-Host "   c) Copy your address from the dashboard" -ForegroundColor White
Write-Host "   d) Run this script with your address:" -ForegroundColor White
Write-Host "      .\test-username-leveling.ps1 -Address YOUR_ADDRESS_HERE`n" -ForegroundColor Cyan

param(
    [string]$Address = ""
)

if ($Address -and $Address.Length -eq 64) {
    Write-Host "Testing with address: $Address`n" -ForegroundColor Green
    
    # Test 3: Set username
    Write-Host "3. Testing username claim..." -ForegroundColor Yellow
    $testUsername = "testuser" + (Get-Random -Maximum 9999)
    $setUsername = Test-Rpc -Method "urgeid_setUsername" -Params @{
        address = $Address
        username = $testUsername
    }
    if ($setUsername -and -not $setUsername.error) {
        Write-Host "   ✅ Username '$testUsername' claimed successfully!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Username claim failed (might already exist or profile not found)" -ForegroundColor Yellow
        Write-Host "      Error: $($setUsername.error.message)" -ForegroundColor Yellow
    }
    
    # Test 4: Resolve username
    Write-Host "`n4. Testing username resolution..." -ForegroundColor Yellow
    $resolve = Test-Rpc -Method "urgeid_resolveUsername" -Params @{
        username = $testUsername
    }
    if ($resolve -and -not $resolve.error) {
        Write-Host "   ✅ Username resolves to: $($resolve.result.address)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Username resolution failed" -ForegroundColor Red
    }
    
    # Test 5: Get progress
    Write-Host "`n5. Testing progress retrieval..." -ForegroundColor Yellow
    $progress = Test-Rpc -Method "urgeid_getProgress" -Params @{
        address = $Address
    }
    if ($progress -and -not $progress.error) {
        $p = $progress.result
        Write-Host "   ✅ Level: $($p.level)" -ForegroundColor Green
        Write-Host "   ✅ Syzygy Score: $($p.syzygyScore)" -ForegroundColor Green
        Write-Host "   ✅ Progress: $([math]::Round($p.progressRatio * 100, 2))%" -ForegroundColor Green
        Write-Host "   ✅ CGT from rewards: $($p.totalCgtEarnedFromRewards)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Progress retrieval failed" -ForegroundColor Red
    }
    
    # Test 6: Record Syzygy (level up)
    Write-Host "`n6. Testing Syzygy recording (level up)..." -ForegroundColor Yellow
    $recordSyzygy = Test-Rpc -Method "urgeid_recordSyzygy" -Params @{
        address = $Address
        amount = 5000
    }
    if ($recordSyzygy -and -not $recordSyzygy.error) {
        $profile = $recordSyzygy.result
        Write-Host "   ✅ Syzygy recorded! New score: $($profile.syzygy_score)" -ForegroundColor Green
        Write-Host "   ✅ Level: $($profile.level)" -ForegroundColor Green
        Write-Host "   ✅ Total CGT earned: $($profile.total_cgt_earned_from_rewards)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Syzygy recording failed" -ForegroundColor Red
    }
    
    # Test 7: Check updated progress
    Write-Host "`n7. Checking updated progress..." -ForegroundColor Yellow
    $progress2 = Test-Rpc -Method "urgeid_getProgress" -Params @{
        address = $Address
    }
    if ($progress2 -and -not $progress2.error) {
        $p2 = $progress2.result
        Write-Host "   ✅ Updated Level: $($p2.level)" -ForegroundColor Green
        Write-Host "   ✅ Updated Syzygy Score: $($p2.syzygyScore)" -ForegroundColor Green
        Write-Host "   ✅ Updated Progress: $([math]::Round($p2.progressRatio * 100, 2))%" -ForegroundColor Green
    }
    
    Write-Host "`n✅ All tests completed! Check the portal at http://localhost:3000/urgeid to see the updates.`n" -ForegroundColor Green
} else {
    Write-Host "`n💡 Tip: After creating an UrgeID in the portal, run:" -ForegroundColor Cyan
    Write-Host "   .\test-username-leveling.ps1 -Address YOUR_ADDRESS`n" -ForegroundColor White
}

