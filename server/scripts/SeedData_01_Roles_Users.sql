-- =============================================
-- PharmaAssist Database Seed Script
-- Part 1: Roles and Users
-- Password for all users: test123
-- =============================================

SET NOCOUNT ON;
GO

-- Use your database
-- USE PharmaAssist;
-- GO

PRINT 'Starting Part 1: Roles and Users seed...';

-- =============================================
-- PASSWORD HASH INSTRUCTIONS:
-- =============================================
-- 1. First, register ONE user manually via the app with password "test123"
-- 2. Run this query to get the hash:
--    SELECT PasswordHash FROM AspNetUsers WHERE Email = 'your-registered-email@example.com'
-- 3. Copy that hash and replace the @PasswordHash value below
-- =============================================

DECLARE @Now DATETIME2 = GETUTCDATE();

-- =============================================
-- CLEANUP: Delete all data EXCEPT SuperAdmin
-- =============================================
PRINT 'Cleaning up existing data (preserving SuperAdmin)...';

-- Store SuperAdmin user ID before cleanup
DECLARE @SuperAdminUserId NVARCHAR(450) = (
    SELECT TOP 1 u.Id 
    FROM AspNetUsers u
    INNER JOIN AspNetUserRoles ur ON u.Id = ur.UserId
    INNER JOIN AspNetRoles r ON ur.RoleId = r.Id
    WHERE r.NormalizedName = 'SUPERADMIN'
);

-- Delete user roles (except SuperAdmin)
DELETE FROM AspNetUserRoles WHERE UserId != ISNULL(@SuperAdminUserId, '');

-- Delete users (except SuperAdmin)
DELETE FROM AspNetUsers WHERE Id != ISNULL(@SuperAdminUserId, '');

-- Delete roles (except SuperAdmin role)
DELETE FROM AspNetRoles WHERE NormalizedName != 'SUPERADMIN';

PRINT 'Cleanup completed. SuperAdmin preserved.';

-- =============================================
-- 1. ROLES
-- =============================================
PRINT 'Seeding Roles...';

-- Insert Roles
IF NOT EXISTS (SELECT 1 FROM AspNetRoles WHERE NormalizedName = 'SUPERADMIN')
INSERT INTO AspNetRoles (Id, Name, NormalizedName, Description, CreatedAt, UpdatedAt, ConcurrencyStamp)
VALUES (NEWID(), 'SuperAdmin', 'SUPERADMIN', 'System administrator with full access to all features and clients', @Now, NULL, NEWID());

IF NOT EXISTS (SELECT 1 FROM AspNetRoles WHERE NormalizedName = 'ADMIN')
INSERT INTO AspNetRoles (Id, Name, NormalizedName, Description, CreatedAt, UpdatedAt, ConcurrencyStamp)
VALUES (NEWID(), 'Admin', 'ADMIN', 'Client administrator with access to manage their organization', @Now, NULL, NEWID());

IF NOT EXISTS (SELECT 1 FROM AspNetRoles WHERE NormalizedName = 'MANAGER')
INSERT INTO AspNetRoles (Id, Name, NormalizedName, Description, CreatedAt, UpdatedAt, ConcurrencyStamp)
VALUES (NEWID(), 'Manager', 'MANAGER', 'Manager with oversight of sales and operations', @Now, NULL, NEWID());

IF NOT EXISTS (SELECT 1 FROM AspNetRoles WHERE NormalizedName = 'PHARMACIST')
INSERT INTO AspNetRoles (Id, Name, NormalizedName, Description, CreatedAt, UpdatedAt, ConcurrencyStamp)
VALUES (NEWID(), 'Pharmacist', 'PHARMACIST', 'Licensed pharmacist handling prescriptions and controlled substances', @Now, NULL, NEWID());

