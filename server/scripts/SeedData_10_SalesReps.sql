-- =============================================
-- PharmaAssist Database Seed Script
-- Part 10: Sales Representatives and Manager Assignments
-- Password for all users: test123
-- =============================================

SET NOCOUNT ON;
GO

PRINT 'Starting Part 10: Sales Representatives and Manager Assignments seed...';

DECLARE @Now DATETIME2 = GETUTCDATE();

-- Password hash for "test123" (from existing user)
DECLARE @PasswordHash NVARCHAR(MAX) = 'AQAAAAIAAYagAAAAEEpnO5JF9aG7ofgKWRQbhEpJlI3bJDNIAJH6bHQvREkGDECZJ9CdtZa0lt36qcDLKA==';

-- =============================================
-- CLEANUP: Delete existing SalesReps and Assignments
-- =============================================
PRINT 'Cleaning up existing SalesReps data...';

DELETE FROM RepManagerAssignments;
DELETE FROM RepCustomerAssignments;
DELETE FROM SalesRepresentatives;

PRINT 'Cleanup completed.';

-- =============================================
-- 1. CREATE MANAGER USERS (2 dedicated managers)
-- =============================================
PRINT 'Creating Manager Users...';

-- Manager 1: Amir Hodžić (Commercial Team Manager)
DECLARE @Manager1Id NVARCHAR(450) = NEWID();
IF NOT EXISTS (SELECT 1 FROM Users WHERE NormalizedEmail = 'AMIR.HODZIC@PHARMAASSIST.COM')
BEGIN
    INSERT INTO Users (Id, FirstName, LastName, MiddleName, DateOfBirth, IsActive, CreatedAt, UpdatedAt,
        CreatedBy, UpdatedBy, UserName, NormalizedUserName, Email, NormalizedEmail, 
        EmailConfirmed, PasswordHash, SecurityStamp, ConcurrencyStamp, PhoneNumber, PhoneNumberConfirmed,
        TwoFactorEnabled, LockoutEnd, LockoutEnabled, AccessFailedCount)
    VALUES (@Manager1Id, 'Amir', N'Hodžić', NULL, '1980-03-15', 1, @Now, NULL,
        NULL, NULL, 'amir.hodzic@pharmaassist.com', 'AMIR.HODZIC@PHARMAASSIST.COM',
        'amir.hodzic@pharmaassist.com', 'AMIR.HODZIC@PHARMAASSIST.COM',
        1, @PasswordHash, NEWID(), NEWID(), '+387-61-222-001', 0,
        0, NULL, 1, 0);
    
    INSERT INTO AspNetUserRoles (UserId, RoleId)
    SELECT @Manager1Id, Id FROM Roles WHERE NormalizedName = 'MANAGER';
    
    PRINT 'Created amir.hodzic@pharmaassist.com (Manager - Commercial Team)';
END
ELSE
BEGIN
    SELECT @Manager1Id = Id FROM Users WHERE NormalizedEmail = 'AMIR.HODZIC@PHARMAASSIST.COM';
END

-- Manager 2: Selma Begović (Medical Team Manager)
DECLARE @Manager2Id NVARCHAR(450) = NEWID();
IF NOT EXISTS (SELECT 1 FROM Users WHERE NormalizedEmail = 'SELMA.BEGOVIC@PHARMAASSIST.COM')
BEGIN
    INSERT INTO Users (Id, FirstName, LastName, MiddleName, DateOfBirth, IsActive, CreatedAt, UpdatedAt,
        CreatedBy, UpdatedBy, UserName, NormalizedUserName, Email, NormalizedEmail, 
        EmailConfirmed, PasswordHash, SecurityStamp, ConcurrencyStamp, PhoneNumber, PhoneNumberConfirmed,
        TwoFactorEnabled, LockoutEnd, LockoutEnabled, AccessFailedCount)
    VALUES (@Manager2Id, 'Selma', N'Begović', NULL, '1982-07-22', 1, @Now, NULL,
        NULL, NULL, 'selma.begovic@pharmaassist.com', 'SELMA.BEGOVIC@PHARMAASSIST.COM',
        'selma.begovic@pharmaassist.com', 'SELMA.BEGOVIC@PHARMAASSIST.COM',
        1, @PasswordHash, NEWID(), NEWID(), '+387-61-222-002', 0,
        0, NULL, 1, 0);
    
    INSERT INTO AspNetUserRoles (UserId, RoleId)
    SELECT @Manager2Id, Id FROM Roles WHERE NormalizedName = 'MANAGER';
    
    PRINT 'Created selma.begovic@pharmaassist.com (Manager - Medical Team)';
