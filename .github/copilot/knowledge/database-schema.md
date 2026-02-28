# Database Schema

## Entity Overview

The domain model is defined in `server/src/Domain/Entities/` and mapped via Entity Framework Core in `Infrastructure/Data/ApplicationDbContext.cs`. All entities inherit from `BaseEntity` which provides `Id` (Guid), `CreatedAt`, `UpdatedAt`, `CreatedBy`, and `UpdatedBy`.

### Core Entities

| Entity | File | Description |
|--------|------|-------------|
| `Product` | Product.cs | Pharmaceutical product with ATC code, dosage, strength, prescription type, storage conditions |
| `ProductBatch` | ProductBatch.cs | Batch/lot tracking with batch number, manufacture date, expiry date, stock quantity |
| `Category` | Category.cs | Hierarchical product categories (with slug, ParentCategoryId) |
| `Manufacturer` | Manufacturer.cs | Drug manufacturers |
| `Customer` | Customer.cs | Pharmacy/hospital/wholesale customer with type, tier, and ParentCustomerId |
| `CustomerAddress` | CustomerAddress.cs | Multiple addresses per customer (Billing, Shipping, Both) |
| `Order` | Order.cs | Order with status workflow, payment tracking, customer/rep associations |
| `OrderItem` | OrderItem.cs | Line items with quantity, unit price, discount, batch reference |
| `OrderTemplate` | OrderTemplate.cs | Saved order templates for quick reordering |
| `Prescription` | Prescription.cs | Prescription upload with verification workflow |
| `InventoryStock` | InventoryStock.cs | Current stock levels per product per warehouse |
| `StockMovement` | StockMovement.cs | Stock movement history (in, out, adjustment, return, expired, transfer) |
| `Warehouse` | Warehouse.cs | Warehouse/storage location |
| `Claim` | Claim.cs | Return/claim ("reklamacija") with type and status workflow |
| `FileAttachment` | FileAttachment.cs | Uploaded file metadata |

### Sales Force Entities

| Entity | File | Description |
|--------|------|-------------|
| `SalesRepresentative` | SalesRepresentative.cs | Sales rep with type (Commercial/Medical), status, territory, linked ApplicationUser |
| `SalesTarget` | SalesTarget.cs | Sales targets/quotas for reps |
| `AnnualPlan` | AnnualPlan.cs | Annual visit/sales planning |
| `QuarterlyPlan` | QuarterlyPlan.cs | Quarterly breakdown of annual plan |
| `MonthlyPlan` | MonthlyPlan.cs | Monthly breakdown of quarterly plan |
| `VisitPlan` | VisitPlan.cs | Weekly visit plan with approval workflow |
| `PlannedVisit` | PlannedVisit.cs | Scheduled visit within a plan |
| `ExecutedVisit` | ExecutedVisit.cs | Actual visit execution with GPS coordinates, check-in/check-out times |
| `VisitNote` | VisitNote.cs | Notes recorded during visits (Discussion, Issue, Opportunity, Complaint) |
| `VisitAttachment` | VisitAttachment.cs | Photos/files attached during visits |
| `RepCustomerAssignment` | RepCustomerAssignment.cs | Rep-to-customer assignment (RepId, CustomerId, AssignmentDate, IsActive) |
| `RepManagerAssignment` | RepManagerAssignment.cs | Rep-to-manager assignment (RepId, ManagerUserId, AssignmentDate, IsActive, IsPrimary) |

### Pricing & Promotions

| Entity | File | Description |
|--------|------|-------------|
| `ProductPrice` | ProductPrice.cs | Product pricing with type (Commercial/Essential) |
| `PriceRule` | PriceRule.cs | Dynamic pricing rules by customer type/tier |
| `Promotion` | Promotion.cs | Promotions with discount types, eligibility, stacking rules |
| `Budget` | Budget.cs | Budget tracking for promotions/departments |

### Tender Management

| Entity | File | Description |
|--------|------|-------------|
| `Tender` | Tender.cs | Tender/bid tracking for institutional procurement |

