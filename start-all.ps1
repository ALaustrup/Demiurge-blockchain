# Start all Demiurge servers
# Usage: .\start-all.ps1

Write-Host "🚀 Starting Demiurge Stack..." -ForegroundColor Cyan
Write-Host ""

# Function to check if a port is in use
function Test-Port {
    param([int]$Port)
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue -InformationLevel Quiet
    return $connection
}

# Check if ports are already in use
$ports = @{8545 = "Chain RPC"; 4000 = "Abyss Gateway"; 3000 = "Portal Web"}
$portsInUse = @()

foreach ($port in $ports.Keys) {
    if (Test-Port -Port $port) {
        $portsInUse += "$($ports[$port]) (port $port)"
    }
}

if ($portsInUse.Count -gt 0) {
    Write-Host "⚠️  Warning: The following services appear to be running:" -ForegroundColor Yellow
    foreach ($service in $portsInUse) {
        Write-Host "   - $service" -ForegroundColor Yellow
    }
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "Aborted." -ForegroundColor Red
        exit 1
    }
    Write-Host ""
}

# Start Chain Server
Write-Host "1️⃣  Starting Demiurge Chain (RPC on :8545)..." -ForegroundColor Green
$chainJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    cargo run -p demiurge-chain --release 2>&1
} -Name "DemiurgeChain"

# Wait for chain to be ready
Write-Host "   Waiting for chain server to start..." -ForegroundColor Gray
$chainReady = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    try {
        $response = Invoke-RestMethod -Uri "http://127.0.0.1:8545/rpc" -Method POST -ContentType "application/json" -Body '{"jsonrpc":"2.0","method":"cgt_getChainInfo","params":{},"id":1}' -TimeoutSec 1 -ErrorAction SilentlyContinue
        if ($response) {
            $chainReady = $true
            break
        }
    } catch {
        # Continue waiting
    }
}

if ($chainReady) {
    Write-Host "   ✅ Chain server is ready!" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Chain server may not be ready yet, continuing..." -ForegroundColor Yellow
}
Write-Host ""

# Start Abyss Gateway
Write-Host "2️⃣  Starting Abyss Gateway (GraphQL on :4000)..." -ForegroundColor Green
$gatewayJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location indexer\abyss-gateway
    pnpm dev 2>&1 | ForEach-Object { Write-Output $_ }
} -Name "AbyssGateway"

# Wait for gateway to be ready
Write-Host "   Waiting for gateway to start..." -ForegroundColor Gray
Start-Sleep -Seconds 3
$gatewayReady = $false
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Seconds 1
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4000/graphql" -Method GET -TimeoutSec 1 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 405) {
            $gatewayReady = $true
            break
        }
    } catch {
        # Continue waiting
    }
}

if ($gatewayReady) {
    Write-Host "   ✅ Abyss Gateway is ready!" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Gateway may not be ready yet, continuing..." -ForegroundColor Yellow
}
Write-Host ""

# Start Portal Web
Write-Host "3️⃣  Starting Portal Web (Next.js on :3000)..." -ForegroundColor Green
$portalJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location apps\portal-web
    pnpm dev 2>&1 | ForEach-Object { Write-Output $_ }
} -Name "PortalWeb"

Write-Host "   ✅ Portal Web is starting..." -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ All servers started!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Services:" -ForegroundColor Cyan
Write-Host "   • Chain RPC:      http://127.0.0.1:8545/rpc" -ForegroundColor White
Write-Host "   • Abyss Gateway:  http://localhost:4000/graphql" -ForegroundColor White
Write-Host "   • Portal Web:      http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "📋 Jobs running:" -ForegroundColor Cyan
Write-Host "   • $($chainJob.Name) (ID: $($chainJob.Id))" -ForegroundColor White
Write-Host "   • $($gatewayJob.Name) (ID: $($gatewayJob.Id))" -ForegroundColor White
Write-Host "   • $($portalJob.Name) (ID: $($portalJob.Id))" -ForegroundColor White
Write-Host ""
Write-Host "💡 To stop all servers, run: .\stop-all.ps1" -ForegroundColor Yellow
Write-Host "   Or manually: Get-Job | Stop-Job; Get-Job | Remove-Job" -ForegroundColor Gray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# Keep script running and show job status
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers and exit" -ForegroundColor Yellow
Write-Host ""

try {
    while ($true) {
        Start-Sleep -Seconds 5
        $runningJobs = Get-Job | Where-Object { $_.State -eq "Running" }
        if ($runningJobs.Count -eq 0) {
            Write-Host "⚠️  All jobs have stopped." -ForegroundColor Yellow
            break
        }
    }
} catch {
    Write-Host ""
    Write-Host "🛑 Stopping all servers..." -ForegroundColor Red
    Get-Job | Stop-Job
    Get-Job | Remove-Job
    Write-Host "✅ All servers stopped." -ForegroundColor Green
}