END
ELSE
BEGIN
    SELECT @Manager2Id = Id FROM Users WHERE NormalizedEmail = 'SELMA.BEGOVIC@PHARMAASSIST.COM';
END

-- =============================================
-- 2. CREATE SALES REP USERS (8 sales reps)
-- =============================================
PRINT 'Creating Sales Rep Users...';

-- Sales Rep 1: Edin Mujić (Commercial - OTC)
DECLARE @SalesRep1UserId NVARCHAR(450) = NEWID();
IF NOT EXISTS (SELECT 1 FROM Users WHERE NormalizedEmail = 'EDIN.MUJIC@PHARMAASSIST.COM')
BEGIN
    INSERT INTO Users (Id, FirstName, LastName, MiddleName, DateOfBirth, IsActive, CreatedAt, UpdatedAt,
        CreatedBy, UpdatedBy, UserName, NormalizedUserName, Email, NormalizedEmail, 
        EmailConfirmed, PasswordHash, SecurityStamp, ConcurrencyStamp, PhoneNumber, PhoneNumberConfirmed,
        TwoFactorEnabled, LockoutEnd, LockoutEnabled, AccessFailedCount)
    VALUES (@SalesRep1UserId, 'Edin', N'Mujić', NULL, '1990-05-12', 1, @Now, NULL,
        NULL, NULL, 'edin.mujic@pharmaassist.com', 'EDIN.MUJIC@PHARMAASSIST.COM',
        'edin.mujic@pharmaassist.com', 'EDIN.MUJIC@PHARMAASSIST.COM',
        1, @PasswordHash, NEWID(), NEWID(), '+387-61-333-001', 0,
        0, NULL, 1, 0);
    
    INSERT INTO AspNetUserRoles (UserId, RoleId)
    SELECT @SalesRep1UserId, Id FROM Roles WHERE NormalizedName = 'SALESREP';
    
    PRINT 'Created edin.mujic@pharmaassist.com (SalesRep)';
END
ELSE
BEGIN
    SELECT @SalesRep1UserId = Id FROM Users WHERE NormalizedEmail = 'EDIN.MUJIC@PHARMAASSIST.COM';
END

-- Sales Rep 2: Amela Hadžić (Commercial - OTC)
DECLARE @SalesRep2UserId NVARCHAR(450) = NEWID();
IF NOT EXISTS (SELECT 1 FROM Users WHERE NormalizedEmail = 'AMELA.HADZIC@PHARMAASSIST.COM')
BEGIN
    INSERT INTO Users (Id, FirstName, LastName, MiddleName, DateOfBirth, IsActive, CreatedAt, UpdatedAt,
        CreatedBy, UpdatedBy, UserName, NormalizedUserName, Email, NormalizedEmail, 
        EmailConfirmed, PasswordHash, SecurityStamp, ConcurrencyStamp, PhoneNumber, PhoneNumberConfirmed,
        TwoFactorEnabled, LockoutEnd, LockoutEnabled, AccessFailedCount)
    VALUES (@SalesRep2UserId, 'Amela', N'Hadžić', NULL, '1992-08-25', 1, @Now, NULL,
        NULL, NULL, 'amela.hadzic@pharmaassist.com', 'AMELA.HADZIC@PHARMAASSIST.COM',
        'amela.hadzic@pharmaassist.com', 'AMELA.HADZIC@PHARMAASSIST.COM',
        1, @PasswordHash, NEWID(), NEWID(), '+387-61-333-002', 0,
        0, NULL, 1, 0);
    
    INSERT INTO AspNetUserRoles (UserId, RoleId)
    SELECT @SalesRep2UserId, Id FROM Roles WHERE NormalizedName = 'SALESREP';
    
    PRINT 'Created amela.hadzic@pharmaassist.com (SalesRep)';