### Identity & Auth

| Entity | File | Description |
|--------|------|-------------|
| `ApplicationUser` | ApplicationUser.cs | Custom Identity user (extends IdentityUser) |
| `ApplicationRole` | ApplicationRole.cs | Custom Identity role (extends IdentityRole) |
| `Permission` | Permission.cs | Granular permission definition |
| `RolePermission` | RolePermission.cs | Permission-to-role mappings |
| `RefreshToken` | RefreshToken.cs | JWT refresh tokens with expiry and revocation |

### Feature Flags

| Entity | File | Description |
|--------|------|-------------|
| `SystemFeatureFlag` | SystemFeatureFlag.cs | Global system-wide feature flags |
| `ClientFeatureFlag` | ClientFeatureFlag.cs | Per-customer/pharmacy feature overrides |
| `FeatureFlagHistory` | FeatureFlagHistory.cs | Change history for feature flags |

### System & Logging

| Entity | File | Description |
|--------|------|-------------|
| `AuditLog` | AuditLog.cs | Audit trail (entity, action, old/new values, user, timestamp) |
| `EmailLog` | EmailLog.cs | Email send history with retry tracking |
| `NotificationEmailRecipient` | NotificationEmailRecipient.cs | Configurable notification recipients |
| `SavedReport` | SavedReport.cs | Saved report configurations for Report Builder (name, data source, JSON config, sharing, templates) |

### BiH Geography

| Entity | File | Description |
|--------|------|-------------|
| `BiHEntity` | (Location entities) | FBiH, RS, Brčko District |
| `Canton` | Canton.cs | 10 FBiH cantons + RS regions |
| `Municipality` | Municipality.cs | BiH municipalities |
| `City` | City.cs | Cities and settlements |

---

## Enums

All enums are defined in `server/src/Domain/Enums/Enums.cs`:

| Enum | Values | Usage |
|------|--------|-------|
| `CustomerType` | Retail=1, Pharmacy=2, Hospital=3, Wholesale=4, Clinic=5, Other=99 | Customer classification |
| `CustomerTier` | A=1 (>10K KM), B=2 (5-10K KM), C=3 (<5K KM) | Purchase volume tier |
| `AddressType` | Billing=1, Shipping=2, Both=3 | Address purpose |
| `OrderStatus` | Pending→Confirmed→Processing→ReadyForShipment→Shipped→Delivered, Cancelled, Returned | Order lifecycle |
| `PaymentStatus` | Pending=1, PartiallyPaid=2, Paid=3, Refunded=4, Failed=5 | Payment tracking |
| `PaymentMethod` | Cash=1, CashOnDelivery=2, BankTransfer=3, CreditCard=4, Invoice=5 | How customer pays |
| `StockMovementType` | In=1, Out=2, Adjustment=3, Return=4, Expired=5, Transfer=6 | Stock movement reason |
| `PrescriptionStatus` | Pending=1, Verified=2, Rejected=3, Expired=4 | Rx verification |
| `PrescriptionType` | None=0 (OTC), Required=1, Controlled=2 | Prescription requirement |
| `ProductStatus` | Active=1, Inactive=2, Discontinued=3, OutOfStock=4, ComingSoon=5 | Product availability |
| `StorageCondition` | RoomTemperature=1, Refrigerated=2, Frozen=3, ProtectFromLight=4, ControlledRoom=5 | Storage requirements |
| `ClaimType` | Return=1, Exchange=2, Refund=3, Damaged=4, WrongProduct=5, Expired=6, QualityIssue=7 | Claim/return reason |
| `ClaimStatus` | Submitted→UnderReview→Approved/Rejected→AwaitingReturn→ReturnReceived→Resolved, Cancelled | Claim workflow |
| `BiHEntityType` | FederacijaBiH=1, RepublikaSrpska=2, BrckoDstrikt=3 | BiH administrative entity |
| `FlagScope` | System=1, Client=2 | Feature flag scope |
| `FlagType` | Boolean=1, String=2, Number=3, Json=4, Percentage=5 | Feature flag value type |
| `FlagCategory` | Portal=1, Billing=2, Inventory=3, Orders=4, Reports=5, Integration=6, UI=7, Experimental=8 | Flag organization |
| `PriceType` | Commercial=1, Essential=2 | BiH pricing classification |
| `RepresentativeType` | Commercial=1, Medical=2 | Sales rep specialization |
| `RepresentativeStatus` | Active=1, Inactive=2, OnLeave=3, Terminated=4 | Rep status |
| `VisitPlanStatus` | Draft→Submitted→Approved/Rejected→InProgress→Completed | Planning workflow |
| `VisitType` | Planned=1, AdHoc=2 | Visit classification |
| `VisitOutcome` | Positive=1, Neutral=2, Negative=3 | Visit result |
| `VisitNoteType` | Discussion=1, Issue=2, Opportunity=3, Complaint=4, Other=5 | Note categorization |
| `NotificationEmailType` | OrderPlacedInternal=1 | Email notification triggers |
| `ReportDataSource` | Orders=1, Products=2, Customers=3, Inventory=4, Prescriptions=5, Financial=6 | Report Builder data source |

