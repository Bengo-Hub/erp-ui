# PowerShell script to update services to extend BaseService

$servicesToUpdate = @(
    @{ Path = "src/services/ecommerce/orderService.js"; BaseURL = "/ecommerce/order" },
    @{ Path = "src/services/ecommerce/inventoryService.js"; BaseURL = "/ecommerce/stockinventory" },
    @{ Path = "src/services/finance/financeService.js"; BaseURL = "/finance" },
    @{ Path = "src/services/procurement/procurementService.js"; BaseURL = "/procurement" },
    @{ Path = "src/services/hrm/payrollService.js"; BaseURL = "/hrm/payroll" },
    @{ Path = "src/services/hrm/analyticsService.js"; BaseURL = "/hrm/analytics" },
    @{ Path = "src/services/manufacturing/manufacturingService.js"; BaseURL = "/manufacturing" }
)

Write-Host "🚀 Starting service updates..." -ForegroundColor Cyan
Write-Host ""

$updateCount = 0
$errors = @()

foreach ($service in $servicesToUpdate) {
    $filePath = $service.Path
    $baseURL = $service.BaseURL
    
    if (Test-Path $filePath) {
        Write-Host "📝 Updating: $filePath" -ForegroundColor Yellow
        
        try {
            $content = Get-Content $filePath -Raw
            
            # Check if already extends BaseService
            if ($content -match "extends BaseService") {
                Write-Host "  ✅ Already using BaseService" -ForegroundColor Green
                continue
            }
            
            # Add BaseService import at the top
            if ($content -notmatch "import.*BaseService") {
                # Determine correct relative path
                $depth = ($filePath -split "/").Count - 3
                $relativePath = "../" * $depth + "base/BaseService"
                
                # Add import after first import line
                $content = $content -replace "(import.*?;)", "`$1`nimport BaseService from '$relativePath';`nimport { extractPaginatedData } from '../utils/responseHandler';"
                
                Write-Host "  ✓ Added BaseService import" -ForegroundColor Gray
            }
            
            # Note: Actual service conversion requires manual review
            # This script prepares the files
            
            Set-Content -Path $filePath -Value $content -NoNewline
            $updateCount++
            Write-Host "  ✅ Prepared for update" -ForegroundColor Green
            
        } catch {
            $errors += @{ File = $filePath; Error = $_.Exception.Message }
            Write-Host "  ❌ Error: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "  ⚠️  File not found: $filePath" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "  Files processed: $($servicesToUpdate.Count)" -ForegroundColor White
Write-Host "  Updated: $updateCount" -ForegroundColor Green
Write-Host "  Errors: $($errors.Count)" -ForegroundColor $(if ($errors.Count -gt 0) { "Red" } else { "Green" })

if ($errors.Count -gt 0) {
    Write-Host ""
    Write-Host "❌ Errors:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "  - $($error.File): $($error.Error)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ Service update preparation complete!" -ForegroundColor Green
Write-Host "📝 Note: Manual review required for complete conversion to BaseService" -ForegroundColor Yellow

