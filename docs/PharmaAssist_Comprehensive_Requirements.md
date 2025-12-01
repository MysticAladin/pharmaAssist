# PharmaAssist - Comprehensive Software Requirements Document

## Document Information

| Field | Value |
|-------|-------|
| Document Title | PharmaAssist Comprehensive Software Requirements Specification |
| Version | 1.0 |
| Date | November 29, 2025 |
| Status | Draft |
| Primary Market | Bosnia and Herzegovina |
| Language Support | English (Primary), Bosnian (Localized) |

---

# PART 1: EXECUTIVE OVERVIEW AND BUSINESS CONTEXT

## 1. Executive Summary

### 1.1 Purpose
PharmaAssist is an enterprise-grade pharmaceutical distribution and sales management platform designed to digitally transform the operations of pharmaceutical wholesale and distribution companies. The system will serve as the central nervous system for all commercial operations, connecting sales representatives, pharmacies, hospitals, wholesale drugstores, and physicians into a unified ecosystem.

### 1.2 Vision Statement
To become the leading pharmaceutical distribution software solution in Bosnia and Herzegovina and the Balkans region, enabling pharmaceutical companies to achieve operational excellence, regulatory compliance, and superior customer service through digital transformation.

### 1.3 Mission
Provide pharmaceutical companies with a comprehensive, user-friendly, and regulatory-compliant software solution that:
- Streamlines order management and distribution processes
- Empowers sales representatives with mobile-first tools
- Delivers actionable business intelligence
- Ensures complete traceability and compliance
- Maximizes revenue through data-driven decision making

### 1.4 Key Business Objectives
1. **Increase Sales Efficiency**: Reduce order processing time by 70%
2. **Improve Field Productivity**: Enable sales representatives to increase customer visits by 40%
3. **Enhance Customer Satisfaction**: Achieve 95%+ order accuracy
4. **Ensure Compliance**: 100% adherence to pharmaceutical distribution regulations
5. **Real-time Visibility**: Provide instant access to sales, inventory, and performance data
6. **Cost Reduction**: Reduce administrative overhead by 50%

---

## 2. Business Context

### 2.1 Industry Overview: Pharmaceutical Distribution in Bosnia and Herzegovina

#### 2.1.1 Market Structure
The Bosnian pharmaceutical market operates within a unique regulatory framework split between two entities:
- **Federation of Bosnia and Herzegovina (FBiH)**
- **Republika Srpska (RS)**
- **Brčko District**

Each entity has its own:
- Agency for Medicinal Products and Medical Devices
- Essential medicines list
- Pricing and reimbursement regulations
- Health insurance fund

#### 2.1.2 Key Market Participants
1. **Pharmaceutical Manufacturers** (Local and International)
2. **Wholesale Distributors** (Veledrogerije)
   - Hercegovinalijek
   - Phoenix Pharma
   - Farmavita
   - Unifarm
   - Others
3. **Retail Pharmacies** (Apoteke) - Public and Private
4. **Hospital Pharmacies**
5. **Healthcare Institutions**
6. **Physicians and Specialists**

#### 2.1.3 Distribution Channels
```
Manufacturer → Wholesale Distributor → Pharmacy/Hospital → Patient
                      ↓
              Sales Representative
                      ↓
              Physician (Prescription influence)
```

### 2.2 Regulatory Environment

#### 2.2.1 Good Distribution Practice (GDP)
All pharmaceutical distribution must comply with GDP requirements:
- Temperature-controlled storage and transport
- Complete traceability from manufacturer to patient
- Quality management systems
- Personnel qualifications
- Documentation and record-keeping
- Complaints and recall procedures

#### 2.2.2 Prescription Categories
1. **Rx (Prescription Only)** - Requires valid physician prescription
2. **OTC (Over-the-Counter)** - No prescription required
3. **Essential Medicines List** - Government-regulated pricing and availability

#### 2.2.3 Pricing Regulations
- Maximum wholesale margin regulations
- Maximum retail margin regulations
- Reference pricing for reimbursed medicines
- Tender pricing for hospital supplies

### 2.3 Target Users and Stakeholders

#### 2.3.1 Internal Users

| User Role | Primary Responsibilities | System Access Level |
|-----------|------------------------|-------------------|
| **Executive Management** | Strategic oversight, KPI monitoring | Dashboard, Reports |
| **Sales Director** | Sales strategy, territory management, target setting | Full administrative |
| **Regional Sales Manager** | Regional team management, performance tracking | Regional administrative |
| **Commercial Sales Representative** | Customer visits, order taking, relationship management | Mobile app, CRM |
| **Medical/Scientific Representative** | Physician education, scientific information | Mobile app, Medical CRM |
| **Call Center Operator** | Inbound/outbound calls, order processing | Order management |
| **Customer Service** | Complaint handling, returns processing | Service module |
| **Warehouse Manager** | Inventory oversight, dispatch coordination | Inventory management |
| **Finance/Accounting** | Invoicing, payments, credit management | Financial modules |
| **IT Administrator** | System configuration, user management | Full system access |
| **Regulatory Affairs** | Compliance monitoring, audit support | Reporting, Audit logs |

#### 2.3.2 External Users

| User Type | Description | System Interaction |
|-----------|-------------|-------------------|
| **Pharmacy (Apoteka)** | Retail pharmacy businesses | Order placement, account management |
| **Wholesale Drugstore** | Sub-distributors, regional wholesalers | B2B portal, bulk ordering |
| **Hospital Pharmacy** | Healthcare institution pharmacies | Tender orders, consignment |
| **Physician/Doctor** | Prescribing professionals | Product information, samples |
| **Clinic/Healthcare Center** | Medical institutions | Institutional ordering |

---

## 3. Organizational Structure and Workflows

### 3.1 Company Organizational Chart

```
┌─────────────────────────────────────────────────────────────────┐
│                         UPRAVA (Management)                      │
│                    CEO / General Director                        │
└─────────────────────────┬───────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┬─────────────────────┐
        │                 │                 │                     │
        ▼                 ▼                 ▼                     ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│   PRODAJA     │ │  CALL CENTAR  │ │   SKLADIŠTE   │ │   FINANCIJE   │
│    (Sales)    │ │ (Call Center) │ │  (Warehouse)  │ │   (Finance)   │
└───────┬───────┘ └───────┬───────┘ └───────┬───────┘ └───────────────┘
        │                 │                 │
        ▼                 ▼                 ▼
┌───────────────────────────────────────────────────────────────────┐
│                     SALES DEPARTMENT STRUCTURE                     │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│   ┌─────────────────────┐      ┌─────────────────────┐           │
│   │   COMMERCIAL SALES  │      │   SCIENTIFIC/MEDICAL │           │
│   │      DIVISION       │      │      DIVISION        │           │
│   └──────────┬──────────┘      └──────────┬──────────┘           │
│              │                            │                       │
│   ┌──────────┴──────────┐      ┌──────────┴──────────┐           │
│   │                     │      │                     │           │
│   ▼                     ▼      ▼                     ▼           │
│ ┌─────────┐      ┌─────────┐ ┌─────────┐      ┌─────────┐        │
│ │ Region 1│      │ Region N│ │ Region 1│      │ Region N│        │
│ │ Manager │      │ Manager │ │ Manager │      │ Manager │        │
│ └────┬────┘      └────┬────┘ └────┬────┘      └────┬────┘        │
│      │                │          │                │              │
│      ▼                ▼          ▼                ▼              │
│ ┌─────────┐      ┌─────────┐ ┌─────────┐      ┌─────────┐        │
│ │ Sales   │      │ Sales   │ │ Medical │      │ Medical │        │
│ │  Reps   │      │  Reps   │ │  Reps   │      │  Reps   │        │
│ └─────────┘      └─────────┘ └─────────┘      └─────────┘        │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

### 3.2 Sales Representative Types

#### 3.2.1 Commercial Sales Representative (Komercijalni Predstavnik)
**Primary Focus**: Revenue generation through pharmacy and wholesale sales

**Key Activities**:
- Regular visits to pharmacies and wholesalers
- Order collection and processing
- Stock level monitoring at customer sites
- Promotional activities and product launches
- Credit collection and account management
- Competition monitoring
- Merchandising and display management

**Typical Daily Workflow**:
1. Morning: Review daily plan, check inventory availability
2. Field visits: 8-12 customer visits per day
3. Each visit: Stock check, order taking, promotional discussion
4. Real-time order submission via mobile app
5. End of day: Activity reporting, next-day planning

#### 3.2.2 Scientific/Medical Representative (Stručni Predstavnik)
**Primary Focus**: Physician engagement and medical education

**Key Activities**:
- Physician visits and detailing sessions
- Hospital presentations and medical conferences
- Product education and clinical information sharing
- Sample distribution management
- Key Opinion Leader (KOL) development
- Medical inquiry handling
- Adverse event reporting

**Typical Daily Workflow**:
1. Morning: Prepare materials, review physician profiles
2. Hospital/clinic rounds: 4-8 physician visits
3. Each visit: Scientific detailing, sample provision
4. Documentation of discussions and follow-ups
5. Weekly: Presentations, lunch symposiums

### 3.3 Territory Management

#### 3.3.1 Geographic Coverage - Bosnia and Herzegovina

**Cantons/Regions for Territory Assignment**:

| Canton/Region | Abbreviation | Entity |
|--------------|--------------|--------|
| Unsko-sanski kanton | USK | FBiH |
| Posavski kanton | PK | FBiH |
| Tuzlanski kanton | TK | FBiH |
| Zeničko-dobojski kanton | ZDK | FBiH |
| Bosansko-podrinjski kanton | BPK | FBiH |
| Srednjobosanski kanton | SBK | FBiH |
| Hercegovačko-neretvanski kanton | HNK | FBiH |
| Zapadnohercegovački kanton | ZHK | FBiH |
| Kanton Sarajevo | KS | FBiH |
| Kanton 10 (Livanjski) | K10 | FBiH |
| Banja Luka Region | BL | RS |
| Doboj Region | DO | RS |
| Bijeljina Region | BN | RS |
| Istočno Sarajevo Region | IS | RS |
| Trebinje Region | TB | RS |
| Brčko District | BD | BD |

---

## 4. Customer Classification System

### 4.1 Customer Types (Tipovi Klijenata)

#### 4.1.1 Wholesale Drugstores (Veledrogerije)
**Characteristics**:
- Large volume purchasers
- Multi-location operations
- Credit-based transactions
- Tender and contract pricing
- Regular scheduled deliveries
- EDI integration capability

**Examples**: Hercegovinalijek, Phoenix Pharma, Farmavita

#### 4.1.2 Retail Pharmacies (Apoteke)
**Characteristics**:
- End-point distribution
- Smaller order quantities
- Mix of credit and cash transactions
- Prescription and OTC sales
- Consumer-facing

**Classification Tiers**:
| Tier | Criteria | Visit Frequency | Credit Terms |
|------|----------|-----------------|--------------|
| **A** | Monthly purchases > 10,000 KM | Weekly | Net 60 |
| **B** | Monthly purchases 5,000-10,000 KM | Bi-weekly | Net 45 |
| **C** | Monthly purchases < 5,000 KM | Monthly | Net 30 |

#### 4.1.3 Hospital Pharmacies
**Characteristics**:
- Tender-based procurement
- Institutional pricing
- Consignment arrangements
- Extended payment terms
- Formulary compliance

#### 4.1.4 Physicians/Doctors (Ljekari)
**Characteristics**:
- Prescription influencers
- No direct purchasing
- Sample recipients
- KOL potential
- Conference attendees

**Specialty Categories**:
- General Practitioners
- Cardiologists
- Endocrinologists
- Neurologists
- Pediatricians
- Pulmonologists
- Dermatologists
- Oncologists
- Others

### 4.2 Customer Hierarchy Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                     CUSTOMER HIERARCHY                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Level 1: PARENT COMPANY (e.g., Pharmacy Chain HQ)              │
│     │                                                            │
│     ├── Level 2: REGIONAL OFFICE (e.g., Sarajevo Regional)      │
│     │      │                                                     │
│     │      ├── Level 3: BRANCH/LOCATION (e.g., Pharmacy #1)     │
│     │      │                                                     │
│     │      ├── Level 3: BRANCH/LOCATION (e.g., Pharmacy #2)     │
│     │      │                                                     │
│     │      └── Level 3: BRANCH/LOCATION (e.g., Pharmacy #3)     │
│     │                                                            │
│     └── Level 2: REGIONAL OFFICE (e.g., Tuzla Regional)         │
│            │                                                     │
│            ├── Level 3: BRANCH/LOCATION                          │
│            └── Level 3: BRANCH/LOCATION                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

# PART 2: PRODUCT MANAGEMENT AND CATALOG

## 5. Product Information Management

### 5.1 Product Classification

#### 5.1.1 By Regulatory Category (Vrsta)

| Category | Bosnian | Description | Requirements |
|----------|---------|-------------|--------------|
| **Essential List** | Esencijalna lista | Government-mandated essential medicines | Regulated pricing, mandatory stocking |
| **Prescription** | Recept (Rx) | Requires physician prescription | Prescription tracking, controlled distribution |
| **Commercial/OTC** | Komercijalno | Over-the-counter medicines | Free pricing, open distribution |
| **Controlled Substances** | Kontrolirane supstance | Narcotics, psychotropics | Special licensing, strict tracking |

#### 5.1.2 By Therapeutic Category (ATC Classification)

The Anatomical Therapeutic Chemical (ATC) Classification System:

```
Level 1: Main anatomical group (1 letter)
   │
   └── Level 2: Therapeutic subgroup (2 digits)
          │
          └── Level 3: Pharmacological subgroup (1 letter)
                 │
                 └── Level 4: Chemical subgroup (1 letter)
                        │
                        └── Level 5: Chemical substance (2 digits)