END
ELSE
BEGIN
    SELECT @SalesRep2UserId = Id FROM Users WHERE NormalizedEmail = 'AMELA.HADZIC@PHARMAASSIST.COM';
END

-- Sales Rep 3: Mirza Delić (Commercial - OTC)
DECLARE @SalesRep3UserId NVARCHAR(450) = NEWID();
IF NOT EXISTS (SELECT 1 FROM Users WHERE NormalizedEmail = 'MIRZA.DELIC@PHARMAASSIST.COM')
BEGIN
    INSERT INTO Users (Id, FirstName, LastName, MiddleName, DateOfBirth, IsActive, CreatedAt, UpdatedAt,
        CreatedBy, UpdatedBy, UserName, NormalizedUserName, Email, NormalizedEmail, 
        EmailConfirmed, PasswordHash, SecurityStamp, ConcurrencyStamp, PhoneNumber, PhoneNumberConfirmed,
        TwoFactorEnabled, LockoutEnd, LockoutEnabled, AccessFailedCount)
    VALUES (@SalesRep3UserId, 'Mirza', N'Delić', NULL, '1988-11-03', 1, @Now, NULL,
        NULL, NULL, 'mirza.delic@pharmaassist.com', 'MIRZA.DELIC@PHARMAASSIST.COM',
        'mirza.delic@pharmaassist.com', 'MIRZA.DELIC@PHARMAASSIST.COM',
        1, @PasswordHash, NEWID(), NEWID(), '+387-61-333-003', 0,
        0, NULL, 1, 0);
    
    INSERT INTO AspNetUserRoles (UserId, RoleId)
    SELECT @SalesRep3UserId, Id FROM Roles WHERE NormalizedName = 'SALESREP';
    
    PRINT 'Created mirza.delic@pharmaassist.com (SalesRep)';
END
ELSE
BEGIN
    SELECT @SalesRep3UserId = Id FROM Users WHERE NormalizedEmail = 'MIRZA.DELIC@PHARMAASSIST.COM';
END

-- Sales Rep 4: Lejla Imamović (Commercial - OTC)
DECLARE @SalesRep4UserId NVARCHAR(450) = NEWID();
IF NOT EXISTS (SELECT 1 FROM Users WHERE NormalizedEmail = 'LEJLA.IMAMOVIC@PHARMAASSIST.COM')
BEGIN
    INSERT INTO Users (Id, FirstName, LastName, MiddleName, DateOfBirth, IsActive, CreatedAt, UpdatedAt,
        CreatedBy, UpdatedBy, UserName, NormalizedUserName, Email, NormalizedEmail, 
        EmailConfirmed, PasswordHash, SecurityStamp, ConcurrencyStamp, PhoneNumber, PhoneNumberConfirmed,
        TwoFactorEnabled, LockoutEnd, LockoutEnabled, AccessFailedCount)
    VALUES (@SalesRep4UserId, 'Lejla', N'Imamović', NULL, '1994-02-18', 1, @Now, NULL,
        NULL, NULL, 'lejla.imamovic@pharmaassist.com', 'LEJLA.IMAMOVIC@PHARMAASSIST.COM',
        'lejla.imamovic@pharmaassist.com', 'LEJLA.IMAMOVIC@PHARMAASSIST.COM',
        1, @PasswordHash, NEWID(), NEWID(), '+387-61-333-004', 0,
        0, NULL, 1, 0);
    
    INSERT INTO AspNetUserRoles (UserId, RoleId)
    SELECT @SalesRep4UserId, Id FROM Roles WHERE NormalizedName = 'SALESREP';
    
    PRINT 'Created lejla.imamovic@pharmaassist.com (SalesRep)';
