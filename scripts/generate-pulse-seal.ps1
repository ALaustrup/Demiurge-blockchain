# Generate PULSE_SEAL.json
# PHASE OMEGA PART VI: Creates the cryptographic birth certificate of the Archon Pulse

param(
    [string]$OutputPath = "PULSE_SEAL.json",
    [int]$PulseHeight = 0
)

$ErrorActionPreference = "Stop"

Write-Host "🔒 Generating Archon Pulse Seal..." -ForegroundColor Cyan

function Get-FileHash {
    param([string]$FilePath)
    if (-not (Test-Path $FilePath)) { return "missing" }
    $content = Get-Content -Path $FilePath -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
    if (-not $content) { return "empty" }
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
    $hash = [System.Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
    return [System.BitConverter]::ToString($hash).Replace("-", "").ToLower()
}

$seal = @{
    archon_pulse = "IGNITED"
    pulse_height = $PulseHeight
    execution_mode = "per_block_enforcement"
    ignited_at = (Get-Date -Format "o")
    status = "ACTIVE"
    
    # Component hashes
    archon_modules = @{
        archon_state_vector = Get-FileHash "chain/src/archon/archon_state_vector.rs"
        archon_consensus = Get-FileHash "chain/src/archon/archon_consensus.rs"
        archon_commands = Get-FileHash "chain/src/archon/archon_commands.rs"
        archon_diagnostics = Get-FileHash "chain/src/archon/archon_diagnostics.rs"
        archon_daemon = Get-FileHash "chain/src/archon/archon_daemon.rs"
        a0_directive = Get-FileHash "chain/src/archon/a0_directive.rs"
        logging = Get-FileHash "chain/src/archon/logging.rs"
    }
    
    # Integration points
    integration = @{
        node_execution = Get-FileHash "chain/src/node.rs"
        rpc_exposure = Get-FileHash "chain/src/rpc.rs"
        abyssos_integration = Get-FileHash "apps/abyssos-portal/src/archon/ArchonPresence.tsx"
    }
    
    # Configuration
    config = @{
        block_frequency = 1
        refresh_interval_ms = 500
        log_prefixes = @("[ARCHON_EVENT]", "[ARCHON_DIRECTIVE]", "[ARCHON_HEARTBEAT]")
    }
}

# Generate master hash
$sealJson = $seal | ConvertTo-Json -Depth 10
$sealBytes = [System.Text.Encoding]::UTF8.GetBytes($sealJson)
$masterHash = [System.Security.Cryptography.SHA256]::Create().ComputeHash($sealBytes)
$seal.masterHash = [System.BitConverter]::ToString($masterHash).Replace("-", "").ToLower()

# Write seal
$finalSeal = $seal | ConvertTo-Json -Depth 10
$finalSeal | Out-File -FilePath $OutputPath -Encoding UTF8

Write-Host "✅ Pulse Seal generated: $OutputPath" -ForegroundColor Green
Write-Host "   Master Hash: $($seal.masterHash)" -ForegroundColor Cyan
Write-Host "   Pulse Height: $PulseHeight" -ForegroundColor Cyan
Write-Host "   Status: $($seal.status)" -ForegroundColor Cyan
