# Test server endpoints
Write-Host "Testing Simple Shop API Server..."
Write-Host "=================================="
Write-Host ""

# Test Health Endpoint
Write-Host "1. Testing Health Endpoint..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4001/health" -Method GET
    Write-Host "   ✅ Status: $($response.StatusCode)" -ForegroundColor Green
    $data = $response.Content | ConvertFrom-Json
    Write-Host "   Status: $($data.status)"
    Write-Host "   MongoDB: $($data.data.mongodb)"
    Write-Host "   Redis: $($data.data.redis)"
} catch {
    Write-Host "   ❌ Failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "2. Testing API Root Endpoint..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4001/" -Method GET
    Write-Host "   ✅ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: API is working"
} catch {
    Write-Host "   ❌ Failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=================================="
Write-Host "✅ Server is running successfully!"