END
ELSE
BEGIN
    SELECT @SalesRep4UserId = Id FROM Users WHERE NormalizedEmail = 'LEJLA.IMAMOVIC@PHARMAASSIST.COM';
END

-- Sales Rep 5: Adnan Kovačević (Medical - RX)
DECLARE @SalesRep5UserId NVARCHAR(450) = NEWID();
IF NOT EXISTS (SELECT 1 FROM Users WHERE NormalizedEmail = 'ADNAN.KOVACEVIC@PHARMAASSIST.COM')
BEGIN
    INSERT INTO Users (Id, FirstName, LastName, MiddleName, DateOfBirth, IsActive, CreatedAt, UpdatedAt,
        CreatedBy, UpdatedBy, UserName, NormalizedUserName, Email, NormalizedEmail, 
        EmailConfirmed, PasswordHash, SecurityStamp, ConcurrencyStamp, PhoneNumber, PhoneNumberConfirmed,
        TwoFactorEnabled, LockoutEnd, LockoutEnabled, AccessFailedCount)
    VALUES (@SalesRep5UserId, 'Adnan', N'Kovačević', NULL, '1985-06-30', 1, @Now, NULL,
        NULL, NULL, 'adnan.kovacevic@pharmaassist.com', 'ADNAN.KOVACEVIC@PHARMAASSIST.COM',
        'adnan.kovacevic@pharmaassist.com', 'ADNAN.KOVACEVIC@PHARMAASSIST.COM',
        1, @PasswordHash, NEWID(), NEWID(), '+387-61-333-005', 0,
        0, NULL, 1, 0);
    
    INSERT INTO AspNetUserRoles (UserId, RoleId)
    SELECT @SalesRep5UserId, Id FROM Roles WHERE NormalizedName = 'SALESREP';
    
    PRINT 'Created adnan.kovacevic@pharmaassist.com (SalesRep - Medical)';
END
ELSE
BEGIN
    SELECT @SalesRep5UserId = Id FROM Users WHERE NormalizedEmail = 'ADNAN.KOVACEVIC@PHARMAASSIST.COM';
END

-- Sales Rep 6: Maja Petrović (Medical - RX)
DECLARE @SalesRep6UserId NVARCHAR(450) = NEWID();
IF NOT EXISTS (SELECT 1 FROM Users WHERE NormalizedEmail = 'MAJA.PETROVIC@PHARMAASSIST.COM')
BEGIN
    INSERT INTO Users (Id, FirstName, LastName, MiddleName, DateOfBirth, IsActive, CreatedAt, UpdatedAt,
        CreatedBy, UpdatedBy, UserName, NormalizedUserName, Email, NormalizedEmail, 
        EmailConfirmed, PasswordHash, SecurityStamp, ConcurrencyStamp, PhoneNumber, PhoneNumberConfirmed,
        TwoFactorEnabled, LockoutEnd, LockoutEnabled, AccessFailedCount)
    VALUES (@SalesRep6UserId, 'Maja', N'Petrović', NULL, '1987-09-14', 1, @Now, NULL,
        NULL, NULL, 'maja.petrovic@pharmaassist.com', 'MAJA.PETROVIC@PHARMAASSIST.COM',
        'maja.petrovic@pharmaassist.com', 'MAJA.PETROVIC@PHARMAASSIST.COM',
        1, @PasswordHash, NEWID(), NEWID(), '+387-61-333-006', 0,
        0, NULL, 1, 0);
    
    INSERT INTO AspNetUserRoles (UserId, RoleId)
    SELECT @SalesRep6UserId, Id FROM Roles WHERE NormalizedName = 'SALESREP';
    
    PRINT 'Created maja.petrovic@pharmaassist.com (SalesRep - Medical)';
END
ELSE
BEGIN
    SELECT @SalesRep6UserId = Id FROM Users WHERE NormalizedEmail = 'MAJA.PETROVIC@PHARMAASSIST.COM';
END

