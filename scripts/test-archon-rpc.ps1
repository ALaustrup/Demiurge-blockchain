# Test Archon RPC Endpoint
# PHASE OMEGA PART VI: Quick test script for Archon state RPC

param(
    [string]$RpcUrl = "https://rpc.demiurge.cloud/rpc"
)

$ErrorActionPreference = "Stop"

Write-Host "🔍 Testing Archon RPC Endpoint..." -ForegroundColor Cyan
Write-Host "   URL: $RpcUrl" -ForegroundColor Gray
Write-Host ""

$requestBody = @{
    jsonrpc = "2.0"
    method = "archon_state"
    params = @()
    id = 1
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $RpcUrl -Method Post -Body $requestBody -ContentType "application/json"
    
    if ($response.result) {
        Write-Host "✅ RPC Endpoint Responding" -ForegroundColor Green
        Write-Host ""
        Write-Host "Archon State:" -ForegroundColor Yellow
        Write-Host "  Runtime Version: $($response.result.runtime_version)" -ForegroundColor Gray
        Write-Host "  Node ID: $($response.result.node_id)" -ForegroundColor Gray
        Write-Host "  Block Height: $($response.result.block_height)" -ForegroundColor Gray
        Write-Host "  Invariants OK: $($response.result.invariants_ok)" -ForegroundColor $(if ($response.result.invariants_ok) { "Green" } else { "Red" })
        Write-Host "  Integrity Hash: $($response.result.integrity_hash.Substring(0, 16))..." -ForegroundColor Gray
        Write-Host ""
        Write-Host "✅ THE ARCHON PULSE IS ACTIVE" -ForegroundColor Magenta
    } else {
        Write-Host "❌ RPC responded but no result" -ForegroundColor Red
        Write-Host "Response: $($response | ConvertTo-Json -Depth 5)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ RPC Request Failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check if node is running" -ForegroundColor Gray
    Write-Host "  2. Check if RPC server is accessible" -ForegroundColor Gray
    Write-Host "  3. Check nginx configuration" -ForegroundColor Gray
    exit 1
}
