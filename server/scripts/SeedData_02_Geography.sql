-- =============================================
-- PharmaAssist Database Seed Script
-- Part 2: BiH Geographic Data (Entities, Cantons, Municipalities, Cities)
-- =============================================

SET NOCOUNT ON;
GO

PRINT 'Starting Part 2: BiH Geographic Data seed...';

DECLARE @Now DATETIME2 = GETUTCDATE();

-- =============================================
-- CLEANUP: Delete existing geographic data
-- =============================================
PRINT 'Cleaning up existing geographic data...';

DELETE FROM Cities;
DELETE FROM Municipalities;
DELETE FROM Cantons;
DELETE FROM BiHEntities;

PRINT 'Geographic data cleanup completed.';

-- =============================================
-- 1. BiH ENTITIES (Federation & Republika Srpska)
-- =============================================
PRINT 'Seeding BiH Entities...';

IF NOT EXISTS (SELECT 1 FROM BiHEntities WHERE Code = 'FBiH')
INSERT INTO BiHEntities (Code, Name, NameLocal, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('FBiH', 'Federation of Bosnia and Herzegovina', 'Federacija Bosne i Hercegovine', 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM BiHEntities WHERE Code = 'RS')
INSERT INTO BiHEntities (Code, Name, NameLocal, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('RS', 'Republika Srpska', 'Republika Srpska', 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM BiHEntities WHERE Code = 'BD')
INSERT INTO BiHEntities (Code, Name, NameLocal, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('BD', 'Brcko District', 'Brčko Distrikt', 1, 0, @Now, 'Seed');

-- =============================================
-- 2. CANTONS (Federation only - 10 cantons)
-- =============================================
PRINT 'Seeding Cantons...';

DECLARE @FBiHId INT = (SELECT Id FROM BiHEntities WHERE Code = 'FBiH');
DECLARE @RSId INT = (SELECT Id FROM BiHEntities WHERE Code = 'RS');
DECLARE @BDId INT = (SELECT Id FROM BiHEntities WHERE Code = 'BD');

-- Federation Cantons
IF NOT EXISTS (SELECT 1 FROM Cantons WHERE Code = 'USC')
INSERT INTO Cantons (BiHEntityId, Code, Name, NameLocal, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@FBiHId, 'USC', 'Una-Sana Canton', 'Unsko-sanski kanton', 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Cantons WHERE Code = 'PC')
INSERT INTO Cantons (BiHEntityId, Code, Name, NameLocal, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@FBiHId, 'PC', 'Posavina Canton', 'Posavski kanton', 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Cantons WHERE Code = 'TC')
INSERT INTO Cantons (BiHEntityId, Code, Name, NameLocal, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@FBiHId, 'TC', 'Tuzla Canton', 'Tuzlanski kanton', 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Cantons WHERE Code = 'ZDC')
INSERT INTO Cantons (BiHEntityId, Code, Name, NameLocal, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@FBiHId, 'ZDC', 'Zenica-Doboj Canton', 'Zeničko-dobojski kanton', 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Cantons WHERE Code = 'BPC')
INSERT INTO Cantons (BiHEntityId, Code, Name, NameLocal, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@FBiHId, 'BPC', 'Bosnian-Podrinje Canton', 'Bosansko-podrinjski kanton', 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Cantons WHERE Code = 'CBC')
INSERT INTO Cantons (BiHEntityId, Code, Name, NameLocal, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@FBiHId, 'CBC', 'Central Bosnia Canton', 'Srednjobosanski kanton', 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Cantons WHERE Code = 'HNC')
INSERT INTO Cantons (BiHEntityId, Code, Name, NameLocal, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@FBiHId, 'HNC', 'Herzegovina-Neretva Canton', 'Hercegovačko-neretvanski kanton', 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Cantons WHERE Code = 'WHC')
INSERT INTO Cantons (BiHEntityId, Code, Name, NameLocal, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@FBiHId, 'WHC', 'West Herzegovina Canton', 'Zapadnohercegovački kanton', 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Cantons WHERE Code = 'SC')
INSERT INTO Cantons (BiHEntityId, Code, Name, NameLocal, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@FBiHId, 'SC', 'Sarajevo Canton', 'Kanton Sarajevo', 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Cantons WHERE Code = 'C10')
INSERT INTO Cantons (BiHEntityId, Code, Name, NameLocal, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@FBiHId, 'C10', 'Canton 10', 'Kanton 10 (Livanjski)', 1, 0, @Now, 'Seed');

-- RS and BD don't have cantons; model them as single administrative units.
IF NOT EXISTS (SELECT 1 FROM Cantons WHERE Code = 'RS')
INSERT INTO Cantons (BiHEntityId, Code, Name, NameLocal, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@RSId, 'RS', 'Republika Srpska', 'Republika Srpska', 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Cantons WHERE Code = 'BD')
INSERT INTO Cantons (BiHEntityId, Code, Name, NameLocal, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@BDId, 'BD', 'Brcko District', 'Brčko Distrikt', 1, 0, @Now, 'Seed');

-- =============================================
-- 3. MUNICIPALITIES
-- =============================================
PRINT 'Seeding Municipalities...';

DECLARE @SarajevoCantonId INT = (SELECT Id FROM Cantons WHERE Code = 'SC');
DECLARE @TuzlaCantonId INT = (SELECT Id FROM Cantons WHERE Code = 'TC');
DECLARE @ZenicaCantonId INT = (SELECT Id FROM Cantons WHERE Code = 'ZDC');
DECLARE @MostarCantonId INT = (SELECT Id FROM Cantons WHERE Code = 'HNC');
DECLARE @RSCantonId INT = (SELECT Id FROM Cantons WHERE Code = 'RS');

-- Sarajevo Canton Municipalities
IF NOT EXISTS (SELECT 1 FROM Municipalities WHERE Code = 'SAR-CS')
INSERT INTO Municipalities (CantonId, Code, Name, NameLocal, PostalCode, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@SarajevoCantonId, 'SAR-CS', 'Centar Sarajevo', 'Centar Sarajevo', '71000', 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Municipalities WHERE Code = 'SAR-NS')
INSERT INTO Municipalities (CantonId, Code, Name, NameLocal, PostalCode, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@SarajevoCantonId, 'SAR-NS', 'Novo Sarajevo', 'Novo Sarajevo', '71000', 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Municipalities WHERE Code = 'SAR-NV')
INSERT INTO Municipalities (CantonId, Code, Name, NameLocal, PostalCode, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@SarajevoCantonId, 'SAR-NV', 'Novi Grad', 'Novi Grad Sarajevo', '71000', 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Municipalities WHERE Code = 'SAR-IL')
INSERT INTO Municipalities (CantonId, Code, Name, NameLocal, PostalCode, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@SarajevoCantonId, 'SAR-IL', 'Ilidza', 'Ilidža', '71210', 1, 0, @Now, 'Seed');

-- Tuzla Canton Municipalities
IF NOT EXISTS (SELECT 1 FROM Municipalities WHERE Code = 'TZ-TZ')
INSERT INTO Municipalities (CantonId, Code, Name, NameLocal, PostalCode, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@TuzlaCantonId, 'TZ-TZ', 'Tuzla', 'Tuzla', '75000', 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Municipalities WHERE Code = 'TZ-LK')
INSERT INTO Municipalities (CantonId, Code, Name, NameLocal, PostalCode, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@TuzlaCantonId, 'TZ-LK', 'Lukavac', 'Lukavac', '75300', 1, 0, @Now, 'Seed');

-- Zenica Canton Municipalities
IF NOT EXISTS (SELECT 1 FROM Municipalities WHERE Code = 'ZE-ZE')
INSERT INTO Municipalities (CantonId, Code, Name, NameLocal, PostalCode, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@ZenicaCantonId, 'ZE-ZE', 'Zenica', 'Zenica', '72000', 1, 0, @Now, 'Seed');

-- Mostar Canton Municipalities
IF NOT EXISTS (SELECT 1 FROM Municipalities WHERE Code = 'MO-MO')
INSERT INTO Municipalities (CantonId, Code, Name, NameLocal, PostalCode, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@MostarCantonId, 'MO-MO', 'Mostar', 'Mostar', '88000', 1, 0, @Now, 'Seed');

-- Banja Luka Region Municipalities (RS)
IF NOT EXISTS (SELECT 1 FROM Municipalities WHERE Code = 'BL-BL')
INSERT INTO Municipalities (CantonId, Code, Name, NameLocal, PostalCode, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@RSCantonId, 'BL-BL', 'Banja Luka', 'Banja Luka', '78000', 1, 0, @Now, 'Seed');

-- Bijeljina Region Municipalities (RS)
IF NOT EXISTS (SELECT 1 FROM Municipalities WHERE Code = 'BN-BN')
INSERT INTO Municipalities (CantonId, Code, Name, NameLocal, PostalCode, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@RSCantonId, 'BN-BN', 'Bijeljina', 'Bijeljina', '76300', 1, 0, @Now, 'Seed');

-- =============================================
-- 4. CITIES
-- =============================================
PRINT 'Seeding Cities...';

DECLARE @CentarSarId INT = (SELECT Id FROM Municipalities WHERE Code = 'SAR-CS');
DECLARE @NovoSarId INT = (SELECT Id FROM Municipalities WHERE Code = 'SAR-NS');
DECLARE @TuzlaMunId INT = (SELECT Id FROM Municipalities WHERE Code = 'TZ-TZ');
DECLARE @ZenicaMunId INT = (SELECT Id FROM Municipalities WHERE Code = 'ZE-ZE');
DECLARE @MostarMunId INT = (SELECT Id FROM Municipalities WHERE Code = 'MO-MO');
DECLARE @BanjaLukaMunId INT = (SELECT Id FROM Municipalities WHERE Code = 'BL-BL');
DECLARE @BijelMunId INT = (SELECT Id FROM Municipalities WHERE Code = 'BN-BN');

IF NOT EXISTS (SELECT 1 FROM Cities WHERE Name = 'Sarajevo' AND MunicipalityId = @CentarSarId)
INSERT INTO Cities (MunicipalityId, Name, NameLocal, PostalCode, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@CentarSarId, 'Sarajevo', 'Sarajevo', '71000', 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Cities WHERE Name = 'Tuzla' AND MunicipalityId = @TuzlaMunId)
INSERT INTO Cities (MunicipalityId, Name, NameLocal, PostalCode, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@TuzlaMunId, 'Tuzla', 'Tuzla', '75000', 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Cities WHERE Name = 'Zenica' AND MunicipalityId = @ZenicaMunId)
INSERT INTO Cities (MunicipalityId, Name, NameLocal, PostalCode, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@ZenicaMunId, 'Zenica', 'Zenica', '72000', 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Cities WHERE Name = 'Mostar' AND MunicipalityId = @MostarMunId)
INSERT INTO Cities (MunicipalityId, Name, NameLocal, PostalCode, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@MostarMunId, 'Mostar', 'Mostar', '88000', 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Cities WHERE Name = 'Banja Luka' AND MunicipalityId = @BanjaLukaMunId)
INSERT INTO Cities (MunicipalityId, Name, NameLocal, PostalCode, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@BanjaLukaMunId, 'Banja Luka', 'Banja Luka', '78000', 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Cities WHERE Name = 'Bijeljina' AND MunicipalityId = @BijelMunId)
INSERT INTO Cities (MunicipalityId, Name, NameLocal, PostalCode, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES (@BijelMunId, 'Bijeljina', 'Bijeljina', '76300', 1, 0, @Now, 'Seed');

PRINT 'BiH Geographic data seeded successfully.';
PRINT 'Part 2 completed!';
GO