Example: A10BA02
A = Alimentary tract and metabolism
10 = Drugs used in diabetes
B = Blood glucose lowering drugs, excl. insulins
A = Biguanides
02 = Metformin
```

**Main ATC Groups**:
- A: Alimentary tract and metabolism
- B: Blood and blood forming organs
- C: Cardiovascular system
- D: Dermatologicals
- G: Genito-urinary system and sex hormones
- H: Systemic hormonal preparations
- J: Antiinfectives for systemic use
- L: Antineoplastic and immunomodulating agents
- M: Musculo-skeletal system
- N: Nervous system
- P: Antiparasitic products
- R: Respiratory system
- S: Sensory organs
- V: Various

#### 5.1.3 By Product Form

| Form Category | Examples |
|--------------|----------|
| **Solid Oral** | Tablets, Capsules, Powders |
| **Liquid Oral** | Syrups, Suspensions, Solutions |
| **Injectable** | Ampoules, Vials, Pre-filled syringes |
| **Topical** | Creams, Ointments, Gels, Patches |
| **Inhalation** | Inhalers, Nebulizer solutions |
| **Ophthalmic** | Eye drops, Eye ointments |
| **Otic** | Ear drops |
| **Nasal** | Nasal sprays, Drops |
| **Rectal** | Suppositories, Enemas |
| **Vaginal** | Pessaries, Creams |

### 5.2 Product Data Model

#### 5.2.1 Core Product Attributes

```
PRODUCT MASTER DATA
├── Identification
│   ├── Internal Product ID (System generated)
│   ├── Inventory Number (Šifra artikla)
│   ├── JKL Code (Jedinstvena klasifikaciona lista)
│   ├── ATC Code
│   ├── Barcode (EAN-13)
│   ├── Manufacturer Product Code
│   └── Marketing Authorization Number
│
├── Naming
│   ├── Generic Name (INN - International Nonproprietary Name)
│   ├── Brand Name / Trade Name
│   ├── Display Name
│   ├── Short Name (for mobile/labels)
│   └── Search Keywords
│
├── Classification
│   ├── Product Category (Essential/Rx/OTC)
│   ├── ATC Classification (all 5 levels)
│   ├── Therapeutic Group
│   ├── Product Form
│   ├── Administration Route
│   └── Prescription Status
│
├── Manufacturer Information
│   ├── Manufacturer ID
│   ├── Manufacturer Name
│   ├── Country of Origin
│   ├── Marketing Authorization Holder
│   └── Local Representative
│
├── Packaging
│   ├── Package Size
│   ├── Unit of Measure (tablet, ml, mg, etc.)
│   ├── Units per Package
│   ├── Packages per Carton
│   ├── Cartons per Pallet
│   └── Package Description
│
├── Pricing (Multi-tier)
│   ├── Purchase Price (Nabavna cijena)
│   ├── Wholesale Price (Veleprodajna cijena)
│   ├── Retail Price (Maloprodajna cijena)
│   ├── Hospital Price (Bolnička cijena)
│   ├── Tender Price
│   ├── Tax Rate (PDV)
│   ├── Margin Percentage
│   └── Price Effective Date
│
├── Inventory Parameters
│   ├── Minimum Stock Level
│   ├── Maximum Stock Level
│   ├── Reorder Point
│   ├── Lead Time (days)
│   ├── Shelf Life (months)
│   └── Storage Conditions
│
├── Regulatory
│   ├── Registration Number
│   ├── Registration Expiry Date
│   ├── Controlled Substance Flag
│   ├── Cold Chain Required
│   ├── Hazardous Material Flag
│   └── Special Handling Instructions
│
└── Status
    ├── Active/Inactive
    ├── Available for Order
    ├── Discontinued Flag
    ├── Launch Date
    └── Discontinuation Date
```

### 5.3 Manufacturer Management

#### 5.3.1 Manufacturer Data

| Field | Description |
|-------|-------------|
| Manufacturer ID | System-generated unique identifier |
| Name | Legal company name |
| Display Name | Common/short name |
| Country | Country of headquarters |
| Address | Full address |
| Contact Person | Primary contact |
| Email | Contact email |
| Phone | Contact phone |
| Website | Company website |
| License Number | Manufacturing license |
| License Expiry | License validity |
| Quality Certifications | GMP, ISO, etc. |
| Payment Terms | Standard payment conditions |
| Currency | Transaction currency |
| Active | Status flag |

### 5.4 Pricing Management

#### 5.4.1 Multi-tier Pricing Structure

```
                    ┌─────────────────────┐
                    │  MANUFACTURER PRICE  │
                    │   (Base Cost)        │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   PURCHASE PRICE     │
                    │   (Nabavna cijena)   │
                    │   + Import costs     │
                    │   + Customs          │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
┌─────────▼─────────┐ ┌────────▼────────┐ ┌────────▼────────┐
│ WHOLESALE PRICE   │ │ HOSPITAL PRICE  │ │  TENDER PRICE   │
│ (Veleprodajna)    │ │ (Bolnička)      │ │  (Per contract) │
│ + Wholesale margin│ │ + Reduced margin│ │  Negotiated     │
└─────────┬─────────┘ └─────────────────┘ └─────────────────┘
          │
┌─────────▼─────────┐
│  RETAIL PRICE     │
│  (Maloprodajna)   │
│  + Retail margin  │
│  + PDV (VAT)      │
└───────────────────┘
```

#### 5.4.2 Special Pricing Scenarios

1. **Volume Discounts**: Tiered pricing based on order quantity
2. **Promotional Pricing**: Temporary price reductions
3. **Contract Pricing**: Customer-specific negotiated prices
4. **Bundle Pricing**: Discounts for product combinations
5. **Early Payment Discounts**: Discounts for prompt payment

### 5.5 Inventory and Stock Management

#### 5.5.1 Stock Tracking by Wholesale Distributor

**Key Requirement**: Track inventory levels across multiple wholesale distributors (Veledrogerije)

```
PRODUCT: Flodinax 500mg, 20 tablets
├── Hercegovinalijek
│   ├── Available Stock: 5,000 units
│   ├── Reserved: 200 units
│   ├── Last Updated: 2025-11-29 08:00
│   └── Price: 15.50 KM
│
├── Phoenix Pharma
│   ├── Available Stock: 3,200 units
│   ├── Reserved: 0 units
│   ├── Last Updated: 2025-11-29 07:45
│   └── Price: 15.75 KM
│
└── Farmavita
    ├── Available Stock: 0 units (OUT OF STOCK)
    ├── Expected: 2025-12-05
    ├── Last Updated: 2025-11-29 08:15
    └── Price: 15.60 KM
