-- =============================================
-- PharmaAssist Database Seed Script
-- Part 5: Customers and Addresses
-- =============================================

SET NOCOUNT ON;
GO

PRINT 'Starting Part 5: Customers and Addresses seed...';

DECLARE @Now DATETIME2 = GETUTCDATE();

-- =============================================
-- CLEANUP: Delete existing customers and related data
-- =============================================
PRINT 'Cleaning up existing customers...';

-- Delete in correct order due to FK constraints
DELETE FROM CustomerAddresses;
DELETE FROM PromotionUsages;
DELETE FROM Orders; -- Will also need to delete orders
DELETE FROM Prescriptions;
DELETE FROM Claims;
DELETE FROM SalesTargets;
DELETE FROM Budgets;
DELETE FROM Tenders;
DELETE FROM ClientFeatureFlags;
DELETE FROM Customers;

PRINT 'Customers cleanup completed.';

-- Get user ID for customer user
DECLARE @CustomerUserId NVARCHAR(450) = (SELECT Id FROM AspNetUsers WHERE NormalizedEmail = 'CUSTOMER.USER@PHARMAASSIST.COM');

-- Get geographic IDs
DECLARE @SarajevoCantonId INT = (SELECT Id FROM Cantons WHERE Code = 'SC');
DECLARE @TuzlaCantonId INT = (SELECT Id FROM Cantons WHERE Code = 'TC');
DECLARE @ZenicaCantonId INT = (SELECT Id FROM Cantons WHERE Code = 'ZDC');
DECLARE @MostarCantonId INT = (SELECT Id FROM Cantons WHERE Code = 'HNC');
DECLARE @BanjaLukaRegionId INT = (SELECT Id FROM Cantons WHERE Code = 'RS-BL');
DECLARE @FBiHId INT = (SELECT Id FROM BiHEntities WHERE Code = 'FBiH');
DECLARE @RSId INT = (SELECT Id FROM BiHEntities WHERE Code = 'RS');

DECLARE @CentarSarMunId INT = (SELECT Id FROM Municipalities WHERE Code = 'SAR-CS');
DECLARE @TuzlaMunId INT = (SELECT Id FROM Municipalities WHERE Code = 'TZ-TZ');
DECLARE @ZenicaMunId INT = (SELECT Id FROM Municipalities WHERE Code = 'ZE-ZE');
DECLARE @MostarMunId INT = (SELECT Id FROM Municipalities WHERE Code = 'MO-MO');
DECLARE @BanjaLukaMunId INT = (SELECT Id FROM Municipalities WHERE Code = 'BL-BL');

-- =============================================
-- 1. HEADQUARTERS CUSTOMERS (Tier 1 - Enterprise)
-- =============================================
PRINT 'Seeding Headquarters Customers...';

-- Pharmacy Chain 1 - Apoteka Sarajevo (Headquarters)
IF NOT EXISTS (SELECT 1 FROM Customers WHERE CustomerCode = 'CUST-HQ-001')
INSERT INTO Customers (CustomerCode, FirstName, LastName, CompanyName, Email, Phone, MobilePhone, Fax,
    CustomerType, Tier, IsHeadquarters, ParentCustomerId, TaxId, RegistrationNumber, BranchCode,
    CreditLimit, CurrentBalance, PaymentTermsDays, IsActive, IsVerified, VerifiedAt, VerifiedBy,
    UserId, IsDeleted, CreatedAt, CreatedBy)
VALUES ('CUST-HQ-001', 'Amra', 'Hadžić', 'Apoteka Sarajevo d.o.o.', 'info@apoteka-sarajevo.ba', 
    '+387-33-222-333', '+387-61-222-333', '+387-33-222-334',
    1, 1, 1, NULL, '4201234567890', 'REG-SAR-001', NULL,
    50000.00, 0.00, 30, 1, 1, @Now, 'Seed',
    @CustomerUserId, 0, @Now, 'Seed');

