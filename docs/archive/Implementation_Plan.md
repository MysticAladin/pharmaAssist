# PharmaAssist Implementation Plan

## Project Overview

**Target Market:** Bosnia and Herzegovina (BiH)
**Primary Language:** English (with Bosnian localization planned)

**Focus Areas (Phase 1):**
1. **Administration Portal** - Complete back-office management system
2. **E-Pharmacy Portal** - Customer-facing online pharmacy

**Deferred to Future Phases:**
- Mobile app for sales representatives
- Budget management
- Advanced reporting & analytics

---

## Phase 1: Core Foundation

### 1.1 Authentication & Authorization
**Priority:** Critical | **Estimated:** 3-4 days

| Task | Description | Status |
|------|-------------|--------|
| JWT Authentication | Token-based auth with refresh tokens | ⬜ |
| Role-based Authorization | Admin, Manager, Pharmacist, Customer roles | ⬜ |
| User Registration | Customer self-registration with email verification | ⬜ |
| Password Reset | Forgot password flow with email | ⬜ |
| Login/Logout | Secure login with session management | ⬜ |
| Profile Management | User profile CRUD operations | ⬜ |

**Entities:**
- `ApplicationUser` ✅ (Created)
- `ApplicationRole` ✅ (Created)
- `RefreshToken`

---

## Phase 2: Administration Portal

### 2.1 Product Management
**Priority:** High | **Estimated:** 5-6 days

| Task | Description | Status |
|------|-------------|--------|
| Product Categories | Hierarchical category management | ⬜ |
| Products CRUD | Full product management with variants | ⬜ |
| Manufacturers | Manufacturer/brand management | ⬜ |
| Pricing | Price lists, discounts, promotions | ⬜ |
| Product Images | Image upload and management | ⬜ |
| Product Search | Full-text search with filters | ⬜ |

**Entities:**
```
Category
├── Id, Name, Description, ParentCategoryId
├── ImageUrl, IsActive, DisplayOrder
└── Products (navigation)

Product
├── Id, Name, GenericName, Description
├── SKU, Barcode, CategoryId, ManufacturerId
├── UnitPrice, CostPrice, TaxRate
├── RequiresPrescription, IsControlled
├── StockQuantity, ReorderLevel, ReorderQuantity
├── IsActive, ImageUrl
└── CreatedAt, UpdatedAt, CreatedBy, UpdatedBy

Manufacturer
├── Id, Name, Description
├── ContactEmail, ContactPhone
├── Address, Country
├── IsActive
└── Products (navigation)
```

### 2.2 Inventory Management
**Priority:** High | **Estimated:** 4-5 days

| Task | Description | Status |
|------|-------------|--------|
| Stock Levels | Real-time stock tracking | ⬜ |
| Stock Adjustments | Manual adjustments with reasons | ⬜ |
| Stock Transfers | Between locations (future) | ⬜ |
| Low Stock Alerts | Configurable notifications | ⬜ |
| Batch/Lot Tracking | Expiry date management | ⬜ |
| Stock Reports | Inventory valuation, movements | ⬜ |

**Entities:**
```
StockMovement
├── Id, ProductId, MovementType (In/Out/Adjustment)
├── Quantity, BatchNumber, ExpiryDate
├── Reason, Reference (OrderId, etc.)
├── CreatedAt, CreatedBy
└── Product (navigation)

Batch
├── Id, ProductId, BatchNumber
├── ManufactureDate, ExpiryDate
├── Quantity, RemainingQuantity
├── CostPrice
└── Product (navigation)
```

### 2.3 Customer Management
**Priority:** High | **Estimated:** 3-4 days

| Task | Description | Status |
|------|-------------|--------|
| Customer CRUD | Customer profile management | ⬜ |
| Customer Addresses | Multiple delivery addresses | ⬜ |
| Customer Groups | VIP, wholesale, retail segmentation | ⬜ |
| Customer History | Order history, preferences | ⬜ |
| Prescription Records | Customer prescription management | ⬜ |

**Entities:**
```
Customer
├── Id, UserId (FK to ApplicationUser)
├── CustomerCode, CustomerType (Retail/Wholesale)
├── CompanyName (for business customers)
├── TaxId, CreditLimit, PaymentTerms
├── IsActive
└── Addresses, Orders (navigation)

Address
├── Id, CustomerId
├── AddressType (Billing/Shipping)
├── Street, City, MunicipalityId, PostalCode
├── EntityId (FBiH/RS/BD)
├── IsDefault
└── Customer, Municipality, Entity (navigation)
```

