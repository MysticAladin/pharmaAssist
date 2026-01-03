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
DECLARE @MostarCityId INT = (SELECT TOP 1 Id FROM Cities WHERE Name = 'Mostar');

IF @MostarCityId IS NULL
    SET @MostarCityId = @SarajevoCityId;

-- =============================================
-- 1. WAREHOUSES
-- =============================================
PRINT 'Seeding Warehouses...';

IF NOT EXISTS (SELECT 1 FROM Warehouses WHERE Code = 'CENTRAL')
INSERT INTO Warehouses (Code, Name, NameLocal, Address, PostalCode, CityId, ContactPhone, ContactEmail,
    CapacityCubicMeters, HasColdStorage, HasControlledSubstanceArea, IsDefault, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('CENTRAL', 'Central Warehouse', 'Centralno skladište', 'Zmaja od Bosne 88', '71000',
    @SarajevoCityId, '+387-33-555-100', 'warehouse.central@pharmaassist.ba',
    5000.00, 1, 1, 1, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Warehouses WHERE Code = 'MANUFACTURING')
INSERT INTO Warehouses (Code, Name, NameLocal, Address, PostalCode, CityId, ContactPhone, ContactEmail,
    CapacityCubicMeters, HasColdStorage, HasControlledSubstanceArea, IsDefault, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('MANUFACTURING', 'Manufacturing Warehouse', 'Proizvodno skladište', 'Industrijska zona 1', '71000',
    @SarajevoCityId, '+387-33-555-110', 'warehouse.manufacturing@pharmaassist.ba',
    2000.00, 0, 1, 0, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Warehouses WHERE Code = 'HERCEGOVINALIJEK')
INSERT INTO Warehouses (Code, Name, NameLocal, Address, PostalCode, CityId, ContactPhone, ContactEmail,
    CapacityCubicMeters, HasColdStorage, HasControlledSubstanceArea, IsDefault, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('HERCEGOVINALIJEK', 'Hercegovinalijek Warehouse', 'Skladište Hercegovinalijek', 'Bišće Polje bb', '88000',
    @MostarCityId, '+387-36-555-210', 'warehouse.hercegovinalijek@pharmaassist.ba',
    1500.00, 0, 0, 0, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Warehouses WHERE Code = 'TUZLAFARM')
INSERT INTO Warehouses (Code, Name, NameLocal, Address, PostalCode, CityId, ContactPhone, ContactEmail,
    CapacityCubicMeters, HasColdStorage, HasControlledSubstanceArea, IsDefault, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('TUZLAFARM', 'Tuzlafarm Warehouse', 'Skladište Tuzlafarm', 'Industrijska zona 5', '75000',
    @TuzlaCityId, '+387-35-555-200', 'warehouse.tuzlafarm@pharmaassist.ba',
    1500.00, 0, 0, 0, 1, 0, @Now, 'Seed');

-- Set new classification flags if the columns exist (migration applied)
IF COL_LENGTH('Warehouses', 'CanFulfillOrders') IS NOT NULL
BEGIN
    UPDATE Warehouses SET CanFulfillOrders = 1 WHERE Code = 'CENTRAL';
    UPDATE Warehouses SET CanFulfillOrders = 0 WHERE Code IN ('MANUFACTURING', 'HERCEGOVINALIJEK', 'TUZLAFARM');
END

IF COL_LENGTH('Warehouses', 'IsManufacturing') IS NOT NULL
BEGIN
    UPDATE Warehouses SET IsManufacturing = 1 WHERE Code = 'MANUFACTURING';
    UPDATE Warehouses SET IsManufacturing = 0 WHERE Code IN ('CENTRAL', 'HERCEGOVINALIJEK', 'TUZLAFARM');
END

PRINT 'Warehouses seeded successfully.';

-- =============================================
-- 2. INVENTORY STOCK
-- =============================================
PRINT 'Seeding Inventory Stock...';

DECLARE @MainWarehouseId INT = (SELECT Id FROM Warehouses WHERE Code = 'CENTRAL');
DECLARE @HercegovinalijekWarehouseId INT = (SELECT Id FROM Warehouses WHERE Code = 'HERCEGOVINALIJEK');
DECLARE @TuzlafarmWarehouseId INT = (SELECT Id FROM Warehouses WHERE Code = 'TUZLAFARM');

-- Get all product IDs for inventory
DECLARE @ProductIds TABLE (Id INT, SKU NVARCHAR(50));
INSERT INTO @ProductIds SELECT Id, SKU FROM Products WHERE IsDeleted = 0;

-- Insert inventory for Central warehouse (all products)
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

-- Insert inventory for partner warehouses (subset of products)
INSERT INTO InventoryStocks (ProductId, ProductBatchId, WarehouseId, QuantityOnHand, QuantityReserved, 
    ReorderLevel, ReorderQuantity, MaxStockLevel, LastMovementDate, LastStockTakeDate, IsDeleted, CreatedAt, CreatedBy)
SELECT TOP 15 p.Id, NULL, @TuzlafarmWarehouseId, 
    100 + (ABS(CHECKSUM(NEWID())) % 200),
    ABS(CHECKSUM(NEWID())) % 20,
    30, 60, 500, 
    DATEADD(DAY, -(ABS(CHECKSUM(NEWID())) % 30), @Now),
    DATEADD(DAY, -(ABS(CHECKSUM(NEWID())) % 60), @Now),
    0, @Now, 'Seed'
FROM @ProductIds p
WHERE NOT EXISTS (SELECT 1 FROM InventoryStocks WHERE ProductId = p.Id AND WarehouseId = @TuzlafarmWarehouseId)
ORDER BY NEWID();

INSERT INTO InventoryStocks (ProductId, ProductBatchId, WarehouseId, QuantityOnHand, QuantityReserved, 
    ReorderLevel, ReorderQuantity, MaxStockLevel, LastMovementDate, LastStockTakeDate, IsDeleted, CreatedAt, CreatedBy)
SELECT TOP 15 p.Id, NULL, @HercegovinalijekWarehouseId, 
    50 + (ABS(CHECKSUM(NEWID())) % 150),
    ABS(CHECKSUM(NEWID())) % 10,
    20, 40, 300, 
    DATEADD(DAY, -(ABS(CHECKSUM(NEWID())) % 30), @Now),
    DATEADD(DAY, -(ABS(CHECKSUM(NEWID())) % 60), @Now),
    0, @Now, 'Seed'
FROM @ProductIds p
WHERE NOT EXISTS (SELECT 1 FROM InventoryStocks WHERE ProductId = p.Id AND WarehouseId = @HercegovinalijekWarehouseId)
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
