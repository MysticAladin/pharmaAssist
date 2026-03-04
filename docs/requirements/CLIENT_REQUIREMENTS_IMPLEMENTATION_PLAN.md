# PharmaAssist - Implementation Plan for Client Requirements

**Date:** March 3, 2026  
**Reference:** Client Requirements Gap Analysis (March 2026)  
**Approach:** Phased delivery — prioritize features that close the biggest perception gaps first

---

## Strategic Approach

The client's core complaint is **value vs. price**. We need to:
1. **Maximize visible impact quickly** — deliver features the client will immediately see and use
2. **Leverage existing infrastructure** — many foundations already exist (GPS, inventory, reporting)
3. **Group related features** — build entities once, expose through multiple UIs
4. **Defer complexity** — surveys and EDI integrations come later

---

## Phase 0: Quick Wins (1-2 weeks)

**Goal:** Immediately improve perceived value with minimal effort — things that should have been there.

| # | Task | What to Build | Builds On | Effort |
|---|------|---------------|-----------|--------|
| 0.1 | **Customer map view** | New `CustomerMapComponent` — Leaflet map showing all rep's assigned customers, color-coded by tier (A/B/C) and visit status (overdue/upcoming/visited). Click pin → customer card popup. | `CustomerAddress.Lat/Lng` exists, Leaflet installed, rep-customer API exists | 4-5 days |
| 0.2 | **Customer detail map** | Add Leaflet map to `CustomerDetailComponent` and `RepCustomerDetailComponent` showing customer location | Same infrastructure | 1-2 days |
| 0.3 | **Visit frequency rules** | Add `RequiredVisitsPerMonth` on `RepCustomerAssignment`. Backend calculates `DaysSinceLastVisit`, `IsOverdue`, `VisitCompliancePercent`. Update "needs visit" logic to use tier-based rules. | `RepCustomerAssignment` + `CustomerTier` exist | 3-4 days |
| 0.4 | **Photo archive per client** | New API: `GET /api/customers/{id}/photos` — aggregates all `VisitAttachment` where FileType is image for that customer's visits. Simple gallery component on customer detail. | `VisitAttachment` + file upload exist | 2-3 days |
| 0.5 | **Calendar widget** | Replace week-view grid with FullCalendar integration (month/week/day views) for visit planner. Drag-and-drop for rescheduling. | `VisitPlannerComponent` + all plan APIs exist | 3-4 days |

**Phase 0 Total: ~2 weeks (1 developer)**

**Deliverable:** Client sees their customers on a map, gets overdue visit alerts, has a proper calendar, can browse photos per client.

---

## Phase 1: Brand & Product Management (3-4 weeks)

**Goal:** Transform product catalog into a pharmaceutical brand management system.

### 1A. Brand & Brand Group Entities (Week 1)

| # | Task | Details |
|---|------|---------|
| 1.1 | **Brand entity** | New `Brand` (Id, Name, ManufacturerId, Description, LogoPath, TherapeuticArea, IsActive). Products get `BrandId` FK. |
| 1.2 | **Brand groups** | New `BrandGroup` (Id, Name, Description) + `BrandGroupMember` (BrandGroupId, BrandId). Group related brands. |
| 1.3 | **Brand CRUD** | New `BrandsController` — full CRUD, list by manufacturer, brand group management. |
| 1.4 | **Frontend brand management** | Brand list, brand form, brand detail (shows all products in brand), brand group management. |

### 1B. Marketing & Knowledge Base (Week 2-3)

| # | Task | Details |
|---|------|---------|
| 1.5 | **Product marketing fields** | Add to `Product`: `KeySellingPoints` (JSON), `TargetAudience`, `CompetitiveAdvantages`, `MarketingMessages` (JSON). |
| 1.6 | **SmPC document management** | New `ProductDocument` (Id, ProductId, DocumentType [SmPC/PIL/SDS/MarketingMaterial], FileName, FilePath, Version, EffectiveDate, UploadedBy, IsCurrentVersion). Version history. Always show latest. |
| 1.7 | **Product knowledge base** | New `KnowledgeArticle` (Id, ProductId/BrandId, Title, Content, Category [FAQ/Objection/ClinicalData/Dosage], SortOrder, IsPublished). |
| 1.8 | **Frontend knowledge views** | Rep-facing product detail with marketing data tab, SmPC viewer with version history, knowledge base search & browse. |