```

#### 5.5.2 Defektura (Stock-out) Management

**Definition**: Defektura refers to products that are temporarily or permanently unavailable

**Types of Defektura**:
1. **Temporary Out of Stock**: Product will be available again
2. **Production Delay**: Manufacturing issues, expected date known
3. **Supply Chain Disruption**: Import/logistics issues
4. **Discontinued**: Product no longer manufactured
5. **Regulatory Hold**: Product suspended by authorities

**System Requirements**:
- Alert notifications when stock falls below threshold
- Automatic notification to affected customers
- Alternative product suggestions
- Expected availability date tracking
- Integration with production/import planning

---

## 6. Order Management System

### 6.1 Order Types

| Order Type | Description | Typical Source |
|------------|-------------|----------------|
| **Standard Order** | Regular replenishment order | Sales rep, Customer portal |
| **Urgent Order** | Same-day/next-day delivery | Phone, Mobile app |
| **Scheduled Order** | Recurring automatic orders | System-generated |
| **Tender Order** | Contract-based institutional order | Tender management |
| **Consignment Order** | Stock placement without sale | Sales rep |
| **Sample Order** | Free product samples | Medical rep |
| **Return Order** | Customer returns | Customer service |
| **Transfer Order** | Inter-warehouse movement | Warehouse |

### 6.2 Order Workflow

#### 6.2.1 Order Status Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          ORDER LIFECYCLE                                  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────┐    ┌──────────┐    ┌───────────┐    ┌─────────────┐        │
│  │ CREATED │───▶│ PENDING  │───▶│ CONFIRMED │───▶│ PROCESSING  │        │
│  │ (Draft) │    │(Awaiting │    │ (Accepted)│    │ (Warehouse) │        │
│  └─────────┘    │ Approval)│    └───────────┘    └──────┬──────┘        │
│                 └──────────┘                            │               │
│                      │                                  │               │
│                      │ ┌────────────┐                   │               │
│                      └▶│ ON HOLD    │                   │               │
│                        │(Credit/    │                   ▼               │
│                        │ Stock)     │         ┌─────────────────┐       │
│                        └────────────┘         │    PICKED       │       │
│                                               │ (Items gathered)│       │
│  ┌─────────────┐                              └────────┬────────┘       │
│  │  CANCELLED  │◀────── Can occur at ─────────────────┐│               │
│  │             │        any stage                      ││               │
│  └─────────────┘                                       ▼│               │
│                                               ┌─────────────────┐       │
│                                               │    PACKED       │       │
│                                               │ (Ready to ship) │       │
│                                               └────────┬────────┘       │
│                                                        │               │
│  ┌─────────────┐    ┌───────────┐              ┌──────▼──────┐        │
│  │  RETURNED   │◀───│ DELIVERED │◀─────────────│   SHIPPED   │        │
│  │             │    │           │              │ (In transit)│        │
│  └─────────────┘    └───────────┘              └─────────────┘        │
│        │                  │                                            │
│        │                  ▼                                            │
│        │            ┌───────────┐                                      │
│        └───────────▶│ REFUNDED  │                                      │
│                     │           │                                      │
│                     └───────────┘                                      │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

#### 6.2.2 Order Validation Rules

**Pre-submission Validations**:
1. Customer active status check
2. Customer credit limit check
3. Customer overdue payment check
4. Product availability check
5. Minimum order quantity check
6. Maximum order quantity check
7. Price validity check
8. Promotion eligibility check

**Business Rules**:
- Orders from customers with overdue payments > 60 days require manager approval
- Orders exceeding credit limit require finance approval
- Controlled substance orders require additional documentation
- Cold chain products require delivery schedule confirmation

### 6.3 Order Data Model

#### 6.3.1 Order Header

| Field | Type | Description |
|-------|------|-------------|
| OrderId | int | Unique order identifier |
| OrderNumber | string | Human-readable order number |
| CustomerId | int | Reference to customer |
| CustomerName | string | Denormalized for display |
| ShippingAddressId | int | Delivery address |
| BillingAddressId | int | Invoice address |
| OrderDate | datetime | Order creation date/time |
| RequestedDeliveryDate | datetime | Customer requested delivery |
| PromisedDeliveryDate | datetime | Confirmed delivery date |
| OrderStatus | enum | Current order status |
| OrderType | enum | Type of order |
| SalesRepId | int | Assigned sales representative |
| OrderSource | enum | Web/Mobile/Phone/EDI |
| PaymentTerms | string | Payment conditions |
| Currency | string | Order currency |
| SubTotal | decimal | Sum before tax |
| TaxAmount | decimal | Total tax |
| DiscountAmount | decimal | Applied discounts |
| ShippingAmount | decimal | Delivery charges |
| TotalAmount | decimal | Final order total |
| OrderingNote | string | Customer notes |
| InternalNote | string | Internal notes |
| CreatedBy | int | User who created |
| CreatedAt | datetime | Creation timestamp |
| ModifiedBy | int | Last modifier |
| ModifiedAt | datetime | Last modification |

#### 6.3.2 Order Line Items

| Field | Type | Description |
|-------|------|-------------|
| OrderLineId | int | Line item identifier |
| OrderId | int | Parent order reference |
| LineNumber | int | Sequence number |
| ProductId | int | Product reference |
| ProductCode | string | Product SKU |
| ProductName | string | Product description |
| QuantityOrdered | int | Requested quantity |
| QuantityConfirmed | int | Available quantity |
| QuantityShipped | int | Shipped quantity |
| UnitPrice | decimal | Price per unit |
| DiscountPercent | decimal | Line discount % |
| DiscountAmount | decimal | Line discount amount |
| TaxRate | decimal | Applicable tax rate |
| TaxAmount | decimal | Calculated tax |
| LineTotal | decimal | Line total amount |
| BatchNumber | string | Assigned batch |
| ExpiryDate | date | Product expiry |
| SpecialInstructions | string | Line-specific notes |

#### 6.3.3 Order Activity Log

| Field | Type | Description |
|-------|------|-------------|
| ActivityId | int | Log entry identifier |
| OrderId | int | Related order |
| ActivityType | enum | Type of activity |
| PreviousStatus | enum | Status before change |
| NewStatus | enum | Status after change |
| ActivityDate | datetime | When it occurred |
| UserId | int | Who performed action |
| Note | string | Additional details |
| IPAddress | string | Source IP (for audit) |

**Activity Types**:
- StatusChange
- NoteAdded
- DocumentAttached
- PaymentReceived
- PriceModified
- QuantityChanged
- LineItemAdded
- LineItemRemoved
- DeliveryScheduled
- CustomerContacted

---

# PART 3: SALES FORCE AUTOMATION AND CRM

## 7. Customer Relationship Management (CRM)

### 7.1 CRM Core Functionality

#### 7.1.1 Contact Management

**Customer Master Record**:

| Category | Fields |
|----------|--------|
| **Identification** | Customer ID, Tax ID (JIB), Registration Number, External Reference |
| **Basic Info** | Name, Display Name, Customer Type, Parent Company |
| **Contact** | Primary Contact, Email, Phone, Mobile, Fax |
| **Address** | Street, Number, ZIP, City, Canton, Country, GPS Coordinates |
| **Classification** | Tier (A/B/C), Segment, Territory, Assigned Rep |
| **Financial** | Credit Limit, Payment Terms, Bank Account, Tax Status |
| **Commercial** | Price List, Discount Group, Delivery Schedule |
| **Status** | Active, Verified, Blocked, Block Reason |

**Contact Persons** (Multiple per Customer):

| Field | Description |
|-------|-------------|
| Contact ID | Unique identifier |
| Customer ID | Parent customer |
| First Name | Contact first name |
| Last Name | Contact last name |
| Title/Position | Job title |
| Department | Organizational unit |
| Email | Contact email |
| Phone Direct | Direct phone line |
| Mobile | Mobile number |
| Role | Decision maker, Influencer, User, Gatekeeper |
| Primary Contact | Boolean flag |
| Communication Preference | Email, Phone, SMS, In-person |
| Notes | Additional information |

#### 7.1.2 Interaction Tracking

**Interaction Types**:

| Type | Description | Typical Duration |
|------|-------------|------------------|
| **Visit** | In-person customer visit | 15-60 minutes |
| **Phone Call** | Telephone conversation | 5-30 minutes |
| **Email** | Email correspondence | N/A |
| **Video Call** | Virtual meeting | 15-60 minutes |
| **Presentation** | Formal product presentation | 30-120 minutes |
| **Conference** | Trade show, medical conference | Variable |
| **Training** | Product or system training | 60-240 minutes |
| **Complaint** | Customer complaint handling | Variable |

**Interaction Record**:

| Field | Type | Description |
|-------|------|-------------|
| InteractionId | int | Unique identifier |
| CustomerId | int | Customer reference |
| ContactPersonId | int | Specific contact |
| InteractionType | enum | Type of interaction |
| InteractionDate | datetime | When it occurred |
| Duration | int | Duration in minutes |
| Location | string | Where it occurred |
| GPSLatitude | decimal | GPS location |
| GPSLongitude | decimal | GPS location |
| Subject | string | Brief description |
| Description | text | Detailed notes |
| ProductsDiscussed | list | Products mentioned |
| Outcome | enum | Positive/Neutral/Negative |
| FollowUpRequired | bool | Needs follow-up |
| FollowUpDate | date | Scheduled follow-up |
| FollowUpNotes | string | Follow-up details |
| AttachmentsCount | int | Number of attachments |
| SalesRepId | int | Representative |
| CreatedAt | datetime | Record creation |

### 7.2 Visit Planning and Scheduling

#### 7.2.1 Planning Hierarchy

```
PLANNING STRUCTURE
│
├── ANNUAL PLAN (Godišnji plan)
│   ├── Territory assignments
│   ├── Annual targets by product/customer
│   └── Major event calendar
│
├── QUARTERLY PLAN (Kvartalni plan)
│   ├── Quarterly targets breakdown
│   ├── Campaign schedules
│   └── Resource allocation
│
├── MONTHLY PLAN (Mjesečni plan)
│   ├── Monthly targets
│   ├── Promotional activities
│   └── Training schedule
│
├── ROLLING 4-MONTH PLAN (Rolovani plan)
│   ├── Rolling forecast
│   ├── Pipeline management
│   └── Adjusted projections
│
├── WEEKLY PLAN (Sedmični plan)
│   ├── Visit schedule by day
│   ├── Route optimization
│   └── Daily objectives
│
└── DAILY PLAN (Dnevni plan)
    ├── Visit sequence
    ├── Preparation notes
    └── Expected outcomes
```

#### 7.2.2 Weekly Visit Plan Document

**Required Information per Week**:

| Day | Customer | Location | Time | Objective | Products to Present |
|-----|----------|----------|------|-----------|---------------------|
| Monday | Apoteka Centar | Sarajevo | 09:00 | Stock check, New promotion | Flodinax, Cardipril |
| Monday | Ljekarna Zdravlje | Sarajevo | 11:00 | Order collection | All catalog |
| ... | ... | ... | ... | ... | ... |

**Weekly Plan Approval Workflow**:
1. Sales Rep creates weekly plan (by Thursday previous week)
2. System validates against:
   - Customer coverage requirements
   - A/B/C visit frequency rules
   - Geographic efficiency
3. Manager reviews and approves/returns
4. Approved plan becomes executable
5. Deviations require justification

#### 7.2.3 Visit Execution and Verification

**GPS-Based Visit Verification**:

```
VISIT CHECK-IN PROCESS
│
├── 1. Rep arrives at customer location
│
├── 2. Opens app and initiates "Check-in"
│
├── 3. System captures:
│   ├── Current GPS coordinates
│   ├── Timestamp
│   ├── Network information
│   └── Device information
│
├── 4. System validates:
│   ├── Distance from registered customer address
│   │   ├── < 100m = Valid (green)
│   │   ├── 100-500m = Warning (yellow)
│   │   └── > 500m = Alert (red) - requires explanation
│   └── Time of day vs. planned schedule
│
├── 5. If location mismatch:
│   ├── Rep must provide explanation
│   ├── Manager receives real-time notification
│   └── Location is logged for audit
│
├── 6. Visit proceeds - Rep records:
│   ├── Discussion notes
│   ├── Products presented
│   ├── Orders taken
│   └── Issues raised
│
└── 7. Check-out captures:
    ├── End time
    ├── Visit duration
    └── Auto-calculates travel to next visit
```

**Administrator Location Review Dashboard**:
- Map view of all rep locations (real-time)
- Planned vs. actual route comparison
- Location discrepancy alerts
- Click to view Google Maps of check-in location

### 7.3 Activity Reporting

#### 7.3.1 Daily Activity Report (Dnevni izvještaj)

**Auto-generated Summary**:
- Number of visits completed vs. planned
- Customers visited (with outcomes)
- Orders collected (value and items)
- Products presented
- Samples distributed
- Issues encountered
- Travel distance covered
- Time utilization breakdown

#### 7.3.2 Weekly Activity Report (Sedmični izvještaj)

**Aggregated Metrics**:
- Visit completion rate
- Customer coverage by tier
- Order value progression
- Pipeline movement
- Key wins and challenges
- Next week focus areas

#### 7.3.3 Monthly Activity Report (Mjesečni izvještaj)

**Comprehensive Analysis**:
- Target vs. achievement by product
- Target vs. achievement by customer
- Target vs. achievement by territory
- Activity metrics trends
- Expense summary
- Training/development activities
- Competitive intelligence gathered

---

## 8. Target and Performance Management

### 8.1 Target Setting Structure

#### 8.1.1 Target Hierarchy

```
                    ┌───────────────────────┐
                    │   COMPANY TARGETS     │
                    │   (Set by Management) │
                    └───────────┬───────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│   BY PRODUCT  │      │  BY TERRITORY │      │   BY CHANNEL  │
│  (Per SKU)    │      │  (Per Canton) │      │ (Pharmacy/    │
│               │      │               │      │  Hospital)    │
└───────┬───────┘      └───────┬───────┘      └───────┬───────┘
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   SALES REP TARGETS │
                    │   (Individual KPIs) │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  CUSTOMER TARGETS   │
                    │  (Per Account)      │
                    └─────────────────────┘
