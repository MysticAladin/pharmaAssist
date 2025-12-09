-- =============================================
-- PharmaAssist Database Seed Script
-- Part 10: Master Script (runs all parts in order)
-- =============================================

SET NOCOUNT ON;
GO

PRINT '================================================';
PRINT 'PharmaAssist Complete Database Seed Script';
PRINT 'Started at: ' + CONVERT(NVARCHAR, GETDATE(), 120);
PRINT '================================================';
PRINT '';

-- =============================================
-- INSTRUCTIONS:
-- 1. Run this script against your PharmaAssist database
-- 2. Or run individual parts (SeedData_01 through SeedData_09)
-- 3. Password for all users: Test123!
-- 
-- USER ACCOUNTS:
-- - super.admin@pharmaassist.com (SuperAdmin)
-- - admin.user@pharmaassist.com (Admin)
-- - manager.user@pharmaassist.com (Manager)
-- - pharmacist.user@pharmaassist.com (Pharmacist)
-- - salesrep.user@pharmaassist.com (SalesRep)
-- - warehouse.user@pharmaassist.com (Warehouse)
-- - customer.user@pharmaassist.com (Customer)
--
-- IMPORTANT: The password hash in Part 1 is a placeholder.
-- You should either:
-- A) Register users through the application
-- B) Generate proper password hashes using ASP.NET Identity
-- =============================================

PRINT 'Running Part 1: Roles and Users...';
-- Include content from SeedData_01_Roles_Users.sql
:r SeedData_01_Roles_Users.sql
PRINT '';

PRINT 'Running Part 2: BiH Geographic Data...';
-- Include content from SeedData_02_Geography.sql
:r SeedData_02_Geography.sql
PRINT '';

PRINT 'Running Part 3: Manufacturers and Categories...';
-- Include content from SeedData_03_Manufacturers_Categories.sql
:r SeedData_03_Manufacturers_Categories.sql
PRINT '';

PRINT 'Running Part 4: Products...';
-- Include content from SeedData_04_Products.sql
:r SeedData_04_Products.sql
PRINT '';

PRINT 'Running Part 5: Customers and Addresses...';
-- Include content from SeedData_05_Customers.sql
:r SeedData_05_Customers.sql
PRINT '';

PRINT 'Running Part 6: Warehouses and Inventory...';
-- Include content from SeedData_06_Warehouses_Inventory.sql
:r SeedData_06_Warehouses_Inventory.sql
PRINT '';

PRINT 'Running Part 7: Orders...';
-- Include content from SeedData_07_Orders.sql
:r SeedData_07_Orders.sql
PRINT '';

PRINT 'Running Part 8: Order Items...';
-- Include content from SeedData_08_OrderItems.sql
:r SeedData_08_OrderItems.sql
PRINT '';

PRINT 'Running Part 9: Feature Flags and Promotions...';
-- Include content from SeedData_09_FeatureFlags_Promotions.sql
:r SeedData_09_FeatureFlags_Promotions.sql
PRINT '';

PRINT '================================================';
PRINT 'Seed completed at: ' + CONVERT(NVARCHAR, GETDATE(), 120);
PRINT '================================================';
PRINT '';
PRINT 'SUMMARY:';
PRINT '--------';
PRINT 'Users created: 7 (one per role)';
PRINT 'Roles created: 7';
PRINT 'BiH Entities: 3 (FBiH, RS, BD)';
PRINT 'Cantons/Regions: 15';
PRINT 'Municipalities: 11';
PRINT 'Cities: 6';
PRINT 'Manufacturers: 10';
PRINT 'Categories: 20+ (hierarchical)';
PRINT 'Products: 25+';
PRINT 'Customers: 11 (5 HQ + 5 branches + 1 small)';
PRINT 'Warehouses: 4';
PRINT 'Orders: ~60-100 (last 6 months)';
PRINT 'Feature Flags: 15+';
PRINT 'Promotions: 3';
PRINT '';
PRINT 'Login with any user using password: Test123!';
PRINT '';
GO
