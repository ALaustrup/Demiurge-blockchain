# Generate Demiurge Studio CD-keys via local qor-auth admin API.
# Requires qor-auth running and STUDIO_LICENSE_ADMIN_SECRET set in services/qor-auth/.env
#
# Example:
#   .\scripts\generate-studio-keys.ps1 -Edition creator -Count 5

param(
    [ValidateSet('creator', 'pro', 'enterprise')]
    [string]$Edition = 'creator',
    [int]$Count = 1,
    [int]$MaxActivations = 2,
    [int]$ExpiresDays = 0,
    [string]$AuthUrl = 'http://127.0.0.1:8080/api/v1',
    [string]$AdminSecret = $env:STUDIO_LICENSE_ADMIN_SECRET
)

$ErrorActionPreference = 'Stop'

if (-not $AdminSecret) {
    $envFile = Join-Path $PSScriptRoot '..\services\qor-auth\.env'
    if (Test-Path $envFile) {
        Get-Content $envFile | ForEach-Object {
            if ($_ -match '^\s*STUDIO_LICENSE_ADMIN_SECRET\s*=\s*(.+)\s*$') {
                $AdminSecret = $Matches[1].Trim('"', "'")
            }
        }
    }
}

if (-not $AdminSecret) {
    Write-Error 'Set STUDIO_LICENSE_ADMIN_SECRET in services/qor-auth/.env or pass -AdminSecret'
}

$body = @{
    edition = $Edition
    count = $Count
    max_activations = $MaxActivations
} | ConvertTo-Json

if ($ExpiresDays -gt 0) {
    $bodyObj = $body | ConvertFrom-Json
    $bodyObj | Add-Member -NotePropertyName expires_days -NotePropertyValue $ExpiresDays
    $body = $bodyObj | ConvertTo-Json
}

$headers = @{
    'Content-Type' = 'application/json'
    'X-Studio-Admin-Secret' = $AdminSecret
}

Write-Host "Generating $Count $Edition key(s) via $AuthUrl/studio/admin/generate-keys ..." -ForegroundColor Cyan

$response = Invoke-RestMethod -Method Post -Uri "$AuthUrl/studio/admin/generate-keys" -Headers $headers -Body $body

$response.keys | ForEach-Object {
    Write-Host $_.key -ForegroundColor Green
}

Write-Host "`n$($response.message)" -ForegroundColor DarkGray
