-- =============================================
-- PharmaAssist Database Seed Script
-- Part 1: Roles and Users
-- Password for all users: test123
-- =============================================

SET NOCOUNT ON;
GO

PRINT 'Starting Part 1: Roles and Users seed...';

DECLARE @Now DATETIME2 = GETUTCDATE();

-- Password hash for "test123" (from existing user)
DECLARE @PasswordHash NVARCHAR(MAX) = 'AQAAAAIAAYagAAAAEEpnO5JF9aG7ofgKWRQbhEpJlI3bJDNIAJH6bHQvREkGDECZJ9CdtZa0lt36qcDLKA==';

-- =============================================
-- CLEANUP: Delete all data EXCEPT System Administrator
-- =============================================
PRINT 'Cleaning up existing data (preserving System Administrator)...';

-- Store System Admin user ID before cleanup
DECLARE @SystemAdminUserId NVARCHAR(450) = (
    SELECT TOP 1 Id FROM Users WHERE NormalizedEmail = 'ADMIN@PHARMAASSIST.BA'
);

-- Delete user roles (except System Admin)
DELETE FROM AspNetUserRoles WHERE UserId != ISNULL(@SystemAdminUserId, '');

-- Delete users (except System Admin)
DELETE FROM Users WHERE Id != ISNULL(@SystemAdminUserId, '');

PRINT 'Cleanup completed. System Administrator preserved.';

-- =============================================
-- 1. ROLES (keep existing roles, just ensure they exist)
-- =============================================
PRINT 'Verifying Roles...';

-- Roles already exist from migrations, no need to recreate
-- Just verify they exist
IF EXISTS (SELECT 1 FROM Roles WHERE NormalizedName = 'ADMIN')
    PRINT 'Admin role exists.';

IF EXISTS (SELECT 1 FROM Roles WHERE NormalizedName = 'MANAGER')
    PRINT 'Manager role exists.';

IF EXISTS (SELECT 1 FROM Roles WHERE NormalizedName = 'PHARMACIST')
    PRINT 'Pharmacist role exists.';

IF EXISTS (SELECT 1 FROM Roles WHERE NormalizedName = 'SALESREP')
    PRINT 'SalesRep role exists.';

IF EXISTS (SELECT 1 FROM Roles WHERE NormalizedName = 'WAREHOUSE')
    PRINT 'Warehouse role exists.';

IF EXISTS (SELECT 1 FROM Roles WHERE NormalizedName = 'CUSTOMER')
    PRINT 'Customer role exists.';

PRINT 'Roles verified.';

-- =============================================
-- 2. USERS
-- Password: test123
-- =============================================
PRINT 'Seeding Users...';

-- Manager User
DECLARE @ManagerId NVARCHAR(450) = NEWID();
IF NOT EXISTS (SELECT 1 FROM Users WHERE NormalizedEmail = 'MANAGER.USER@PHARMAASSIST.COM')
BEGIN
    INSERT INTO Users (Id, FirstName, LastName, MiddleName, DateOfBirth, IsActive, CreatedAt, UpdatedAt,
        CreatedBy, UpdatedBy, UserName, NormalizedUserName, Email, NormalizedEmail, 
        EmailConfirmed, PasswordHash, SecurityStamp, ConcurrencyStamp, PhoneNumber, PhoneNumberConfirmed,
        TwoFactorEnabled, LockoutEnd, LockoutEnabled, AccessFailedCount)
    VALUES (@ManagerId, 'Manager', 'User', NULL, NULL, 1, @Now, NULL,
        NULL, NULL, 'manager.user@pharmaassist.com', 'MANAGER.USER@PHARMAASSIST.COM',
        'manager.user@pharmaassist.com', 'MANAGER.USER@PHARMAASSIST.COM',
        1, @PasswordHash, NEWID(), NEWID(), '+387-61-111-0003', 0,
        0, NULL, 1, 0);
    
    INSERT INTO AspNetUserRoles (UserId, RoleId)
    SELECT @ManagerId, Id FROM Roles WHERE NormalizedName = 'MANAGER';
    
    PRINT 'Created manager.user@pharmaassist.com';
END

-- Pharmacist User
DECLARE @PharmacistId NVARCHAR(450) = NEWID();
IF NOT EXISTS (SELECT 1 FROM Users WHERE NormalizedEmail = 'PHARMACIST.USER@PHARMAASSIST.COM')
BEGIN
    INSERT INTO Users (Id, FirstName, LastName, MiddleName, DateOfBirth, IsActive, CreatedAt, UpdatedAt,
        CreatedBy, UpdatedBy, UserName, NormalizedUserName, Email, NormalizedEmail, 
        EmailConfirmed, PasswordHash, SecurityStamp, ConcurrencyStamp, PhoneNumber, PhoneNumberConfirmed,
        TwoFactorEnabled, LockoutEnd, LockoutEnabled, AccessFailedCount)
    VALUES (@PharmacistId, 'Pharmacist', 'User', NULL, NULL, 1, @Now, NULL,
        NULL, NULL, 'pharmacist.user@pharmaassist.com', 'PHARMACIST.USER@PHARMAASSIST.COM',
        'pharmacist.user@pharmaassist.com', 'PHARMACIST.USER@PHARMAASSIST.COM',
        1, @PasswordHash, NEWID(), NEWID(), '+387-61-111-0004', 0,
        0, NULL, 1, 0);
    
    INSERT INTO AspNetUserRoles (UserId, RoleId)
    SELECT @PharmacistId, Id FROM Roles WHERE NormalizedName = 'PHARMACIST';
    
    PRINT 'Created pharmacist.user@pharmaassist.com';
