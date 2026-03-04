# PharmaAssist - Client Requirements Gap Analysis

**Date:** March 3, 2026  
**Client Feedback Summary:** Client considers current product too small and too expensive for what it offers. They have a competing offer at ~2,800 EUR + maintenance. They want a complete solution for pharmaceutical field force management and are requesting significant feature additions.  
**Our Offer:** 15,000 KM (≈7,670 EUR) with 200 KM/month maintenance  
**Reference:** Client email (February 2026)

---

## Context: What We Offered vs What They Need

Our PONUDA covered:
1. **Core Web Shop** — order management, clients, products, notifications (13,000 KM)
2. **Representatives Module** — rep management, activity tracking (2,000 KM)
3. **Budget Module** — budget tracking, calculations (2,000 KM)
4. **Reports Module** — standard & custom reports, analytics (2,000 KM)
5. **Implementation** — setup, configuration, integration (1,000 KM)

The client's requirements go **significantly beyond** a web shop model. They need a **pharmaceutical CRM / Field Force Management (FFM)** system. This is a fundamentally different product category than what was quoted.

---

## Requirement-by-Requirement Analysis

### 1. UPRAVLJANJE KLIJENTIMA (Client Management)

| # | Requirement | Current State | Gap | Effort |
|---|------------|---------------|-----|--------|
| 1.1 | Centralized real-time access to all contacts | ✅ **Implemented** — Full CRUD, paginated/filterable lists, search, rep-specific views. 42+ API endpoints for customer management. | Minor — no WebSocket/SignalR real-time push updates | S |
| 1.2 | Unified client database | ✅ **Implemented** — Single `Customer` entity with `CustomerType` (Retail, Pharmacy, Hospital, Wholesale, Clinic, Other), addresses, branches. | — | — |
| 1.3 | Client categorization & visit frequency | ⚠️ **Partial** — `CustomerTier` (A/B/C) and `CustomerType` enums exist. Filtering works. | **Missing:** Configurable visit frequency rules per tier (A=weekly, B=bi-weekly, C=monthly). No compliance tracking ("overdue visits"). | M |
| 1.4 | View visits per client and institution | ⚠️ **Partial** — Rep can see their own visits per customer (`/api/customers/rep/{id}/visits`). Visit history component exists. | **Missing:** Admin/manager view of ALL visits for a customer across ALL reps. No institution-level aggregation (all visits to Hospital X across departments). | M |
| 1.5 | Hierarchical visualization (Hospital → Department → Physician) | 🔴 **Major Gap** — Parent-child customer hierarchy exists (branches), `CustomerType.Hospital` exists, `Prescription.DoctorName` is free text. | **Missing:** `Department` entity, `Physician` entity, org-chart/tree visualization of Hospital→Department→Physician relationships. | L |
| 1.6 | Client location on map | ⚠️ **Partial** — `CustomerAddress.Latitude/Longitude` fields exist. Leaflet library installed. Map works on visit detail page. | **Missing:** Map on customer detail page. "All customers on map" view. Geocoding in customer form. | M |

**Section Coverage: ~55%** — Core data model is solid, but pharmaceutical-specific hierarchy and map views are missing.

---

### 2. PLANIRANJE POSJETA I IZVJEŠTAVANJE (Visit Planning & Reporting)

| # | Requirement | Current State | Gap | Effort |
|---|------------|---------------|-----|--------|
| 2.1 | Plan visits per client in advance | ✅ **Implemented** — Full weekly planner with customer selection, time/objective/products per visit. Plan submission and approval workflow. Annual→Quarterly→Monthly→Weekly hierarchy. | — | — |
| 2.2 | Activity calendar | ⚠️ **Partial** — Week-view grid in visit planner component. | **Missing:** Proper calendar widget (month/week/day views), no FullCalendar integration, no drag-and-drop scheduling. | M |
| 2.3 | Weekly manager reports on completed visits | ✅ **Implemented** — Hangfire `WeeklyManagerReportJob` runs every Monday 7:30 AM. Team activity dashboard. Weekly/daily/monthly activity report APIs with full breakdowns. | Minor — verify email template formatting quality | S |

**Section Coverage: ~80%** — This is one of our strongest areas. Calendar widget is the main gap.

---

### 3. UPRAVLJANJE BRANDOVIMA (Brand Management)