-- Pharmacy Chain 2 - Tuzla Farmacija (Headquarters)
IF NOT EXISTS (SELECT 1 FROM Customers WHERE CustomerCode = 'CUST-HQ-002')
INSERT INTO Customers (CustomerCode, FirstName, LastName, CompanyName, Email, Phone, MobilePhone, Fax,
    CustomerType, Tier, IsHeadquarters, ParentCustomerId, TaxId, RegistrationNumber, BranchCode,
    CreditLimit, CurrentBalance, PaymentTermsDays, IsActive, IsVerified, VerifiedAt, VerifiedBy,
    UserId, IsDeleted, CreatedAt, CreatedBy)
VALUES ('CUST-HQ-002', 'Emir', 'Begović', 'Tuzla Farmacija d.o.o.', 'info@tuzla-farmacija.ba', 
    '+387-35-333-444', '+387-61-333-444', '+387-35-333-445',
    1, 1, 1, NULL, '4202345678901', 'REG-TUZ-001', NULL,
    45000.00, 0.00, 30, 1, 1, @Now, 'Seed',
    NULL, 0, @Now, 'Seed');

-- Hospital 1 - Klinički Centar Sarajevo (Headquarters)
IF NOT EXISTS (SELECT 1 FROM Customers WHERE CustomerCode = 'CUST-HQ-003')
INSERT INTO Customers (CustomerCode, FirstName, LastName, CompanyName, Email, Phone, MobilePhone, Fax,
    CustomerType, Tier, IsHeadquarters, ParentCustomerId, TaxId, RegistrationNumber, BranchCode,
    CreditLimit, CurrentBalance, PaymentTermsDays, IsActive, IsVerified, VerifiedAt, VerifiedBy,
    UserId, IsDeleted, CreatedAt, CreatedBy)
VALUES ('CUST-HQ-003', 'Dr. Mirza', 'Kovačević', 'Klinički Centar Univerziteta Sarajevo', 'nabavka@kcus.ba', 
    '+387-33-444-555', '+387-61-444-555', '+387-33-444-556',
    2, 1, 1, NULL, '4203456789012', 'REG-KCUS-001', NULL,
    100000.00, 0.00, 45, 1, 1, @Now, 'Seed',
    NULL, 0, @Now, 'Seed');

-- Pharmacy Chain 3 - Zenica Ljekarna (Headquarters)
IF NOT EXISTS (SELECT 1 FROM Customers WHERE CustomerCode = 'CUST-HQ-004')
INSERT INTO Customers (CustomerCode, FirstName, LastName, CompanyName, Email, Phone, MobilePhone, Fax,
    CustomerType, Tier, IsHeadquarters, ParentCustomerId, TaxId, RegistrationNumber, BranchCode,
    CreditLimit, CurrentBalance, PaymentTermsDays, IsActive, IsVerified, VerifiedAt, VerifiedBy,
    UserId, IsDeleted, CreatedAt, CreatedBy)
VALUES ('CUST-HQ-004', 'Selma', 'Mušić', 'Zenica Ljekarna d.o.o.', 'info@zenica-ljekarna.ba', 
    '+387-32-555-666', '+387-61-555-666', '+387-32-555-667',
    1, 2, 1, NULL, '4204567890123', 'REG-ZEN-001', NULL,
    35000.00, 0.00, 30, 1, 1, @Now, 'Seed',
    NULL, 0, @Now, 'Seed');

-- Clinic 1 - Mostar Medical (Headquarters)
IF NOT EXISTS (SELECT 1 FROM Customers WHERE CustomerCode = 'CUST-HQ-005')
INSERT INTO Customers (CustomerCode, FirstName, LastName, CompanyName, Email, Phone, MobilePhone, Fax,
    CustomerType, Tier, IsHeadquarters, ParentCustomerId, TaxId, RegistrationNumber, BranchCode,
    CreditLimit, CurrentBalance, PaymentTermsDays, IsActive, IsVerified, VerifiedAt, VerifiedBy,
    UserId, IsDeleted, CreatedAt, CreatedBy)
