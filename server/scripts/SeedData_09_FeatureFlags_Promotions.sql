-- =============================================
-- PharmaAssist Database Seed Script
-- Part 9: Feature Flags and Promotions
-- =============================================

SET NOCOUNT ON;
GO

PRINT 'Starting Part 9: Feature Flags and Promotions seed...';

DECLARE @Now DATETIME2 = GETUTCDATE();

-- =============================================
-- CLEANUP: Delete existing feature flags and promotions
-- =============================================
PRINT 'Cleaning up existing feature flags and promotions...';

DELETE FROM FeatureFlagHistory;
DELETE FROM ClientFeatureFlags;
DELETE FROM SystemFeatureFlags;
DELETE FROM PromotionUsages;
DELETE FROM PromotionProducts;
DELETE FROM PromotionCategories;
DELETE FROM Promotions;

PRINT 'Feature flags and promotions cleanup completed.';

-- =============================================
-- 1. SYSTEM FEATURE FLAGS
-- =============================================
PRINT 'Seeding System Feature Flags...';

-- Core Features
IF NOT EXISTS (SELECT 1 FROM SystemFeatureFlags WHERE [Key] = 'dashboard')
INSERT INTO SystemFeatureFlags ([Key], Name, Description, Category, Type, Value, DefaultValue, IsEnabled, AllowClientOverride, Environment, IsDeleted, CreatedAt, CreatedBy)
VALUES ('dashboard', 'Dashboard', 'Main dashboard with analytics and overview', 0, 0, 'true', 'true', 1, 0, NULL, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM SystemFeatureFlags WHERE [Key] = 'orders')
INSERT INTO SystemFeatureFlags ([Key], Name, Description, Category, Type, Value, DefaultValue, IsEnabled, AllowClientOverride, Environment, IsDeleted, CreatedAt, CreatedBy)
VALUES ('orders', 'Orders Management', 'Order creation and management', 0, 0, 'true', 'true', 1, 0, NULL, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM SystemFeatureFlags WHERE [Key] = 'products')
INSERT INTO SystemFeatureFlags ([Key], Name, Description, Category, Type, Value, DefaultValue, IsEnabled, AllowClientOverride, Environment, IsDeleted, CreatedAt, CreatedBy)
VALUES ('products', 'Products Catalog', 'Product browsing and management', 0, 0, 'true', 'true', 1, 0, NULL, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM SystemFeatureFlags WHERE [Key] = 'customers')
INSERT INTO SystemFeatureFlags ([Key], Name, Description, Category, Type, Value, DefaultValue, IsEnabled, AllowClientOverride, Environment, IsDeleted, CreatedAt, CreatedBy)
VALUES ('customers', 'Customers', 'Customer management', 0, 0, 'true', 'true', 1, 0, NULL, 0, @Now, 'Seed');

-- Premium Features (tier-locked)
IF NOT EXISTS (SELECT 1 FROM SystemFeatureFlags WHERE [Key] = 'reports')
INSERT INTO SystemFeatureFlags ([Key], Name, Description, Category, Type, Value, DefaultValue, IsEnabled, AllowClientOverride, Environment, IsDeleted, CreatedAt, CreatedBy)
VALUES ('reports', 'Advanced Reports', 'Advanced reporting and analytics', 1, 0, 'true', 'true', 1, 1, NULL, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM SystemFeatureFlags WHERE [Key] = 'reportBuilder')
INSERT INTO SystemFeatureFlags ([Key], Name, Description, Category, Type, Value, DefaultValue, IsEnabled, AllowClientOverride, Environment, IsDeleted, CreatedAt, CreatedBy)
VALUES ('reportBuilder', 'Report Builder', 'Custom report creation tool', 1, 0, 'true', 'true', 1, 1, NULL, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM SystemFeatureFlags WHERE [Key] = 'tenders')
INSERT INTO SystemFeatureFlags ([Key], Name, Description, Category, Type, Value, DefaultValue, IsEnabled, AllowClientOverride, Environment, IsDeleted, CreatedAt, CreatedBy)
VALUES ('tenders', 'Tender Management', 'Public tender participation and management', 1, 0, 'true', 'true', 1, 1, NULL, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM SystemFeatureFlags WHERE [Key] = 'budgets')
INSERT INTO SystemFeatureFlags ([Key], Name, Description, Category, Type, Value, DefaultValue, IsEnabled, AllowClientOverride, Environment, IsDeleted, CreatedAt, CreatedBy)
VALUES ('budgets', 'Budget Management', 'Budget tracking and expense management', 1, 0, 'true', 'true', 1, 1, NULL, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM SystemFeatureFlags WHERE [Key] = 'claims')
INSERT INTO SystemFeatureFlags ([Key], Name, Description, Category, Type, Value, DefaultValue, IsEnabled, AllowClientOverride, Environment, IsDeleted, CreatedAt, CreatedBy)
VALUES ('claims', 'Claims Processing', 'Product returns and claims management', 1, 0, 'true', 'true', 1, 1, NULL, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM SystemFeatureFlags WHERE [Key] = 'promotions')
INSERT INTO SystemFeatureFlags ([Key], Name, Description, Category, Type, Value, DefaultValue, IsEnabled, AllowClientOverride, Environment, IsDeleted, CreatedAt, CreatedBy)
VALUES ('promotions', 'Promotions', 'Promotional campaigns and discounts', 1, 0, 'true', 'true', 1, 1, NULL, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM SystemFeatureFlags WHERE [Key] = 'inventory')
INSERT INTO SystemFeatureFlags ([Key], Name, Description, Category, Type, Value, DefaultValue, IsEnabled, AllowClientOverride, Environment, IsDeleted, CreatedAt, CreatedBy)
VALUES ('inventory', 'Inventory Management', 'Stock tracking and warehouse management', 1, 0, 'true', 'true', 1, 1, NULL, 0, @Now, 'Seed');