-- Sales Rep 7: Haris Zahirović (Medical - RX)
DECLARE @SalesRep7UserId NVARCHAR(450) = NEWID();
IF NOT EXISTS (SELECT 1 FROM Users WHERE NormalizedEmail = 'HARIS.ZAHIROVIC@PHARMAASSIST.COM')
BEGIN
    INSERT INTO Users (Id, FirstName, LastName, MiddleName, DateOfBirth, IsActive, CreatedAt, UpdatedAt,
        CreatedBy, UpdatedBy, UserName, NormalizedUserName, Email, NormalizedEmail, 
        EmailConfirmed, PasswordHash, SecurityStamp, ConcurrencyStamp, PhoneNumber, PhoneNumberConfirmed,
        TwoFactorEnabled, LockoutEnd, LockoutEnabled, AccessFailedCount)
    VALUES (@SalesRep7UserId, 'Haris', N'Zahirović', NULL, '1983-12-05', 1, @Now, NULL,
        NULL, NULL, 'haris.zahirovic@pharmaassist.com', 'HARIS.ZAHIROVIC@PHARMAASSIST.COM',
        'haris.zahirovic@pharmaassist.com', 'HARIS.ZAHIROVIC@PHARMAASSIST.COM',
        1, @PasswordHash, NEWID(), NEWID(), '+387-61-333-007', 0,
        0, NULL, 1, 0);
    
    INSERT INTO AspNetUserRoles (UserId, RoleId)
    SELECT @SalesRep7UserId, Id FROM Roles WHERE NormalizedName = 'SALESREP';
    
    PRINT 'Created haris.zahirovic@pharmaassist.com (SalesRep - Medical)';
END
ELSE
BEGIN
    SELECT @SalesRep7UserId = Id FROM Users WHERE NormalizedEmail = 'HARIS.ZAHIROVIC@PHARMAASSIST.COM';
END

-- Sales Rep 8: Aida Softić (Medical - RX)
DECLARE @SalesRep8UserId NVARCHAR(450) = NEWID();
IF NOT EXISTS (SELECT 1 FROM Users WHERE NormalizedEmail = 'AIDA.SOFTIC@PHARMAASSIST.COM')
BEGIN
    INSERT INTO Users (Id, FirstName, LastName, MiddleName, DateOfBirth, IsActive, CreatedAt, UpdatedAt,
        CreatedBy, UpdatedBy, UserName, NormalizedUserName, Email, NormalizedEmail, 
        EmailConfirmed, PasswordHash, SecurityStamp, ConcurrencyStamp, PhoneNumber, PhoneNumberConfirmed,
        TwoFactorEnabled, LockoutEnd, LockoutEnabled, AccessFailedCount)
    VALUES (@SalesRep8UserId, 'Aida', N'Softić', NULL, '1991-04-22', 1, @Now, NULL,
        NULL, NULL, 'aida.softic@pharmaassist.com', 'AIDA.SOFTIC@PHARMAASSIST.COM',
        'aida.softic@pharmaassist.com', 'AIDA.SOFTIC@PHARMAASSIST.COM',
        1, @PasswordHash, NEWID(), NEWID(), '+387-61-333-008', 0,
        0, NULL, 1, 0);
    
    INSERT INTO AspNetUserRoles (UserId, RoleId)
    SELECT @SalesRep8UserId, Id FROM Roles WHERE NormalizedName = 'SALESREP';
    
    PRINT 'Created aida.softic@pharmaassist.com (SalesRep - Medical)';
END
ELSE
BEGIN
    SELECT @SalesRep8UserId = Id FROM Users WHERE NormalizedEmail = 'AIDA.SOFTIC@PHARMAASSIST.COM';
END

-- =============================================
-- 3. CREATE SALES REPRESENTATIVE RECORDS
-- =============================================
PRINT 'Creating SalesRepresentatives records...';

-- Commercial Reps (Type = 0)
-- Rep 1: Edin Mujić - Commercial, Sarajevo Canton
INSERT INTO SalesRepresentatives (UserId, RepType, EmployeeCode, Mobile, HireDate, Status, TerritoryDescription, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy)
VALUES (@SalesRep1UserId, 0, 'COM-001', '+387-61-333-001', '2020-03-01', 0, N'Kanton Sarajevo - Centar, Novi Grad, Novo Sarajevo', @Now, NULL, NULL, NULL);
DECLARE @Rep1Id INT = SCOPE_IDENTITY();

