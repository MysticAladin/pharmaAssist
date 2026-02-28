# Project Overview

## Business Domain

PharmaAssist is a pharmaceutical distribution and sales management platform built specifically for the Bosnia and Herzegovina (BiH) market. It serves as an all-in-one solution for pharmaceutical distribution companies managing:

- **Sales force operations** — Field sales reps visiting pharmacies, hospitals, and doctors
- **Order processing** — From online orders to delivery with full status tracking
- **Inventory management** — Multi-warehouse stock with batch/lot tracking and expiry management
- **E-Pharmacy portal** — B2B online ordering for pharmacy customers
- **Regulatory compliance** — BiH-specific regulations, prescription handling, controlled substances

### Target Users

| Role | Description | Primary Activities |
|------|-------------|-------------------|
| **SuperAdmin** | System administrator | Full access, system settings, user management |
| **Admin** | Company administrator | All modules except system settings |
| **Manager** | Department/Branch manager | Inventory, orders, reports, staff oversight, visit plan approval |
| **Pharmacist** | Licensed pharmacist | Prescriptions, dispensing, patient counseling |
| **Sales Rep** | Field sales representative (Commercial or Medical) | Customer visits, orders, GPS check-in/check-out |
| **Warehouse** | Warehouse staff | Inventory, stock movements, receiving |
| **Customer** | E-pharmacy customer (B2B) | Shopping, orders, prescriptions, account management |

### Sales Representative Types

- **Commercial Rep** — OTC medicines, pharmacy/wholesale visits
- **Medical Rep** — Rx medicines, physician/hospital visits ("stručni predstavnik")

## BiH Regulatory Context

Bosnia and Herzegovina has a split regulatory framework:

- **FBiH** (Federation of Bosnia and Herzegovina) — 10 cantons, each with health ministry
- **RS** (Republika Srpska) — Centralized health ministry
- **BD** (Brčko District) — Independent health authority

Key regulatory requirements:
- GDP (Good Distribution Practice) compliance
- Prescription categories: Rx (prescription required), OTC (over-the-counter), Controlled substances
- Regulated pricing margins (commercial vs. essential medicines)
- Batch/lot traceability and expiry tracking
- Canton-specific pricing rules (FBiH)

## Core Features

### 1. Product Management
- Full pharmaceutical catalog with ATC classification
- Batch/lot tracking with manufacture and expiry dates
- Storage condition requirements (room temp, refrigerated, frozen)
- Prescription type classification (OTC, Rx, Controlled)
- Categories and manufacturer management
- Low-stock alerts and expiring product reports

### 2. Customer Management
- Customer types: Pharmacy, Hospital, Wholesale, Clinic, Retail
- Customer tiers: A (>10,000 KM/mo), B (5,000-10,000 KM/mo), C (<5,000 KM/mo)
- Parent-child relationships (pharmacy chains)
- Multiple addresses (billing, shipping)
- BiH geographic assignment (Entity → Canton → Municipality → City)

### 3. Order Management
- Full order lifecycle: Pending → Confirmed → Processing → ReadyForShipment → Shipped → Delivered
- Payment tracking: Pending, PartiallyPaid, Paid, Refunded, Failed
- Payment methods: Cash, COD, Bank Transfer, Credit Card, Invoice
- Order templates for quick reordering
- Rep orders (created by sales reps on behalf of customers)
- Prescription-linked orders
- Email notifications at each status change

### 4. Inventory & Warehousing
- Multi-warehouse support
- Stock movements: In, Out, Adjustment, Return, Expired, Transfer
- Batch-level tracking with per-batch expiry dates
- Inter-warehouse transfers
- Stock adjustments with reason tracking
- Low-stock monitoring and alerts

### 5. Sales Force Automation (SFA)
- Visit planning hierarchy: Annual → Quarterly → Monthly → Weekly plans
- Plan approval workflow: Draft → Submitted → Approved/Rejected → InProgress → Completed
- GPS check-in/check-out at customer locations (Leaflet maps)
- Visit types: Planned vs. Ad-hoc
- Visit outcomes: Positive, Neutral, Negative
- Visit notes with categories (Discussion, Issue, Opportunity, Complaint)
- Photo attachments during visits
- Sales rep performance dashboards

### 6. Prescription Management
- Prescription upload and storage
- Verification workflow (Pending → Verified/Rejected → Expired)
- Dispensing records
- Prescription-linked orders

### 7. E-Pharmacy Portal (Customer-Facing)
- Product catalog with batch-level browsing (customers see expiry dates)
- Shopping cart with batch-specific items
- Multi-step checkout
- Quick order / fast reorder
- Favorites / wishlist
- Order history and tracking
- Claims / returns management ("reklamacije")
- Promotion display

### 8. Tender Management
- Tender creation and tracking
- Bid submission
- Status tracking
- Hospital/institutional tender workflow

### 9. Reporting & Analytics
- Sales reports (by period, product, customer, rep)
- Inventory reports (stock levels, movements, expiring)
- Financial reports
- Customer reports (activity, purchase history)
- Sales rep performance reports
- Report builder (custom queries)
- PDF export (QuestPDF) for invoices, orders, delivery notes, packing slips

### 10. Pricing & Promotions
- Price rules by customer type and tier
- BiH-specific pricing: Commercial vs. Essential medicines
- Canton-period pricing (FBiH cantons)
- Promotion engine: Volume discounts, percentage/fixed discounts, bundle deals, BOGO
- Promotion eligibility: Customer tier/type targeting, stacking rules
- Budget tracking

### 11. Feature Flags
- Two-tier system: System-level (global) + Client-level (per-pharmacy overrides)
- Flag types: Boolean, String, Number, JSON, Percentage rollout
- Categories: Portal, Billing, Inventory, Orders, Reports, Integration, UI, Experimental
- Change history tracking

### 12. Email & Notifications
- SMTP-based email (Gmail/O365/SendGrid/SES compatible)
- 20+ email types: order confirmations, status changes, welcome emails, password resets
- Hangfire-powered async delivery with retry logic (max 3 retries)
- Email logging with 90-day retention
- Configurable notification recipients

### 13. Audit & Compliance
- Full audit trail logging (who, what, when, old/new values)
- Entity-level change tracking
- Audit log viewer with filtering

## Commercial Information

The product is offered as modular packages:
- **Core Web Shop module** — 13,000 KM
- **Sales Representatives module** — 2,000 KM
- **Budget module** — 2,000 KM
- **Reports module** — 2,000 KM
- **Implementation** — 1,000 KM
- **Monthly maintenance** — 200 KM/month (includes 5 interventions, 24h response)
- **Custom development** — 40 KM/hour
