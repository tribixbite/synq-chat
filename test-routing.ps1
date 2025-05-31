# PowerShell Routing Test Script for Synq Chat
# Tests all routing functionality including redirects, static files, and app serving

Write-Host "=== Synq Chat Routing Tests ===" -ForegroundColor Green
Write-Host ""

$baseUrl = "http://localhost:3001"
$testResults = @()

function Test-Route {
    param(
        [string]$url,
        [string]$description,
        [int]$expectedStatus = 200,
        [string]$expectedContentType = $null,
        [string]$expectedRedirect = $null
    )
    
    Write-Host "Testing: $description" -ForegroundColor Yellow
    Write-Host "URL: $url" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -MaximumRedirection 0 -ErrorAction SilentlyContinue
        $actualStatus = $response.StatusCode
        $contentType = $response.Headers['Content-Type']
        $location = $response.Headers['Location']
        
        $result = @{
            URL = $url
            Description = $description
            ExpectedStatus = $expectedStatus
            ActualStatus = $actualStatus
            ContentType = $contentType
            Location = $location
            Success = ($actualStatus -eq $expectedStatus)
        }
        
        if ($expectedRedirect -and $location -ne $expectedRedirect) {
            $result.Success = $false
            Write-Host "  ❌ FAIL: Expected redirect to $expectedRedirect, got $location" -ForegroundColor Red
        } elseif ($result.Success) {
            Write-Host "  ✅ PASS: Status $actualStatus" -ForegroundColor Green
            if ($location) { Write-Host "    Redirects to: $location" -ForegroundColor Cyan }
        } else {
            Write-Host "  ❌ FAIL: Expected $expectedStatus, got $actualStatus" -ForegroundColor Red
        }
        
    } catch {
        $result = @{
            URL = $url
            Description = $description
            ExpectedStatus = $expectedStatus
            ActualStatus = "ERROR"
            Error = $_.Exception.Message
            Success = $false
        }
        Write-Host "  ❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    $testResults += $result
    Write-Host ""
    return $result
}

# Test 1: Root redirect
Test-Route "$baseUrl/" "Root should redirect to default app" 302 $null "/apps/vibesynq/"

# Test 2: App routes
Test-Route "$baseUrl/apps/vibesynq/" "VibeSynq app index" 200
Test-Route "$baseUrl/apps/admin/" "Admin app index" 200
Test-Route "$baseUrl/apps/app1/" "App1 placeholder" 200
Test-Route "$baseUrl/apps/app2/" "App2 placeholder" 200

# Test 3: Static assets (if they exist)
Test-Route "$baseUrl/apps/vibesynq/assets/" "VibeSynq assets directory" -1 # May vary
Test-Route "$baseUrl/apps/admin/assets/" "Admin assets directory" -1 # May vary

# Test 4: SPA routing (should return index.html)
Test-Route "$baseUrl/apps/vibesynq/some-spa-route" "VibeSynq SPA route" 200
Test-Route "$baseUrl/apps/admin/dashboard" "Admin SPA route" 200

# Test 5: Root static files
Test-Route "$baseUrl/moto.html" "Root static file (moto.html)" 200
Test-Route "$baseUrl/multisynq-client.txt" "Root static file (multisynq-client.txt)" 200

# Test 6: Health endpoint
Test-Route "$baseUrl/health" "Health check endpoint" 200

# Test 7: LLM subdomain simulation (if supported)
# Note: This would require host header manipulation in a real test

Write-Host "=== Test Summary ===" -ForegroundColor Green
$passed = ($testResults | Where-Object { $_.Success -eq $true }).Count
$total = $testResults.Count
Write-Host "Passed: $passed/$total tests" -ForegroundColor $(if ($passed -eq $total) { "Green" } else { "Yellow" })

if ($passed -ne $total) {
    Write-Host ""
    Write-Host "Failed tests:" -ForegroundColor Red
    $testResults | Where-Object { $_.Success -eq $false } | ForEach-Object {
        Write-Host "  - $($_.Description): $($_.URL)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Manual Tests to Run ===" -ForegroundColor Cyan
Write-Host "1. Test subdomain routing (requires hosts file):"
Write-Host "   Add to hosts: 127.0.0.1 admin.localhost vibesynq.localhost llm.localhost"
Write-Host "   Then test: http://admin.localhost:3001/ and http://vibesynq.localhost:3001/"
Write-Host ""
Write-Host "2. Test with browser for full SPA functionality"
Write-Host "3. Test asset loading in browser dev tools" 
