-- =============================================
-- PharmaAssist Database Seed Script
-- Part 7: Orders (Historical data for reports)
-- =============================================

SET NOCOUNT ON;
GO

PRINT 'Starting Part 7: Orders seed...';

DECLARE @Now DATETIME2 = GETUTCDATE();

-- =============================================
-- CLEANUP: Delete existing orders
-- (Already cleaned in Part 5, but ensure clean state)
-- =============================================
PRINT 'Cleaning up existing orders...';

DELETE FROM OrderItems;
DELETE FROM Orders;

PRINT 'Orders cleanup completed.';

-- Get customer IDs
DECLARE @HQ1Id INT = (SELECT Id FROM Customers WHERE CustomerCode = 'CUST-HQ-001');
DECLARE @HQ2Id INT = (SELECT Id FROM Customers WHERE CustomerCode = 'CUST-HQ-002');
DECLARE @HQ3Id INT = (SELECT Id FROM Customers WHERE CustomerCode = 'CUST-HQ-003');
DECLARE @HQ4Id INT = (SELECT Id FROM Customers WHERE CustomerCode = 'CUST-HQ-004');
DECLARE @HQ5Id INT = (SELECT Id FROM Customers WHERE CustomerCode = 'CUST-HQ-005');
DECLARE @BR1Id INT = (SELECT Id FROM Customers WHERE CustomerCode = 'CUST-BR-001');
DECLARE @BR2Id INT = (SELECT Id FROM Customers WHERE CustomerCode = 'CUST-BR-002');
DECLARE @SM1Id INT = (SELECT Id FROM Customers WHERE CustomerCode = 'CUST-SM-001');
DECLARE @RS1Id INT = (SELECT Id FROM Customers WHERE CustomerCode = 'CUST-RS-001');

-- Get address IDs
DECLARE @HQ1AddrId INT = (SELECT TOP 1 Id FROM CustomerAddresses WHERE CustomerId = @HQ1Id AND AddressType = 1);
DECLARE @HQ2AddrId INT = (SELECT TOP 1 Id FROM CustomerAddresses WHERE CustomerId = @HQ2Id AND AddressType = 1);
DECLARE @HQ3AddrId INT = (SELECT TOP 1 Id FROM CustomerAddresses WHERE CustomerId = @HQ3Id AND AddressType = 1);

-- =============================================
-- 1. ORDERS - Last 6 months of data
-- =============================================
PRINT 'Seeding Orders...';

DECLARE @OrderCounter INT = 1;
DECLARE @MonthOffset INT = 0;
DECLARE @OrderDate DATETIME2;
DECLARE @CustomerId INT;
DECLARE @OrderNumber NVARCHAR(50);

-- Create table for batch insertion
DECLARE @OrdersToInsert TABLE (
    OrderNumber NVARCHAR(50),
    CustomerId INT,
    OrderDate DATETIME2,
    RequiredDate DATETIME2,
    ShippedDate DATETIME2,
    DeliveredDate DATETIME2,
    Status INT,
    PaymentStatus INT,
    PaymentMethod INT,
    SubTotal DECIMAL(18,2),
    TaxAmount DECIMAL(18,2),
    DiscountAmount DECIMAL(18,2),
    ShippingAmount DECIMAL(18,2),
    TotalAmount DECIMAL(18,2),
    BillingAddressId INT,
    ShippingAddressId INT
);