IF NOT EXISTS (SELECT 1 FROM AspNetRoles WHERE NormalizedName = 'SALESREP')
INSERT INTO AspNetRoles (Id, Name, NormalizedName, Description, CreatedAt, UpdatedAt, ConcurrencyStamp)
VALUES (NEWID(), 'SalesRep', 'SALESREP', 'Sales representative managing customer relationships', @Now, NULL, NEWID());

IF NOT EXISTS (SELECT 1 FROM AspNetRoles WHERE NormalizedName = 'WAREHOUSE')
INSERT INTO AspNetRoles (Id, Name, NormalizedName, Description, CreatedAt, UpdatedAt, ConcurrencyStamp)
VALUES (NEWID(), 'Warehouse', 'WAREHOUSE', 'Warehouse staff handling inventory and shipping', @Now, NULL, NEWID());

IF NOT EXISTS (SELECT 1 FROM AspNetRoles WHERE NormalizedName = 'CUSTOMER')
INSERT INTO AspNetRoles (Id, Name, NormalizedName, Description, CreatedAt, UpdatedAt, ConcurrencyStamp)
VALUES (NEWID(), 'Customer', 'CUSTOMER', 'Customer portal access for ordering and account management', @Now, NULL, NEWID());

PRINT 'Roles seeded successfully.';

-- =============================================
-- 2. USERS
-- Password: test123
-- =============================================
PRINT 'Seeding Users...';

-- =============================================
-- IMPORTANT: Replace this hash with the actual hash from your registered user!
-- Steps:
-- 1. Register a user with password "test123" in the app
-- 2. Run: SELECT PasswordHash, SecurityStamp FROM AspNetUsers WHERE Email = 'your@email.com'
-- 3. Paste the PasswordHash value below
-- =============================================
DECLARE @PasswordHash NVARCHAR(MAX) = 'REPLACE_WITH_ACTUAL_HASH_FROM_REGISTERED_USER';
-- Example hash format: AQAAAAIAAYagAAAAE...

-- If hash not replaced, show warning
IF @PasswordHash = 'REPLACE_WITH_ACTUAL_HASH_FROM_REGISTERED_USER'
BEGIN
    PRINT '⚠️ WARNING: Password hash not set! Users will not be able to login.';
    PRINT 'Register one user with "test123" and copy the PasswordHash here.';
END

-- SuperAdmin User
DECLARE @SuperAdminId NVARCHAR(450) = NEWID();
IF NOT EXISTS (SELECT 1 FROM AspNetUsers WHERE NormalizedEmail = 'SUPER.ADMIN@PHARMAASSIST.COM')
BEGIN
    INSERT INTO AspNetUsers (Id, FirstName, LastName, Email, NormalizedEmail, UserName, NormalizedUserName, 
        EmailConfirmed, PasswordHash, SecurityStamp, ConcurrencyStamp, PhoneNumber, PhoneNumberConfirmed,
        TwoFactorEnabled, LockoutEnd, LockoutEnabled, AccessFailedCount, IsActive, CreatedAt, ProfileImageUrl)
    VALUES (@SuperAdminId, 'Super', 'Admin', 'super.admin@pharmaassist.com', 'SUPER.ADMIN@PHARMAASSIST.COM',
        'super.admin@pharmaassist.com', 'SUPER.ADMIN@PHARMAASSIST.COM', 1, @PasswordHash, @SecurityStamp, NEWID(),
        '+387-61-111-0001', 0, 0, NULL, 1, 0, 1, @Now, NULL);
    
    -- Assign SuperAdmin role
    INSERT INTO AspNetUserRoles (UserId, RoleId)
    SELECT @SuperAdminId, Id FROM AspNetRoles WHERE NormalizedName = 'SUPERADMIN';
END