### 1C. Product Promotion Tracking (Week 3-4)

| # | Task | Details |
|---|------|---------|
| 1.9 | **Extend visit tracking** | Add to `ExecutedVisit`: `ProductsDetailedDiscussion` (JSON array with ProductId, ReactionType [Positive/Neutral/Negative], Questions, CommitmentLevel). Currently only `ProductsDiscussed` as flat JSON. |
| 1.10 | **Product promotion dashboard** | New report: per-product promotion effectiveness — how many times presented, acceptance rate, by customer type, by region. |

**Phase 1 Total: ~3-4 weeks (1 developer)**  
**New entities:** Brand, BrandGroup, BrandGroupMember, ProductDocument, KnowledgeArticle  
**Deliverable:** Full pharmaceutical brand management with SmPC versioning, knowledge base, and promotion tracking.

---

## Phase 2: Cycle & Campaign Management (4-5 weeks)

**Goal:** Enable the pharmaceutical cycle-based field force management model.

### 2A. Cycle Management (Week 1-2)

| # | Task | Details |
|---|------|---------|
| 2.1 | **Cycle entity** | New `Cycle` (Id, Name, StartDate, EndDate, Status [Draft/Active/Completed], FocusBrandIds (JSON), Description, OwnerId). |
| 2.2 | **Cycle targeting** | New `CycleTarget` (CycleId, CustomerId, RepId, RequiredVisits, CompletedVisits, Priority, TargetProducts (JSON)). Links cycle → customer → rep with visit frequency. |
| 2.3 | **Cycle CRUD + activation** | `CyclesController` — CRUD, activate/complete, assign targets, copy from previous cycle. |
| 2.4 | **Frontend cycle management** | Cycle list, cycle form (date range + brand selection), target assignment UI (bulk add customers by criteria: type, tier, canton, rep). |
| 2.5 | **Cycle map integration** | Enhance map from Phase 0 — filter mode: "Show cycle-targeted clients" with progress coloring (not yet visited / partially / complete). |

### 2B. Campaign Management (Week 3-4)

| # | Task | Details |
|---|------|---------|
| 2.6 | **Campaign entity** | New `Campaign` (Id, CycleId, Name, Type [Launch/Reminder/Detail/Event], StartDate, EndDate, PlannedBudget, ActualSpent, Status, TargetingCriteria (JSON), Description). |
| 2.7 | **Campaign targeting** | New `CampaignTarget` (CampaignId, CustomerId, Status [Pending/Contacted/Completed], RepId). Multi-criteria: geography (canton), customer type, tier, brand usage history. |
| 2.8 | **Campaign budget linking** | Link `BudgetExpense` to campaigns. New field: `CampaignId` on `BudgetExpense`. Campaign-level spend tracking. |
| 2.9 | **Frontend campaign UI** | Campaign builder (targeting wizard), campaign dashboard (progress, cost tracking), campaign detail with target list. |

### 2C. Client Investment Tracking (Week 5)

| # | Task | Details |
|---|------|---------|
| 2.10 | **Investment aggregation** | New report endpoint: `GET /api/reports/client-investment/{customerId}` — aggregates: visit costs (travel/time), materials distributed, promotional discounts, campaign spend, samples, events. |
| 2.11 | **Investment dashboard** | Per-client investment summary on customer detail. Top investments report for management. |

**Phase 2 Total: ~4-5 weeks (1 developer)**  
**New entities:** Cycle, CycleTarget, Campaign, CampaignTarget  
**Deliverable:** Complete cycle-based campaign management with budget tracking and client investment visibility.

---

## Phase 3: Territory Management & Analytics (3-4 weeks)

**Goal:** Professionalize territory management and fill analytics gaps.

### 3A. Territory Administration (Week 1-2)