---

## Key Relationships

```
Product ──< ProductBatch (1:many - batches per product)
Product ──< OrderItem (1:many - items in orders)
Product ──< InventoryStock (1:many - stock per warehouse)
Product ──< ProductPrice (1:many - pricing variants)
Product >── Category (many:1)
Product >── Manufacturer (many:1)

Customer ──< Order (1:many)
Customer ──< CustomerAddress (1:many)
Customer ──< ClientFeatureFlag (1:many - per-customer flags)
Customer >── Customer (self-referencing parent-child for pharmacy chains)

Order ──< OrderItem (1:many)
Order >── Customer (many:1)
Order >── Prescription (many:1, optional)
Order >── SalesRepresentative (many:1, optional - for rep orders)

SalesRepresentative >── ApplicationUser (1:1)
SalesRepresentative ──< VisitPlan (1:many)
SalesRepresentative ──< SalesTarget (1:many)
SalesRepresentative ──< AnnualPlan (1:many)
SalesRepresentative ──< RepCustomerAssignment >── Customer (many-to-many via assignment)
SalesRepresentative ──< RepManagerAssignment >── ApplicationUser (many-to-many rep-manager)

VisitPlan ──< PlannedVisit (1:many)
PlannedVisit ──< ExecutedVisit (1:many)
ExecutedVisit ──< VisitNote (1:many)
ExecutedVisit ──< VisitAttachment (1:many)

AnnualPlan ──< QuarterlyPlan (1:many)
QuarterlyPlan ──< MonthlyPlan (1:many)

ApplicationRole ──< RolePermission (1:many)
RolePermission >── Permission (many:1)

Warehouse ──< InventoryStock (1:many)
InventoryStock ──< StockMovement (1:many)

Canton >── BiHEntity (many:1)
Municipality >── Canton (many:1)
City >── Municipality (many:1)
```

---

## Migrations

Migrations are in `server/src/Infrastructure/Migrations/` and span from November 2025 to January 2026. On startup, `Program.cs` automatically applies pending migrations and seeds initial data (default admin user, BiH geographic data, demo products/categories/manufacturers).

### Notable Migrations

- `InitialCreate` — Core schema (Users, Products, Orders, Customers, Inventory)
- `AddAuditLog` — Audit trail table
- `AddBatchTracking` — ProductBatch with expiry tracking
- `AddCustomerHierarchy` — ParentCustomerId for pharmacy chains
- `AddSalesRep*` — Sales representative, visit planning, targets
- `AddFeatureFlags` — System and client feature flags
- `AddTenders` — Tender management
- `AddPromotions` — Promotion engine
- `AddPlanningHierarchy` — Annual/Quarterly/Monthly plans