VALUES ('CUST-HQ-005', 'Dr. Ivan', 'Marković', 'Mostar Medical Centar', 'nabavka@mostar-medical.ba', 
    '+387-36-666-777', '+387-63-666-777', '+387-36-666-778',
    3, 2, 1, NULL, '4205678901234', 'REG-MOS-001', NULL,
    40000.00, 0.00, 30, 1, 1, @Now, 'Seed',
    NULL, 0, @Now, 'Seed');

-- Get HQ IDs for branches
DECLARE @HQ1Id INT = (SELECT Id FROM Customers WHERE CustomerCode = 'CUST-HQ-001');
DECLARE @HQ2Id INT = (SELECT Id FROM Customers WHERE CustomerCode = 'CUST-HQ-002');
DECLARE @HQ3Id INT = (SELECT Id FROM Customers WHERE CustomerCode = 'CUST-HQ-003');
DECLARE @HQ4Id INT = (SELECT Id FROM Customers WHERE CustomerCode = 'CUST-HQ-004');

-- =============================================
-- 2. BRANCH CUSTOMERS
-- =============================================
PRINT 'Seeding Branch Customers...';

-- Apoteka Sarajevo Branches
IF NOT EXISTS (SELECT 1 FROM Customers WHERE CustomerCode = 'CUST-BR-001')
INSERT INTO Customers (CustomerCode, FirstName, LastName, CompanyName, Email, Phone, MobilePhone, Fax,
    CustomerType, Tier, IsHeadquarters, ParentCustomerId, TaxId, RegistrationNumber, BranchCode,
    CreditLimit, CurrentBalance, PaymentTermsDays, IsActive, IsVerified, VerifiedAt, VerifiedBy,
    UserId, IsDeleted, CreatedAt, CreatedBy)
VALUES ('CUST-BR-001', 'Lejla', 'Smajić', 'Apoteka Sarajevo - Centar', 'centar@apoteka-sarajevo.ba', 
    '+387-33-222-401', '+387-61-222-401', NULL,
    1, 1, 0, @HQ1Id, '4201234567890', 'REG-SAR-001', 'SAR-CTR',
    15000.00, 0.00, 30, 1, 1, @Now, 'Seed',
    NULL, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Customers WHERE CustomerCode = 'CUST-BR-002')
INSERT INTO Customers (CustomerCode, FirstName, LastName, CompanyName, Email, Phone, MobilePhone, Fax,
    CustomerType, Tier, IsHeadquarters, ParentCustomerId, TaxId, RegistrationNumber, BranchCode,
    CreditLimit, CurrentBalance, PaymentTermsDays, IsActive, IsVerified, VerifiedAt, VerifiedBy,
    UserId, IsDeleted, CreatedAt, CreatedBy)
VALUES ('CUST-BR-002', 'Dino', 'Čaušević', 'Apoteka Sarajevo - Ilidža', 'ilidza@apoteka-sarajevo.ba', 
    '+387-33-222-402', '+387-61-222-402', NULL,
    1, 1, 0, @HQ1Id, '4201234567890', 'REG-SAR-001', 'SAR-ILI',
    12000.00, 0.00, 30, 1, 1, @Now, 'Seed',
    NULL, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Customers WHERE CustomerCode = 'CUST-BR-003')
INSERT INTO Customers (CustomerCode, FirstName, LastName, CompanyName, Email, Phone, MobilePhone, Fax,
    CustomerType, Tier, IsHeadquarters, ParentCustomerId, TaxId, RegistrationNumber, BranchCode,
    CreditLimit, CurrentBalance, PaymentTermsDays, IsActive, IsVerified, VerifiedAt, VerifiedBy,
    UserId, IsDeleted, CreatedAt, CreatedBy)
VALUES ('CUST-BR-003', 'Aida', 'Hasanović', 'Apoteka Sarajevo - Novo Sarajevo', 'novosarajevo@apoteka-sarajevo.ba', 
    '+387-33-222-403', '+387-61-222-403', NULL,
    1, 1, 0, @HQ1Id, '4201234567890', 'REG-SAR-001', 'SAR-NS',
    12000.00, 0.00, 30, 1, 1, @Now, 'Seed',
    NULL, 0, @Now, 'Seed');

