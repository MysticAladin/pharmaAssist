# PharmaAssist Database Seed Scripts

This folder contains SQL scripts to populate the PharmaAssist database with test data for development and demonstration purposes.

## ⚠️ Important: Password Setup

All test users share the same password: **`test123`**

### Before Running Scripts:

1. **Register one user** via the application with password `test123`
2. **Get the password hash**:
   ```sql
   SELECT PasswordHash FROM AspNetUsers WHERE Email = 'your-registered-email@example.com'
   ```
3. **Update the script**: Open `SeedData_01_Roles_Users.sql` and replace:
   ```sql
   DECLARE @PasswordHash NVARCHAR(MAX) = 'REPLACE_WITH_ACTUAL_HASH_FROM_REGISTERED_USER';
   ```
   With your actual hash.

## 🗑️ Data Cleanup

**These scripts DELETE all existing data** (except the SuperAdmin user) before inserting new seed data. This ensures a clean, consistent state for development/testing.

Preserved data:
- SuperAdmin user and role

## Quick Start

### Option 1: Run All Parts Using SQLCMD
```powershell
sqlcmd -S your-server -d PharmaAssist -i SeedData_00_Master.sql
```

### Option 2: Run Individual Parts in SSMS
Run each script in order from `SeedData_01_*` to `SeedData_09_*` in SQL Server Management Studio.

## Scripts Overview

| Script | Description |
|--------|-------------|
| `SeedData_00_Master.sql` | Master script that runs all parts in order (requires SQLCMD mode) |
| `SeedData_01_Roles_Users.sql` | Creates roles and user accounts |
| `SeedData_02_Geography.sql` | BiH geographic data (Entities, Cantons, Municipalities, Cities) |
| `SeedData_03_Manufacturers_Categories.sql` | Product manufacturers and categories |
| `SeedData_04_Products.sql` | 25+ pharmaceutical products across categories |
| `SeedData_05_Customers.sql` | Customers with headquarters/branch hierarchy |
| `SeedData_06_Warehouses_Inventory.sql` | Warehouses and inventory stock |
| `SeedData_07_Orders.sql` | Historical orders (last 6 months) |
| `SeedData_08_OrderItems.sql` | Order line items |
| `SeedData_09_FeatureFlags_Promotions.sql` | Feature flags and promotions |

## Test User Accounts

All users have the password: **`test123`**

| Email | Role | Description |
|-------|------|-------------|
| `super.admin@pharmaassist.com` | SuperAdmin | Full system access, manages all clients |
| `admin.user@pharmaassist.com` | Admin | Client administrator |
| `manager.user@pharmaassist.com` | Manager | Sales and operations oversight |
| `pharmacist.user@pharmaassist.com` | Pharmacist | Prescription and controlled substance handling |
| `salesrep.user@pharmaassist.com` | SalesRep | Customer relationship management |
| `warehouse.user@pharmaassist.com` | Warehouse | Inventory and shipping |
| `customer.user@pharmaassist.com` | Customer | Portal access for ordering |

> **Note:** You must set the password hash in `SeedData_01_Roles_Users.sql` before running.
> See the "Password Setup" section above.

## Data Summary

After running all scripts, you'll have:

- **Users**: 7 (one per role)
- **Roles**: 7 (SuperAdmin, Admin, Manager, Pharmacist, SalesRep, Warehouse, Customer)
- **BiH Entities**: 3 (Federation, RS, Brčko District)
- **Cantons/Regions**: 15
- **Municipalities**: 11
- **Cities**: 6 (Sarajevo, Tuzla, Zenica, Mostar, Banja Luka, Bijeljina)
- **Manufacturers**: 10 (Bosnalijek, Hemofarm, Pliva, Krka, Pfizer, etc.)
- **Categories**: 20+ hierarchical categories
- **Products**: 25+ pharmaceutical products
- **Customers**: 11 (5 headquarters + 5 branches + 1 small)
- **Customer Types**: Pharmacy, Hospital, Clinic
- **Customer Tiers**: Enterprise (1), Professional (2), Basic (3)
- **Warehouses**: 4 (Sarajevo Main, Sarajevo Cold, Tuzla, Banja Luka)
- **Orders**: 60-100 orders spanning the last 6 months
- **Order Items**: 3-7 items per order
- **Feature Flags**: 15+ system and client-level flags
- **Promotions**: 3 active promotions

## Customer Hierarchy

```
├── CUST-HQ-001: Apoteka Sarajevo d.o.o. (Tier 1 - Enterprise)
│   ├── CUST-BR-001: Apoteka Sarajevo - Centar
│   ├── CUST-BR-002: Apoteka Sarajevo - Ilidža
│   └── CUST-BR-003: Apoteka Sarajevo - Novo Sarajevo
├── CUST-HQ-002: Tuzla Farmacija d.o.o. (Tier 1 - Enterprise)
│   ├── CUST-BR-004: Tuzla Farmacija - Centar
│   └── CUST-BR-005: Tuzla Farmacija - Lukavac
├── CUST-HQ-003: Klinički Centar Sarajevo (Tier 1 - Hospital)
├── CUST-HQ-004: Zenica Ljekarna d.o.o. (Tier 2 - Professional)
├── CUST-HQ-005: Mostar Medical Centar (Tier 2 - Clinic)
├── CUST-SM-001: Apoteka Zdravlje (Tier 3 - Basic)
└── CUST-RS-001: Apoteka Banja Luka d.o.o. (Tier 2 - RS)
```

## Feature Flags

### Core Features (always enabled)
- `dashboard` - Main dashboard
- `orders` - Order management
- `products` - Product catalog
- `customers` - Customer management

### Premium Features (tier-locked, client-overridable)
- `reports` - Advanced reporting
- `reportBuilder` - Custom report builder
- `tenders` - Tender management
- `budgets` - Budget management
- `claims` - Claims processing
- `promotions` - Promotional campaigns
- `inventory` - Inventory management

### Experimental Features (disabled by default)
- `aiAssistant` - AI-powered assistant
- `predictiveOrdering` - Predictive ordering

### UI Features
- `darkMode` - Dark theme
- `compactView` - Compact table views

## Notes

1. Scripts are idempotent - they check for existing records before inserting
2. All entities have proper audit fields (CreatedAt, CreatedBy)
3. Order data spans the last 6 months with various statuses for reporting
4. Geographic data includes both Federation and RS entities
5. Products include both prescription and OTC medicines

## Troubleshooting

### Password Issues
If users can't log in, the password hash needs to be regenerated. Options:
1. Use the application's registration endpoint
2. Reset password through forgot password flow
3. Update the hash using a generated value from your application

### Missing Data
Run scripts in order (01 through 09) as they have dependencies on each other.

### Foreign Key Errors
Ensure you run the scripts in the correct order, as later scripts depend on data from earlier ones.
