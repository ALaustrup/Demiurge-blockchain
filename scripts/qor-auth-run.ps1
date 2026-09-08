# Start QOR Auth on Windows against WSL Postgres/Redis (no Docker).
$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
. (Join-Path $RepoRoot "scripts\env-rust-x.ps1")

$DevPassword = "demiurge_qor_auth_dev"
$wslIp = & (Join-Path $RepoRoot "scripts\get-wsl-ip.ps1")
if ($wslIp) {
    Write-Host "Using WSL host $wslIp for Postgres/Redis"
    $env:QOR_AUTH__DATABASE__URL = "postgres://qor_auth:${DevPassword}@${wslIp}:5432/qor_auth"
    $env:QOR_AUTH__REDIS__URL = "redis://${wslIp}:6379"
} else {
    Write-Warning "Could not resolve WSL IP; falling back to localhost"
    $env:QOR_AUTH__DATABASE__URL = "postgres://qor_auth:${DevPassword}@localhost:5432/qor_auth"
    $env:QOR_AUTH__REDIS__URL = "redis://localhost:6379"
}

$env:QOR_AUTH__SERVER__PORT = "8080"
Set-Location (Join-Path $RepoRoot "services\qor-auth")
cargo run