```

#### 8.1.2 Target Types

| Target Type | Unit | Period | Example |
|-------------|------|--------|---------|
| **Revenue Target** | KM (Currency) | Monthly/Quarterly/Annual | 50,000 KM/month |
| **Volume Target** | Units | Monthly/Quarterly | 500 boxes/quarter |
| **Visit Target** | Count | Weekly/Monthly | 40 visits/week |
| **New Customer Target** | Count | Monthly/Quarterly | 5 new customers/month |
| **Coverage Target** | Percentage | Monthly | 100% A-tier coverage |
| **Collection Target** | KM | Monthly | 95% collection rate |

#### 8.1.3 Target Setting Interface

**Administrator Sets**:

| Level | Target | Period | Value | Status |
|-------|--------|--------|-------|--------|
| Company | Total Revenue | Q4 2025 | 2,500,000 KM | Active |
| Product - Flodinax | Revenue | Q4 2025 | 450,000 KM | Active |
| Product - Cardipril | Volume | Q4 2025 | 10,000 units | Active |
| Canton - Sarajevo | Revenue | Q4 2025 | 800,000 KM | Active |
| Rep - Amir H. | Revenue | Nov 2025 | 65,000 KM | Active |
| Customer - Apoteka A | Revenue | Nov 2025 | 8,000 KM | Active |

### 8.2 Real-Time Performance Tracking

#### 8.2.1 Dashboard Indicators

**Traffic Light System**:
- 🟢 **Green**: >= 100% of pro-rata target
- 🟡 **Yellow**: 80-99% of pro-rata target
- 🔴 **Red**: < 80% of pro-rata target

**Example Mid-Quarter View**:

```
Q4 2025 Performance Dashboard (as of Nov 15)
═══════════════════════════════════════════════

Overall Revenue Target: 2,500,000 KM
Expected by Nov 15 (50%): 1,250,000 KM
Actual Achieved: 1,100,000 KM (88%) 🟡

Product Performance:
┌────────────────┬───────────┬──────────┬────────┬────────┐
│ Product        │ Q4 Target │ Expected │ Actual │ Status │
├────────────────┼───────────┼──────────┼────────┼────────┤
│ Flodinax       │ 450,000   │ 225,000  │ 250,000│ 🟢 111%│
│ Cardipril      │ 350,000   │ 175,000  │ 140,000│ 🔴 80% │
│ Gastrolax      │ 200,000   │ 100,000  │ 95,000 │ 🟡 95% │
│ Respirol       │ 180,000   │ 90,000   │ 85,000 │ 🟡 94% │
└────────────────┴───────────┴──────────┴────────┴────────┘

Note: Strong Flodinax performance (+25,000 KM) partially 
compensates for Cardipril shortfall (-35,000 KM)
```

#### 8.2.2 Forcing/Push Campaigns

**When Target At Risk**:
1. System identifies underperforming products
2. Alert sent to sales management
3. Special campaign initiated:
   - Additional promotions authorized
   - Increased visit frequency to key accounts
   - Special incentives for reps
   - Cross-selling opportunities highlighted

### 8.3 Sales Analysis and Reporting

#### 8.3.1 Report Types

**Standard Reports**:

| Report | Frequency | Recipients | Content |
|--------|-----------|------------|---------|
| Daily Sales Flash | Daily | Management | Yesterday's orders, shipments |
| Weekly Performance | Weekly | Sales team | Week's achievements vs. targets |
| Monthly Business Review | Monthly | Executive | Full P&L, trend analysis |
| Quarterly Review | Quarterly | Board | Strategic performance |
| Customer Analysis | Monthly | Sales team | Customer-level deep dive |
| Product Analysis | Monthly | Marketing | SKU-level performance |
| Territory Analysis | Monthly | Management | Geographic performance |
| Rep Scorecard | Weekly/Monthly | Sales management | Individual rep metrics |

#### 8.3.2 Report Dimensions

**Generate Reports By**:
- Time Period (Day, Week, Month, Quarter, Year, Custom)
- Sales Representative
- Customer (Individual or Group)
- Customer Type (Pharmacy, Hospital, Wholesale)
- Customer Tier (A, B, C)
- Territory/Canton
- Product
- Product Category
- Manufacturer
- Order Source (Mobile, Web, Phone)

#### 8.3.3 Wholesale Tracking

**Veledrogerija Sales Tracking**:

Monitor products sold by company through wholesale distributors:

| Veledrogerija | Product | Period | Quantity Sold | Value | Market Share |
|---------------|---------|--------|---------------|-------|--------------|
| Hercegovinalijek | Flodinax | Nov 2025 | 2,500 | 38,750 KM | 45% |
| Phoenix Pharma | Flodinax | Nov 2025 | 1,800 | 27,900 KM | 33% |
| Farmavita | Flodinax | Nov 2025 | 1,200 | 18,600 KM | 22% |

**Importance**: Understanding sell-through via wholesalers helps:
- Identify distribution gaps
- Negotiate better terms
- Plan promotional activities
- Forecast demand

---

## 9. Sample and Gratis Management

### 9.1 Sample/Gratis Definitions

| Term | Bosnian | Description | Accounting Treatment |
|------|---------|-------------|---------------------|
| **Sample** | Uzorak | Small product quantities for trial | Marketing expense |
| **Gratis** | Gratis | Free goods as incentive/compensation | Sales deduction |
| **FOC** | Besplatno | Free of charge promotional goods | Promotion expense |

### 9.2 Gratis Management Workflow

```
GRATIS LIFECYCLE
│
├── 1. ALLOCATION (Administrator)
│   ├── Admin assigns gratis quota to rep
│   ├── Specifies: Product, Quantity, Period
│   ├── Reason: Promotion, Compensation, Sample
│   └── Records: Date, Authorization level
│
├── 2. DISTRIBUTION (Sales Rep)
│   ├── Rep distributes to customers
│   ├── Records: Customer, Quantity, Date
│   ├── Must provide business justification
│   └── Customer signature (if applicable)
│
├── 3. JUSTIFICATION (Sales Rep)
│   ├── Invoice received from customer order
│   ├── Rep links invoice to gratis given
│   ├── Proves gratis resulted in business
│   └── Closes gratis obligation
│
├── 4. RECONCILIATION (Administrator)
│   ├── Review gratis vs. invoices
│   ├── Calculate ROI on gratis
│   ├── Identify unjustified gratis
│   └── Take action on discrepancies
│
└── 5. REPORTING
    ├── Gratis by rep summary
    ├── Gratis by customer summary
    ├── Justified vs. unjustified ratio
    └── ROI analysis
```

### 9.3 Sample Distribution (Medical Reps)

**Requirements**:
- Track samples given to physicians
- Record lot numbers and expiry dates
- Obtain physician acknowledgment
- Comply with industry regulations on sample limits
- Automatic alerts when nearing limits

**Sample Record**:

| Field | Description |
|-------|-------------|
| Sample ID | Unique identifier |
| Product ID | Product distributed |
| Quantity | Number of units |
| Lot Number | Batch identification |
| Expiry Date | Product expiration |
| Recipient Type | Physician, Pharmacist, Institution |
| Recipient Name | Who received |
| Recipient Signature | Digital signature capture |
| Distribution Date | When distributed |
| Rep ID | Who distributed |
| Purpose | Trial, Initiation, Replacement |
| Follow-up Date | Scheduled follow-up |

---

## 10. Promotions and Campaigns

### 10.1 Promotion Types

| Type | Description | Example |
|------|-------------|---------|
| **Volume Discount** | Quantity-based price reduction | Buy 10, get 10% off |
| **Bundle Deal** | Discount on product combinations | Buy A+B, get 15% off |
| **Free Goods** | Extra units at no charge | Buy 10, get 1 free |
| **Seasonal Promotion** | Time-limited price reduction | Winter flu campaign |
| **Loyalty Reward** | Rewards for repeat purchases | Points program |
| **Launch Promotion** | New product introduction offer | 20% off first order |
| **Clearance** | Discounts to move aging stock | Short-dated products |

### 10.2 Promotion Configuration

**Promotion Master Record**:

| Field | Description |
|-------|-------------|
| Promotion ID | Unique identifier |
| Promotion Name | Descriptive name |
| Promotion Code | Short code for reference |
| Promotion Type | Category of promotion |
| Description | Full description |
| Start Date | When promotion begins |
| End Date | When promotion ends |
| Eligible Products | Products included |
| Eligible Customers | Customer segments eligible |
| Eligible Territories | Geographic scope |
| Minimum Quantity | Minimum purchase to qualify |
| Discount Type | Percentage, Fixed amount, Free goods |
| Discount Value | Amount or percentage |
| Maximum Usage | Cap on total redemptions |
| Budget | Allocated budget |
| Approval Status | Draft, Pending, Approved, Active, Expired |
| Created By | Who created |
| Approved By | Who approved |

### 10.3 Promotion Visibility

- **Sales Reps**: See applicable promotions when creating orders
- **Customers**: See promotions on their portal/app
- **System**: Auto-apply promotions when conditions met
- **Reports**: Track promotion effectiveness

---

# PART 4: APPLICATION MODULES AND USER INTERFACES

## 11. Mobile Application (Sales Representative App)

### 11.1 Overview

The mobile application is the primary tool for field sales representatives, designed for both Commercial and Medical representatives with role-specific features.

**Platform Support**:
- iOS (iPhone, iPad)
- Android (Phones, Tablets)
- Offline-first architecture with sync

### 11.2 Core Mobile Features

#### 11.2.1 Authentication and Security

| Feature | Description |
|---------|-------------|
| **Login** | Username/password or biometric (fingerprint, Face ID) |
| **Session Management** | Auto-logout after inactivity period |
| **PIN Lock** | Optional quick-access PIN for app |
| **Remote Wipe** | Admin can remotely clear app data |
| **Device Registration** | One account per device policy |
| **SSL/TLS** | All communications encrypted |

#### 11.2.2 Dashboard/Home Screen

**Elements**:
- Today's visit count and status
- Orders submitted today (value)
- Target progress indicator
- Urgent notifications
- Quick action buttons
- Weather for current location

#### 11.2.3 Visit Planning Module

**Features**:

| Feature | Description |
|---------|-------------|
| Weekly Plan View | Calendar view of planned visits |
| Daily Route | Optimized route for day's visits |
| Map Integration | Visual map with customer pins |
| Route Navigation | Turn-by-turn directions |
| Plan Modification | Add/remove/reschedule visits |
| Ad-hoc Visits | Record unplanned visits |

#### 11.2.4 Customer Management

**Customer List**:
- Search and filter customers
- View customer details
- Contact information
- Recent order history
- Credit status indicator
- Last visit information
- Outstanding payments

**Customer Card**:
- Full customer profile
- All contact persons
- Interaction history
- Order history
- Products purchased
- Pricing information
- Notes and attachments

#### 11.2.5 Visit Execution

**Check-in Process**:
1. Select customer from daily plan
2. Tap "Check-in" button
3. GPS location captured
4. Visit timer starts
5. Conduct visit activities
6. Record notes, orders, samples
7. Tap "Check-out" button
8. Complete visit summary

**During Visit Options**:
- Create new order
- View customer stock levels
- Record discussion notes
- Log complaints/issues
- Schedule follow-up
- Take photos
- Capture signature

#### 11.2.6 Order Taking

**Order Creation Flow**:

```
1. SELECT CUSTOMER
   └── From visit or search

2. VERIFY DETAILS
   ├── Shipping address
   ├── Payment terms
   └── Special instructions

3. ADD PRODUCTS
   ├── Search product catalog
   ├── Browse categories
   ├── Scan barcode
   ├── View stock availability
   ├── Check prices
   └── Apply promotions

4. REVIEW ORDER
   ├── Line item summary
   ├── Totals and discounts
   ├── Delivery date selection
   └── Order notes