-- Generate orders for last 6 months
WHILE @MonthOffset >= -5
BEGIN
    DECLARE @BaseDate DATETIME2 = DATEADD(MONTH, @MonthOffset, @Now);
    DECLARE @DayInMonth INT = 1;
    
    -- Generate 10-15 orders per month per major customer
    WHILE @DayInMonth <= 28
    BEGIN
        -- Orders for HQ1 (Apoteka Sarajevo)
        IF @DayInMonth % 2 = 0 AND @HQ1Id IS NOT NULL
        BEGIN
            SET @OrderNumber = 'ORD-' + FORMAT(@BaseDate, 'yyyyMM') + '-' + RIGHT('0000' + CAST(@OrderCounter AS NVARCHAR), 4);
            SET @OrderDate = DATEADD(DAY, @DayInMonth - 1, DATEADD(DAY, 1 - DAY(@BaseDate), @BaseDate));
            
            IF NOT EXISTS (SELECT 1 FROM Orders WHERE OrderNumber = @OrderNumber)
            INSERT INTO @OrdersToInsert VALUES (
                @OrderNumber, @HQ1Id, @OrderDate,
                DATEADD(DAY, 3, @OrderDate),
                CASE WHEN @MonthOffset < 0 OR @DayInMonth < 20 THEN DATEADD(DAY, 2, @OrderDate) ELSE NULL END,
                CASE WHEN @MonthOffset < 0 OR @DayInMonth < 15 THEN DATEADD(DAY, 3, @OrderDate) ELSE NULL END,
                CASE WHEN @MonthOffset < 0 THEN 5 WHEN @DayInMonth < 15 THEN 4 WHEN @DayInMonth < 20 THEN 3 ELSE 2 END,
                CASE WHEN @MonthOffset < -1 THEN 2 WHEN @MonthOffset = -1 THEN 1 ELSE 0 END,
                1,
                850.00 + (ABS(CHECKSUM(NEWID())) % 500),
                144.50 + (ABS(CHECKSUM(NEWID())) % 85),
                ABS(CHECKSUM(NEWID())) % 50,
                0.00,
                0.00, -- Will calculate total later
                @HQ1AddrId, @HQ1AddrId
            );
            SET @OrderCounter = @OrderCounter + 1;
        END
        
        -- Orders for HQ2 (Tuzla Farmacija)
        IF @DayInMonth % 3 = 0 AND @HQ2Id IS NOT NULL
        BEGIN
            SET @OrderNumber = 'ORD-' + FORMAT(@BaseDate, 'yyyyMM') + '-' + RIGHT('0000' + CAST(@OrderCounter AS NVARCHAR), 4);
            SET @OrderDate = DATEADD(DAY, @DayInMonth - 1, DATEADD(DAY, 1 - DAY(@BaseDate), @BaseDate));
            
            IF NOT EXISTS (SELECT 1 FROM Orders WHERE OrderNumber = @OrderNumber)
            INSERT INTO @OrdersToInsert VALUES (
                @OrderNumber, @HQ2Id, @OrderDate,
                DATEADD(DAY, 4, @OrderDate),
                CASE WHEN @MonthOffset < 0 OR @DayInMonth < 18 THEN DATEADD(DAY, 3, @OrderDate) ELSE NULL END,
                CASE WHEN @MonthOffset < 0 OR @DayInMonth < 14 THEN DATEADD(DAY, 4, @OrderDate) ELSE NULL END,
                CASE WHEN @MonthOffset < 0 THEN 5 WHEN @DayInMonth < 14 THEN 4 WHEN @DayInMonth < 18 THEN 3 ELSE 2 END,
                CASE WHEN @MonthOffset < -1 THEN 2 ELSE 1 END,
                2,
                650.00 + (ABS(CHECKSUM(NEWID())) % 400),
                110.50 + (ABS(CHECKSUM(NEWID())) % 68),
                ABS(CHECKSUM(NEWID())) % 30,
                15.00,
                0.00,
                @HQ2AddrId, @HQ2AddrId
            );
            SET @OrderCounter = @OrderCounter + 1;
        END
        
        -- Orders for HQ3 (KCUS - Hospital, larger orders)
        IF @DayInMonth % 5 = 0 AND @HQ3Id IS NOT NULL
        BEGIN
            SET @OrderNumber = 'ORD-' + FORMAT(@BaseDate, 'yyyyMM') + '-' + RIGHT('0000' + CAST(@OrderCounter AS NVARCHAR), 4);
            SET @OrderDate = DATEADD(DAY, @DayInMonth - 1, DATEADD(DAY, 1 - DAY(@BaseDate), @BaseDate));
            
            IF NOT EXISTS (SELECT 1 FROM Orders WHERE OrderNumber = @OrderNumber)
            INSERT INTO @OrdersToInsert VALUES (
                @OrderNumber, @HQ3Id, @OrderDate,
                DATEADD(DAY, 5, @OrderDate),
                CASE WHEN @MonthOffset < 0 THEN DATEADD(DAY, 4, @OrderDate) ELSE NULL END,
                CASE WHEN @MonthOffset < 0 THEN DATEADD(DAY, 5, @OrderDate) ELSE NULL END,
                CASE WHEN @MonthOffset < 0 THEN 5 ELSE 2 END,
                CASE WHEN @MonthOffset < -2 THEN 2 ELSE 0 END,
                3,
                2500.00 + (ABS(CHECKSUM(NEWID())) % 1500),
                425.00 + (ABS(CHECKSUM(NEWID())) % 255),
                ABS(CHECKSUM(NEWID())) % 100,
                0.00,
                0.00,
                @HQ3AddrId, @HQ3AddrId
            );
            SET @OrderCounter = @OrderCounter + 1;
        END
        
        -- Orders for smaller customers
        IF @DayInMonth % 7 = 0 AND @SM1Id IS NOT NULL
        BEGIN
            SET @OrderNumber = 'ORD-' + FORMAT(@BaseDate, 'yyyyMM') + '-' + RIGHT('0000' + CAST(@OrderCounter AS NVARCHAR), 4);
            SET @OrderDate = DATEADD(DAY, @DayInMonth - 1, DATEADD(DAY, 1 - DAY(@BaseDate), @BaseDate));
            
            DECLARE @SM1AddrId INT = (SELECT TOP 1 Id FROM CustomerAddresses WHERE CustomerId = @SM1Id AND AddressType = 1);
            
            IF NOT EXISTS (SELECT 1 FROM Orders WHERE OrderNumber = @OrderNumber)
            INSERT INTO @OrdersToInsert VALUES (
                @OrderNumber, @SM1Id, @OrderDate,
                DATEADD(DAY, 3, @OrderDate),
                CASE WHEN @MonthOffset < 0 THEN DATEADD(DAY, 2, @OrderDate) ELSE NULL END,
                CASE WHEN @MonthOffset < 0 THEN DATEADD(DAY, 3, @OrderDate) ELSE NULL END,
                CASE WHEN @MonthOffset < 0 THEN 5 ELSE 1 END,
                CASE WHEN @MonthOffset < -1 THEN 2 ELSE 0 END,
                1,
                250.00 + (ABS(CHECKSUM(NEWID())) % 150),
                42.50 + (ABS(CHECKSUM(NEWID())) % 25),
                0.00,
                10.00,
                0.00,
                @SM1AddrId, @SM1AddrId
            );
            SET @OrderCounter = @OrderCounter + 1;
        END
        
        SET @DayInMonth = @DayInMonth + 1;
    END
    
    SET @MonthOffset = @MonthOffset - 1;