-- Tuzla Farmacija Branches
IF NOT EXISTS (SELECT 1 FROM Customers WHERE CustomerCode = 'CUST-BR-004')
INSERT INTO Customers (CustomerCode, FirstName, LastName, CompanyName, Email, Phone, MobilePhone, Fax,
    CustomerType, Tier, IsHeadquarters, ParentCustomerId, TaxId, RegistrationNumber, BranchCode,
    CreditLimit, CurrentBalance, PaymentTermsDays, IsActive, IsVerified, VerifiedAt, VerifiedBy,
    UserId, IsDeleted, CreatedAt, CreatedBy)
VALUES ('CUST-BR-004', 'Jasmin', 'Delić', 'Tuzla Farmacija - Centar', 'centar@tuzla-farmacija.ba', 
    '+387-35-333-501', '+387-61-333-501', NULL,
    1, 1, 0, @HQ2Id, '4202345678901', 'REG-TUZ-001', 'TUZ-CTR',
    12000.00, 0.00, 30, 1, 1, @Now, 'Seed',
    NULL, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Customers WHERE CustomerCode = 'CUST-BR-005')
INSERT INTO Customers (CustomerCode, FirstName, LastName, CompanyName, Email, Phone, MobilePhone, Fax,
    CustomerType, Tier, IsHeadquarters, ParentCustomerId, TaxId, RegistrationNumber, BranchCode,
    CreditLimit, CurrentBalance, PaymentTermsDays, IsActive, IsVerified, VerifiedAt, VerifiedBy,
    UserId, IsDeleted, CreatedAt, CreatedBy)
VALUES ('CUST-BR-005', 'Sabina', 'Alić', 'Tuzla Farmacija - Lukavac', 'lukavac@tuzla-farmacija.ba', 
    '+387-35-333-502', '+387-61-333-502', NULL,
    1, 1, 0, @HQ2Id, '4202345678901', 'REG-TUZ-001', 'TUZ-LUK',
    10000.00, 0.00, 30, 1, 1, @Now, 'Seed',
    NULL, 0, @Now, 'Seed');

-- Standalone Pharmacy (Tier 3 - Small)
IF NOT EXISTS (SELECT 1 FROM Customers WHERE CustomerCode = 'CUST-SM-001')
INSERT INTO Customers (CustomerCode, FirstName, LastName, CompanyName, Email, Phone, MobilePhone, Fax,
    CustomerType, Tier, IsHeadquarters, ParentCustomerId, TaxId, RegistrationNumber, BranchCode,
    CreditLimit, CurrentBalance, PaymentTermsDays, IsActive, IsVerified, VerifiedAt, VerifiedBy,
    UserId, IsDeleted, CreatedAt, CreatedBy)
VALUES ('CUST-SM-001', 'Nermin', 'Hodžić', 'Apoteka Zdravlje', 'apoteka.zdravlje@gmail.com', 
    '+387-33-777-888', '+387-62-777-888', NULL,
    1, 3, 1, NULL, '4206789012345', 'REG-ZDR-001', NULL,
    10000.00, 0.00, 15, 1, 1, @Now, 'Seed',
    NULL, 0, @Now, 'Seed');

-- Banja Luka Pharmacy (RS)
IF NOT EXISTS (SELECT 1 FROM Customers WHERE CustomerCode = 'CUST-RS-001')
INSERT INTO Customers (CustomerCode, FirstName, LastName, CompanyName, Email, Phone, MobilePhone, Fax,
    CustomerType, Tier, IsHeadquarters, ParentCustomerId, TaxId, RegistrationNumber, BranchCode,
    CreditLimit, CurrentBalance, PaymentTermsDays, IsActive, IsVerified, VerifiedAt, VerifiedBy,
    UserId, IsDeleted, CreatedAt, CreatedBy)
