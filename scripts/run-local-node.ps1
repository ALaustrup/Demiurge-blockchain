$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
. (Join-Path $RepoRoot "scripts\env-rust-x.ps1")

$FrameworkRoot = Join-Path $RepoRoot "framework"
$DataDir = Join-Path $FrameworkRoot "data"

# Per-project chain data (Demiurge Studio)
$ActiveProjectFile = Join-Path $RepoRoot "projects\.studio\active-project.json"
if ($env:DEMIURGE_CHAIN_DATA_DIR) {
    $DataDir = $env:DEMIURGE_CHAIN_DATA_DIR
} elseif (Test-Path $ActiveProjectFile) {
    try {
        $active = Get-Content $ActiveProjectFile -Raw | ConvertFrom-Json
        if ($active.chainDataDir -and (Test-Path $active.chainDataDir)) {
            $DataDir = $active.chainDataDir
            Write-Host "Using project chain data: $DataDir" -ForegroundColor Cyan
        } elseif ($active.slug) {
            $projectChain = Join-Path $RepoRoot "projects\$($active.slug)\chain"
            if (Test-Path $projectChain) {
                $DataDir = $projectChain
                Write-Host "Using project chain data: $DataDir" -ForegroundColor Cyan
            }
        }
    } catch {
        Write-Warning "Could not read active project; using default chain data"
    }
}
$Binary = Join-Path $FrameworkRoot "target\release\demiurge-node.exe"
$Args = @(
    "--data-dir", $DataDir,
    "--rpc-addr", "127.0.0.1:9944",
    "--p2p-addr", "127.0.0.1:30333",
    "--rpc",
    "--p2p"
)

if (-not (Test-Path $DataDir)) {
    New-Item -ItemType Directory -Path $DataDir | Out-Null
}

Set-Location $FrameworkRoot

if (Test-Path $Binary) {
    Write-Host "Starting local demiurge-node from release binary..." -ForegroundColor Cyan
    & $Binary @Args
} else {
    Write-Host "Release binary not found; building and starting via cargo..." -ForegroundColor Yellow
    cargo run --release -p demiurge-node -- @Args
}
