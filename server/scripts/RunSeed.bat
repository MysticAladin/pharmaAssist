@echo off
REM =============================================
REM PharmaAssist Database Seed Script Runner
REM Run this script to seed all test data
REM =============================================

echo =============================================
echo PharmaAssist Database Seed Script
echo =============================================
echo.

REM Set the script directory
set SCRIPT_DIR=%~dp0

REM Database connection settings
set SERVER=.
set DATABASE=PharmaAssist

echo Server: %SERVER%
echo Database: %DATABASE%
echo Script Directory: %SCRIPT_DIR%
echo.

REM Check if sqlcmd is available
where sqlcmd >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: sqlcmd not found. Please install SQL Server Command Line Utilities.
    echo Download from: https://learn.microsoft.com/en-us/sql/tools/sqlcmd-utility
    pause
    exit /b 1
)

echo Starting database seed...
echo.

REM Execute each script in order
echo [1/9] Seeding Roles and Users...
sqlcmd -S %SERVER% -d %DATABASE% -E -i "%SCRIPT_DIR%SeedData_01_Roles_Users.sql"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to execute SeedData_01_Roles_Users.sql
    pause
    exit /b 1
)

echo [2/9] Seeding Geography (Entities, Cantons, Cities)...
sqlcmd -S %SERVER% -d %DATABASE% -E -i "%SCRIPT_DIR%SeedData_02_Geography.sql"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to execute SeedData_02_Geography.sql
    pause
    exit /b 1
)

echo [3/9] Seeding Manufacturers and Categories...
sqlcmd -S %SERVER% -d %DATABASE% -E -i "%SCRIPT_DIR%SeedData_03_Manufacturers_Categories.sql"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to execute SeedData_03_Manufacturers_Categories.sql
    pause
    exit /b 1
)

echo [4/9] Seeding Products...
sqlcmd -S %SERVER% -d %DATABASE% -E -i "%SCRIPT_DIR%SeedData_04_Products.sql"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to execute SeedData_04_Products.sql
    pause
    exit /b 1
)

echo [5/9] Seeding Customers and Addresses...
sqlcmd -S %SERVER% -d %DATABASE% -E -i "%SCRIPT_DIR%SeedData_05_Customers.sql"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to execute SeedData_05_Customers.sql
    pause
    exit /b 1
)

echo [6/9] Seeding Warehouses and Inventory...
sqlcmd -S %SERVER% -d %DATABASE% -E -i "%SCRIPT_DIR%SeedData_06_Warehouses_Inventory.sql"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to execute SeedData_06_Warehouses_Inventory.sql
    pause
    exit /b 1
)

echo [7/9] Seeding Orders...
sqlcmd -S %SERVER% -d %DATABASE% -E -i "%SCRIPT_DIR%SeedData_07_Orders.sql"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to execute SeedData_07_Orders.sql
    pause
    exit /b 1
)

echo [8/9] Seeding Order Items...
sqlcmd -S %SERVER% -d %DATABASE% -E -i "%SCRIPT_DIR%SeedData_08_OrderItems.sql"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to execute SeedData_08_OrderItems.sql
    pause
    exit /b 1
)

echo [9/9] Seeding Feature Flags and Promotions...
sqlcmd -S %SERVER% -d %DATABASE% -E -i "%SCRIPT_DIR%SeedData_09_FeatureFlags_Promotions.sql"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to execute SeedData_09_FeatureFlags_Promotions.sql
    pause
    exit /b 1
)

echo.
echo =============================================
echo Database seed completed successfully!
echo =============================================
echo.
echo Users created (password: test123):
echo   - admin@pharmaassist.ba (System Admin)
echo   - manager.user@pharmaassist.com
echo   - pharmacist.user@pharmaassist.com
echo   - salesrep.user@pharmaassist.com
echo   - warehouse.user@pharmaassist.com
echo   - customer.user@pharmaassist.com
echo.
pause
