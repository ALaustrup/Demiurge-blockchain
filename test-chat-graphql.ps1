# Test GraphQL Chat Queries
# Run this to verify Abyss Gateway is working correctly

$gatewayUrl = "http://localhost:4000/graphql"
$testAddress = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
$testUsername = "testuser"

Write-Host "Testing Abyss Gateway Chat System..." -ForegroundColor Cyan
Write-Host ""

# Test 1: World Chat Messages
Write-Host "Test 1: Query World Chat Messages" -ForegroundColor Yellow
$query1 = @{
    query = "query { worldChatMessages(limit: 10) { id content sender { username } createdAt } }"
} | ConvertTo-Json

$headers1 = @{
    "Content-Type" = "application/json"
    "x-demiurge-address" = $testAddress
    "x-demiurge-username" = $testUsername
}

try {
    $response1 = Invoke-RestMethod -Uri $gatewayUrl -Method Post -Body $query1 -Headers $headers1
    Write-Host "✓ World Chat Messages query successful" -ForegroundColor Green
    $response1 | ConvertTo-Json -Depth 5
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
    $_.Exception.Response | Format-List
}

Write-Host ""

# Test 2: DM Rooms
Write-Host "Test 2: Query DM Rooms" -ForegroundColor Yellow
$query2 = @{
    query = "query { dmRooms { id type members { username } } }"
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri $gatewayUrl -Method Post -Body $query2 -Headers $headers1
    Write-Host "✓ DM Rooms query successful" -ForegroundColor Green
    $response2 | ConvertTo-Json -Depth 5
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

Write-Host ""

# Test 3: Send World Message
Write-Host "Test 3: Send World Message" -ForegroundColor Yellow
$mutation1 = @{
    query = "mutation { sendWorldMessage(content: `"Test message from PowerShell`") { id content sender { username } createdAt } }"
} | ConvertTo-Json

try {
    $response3 = Invoke-RestMethod -Uri $gatewayUrl -Method Post -Body $mutation1 -Headers $headers1
    Write-Host "✓ Send World Message successful" -ForegroundColor Green
    $response3 | ConvertTo-Json -Depth 5
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Testing complete!" -ForegroundColor Cyan

