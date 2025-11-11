# 🔍 TechBasket Health Check PowerShell Script
# בודק את כל נקודות הקצה ומדווח על מצב המערכת

param(
    [string]$ServerHost = "localhost",
    [int]$ServerPort = 3000,
    [string]$ClientHost = "localhost", 
    [int]$ClientPort = 5173
)

Write-Host "🔍 TechBasket Health Check" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

# פונקציית בדיקת חיבור
function Test-Connection {
    param(
        [string]$Host,
        [int]$Port,
        [string]$ServiceName
    )
    
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.ReceiveTimeout = 2000
        $tcpClient.SendTimeout = 2000
        
        $result = $tcpClient.BeginConnect($Host, $Port, $null, $null)
        $success = $result.AsyncWaitHandle.WaitOne(2000, $false)
        
        if ($success) {
            $tcpClient.EndConnect($result)
            $tcpClient.Close()
            return $true
        } else {
            $tcpClient.Close()
            return $false
        }
    }
    catch {
        return $false
    }
}

# פונקציית בדיקת API endpoint
function Test-ApiEndpoint {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [int]$ExpectedStatus = 200
    )
    
    try {
        $requestParams = @{
            Uri = $Url
            Method = $Method
            TimeoutSec = 5
            ErrorAction = "Stop"
        }
        
        if ($Headers.Count -gt 0) {
            $requestParams.Headers = $Headers
        }
        
        if ($Body) {
            $requestParams.Body = $Body
            $requestParams.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @requestParams
        
        return @{
            Success = $response.StatusCode -eq $ExpectedStatus
            Status = $response.StatusCode
            Data = $response.Content
        }
    }
    catch [System.Net.WebException] {
        $response = $_.Exception.Response
        if ($response) {
            return @{
                Success = $response.StatusCode -eq $ExpectedStatus
                Status = [int]$response.StatusCode
                Error = $_.Exception.Message
            }
        } else {
            return @{
                Success = $false
                Status = 0
                Error = $_.Exception.Message
            }
        }
    }
    catch {
        return @{
            Success = $false
            Status = 0
            Error = $_.Exception.Message
        }
    }
}

# בדיקת חיבורים
Write-Host "📡 בדיקת חיבור לשרתים:" -ForegroundColor Blue
$serverConnection = Test-Connection -Host $ServerHost -Port $ServerPort -ServiceName "Server"
$clientConnection = Test-Connection -Host $ClientHost -Port $ClientPort -ServiceName "Client"

if ($serverConnection) {
    Write-Host "  ✅ Server ($ServerHost`:$ServerPort): Connected" -ForegroundColor Green
} else {
    Write-Host "  ❌ Server ($ServerHost`:$ServerPort): Not Connected" -ForegroundColor Red
}

if ($clientConnection) {
    Write-Host "  ✅ Client ($ClientHost`:$ClientPort): Connected" -ForegroundColor Green
} else {
    Write-Host "  ❌ Client ($ClientHost`:$ClientPort): Not Connected" -ForegroundColor Red
}

Write-Host ""

if (-not $serverConnection) {
    Write-Host "❌ השרת לא זמין. וודא ש:" -ForegroundColor Red
    Write-Host "   1. השרת רץ על $ServerHost`:$ServerPort"
    Write-Host "   2. הפעל: cd server && npm run dev"
    Write-Host "   3. MongoDB ו-Redis פועלים"
    return
}

# בדיקת API endpoints
Write-Host "🔍 בדיקת API Endpoints:" -ForegroundColor Blue

$baseUrl = "http://$ServerHost`:$ServerPort"
$results = @()

# רשימת endpoints לבדיקה
$endpoints = @(
    @{ Name = "Health Check - Basic"; Url = "$baseUrl/api/health"; ExpectedStatus = 200 },
    @{ Name = "Health Check - Detailed"; Url = "$baseUrl/api/health/detailed"; ExpectedStatus = 200 },
    @{ Name = "Products - Get All"; Url = "$baseUrl/api/products"; ExpectedStatus = 200 },
    @{ Name = "Products - Get Single"; Url = "$baseUrl/api/products/1"; ExpectedStatus = 200 },
    @{ Name = "Products - Invalid ID"; Url = "$baseUrl/api/products/999999"; ExpectedStatus = 404 },
    @{ Name = "Cart - Get Cart"; Url = "$baseUrl/api/cart/test-session"; ExpectedStatus = 200 },
    @{ 
        Name = "Cart - Add Item"; 
        Url = "$baseUrl/api/cart/add"; 
        Method = "POST"; 
        Body = '{"sessionId":"health-check","productId":"1","quantity":2}'; 
        ExpectedStatus = 200 
    },
    @{ 
        Name = "Cart - Clear Cart"; 
        Url = "$baseUrl/api/cart/clear"; 
        Method = "POST"; 
        Body = '{"sessionId":"health-check"}'; 
        ExpectedStatus = 200 
    }
)

foreach ($endpoint in $endpoints) {
    $result = Test-ApiEndpoint -Url $endpoint.Url -Method ($endpoint.Method ?? "GET") -Body $endpoint.Body -ExpectedStatus $endpoint.ExpectedStatus
    
    if ($result.Success) {
        Write-Host "  ✅ $($endpoint.Name): $($result.Status)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $($endpoint.Name): $($result.Status) $(if($result.Error) { "- $($result.Error)" })" -ForegroundColor Red
    }
    
    $results += $result
    Start-Sleep -Milliseconds 100
}

Write-Host ""

# סיכום
$successful = ($results | Where-Object { $_.Success }).Count
$total = $results.Count
$successRate = [math]::Round(($successful / $total) * 100, 1)

Write-Host "📊 סיכום:" -ForegroundColor Blue
Write-Host "  ✅ עובדים: $successful/$total ($successRate%)" -ForegroundColor Green
Write-Host "  ❌ לא עובדים: $($total - $successful)/$total" -ForegroundColor Red

if ($successful -eq $total) {
    Write-Host "🎉 כל המערכת תקינה ומוכנה לשימוש!" -ForegroundColor Green
} elseif ($successful -gt ($total * 0.8)) {
    Write-Host "⚠️ המערכת עובדת, יש כמה בעיות קלות" -ForegroundColor Yellow
} else {
    Write-Host "🚨 יש בעיות משמעותיות במערכת" -ForegroundColor Red
}

Write-Host ""
Write-Host "💡 טיפים:" -ForegroundColor Blue
Write-Host "   • בדיקת כניסה לאתר: http://$ClientHost`:$ClientPort"
Write-Host "   • בדיקת API ישירות: http://$ServerHost`:$ServerPort/api/health"
Write-Host "   • Postman collection: server/postman/collection.json"
Write-Host ""