-- =============================================
-- PharmaAssist Database Seed Script
-- Part 4: Products
-- =============================================

SET NOCOUNT ON;
GO

PRINT 'Starting Part 4: Products seed...';

DECLARE @Now DATETIME2 = GETUTCDATE();

-- =============================================
-- CLEANUP: Already handled in Part 3 (Manufacturers_Categories)
-- This is a no-op since Part 3 already cleans products
-- =============================================
PRINT 'Cleaning up existing products...';

-- Products already cleaned in Part 3, just clean any additional references
DELETE FROM PriceRules;
DELETE FROM StockMovements;
DELETE FROM TenderBidItems;
DELETE FROM TenderItems;

PRINT 'Products cleanup completed.';

-- Get category and manufacturer IDs
DECLARE @AntibioticsCatId INT = (SELECT Id FROM Categories WHERE Name = 'Antibiotics');
DECLARE @CardiosCatId INT = (SELECT Id FROM Categories WHERE Name = 'Cardiovascular');
DECLARE @DiabetesCatId INT = (SELECT Id FROM Categories WHERE Name = 'Diabetes');
DECLARE @NeuroCatId INT = (SELECT Id FROM Categories WHERE Name = 'Neurological');
DECLARE @RespirCatId INT = (SELECT Id FROM Categories WHERE Name = 'Respiratory');
DECLARE @GastroCatId INT = (SELECT Id FROM Categories WHERE Name = 'Gastroenterology');
DECLARE @PainCatId INT = (SELECT Id FROM Categories WHERE Name = 'Pain Relief');
DECLARE @ColdFluCatId INT = (SELECT Id FROM Categories WHERE Name = 'Cold & Flu');
DECLARE @AllergyCatId INT = (SELECT Id FROM Categories WHERE Name = 'Allergies');
DECLARE @VitaminsCatId INT = (SELECT Id FROM Categories WHERE Name = 'Vitamins');
DECLARE @DiagCatId INT = (SELECT Id FROM Categories WHERE Name = 'Diagnostic Equipment');
DECLARE @FirstAidCatId INT = (SELECT Id FROM Categories WHERE Name = 'First Aid');

DECLARE @BosnalId INT = (SELECT Id FROM Manufacturers WHERE Name = 'Bosnalijek');
DECLARE @HemofarmId INT = (SELECT Id FROM Manufacturers WHERE Name = 'Hemofarm');
DECLARE @PlivaId INT = (SELECT Id FROM Manufacturers WHERE Name = 'Pliva');
DECLARE @KrkaId INT = (SELECT Id FROM Manufacturers WHERE Name = 'Krka');
DECLARE @PfizerId INT = (SELECT Id FROM Manufacturers WHERE Name = 'Pfizer');
DECLARE @RocheId INT = (SELECT Id FROM Manufacturers WHERE Name = 'Roche');
DECLARE @NovartisId INT = (SELECT Id FROM Manufacturers WHERE Name = 'Novartis');
DECLARE @SanofiId INT = (SELECT Id FROM Manufacturers WHERE Name = 'Sanofi');
DECLARE @BayerId INT = (SELECT Id FROM Manufacturers WHERE Name = 'Bayer');
DECLARE @JnJId INT = (SELECT Id FROM Manufacturers WHERE Name = 'Johnson & Johnson');

-- =============================================
-- PRESCRIPTION MEDICINES - ANTIBIOTICS
-- =============================================
PRINT 'Seeding Antibiotics products...';

