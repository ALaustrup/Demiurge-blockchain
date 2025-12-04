# Start Fracture Portal Services
# Usage: .\start-fracture.ps1

Write-Host " Starting Fracture Portal Services..." -ForegroundColor Cyan
Write-Host ""

# Check if ports are in use
function Test-Port {
    param([int]$Port, [string]$ServiceName)
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue -InformationLevel Quiet
        if ($connection) {
            Write-Host "  Port $Port ($ServiceName) is already in use" -ForegroundColor Yellow
            return $true
        }
    } catch {
        return $false
    }
    return $false
}

# Check ports
$port3001InUse = Test-Port -Port 3001 -ServiceName "AbyssID Backend"
$port3000InUse = Test-Port -Port 3000 -ServiceName "Portal Web"
$port4000InUse = Test-Port -Port 4000 -ServiceName "Abyss Gateway"
$port8545InUse = Test-Port -Port 8545 -ServiceName "Demiurge Chain"

# Ask if user wants to start chain node (optional)
Write-Host ""
$startChain = Read-Host "Start Demiurge Chain node? (required for /urgeid page) [y/N]"
$startChain = $startChain -eq "y" -or $startChain -eq "Y"

if ($port3001InUse -or $port3000InUse -or $port4000InUse) {
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "Aborted." -ForegroundColor Red
        exit 1
    }
    Write-Host ""
}

# Navigate to project root
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

# Step 0: Start Chain Node (optional)
if ($startChain) {
    Write-Host "0  Starting Demiurge Chain Node..." -ForegroundColor Green
    Set-Location $projectRoot
    
    # Check if Rust/Cargo is available
    $cargoAvailable = Get-Command cargo -ErrorAction SilentlyContinue
    if (-not $cargoAvailable) {
        Write-Host "     Rust/Cargo not found. Skipping chain node." -ForegroundColor Yellow
        Write-Host "    Install Rust from https://rustup.rs/ to use chain features" -ForegroundColor Gray
        $startChain = $false
    } else {
        if ($port8545InUse) {
            Write-Host "     Port 8545 already in use, skipping chain node" -ForegroundColor Yellow
            $startChain = $false
        } else {
            Write-Host "   Starting chain node on port 8545..." -ForegroundColor Gray
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot'; Write-Host 'Demiurge Chain - Port 8545' -ForegroundColor Cyan; Write-Host ''; cargo run -p demiurge-chain" -WindowStyle Normal
            Write-Host "    Chain node starting (this may take a minute to compile)..." -ForegroundColor Gray
        }
    }
    Write-Host ""
}

# Step 1: Setup Abyss Gateway
Write-Host "1  Setting up Abyss Gateway..." -ForegroundColor Green
Set-Location "$projectRoot\indexer\abyss-gateway"

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "   Installing dependencies..." -ForegroundColor Gray
    pnpm install | Out-Null
}

# Initialize database directory if needed
if (-not (Test-Path "data")) {
    New-Item -ItemType Directory -Path "data" | Out-Null
}

# Start gateway in new window
Write-Host "   Starting Abyss Gateway on port 4000..." -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host 'Abyss Gateway - Port 4000' -ForegroundColor Cyan; Write-Host ''; pnpm dev" -WindowStyle Normal

# Step 2: Setup AbyssID Backend
Write-Host ""
Write-Host "2  Setting up AbyssID Backend..." -ForegroundColor Green
Set-Location "$projectRoot\apps\abyssid-backend"

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "   Installing dependencies..." -ForegroundColor Gray
    npm install | Out-Null
}

# Initialize database if needed
if (-not (Test-Path "data")) {
    New-Item -ItemType Directory -Path "data" | Out-Null
}
if (-not (Test-Path "data\abyssid.db")) {
    Write-Host "   Initializing database..." -ForegroundColor Gray
    node src/db-init.js | Out-Null
}

# Start backend in new window
Write-Host "   Starting AbyssID Backend on port 3001..." -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host 'AbyssID Backend - Port 3001' -ForegroundColor Cyan; Write-Host ''; node src/server.js" -WindowStyle Normal

# Step 3: Setup Portal Web
Write-Host ""
Write-Host "3  Setting up Portal Web..." -ForegroundColor Green
Set-Location "$projectRoot\apps\portal-web"

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "   Installing dependencies..." -ForegroundColor Gray
    pnpm install | Out-Null
}

# Start portal in new window
Write-Host "   Starting Portal Web on port 3000..." -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host 'Portal Web - Port 3000' -ForegroundColor Cyan; Write-Host ''; pnpm dev" -WindowStyle Normal

# Wait a bit for services to start
Write-Host ""
Write-Host " Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Check services
Write-Host ""
Write-Host "4  Verifying services..." -ForegroundColor Green

# Check gateway
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/graphql" -UseBasicParsing -TimeoutSec 2 -Method GET
    Write-Host "    Abyss Gateway is running!" -ForegroundColor Green
} catch {
    Write-Host "     Abyss Gateway may still be starting (check the gateway window)" -ForegroundColor Yellow
}

# Check backend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 2
    Write-Host "    AbyssID Backend is running!" -ForegroundColor Green
} catch {
    Write-Host "     AbyssID Backend may still be starting (check the backend window)" -ForegroundColor Yellow
}

# Check portal
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2
    Write-Host "    Portal Web is running!" -ForegroundColor Green
} catch {
    Write-Host "     Portal Web may still be starting (check the portal window)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host " Services started!" -ForegroundColor Cyan
Write-Host ""
Write-Host " Access the portal at:" -ForegroundColor White
Write-Host "   http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host " Fracture Portal Routes (no chain needed):" -ForegroundColor White
Write-Host "   http://localhost:3000/haven  - Your identity home" -ForegroundColor Cyan
Write-Host "   http://localhost:3000/void   - Developer HQ" -ForegroundColor Cyan
Write-Host "   http://localhost:3000/nexus   - P2P analytics" -ForegroundColor Cyan
Write-Host ""
Write-Host " Abyss Gateway (GraphQL):" -ForegroundColor White
Write-Host "   http://localhost:4000/graphql" -ForegroundColor Cyan
Write-Host ""
Write-Host " AbyssID Backend API:" -ForegroundColor White
Write-Host "   http://localhost:3001/health" -ForegroundColor Cyan
Write-Host ""
if ($startChain) {
    Write-Host " Chain RPC (if started):" -ForegroundColor White
    Write-Host "   http://127.0.0.1:8545/rpc" -ForegroundColor Cyan
    Write-Host "   http://localhost:3000/urgeid  - Legacy UrgeID page" -ForegroundColor Cyan
    Write-Host ""
}
Write-Host "Tips:" -ForegroundColor Yellow
if ($startChain) {
    Write-Host '   - Four PowerShell windows opened (chain, gateway, backend, portal)' -ForegroundColor Gray
} else {
    Write-Host '   - Three PowerShell windows opened (gateway, backend, portal)' -ForegroundColor Gray
    Write-Host '   - Chain node not started (use /haven instead of /urgeid)' -ForegroundColor Gray
}
Write-Host '   - Check those windows for logs and errors' -ForegroundColor Gray
Write-Host '   - Press Ctrl+C in each window to stop the services' -ForegroundColor Gray
Write-Host ""
