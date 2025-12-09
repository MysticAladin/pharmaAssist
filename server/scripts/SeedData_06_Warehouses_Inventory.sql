-- =============================================
-- PharmaAssist Database Seed Script
-- Part 6: Warehouses and Inventory
-- =============================================

SET NOCOUNT ON;
GO

PRINT 'Starting Part 6: Warehouses and Inventory seed...';

DECLARE @Now DATETIME2 = GETUTCDATE();

-- =============================================
-- CLEANUP: Delete existing warehouses and inventory
-- =============================================
PRINT 'Cleaning up existing warehouses and inventory...';

DELETE FROM InventoryStocks;
DELETE FROM StockMovements;
DELETE FROM Warehouses;

PRINT 'Warehouses cleanup completed.';

-- Get geographic IDs
DECLARE @SarajevoCantonId INT = (SELECT Id FROM Cantons WHERE Code = 'SC');
DECLARE @TuzlaCantonId INT = (SELECT Id FROM Cantons WHERE Code = 'TC');
DECLARE @BanjaLukaRegionId INT = (SELECT Id FROM Cantons WHERE Code = 'RS-BL');

DECLARE @SarajevoCityId INT = (SELECT TOP 1 Id FROM Cities WHERE Name = 'Sarajevo');
DECLARE @TuzlaCityId INT = (SELECT TOP 1 Id FROM Cities WHERE Name = 'Tuzla');
DECLARE @BanjaLukaCityId INT = (SELECT TOP 1 Id FROM Cities WHERE Name = 'Banja Luka');

-- =============================================
-- 1. WAREHOUSES
-- =============================================
PRINT 'Seeding Warehouses...';