### 2.4 Order Management
**Priority:** High | **Estimated:** 5-6 days

| Task | Description | Status |
|------|-------------|--------|
| Order CRUD | Create, view, update orders | ⬜ |
| Order Workflow | Status management (Pending→Processing→Shipped→Delivered) | ⬜ |
| Order Items | Line items with pricing | ⬜ |
| Prescription Validation | Verify prescriptions for controlled items | ⬜ |
| Invoice Generation | Automatic invoice creation | ⬜ |
| Order Notifications | Email/SMS notifications | ⬜ |

**Entities:**
```
Order
├── Id, OrderNumber, CustomerId
├── OrderDate, RequiredDate, ShippedDate
├── Status (Pending/Confirmed/Processing/Shipped/Delivered/Cancelled)
├── ShippingAddressId, BillingAddressId
├── SubTotal, TaxAmount, ShippingAmount, DiscountAmount, TotalAmount
├── PaymentStatus, PaymentMethod
├── Notes, InternalNotes
└── OrderItems, Payments (navigation)

OrderItem
├── Id, OrderId, ProductId, BatchId
├── Quantity, UnitPrice, DiscountPercent
├── TaxRate, LineTotal
├── PrescriptionRequired, PrescriptionId
└── Order, Product (navigation)

Prescription
├── Id, CustomerId, PrescriberName
├── PrescriberLicense, IssueDate, ExpiryDate
├── ImageUrl, IsVerified, VerifiedBy, VerifiedAt
├── Notes
└── Customer, OrderItems (navigation)
```

### 2.5 Bosnia and Herzegovina - Administrative Divisions
**Priority:** Medium | **Estimated:** 1-2 days

| Task | Description | Status |
|------|-------------|--------|
| Entity Master Data | FBiH, Republika Srpska, Brčko District | ⬜ |
| Canton/Region Data | 10 FBiH Cantons + 5 RS Regions | ⬜ |
| Municipality Data | All BiH municipalities | ⬜ |
| City/Settlement Data | Major cities and settlements | ⬜ |
| Postal Codes | BiH postal code validation | ⬜ |
| Shipping Zones | Location-based shipping rates | ⬜ |

**BiH Administrative Structure:**

```
Bosnia and Herzegovina
├── Federation of BiH (FBiH)
│   ├── Unsko-sanski kanton (USK)
│   ├── Posavski kanton (PK)
│   ├── Tuzlanski kanton (TK)
│   ├── Zeničko-dobojski kanton (ZDK)
│   ├── Bosansko-podrinjski kanton (BPK)
│   ├── Srednjobosanski kanton (SBK)
│   ├── Hercegovačko-neretvanski kanton (HNK)
│   ├── Zapadnohercegovački kanton (ZHK)
│   ├── Kanton Sarajevo (KS)
│   └── Kanton 10 / Livanjski (K10)
│
├── Republika Srpska (RS)
│   ├── Banja Luka Region (BL)
│   ├── Doboj Region (DO)
│   ├── Bijeljina Region (BN)
│   ├── Istočno Sarajevo Region (IS)
│   └── Trebinje Region (TB)
│
└── Brčko District (BD)
```

**Entities:**
```
Entity (Entitet)
├── Id, Code (FBIH, RS, BD)
├── Name, NameLocal
├── IsActive
└── Cantons (navigation)

Canton (Kanton/Region)
├── Id, Code (USK, TK, KS, BL, etc.)
├── Name, NameLocal
├── EntityId
├── IsActive
└── Entity, Municipalities (navigation)

Municipality (Općina/Opština)
├── Id, Code
├── Name, NameLocal
├── CantonId
├── PostalCode
├── IsActive
└── Canton, Cities (navigation)

City (Grad/Naselje)
├── Id, Name, NameLocal
├── MunicipalityId
├── PostalCode
├── IsActive
└── Municipality (navigation)
```

### 2.6 Settings & Configuration
**Priority:** Medium | **Estimated:** 2 days

