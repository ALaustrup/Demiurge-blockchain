# Monitor Archon Logs in Real-Time
# 
# This script connects to the server and monitors logs for Archon events
#
# Usage:
#   .\scripts\monitor-archon-logs.ps1

param(
    [string]$Server = "ubuntu@51.210.209.112",
    [string]$SshKey = "$env:USERPROFILE\.ssh\demiurge_new",
    [int]$Lines = 100
)

Write-Host "`n📊 PRIME ARCHON LOG MONITOR" -ForegroundColor Magenta
Write-Host "==========================`n" -ForegroundColor Magenta

Write-Host "Connecting to: $Server" -ForegroundColor Cyan
Write-Host "SSH Key: $SshKey`n" -ForegroundColor Cyan

Write-Host "📋 Recent logs (last $Lines lines):" -ForegroundColor Yellow
Write-Host "   (Press Ctrl+C to exit)`n" -ForegroundColor Gray

# Show recent logs with Archon events highlighted
ssh -i $SshKey $Server "sudo journalctl -u demiurge-node0 -n $Lines --no-pager" 2>&1 | ForEach-Object {
    $line = $_
    if ($line -match "\[ARCHON_EVENT\]") {
        Write-Host $line -ForegroundColor Green
    } elseif ($line -match "\[ARCHON_DIRECTIVE\]") {
        Write-Host $line -ForegroundColor Cyan
    } elseif ($line -match "\[ARCHON_HEARTBEAT\]") {
        Write-Host $line -ForegroundColor Magenta
    } elseif ($line -match "ERROR|error|Error") {
        Write-Host $line -ForegroundColor Red
    } elseif ($line -match "WARN|warn|Warn") {
        Write-Host $line -ForegroundColor Yellow
    } else {
        Write-Host $line
    }
}

Write-Host "`n`n🔍 Searching for Archon events..." -ForegroundColor Yellow
$archonEvents = ssh -i $SshKey $Server "sudo journalctl -u demiurge-node0 -n 500 --no-pager | grep -i archon" 2>&1

if ($archonEvents -and $archonEvents -match "ARCHON") {
    Write-Host "`n✅ ARCHON EVENTS FOUND:" -ForegroundColor Green
    Write-Host $archonEvents -ForegroundColor Green
    Write-Host "`n🎉 PRIME ARCHON PULSE IS IGNITED!" -ForegroundColor Magenta
} else {
    Write-Host "`n⚠️  No Archon events found in recent logs" -ForegroundColor Yellow
    Write-Host "`n   To monitor in real-time, run:" -ForegroundColor Cyan
    Write-Host "   ssh -i $SshKey $Server 'sudo journalctl -u demiurge-node0 -f'" -ForegroundColor White
}

Write-Host ""
