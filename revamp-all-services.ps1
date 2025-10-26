# Comprehensive Service Pagination Revamp Script
# Updates all services to support standardized pagination

$services = @(
    "src/services/hrm/payrollService.js",
    "src/services/hrm/leaveService.js",
    "src/services/hrm/appraisalService.js",
    "src/services/hrm/trainingService.js",
    "src/services/hrm/analyticsService.js",
    "src/services/hrm/hrmAnalyticsService.js",
    "src/services/finance/financeService.js",
    "src/services/ecommerce/cartService.js",
    "src/services/ecommerce/ecommerceService.js",
    "src/services/ecommerce/orderService.js",
    "src/services/ecommerce/customerService.js",
    "src/services/ecommerce/posService.js",
    "src/services/ecommerce/inventoryService.js",
    "src/services/procurement/procurementService.js",
    "src/services/shared/coreService.js",
    "src/services/shared/dashboardService.js",
    "src/services/shared/systemConfigService.js",
    "src/services/auth/userManagementService.js",
    "src/services/auth/permissionService.js",
    "src/services/manufacturing/manufacturingService.js",
    "src/services/reports/reportsService.js",
    "src/services/reports/payrollReportsService.js",
    "src/services/reports/ecommerceReportsService.js"
)

$updatedCount = 0
$skippedCount = 0
$errorCount = 0

Write-Host "🚀 Starting comprehensive service pagination revamp..." -ForegroundColor Cyan
Write-Host "📊 Processing $($services.Count) service files`n" -ForegroundColor White

foreach ($servicePath in $services) {
    if (-not (Test-Path $servicePath)) {
        Write-Host "⏭️  SKIP: $servicePath (not found)" -ForegroundColor Yellow
        $skippedCount++
        continue
    }
    
    try {
        Write-Host "Processing: $servicePath" -ForegroundColor Cyan
        $content = Get-Content $servicePath -Raw
        $originalContent = $content
        $changes = @()
        
        # Check if already has responseHandler import
        if ($content -notmatch "import.*responseHandler") {
            # Find the first import statement
            if ($content -match "(?m)^import .+ from ['\`"]") {
                # Add import after first import
                $content = $content -replace "((?m)^import .+ from ['\`"][^'\`"]+['\`"];?\r?\n)", "`$1import { extractPaginatedData, extractResults } from '../utils/responseHandler';`n"
                $changes += "Added responseHandler import"
            } else {
                Write-Host "  ⚠️  No import statements found" -ForegroundColor Yellow
            }
        }
        
        # Update axios.get() calls that return lists to use extractPaginatedData
        # Pattern: return axios.get(...).then(response => response.data)
        $content = $content -replace "return axios\.get\(([^)]+)\)\.then\(response => response\.data\)", "return axios.get(`$1).then(response => extractPaginatedData(response))"
        
        # Pattern: return axios.get(...) for list endpoints
        $listEndpoints = @(
            "/employees/", "/payslips/", "/leave/", "/attendance/",
            "/products/", "/orders/", "/customers/", "/inventory/",
            "/accounts/", "/expenses/", "/payments/", "/budgets/",
            "/purchases/", "/requisitions/", "/suppliers/",
            "/assets/", "/categories/", "/reports/", "/analytics/"
        )
        
        foreach ($endpoint in $listEndpoints) {
            if ($content -match "return axios\.get\([`"'].*$endpoint") {
                $pattern = "return axios\.get\(([^)]*$endpoint[^)]*)\);?"
                $replacement = "return axios.get(`$1).then(response => extractPaginatedData(response));"
                $content = $content -replace $pattern, $replacement
                if ($content -ne $originalContent) {
                    $changes += "Updated $endpoint endpoint"
                }
            }
        }
        
        # Update common list method patterns
        $content = $content -replace "async\s+getAll\(([^)]*)\)\s*\{\s*return\s+axios\.get\(", "async getAll(`$1) { return axios.get("
        $content = $content -replace "async\s+list\(([^)]*)\)\s*\{\s*return\s+axios\.get\(", "async list(`$1) { return axios.get("
        
        if ($content -ne $originalContent) {
            Set-Content -Path $servicePath -Value $content -NoNewline
            Write-Host "  ✅ Updated: $($changes -join ', ')" -ForegroundColor Green
            $updatedCount++
        } else {
            Write-Host "  ⏭️  No changes needed" -ForegroundColor Gray
            $skippedCount++
        }
        
    } catch {
        Write-Host "  ❌ ERROR: $_" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "📊 Service Revamp Summary:" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "✅ Updated: $updatedCount files" -ForegroundColor Green
Write-Host "⏭️  Skipped: $skippedCount files" -ForegroundColor Yellow
Write-Host "❌ Errors: $errorCount files" -ForegroundColor $(if ($errorCount -gt 0) { "Red" } else { "Green" })
Write-Host ("=" * 60) -ForegroundColor Cyan

if ($updatedCount -gt 0) {
    Write-Host "`n✨ Next step: Update views and components to use usePagination composable" -ForegroundColor Yellow
}