| Task | Description | Status |
|------|-------------|--------|
| System Settings | Company info, tax rates, etc. | ⬜ |
| Email Templates | Order confirmation, shipping, etc. | ⬜ |
| Notification Settings | Email/SMS configuration | ⬜ |
| Tax Configuration | Swiss VAT rates | ⬜ |

---

## Phase 3: E-Pharmacy Portal

### 3.1 Public Website
**Priority:** High | **Estimated:** 4-5 days

| Task | Description | Status |
|------|-------------|--------|
| Home Page | Featured products, categories, promotions | ⬜ |
| Product Catalog | Browse by category with filters | ⬜ |
| Product Detail | Full product information | ⬜ |
| Search | Global search with autocomplete | ⬜ |
| Responsive Design | Mobile-first approach | ⬜ |

### 3.2 Shopping Cart
**Priority:** High | **Estimated:** 3-4 days

| Task | Description | Status |
|------|-------------|--------|
| Cart Management | Add, update, remove items | ⬜ |
| Cart Persistence | Save cart for logged-in users | ⬜ |
| Stock Validation | Check availability | ⬜ |
| Prescription Check | Flag items requiring prescription | ⬜ |
| Cart Summary | Totals, taxes, shipping estimate | ⬜ |

### 3.3 Checkout Process
**Priority:** High | **Estimated:** 4-5 days

| Task | Description | Status |
|------|-------------|--------|
| Guest Checkout | Allow ordering without account | ⬜ |
| Address Selection | Choose/add delivery address | ⬜ |
| Shipping Options | Select shipping method | ⬜ |
| Prescription Upload | Upload prescription images | ⬜ |
| Order Review | Review before payment | ⬜ |
| Order Confirmation | Success page, email | ⬜ |

### 3.4 Payment Integration
**Priority:** High | **Estimated:** 3-4 days

| Task | Description | Status |
|------|-------------|--------|
| Payment Gateway | Stripe/Twint integration | ⬜ |
| Invoice Payment | Pay by invoice option | ⬜ |
| Payment Status | Track payment state | ⬜ |
| Refunds | Process refunds when needed | ⬜ |

### 3.5 Customer Account
**Priority:** Medium | **Estimated:** 3 days

| Task | Description | Status |
|------|-------------|--------|
| Dashboard | Account overview | ⬜ |
| Order History | View past orders | ⬜ |
| Address Book | Manage addresses | ⬜ |
| Prescription History | View uploaded prescriptions | ⬜ |
| Wishlist | Save products for later | ⬜ |
| Account Settings | Update profile, password | ⬜ |

---

## Technical Implementation Order

### Sprint 1: Foundation (Week 1-2)
```
1. Authentication System
   ├── JWT Token Service
   ├── Refresh Token mechanism
   ├── Login/Register endpoints
   └── Role-based authorization

2. Core Entities Setup
   ├── Category entity & repository
   ├── Manufacturer entity & repository
   ├── Product entity & repository
   └── Canton & PostalCode entities
```

### Sprint 2: Product Management (Week 3-4)
```
1. Admin API Endpoints
   ├── Categories CRUD
   ├── Manufacturers CRUD
   ├── Products CRUD
   └── Image upload

2. Admin Angular Module
   ├── Dashboard layout
   ├── Category management pages
   ├── Product management pages
   └── Data tables with filtering
```

### Sprint 3: Customer & Inventory (Week 5-6)
```
1. Customer Management
   ├── Customer entity & repository
   ├── Address management
   ├── Customer API endpoints
   └── Admin customer pages

2. Inventory Management
   ├── Stock tracking entities
   ├── Batch/Lot management
   ├── Stock adjustment API
   └── Inventory reports
```

### Sprint 4: Order System (Week 7-8)
```
1. Order Management
   ├── Order entities & repositories
   ├── Order workflow service
   ├── Prescription handling
   └── Admin order pages

2. Invoice Generation
   ├── Invoice entity
   ├── PDF generation
   └── Email notifications
```

### Sprint 5: E-Pharmacy Frontend (Week 9-10)
```
1. Public Website
   ├── Home page component
   ├── Product catalog
   ├── Product detail page
   └── Search functionality

2. Shopping Experience
   ├── Cart service & component
   ├── Checkout flow
   └── Customer account pages
```

