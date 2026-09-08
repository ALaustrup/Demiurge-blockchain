$ErrorActionPreference = "Continue"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$ComposeFile = Join-Path $RepoRoot "docker-compose.studio.yml"

if (Get-Command docker -ErrorAction SilentlyContinue) {
    docker compose -f $ComposeFile down
    Write-Host "Studio Docker servers stopped."
} else {
    Write-Host "Docker not available; stop WSL postgres/valkey manually if needed."
}