| # | Task | Details |
|---|------|---------|
| 3.1 | **Territory entity** | New `Territory` (Id, Name, Type [Region/Canton/Custom], ParentTerritoryId, CantonIds (JSON), Description, IsActive). |
| 3.2 | **Territory assignment** | New `TerritoryAssignment` (TerritoryId, RepId, StartDate, EndDate, IsPrimary, AssignmentType [Exclusive/Shared]). Replaces free-text `TerritoryDescription`. |
| 3.3 | **Customer-rep assignment admin** | New `AdminCustomerAssignmentsController` — bulk assign/reassign customers to reps. Transfer history. Admin UI with drag-and-drop or multi-select. |
| 3.4 | **Territory CRUD** | `TerritoriesController` — CRUD, assign reps, view territory customers, territory map. |
| 3.5 | **Frontend territory admin** | Territory list, territory form (select cantons/municipalities), territory map (Leaflet with boundaries), assignment management. |

### 3B. Visit Analytics Enhancement (Week 3-4)

| # | Task | Details |
|---|------|---------|
| 3.6 | **Visit frequency analytics** | New endpoint: visits/month per customer per rep vs target frequency. Compliance % dashboard. Overdue visits list. |
| 3.7 | **Field work metrics** | Calculate: unique field days per rep per month, average visits per field day, visits by customer group/tier. Add to existing activity reports. |
| 3.8 | **Territory comparison** | New report: side-by-side territory performance (revenue, visits, coverage, compliance) across reps/territories. |
| 3.9 | **Connect AnalyticsComponent** | Replace hardcoded mock data in existing `AnalyticsComponent` with real API calls. |
| 3.10 | **Institution-level analytics** | Aggregate visits/sales by `CustomerType` — hospital view, pharmacy view, clinic view. |

**Phase 3 Total: ~3-4 weeks (1 developer)**  
**New entities:** Territory, TerritoryAssignment  
**Deliverable:** Professional territory management with effectiveness tracking and comprehensive visit analytics.

---

## Phase 4: Wholesaler Data Import & Sales Analytics (4-5 weeks)

**Goal:** Enable the critical wholesaler data integration the client specifically mentioned.

### 4A. Data Import Infrastructure (Week 1-2)

| # | Task | Details |
|---|------|---------|
| 4.1 | **Import entities** | New `WholesalerDataImport` (Id, WholesalerId, FileName, ImportDate, Period, Status [Pending/Processing/Completed/Error], RecordCount, ErrorCount). New `WholesalerSalesRecord` (ImportId, ProductCode, ProductName, CustomerCode, CustomerName, Quantity, UnitPrice, TotalAmount, InvoiceDate, InvoiceNumber). |
| 4.2 | **Import controller** | `WholesalerDataController` — upload file (CSV/Excel), map columns, preview, confirm import. Import history. Error log. |
| 4.3 | **File parsing** | Parser service supporting CSV and Excel (EPPlus library). Column mapping configuration per wholesaler (saved templates). Client confirmed: "Mi bismo osigurali izvještaje iz veledrogerija u potrebnom formatu." |
| 4.4 | **Product/customer matching** | Auto-match imported product codes to system products. Auto-match customer codes to system customers. Manual resolution UI for unmatched records. |

### 4B. External Sales Analytics (Week 3-4)

| # | Task | Details |
|---|------|---------|
| 4.5 | **Sales per institution** | Dashboard: aggregate wholesaler sales data by customer type (hospitals, pharmacies, clinics). Drill-down to individual institution. |
| 4.6 | **Sales per region/canton** | Aggregate by canton/municipality. Canton-level heat map. |
| 4.7 | **Sales per product/brand** | Product and brand-level sales (uses Brand entity from Phase 1). Trend charts. |
| 4.8 | **Sales per rep** | Link wholesaler sales data to rep territories/customer assignments. Rep-level sell-through vs internal orders. |
| 4.9 | **Wholesaler stock tracking** | New `WholesalerStockRecord` (WholesalerId, ProductId, Quantity, ReportDate). Import stock levels from wholesaler reports. Dashboard: per-product stock across wholesalers. |

### 4C. Price List Management (Week 5)

| # | Task | Details |
|---|------|---------|
| 4.10 | **PriceList entity** | New `PriceList` (Id, Name, EffectiveFrom, EffectiveTo, IsActive, Type). `PriceListItem` (PriceListId, ProductId, Price). |
| 4.11 | **Parallel price list reporting** | Report showing same products/sales against multiple price lists side-by-side (e.g., hospital vs retail pricing). |

