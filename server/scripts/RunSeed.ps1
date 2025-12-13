# =============================================
# PharmaAssist Database Seed Script Runner
# PowerShell version - Run this script to seed all test data
# =============================================

param(
    [string]$Server = ".",
    [string]$Database = "PharmaAssist"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "PharmaAssist Database Seed Script" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server: $Server"
Write-Host "Database: $Database"
Write-Host "Script Directory: $ScriptDir"
Write-Host ""

# List of scripts to execute in order
$scripts = @(
    @{ Name = "Roles and Users"; File = "SeedData_01_Roles_Users.sql" },
    @{ Name = "Geography (Entities, Cantons, Cities)"; File = "SeedData_02_Geography.sql" },
    @{ Name = "Manufacturers and Categories"; File = "SeedData_03_Manufacturers_Categories.sql" },
    @{ Name = "Products"; File = "SeedData_04_Products.sql" },
    @{ Name = "Customers and Addresses"; File = "SeedData_05_Customers.sql" },
    @{ Name = "Warehouses and Inventory"; File = "SeedData_06_Warehouses_Inventory.sql" },
    @{ Name = "Orders"; File = "SeedData_07_Orders.sql" },
    @{ Name = "Order Items"; File = "SeedData_08_OrderItems.sql" },
    @{ Name = "Feature Flags and Promotions"; File = "SeedData_09_FeatureFlags_Promotions.sql" }
)

$total = $scripts.Count
$current = 0

foreach ($script in $scripts) {
    $current++
    $filePath = Join-Path $ScriptDir $script.File
    
    Write-Host "[$current/$total] Seeding $($script.Name)..." -ForegroundColor Yellow
    
    if (-not (Test-Path $filePath)) {
        Write-Host "ERROR: Script file not found: $filePath" -ForegroundColor Red
        exit 1
    }
    
    try {
        Invoke-Sqlcmd -ServerInstance $Server -Database $Database -InputFile $filePath -ErrorAction Stop
        Write-Host "        Done." -ForegroundColor Green
    }
    catch {
        Write-Host "ERROR: Failed to execute $($script.File)" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "Database seed completed successfully!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Users created (password: test123):" -ForegroundColor Cyan
Write-Host "  - admin@pharmaassist.ba (System Admin)"
Write-Host "  - manager.user@pharmaassist.com"
Write-Host "  - pharmacist.user@pharmaassist.com"
Write-Host "  - salesrep.user@pharmaassist.com"
Write-Host "  - warehouse.user@pharmaassist.com"
Write-Host "  - customer.user@pharmaassist.com"
Write-Host ""

# Display record counts
Write-Host "Record counts:" -ForegroundColor Cyan
$query = @"
SELECT 'Users' as TableName, COUNT(*) as Records FROM Users
UNION ALL SELECT 'Customers', COUNT(*) FROM Customers
UNION ALL SELECT 'Products', COUNT(*) FROM Products
UNION ALL SELECT 'Orders', COUNT(*) FROM Orders
UNION ALL SELECT 'OrderItems', COUNT(*) FROM OrderItems
"@

Invoke-Sqlcmd -ServerInstance $Server -Database $Database -Query $query | Format-Table -AutoSize