-- Admin User
DECLARE @AdminId NVARCHAR(450) = NEWID();
IF NOT EXISTS (SELECT 1 FROM AspNetUsers WHERE NormalizedEmail = 'ADMIN.USER@PHARMAASSIST.COM')
BEGIN
    INSERT INTO AspNetUsers (Id, FirstName, LastName, Email, NormalizedEmail, UserName, NormalizedUserName, 
        EmailConfirmed, PasswordHash, SecurityStamp, ConcurrencyStamp, PhoneNumber, PhoneNumberConfirmed,
        TwoFactorEnabled, LockoutEnd, LockoutEnabled, AccessFailedCount, IsActive, CreatedAt, ProfileImageUrl)
    VALUES (@AdminId, 'Admin', 'User', 'admin.user@pharmaassist.com', 'ADMIN.USER@PHARMAASSIST.COM',
        'admin.user@pharmaassist.com', 'ADMIN.USER@PHARMAASSIST.COM', 1, @PasswordHash, NEWID(), NEWID(),
        '+387-61-111-0002', 0, 0, NULL, 1, 0, 1, @Now, NULL);
    
    INSERT INTO AspNetUserRoles (UserId, RoleId)
    SELECT @AdminId, Id FROM AspNetRoles WHERE NormalizedName = 'ADMIN';
END

-- Manager User
DECLARE @ManagerId NVARCHAR(450) = NEWID();
IF NOT EXISTS (SELECT 1 FROM AspNetUsers WHERE NormalizedEmail = 'MANAGER.USER@PHARMAASSIST.COM')
BEGIN
    INSERT INTO AspNetUsers (Id, FirstName, LastName, Email, NormalizedEmail, UserName, NormalizedUserName, 
        EmailConfirmed, PasswordHash, SecurityStamp, ConcurrencyStamp, PhoneNumber, PhoneNumberConfirmed,
        TwoFactorEnabled, LockoutEnd, LockoutEnabled, AccessFailedCount, IsActive, CreatedAt, ProfileImageUrl)
    VALUES (@ManagerId, 'Manager', 'User', 'manager.user@pharmaassist.com', 'MANAGER.USER@PHARMAASSIST.COM',
        'manager.user@pharmaassist.com', 'MANAGER.USER@PHARMAASSIST.COM', 1, @PasswordHash, NEWID(), NEWID(),
        '+387-61-111-0003', 0, 0, NULL, 1, 0, 1, @Now, NULL);
    
    INSERT INTO AspNetUserRoles (UserId, RoleId)
    SELECT @ManagerId, Id FROM AspNetRoles WHERE NormalizedName = 'MANAGER';
END

-- Pharmacist User
DECLARE @PharmacistId NVARCHAR(450) = NEWID();
IF NOT EXISTS (SELECT 1 FROM AspNetUsers WHERE NormalizedEmail = 'PHARMACIST.USER@PHARMAASSIST.COM')
BEGIN
    INSERT INTO AspNetUsers (Id, FirstName, LastName, Email, NormalizedEmail, UserName, NormalizedUserName, 
        EmailConfirmed, PasswordHash, SecurityStamp, ConcurrencyStamp, PhoneNumber, PhoneNumberConfirmed,
        TwoFactorEnabled, LockoutEnd, LockoutEnabled, AccessFailedCount, IsActive, CreatedAt, ProfileImageUrl)
    VALUES (@PharmacistId, 'Pharmacist', 'User', 'pharmacist.user@pharmaassist.com', 'PHARMACIST.USER@PHARMAASSIST.COM',
        'pharmacist.user@pharmaassist.com', 'PHARMACIST.USER@PHARMAASSIST.COM', 1, @PasswordHash, NEWID(), NEWID(),
        '+387-61-111-0004', 0, 0, NULL, 1, 0, 1, @Now, NULL);
    
    INSERT INTO AspNetUserRoles (UserId, RoleId)
    SELECT @PharmacistId, Id FROM AspNetRoles WHERE NormalizedName = 'PHARMACIST';
END

