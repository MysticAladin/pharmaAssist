-- =============================================
-- PharmaAssist Database Seed Script
-- Part 8: Order Items
-- =============================================

SET NOCOUNT ON;
GO

PRINT 'Starting Part 8: Order Items seed...';

DECLARE @Now DATETIME2 = GETUTCDATE();

-- =============================================
-- 1. ORDER ITEMS - Populate each order with items
-- =============================================
PRINT 'Seeding Order Items...';

-- Get products for order items
DECLARE @Products TABLE (Id INT, SKU NVARCHAR(50), UnitPrice DECIMAL(18,4), TaxRate DECIMAL(5,2), RequiresPrescription BIT);
INSERT INTO @Products 
SELECT Id, SKU, UnitPrice, TaxRate, RequiresPrescription 
FROM Products WHERE IsDeleted = 0 AND IsActive = 1;

-- Get orders that need items
DECLARE @OrdersNeedingItems TABLE (Id INT, OrderNumber NVARCHAR(50), CustomerId INT, TotalAmount DECIMAL(18,2));
INSERT INTO @OrdersNeedingItems
SELECT o.Id, o.OrderNumber, o.CustomerId, o.TotalAmount
FROM Orders o
WHERE NOT EXISTS (SELECT 1 FROM OrderItems WHERE OrderId = o.Id);

-- Cursor to add items to each order
DECLARE @OrderId INT, @OrdNum NVARCHAR(50), @CustId INT, @OrdTotal DECIMAL(18,2);
DECLARE @ItemCount INT, @ProductId INT, @Quantity INT, @UnitPrice DECIMAL(18,4), @TaxRate DECIMAL(5,2), @DiscountPct DECIMAL(5,2);
DECLARE @RunningTotal DECIMAL(18,2);

DECLARE order_cursor CURSOR FOR 
SELECT Id, OrderNumber, CustomerId, TotalAmount FROM @OrdersNeedingItems;

OPEN order_cursor;
FETCH NEXT FROM order_cursor INTO @OrderId, @OrdNum, @CustId, @OrdTotal;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @ItemCount = 3 + (ABS(CHECKSUM(NEWID())) % 5); -- 3-7 items per order
    SET @RunningTotal = 0;
    
    WHILE @ItemCount > 0
    BEGIN
        -- Pick a random product
        SELECT TOP 1 @ProductId = Id, @UnitPrice = UnitPrice, @TaxRate = TaxRate
        FROM @Products 
        ORDER BY NEWID();
        
        SET @Quantity = 5 + (ABS(CHECKSUM(NEWID())) % 20); -- 5-24 units
        SET @DiscountPct = CASE WHEN ABS(CHECKSUM(NEWID())) % 4 = 0 THEN 5.00 ELSE 0.00 END; -- 25% chance of 5% discount
        
        -- Check if this product is already in this order
        IF NOT EXISTS (SELECT 1 FROM OrderItems WHERE OrderId = @OrderId AND ProductId = @ProductId)
        BEGIN
            INSERT INTO OrderItems (OrderId, ProductId, ProductBatchId, Quantity, UnitPrice, DiscountPercent, 
                TaxRate, LineTotal, PrescriptionRequired, PrescriptionId, IsDeleted, CreatedAt, CreatedBy)
            VALUES (@OrderId, @ProductId, NULL, @Quantity, @UnitPrice, @DiscountPct, 
                @TaxRate, 
                ROUND(@Quantity * @UnitPrice * (1 - @DiscountPct/100), 2),
                (SELECT RequiresPrescription FROM Products WHERE Id = @ProductId),
                NULL, 0, @Now, 'Seed');
            
            SET @RunningTotal = @RunningTotal + ROUND(@Quantity * @UnitPrice * (1 - @DiscountPct/100), 2);
        END
        
        SET @ItemCount = @ItemCount - 1;
    END
    
    -- Update order subtotal and total based on actual items
    UPDATE Orders SET 
        SubTotal = @RunningTotal,
        TaxAmount = ROUND(@RunningTotal * 0.17, 2),
        TotalAmount = ROUND(@RunningTotal * 1.17, 2) - DiscountAmount + ShippingAmount
    WHERE Id = @OrderId;
    
    FETCH NEXT FROM order_cursor INTO @OrderId, @OrdNum, @CustId, @OrdTotal;
END

CLOSE order_cursor;
DEALLOCATE order_cursor;

PRINT 'Order Items seeded successfully.';

-- =============================================
-- 2. UPDATE ORDER TOTALS
-- =============================================
PRINT 'Recalculating Order Totals...';

-- Recalculate all order totals based on actual items
UPDATE o SET 
    SubTotal = ISNULL(items.SubTotal, 0),
    TaxAmount = ISNULL(items.TaxTotal, 0),
    TotalAmount = ISNULL(items.SubTotal, 0) + ISNULL(items.TaxTotal, 0) - o.DiscountAmount + o.ShippingAmount
FROM Orders o
OUTER APPLY (
    SELECT 
        SUM(LineTotal) AS SubTotal,
        SUM(LineTotal * TaxRate / 100) AS TaxTotal
    FROM OrderItems oi 
    WHERE oi.OrderId = o.Id AND oi.IsDeleted = 0
) items
WHERE o.IsDeleted = 0;

PRINT 'Order Totals recalculated.';
PRINT 'Part 8 completed!';
GO