5. SUBMIT ORDER
   ├── Confirm submission
   ├── Order confirmation number
   └── Email/SMS to customer (optional)
```

**Order Features**:
- Real-time inventory check
- Price displayed with discounts
- Promotion auto-apply
- Minimum order validation
- Credit limit warning
- Suggested products
- Order templates/favorites
- Repeat previous order

#### 11.2.7 Product Catalog

**Catalog Features**:
- Full product listing
- Category browsing
- Search by name, code, barcode
- Product images
- Detailed product information
- Pricing (customer-specific)
- Stock availability by warehouse
- Related products
- Promotional materials

#### 11.2.8 Inventory/Stock Check

**At Veledrogerija Level**:

| Product | Hercegovinalijek | Phoenix | Farmavita |
|---------|------------------|---------|-----------|
| Flodinax 500mg | ✓ 5,000 | ✓ 3,200 | ✗ 0 |
| Cardipril 10mg | ✓ 2,500 | ✓ 1,800 | ✓ 900 |
| Gastrolax 40mg | ⚠️ 200 | ✓ 800 | ✓ 600 |

Legend: ✓ In stock | ⚠️ Low stock | ✗ Out of stock

#### 11.2.9 Sample/Gratis Distribution

**Sample Distribution (Medical Reps)**:
- View allocated samples
- Record sample distribution
- Capture physician signature
- Track remaining allocation
- Sample history by physician

**Gratis Distribution (Commercial Reps)**:
- View gratis allocation
- Record gratis given
- Link to customer order
- Justify with invoice
- Balance tracking

#### 11.2.10 Activity Reporting

**Daily Report Generation**:
- Auto-populated from activities
- Manual additions
- Photo attachments
- Voice notes
- Submit for review

### 11.3 Offline Capabilities

**Offline-Available Features**:
- View customer list and details
- View product catalog
- Create orders (queue for sync)
- Record visits (queue for sync)
- View previous orders
- Access downloaded documents

**Sync Behavior**:
- Auto-sync when online
- Manual sync option
- Conflict resolution
- Sync status indicators
- Failed sync alerts

### 11.4 Notifications

**Push Notification Types**:
- New order status updates
- Target achievement alerts
- Stock-out notifications
- Manager messages
- Approval requests
- System announcements

---

## 12. Web Portal - Customer Self-Service (E-Pharmacy)

### 12.1 Overview

Online ordering portal for customers (pharmacies, hospitals, wholesalers) to place orders, track deliveries, and manage their accounts.

### 12.2 Customer Portal Features

#### 12.2.1 Registration and Onboarding

**New Customer Registration**:
1. Request registration form
2. Submit business documentation
3. Internal verification process
4. Account creation and credentials
5. Welcome email with instructions

**Required Documents**:
- Business registration certificate
- Tax identification number
- Pharmacy license
- Bank account details
- Authorized persons list

#### 12.2.2 Product Catalog

**Browsing Options**:
- Category navigation
- Brand/Manufacturer filter
- Therapeutic area filter
- ATC classification
- New products section
- Promotional products
- Favorites/Frequent orders

**Product Display**:
- Product image
- Name and description
- Package size
- Customer-specific price
- Stock availability
- Delivery estimate
- Add to cart button
- Add to favorites

#### 12.2.3 Shopping Cart and Checkout

**Cart Features**:
- Add/remove items
- Quantity adjustment
- Price recalculation
- Promotion application
- Save cart for later
- Share cart (for approval)

**Checkout Process**:
1. Review cart items
2. Select delivery address
3. Choose delivery date
4. Add order notes
5. Select payment method
6. Confirm and submit

#### 12.2.4 Order Management

**Order History**:
- View all orders
- Filter by status, date, products
- Order details
- Reorder function
- Track shipment
- Download invoice

**Order Tracking**:
- Real-time status updates
- Estimated delivery time
- Delivery confirmation
- Proof of delivery

#### 12.2.5 Account Management

**Profile Settings**:
- Company information
- Delivery addresses
- Billing information
- Contact persons
- Password change
- Notification preferences

**Financial Information**:
- Current balance
- Credit limit
- Payment history
- Outstanding invoices
- Download statements

#### 12.2.6 Prescription Management (For Pharmacies)

**Features**:
- Upload prescription images
- Link to Rx product orders
- Prescription validation
- Storage and retrieval
- Compliance reporting

### 12.3 Customer Communication

**Communication Channels**:
- Email notifications
- SMS alerts (optional)
- In-portal messaging
- Live chat support
- Phone support integration

---

## 13. Web Application - Administration Portal

### 13.1 Administrator Dashboard

**Dashboard Widgets**:
- Today's orders summary
- Revenue trend chart
- Top products (week/month)
- Top customers (week/month)
- Pending approvals count
- Stock alerts
- Rep activity summary
- System health status

### 13.2 User Administration Module

#### 13.2.1 User Management

**User Record Fields**:

| Field | Description |
|-------|-------------|
| User ID | System-generated |
| Username | Login name |
| Email | Email address |
| First Name | User's first name |
| Last Name | User's last name |
| Phone | Contact phone |
| Mobile | Mobile number |
| Department | Organizational unit |
| Position | Job title |
| Manager | Reports to |
| Role(s) | Assigned roles |
| Territory | Assigned territory |
| Status | Active/Inactive/Suspended |
| Last Login | Last access timestamp |
| Password Reset | Force reset flag |

**User Actions**:
- Create new user
- Edit user details
- Assign/revoke roles
- Reset password
- Activate/deactivate
- View activity log
- Impersonate (admin only)

#### 13.2.2 Role-Based Access Control (RBAC)

**Predefined Roles**:

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| System Administrator | Full system access | All |
| Commercial Admin | Sales department admin | Users, Customers, Orders, Reports |
| Scientific Admin | Medical department admin | Users, Physicians, Activities, Reports |
| Sales Director | Sales leadership | Full sales module access |
| Regional Manager | Regional sales management | Regional data access |
| Commercial Rep | Field sales | Orders, Customers (assigned), Visits |
| Medical Rep | Medical/scientific sales | Physicians (assigned), Samples, Visits |
| Call Center Agent | Phone sales | Orders, Customer lookup |
| Warehouse Manager | Inventory management | Inventory, Shipments |
| Finance User | Financial operations | Invoices, Payments, Reports |
| Read Only | Viewer access | View only across modules |

**Permission Categories**:
- Customer Management
- Order Management
- Product Management
- User Management
- Report Access
- Configuration
- Financial Operations
- Inventory Management

### 13.3 Customer Administration

#### 13.3.1 Customer Management

**Customer Operations**:
- Add new customer
- Edit customer details
- Manage customer hierarchy (parent/child)
- Assign sales representative
- Set credit limits
- Configure pricing
- Block/unblock customer
- Merge duplicate customers

**Customer Import**:
- Bulk import via Excel/CSV
- Field mapping
- Validation rules
- Error handling
- Import history

#### 13.3.2 Address Management

**Address Types**:
- Registered address
- Shipping address(es)
- Billing address
- Warehouse address

**Address Validation**:
- GPS coordinate verification
- Postal code validation
- Delivery zone assignment

### 13.4 Product Administration

#### 13.4.1 Product Catalog Management

**Product Operations**:
- Add new product
- Edit product details
- Upload product images
- Set pricing tiers
- Configure inventory parameters
- Activate/deactivate products
- Mark as discontinued
- Manage product categories

**Bulk Operations**:
- Mass price update
- Category reassignment
- Status changes
- Export product list

#### 13.4.2 Price Management

**Pricing Operations**:
- Standard price setting
- Customer-specific pricing
- Contract pricing
- Promotional pricing
- Price effective dates
- Price history

**Price Update Workflow**:
1. Upload new price list
2. Review changes (diff view)
3. Submit for approval
4. Approval by authorized user
5. Schedule effective date
6. Auto-apply at effective date

### 13.5 Order Administration

#### 13.5.1 Order Management

**Order Operations**:
- View all orders
- Filter by status, date, customer, rep
- Order detail view
- Modify order (before processing)
- Cancel order
- Add order notes
- Manual order creation
- Order approval workflow

**Order Processing Queue**:
- Orders pending confirmation
- Orders on hold (credit/stock)
- Orders ready for dispatch
- Priority order flagging

#### 13.5.2 Returns and Refunds

**Return Order Process**:
1. Customer initiates return request
2. Return reason captured
3. Approval workflow
4. Return authorization issued
5. Product return and inspection
6. Credit note or refund issued

### 13.6 Promotions Administration

**Promotion Management**:
- Create new promotions
- Define eligibility rules
- Set discount structures
- Schedule promotion period
- Allocate budget
- Track utilization
- Analyze effectiveness

### 13.7 Reporting Module

#### 13.7.1 Standard Reports

**Sales Reports**:
- Daily/Weekly/Monthly sales summary
- Sales by product
- Sales by customer
- Sales by territory
- Sales by representative
- Sales comparison (period vs. period)

**Customer Reports**:
- Customer list
- Customer activity summary
- New customers acquired
- Customer churn analysis
- Customer profitability

**Product Reports**:
- Product sales ranking
- Slow-moving products
- Product profitability
- Stock turnover

**Activity Reports**:
- Rep visit summary
- Visit vs. plan analysis
- Activity by customer
- Samples distributed

**Financial Reports**:
- Revenue analysis
- Accounts receivable aging
- Payment collection
- Credit exposure

#### 13.7.2 Report Builder

**Custom Report Features**:
- Select data source
- Choose dimensions
- Select measures
- Apply filters
- Set date range
- Schedule report
- Export options (Excel, PDF, CSV)
- Save as template

### 13.8 Target Management Module

#### 13.8.1 Target Configuration

**Target Setting Interface**:
- Select target type
- Define target period
- Set target values
- Assign to entities (product/customer/rep/territory)
- Cascading targets
- Target approval workflow

#### 13.8.2 Performance Monitoring

**Performance Dashboards**:
- Target vs. actual comparison
- Trend analysis
- Forecasting
- Alert configuration
- Drill-down capability

### 13.9 System Configuration

#### 13.9.1 General Settings

**Configurable Parameters**:
- Company information
- Business rules
- Approval thresholds
- Notification settings
- Email templates
- System defaults

#### 13.9.2 Integration Settings

**External System Configurations**:
- ERP connection
- Accounting system
- Warehouse management
- Email server (SMTP)
- SMS gateway
- Payment gateway

### 13.10 Audit and Compliance

#### 13.10.1 Audit Logging

**Tracked Events**:
- User login/logout
- Data creation
- Data modification
- Data deletion
- Configuration changes
- Report generation
- Export activities
- Failed access attempts

**Audit Log Fields**:
- Timestamp
- User ID
- Action type
- Entity type
- Entity ID
- Old value
- New value
- IP address
- Session ID

#### 13.10.2 Compliance Reports

**Available Reports**:
- User access audit
- Order modification history
- Price change history
- Customer data changes
- Sample distribution compliance
- System access report

---

# PART 5: TECHNICAL ARCHITECTURE AND REQUIREMENTS

## 14. System Architecture

### 14.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────┬─────────────────┬─────────────────┬──────────────────────┤
│   Mobile App    │   Web Portal    │   Admin Portal  │   External Systems   │
│   (iOS/Android) │   (Customer)    │   (Internal)    │   (ERP/EDI/etc.)     │
└────────┬────────┴────────┬────────┴────────┬────────┴──────────┬───────────┘
         │                 │                 │                   │
         └─────────────────┴────────┬────────┴───────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY                                     │
│   • Authentication & Authorization                                           │
│   • Rate Limiting                                                            │
│   • Request Routing                                                          │
│   • API Versioning                                                           │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION LAYER                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Customer   │  │    Order     │  │   Product    │  │   Inventory  │    │
│  │   Service    │  │   Service    │  │   Service    │  │   Service    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │    User      │  │   Activity   │  │   Report     │  │  Promotion   │    │
│  │   Service    │  │   Service    │  │   Service    │  │   Service    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Notification │  │   Sample     │  │   Target     │  │    Audit     │    │
│  │   Service    │  │   Service    │  │   Service    │  │   Service    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                              │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             DATA LAYER                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │   SQL Database   │  │    Redis Cache   │  │   File Storage   │          │
│  │   (SQL Server)   │  │   (Session/Data) │  │   (Documents)    │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 14.2 Technology Stack

#### 14.2.1 Backend

| Component | Technology | Version |
|-----------|------------|---------|
| **Framework** | ASP.NET Core | 8.0+ |
| **Language** | C# | 12.0+ |
| **API Type** | RESTful API | OpenAPI 3.0 |
| **ORM** | Entity Framework Core | 8.0+ |
| **Database** | Microsoft SQL Server | 2019+ |
| **Caching** | Redis | 7.0+ |
| **Message Queue** | RabbitMQ / Azure Service Bus | Latest |
| **Background Jobs** | Hangfire | Latest |
| **Logging** | Serilog | Latest |
| **Mapping** | AutoMapper | Latest |

#### 14.2.2 Frontend - Web Applications

| Component | Technology | Version |
|-----------|------------|---------|
| **Framework** | Angular | 15.x+ |
| **Language** | TypeScript | 4.9+ |
| **UI Components** | Angular Material / Custom | Latest |
| **State Management** | NgRx | Latest |
| **HTTP Client** | Angular HttpClient | Built-in |
| **Charts** | Chart.js / Highcharts | Latest |
| **Internationalization** | ngx-translate | Latest |

#### 14.2.3 Mobile Application

| Component | Technology | Version |
|-----------|------------|---------|
| **Framework** | .NET MAUI / Flutter | Latest |
| **Offline Storage** | SQLite | Latest |
| **GPS/Location** | Native APIs | Platform-specific |
| **Push Notifications** | Firebase Cloud Messaging | Latest |
| **Biometric Auth** | Platform SDK | Native |

#### 14.2.4 Infrastructure

| Component | Technology |
|-----------|------------|
| **Hosting** | Azure App Service / On-premise IIS |
| **Database Hosting** | Azure SQL / On-premise SQL Server |
| **File Storage** | Azure Blob Storage / Local File System |
| **CDN** | Azure CDN (for static assets) |
| **SSL/TLS** | Let's Encrypt / Commercial Certificate |
| **Monitoring** | Application Insights / ELK Stack |

### 14.3 Database Design

#### 14.3.1 Core Entity Relationships

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CORE DATA MODEL                                      │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌────────────────┐         ┌────────────────┐
    │  Manufacturer  │         │    Canton      │
    └───────┬────────┘         └───────┬────────┘
            │                          │
            │ 1:N                      │ 1:N
            ▼                          ▼
    ┌────────────────┐         ┌────────────────┐
    │    Product     │         │    Customer    │◄───────────┐
    └───────┬────────┘         └───────┬────────┘            │
            │                          │                      │
            │                          │ 1:N                  │ Parent/Child
            │                          ▼                      │
            │                  ┌────────────────┐            │
            │                  │    Address     │            │
            │                  └────────────────┘            │
            │                          │                      │
            │                          │                      │
            │                  ┌───────┴────────┐            │
            │                  │                │            │
            │                  ▼                ▼            │
            │          ┌────────────┐   ┌────────────┐       │
            │          │  Contact   │   │    User    │       │
            │          │  Person    │   │ (Customer) │       │
            │          └────────────┘   └────────────┘       │
            │                                  │              │
            │                                  │ N:M          │
            │                                  ▼              │
            │                          ┌────────────┐        │
            │                          │    Role    │        │
            │                          └────────────┘        │
            │
            │
            │              ┌────────────────┐
            │              │     Order      │
            │              └───────┬────────┘
            │                      │
            │ N:M                  │ 1:N
            ▼                      ▼
    ┌────────────────┐     ┌────────────────┐
    │  OrderProduct  │     │ OrderActivity  │
    │  (Line Item)   │     │     Log        │
    └────────────────┘     └────────────────┘
```

