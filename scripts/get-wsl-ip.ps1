# Returns the primary WSL2 IP for the default (or named) distro.
param(
    [string]$Distro = $(
        if ($env:QOR_AUTH_WSL_DISTRO) {
            $env:QOR_AUTH_WSL_DISTRO
        } else {
            $default = wsl -l -v 2>$null | ForEach-Object {
                if ($_ -match '^\s*\*\s+([^\s]+)') { $Matches[1] }
            } | Select-Object -First 1
            if ($default) { $default } else { "FedoraLinux-42" }
        }
    )
)

$raw = wsl -d $Distro -e bash -lc "ip -4 addr show eth0 2>/dev/null | grep -oP 'inet \K[\d.]+' | head -1" 2>$null
if (-not $raw) {
    Write-Output $null
    return
}
$ip = $raw.Trim()
if ($ip -match '^\d+\.\d+\.\d+\.\d+$') {
    Write-Output $ip
} else {
    Write-Output $null
}