IF NOT EXISTS (SELECT 1 FROM Products WHERE SKU = 'RX-ANT-001')
INSERT INTO Products (SKU, Name, NameLocal, Description, DescriptionLocal, GenericName, CategoryId, ManufacturerId, 
    UnitPrice, CostPrice, TaxRate, Barcode, DosageForm, Strength, PackageSize, ATCCode,
    RequiresPrescription, IsControlled, StockQuantity, ReorderLevel, ReorderQuantity, IsFeatured, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('RX-ANT-001', 'Amoxicillin 500mg', 'Amoksicilin 500mg', 'Broad-spectrum antibiotic', 'Antibiotik širokog spektra', 'Amoxicillin',
    @AntibioticsCatId, @BosnalId, 12.50, 8.00, 17.00, '3856789012001', 'Capsule', '500mg', '20 capsules', 'J01CA04',
    1, 0, 500, 100, 200, 0, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Products WHERE SKU = 'RX-ANT-002')
INSERT INTO Products (SKU, Name, NameLocal, Description, DescriptionLocal, GenericName, CategoryId, ManufacturerId, 
    UnitPrice, CostPrice, TaxRate, Barcode, DosageForm, Strength, PackageSize, ATCCode,
    RequiresPrescription, IsControlled, StockQuantity, ReorderLevel, ReorderQuantity, IsFeatured, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('RX-ANT-002', 'Azithromycin 250mg', 'Azitromicin 250mg', 'Macrolide antibiotic', 'Makrolidni antibiotik', 'Azithromycin',
    @AntibioticsCatId, @PlivaId, 18.90, 12.00, 17.00, '3856789012002', 'Tablet', '250mg', '6 tablets', 'J01FA10',
    1, 0, 350, 80, 150, 1, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Products WHERE SKU = 'RX-ANT-003')
INSERT INTO Products (SKU, Name, NameLocal, Description, DescriptionLocal, GenericName, CategoryId, ManufacturerId, 
    UnitPrice, CostPrice, TaxRate, Barcode, DosageForm, Strength, PackageSize, ATCCode,
    RequiresPrescription, IsControlled, StockQuantity, ReorderLevel, ReorderQuantity, IsFeatured, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('RX-ANT-003', 'Ciprofloxacin 500mg', 'Ciprofloksacin 500mg', 'Fluoroquinolone antibiotic', 'Fluorokinolonski antibiotik', 'Ciprofloxacin',
    @AntibioticsCatId, @KrkaId, 15.75, 10.00, 17.00, '3856789012003', 'Tablet', '500mg', '10 tablets', 'J01MA02',
    1, 0, 280, 60, 120, 0, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Products WHERE SKU = 'RX-ANT-004')
INSERT INTO Products (SKU, Name, NameLocal, Description, DescriptionLocal, GenericName, CategoryId, ManufacturerId, 
    UnitPrice, CostPrice, TaxRate, Barcode, DosageForm, Strength, PackageSize, ATCCode,
    RequiresPrescription, IsControlled, StockQuantity, ReorderLevel, ReorderQuantity, IsFeatured, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('RX-ANT-004', 'Cephalexin 500mg', 'Cefaleksin 500mg', 'First-generation cephalosporin', 'Cefalosporin prve generacije', 'Cephalexin',
    @AntibioticsCatId, @HemofarmId, 14.25, 9.00, 17.00, '3856789012004', 'Capsule', '500mg', '16 capsules', 'J01DB01',
    1, 0, 420, 90, 180, 0, NULL, 1, 0, @Now, 'Seed');

-- =============================================
-- PRESCRIPTION MEDICINES - CARDIOVASCULAR
-- =============================================
PRINT 'Seeding Cardiovascular products...';

IF NOT EXISTS (SELECT 1 FROM Products WHERE SKU = 'RX-CVD-001')
INSERT INTO Products (SKU, Name, NameLocal, Description, DescriptionLocal, GenericName, CategoryId, ManufacturerId, 
    UnitPrice, CostPrice, TaxRate, Barcode, DosageForm, Strength, PackageSize, ATCCode,
    RequiresPrescription, IsControlled, StockQuantity, ReorderLevel, ReorderQuantity, IsFeatured, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('RX-CVD-001', 'Atorvastatin 20mg', 'Atorvastatin 20mg', 'Cholesterol-lowering statin', 'Statin za snižavanje holesterola', 'Atorvastatin',
    @CardiosCatId, @PfizerId, 22.50, 15.00, 17.00, '3856789012101', 'Tablet', '20mg', '30 tablets', 'C10AA05',
    1, 0, 600, 120, 240, 1, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Products WHERE SKU = 'RX-CVD-002')
INSERT INTO Products (SKU, Name, NameLocal, Description, DescriptionLocal, GenericName, CategoryId, ManufacturerId, 
    UnitPrice, CostPrice, TaxRate, Barcode, DosageForm, Strength, PackageSize, ATCCode,
    RequiresPrescription, IsControlled, StockQuantity, ReorderLevel, ReorderQuantity, IsFeatured, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('RX-CVD-002', 'Lisinopril 10mg', 'Lizinopril 10mg', 'ACE inhibitor for hypertension', 'ACE inhibitor za hipertenziju', 'Lisinopril',
    @CardiosCatId, @KrkaId, 16.80, 11.00, 17.00, '3856789012102', 'Tablet', '10mg', '30 tablets', 'C09AA03',
    1, 0, 550, 110, 220, 0, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Products WHERE SKU = 'RX-CVD-003')
INSERT INTO Products (SKU, Name, NameLocal, Description, DescriptionLocal, GenericName, CategoryId, ManufacturerId, 
    UnitPrice, CostPrice, TaxRate, Barcode, DosageForm, Strength, PackageSize, ATCCode,
    RequiresPrescription, IsControlled, StockQuantity, ReorderLevel, ReorderQuantity, IsFeatured, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('RX-CVD-003', 'Amlodipine 5mg', 'Amlodipin 5mg', 'Calcium channel blocker', 'Blokator kalcijskih kanala', 'Amlodipine',
    @CardiosCatId, @NovartisId, 14.50, 9.50, 17.00, '3856789012103', 'Tablet', '5mg', '30 tablets', 'C08CA01',
    1, 0, 480, 100, 200, 0, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Products WHERE SKU = 'RX-CVD-004')
INSERT INTO Products (SKU, Name, NameLocal, Description, DescriptionLocal, GenericName, CategoryId, ManufacturerId, 
    UnitPrice, CostPrice, TaxRate, Barcode, DosageForm, Strength, PackageSize, ATCCode,
    RequiresPrescription, IsControlled, StockQuantity, ReorderLevel, ReorderQuantity, IsFeatured, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('RX-CVD-004', 'Metoprolol 50mg', 'Metoprolol 50mg', 'Beta-blocker for heart conditions', 'Beta-blokator za srčane bolesti', 'Metoprolol',
    @CardiosCatId, @HemofarmId, 11.90, 7.80, 17.00, '3856789012104', 'Tablet', '50mg', '30 tablets', 'C07AB02',
    1, 0, 520, 100, 200, 0, NULL, 1, 0, @Now, 'Seed');

-- =============================================
-- PRESCRIPTION MEDICINES - DIABETES
-- =============================================
PRINT 'Seeding Diabetes products...';

IF NOT EXISTS (SELECT 1 FROM Products WHERE SKU = 'RX-DIA-001')
INSERT INTO Products (SKU, Name, NameLocal, Description, DescriptionLocal, GenericName, CategoryId, ManufacturerId, 
    UnitPrice, CostPrice, TaxRate, Barcode, DosageForm, Strength, PackageSize, ATCCode,
    RequiresPrescription, IsControlled, StockQuantity, ReorderLevel, ReorderQuantity, IsFeatured, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('RX-DIA-001', 'Metformin 850mg', 'Metformin 850mg', 'First-line diabetes medication', 'Lijek prvog izbora za dijabetes', 'Metformin',
    @DiabetesCatId, @BosnalId, 9.90, 6.50, 17.00, '3856789012201', 'Tablet', '850mg', '30 tablets', 'A10BA02',
    1, 0, 700, 140, 280, 1, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Products WHERE SKU = 'RX-DIA-002')
INSERT INTO Products (SKU, Name, NameLocal, Description, DescriptionLocal, GenericName, CategoryId, ManufacturerId, 
    UnitPrice, CostPrice, TaxRate, Barcode, DosageForm, Strength, PackageSize, ATCCode,
    RequiresPrescription, IsControlled, StockQuantity, ReorderLevel, ReorderQuantity, IsFeatured, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('RX-DIA-002', 'Glimepiride 2mg', 'Glimepirid 2mg', 'Sulfonylurea for type 2 diabetes', 'Sulfonilurija za dijabetes tip 2', 'Glimepiride',
    @DiabetesCatId, @SanofiId, 18.50, 12.00, 17.00, '3856789012202', 'Tablet', '2mg', '30 tablets', 'A10BB12',
    1, 0, 380, 80, 160, 0, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Products WHERE SKU = 'RX-DIA-003')
INSERT INTO Products (SKU, Name, NameLocal, Description, DescriptionLocal, GenericName, CategoryId, ManufacturerId, 
    UnitPrice, CostPrice, TaxRate, Barcode, DosageForm, Strength, PackageSize, ATCCode,
    RequiresPrescription, IsControlled, StockQuantity, ReorderLevel, ReorderQuantity, IsFeatured, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('RX-DIA-003', 'Insulin Glargine 100U/ml', 'Inzulin Glargin 100U/ml', 'Long-acting insulin', 'Dugodjelujući inzulin', 'Insulin Glargine',
    @DiabetesCatId, @SanofiId, 85.00, 55.00, 17.00, '3856789012203', 'Injection', '100U/ml', '5 x 3ml pens', 'A10AE04',
    1, 1, 150, 30, 60, 1, NULL, 1, 0, @Now, 'Seed');

-- =============================================
-- OTC MEDICINES - PAIN RELIEF
-- =============================================
PRINT 'Seeding Pain Relief products...';

IF NOT EXISTS (SELECT 1 FROM Products WHERE SKU = 'OTC-PAN-001')
INSERT INTO Products (SKU, Name, NameLocal, Description, DescriptionLocal, GenericName, CategoryId, ManufacturerId, 
    UnitPrice, CostPrice, TaxRate, Barcode, DosageForm, Strength, PackageSize, ATCCode,
    RequiresPrescription, IsControlled, StockQuantity, ReorderLevel, ReorderQuantity, IsFeatured, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('OTC-PAN-001', 'Ibuprofen 400mg', 'Ibuprofen 400mg', 'NSAID pain reliever', 'NSAID analgetik', 'Ibuprofen',
    @PainCatId, @BosnalId, 6.50, 4.00, 17.00, '3856789012301', 'Tablet', '400mg', '20 tablets', 'M01AE01',
    0, 0, 1200, 200, 400, 1, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Products WHERE SKU = 'OTC-PAN-002')
INSERT INTO Products (SKU, Name, NameLocal, Description, DescriptionLocal, GenericName, CategoryId, ManufacturerId, 
    UnitPrice, CostPrice, TaxRate, Barcode, DosageForm, Strength, PackageSize, ATCCode,
    RequiresPrescription, IsControlled, StockQuantity, ReorderLevel, ReorderQuantity, IsFeatured, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('OTC-PAN-002', 'Paracetamol 500mg', 'Paracetamol 500mg', 'Analgesic and antipyretic', 'Analgetik i antipiretik', 'Paracetamol',
    @PainCatId, @HemofarmId, 4.50, 2.80, 17.00, '3856789012302', 'Tablet', '500mg', '20 tablets', 'N02BE01',
    0, 0, 1500, 250, 500, 1, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Products WHERE SKU = 'OTC-PAN-003')
INSERT INTO Products (SKU, Name, NameLocal, Description, DescriptionLocal, GenericName, CategoryId, ManufacturerId, 
    UnitPrice, CostPrice, TaxRate, Barcode, DosageForm, Strength, PackageSize, ATCCode,
    RequiresPrescription, IsControlled, StockQuantity, ReorderLevel, ReorderQuantity, IsFeatured, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('OTC-PAN-003', 'Aspirin 500mg', 'Aspirin 500mg', 'Pain relief and blood thinner', 'Protiv bolova i razrjeđivač krvi', 'Acetylsalicylic Acid',
    @PainCatId, @BayerId, 5.90, 3.70, 17.00, '3856789012303', 'Tablet', '500mg', '20 tablets', 'N02BA01',
    0, 0, 900, 180, 360, 0, NULL, 1, 0, @Now, 'Seed');

-- =============================================
-- OTC MEDICINES - COLD & FLU
-- =============================================
PRINT 'Seeding Cold & Flu products...';

IF NOT EXISTS (SELECT 1 FROM Products WHERE SKU = 'OTC-CFL-001')
INSERT INTO Products (SKU, Name, NameLocal, Description, DescriptionLocal, GenericName, CategoryId, ManufacturerId, 
    UnitPrice, CostPrice, TaxRate, Barcode, DosageForm, Strength, PackageSize, ATCCode,
    RequiresPrescription, IsControlled, StockQuantity, ReorderLevel, ReorderQuantity, IsFeatured, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('OTC-CFL-001', 'Cold & Flu Relief', 'Prehlada i Gripa', 'Multi-symptom cold relief', 'Olakšanje simptoma prehlade', 'Combination',
    @ColdFluCatId, @JnJId, 8.90, 5.50, 17.00, '3856789012401', 'Tablet', 'Multi', '12 tablets', 'R05X',
    0, 0, 800, 160, 320, 1, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Products WHERE SKU = 'OTC-CFL-002')
INSERT INTO Products (SKU, Name, NameLocal, Description, DescriptionLocal, GenericName, CategoryId, ManufacturerId, 
    UnitPrice, CostPrice, TaxRate, Barcode, DosageForm, Strength, PackageSize, ATCCode,
    RequiresPrescription, IsControlled, StockQuantity, ReorderLevel, ReorderQuantity, IsFeatured, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('OTC-CFL-002', 'Vitamin C 1000mg', 'Vitamin C 1000mg', 'Immune system support', 'Podrška imunološkom sistemu', 'Ascorbic Acid',
    @ColdFluCatId, @BosnalId, 7.50, 4.80, 17.00, '3856789012402', 'Effervescent', '1000mg', '20 tablets', 'A11GA01',
    0, 0, 1100, 220, 440, 1, NULL, 1, 0, @Now, 'Seed');

-- =============================================
-- OTC MEDICINES - ALLERGIES
-- =============================================
PRINT 'Seeding Allergy products...';

IF NOT EXISTS (SELECT 1 FROM Products WHERE SKU = 'OTC-ALG-001')
INSERT INTO Products (SKU, Name, NameLocal, Description, DescriptionLocal, GenericName, CategoryId, ManufacturerId, 
    UnitPrice, CostPrice, TaxRate, Barcode, DosageForm, Strength, PackageSize, ATCCode,
    RequiresPrescription, IsControlled, StockQuantity, ReorderLevel, ReorderQuantity, IsFeatured, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('OTC-ALG-001', 'Cetirizine 10mg', 'Cetirizin 10mg', 'Non-drowsy antihistamine', 'Antihistaminik bez pospanosti', 'Cetirizine',
    @AllergyCatId, @KrkaId, 9.20, 6.00, 17.00, '3856789012501', 'Tablet', '10mg', '20 tablets', 'R06AE07',
    0, 0, 650, 130, 260, 0, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Products WHERE SKU = 'OTC-ALG-002')
INSERT INTO Products (SKU, Name, NameLocal, Description, DescriptionLocal, GenericName, CategoryId, ManufacturerId, 
    UnitPrice, CostPrice, TaxRate, Barcode, DosageForm, Strength, PackageSize, ATCCode,
    RequiresPrescription, IsControlled, StockQuantity, ReorderLevel, ReorderQuantity, IsFeatured, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('OTC-ALG-002', 'Loratadine 10mg', 'Loratadin 10mg', '24-hour allergy relief', '24-satno olakšanje alergije', 'Loratadine',
    @AllergyCatId, @BayerId, 10.50, 6.80, 17.00, '3856789012502', 'Tablet', '10mg', '30 tablets', 'R06AX13',
    0, 0, 580, 120, 240, 1, NULL, 1, 0, @Now, 'Seed');

-- =============================================
-- SUPPLEMENTS - VITAMINS
-- =============================================
PRINT 'Seeding Vitamin products...';

IF NOT EXISTS (SELECT 1 FROM Products WHERE SKU = 'SUP-VIT-001')
INSERT INTO Products (SKU, Name, NameLocal, Description, DescriptionLocal, GenericName, CategoryId, ManufacturerId, 
    UnitPrice, CostPrice, TaxRate, Barcode, DosageForm, Strength, PackageSize, ATCCode,
    RequiresPrescription, IsControlled, StockQuantity, ReorderLevel, ReorderQuantity, IsFeatured, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('SUP-VIT-001', 'Multivitamin Complete', 'Multivitamin Komplet', 'Daily multivitamin supplement', 'Dnevni multivitaminski dodatak', 'Multivitamin',
    @VitaminsCatId, @BosnalId, 15.90, 10.00, 17.00, '3856789012601', 'Tablet', 'Multi', '60 tablets', 'A11AA',
    0, 0, 450, 90, 180, 1, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Products WHERE SKU = 'SUP-VIT-002')
INSERT INTO Products (SKU, Name, NameLocal, Description, DescriptionLocal, GenericName, CategoryId, ManufacturerId, 
    UnitPrice, CostPrice, TaxRate, Barcode, DosageForm, Strength, PackageSize, ATCCode,
    RequiresPrescription, IsControlled, StockQuantity, ReorderLevel, ReorderQuantity, IsFeatured, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('SUP-VIT-002', 'Vitamin D3 1000IU', 'Vitamin D3 1000IU', 'Vitamin D3 supplement', 'Dodatak vitamina D3', 'Cholecalciferol',
    @VitaminsCatId, @KrkaId, 12.50, 8.00, 17.00, '3856789012602', 'Softgel', '1000IU', '90 capsules', 'A11CC05',
    0, 0, 520, 100, 200, 1, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Products WHERE SKU = 'SUP-VIT-003')
INSERT INTO Products (SKU, Name, NameLocal, Description, DescriptionLocal, GenericName, CategoryId, ManufacturerId, 
    UnitPrice, CostPrice, TaxRate, Barcode, DosageForm, Strength, PackageSize, ATCCode,
    RequiresPrescription, IsControlled, StockQuantity, ReorderLevel, ReorderQuantity, IsFeatured, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('SUP-VIT-003', 'Vitamin B Complex', 'Vitamin B Kompleks', 'B vitamin complex supplement', 'Kompleks vitamina B', 'B Complex',
    @VitaminsCatId, @HemofarmId, 11.90, 7.50, 17.00, '3856789012603', 'Tablet', 'Multi', '60 tablets', 'A11EA',
    0, 0, 400, 80, 160, 0, NULL, 1, 0, @Now, 'Seed');

-- =============================================
-- MEDICAL DEVICES - DIAGNOSTIC
-- =============================================
PRINT 'Seeding Diagnostic Equipment products...';

IF NOT EXISTS (SELECT 1 FROM Products WHERE SKU = 'DEV-DIA-001')
INSERT INTO Products (SKU, Name, NameLocal, Description, DescriptionLocal, GenericName, CategoryId, ManufacturerId, 
    UnitPrice, CostPrice, TaxRate, Barcode, DosageForm, Strength, PackageSize, ATCCode,
    RequiresPrescription, IsControlled, StockQuantity, ReorderLevel, ReorderQuantity, IsFeatured, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('DEV-DIA-001', 'Blood Glucose Monitor', 'Glukometar', 'Digital blood glucose meter', 'Digitalni mjerač glukoze u krvi', 'Glucose Monitor',
    @DiagCatId, @RocheId, 45.00, 30.00, 17.00, '3856789012701', 'Device', 'N/A', '1 unit', NULL,
    0, 0, 80, 20, 40, 1, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Products WHERE SKU = 'DEV-DIA-002')
INSERT INTO Products (SKU, Name, NameLocal, Description, DescriptionLocal, GenericName, CategoryId, ManufacturerId, 
    UnitPrice, CostPrice, TaxRate, Barcode, DosageForm, Strength, PackageSize, ATCCode,
    RequiresPrescription, IsControlled, StockQuantity, ReorderLevel, ReorderQuantity, IsFeatured, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('DEV-DIA-002', 'Blood Pressure Monitor', 'Tlakomjer', 'Automatic blood pressure monitor', 'Automatski mjerač krvnog tlaka', 'BP Monitor',
    @DiagCatId, @JnJId, 55.00, 35.00, 17.00, '3856789012702', 'Device', 'N/A', '1 unit', NULL,
    0, 0, 65, 15, 30, 1, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Products WHERE SKU = 'DEV-DIA-003')
INSERT INTO Products (SKU, Name, NameLocal, Description, DescriptionLocal, GenericName, CategoryId, ManufacturerId, 
    UnitPrice, CostPrice, TaxRate, Barcode, DosageForm, Strength, PackageSize, ATCCode,
    RequiresPrescription, IsControlled, StockQuantity, ReorderLevel, ReorderQuantity, IsFeatured, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('DEV-DIA-003', 'Glucose Test Strips', 'Trake za glukometar', 'Blood glucose test strips', 'Trake za mjerenje glukoze', 'Test Strips',
    @DiagCatId, @RocheId, 25.00, 16.00, 17.00, '3856789012703', 'Strips', 'N/A', '50 strips', NULL,
    0, 0, 300, 60, 120, 0, NULL, 1, 0, @Now, 'Seed');

-- =============================================
-- MEDICAL DEVICES - FIRST AID
-- =============================================
PRINT 'Seeding First Aid products...';

IF NOT EXISTS (SELECT 1 FROM Products WHERE SKU = 'DEV-FAD-001')
INSERT INTO Products (SKU, Name, NameLocal, Description, DescriptionLocal, GenericName, CategoryId, ManufacturerId, 
    UnitPrice, CostPrice, TaxRate, Barcode, DosageForm, Strength, PackageSize, ATCCode,
    RequiresPrescription, IsControlled, StockQuantity, ReorderLevel, ReorderQuantity, IsFeatured, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('DEV-FAD-001', 'First Aid Kit Standard', 'Komplet prve pomoći', 'Complete first aid kit', 'Kompletan komplet prve pomoći', 'First Aid Kit',
    @FirstAidCatId, @JnJId, 35.00, 22.00, 17.00, '3856789012801', 'Kit', 'N/A', '1 kit', NULL,
    0, 0, 120, 25, 50, 1, NULL, 1, 0, @Now, 'Seed');

IF NOT EXISTS (SELECT 1 FROM Products WHERE SKU = 'DEV-FAD-002')
INSERT INTO Products (SKU, Name, NameLocal, Description, DescriptionLocal, GenericName, CategoryId, ManufacturerId, 
    UnitPrice, CostPrice, TaxRate, Barcode, DosageForm, Strength, PackageSize, ATCCode,
    RequiresPrescription, IsControlled, StockQuantity, ReorderLevel, ReorderQuantity, IsFeatured, ImageUrl, IsActive, IsDeleted, CreatedAt, CreatedBy)
VALUES ('DEV-FAD-002', 'Bandage Assortment', 'Asortiman flastera', 'Assorted adhesive bandages', 'Razni ljepljivi flasteri', 'Bandages',
    @FirstAidCatId, @JnJId, 8.50, 5.00, 17.00, '3856789012802', 'Bandages', 'N/A', '50 pieces', NULL,
    0, 0, 500, 100, 200, 0, NULL, 1, 0, @Now, 'Seed');

PRINT 'Products seeded successfully.';
PRINT 'Part 4 completed!';
GO