-- Rep 2: Amela Hadžić - Commercial, Zenica-Doboj Canton
INSERT INTO SalesRepresentatives (UserId, RepType, EmployeeCode, Mobile, HireDate, Status, TerritoryDescription, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy)
VALUES (@SalesRep2UserId, 0, 'COM-002', '+387-61-333-002', '2021-06-15', 0, N'Zeničko-dobojski kanton - Zenica, Kakanj, Visoko', @Now, NULL, NULL, NULL);
DECLARE @Rep2Id INT = SCOPE_IDENTITY();

-- Rep 3: Mirza Delić - Commercial, Tuzla Canton
INSERT INTO SalesRepresentatives (UserId, RepType, EmployeeCode, Mobile, HireDate, Status, TerritoryDescription, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy)
VALUES (@SalesRep3UserId, 0, 'COM-003', '+387-61-333-003', '2019-09-01', 0, N'Tuzlanski kanton - Tuzla, Lukavac, Živinice', @Now, NULL, NULL, NULL);
DECLARE @Rep3Id INT = SCOPE_IDENTITY();

-- Rep 4: Lejla Imamović - Commercial, Herzegovina
INSERT INTO SalesRepresentatives (UserId, RepType, EmployeeCode, Mobile, HireDate, Status, TerritoryDescription, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy)
VALUES (@SalesRep4UserId, 0, 'COM-004', '+387-61-333-004', '2022-01-10', 0, N'Hercegovačko-neretvanski kanton - Mostar, Čapljina, Konjic', @Now, NULL, NULL, NULL);
DECLARE @Rep4Id INT = SCOPE_IDENTITY();

-- Medical Reps (Type = 1)
-- Rep 5: Adnan Kovačević - Medical, Sarajevo
INSERT INTO SalesRepresentatives (UserId, RepType, EmployeeCode, Mobile, HireDate, Status, TerritoryDescription, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy)
VALUES (@SalesRep5UserId, 1, 'MED-001', '+387-61-333-005', '2018-05-01', 0, N'Kanton Sarajevo - Bolnice, Domovi zdravlja, Specijalizirane klinike', @Now, NULL, NULL, NULL);
DECLARE @Rep5Id INT = SCOPE_IDENTITY();

-- Rep 6: Maja Petrović - Medical, Central BiH
INSERT INTO SalesRepresentatives (UserId, RepType, EmployeeCode, Mobile, HireDate, Status, TerritoryDescription, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy)
VALUES (@SalesRep6UserId, 1, 'MED-002', '+387-61-333-006', '2019-02-15', 0, N'Centralna BiH - Zenica, Travnik, Vitez - Bolnice i ambulante', @Now, NULL, NULL, NULL);
DECLARE @Rep6Id INT = SCOPE_IDENTITY();

-- Rep 7: Haris Zahirović - Medical, North BiH
INSERT INTO SalesRepresentatives (UserId, RepType, EmployeeCode, Mobile, HireDate, Status, TerritoryDescription, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy)
VALUES (@SalesRep7UserId, 1, 'MED-003', '+387-61-333-007', '2020-08-01', 0, N'Sjeverna BiH - Tuzla, Bihać, Brčko - Medicinske ustanove', @Now, NULL, NULL, NULL);
DECLARE @Rep7Id INT = SCOPE_IDENTITY();

-- Rep 8: Aida Softić - Medical, South BiH
INSERT INTO SalesRepresentatives (UserId, RepType, EmployeeCode, Mobile, HireDate, Status, TerritoryDescription, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy)
VALUES (@SalesRep8UserId, 1, 'MED-004', '+387-61-333-008', '2021-11-01', 0, N'Južna BiH - Mostar, Trebinje, Široki Brijeg - Zdravstvene ustanove', @Now, NULL, NULL, NULL);
DECLARE @Rep8Id INT = SCOPE_IDENTITY();

