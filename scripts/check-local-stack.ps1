$ErrorActionPreference = "Stop"

function Test-TcpPort {
    param([string]$Hostname, [int]$Port)

    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $iar = $client.BeginConnect($Hostname, $Port, $null, $null)
        if (-not $iar.AsyncWaitHandle.WaitOne(2000, $false)) {
            $client.Close()
            return $false
        }
        $client.EndConnect($iar)
        $client.Close()
        return $true
    } catch {
        return $false
    }
}

function Test-HttpUrl {
    param([string]$Url, [string]$Method = "GET", [string]$Body = "")

    try {
        $params = @{
            Uri = $Url
            Method = $Method
            TimeoutSec = 3
            UseBasicParsing = $true
        }

        if ($Body) {
            $params["ContentType"] = "application/json"
            $params["Body"] = $Body
        }

        $response = Invoke-WebRequest @params
        return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
    } catch {
        return $false
    }
}

$checks = @(
    @{ Name = "Postgres"; Ok = (Test-TcpPort "127.0.0.1" 5432); Required = $true },
    @{ Name = "Valkey/Redis"; Ok = (Test-TcpPort "127.0.0.1" 6379); Required = $true },
    @{ Name = "demiurge-node RPC"; Ok = (Test-HttpUrl "http://127.0.0.1:9944" "POST" '{"jsonrpc":"2.0","method":"system_health","params":[],"id":1}'); Required = $true },
    @{ Name = "qor-auth"; Ok = (Test-HttpUrl "http://127.0.0.1:8080/health"); Required = $true },
    @{ Name = "Hub"; Ok = (Test-HttpUrl "http://127.0.0.1:3000"); Required = $true },
    @{ Name = "marketing-site"; Ok = (Test-HttpUrl "http://127.0.0.1:3001"); Required = $false },
    @{ Name = "Sophia"; Ok = (Test-HttpUrl "http://127.0.0.1:3003"); Required = $false }
)

$failed = $false
foreach ($check in $checks) {
    if ($check.Ok) {
        Write-Host "[OK]  $($check.Name)" -ForegroundColor Green
    } else {
        $color = if ($check.Required) { "Red" } else { "Yellow" }
        $label = if ($check.Required) { "FAIL" } else { "SKIP" }
        Write-Host "[$label] $($check.Name)" -ForegroundColor $color
        if ($check.Required) {
            $failed = $true
        }
    }
}

if ($failed) {
    Write-Error "One or more core local services are unavailable."
}