#### 14.3.2 Extended Entity List

**Core Entities**:
- User
- Role
- UserRole
- Customer
- CustomerType
- ContactPerson
- Address
- Canton
- Territory

**Product Entities**:
- Product
- ProductCategory
- Manufacturer
- PriceList
- CustomerPrice
- ProductImage

**Order Entities**:
- Order
- OrderLineItem
- OrderStatus
- OrderActivityLog
- ShippingMethod
- PaymentTerm

**Inventory Entities**:
- Warehouse
- StockLevel
- StockMovement
- BatchNumber
- Defektura

**Sales Force Entities**:
- Visit
- VisitPlan
- Interaction
- SampleAllocation
- SampleDistribution
- GratisAllocation
- GratisDistribution

**Target Entities**:
- Target
- TargetType
- TargetAssignment
- TargetAchievement

**Promotion Entities**:
- Promotion
- PromotionRule
- PromotionUsage

**Document Entities**:
- Document
- DocumentType
- Attachment

**Audit Entities**:
- AuditLog
- LoginHistory
- SystemEvent

### 14.4 API Design

#### 14.4.1 API Structure

**Base URL**: `https://api.pharmaassist.ba/v1`

**Resource Endpoints**:

| Resource | Endpoints |
|----------|-----------|
| **Authentication** | `/auth/login`, `/auth/refresh`, `/auth/logout` |
| **Users** | `/users`, `/users/{id}`, `/users/{id}/roles` |
| **Customers** | `/customers`, `/customers/{id}`, `/customers/{id}/orders` |
| **Products** | `/products`, `/products/{id}`, `/products/search` |
| **Orders** | `/orders`, `/orders/{id}`, `/orders/{id}/items` |
| **Visits** | `/visits`, `/visits/{id}`, `/visits/plan` |
| **Reports** | `/reports/sales`, `/reports/customers`, `/reports/activities` |

#### 14.4.2 API Standards

**Request Format**:
```json
{
  "data": { },
  "meta": {
    "requestId": "uuid",
    "timestamp": "ISO8601"
  }
}
```

**Response Format**:
```json
{
  "success": true,
  "data": { },
  "meta": {
    "requestId": "uuid",
    "timestamp": "ISO8601",
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalItems": 100,
      "totalPages": 5
    }
  },
  "errors": []
}
```

**Error Response**:
```json
{
  "success": false,
  "data": null,
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "message": "Customer ID is required",
      "field": "customerId"
    }
  ]
}
```

### 14.5 Security Architecture

#### 14.5.1 Authentication

**Methods**:
- JWT (JSON Web Tokens) for API authentication
- OAuth 2.0 for third-party integrations
- Multi-factor authentication (optional)

**Token Management**:
- Access token expiry: 15-60 minutes
- Refresh token expiry: 7-30 days
- Token revocation support
- Device-based session management

#### 14.5.2 Authorization

**RBAC Implementation**:
- Role-based permissions
- Feature-level access control
- Data-level access control (territory, customer assignment)
- API endpoint protection

#### 14.5.3 Data Protection

**In Transit**:
- TLS 1.2+ for all connections
- Certificate pinning for mobile apps
- HSTS enabled

**At Rest**:
- Database encryption (TDE)
- Sensitive field encryption
- Secure key management

**PII Handling**:
- Data minimization
- Purpose limitation
- Consent management
- Right to erasure support

---

## 15. Integration Requirements

### 15.1 Internal Integrations

#### 15.1.1 ERP Integration

**Integration Points**:
- Customer master sync
- Product catalog sync
- Price list updates
- Order submission
- Invoice retrieval
- Payment status updates
- Inventory levels

**Integration Methods**:
- Real-time API calls
- Batch file exchange
- Message queue events

#### 15.1.2 Accounting System Integration

**Data Exchange**:
- Invoice posting
- Payment recording
- Credit note handling
- Account balances
- Aging reports

#### 15.1.3 Warehouse Management System (WMS)

**Integration Points**:
- Order dispatch
- Shipment tracking
- Delivery confirmation
- Returns processing
- Inventory adjustments

### 15.2 External Integrations

#### 15.2.1 Wholesale Distributor Integration

**Veledrogerija Connections**:
- Stock level queries (real-time)
- Price list retrieval
- Order placement
- Order status tracking
- Invoice reconciliation

**Integration per Distributor**:

| Distributor | Integration Type | Data Exchanged |
|-------------|------------------|----------------|
| Hercegovinalijek | API / EDI | Stock, Orders, Prices |
| Phoenix Pharma | Web Service | Stock, Orders |
| Farmavita | File Exchange | Stock, Prices |
| Others | Per agreement | TBD |

#### 15.2.2 SMS Gateway Integration

**Providers**:
- Local telecom APIs
- International SMS providers (Twilio, etc.)

**Use Cases**:
- Order confirmations
- Delivery notifications
- OTP for authentication
- Marketing messages (opt-in)

#### 15.2.3 Email Service Integration

**Provider Options**:
- SMTP server
- SendGrid
- Azure Communication Services

**Use Cases**:
- Transactional emails
- Order confirmations
- Invoice delivery
- Password reset
- System notifications

#### 15.2.4 Payment Gateway Integration

**For Online Orders**:
- Credit card processing
- Bank transfer initiation
- Payment status callbacks

#### 15.2.5 GPS/Mapping Services

**Providers**:
- Google Maps API
- OpenStreetMap
- Here Maps

**Use Cases**:
- Address geocoding
- Route optimization
- Distance calculation
- Map visualization
- Visit location verification

---

## 16. Internationalization and Localization

### 16.1 Multi-Language Support

#### 16.1.1 Supported Languages

| Language | Code | Priority | Status |
|----------|------|----------|--------|
| English | en | Primary (Development) | Required |
| Bosnian | bs | Primary (User) | Required |
| Croatian | hr | Secondary | Planned |
| Serbian | sr | Secondary | Planned |

#### 16.1.2 Implementation Approach

**Backend**:
- Resource files (.resx) for translations
- Language selection based on user preference
- Fallback to English if translation missing

**Frontend (Angular)**:
- ngx-translate library
- JSON translation files
- Language switcher in UI
- RTL support structure (future-proof)

**Mobile**:
- Platform-native localization
- Bundled translation files
- Dynamic language switching

### 16.2 Localization Considerations

#### 16.2.1 Regional Formats

| Element | Bosnia Format | System Default |
|---------|---------------|----------------|
| Date | DD.MM.YYYY | ISO 8601 storage |
| Time | HH:MM (24-hour) | UTC storage |
| Currency | KM (BAM) | ISO 4217 |
| Decimal Separator | , (comma) | . (dot) storage |
| Thousand Separator | . (dot) | None in storage |
| Address Format | Street Number, ZIP City | Structured fields |
| Phone Format | +387 XX XXX-XXX | E.164 storage |

#### 16.2.2 Translation Workflow

1. All UI text in resource files (never hardcoded)
2. English as source language
3. Bosnian translations added
4. Translation review process
5. Testing in both languages
6. Ongoing updates as features added

### 16.3 Content Localization

**Localized Content Types**:
- UI labels and messages
- Error messages
- Email templates
- Document templates
- Help content
- Product descriptions (optional)
- Notification messages

---


# PART 6: IMPLEMENTATION, DATA MODEL, AND APPENDICES

## 18. Detailed Data Model

### 18.1 User and Authentication Entities

