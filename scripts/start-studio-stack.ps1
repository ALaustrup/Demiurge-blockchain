# Start the full Demiurge Studio stack (infra + node + auth + hub).
# Services run in separate minimized PowerShell windows.

param(
    [switch]$SkipInfra,
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
$PidFile = Join-Path $RepoRoot 'projects\.studio\processes.json'

function Wait-ForPort {
    param([int]$Port, [int]$TimeoutSec = 120)
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        try {
            $c = New-Object System.Net.Sockets.TcpClient
            $iar = $c.BeginConnect('127.0.0.1', $Port, $null, $null)
            if ($iar.AsyncWaitHandle.WaitOne(500, $false)) {
                $c.EndConnect($iar)
                $c.Close()
                return $true
            }
            $c.Close()
        } catch { }
        Start-Sleep -Milliseconds 800
    }
    return $false
}

function Start-StudioWindow {
    param([string]$Title, [string]$Command)
    $arg = '-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', $Command
    $p = Start-Process powershell -ArgumentList $arg -WindowStyle Minimized -PassThru
    return @{ title = $Title; pid = $p.Id }
}

Write-Host ''
Write-Host '  Demiurge Studio - starting stack...' -ForegroundColor Cyan
Write-Host ''

if (-not $SkipInfra) {
    Write-Host '  [1/4] Studio servers (Postgres + Valkey)...' -ForegroundColor DarkGray
    & powershell -ExecutionPolicy Bypass -File (Join-Path $RepoRoot 'scripts\start-studio-servers.ps1')
    if (-not (Wait-ForPort 5432 90)) { Write-Warning 'Postgres not ready on 5432 yet' }
    if (-not (Wait-ForPort 6379 30)) { Write-Warning 'Valkey not ready on 6379 yet' }
}

$processes = @()

Write-Host '  [2/4] demiurge-node...' -ForegroundColor DarkGray
$nodeCmd = "Set-Location '$RepoRoot'; npm run studio:node"
$processes += Start-StudioWindow 'Demiurge Node' $nodeCmd
if (-not (Wait-ForPort 9944 180)) {
    Write-Error 'demiurge-node did not start on port 9944'
}

Write-Host '  [3/4] qor-auth...' -ForegroundColor DarkGray
$authCmd = "Set-Location '$RepoRoot'; npm run studio:auth"
$processes += Start-StudioWindow 'QOR Auth' $authCmd
if (-not (Wait-ForPort 8080 180)) {
    Write-Error 'qor-auth did not start on port 8080'
}

Write-Host '  [4/4] Hub (Studio UI)...' -ForegroundColor DarkGray
$hubCmd = "Set-Location '$RepoRoot'; npm run studio:hub"
$processes += Start-StudioWindow 'Demiurge Hub' $hubCmd
if (-not (Wait-ForPort 3000 240)) {
    Write-Error 'Hub did not start on port 3000'
}

$studioDir = Join-Path $RepoRoot 'projects\.studio'
if (-not (Test-Path $studioDir)) {
    New-Item -ItemType Directory -Path $studioDir -Force | Out-Null
}
@{ started_at = (Get-Date).ToString('o'); processes = $processes } | ConvertTo-Json | Set-Content $PidFile

Write-Host ''
Write-Host '  Studio stack is ready.' -ForegroundColor Green
Write-Host '    Hub:      http://localhost:3000' -ForegroundColor White
Write-Host '    Auth:     http://localhost:8080' -ForegroundColor White
Write-Host '    Node RPC: http://localhost:9944' -ForegroundColor White
Write-Host ''
Write-Host '  Projects: http://localhost:3000/studio/projects' -ForegroundColor DarkGray
Write-Host '  Stop: close the four minimized PowerShell windows' -ForegroundColor DarkGray
Write-Host ''

if (-not $NoBrowser) {
    Start-Process 'http://localhost:3000/studio/projects'
}