-- Experimental Features
IF NOT EXISTS (SELECT 1 FROM SystemFeatureFlags WHERE [Key] = 'aiAssistant')
INSERT INTO SystemFeatureFlags ([Key], Name, Description, Category, Type, Value, DefaultValue, IsEnabled, AllowClientOverride, Environment, IsDeleted, CreatedAt, CreatedBy)
VALUES ('aiAssistant', 'AI Assistant', 'AI-powered assistant for product recommendations', 2, 0, 'false', 'false', 0, 0, NULL, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM SystemFeatureFlags WHERE [Key] = 'predictiveOrdering')
INSERT INTO SystemFeatureFlags ([Key], Name, Description, Category, Type, Value, DefaultValue, IsEnabled, AllowClientOverride, Environment, IsDeleted, CreatedAt, CreatedBy)
VALUES ('predictiveOrdering', 'Predictive Ordering', 'AI-based order predictions and suggestions', 2, 0, 'false', 'false', 0, 0, NULL, 0, @Now, 'Seed');

-- UI Features
IF NOT EXISTS (SELECT 1 FROM SystemFeatureFlags WHERE [Key] = 'darkMode')
INSERT INTO SystemFeatureFlags ([Key], Name, Description, Category, Type, Value, DefaultValue, IsEnabled, AllowClientOverride, Environment, IsDeleted, CreatedAt, CreatedBy)
VALUES ('darkMode', 'Dark Mode', 'Dark theme support', 3, 0, 'true', 'true', 1, 1, NULL, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM SystemFeatureFlags WHERE [Key] = 'compactView')
INSERT INTO SystemFeatureFlags ([Key], Name, Description, Category, Type, Value, DefaultValue, IsEnabled, AllowClientOverride, Environment, IsDeleted, CreatedAt, CreatedBy)
VALUES ('compactView', 'Compact View', 'Compact table and list views', 3, 0, 'true', 'true', 1, 1, NULL, 0, @Now, 'Seed');

-- Settings as feature flags
IF NOT EXISTS (SELECT 1 FROM SystemFeatureFlags WHERE [Key] = 'maxOrderItems')
INSERT INTO SystemFeatureFlags ([Key], Name, Description, Category, Type, Value, DefaultValue, IsEnabled, AllowClientOverride, Environment, IsDeleted, CreatedAt, CreatedBy)
VALUES ('maxOrderItems', 'Max Order Items', 'Maximum items allowed per order', 4, 1, '100', '100', 1, 1, NULL, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM SystemFeatureFlags WHERE [Key] = 'defaultPaymentTerms')
INSERT INTO SystemFeatureFlags ([Key], Name, Description, Category, Type, Value, DefaultValue, IsEnabled, AllowClientOverride, Environment, IsDeleted, CreatedAt, CreatedBy)
VALUES ('defaultPaymentTerms', 'Default Payment Terms', 'Default payment terms in days', 4, 1, '30', '30', 1, 1, NULL, 0, @Now, 'Seed');