PRINT 'Created 8 SalesRepresentatives (4 Commercial, 4 Medical)';

-- =============================================
-- 4. CREATE MANAGER ASSIGNMENTS
-- =============================================
PRINT 'Creating RepManagerAssignments...';

-- Manager 1 (Amir Hodžić) manages Commercial Reps (1-4)
INSERT INTO RepManagerAssignments (RepId, ManagerUserId, AssignmentDate, IsActive, IsPrimary, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy)
VALUES (@Rep1Id, @Manager1Id, '2020-03-01', 1, 1, @Now, NULL, NULL, NULL);

INSERT INTO RepManagerAssignments (RepId, ManagerUserId, AssignmentDate, IsActive, IsPrimary, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy)
VALUES (@Rep2Id, @Manager1Id, '2021-06-15', 1, 1, @Now, NULL, NULL, NULL);

INSERT INTO RepManagerAssignments (RepId, ManagerUserId, AssignmentDate, IsActive, IsPrimary, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy)
VALUES (@Rep3Id, @Manager1Id, '2019-09-01', 1, 1, @Now, NULL, NULL, NULL);

INSERT INTO RepManagerAssignments (RepId, ManagerUserId, AssignmentDate, IsActive, IsPrimary, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy)
VALUES (@Rep4Id, @Manager1Id, '2022-01-10', 1, 1, @Now, NULL, NULL, NULL);

-- Manager 2 (Selma Begović) manages Medical Reps (5-8)
INSERT INTO RepManagerAssignments (RepId, ManagerUserId, AssignmentDate, IsActive, IsPrimary, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy)
VALUES (@Rep5Id, @Manager2Id, '2018-05-01', 1, 1, @Now, NULL, NULL, NULL);

INSERT INTO RepManagerAssignments (RepId, ManagerUserId, AssignmentDate, IsActive, IsPrimary, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy)
VALUES (@Rep6Id, @Manager2Id, '2019-02-15', 1, 1, @Now, NULL, NULL, NULL);

INSERT INTO RepManagerAssignments (RepId, ManagerUserId, AssignmentDate, IsActive, IsPrimary, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy)
VALUES (@Rep7Id, @Manager2Id, '2020-08-01', 1, 1, @Now, NULL, NULL, NULL);

INSERT INTO RepManagerAssignments (RepId, ManagerUserId, AssignmentDate, IsActive, IsPrimary, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy)
VALUES (@Rep8Id, @Manager2Id, '2021-11-01', 1, 1, @Now, NULL, NULL, NULL);

PRINT 'Created 8 RepManagerAssignments';

-- =============================================
-- 5. SUMMARY
-- =============================================
PRINT '';
PRINT 'Part 10: Sales Representatives and Manager Assignments seed completed!';
PRINT '';
PRINT '=== NEW USERS CREATED ===';
PRINT 'Password for all: test123';
PRINT '';
PRINT 'MANAGERS:';
PRINT '  - amir.hodzic@pharmaassist.com (Manager - Commercial Team)';
PRINT '  - selma.begovic@pharmaassist.com (Manager - Medical Team)';
PRINT '';
PRINT 'COMMERCIAL SALES REPS (OTC):';
PRINT '  - edin.mujic@pharmaassist.com (Sarajevo Canton)';
PRINT '  - amela.hadzic@pharmaassist.com (Zenica-Doboj Canton)';
PRINT '  - mirza.delic@pharmaassist.com (Tuzla Canton)';
PRINT '  - lejla.imamovic@pharmaassist.com (Herzegovina)';
PRINT '';
PRINT 'MEDICAL SALES REPS (RX):';
PRINT '  - adnan.kovacevic@pharmaassist.com (Sarajevo Medical)';
PRINT '  - maja.petrovic@pharmaassist.com (Central BiH Medical)';
PRINT '  - haris.zahirovic@pharmaassist.com (North BiH Medical)';
PRINT '  - aida.softic@pharmaassist.com (South BiH Medical)';
PRINT '';
GO