#### User
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Id | int | Yes | Primary key |
| CustomerId | int? | No | Link to customer (for external users) |
| FirstName | string(100) | Yes | User's first name |
| LastName | string(100) | Yes | User's last name |
| UserName | string(50) | Yes | Unique login name |
| Email | string(255) | Yes | Email address |
| PasswordHash | string(255) | Yes | Hashed password |
| PasswordSalt | string(128) | Yes | Password salt |
| MobileNumber | string(20) | No | Mobile phone |
| PhoneNumber | string(20) | No | Office phone |
| PasswordResetKey | string(100) | No | Reset token |
| PasswordResetExpiry | datetime | No | Token expiry |
| LastLoginDate | datetime | No | Last successful login |
| FailedLoginAttempts | int | Yes | Failed attempt counter |
| LockoutEndDate | datetime | No | Account lockout until |
| MustChangePassword | bool | Yes | Force password change |
| TerritoryId | int? | No | Assigned territory |
| ManagerId | int? | No | Reporting manager |
| Active | bool | Yes | Account status |
| CreatedAt | datetime | Yes | Creation timestamp |
| CreatedBy | int | Yes | Created by user |
| ModifiedAt | datetime | No | Last modification |
| ModifiedBy | int | No | Modified by user |

#### Role
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Id | int | Yes | Primary key |
| Key | string(50) | Yes | Unique role code |
| Name | string(100) | Yes | Display name |
| Description | string(500) | No | Role description |
| IsSystemRole | bool | Yes | Cannot be deleted |
| Active | bool | Yes | Role status |

#### UserRole
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| UserId | int | Yes | FK to User |
| RoleId | int | Yes | FK to Role |
| AssignedAt | datetime | Yes | When assigned |
| AssignedBy | int | Yes | Who assigned |

#### Permission
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Id | int | Yes | Primary key |
| Key | string(100) | Yes | Permission code |
| Name | string(100) | Yes | Display name |
| Module | string(50) | Yes | System module |
| Description | string(500) | No | Description |

#### RolePermission
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| RoleId | int | Yes | FK to Role |
| PermissionId | int | Yes | FK to Permission |

### 18.2 Customer Entities

#### CustomerType (Enum)
| Value | Name | Description |
|-------|------|-------------|
| 1 | WholesaleDrugstore | Veledrogerija |
| 2 | Pharmacy | Apoteka |
| 3 | Hospital | Bolnica |
| 4 | Physician | Ljekar/Doktor |
| 5 | Clinic | Klinika |

#### Customer
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Id | int | Yes | Primary key |
| ParentId | int? | No | Parent customer (hierarchy) |
| CustomerCode | string(20) | Yes | Unique business code |
| Name | string(200) | Yes | Legal name |
| DisplayName | string(100) | Yes | Short/display name |
| CustomerType | enum | Yes | Type of customer |
| TaxId | string(20) | No | JIB/Tax ID |
| RegistrationNumber | string(30) | No | Business registration |
| Email | string(255) | No | Primary email |
| PhoneNumber | string(20) | No | Main phone |
| MobileNumber | string(20) | No | Mobile contact |
| FaxNumber | string(20) | No | Fax number |
| Website | string(255) | No | Website URL |
| Tier | char(1) | No | A, B, or C classification |
| CantonId | int | No | FK to Canton |
| TerritoryId | int | No | FK to Territory |
| AssignedRepId | int | No | FK to User (sales rep) |
| CreditLimit | decimal | No | Credit limit (KM) |
| PaymentTermDays | int | No | Payment terms |
| PriceListId | int | No | Assigned price list |
| DiscountGroupId | int | No | Discount group |
| PharmacyLicense | string(50) | No | License number |
| LicenseExpiryDate | date | No | License expiry |
| TaxExempt | bool | Yes | Tax exempt status |
| Notes | text | No | Internal notes |
| Active | bool | Yes | Customer status |
| Verified | bool | Yes | Verification status |
| Blocked | bool | Yes | Blocked status |
| BlockReason | string(255) | No | Reason for blocking |
| CreatedAt | datetime | Yes | Creation date |
| CreatedBy | int | Yes | Created by |
| ModifiedAt | datetime | No | Last modified |
| ModifiedBy | int | No | Modified by |

#### Address
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Id | int | Yes | Primary key |
| CustomerId | int | Yes | FK to Customer |
| AddressType | enum | Yes | Registered/Shipping/Billing |
| Street | string(200) | Yes | Street name |
| StreetNumber | string(20) | No | Building number |
| Floor | string(10) | No | Floor/apartment |
| PostalCode | string(10) | Yes | ZIP/Postal code |
| City | string(100) | Yes | City name |
| CantonId | int | No | FK to Canton |
| Country | string(50) | Yes | Country |
| Latitude | decimal(10,7) | No | GPS latitude |
| Longitude | decimal(10,7) | No | GPS longitude |
| DeliveryInstructions | string(500) | No | Delivery notes |
| IsDefault | bool | Yes | Default address |
| Active | bool | Yes | Address status |

#### Canton
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Id | int | Yes | Primary key |
| Code | string(10) | Yes | Canton code |
| Name | string(100) | Yes | Canton name |
| Entity | string(20) | Yes | FBiH/RS/BD |
| Country | string(50) | Yes | Country |
| Active | bool | Yes | Status |

#### ContactPerson
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Id | int | Yes | Primary key |
| CustomerId | int | Yes | FK to Customer |
| FirstName | string(100) | Yes | First name |
| LastName | string(100) | Yes | Last name |
| Title | string(100) | No | Job title |
| Department | string(100) | No | Department |
| Email | string(255) | No | Email |
| PhoneNumber | string(20) | No | Phone |
| MobileNumber | string(20) | No | Mobile |
| Role | string(50) | No | DecisionMaker/Influencer/User |
| IsPrimary | bool | Yes | Primary contact |
| PreferredContactMethod | string(20) | No | Email/Phone/SMS |
| Notes | text | No | Notes |
| Active | bool | Yes | Status |

### 18.3 Product Entities

#### Manufacturer
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Id | int | Yes | Primary key |
| Code | string(20) | Yes | Manufacturer code |
| Name | string(200) | Yes | Legal name |
| DisplayName | string(100) | Yes | Display name |
| Country | string(50) | Yes | Country |
| Address | string(255) | No | Address |
| Email | string(255) | No | Contact email |
| Phone | string(20) | No | Phone |
| Website | string(255) | No | Website |
| LicenseNumber | string(50) | No | Manufacturing license |
| Active | bool | Yes | Status |

#### Product
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Id | int | Yes | Primary key |
| InventoryNumber | string(30) | Yes | Internal SKU |
| JKLCode | string(20) | No | JKL classification code |
| ATCCode | string(10) | No | ATC classification |
| Barcode | string(20) | No | EAN/UPC barcode |
| GenericName | string(200) | No | INN name |
| Name | string(200) | Yes | Product name |
| DisplayName | string(100) | Yes | Short name |
| Description | text | No | Full description |
| ManufacturerId | int | Yes | FK to Manufacturer |
| CategoryId | int | No | FK to Category |
| ProductForm | string(50) | No | Tablet, Syrup, etc. |
| Strength | string(50) | No | Dosage strength |
| PackageSize | string(50) | Yes | Package description |
| UnitsPerPackage | int | No | Units in package |
| UnitOfMeasure | string(20) | Yes | Unit type |
| PurchasePrice | decimal | No | Purchase price |
| WholesalePrice | decimal | Yes | Wholesale price |
| RetailPrice | decimal | No | Retail price |
| TaxRate | decimal | Yes | VAT rate % |
| PrescriptionRequired | bool | Yes | Rx flag |
| ControlledSubstance | bool | Yes | Controlled flag |
| ColdChainRequired | bool | Yes | Temperature sensitive |
| StorageConditions | string(200) | No | Storage requirements |
| ShelfLifeMonths | int | No | Shelf life |
| MinStockLevel | int | No | Reorder point |
| MaxStockLevel | int | No | Maximum stock |
| LeadTimeDays | int | No | Procurement lead time |
| MarketingAuthNumber | string(50) | No | Authorization number |
| MarketingAuthExpiry | date | No | Authorization expiry |
| LaunchDate | date | No | Product launch date |
| DiscontinuedDate | date | No | Discontinuation date |
| Active | bool | Yes | Available for order |
| CreatedAt | datetime | Yes | Created |
| ModifiedAt | datetime | No | Modified |

#### ProductCategory
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Id | int | Yes | Primary key |
| ParentId | int? | No | Parent category |
| Code | string(20) | Yes | Category code |
| Name | string(100) | Yes | Category name |
| Description | string(500) | No | Description |
| SortOrder | int | Yes | Display order |
| Active | bool | Yes | Status |

### 18.4 Order Entities

#### OrderStatus (Enum)
| Value | Name | Description |
|-------|------|-------------|
| 1 | Draft | Order in progress |
| 2 | Pending | Awaiting confirmation |
| 3 | Confirmed | Order confirmed |
| 4 | OnHold | Credit or stock hold |
| 5 | Processing | Being prepared |
| 6 | Picked | Items picked |
| 7 | Packed | Ready for shipment |
| 8 | Shipped | In transit |
| 9 | Delivered | Delivered to customer |
| 10 | Cancelled | Order cancelled |
| 11 | Returned | Items returned |
| 12 | Refunded | Payment refunded |

#### Order
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Id | int | Yes | Primary key |
| OrderNumber | string(20) | Yes | Order reference |
| CustomerId | int | Yes | FK to Customer |
| ShippingAddressId | int | Yes | FK to Address |
| BillingAddressId | int | Yes | FK to Address |
| OrderDate | datetime | Yes | Order date/time |
| RequestedDeliveryDate | date | No | Requested delivery |
| PromisedDeliveryDate | date | No | Promised delivery |
| ActualDeliveryDate | datetime | No | Actual delivery |
| OrderStatus | enum | Yes | Current status |
| OrderType | string(20) | Yes | Standard/Urgent/etc. |
| OrderSource | string(20) | Yes | Web/Mobile/Phone/EDI |
| SalesRepId | int? | No | FK to User |
| PaymentTerms | string(50) | No | Payment terms |
| Currency | string(3) | Yes | Currency code |
| SubTotal | decimal | Yes | Before tax/discount |
| TaxAmount | decimal | Yes | Total tax |
| DiscountAmount | decimal | Yes | Total discount |
| ShippingAmount | decimal | Yes | Shipping cost |
| TotalAmount | decimal | Yes | Final total |
| CustomerNote | text | No | Customer instructions |
| InternalNote | text | No | Internal notes |
| PromotionCode | string(20) | No | Applied promotion |
| CreatedBy | int | Yes | Created by user |
| CreatedAt | datetime | Yes | Creation time |
| ModifiedBy | int | No | Modified by |
| ModifiedAt | datetime | No | Last modification |

#### OrderLineItem
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Id | int | Yes | Primary key |
| OrderId | int | Yes | FK to Order |
| LineNumber | int | Yes | Sequence number |
| ProductId | int | Yes | FK to Product |
| ProductCode | string(30) | Yes | Product SKU |
| ProductName | string(200) | Yes | Product description |
| QuantityOrdered | int | Yes | Ordered quantity |
| QuantityConfirmed | int | Yes | Confirmed quantity |
| QuantityShipped | int | Yes | Shipped quantity |
| UnitPrice | decimal | Yes | Price per unit |
| DiscountPercent | decimal | Yes | Line discount % |
| DiscountAmount | decimal | Yes | Line discount amount |
| TaxRate | decimal | Yes | Tax rate % |
| TaxAmount | decimal | Yes | Calculated tax |
| LineTotal | decimal | Yes | Line total |
| BatchNumber | string(50) | No | Assigned batch |
| ExpiryDate | date | No | Product expiry |
| Notes | string(500) | No | Line notes |