-- Portal Features
IF NOT EXISTS (SELECT 1 FROM SystemFeatureFlags WHERE [Key] = 'portal.split_invoice')
INSERT INTO SystemFeatureFlags ([Key], Name, Description, Category, Type, Value, DefaultValue, IsEnabled, AllowClientOverride, Environment, IsDeleted, CreatedAt, CreatedBy)
VALUES ('portal.split_invoice', 'Split Invoice', 'Generate separate invoices for Commercial and Essential items in customer portal', 1, 0, 'true', 'true', 1, 1, NULL, 0, @Now, 'Seed');

PRINT 'System Feature Flags seeded successfully.';

-- =============================================
-- 2. CLIENT FEATURE FLAGS (overrides for specific customers)
-- =============================================
PRINT 'Seeding Client Feature Flags...';

-- Get customer IDs
DECLARE @HQ1Id INT = (SELECT Id FROM Customers WHERE CustomerCode = 'CUST-HQ-001');
DECLARE @HQ3Id INT = (SELECT Id FROM Customers WHERE CustomerCode = 'CUST-HQ-003');
DECLARE @SM1Id INT = (SELECT Id FROM Customers WHERE CustomerCode = 'CUST-SM-001');

-- Get flag IDs
DECLARE @ReportsFlagId INT = (SELECT Id FROM SystemFeatureFlags WHERE [Key] = 'reports');
DECLARE @TendersFlagId INT = (SELECT Id FROM SystemFeatureFlags WHERE [Key] = 'tenders');
DECLARE @BudgetsFlagId INT = (SELECT Id FROM SystemFeatureFlags WHERE [Key] = 'budgets');
DECLARE @MaxItemsFlagId INT = (SELECT Id FROM SystemFeatureFlags WHERE [Key] = 'maxOrderItems');

-- Premium customer gets all features enabled
IF @HQ1Id IS NOT NULL AND @ReportsFlagId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ClientFeatureFlags WHERE CustomerId = @HQ1Id AND SystemFlagId = @ReportsFlagId)
INSERT INTO ClientFeatureFlags (CustomerId, SystemFlagId, IsEnabled, Value, Reason, ExpiresAt, IsDeleted, CreatedAt, CreatedBy)
VALUES (@HQ1Id, @ReportsFlagId, 1, 'true', 'Premium customer - Enterprise tier', NULL, 0, @Now, 'Seed');

IF @HQ1Id IS NOT NULL AND @TendersFlagId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ClientFeatureFlags WHERE CustomerId = @HQ1Id AND SystemFlagId = @TendersFlagId)
INSERT INTO ClientFeatureFlags (CustomerId, SystemFlagId, IsEnabled, Value, Reason, ExpiresAt, IsDeleted, CreatedAt, CreatedBy)
VALUES (@HQ1Id, @TendersFlagId, 1, 'true', 'Premium customer - Enterprise tier', NULL, 0, @Now, 'Seed');

-- Hospital gets extended order limits
IF @HQ3Id IS NOT NULL AND @MaxItemsFlagId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ClientFeatureFlags WHERE CustomerId = @HQ3Id AND SystemFlagId = @MaxItemsFlagId)
INSERT INTO ClientFeatureFlags (CustomerId, SystemFlagId, IsEnabled, Value, Reason, ExpiresAt, IsDeleted, CreatedAt, CreatedBy)
VALUES (@HQ3Id, @MaxItemsFlagId, 1, '500', 'Hospital - extended order capacity', NULL, 0, @Now, 'Seed');

-- Small pharmacy gets trial access to reports
IF @SM1Id IS NOT NULL AND @ReportsFlagId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ClientFeatureFlags WHERE CustomerId = @SM1Id AND SystemFlagId = @ReportsFlagId)
INSERT INTO ClientFeatureFlags (CustomerId, SystemFlagId, IsEnabled, Value, Reason, ExpiresAt, IsDeleted, CreatedAt, CreatedBy)
VALUES (@SM1Id, @ReportsFlagId, 1, 'true', 'Trial access - 30 days', DATEADD(DAY, 30, @Now), 0, @Now, 'Seed');

PRINT 'Client Feature Flags seeded successfully.';

-- =============================================
-- 3. PROMOTIONS
-- =============================================
PRINT 'Seeding Promotions...';