END

-- Calculate totals and insert orders
UPDATE @OrdersToInsert SET TotalAmount = SubTotal + TaxAmount - DiscountAmount + ShippingAmount;

INSERT INTO Orders (OrderNumber, CustomerId, OrderDate, RequiredDate, ShippedDate, DeliveredDate, 
    Status, PaymentStatus, PaymentMethod, SubTotal, TaxAmount, DiscountAmount, ShippingAmount, TotalAmount,
    BillingAddressId, ShippingAddressId, Notes, InternalNotes, CancellationReason, PaidDate, IsDeleted, CreatedAt, CreatedBy)
SELECT OrderNumber, CustomerId, OrderDate, RequiredDate, ShippedDate, DeliveredDate,
    Status, PaymentStatus, PaymentMethod, SubTotal, TaxAmount, DiscountAmount, ShippingAmount, TotalAmount,
    BillingAddressId, ShippingAddressId, 
    'Test order for reporting', 'Seeded data', NULL,
    CASE WHEN PaymentStatus = 2 THEN DATEADD(DAY, 5, OrderDate) ELSE NULL END,
    0, @Now, 'Seed'
FROM @OrdersToInsert o
WHERE NOT EXISTS (SELECT 1 FROM Orders WHERE OrderNumber = o.OrderNumber);

PRINT 'Orders seeded successfully.';
PRINT 'Part 7 completed!';
GO