| # | Requirement | Current State | Gap | Effort |
|---|------------|---------------|-----|--------|
| 3.1 | Product promotion tracking | ⚠️ **Partial** — `Promotion` entity exists but is discount/pricing-focused (BOGO, volume discounts). `PlannedVisit.ProductsToPresent` tracks which products to discuss. | **Missing:** Pharma-style product promotion campaigns separate from pricing promotions (e.g., "promote Brand X to cardiologists in Canton Z during Q2"). | L |
| 3.2 | Marketing data storage per product | 🔴 **Not Implemented** — Product entity has clinical fields (ATCCode, DosageForm, Strength) but no marketing fields. | **Missing:** Key selling points, marketing messages, positioning statements, competitive comparison, target audience per product. | M |
| 3.3 | Knowledge base / FAQ per product | 🔴 **Not Implemented** — No knowledge base entities at all. Portal FAQ is a static placeholder. | **Missing:** `ProductKnowledgeArticle`, `ProductFAQ` entities. Builder UI. Rep-facing knowledge base viewer. | L |
| 3.4 | Brand groups | 🔴 **Not Implemented** — Products are grouped by `Category` and `Manufacturer` only. No Brand concept. | **Missing:** `Brand` entity (distinct from Manufacturer), `BrandGroup` for product families. | M |
| 3.5 | SmPC management (latest version always available) | 🔴 **Not Implemented** — File upload exists generically but no document versioning. | **Missing:** `ProductDocument` entity with type (SmPC, PIL, SDS), versioning (version number, effective date), approval status. UI for upload/view/history. | L |

**Section Coverage: ~15%** — Product catalog is solid but pharmaceutical brand management layer is entirely missing. This is a **new domain area**.

---

### 4. UPRAVLJANJE CIKLUSIMA I KAMPANJAMA (Cycle & Campaign Management)

| # | Requirement | Current State | Gap | Effort |
|---|------------|---------------|-----|--------|
| 4.1 | Define cycle duration and target clients with visit frequency | 🔴 **Not Implemented** — Planning hierarchy (Annual→Quarterly→Monthly→Weekly) exists but no formal "Cycle" concept. | **Missing:** `Cycle` entity (name, start/end dates, products focus, target criteria), `CycleTarget` linking cycle→customer with frequency. | L |
| 4.2 | Create promotional campaigns with multi-criteria targeting | 🔴 **Not Implemented** — `Promotion` is pricing-focused. `Budget` has types including Marketing/Promotions but no campaign structure. | **Missing:** `Campaign` entity (linked to cycle, start/end date, budget, products, targeting rules), `CampaignTarget` with multi-criteria (geography, customer type, tier, specialty). | XL |
| 4.3 | Track planned vs actual costs in campaigns | ⚠️ **Partial** — `Budget` + `BudgetExpense` with approval workflow exists. | **Missing:** Campaign-level budget allocation and expense tracking. Currently budgets are standalone, not linked to campaigns. | M |
| 4.4 | Track investments per client | 🔴 **Not Implemented** — No aggregation of all costs (samples, promotions, materials, events, visits) per client. | **Missing:** `ClientInvestment` view/report aggregating all cost types per customer over time. | L |

**Section Coverage: ~10%** — Budget/expense infrastructure exists but the pharmaceutical cycle/campaign model is missing entirely.

---

### 5. MAPE (Maps)

| # | Requirement | Current State | Gap | Effort |
|---|------------|---------------|-----|--------|
| 5.1 | Map showing cycle-targeted clients for reps | ⚠️ **Partial** — GPS data on addresses and visits exists. Leaflet library installed. Map renders on visit detail. | **Missing:** Dedicated map module showing rep's assigned customers plotted on map, filtered by cycle, with color coding by visit status (visited/overdue/planned). Route visualization. | L |

**Section Coverage: ~20%** — Data layer ready, visualization completely missing.

---

### 6. DODATNE FUNKCIONALNOSTI (Additional Functionalities)