**Phase 4 Total: ~4-5 weeks (1 developer)**  
**New entities:** WholesalerDataImport, WholesalerSalesRecord, WholesalerStockRecord, PriceList, PriceListItem  
**Deliverable:** Wholesaler data integration with comprehensive external sales analytics.

---

## Phase 5: Surveys & Material Distribution (3-4 weeks)

**Goal:** Complete the field tools the client needs.

### 5A. Survey System (Week 1-3)

| # | Task | Details |
|---|------|---------|
| 5.1 | **Survey entities** | New `Survey` (Id, Title, Description, CycleId?, Status, CreatedBy). `SurveyQuestion` (SurveyId, QuestionType [Text/SingleChoice/MultiChoice/Rating/Number/YesNo], QuestionText, Options (JSON), IsRequired, SortOrder). `SurveyResponse` (SurveyId, RespondentRepId, CustomerId, VisitId?, CompletedAt). `SurveyAnswer` (ResponseId, QuestionId, AnswerValue, SelectedOptions (JSON)). |
| 5.2 | **Survey builder** | Admin/manager UI: create survey, add questions (drag-and-drop ordering), set question types, assign to cycle. |
| 5.3 | **Survey fill-out** | Rep UI during/after visit: fill out assigned survey for customer. Link to `ExecutedVisit`. |
| 5.4 | **Survey analytics** | Response summary: aggregated answers per question, per customer type, per region. Export to Excel. |

### 5B. Material Distribution Tracking (Week 3-4)

| # | Task | Details |
|---|------|---------|
| 5.5 | **Distribution entities** | New `MaterialDistribution` (Id, RepId, CustomerId, VisitId?, ProductId/MaterialId, MaterialType [Sample/Brochure/Gift/Equipment], Quantity, LotNumber?, DistributedAt, Notes). Optional: `RepInventory` (RepId, MaterialId, Quantity) for tracking rep's bag. |
| 5.6 | **Distribution API** | Record distribution during visit check-out. Rep inventory management. |
| 5.7 | **Distribution UI** | Add material distribution form to visit check-out flow. Material distribution history on customer detail. Rep bag inventory view. |
| 5.8 | **Distribution reports** | Materials distributed per rep, per customer, per product. Stock depletion tracking. |

**Phase 5 Total: ~3-4 weeks (1 developer)**  
**New entities:** Survey, SurveyQuestion, SurveyResponse, SurveyAnswer, MaterialDistribution, RepInventory  
**Deliverable:** Complete survey system and field material tracking.

---

## Phase 6: Hospital Hierarchy & Polish (2-3 weeks)

**Goal:** Close remaining gaps and polish.