IF NOT EXISTS (SELECT 1 FROM Warehouses WHERE Code = 'WH-SAR-01')
INSERT INTO Warehouses (Code, Name, NameLocal, Address, PostalCode, CityId, ContactPhone, ContactEmail,
    CapacityCubicMeters, HasColdStorage, HasControlledSubstanceArea, IsDefault, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('WH-SAR-01', 'Sarajevo Main Warehouse', 'Glavno skladište Sarajevo', 'Zmaja od Bosne 88', '71000', 
    @SarajevoCityId, '+387-33-555-100', 'warehouse.sarajevo@pharmaassist.ba',
    5000.00, 1, 1, 1, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Warehouses WHERE Code = 'WH-SAR-02')
INSERT INTO Warehouses (Code, Name, NameLocal, Address, PostalCode, CityId, ContactPhone, ContactEmail,
    CapacityCubicMeters, HasColdStorage, HasControlledSubstanceArea, IsDefault, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('WH-SAR-02', 'Sarajevo Cold Storage', 'Hladno skladište Sarajevo', 'Zmaja od Bosne 90', '71000', 
    @SarajevoCityId, '+387-33-555-101', 'cold.sarajevo@pharmaassist.ba',
    1000.00, 1, 0, 0, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Warehouses WHERE Code = 'WH-TUZ-01')
INSERT INTO Warehouses (Code, Name, NameLocal, Address, PostalCode, CityId, ContactPhone, ContactEmail,
    CapacityCubicMeters, HasColdStorage, HasControlledSubstanceArea, IsDefault, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('WH-TUZ-01', 'Tuzla Distribution Center', 'Distributivni centar Tuzla', 'Industrijska zona 5', '75000', 
    @TuzlaCityId, '+387-35-555-200', 'warehouse.tuzla@pharmaassist.ba',
    3000.00, 1, 1, 0, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Warehouses WHERE Code = 'WH-BL-01')
INSERT INTO Warehouses (Code, Name, NameLocal, Address, PostalCode, CityId, ContactPhone, ContactEmail,
    CapacityCubicMeters, HasColdStorage, HasControlledSubstanceArea, IsDefault, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('WH-BL-01', 'Banja Luka Warehouse', 'Skladište Banja Luka', 'Industrijska zona 10', '78000', 
    @BanjaLukaCityId, '+387-51-555-300', 'warehouse.bl@pharmaassist.ba',
    2500.00, 1, 0, 0, 1, 0, @Now, 'Seed');

PRINT 'Warehouses seeded successfully.';

-- =============================================
-- 2. INVENTORY STOCK
-- =============================================
PRINT 'Seeding Inventory Stock...';

DECLARE @MainWarehouseId INT = (SELECT Id FROM Warehouses WHERE Code = 'WH-SAR-01');
DECLARE @ColdWarehouseId INT = (SELECT Id FROM Warehouses WHERE Code = 'WH-SAR-02');
DECLARE @TuzlaWarehouseId INT = (SELECT Id FROM Warehouses WHERE Code = 'WH-TUZ-01');

-- Get all product IDs for inventory
DECLARE @ProductIds TABLE (Id INT, SKU NVARCHAR(50));
INSERT INTO @ProductIds SELECT Id, SKU FROM Products WHERE IsDeleted = 0;

-- Insert inventory for main warehouse (all products)
INSERT INTO InventoryStocks (ProductId, ProductBatchId, WarehouseId, QuantityOnHand, QuantityReserved, 
    ReorderLevel, ReorderQuantity, MaxStockLevel, LastMovementDate, LastStockTakeDate, IsDeleted, CreatedAt, CreatedBy)
SELECT p.Id, NULL, @MainWarehouseId, 
    CASE 
        WHEN p.SKU LIKE 'RX-%' THEN 200 + (ABS(CHECKSUM(NEWID())) % 300)
        WHEN p.SKU LIKE 'OTC-%' THEN 500 + (ABS(CHECKSUM(NEWID())) % 500)
        WHEN p.SKU LIKE 'SUP-%' THEN 300 + (ABS(CHECKSUM(NEWID())) % 200)
        ELSE 100 + (ABS(CHECKSUM(NEWID())) % 100)
    END,
    ABS(CHECKSUM(NEWID())) % 50,
    50, 100, 1000, 
    DATEADD(DAY, -(ABS(CHECKSUM(NEWID())) % 30), @Now),
    DATEADD(DAY, -(ABS(CHECKSUM(NEWID())) % 60), @Now),
    0, @Now, 'Seed'
FROM @ProductIds p
WHERE NOT EXISTS (SELECT 1 FROM InventoryStocks WHERE ProductId = p.Id AND WarehouseId = @MainWarehouseId);

-- Insert inventory for Tuzla warehouse (subset of products)
INSERT INTO InventoryStocks (ProductId, ProductBatchId, WarehouseId, QuantityOnHand, QuantityReserved, 
    ReorderLevel, ReorderQuantity, MaxStockLevel, LastMovementDate, LastStockTakeDate, IsDeleted, CreatedAt, CreatedBy)
SELECT TOP 15 p.Id, NULL, @TuzlaWarehouseId, 
    100 + (ABS(CHECKSUM(NEWID())) % 200),
    ABS(CHECKSUM(NEWID())) % 20,
    30, 60, 500, 
    DATEADD(DAY, -(ABS(CHECKSUM(NEWID())) % 30), @Now),
    DATEADD(DAY, -(ABS(CHECKSUM(NEWID())) % 60), @Now),
    0, @Now, 'Seed'
FROM @ProductIds p
WHERE NOT EXISTS (SELECT 1 FROM InventoryStocks WHERE ProductId = p.Id AND WarehouseId = @TuzlaWarehouseId)
ORDER BY NEWID();

PRINT 'Inventory Stock seeded successfully.';

-- =============================================
-- 3. PRODUCT BATCHES
-- =============================================
PRINT 'Seeding Product Batches...';

-- Create batches for prescription medications
INSERT INTO ProductBatches (ProductId, BatchNumber, ManufactureDate, ExpiryDate, InitialQuantity, RemainingQuantity, 
    CostPrice, IsActive, IsDeleted, CreatedAt, CreatedBy)
SELECT TOP 10 p.Id, 
    'BATCH-' + CAST(YEAR(@Now) AS NVARCHAR) + '-' + RIGHT('0000' + CAST(p.Id AS NVARCHAR), 4) + '-A',
    DATEADD(MONTH, -6, @Now),
    DATEADD(MONTH, 24, @Now),
    500, 450,
    pr.CostPrice,
    1, 0, @Now, 'Seed'
FROM @ProductIds p
INNER JOIN Products pr ON p.Id = pr.Id
WHERE pr.RequiresPrescription = 1
AND NOT EXISTS (SELECT 1 FROM ProductBatches WHERE ProductId = p.Id);

-- Create second batch for popular OTC products
INSERT INTO ProductBatches (ProductId, BatchNumber, ManufactureDate, ExpiryDate, InitialQuantity, RemainingQuantity, 
    CostPrice, IsActive, IsDeleted, CreatedAt, CreatedBy)
SELECT TOP 8 p.Id, 
    'BATCH-' + CAST(YEAR(@Now) AS NVARCHAR) + '-' + RIGHT('0000' + CAST(p.Id AS NVARCHAR), 4) + '-B',
    DATEADD(MONTH, -3, @Now),
    DATEADD(MONTH, 18, @Now),
    1000, 800,
    pr.CostPrice,
    1, 0, @Now, 'Seed'
FROM @ProductIds p
INNER JOIN Products pr ON p.Id = pr.Id
WHERE pr.RequiresPrescription = 0 AND pr.IsFeatured = 1
AND NOT EXISTS (SELECT 1 FROM ProductBatches WHERE ProductId = p.Id);

PRINT 'Product Batches seeded successfully.';
PRINT 'Part 6 completed!';
GO