### Sprint 6: Payment & Polish (Week 11-12)
```
1. Payment Integration
   ├── Payment gateway setup
   ├── Payment processing
   └── Order confirmation

2. Final Polish
   ├── Testing & bug fixes
   ├── Performance optimization
   └── Documentation
```

---

## API Structure

### Admin API Routes
```
/api/admin/categories          - Category management
/api/admin/manufacturers       - Manufacturer management
/api/admin/products           - Product management
/api/admin/customers          - Customer management
/api/admin/orders             - Order management
/api/admin/inventory          - Inventory management
/api/admin/prescriptions      - Prescription verification
/api/admin/settings           - System settings
/api/admin/reports            - Admin reports
```

### Public API Routes
```
/api/auth/login               - User authentication
/api/auth/register            - Customer registration
/api/auth/refresh             - Token refresh
/api/auth/forgot-password     - Password reset

/api/catalog/categories       - Public category list
/api/catalog/products         - Product search & listing
/api/catalog/products/{id}    - Product detail

/api/cart                     - Cart operations
/api/checkout                 - Checkout process
/api/orders                   - Customer orders
/api/account                  - Customer account
```

---

## Angular Module Structure

```
client/pharma-assist/src/app/
├── core/                     # Singleton services
│   ├── auth/                 # Auth service, guards
│   ├── http/                 # Interceptors
│   └── services/             # API services
├── shared/                   # Shared components
│   ├── components/           # Reusable UI components
│   ├── directives/           # Custom directives
│   └── pipes/                # Custom pipes
├── features/
│   ├── admin/                # Admin portal
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── categories/
│   │   ├── customers/
│   │   ├── orders/
│   │   ├── inventory/
│   │   └── settings/
│   ├── shop/                 # E-pharmacy public
│   │   ├── home/
│   │   ├── catalog/
│   │   ├── product/
│   │   ├── cart/
│   │   └── checkout/
│   └── account/              # Customer account
│       ├── orders/
│       ├── addresses/
│       └── profile/
└── layouts/
    ├── admin-layout/
    └── shop-layout/
```

---

## Database Diagram (Simplified)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Category  │────<│   Product   │>────│Manufacturer │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           │
                    ┌──────┴──────┐
                    │             │
              ┌─────────────┐  ┌─────────────┐
              │    Batch    │  │ OrderItem   │
              └─────────────┘  └─────────────┘
                                     │
                                     │
                              ┌─────────────┐
                              │    Order    │
                              └─────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
              ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
              │  Customer   │  │ Prescription│  │   Payment   │
              └─────────────┘  └─────────────┘  └─────────────┘
                    │
              ┌─────────────┐
              │   Address   │
              └─────────────┘
                    │
              ┌─────────────┐
              │   Canton    │
              └─────────────┘
```

---

## Success Criteria

### Phase 1 Complete When:
- [ ] Admin can manage all products, categories, manufacturers
- [ ] Admin can manage customers and their orders
- [ ] Inventory is tracked with batch/lot numbers
- [ ] Prescriptions can be uploaded and verified

### Phase 2 Complete When:
- [ ] Customers can browse and search products
- [ ] Customers can add items to cart and checkout
- [ ] Prescription items are flagged and handled correctly
- [ ] Payments are processed successfully
- [ ] Order confirmation emails are sent
- [ ] Customers can view order history

---

## Questions for Review

1. **Payment Gateway:** Which BiH payment methods? (Card payments, bank transfer, cash on delivery?)
2. **Prescription Workflow:** Should pharmacist approve before order processing?
3. **Shipping Integration:** BH Pošta API integration needed? Other couriers?
4. **Multi-language:** Bosnian/Croatian/Serbian from start or later?
5. **Email Provider:** SendGrid, SMTP, or other?
6. **Image Storage:** Local, Azure Blob, or AWS S3?
7. **Currency:** BAM (Konvertibilna Marka) only, or multi-currency support?
8. **Tax (PDV):** Standard 17% VAT rate - any special pharmaceutical exemptions?

---

## Next Steps

After plan approval:
1. ✅ Project structure created
2. ✅ Database with Identity tables created
3. ⬜ Create remaining domain entities
4. ⬜ Implement authentication endpoints
5. ⬜ Build admin Angular layout
6. ⬜ Start with Category & Product management

---

*Document Version: 1.0*
*Created: November 30, 2025*
*Last Updated: November 30, 2025*