END

-- SalesRep User
DECLARE @SalesRepId NVARCHAR(450) = NEWID();
IF NOT EXISTS (SELECT 1 FROM Users WHERE NormalizedEmail = 'SALESREP.USER@PHARMAASSIST.COM')
BEGIN
    INSERT INTO Users (Id, FirstName, LastName, MiddleName, DateOfBirth, IsActive, CreatedAt, UpdatedAt,
        CreatedBy, UpdatedBy, UserName, NormalizedUserName, Email, NormalizedEmail, 
        EmailConfirmed, PasswordHash, SecurityStamp, ConcurrencyStamp, PhoneNumber, PhoneNumberConfirmed,
        TwoFactorEnabled, LockoutEnd, LockoutEnabled, AccessFailedCount)
    VALUES (@SalesRepId, 'SalesRep', 'User', NULL, NULL, 1, @Now, NULL,
        NULL, NULL, 'salesrep.user@pharmaassist.com', 'SALESREP.USER@PHARMAASSIST.COM',
        'salesrep.user@pharmaassist.com', 'SALESREP.USER@PHARMAASSIST.COM',
        1, @PasswordHash, NEWID(), NEWID(), '+387-61-111-0005', 0,
        0, NULL, 1, 0);
    
    INSERT INTO AspNetUserRoles (UserId, RoleId)
    SELECT @SalesRepId, Id FROM Roles WHERE NormalizedName = 'SALESREP';
    
    PRINT 'Created salesrep.user@pharmaassist.com';
END

-- Warehouse User
DECLARE @WarehouseId NVARCHAR(450) = NEWID();
IF NOT EXISTS (SELECT 1 FROM Users WHERE NormalizedEmail = 'WAREHOUSE.USER@PHARMAASSIST.COM')
BEGIN
    INSERT INTO Users (Id, FirstName, LastName, MiddleName, DateOfBirth, IsActive, CreatedAt, UpdatedAt,
        CreatedBy, UpdatedBy, UserName, NormalizedUserName, Email, NormalizedEmail, 
        EmailConfirmed, PasswordHash, SecurityStamp, ConcurrencyStamp, PhoneNumber, PhoneNumberConfirmed,
        TwoFactorEnabled, LockoutEnd, LockoutEnabled, AccessFailedCount)
    VALUES (@WarehouseId, 'Warehouse', 'User', NULL, NULL, 1, @Now, NULL,
        NULL, NULL, 'warehouse.user@pharmaassist.com', 'WAREHOUSE.USER@PHARMAASSIST.COM',
        'warehouse.user@pharmaassist.com', 'WAREHOUSE.USER@PHARMAASSIST.COM',
        1, @PasswordHash, NEWID(), NEWID(), '+387-61-111-0006', 0,
        0, NULL, 1, 0);
    
    INSERT INTO AspNetUserRoles (UserId, RoleId)
    SELECT @WarehouseId, Id FROM Roles WHERE NormalizedName = 'WAREHOUSE';
    
    PRINT 'Created warehouse.user@pharmaassist.com';
END

-- Customer User
DECLARE @CustomerUserId NVARCHAR(450) = NEWID();
IF NOT EXISTS (SELECT 1 FROM Users WHERE NormalizedEmail = 'CUSTOMER.USER@PHARMAASSIST.COM')
BEGIN
    INSERT INTO Users (Id, FirstName, LastName, MiddleName, DateOfBirth, IsActive, CreatedAt, UpdatedAt,
        CreatedBy, UpdatedBy, UserName, NormalizedUserName, Email, NormalizedEmail, 
        EmailConfirmed, PasswordHash, SecurityStamp, ConcurrencyStamp, PhoneNumber, PhoneNumberConfirmed,
        TwoFactorEnabled, LockoutEnd, LockoutEnabled, AccessFailedCount)
    VALUES (@CustomerUserId, 'Customer', 'User', NULL, NULL, 1, @Now, NULL,
        NULL, NULL, 'customer.user@pharmaassist.com', 'CUSTOMER.USER@PHARMAASSIST.COM',
        'customer.user@pharmaassist.com', 'CUSTOMER.USER@PHARMAASSIST.COM',
        1, @PasswordHash, NEWID(), NEWID(), '+387-61-111-0007', 0,
        0, NULL, 1, 0);
    
    INSERT INTO AspNetUserRoles (UserId, RoleId)
    SELECT @CustomerUserId, Id FROM Roles WHERE NormalizedName = 'CUSTOMER';
    
    PRINT 'Created customer.user@pharmaassist.com';
END

PRINT 'Users seeded successfully.';
PRINT 'Part 1 completed!';
GO
