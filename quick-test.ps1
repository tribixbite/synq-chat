Write-Host "=== Docker Container Test Suite ===" -ForegroundColor Green
Write-Host ""

$baseUrl = "http://localhost:3001"

# Test health endpoint
Write-Host "1. Health endpoint test:" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "   Health response: $($health | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "   Health endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test root redirect
Write-Host "2. Root redirect test:" -ForegroundColor Yellow 
try {
    $rootResponse = Invoke-WebRequest -Uri "$baseUrl/" -UseBasicParsing
    Write-Host "   Root status: $($rootResponse.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   Root endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test app endpoints
Write-Host "3. App endpoints test:" -ForegroundColor Yellow
$apps = @("vibesynq", "admin", "app1", "app2")
foreach ($app in $apps) {
    try {
        $appResponse = Invoke-WebRequest -Uri "$baseUrl/apps/$app/" -UseBasicParsing
        Write-Host "   /apps/$app/ -> Status: $($appResponse.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "   /apps/$app/ -> Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test static files
Write-Host "4. Static files test:" -ForegroundColor Yellow
$staticFiles = @("moto.html", "multisynq-client.txt")
foreach ($file in $staticFiles) {
    try {
        $staticResponse = Invoke-WebRequest -Uri "$baseUrl/$file" -UseBasicParsing
        Write-Host "   /$file -> Status: $($staticResponse.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "   /$file -> Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Green
Write-Host "Docker container test suite completed!" -ForegroundColor Green 