| # | Requirement | Current State | Gap | Effort |
|---|------------|---------------|-----|--------|
| 6.1 | Materials warehouse (track what's left with which client) | ⚠️ **Partial** — Full warehouse/inventory system exists (warehouses, stock, movements, transfers). | **Missing:** `MaterialDistribution` entity (rep→client material handoff tracking), rep personal inventory/bag concept, material receipt confirmation. | L |
| 6.2 | Surveys (collect info during visits) | 🔴 **Not Implemented** — Zero survey infrastructure. Only free-text `VisitNote` during visits. | **Missing:** `Survey`, `SurveyQuestion`, `SurveyResponse`, `VisitSurveyResponse` entities. Survey builder UI. Survey assignment to cycles/visits. Rep survey fill-out during visit. | XL |
| 6.3 | Photo archive per client | ⚠️ **Partial** — `VisitAttachment` entity exists. File upload system works. Visit attachment counter tracked. | **Missing:** Photos linked to visits, not to clients directly. No "all photos for Client X" API/view. No photo gallery component. No camera integration hints. | M |

**Section Coverage: ~20%** — Warehouse infrastructure helps, but field-distribution tracking and surveys are completely new.

---

### 7. UPRAVLJANJE TERITORIJOM (Territory Management)

| # | Requirement | Current State | Gap | Effort |
|---|------------|---------------|-----|--------|
| 7.1 | Distribute clients among reps | ⚠️ **Partial** — `RepCustomerAssignment` entity exists but no admin UI/endpoint for assignment. Reps can view their customers but managers can't bulk-assign. | **Missing:** Admin controller for customer-to-rep assignment management (assign, reassign, bulk operations). Admin UI for territory overview. | M |
| 7.2 | Track segmentation effectiveness | 🔴 **Not Implemented** — `TerritoryDescription` is free text. `AnnualPlan.AssignedCantons` exists. Territory performance shows in monthly reports. | **Missing:** Formal `Territory` entity, territory comparison analytics, segmentation effectiveness dashboard (revenue/visits/coverage per territory). | L |

**Section Coverage: ~30%** — Assignment infrastructure exists but needs admin tooling and analytics.

---

### 8. ANALIZE POSJETA (Visit Analytics)

| # | Requirement | Current State | Gap | Effort |
|---|------------|---------------|-----|--------|
| 8.1 | Visit analysis at rep/team/territory/institution level | ✅ **Mostly Done** — Daily/weekly/monthly reports with rep + team breakdowns. Territory performance in monthly report. | **Missing:** Institution-type drill-down (all hospitals, all pharmacies). Dedicated territory comparison view. | M |
| 8.2 | Client visit frequency per rep | ⚠️ **Partial** — Visit history per customer exists. "Needs visit" binary flag. LastVisitDate tracked. | **Missing:** Frequency analytics (visits/month per customer), compliance % vs target frequency, overdue visit alerts. | M |
| 8.3 | Planned vs realized visits at rep/region/canton level | ✅ **Mostly Done** — Plan execution report compares planned vs actual across hierarchy. Territory data in monthly reports. | Minor — add canton-level planned vs realized dedicated view | S |
| 8.4 | Track rep work (days in field, visits/day, per customer group) | ⚠️ **Partial** — Time utilization tracked. Visits per day derivable from daily reports. | **Missing:** "Days in field" metric, "visits per customer group/tier" specific analytics. | M |

**Section Coverage: ~60%** — Strong reporting foundation, needs frequency analytics and field work metrics.

---

### B. MOBILNA APLIKACIJA (Mobile Application)

| # | Requirement | Current State | Gap | Effort |
|---|------------|---------------|-----|--------|
| B.1 | Rep view of client card + all visits + comments | ✅ **Implemented** — `RepCustomerDetailComponent` (557 lines) shows credit status, orders, visit history, visit notes. | — | — |
| B.2 | Managers track team and log visits | ✅ **Implemented** — `VisitsTeamComponent`, `TeamActivityDashboardComponent`, `ManagerVisitPlansController`, `VisitAuditComponent`. Manager can approve plans, view team activity. | Minor — managers can approve/review but the "log visits for their own customers" flow could be smoother. | S |
| B.3 | Weekly reports — real-time market overview | ⚠️ **Partial** — Weekly activity reports exist. Hangfire sends weekly emails. Team dashboard exists. | **Missing:** "Market overview" — no competitive intelligence, market share, or market trend dashboard. | L |

**Section Coverage: ~75%** — Current Angular app is responsive. True native mobile would be a separate project (PWA is possible path).

---

### C. PRAĆENJE PRODAJE (Sales Tracking)

| # | Requirement | Current State | Gap | Effort |
|---|------------|---------------|-----|--------|
| C.1 | Detailed sales info per sales point | ✅ **Implemented** — `CustomerSalesReportDto` provides per-customer, per-product, per-category sales breakdown. | — | — |
| C.2 | Accept wholesaler data (auto-import in various formats) | 🔴 **Not Implemented** — All sales data is internal orders only. No external data import. | **Missing:** `WholesalerDataImport` entity, file upload + parsing for CSV/Excel/EDI formats, data mapping UI, reconciliation. This is **critical** per client: "Mi bismo osigurali izvještaje iz veledrogerija u potrebnom formatu." | XL |
| C.3 | Sales per institution | ⚠️ **Partial** — Per-customer sales exist. `CustomerType` enum allows filtering. | **Missing:** Dedicated institution-type analytics dashboard (aggregate all hospitals, all pharmacies, etc.) | M |
| C.4 | Sales per rep | ✅ **Implemented** — `SalesRepPerformanceController` with detailed per-rep metrics. | — | — |
| C.5 | Sales per region | ⚠️ **Partial** — Territory data in reports. Canton hierarchy exists. | **Missing:** Dedicated "sales by region/canton" report endpoint and UI. | M |
| C.6 | Sales per product/brand | ✅ **Implemented** — Product-level sales in reports. Category and manufacturer grouping available. | Brand-level grouping missing (no Brand entity) | S |
| C.7 | Product stock per wholesaler/drugstore | 🔴 **Not Implemented** — Inventory is internal only. | **Missing:** `ExternalStock` entity, wholesaler stock data import, per-wholesaler stock dashboard. | L |
| C.8 | Parallel reporting vs multiple price lists | ⚠️ **Partial** — `PriceType` (Commercial/Essential), per-customer and per-canton pricing. `PriceRule` with tier-based pricing. | **Missing:** Named `PriceList` entity for side-by-side comparison. Parallel price list reporting UI. | M |
| C.9 | Sales plan realization per rep | ✅ **Implemented** — `SalesTarget` per rep with progress tracking, achievement %. `SalesRepPerformanceItemDto.TargetAchievementRate`. | — | — |

**Section Coverage: ~45%** — Internal sales tracking is solid. The big gap is **external wholesaler data import** which is the client's #1 sales tracking need.

---

## Overall Gap Summary

| Section | Coverage | Key Gaps |
|---------|----------|----------|
| 1. Client Management | **55%** | Hospital→Dept→Physician hierarchy, map views, visit frequency rules |
| 2. Visit Planning & Reporting | **80%** | Calendar widget |
| 3. Brand Management | **15%** | Brand entity, SmPC, knowledge base, marketing data — entirely new domain |
| 4. Cycle & Campaign | **10%** | Cycle, Campaign entities — entirely new domain |
| 5. Maps | **20%** | Map module/UI — data layer ready |
| 6. Additional Features | **20%** | Surveys (zero), material distribution, photo archive per client |
| 7. Territory Management | **30%** | Admin UI, formal Territory entity, effectiveness tracking |
| 8. Visit Analytics | **60%** | Frequency analytics, field work metrics |
| B. Mobile App | **75%** | Market overview, PWA enhancements |
| C. Sales Tracking | **45%** | Wholesaler data import (critical), external stock, price lists |

### **Weighted Overall Coverage: ~40%**

> The current system is strong on core CRM (customers, orders, products) and visit management but lacks the pharmaceutical-specific layers the client needs: brand management, cycle/campaign management, wholesaler data integration, surveys, and field maps.

---

## Effort Legend

| Code | Meaning | Backend | Frontend | Total |
|------|---------|---------|----------|-------|
| **S** | Small | 1-2 days | 1-2 days | 2-4 days |
| **M** | Medium | 3-5 days | 3-5 days | ~1-2 weeks |
| **L** | Large | 5-10 days | 5-10 days | ~2-4 weeks |
| **XL** | Extra Large | 10-20 days | 10-20 days | ~4-8 weeks |

---

## Risk Assessment

### Business Risks
1. **Price perception:** Client says current product is "very expensive for what it offers" and has a competing offer at ~2,800 EUR. Our price is 15,000 KM (≈7,670 EUR) — nearly 3x their alternative. The feature gap makes this harder to justify.
2. **Scope creep:** Client requirements describe a full pharma CRM/FFM system. Building this within the original quote is not feasible.
3. **Competition:** The 2,800 EUR competing product likely covers many of these standard pharma CRM features out of the box.

### Technical Risks
1. **Wholesaler data import** (C.2) is complex — every wholesaler sends different formats. Client says they'll provide standardized format, which helps significantly.
2. **Survey builder** (6.2) is a complex CRUD system — question types, conditional logic, data aggregation.
3. **Map module** (5.1) — Leaflet is already installed with GPS data available, but building a full featured map view with clustering, filtering, route display is non-trivial.

---

*This analysis is based on a fresh codebase audit conducted March 3, 2026, against the actual source code.*