| # | Task | Details | Effort |
|---|------|---------|--------|
| 6.1 | **Department entity** | New `Department` (Id, CustomerId [where CustomerType=Hospital], Name, Floor, HeadPhysicianId?). Department CRUD under hospital. | 3 days |
| 6.2 | **Physician entity** | New `Physician` (Id, FullName, Specialty, InstitutionId [CustomerId], DepartmentId?, LicenseNumber, ContactInfo, KOLStatus, IsActive). Replace `Prescription.DoctorName` free text with FK. | 4 days |
| 6.3 | **Hierarchy visualization** | Tree/org-chart component on hospital customer detail: Hospital → Departments → Physicians. | 3 days |
| 6.4 | **Admin visit-across-reps view** | Admin/manager endpoint: all visits for a customer across all reps (not just current rep's visits). | 2 days |
| 6.5 | **Market overview for weekly reports** | Enhance weekly manager email with competitive notes aggregation (from `ExecutedVisit.CompetitionNotes`) and key metrics. | 2 days |

**Phase 6 Total: ~2-3 weeks (1 developer)**  
**New entities:** Department, Physician  
**Deliverable:** Complete pharmaceutical hierarchy and remaining polish.

---

## Timeline Summary

| Phase | Focus | Duration | Cumulative |
|-------|-------|----------|------------|
| **Phase 0** | Quick Wins (map, calendar, frequency, photos) | 2 weeks | 2 weeks |
| **Phase 1** | Brand Management (brands, SmPC, knowledge base) | 3-4 weeks | 5-6 weeks |
| **Phase 2** | Cycles & Campaigns | 4-5 weeks | 9-11 weeks |
| **Phase 3** | Territory & Analytics | 3-4 weeks | 12-15 weeks |
| **Phase 4** | Wholesaler Data Import & Sales | 4-5 weeks | 16-20 weeks |
| **Phase 5** | Surveys & Material Distribution | 3-4 weeks | 19-24 weeks |
| **Phase 6** | Hospital Hierarchy & Polish | 2-3 weeks | 21-27 weeks |

### **Total estimated timeline: 5-7 months (1 developer)**
### **With 2 developers (parallel phases): 3-4 months**

---

## Effort Summary by New Entities

| Phase | New Entities | New Controllers | New Frontend Features |
|-------|-------------|----------------|----------------------|
| 0 | — (field additions only) | — | 3 components (map, calendar, gallery) |
| 1 | Brand, BrandGroup, BrandGroupMember, ProductDocument, KnowledgeArticle | BrandsController, ProductDocumentsController | Brand management, SmPC viewer, knowledge base |
| 2 | Cycle, CycleTarget, Campaign, CampaignTarget | CyclesController, CampaignsController | Cycle management, campaign builder |
| 3 | Territory, TerritoryAssignment | TerritoriesController, AdminAssignmentsController | Territory admin, analytics dashboards |
| 4 | WholesalerDataImport, WholesalerSalesRecord, WholesalerStockRecord, PriceList, PriceListItem | WholesalerDataController, PriceListsController | Import wizard, sales dashboards |
| 5 | Survey, SurveyQuestion, SurveyResponse, SurveyAnswer, MaterialDistribution, RepInventory | SurveysController, MaterialDistributionController | Survey builder, distribution UI |
| 6 | Department, Physician | DepartmentsController, PhysiciansController | Hierarchy tree |

**Total new entities: ~22**  
**Total new controllers: ~10**  
**Total new frontend feature modules: ~8**

---

## Cost Considerations

### Development Effort
- **Conservative estimate:** ~600-800 developer hours
- **At 40 KM/hour:** 24,000 - 32,000 KM additional development
- **At standard rates:** This represents roughly 3.5-5 months of full-time development

### Pricing Options to Discuss with Client

**Option A — Full build at premium:**
- Position as custom-built solution tailored to their exact needs
- Phase 0-2 (immediate value): include in adjusted base price
- Phase 3-6: bill at hourly rate or as separate modules

**Option B — Modular approach:**
- Deliver Phase 0 immediately (part of current contract)
- Each subsequent phase priced as a module (2,000-5,000 KM each)
- Client picks which modules they need and in what order

**Option C — Revised all-inclusive offer:**
- New comprehensive quote covering all requirements
- Needs to be competitive against 2,800 EUR alternative (which likely has limitations they haven't discovered yet)

### Key Differentiator vs Competition
The 2,800 EUR product is likely:
- Generic/off-the-shelf (not BiH-specific: cantons, KM currency, BiH entity structure)
- No Bosnian language support
- No integration with local wholesaler formats
- Rigid — can't be customized for their specific workflow
- SaaS with per-user fees that add up over time

Our advantage:
- **Custom-built for BiH pharma market** — canton/municipality hierarchy, KM currency, BiH entity structure
- **Full ownership** — they want "program za sebe" (their own program)
- **Monthly maintenance model** — predictable costs
- **Already 40%+ built** — not starting from scratch

---

## Recommended Immediate Actions

1. **Deliver Phase 0 immediately** (2 weeks) — shows responsiveness and addresses basic gaps
2. **Send revised scope document** to client mapping their requirements to phases
3. **Propose phased delivery** — Phase 0-1 within current agreement, Phase 2+ as add-on modules
4. **Demo current functionality** — the client may not be aware of what already exists (plan hierarchy, GPS visits, team dashboards, report builder)
5. **Understand the competition** — ask what specific product they're comparing against

---

*This plan is based on a fresh codebase audit conducted March 3, 2026.*