-- SalesRep User
DECLARE @SalesRepId NVARCHAR(450) = NEWID();
IF NOT EXISTS (SELECT 1 FROM AspNetUsers WHERE NormalizedEmail = 'SALESREP.USER@PHARMAASSIST.COM')
BEGIN
    INSERT INTO AspNetUsers (Id, FirstName, LastName, Email, NormalizedEmail, UserName, NormalizedUserName, 
        EmailConfirmed, PasswordHash, SecurityStamp, ConcurrencyStamp, PhoneNumber, PhoneNumberConfirmed,
        TwoFactorEnabled, LockoutEnd, LockoutEnabled, AccessFailedCount, IsActive, CreatedAt, ProfileImageUrl)
    VALUES (@SalesRepId, 'SalesRep', 'User', 'salesrep.user@pharmaassist.com', 'SALESREP.USER@PHARMAASSIST.COM',
        'salesrep.user@pharmaassist.com', 'SALESREP.USER@PHARMAASSIST.COM', 1, @PasswordHash, NEWID(), NEWID(),
        '+387-61-111-0005', 0, 0, NULL, 1, 0, 1, @Now, NULL);
    
    INSERT INTO AspNetUserRoles (UserId, RoleId)
    SELECT @SalesRepId, Id FROM AspNetRoles WHERE NormalizedName = 'SALESREP';
END

-- Warehouse User
DECLARE @WarehouseId NVARCHAR(450) = NEWID();
IF NOT EXISTS (SELECT 1 FROM AspNetUsers WHERE NormalizedEmail = 'WAREHOUSE.USER@PHARMAASSIST.COM')
BEGIN
    INSERT INTO AspNetUsers (Id, FirstName, LastName, Email, NormalizedEmail, UserName, NormalizedUserName, 
        EmailConfirmed, PasswordHash, SecurityStamp, ConcurrencyStamp, PhoneNumber, PhoneNumberConfirmed,
        TwoFactorEnabled, LockoutEnd, LockoutEnabled, AccessFailedCount, IsActive, CreatedAt, ProfileImageUrl)
    VALUES (@WarehouseId, 'Warehouse', 'User', 'warehouse.user@pharmaassist.com', 'WAREHOUSE.USER@PHARMAASSIST.COM',
        'warehouse.user@pharmaassist.com', 'WAREHOUSE.USER@PHARMAASSIST.COM', 1, @PasswordHash, NEWID(), NEWID(),
        '+387-61-111-0006', 0, 0, NULL, 1, 0, 1, @Now, NULL);
    
    INSERT INTO AspNetUserRoles (UserId, RoleId)
    SELECT @WarehouseId, Id FROM AspNetRoles WHERE NormalizedName = 'WAREHOUSE';
END

-- Customer User
DECLARE @CustomerUserId NVARCHAR(450) = NEWID();
IF NOT EXISTS (SELECT 1 FROM AspNetUsers WHERE NormalizedEmail = 'CUSTOMER.USER@PHARMAASSIST.COM')
BEGIN
    INSERT INTO AspNetUsers (Id, FirstName, LastName, Email, NormalizedEmail, UserName, NormalizedUserName, 
        EmailConfirmed, PasswordHash, SecurityStamp, ConcurrencyStamp, PhoneNumber, PhoneNumberConfirmed,
        TwoFactorEnabled, LockoutEnd, LockoutEnabled, AccessFailedCount, IsActive, CreatedAt, ProfileImageUrl)
    VALUES (@CustomerUserId, 'Customer', 'User', 'customer.user@pharmaassist.com', 'CUSTOMER.USER@PHARMAASSIST.COM',
        'customer.user@pharmaassist.com', 'CUSTOMER.USER@PHARMAASSIST.COM', 1, @PasswordHash, NEWID(), NEWID(),
        '+387-61-111-0007', 0, 0, NULL, 1, 0, 1, @Now, NULL);
    
    INSERT INTO AspNetUserRoles (UserId, RoleId)
    SELECT @CustomerUserId, Id FROM AspNetRoles WHERE NormalizedName = 'CUSTOMER';
END

PRINT 'Users seeded successfully.';
PRINT 'Part 1 completed!';
GO
