-- =============================================
-- PharmaAssist Database Seed Script
-- Part 3: Manufacturers and Categories
-- =============================================

SET NOCOUNT ON;
GO

PRINT 'Starting Part 3: Manufacturers and Categories seed...';

DECLARE @Now DATETIME2 = GETUTCDATE();

-- =============================================
-- CLEANUP: Delete existing manufacturers and categories
-- =============================================
PRINT 'Cleaning up existing manufacturers and categories...';

-- Categories must be deleted before products (FK constraint)
-- Products will be cleaned in Part 4
DELETE FROM Categories;
DELETE FROM Manufacturers;

PRINT 'Manufacturers and Categories cleanup completed.';

-- =============================================
-- 1. MANUFACTURERS
-- =============================================
PRINT 'Seeding Manufacturers...';

IF NOT EXISTS (SELECT 1 FROM Manufacturers WHERE Name = 'Bosnalijek')
INSERT INTO Manufacturers (Name, Description, Country, City, Address, ContactPhone, ContactEmail, Website, LogoUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('Bosnalijek', 'Leading pharmaceutical company in Bosnia and Herzegovina', 'Bosnia and Herzegovina', 'Sarajevo', 'Jukićeva 53', '+387-33-254-500', 'info@bosnalijek.com', 'https://www.bosnalijek.com', NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Manufacturers WHERE Name = 'Hemofarm')
INSERT INTO Manufacturers (Name, Description, Country, City, Address, ContactPhone, ContactEmail, Website, LogoUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('Hemofarm', 'Major pharmaceutical manufacturer from Serbia', 'Serbia', 'Vršac', 'Beogradski put bb', '+381-13-803-100', 'office@hemofarm.com', 'https://www.hemofarm.com', NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Manufacturers WHERE Name = 'Pliva')
INSERT INTO Manufacturers (Name, Description, Country, City, Address, ContactPhone, ContactEmail, Website, LogoUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('Pliva', 'Croatian pharmaceutical company, part of Teva', 'Croatia', 'Zagreb', 'Prilaz baruna Filipovića 25', '+385-1-3720-000', 'info@pliva.hr', 'https://www.pliva.hr', NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Manufacturers WHERE Name = 'Krka')
INSERT INTO Manufacturers (Name, Description, Country, City, Address, ContactPhone, ContactEmail, Website, LogoUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('Krka', 'Slovenian pharmaceutical company', 'Slovenia', 'Novo Mesto', 'Šmarješka cesta 6', '+386-7-331-1111', 'info@krka.biz', 'https://www.krka.biz', NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Manufacturers WHERE Name = 'Pfizer')
INSERT INTO Manufacturers (Name, Description, Country, City, Address, ContactPhone, ContactEmail, Website, LogoUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('Pfizer', 'Global pharmaceutical corporation', 'United States', 'New York', '235 East 42nd Street', '+1-212-733-2323', 'info@pfizer.com', 'https://www.pfizer.com', NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Manufacturers WHERE Name = 'Roche')
INSERT INTO Manufacturers (Name, Description, Country, City, Address, ContactPhone, ContactEmail, Website, LogoUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('Roche', 'Swiss multinational healthcare company', 'Switzerland', 'Basel', 'Grenzacherstrasse 124', '+41-61-688-1111', 'info@roche.com', 'https://www.roche.com', NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Manufacturers WHERE Name = 'Novartis')
INSERT INTO Manufacturers (Name, Description, Country, City, Address, ContactPhone, ContactEmail, Website, LogoUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('Novartis', 'Swiss multinational pharmaceutical company', 'Switzerland', 'Basel', 'Lichtstrasse 35', '+41-61-324-1111', 'info@novartis.com', 'https://www.novartis.com', NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Manufacturers WHERE Name = 'Sanofi')
INSERT INTO Manufacturers (Name, Description, Country, City, Address, ContactPhone, ContactEmail, Website, LogoUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('Sanofi', 'French multinational pharmaceutical company', 'France', 'Paris', '54 Rue La Boétie', '+33-1-53-77-4000', 'info@sanofi.com', 'https://www.sanofi.com', NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Manufacturers WHERE Name = 'Bayer')
INSERT INTO Manufacturers (Name, Description, Country, City, Address, ContactPhone, ContactEmail, Website, LogoUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('Bayer', 'German multinational pharmaceutical company', 'Germany', 'Leverkusen', 'Kaiser-Wilhelm-Allee 1', '+49-214-30-1', 'info@bayer.com', 'https://www.bayer.com', NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Manufacturers WHERE Name = 'Johnson & Johnson')
INSERT INTO Manufacturers (Name, Description, Country, City, Address, ContactPhone, ContactEmail, Website, LogoUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('Johnson & Johnson', 'American multinational corporation', 'United States', 'New Brunswick', 'One Johnson & Johnson Plaza', '+1-732-524-0400', 'info@jnj.com', 'https://www.jnj.com', NULL, 1, 0, @Now, 'Seed');

PRINT 'Manufacturers seeded successfully.';

-- =============================================
-- 2. CATEGORIES (Hierarchical)
-- =============================================
PRINT 'Seeding Categories...';

-- Root Categories
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'Prescription Medicines')
INSERT INTO Categories (Name, NameLocal, Description, ParentCategoryId, DisplayOrder, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('Prescription Medicines', 'Lijekovi na recept', 'Medicines that require a prescription', NULL, 1, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'OTC Medicines')
INSERT INTO Categories (Name, NameLocal, Description, ParentCategoryId, DisplayOrder, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('OTC Medicines', 'Bezreceptni lijekovi', 'Over-the-counter medicines', NULL, 2, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'Medical Devices')
INSERT INTO Categories (Name, NameLocal, Description, ParentCategoryId, DisplayOrder, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('Medical Devices', 'Medicinska sredstva', 'Medical devices and equipment', NULL, 3, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'Supplements')
INSERT INTO Categories (Name, NameLocal, Description, ParentCategoryId, DisplayOrder, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('Supplements', 'Dodaci prehrani', 'Dietary and nutritional supplements', NULL, 4, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'Personal Care')
INSERT INTO Categories (Name, NameLocal, Description, ParentCategoryId, DisplayOrder, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('Personal Care', 'Lična njega', 'Personal care and hygiene products', NULL, 5, NULL, 1, 0, @Now, 'Seed');

-- Sub-categories for Prescription Medicines
DECLARE @RxCatId INT = (SELECT Id FROM Categories WHERE Name = 'Prescription Medicines');

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'Antibiotics')
INSERT INTO Categories (Name, NameLocal, Description, ParentCategoryId, DisplayOrder, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('Antibiotics', 'Antibiotici', 'Antibacterial medications', @RxCatId, 1, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'Cardiovascular')
INSERT INTO Categories (Name, NameLocal, Description, ParentCategoryId, DisplayOrder, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('Cardiovascular', 'Kardiovaskularni', 'Heart and blood vessel medications', @RxCatId, 2, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'Diabetes')
INSERT INTO Categories (Name, NameLocal, Description, ParentCategoryId, DisplayOrder, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('Diabetes', 'Dijabetes', 'Diabetes medications', @RxCatId, 3, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'Neurological')
INSERT INTO Categories (Name, NameLocal, Description, ParentCategoryId, DisplayOrder, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('Neurological', 'Neurološki', 'Nervous system medications', @RxCatId, 4, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'Respiratory')
INSERT INTO Categories (Name, NameLocal, Description, ParentCategoryId, DisplayOrder, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('Respiratory', 'Respiratorni', 'Respiratory system medications', @RxCatId, 5, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'Gastroenterology')
INSERT INTO Categories (Name, NameLocal, Description, ParentCategoryId, DisplayOrder, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('Gastroenterology', 'Gastroenterologija', 'Digestive system medications', @RxCatId, 6, NULL, 1, 0, @Now, 'Seed');

-- Sub-categories for OTC Medicines
DECLARE @OtcCatId INT = (SELECT Id FROM Categories WHERE Name = 'OTC Medicines');

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'Pain Relief')
INSERT INTO Categories (Name, NameLocal, Description, ParentCategoryId, DisplayOrder, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('Pain Relief', 'Protiv bolova', 'Pain relief and analgesics', @OtcCatId, 1, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'Cold & Flu')
INSERT INTO Categories (Name, NameLocal, Description, ParentCategoryId, DisplayOrder, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('Cold & Flu', 'Prehlada i gripa', 'Cold and flu remedies', @OtcCatId, 2, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'Allergies')
INSERT INTO Categories (Name, NameLocal, Description, ParentCategoryId, DisplayOrder, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('Allergies', 'Alergije', 'Allergy medications', @OtcCatId, 3, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'Digestive Health')
INSERT INTO Categories (Name, NameLocal, Description, ParentCategoryId, DisplayOrder, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('Digestive Health', 'Probavni sistem', 'Digestive health products', @OtcCatId, 4, NULL, 1, 0, @Now, 'Seed');

-- Sub-categories for Supplements
DECLARE @SuppCatId INT = (SELECT Id FROM Categories WHERE Name = 'Supplements');

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'Vitamins')
INSERT INTO Categories (Name, NameLocal, Description, ParentCategoryId, DisplayOrder, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('Vitamins', 'Vitamini', 'Vitamin supplements', @SuppCatId, 1, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'Minerals')
INSERT INTO Categories (Name, NameLocal, Description, ParentCategoryId, DisplayOrder, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('Minerals', 'Minerali', 'Mineral supplements', @SuppCatId, 2, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'Probiotics')
INSERT INTO Categories (Name, NameLocal, Description, ParentCategoryId, DisplayOrder, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('Probiotics', 'Probiotici', 'Probiotic supplements', @SuppCatId, 3, NULL, 1, 0, @Now, 'Seed');

-- Sub-categories for Medical Devices
DECLARE @DevCatId INT = (SELECT Id FROM Categories WHERE Name = 'Medical Devices');

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'Diagnostic Equipment')
INSERT INTO Categories (Name, NameLocal, Description, ParentCategoryId, DisplayOrder, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('Diagnostic Equipment', 'Dijagnostička oprema', 'Diagnostic devices and equipment', @DevCatId, 1, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'First Aid')
INSERT INTO Categories (Name, NameLocal, Description, ParentCategoryId, DisplayOrder, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('First Aid', 'Prva pomoć', 'First aid supplies', @DevCatId, 2, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Categories WHERE Name = 'Mobility Aids')
INSERT INTO Categories (Name, NameLocal, Description, ParentCategoryId, DisplayOrder, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('Mobility Aids', 'Ortopedska pomagala', 'Mobility and orthopedic aids', @DevCatId, 3, NULL, 1, 0, @Now, 'Seed');

PRINT 'Categories seeded successfully.';
PRINT 'Part 3 completed!';
GO