VALUES ('CUST-RS-001', 'Milan', 'Petrović', 'Apoteka Banja Luka d.o.o.', 'info@apoteka-bl.com', 
    '+387-51-888-999', '+387-65-888-999', '+387-51-888-998',
    1, 2, 1, NULL, '4407890123456', 'REG-BL-001', NULL,
    30000.00, 0.00, 30, 1, 1, @Now, 'Seed',
    NULL, 0, @Now, 'Seed');

PRINT 'Customers seeded successfully.';

-- =============================================
-- 3. CUSTOMER ADDRESSES
-- =============================================
PRINT 'Seeding Customer Addresses...';

-- Refresh customer IDs
SET @HQ1Id = (SELECT Id FROM Customers WHERE CustomerCode = 'CUST-HQ-001');
SET @HQ2Id = (SELECT Id FROM Customers WHERE CustomerCode = 'CUST-HQ-002');
SET @HQ3Id = (SELECT Id FROM Customers WHERE CustomerCode = 'CUST-HQ-003');
SET @HQ4Id = (SELECT Id FROM Customers WHERE CustomerCode = 'CUST-HQ-004');
DECLARE @HQ5Id INT = (SELECT Id FROM Customers WHERE CustomerCode = 'CUST-HQ-005');
DECLARE @BR1Id INT = (SELECT Id FROM Customers WHERE CustomerCode = 'CUST-BR-001');
DECLARE @BR2Id INT = (SELECT Id FROM Customers WHERE CustomerCode = 'CUST-BR-002');
DECLARE @SM1Id INT = (SELECT Id FROM Customers WHERE CustomerCode = 'CUST-SM-001');
DECLARE @RS1Id INT = (SELECT Id FROM Customers WHERE CustomerCode = 'CUST-RS-001');

-- Apoteka Sarajevo HQ Address
IF NOT EXISTS (SELECT 1 FROM CustomerAddresses WHERE CustomerId = @HQ1Id AND AddressType = 1)
INSERT INTO CustomerAddresses (CustomerId, AddressType, Street, Street2, City, PostalCode, 
    BiHEntityId, CantonId, MunicipalityId, ContactName, ContactPhone, Notes, IsDefault, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@HQ1Id, 1, 'Ferhadija 15', 'Ulaz 2', 'Sarajevo', '71000',
    @FBiHId, @SarajevoCantonId, @CentarSarMunId, 'Amra Hadžić', '+387-61-222-333', 'Glavni ured', 1, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM CustomerAddresses WHERE CustomerId = @HQ1Id AND AddressType = 2)
INSERT INTO CustomerAddresses (CustomerId, AddressType, Street, Street2, City, PostalCode, 
    BiHEntityId, CantonId, MunicipalityId, ContactName, ContactPhone, Notes, IsDefault, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@HQ1Id, 2, 'Zmaja od Bosne 8', 'Skladište 1', 'Sarajevo', '71000',
    @FBiHId, @SarajevoCantonId, @CentarSarMunId, 'Skladištar Dino', '+387-61-222-444', 'Centralno skladište', 1, 1, 0, @Now, 'Seed');

-- Tuzla Farmacija HQ Address
IF NOT EXISTS (SELECT 1 FROM CustomerAddresses WHERE CustomerId = @HQ2Id AND AddressType = 1)
INSERT INTO CustomerAddresses (CustomerId, AddressType, Street, Street2, City, PostalCode, 
    BiHEntityId, CantonId, MunicipalityId, ContactName, ContactPhone, Notes, IsDefault, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@HQ2Id, 1, 'Turalibegova 22', NULL, 'Tuzla', '75000',
    @FBiHId, @TuzlaCantonId, @TuzlaMunId, 'Emir Begović', '+387-61-333-444', 'Centrala', 1, 1, 0, @Now, 'Seed');