-- Active promotion for all customers
IF NOT EXISTS (SELECT 1 FROM Promotions WHERE Code = 'WINTER2024')
INSERT INTO Promotions (Code, Name, Description, Type, Value, StartDate, EndDate, 
    MinimumOrderAmount, MaximumDiscountAmount, AppliesToAllProducts, AppliesToAllCustomers,
    ApplyToChildCustomers, RequiresCode, RequiredCustomerTier, RequiredCustomerType,
    MaxUsageCount, MaxUsagePerCustomer, CurrentUsageCount, CanStackWithOtherPromotions, CanStackWithTierPricing,
    TermsAndConditions, CustomerId, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('WINTER2024', 'Winter Sale 2024', '10% off all orders over 500 BAM', 0, 10.00,
    DATEADD(DAY, -30, @Now), DATEADD(DAY, 60, @Now),
    500.00, 100.00, 1, 1,
    1, 1, NULL, NULL,
    NULL, 5, 0, 0, 1,
    'Valid for orders over 500 BAM. Maximum discount 100 BAM.', NULL, 1, 0, @Now, 'Seed');

-- Category-specific promotion
IF NOT EXISTS (SELECT 1 FROM Promotions WHERE Code = 'VITAMINS20')
INSERT INTO Promotions (Code, Name, Description, Type, Value, StartDate, EndDate, 
    MinimumOrderAmount, MaximumDiscountAmount, AppliesToAllProducts, AppliesToAllCustomers,
    ApplyToChildCustomers, RequiresCode, RequiredCustomerTier, RequiredCustomerType,
    MaxUsageCount, MaxUsagePerCustomer, CurrentUsageCount, CanStackWithOtherPromotions, CanStackWithTierPricing,
    TermsAndConditions, CustomerId, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('VITAMINS20', 'Vitamin Special', '20% off vitamins and supplements', 0, 20.00,
    DATEADD(DAY, -15, @Now), DATEADD(DAY, 45, @Now),
    100.00, 50.00, 0, 1,
    1, 0, NULL, NULL,
    1000, 3, 45, 1, 1,
    'Applies to vitamins and supplements category only.', NULL, 1, 0, @Now, 'Seed');

-- Enterprise customer exclusive
IF NOT EXISTS (SELECT 1 FROM Promotions WHERE Code = 'ENTERPRISE5')
INSERT INTO Promotions (Code, Name, Description, Type, Value, StartDate, EndDate, 
    MinimumOrderAmount, MaximumDiscountAmount, AppliesToAllProducts, AppliesToAllCustomers,
    ApplyToChildCustomers, RequiresCode, RequiredCustomerTier, RequiredCustomerType,
    MaxUsageCount, MaxUsagePerCustomer, CurrentUsageCount, CanStackWithOtherPromotions, CanStackWithTierPricing,
    TermsAndConditions, CustomerId, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('ENTERPRISE5', 'Enterprise Loyalty', '5% automatic discount for Enterprise customers', 0, 5.00,
    DATEADD(YEAR, -1, @Now), DATEADD(YEAR, 1, @Now),
    0.00, NULL, 1, 0,
    1, 0, 1, NULL,
    NULL, NULL, 150, 1, 1,
    'Automatic discount for Enterprise tier customers.', NULL, 1, 0, @Now, 'Seed');

-- Link promotion to vitamins category
DECLARE @VitaminPromoId INT = (SELECT Id FROM Promotions WHERE Code = 'VITAMINS20');
DECLARE @VitaminsCatId INT = (SELECT Id FROM Categories WHERE Name = 'Vitamins');
DECLARE @SuppCatId INT = (SELECT Id FROM Categories WHERE Name = 'Supplements');

IF @VitaminPromoId IS NOT NULL AND @VitaminsCatId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM PromotionCategories WHERE PromotionId = @VitaminPromoId AND CategoryId = @VitaminsCatId)
INSERT INTO PromotionCategories (PromotionId, CategoryId, IsDeleted, CreatedAt, CreatedBy)
VALUES (@VitaminPromoId, @VitaminsCatId, 0, @Now, 'Seed');

IF @VitaminPromoId IS NOT NULL AND @SuppCatId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM PromotionCategories WHERE PromotionId = @VitaminPromoId AND CategoryId = @SuppCatId)
INSERT INTO PromotionCategories (PromotionId, CategoryId, IsDeleted, CreatedAt, CreatedBy)
VALUES (@VitaminPromoId, @SuppCatId, 0, @Now, 'Seed');

PRINT 'Promotions seeded successfully.';
PRINT 'Part 9 completed!';
GO