#### OrderActivityLog
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Id | int | Yes | Primary key |
| OrderId | int | Yes | FK to Order |
| ActivityType | string(50) | Yes | Type of activity |
| PreviousStatus | enum | No | Status before |
| NewStatus | enum | No | Status after |
| ActivityDate | datetime | Yes | When occurred |
| UserId | int | Yes | Who performed |
| Note | text | No | Additional notes |
| IPAddress | string(45) | No | Source IP |

### 18.5 Sales Force Entities

#### Visit
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Id | int | Yes | Primary key |
| CustomerId | int | Yes | FK to Customer |
| ContactPersonId | int | No | FK to ContactPerson |
| VisitDate | date | Yes | Visit date |
| PlannedStartTime | time | No | Planned start |
| PlannedEndTime | time | No | Planned end |
| ActualStartTime | datetime | No | Check-in time |
| ActualEndTime | datetime | No | Check-out time |
| CheckInLatitude | decimal | No | GPS latitude |
| CheckInLongitude | decimal | No | GPS longitude |
| CheckOutLatitude | decimal | No | GPS latitude |
| CheckOutLongitude | decimal | No | GPS longitude |
| LocationAccuracy | decimal | No | GPS accuracy meters |
| DistanceFromCustomer | decimal | No | Meters from address |
| LocationVerified | bool | No | GPS verified |
| VisitStatus | string(20) | Yes | Planned/Completed/Cancelled |
| VisitType | string(50) | Yes | Sales/Medical/Service |
| Purpose | string(200) | No | Visit objective |
| Outcome | string(50) | No | Positive/Neutral/Negative |
| Notes | text | No | Visit notes |
| ProductsDiscussed | string(500) | No | Products mentioned |
| OrderId | int? | No | FK to Order (if created) |
| FollowUpRequired | bool | Yes | Needs follow-up |
| FollowUpDate | date | No | Follow-up date |
| FollowUpNotes | string(500) | No | Follow-up details |
| SalesRepId | int | Yes | FK to User |
| CreatedAt | datetime | Yes | Created |
| ModifiedAt | datetime | No | Modified |

#### VisitPlan (Weekly Plan)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Id | int | Yes | Primary key |
| SalesRepId | int | Yes | FK to User |
| WeekStartDate | date | Yes | Week start (Monday) |
| WeekEndDate | date | Yes | Week end (Sunday) |
| Status | string(20) | Yes | Draft/Submitted/Approved |
| SubmittedAt | datetime | No | Submission time |
| ApprovedBy | int | No | FK to User (manager) |
| ApprovedAt | datetime | No | Approval time |
| RejectionReason | string(500) | No | If rejected |
| Notes | text | No | Plan notes |

#### SampleAllocation
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Id | int | Yes | Primary key |
| SalesRepId | int | Yes | FK to User |
| ProductId | int | Yes | FK to Product |
| AllocatedQuantity | int | Yes | Quantity assigned |
| DistributedQuantity | int | Yes | Quantity given out |
| RemainingQuantity | int | Yes | Balance |
| AllocationDate | date | Yes | When allocated |
| ExpiryDate | date | No | Allocation expires |
| AllocatedBy | int | Yes | FK to User (admin) |
| Notes | string(500) | No | Notes |
| Active | bool | Yes | Status |

#### SampleDistribution
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Id | int | Yes | Primary key |
| AllocationId | int | Yes | FK to SampleAllocation |
| CustomerId | int | Yes | FK to Customer (physician) |
| VisitId | int | No | FK to Visit |
| ProductId | int | Yes | FK to Product |
| Quantity | int | Yes | Quantity given |
| LotNumber | string(50) | No | Product batch |
| ExpiryDate | date | No | Product expiry |
| DistributionDate | datetime | Yes | When distributed |
| RecipientName | string(200) | No | Who received |
| RecipientSignature | string(255) | No | Signature image path |
| Purpose | string(100) | No | Trial/Initiation/etc. |
| Notes | text | No | Notes |
| SalesRepId | int | Yes | FK to User |

#### GratisAllocation
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Id | int | Yes | Primary key |
| SalesRepId | int | Yes | FK to User |
| ProductId | int | Yes | FK to Product |
| AllocatedQuantity | int | Yes | Quantity assigned |
| DistributedQuantity | int | Yes | Quantity given |
| JustifiedQuantity | int | Yes | Quantity with invoice |
| AllocationDate | date | Yes | When allocated |
| AllocationPeriodEnd | date | No | Validity period |
| Reason | string(200) | No | Allocation reason |
| AllocatedBy | int | Yes | FK to User (admin) |
| Notes | string(500) | No | Notes |

#### GratisDistribution
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Id | int | Yes | Primary key |
| AllocationId | int | Yes | FK to GratisAllocation |
| CustomerId | int | Yes | FK to Customer |
| ProductId | int | Yes | FK to Product |
| Quantity | int | Yes | Quantity given |
| DistributionDate | datetime | Yes | When given |
| JustificationInvoiceId | int | No | Linked invoice |
| JustificationDate | datetime | No | When justified |
| Status | string(20) | Yes | Pending/Justified/Expired |
| Notes | text | No | Notes |
| SalesRepId | int | Yes | FK to User |

### 18.6 Target and Performance Entities

#### Target
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Id | int | Yes | Primary key |
| TargetType | string(50) | Yes | Revenue/Volume/Visit/etc. |
| TargetEntity | string(50) | Yes | Company/Product/Rep/etc. |
| EntityId | int | No | Specific entity ID |
| PeriodType | string(20) | Yes | Monthly/Quarterly/Annual |
| PeriodStart | date | Yes | Period start date |
| PeriodEnd | date | Yes | Period end date |
| TargetValue | decimal | Yes | Target amount |
| TargetUnit | string(20) | Yes | KM/Units/Count |
| AchievedValue | decimal | Yes | Current achievement |
| AchievementPercent | decimal | Yes | Percentage |
| Status | string(20) | Yes | Active/Completed |
| CreatedBy | int | Yes | Created by |
| CreatedAt | datetime | Yes | Created |
| ModifiedAt | datetime | No | Modified |

---

## 19. System Workflows

### 19.1 Order Processing Workflow

```

START
  │
  ▼
┌─────────────┐    Valid?     ┌─────────────┐
│ Order       │──────No──────▶│ Return to   │
│ Submitted   │               │ Customer    │
└──────┬──────┘               └─────────────┘
       │ Yes
       ▼
┌─────────────┐    Stock OK?  ┌─────────────┐
│ Validate    │──────No──────▶│ Partial     │
│ Stock       │               │ Fulfillment?│
└──────┬──────┘               └──────┬──────┘
       │ Yes                         │
       ▼                             ▼
┌─────────────┐               ┌─────────────┐
│ Check       │               │ Backorder   │
│ Credit      │               │ Management  │
└──────┬──────┘               └─────────────┘
       │
       ▼
┌─────────────┐    Approved?  ┌─────────────┐
│ Credit OK?  │──────No──────▶│ Credit Hold │
└──────┬──────┘               └──────┬──────┘
       │ Yes                         │ Approval
       ▼                             │
┌─────────────┐◀─────────────────────┘
│ Confirmed   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Send to     │
│ Warehouse   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Pick Items  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Pack Order  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Ship Order  │───▶ Generate Delivery Note
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Deliver     │───▶ Capture Proof of Delivery
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Complete    │───▶ Generate Invoice
└─────────────┘
       │
      END
```

### 19.2 Visit Execution Workflow

```

START (Rep at Customer Location)
  │
  ▼
┌─────────────┐
│ Open App    │
│ Select Visit│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Tap         │───▶ Capture GPS, Timestamp
│ Check-In    │
└──────┬──────┘
       │
       ▼
┌─────────────┐    Within Range?
│ Validate    │──────No──────▶ Flag for Review
│ Location    │               Send Alert to Manager
└──────┬──────┘
       │ Yes
       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DURING VISIT ACTIVITIES                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                  │
│   │ Discuss       │  │ Check Stock   │  │ Take Order    │                  │
│   │ Products      │  │ Levels        │  │ (if needed)   │                  │
│   └───────────────┘  └───────────────┘  └───────────────┘                  │
│                                                                              │
│   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                  │
│   │ Record Notes  │  │ Distribute    │  │ Handle Issues │                  │
│   │               │  │ Samples/Gratis│  │ / Complaints  │                  │
│   └───────────────┘  └───────────────┘  └───────────────┘                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│ Complete    │
│ Visit Form  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Tap         │───▶ Capture End Time
│ Check-Out   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Submit      │───▶ Sync to Server
│ Visit       │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Navigate to │
│ Next Visit  │
└─────────────┘
       │
      END
```

---

## 20. Implementation Roadmap

### 20.1 Phase 1: Foundation (Months 1-3)

**Objective**: Core platform and basic functionality

**Deliverables**:
- System architecture setup
- Database design and implementation
- User authentication and authorization
- Basic user management
- Customer master data management
- Product catalog management
- Role-based access control

### 20.2 Phase 2: Order Management (Months 3-5)

**Objective**: Complete order processing capability

**Deliverables**:
- Order creation and management
- Order workflow engine
- Customer web portal
- Order notifications
- Basic reporting

### 20.3 Phase 3: Mobile Application (Months 5-7)

**Objective**: Field force enablement

**Deliverables**:
- Mobile app for iOS and Android
- Visit planning and execution
- GPS-based check-in/check-out
- Mobile order taking
- Offline capability

### 20.4 Phase 4: Advanced Features (Months 7-9)

**Objective**: Complete sales force automation

**Deliverables**:
- Sample and gratis management
- Target management
- Advanced reporting and analytics
- Promotion management
- Dashboard and KPIs

### 20.5 Phase 5: Integration and Polish (Months 9-11)

**Objective**: External integrations and optimization

**Deliverables**:
- ERP integration
- Wholesaler inventory integration
- SMS and email integration
- Performance optimization
- Security hardening

### 20.6 Phase 6: Launch (Month 12)

**Objective**: Production deployment and training

**Deliverables**:
- Production environment setup
- Data migration
- User training
- Documentation
- Go-live support

---

## 21. Appendices

### 21.1 Glossary of Terms

| Term | Bosnian | Definition |
|------|---------|------------|
| ATC | ATC | Anatomical Therapeutic Chemical classification |
| Canton | Kanton | Administrative region in Bosnia |
| CRM | CRM | Customer Relationship Management |
| Defektura | Defektura | Stock-out, product unavailable |
| ERP | ERP | Enterprise Resource Planning |
| GDP | GDP | Good Distribution Practice |
| Gratis | Gratis | Free goods given as incentive |
| INN | INN | International Nonproprietary Name |
| JKL | JKL | Jedinstvena klasifikaciona lista |
| KM/BAM | KM | Convertible Mark (Bosnian currency) |
| OTC | OTC | Over-the-counter (no prescription) |
| PDV | PDV | VAT/Sales tax |
| Rx | Rx | Prescription required |
| SFA | SFA | Sales Force Automation |
| SKU | SKU | Stock Keeping Unit |
| Veledrogerija | Veledrogerija | Wholesale drugstore/distributor |

### 21.2 References

1. Good Distribution Practice (GDP) Guidelines - EU Guidelines 2013/C 343/01
2. Bosnia and Herzegovina Pharmacy Law
3. Federation of BiH Agency for Medicinal Products
4. Republika Srpska Agency for Medicinal Products
5. ATC Classification System - WHO Collaborating Centre


---

*End of Document*