-- KCUS Address
IF NOT EXISTS (SELECT 1 FROM CustomerAddresses WHERE CustomerId = @HQ3Id AND AddressType = 1)
INSERT INTO CustomerAddresses (CustomerId, AddressType, Street, Street2, City, PostalCode, 
    BiHEntityId, CantonId, MunicipalityId, ContactName, ContactPhone, Notes, IsDefault, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@HQ3Id, 1, 'Bolnička 25', 'Bolnički kompleks', 'Sarajevo', '71000',
    @FBiHId, @SarajevoCantonId, @CentarSarMunId, 'Služba nabavke', '+387-33-444-555', 'Bolnička apoteka', 1, 1, 0, @Now, 'Seed');

-- Zenica Ljekarna Address
IF NOT EXISTS (SELECT 1 FROM CustomerAddresses WHERE CustomerId = @HQ4Id AND AddressType = 1)
INSERT INTO CustomerAddresses (CustomerId, AddressType, Street, Street2, City, PostalCode, 
    BiHEntityId, CantonId, MunicipalityId, ContactName, ContactPhone, Notes, IsDefault, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@HQ4Id, 1, 'Maršala Tita 12', NULL, 'Zenica', '72000',
    @FBiHId, @ZenicaCantonId, @ZenicaMunId, 'Selma Mušić', '+387-61-555-666', 'Glavna poslovnica', 1, 1, 0, @Now, 'Seed');

-- Mostar Medical Address
IF NOT EXISTS (SELECT 1 FROM CustomerAddresses WHERE CustomerId = @HQ5Id AND AddressType = 1)
INSERT INTO CustomerAddresses (CustomerId, AddressType, Street, Street2, City, PostalCode, 
    BiHEntityId, CantonId, MunicipalityId, ContactName, ContactPhone, Notes, IsDefault, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@HQ5Id, 1, 'Bulevar 18', NULL, 'Mostar', '88000',
    @FBiHId, @MostarCantonId, @MostarMunId, 'Dr. Ivan Marković', '+387-63-666-777', 'Medicinski centar', 1, 1, 0, @Now, 'Seed');

-- Branch 1 Address
IF @BR1Id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM CustomerAddresses WHERE CustomerId = @BR1Id AND AddressType = 1)
INSERT INTO CustomerAddresses (CustomerId, AddressType, Street, Street2, City, PostalCode, 
    BiHEntityId, CantonId, MunicipalityId, ContactName, ContactPhone, Notes, IsDefault, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@BR1Id, 1, 'Mula Mustafe Bašeskije 5', NULL, 'Sarajevo', '71000',
    @FBiHId, @SarajevoCantonId, @CentarSarMunId, 'Lejla Smajić', '+387-61-222-401', 'Poslovnica Centar', 1, 1, 0, @Now, 'Seed');

-- Small pharmacy Address
IF @SM1Id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM CustomerAddresses WHERE CustomerId = @SM1Id AND AddressType = 1)
INSERT INTO CustomerAddresses (CustomerId, AddressType, Street, Street2, City, PostalCode, 
    BiHEntityId, CantonId, MunicipalityId, ContactName, ContactPhone, Notes, IsDefault, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@SM1Id, 1, 'Grbavička 50', NULL, 'Sarajevo', '71000',
    @FBiHId, @SarajevoCantonId, @CentarSarMunId, 'Nermin Hodžić', '+387-62-777-888', 'Apoteka Zdravlje', 1, 1, 0, @Now, 'Seed');

-- Banja Luka pharmacy Address
IF @RS1Id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM CustomerAddresses WHERE CustomerId = @RS1Id AND AddressType = 1)
INSERT INTO CustomerAddresses (CustomerId, AddressType, Street, Street2, City, PostalCode, 
    BiHEntityId, CantonId, MunicipalityId, ContactName, ContactPhone, Notes, IsDefault, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@RS1Id, 1, 'Kralja Petra I 30', NULL, 'Banja Luka', '78000',
    @RSId, @BanjaLukaRegionId, @BanjaLukaMunId, 'Milan Petrović', '+387-65-888-999', 'Centrala BL', 1, 1, 0, @Now, 'Seed');

PRINT 'Customer Addresses seeded successfully.';
PRINT 'Part 5 completed!';
GO
