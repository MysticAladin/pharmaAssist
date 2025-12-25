# PharmaAssist — Current Progress & TODOs

_Last updated: 2025-12-25_

This document summarizes what is implemented today, the highest-impact gaps vs the requirements, and a prioritized TODO list.

## What’s working / implemented (high level)

### Frontend (Angular)
- Admin area: Products, Manufacturers, Orders, Reports, Users, Pricing & Promotions, Targets & Budgets, Settings (UI exists; headings/tabs standardized recently).
- Portal: catalog/cart/checkout flows exist.
- Portal model already supports:
  - `PriceType` (Commercial vs Essential)
  - Mixed cart totals by price type
  - Feature-flagged “split invoice” option in checkout UI.
- A portal “Quick Order” page exists (manual/paste/upload modes), but it is not yet the requested Hercegovinalijek-style “search-first” ordering UX.

### Backend (.NET API)
- Pricing endpoints exist:
  - Admin CRUD for price rules and promotions
  - Customer-facing “available promotions” endpoint
  - Price calculation endpoints (`/pricing/calculate` and `/pricing/calculate/batch`).
- Targets/Budgets endpoints exist (CRUD + summary + workflow actions).
- PDF generation endpoints exist (and include split invoice PDF):
  - `POST /api/pdf/invoice`
  - `POST /api/pdf/invoice/split`
  - `POST /api/pdf/order`
  - `POST /api/pdf/delivery-note`
  - `POST /api/pdf/packing-slip`

## Biggest gaps vs requirements (prioritized)

### P0 — Customer Actions/Promotions (most important)
**Requirement:** Customer portal must show both general + customer-specific actions/promotions, with ability to add items to cart from the action ("auto add to cart" experience).

**Current:**
- Backend already supports promotions (including “available promotions” for the current customer).
- Portal cart has stubs for discounts/promotions, but no full “promotions/actions listing → add to cart” UX.

**TODO (P0):**
- Implement portal page(s) to list “available promotions/actions”.
- Add “Add promoted items to cart” capability from the listing.
- Decide whether “Actions” are:
  - a distinct domain concept from Promotions (recommended if actions include bundles/free items), or
  - represented as Promotions with metadata + associated products.

### P0 — Wholesale search-based ordering screen (Hercegovinalijek-like)
**Requirement:** In addition to the current card/catalog UI, provide a “search-first” ordering screen (fast entry, keyboard-oriented, like the reference site).

**Current:**
- Portal quick order exists but is not API-backed for product search and is not equivalent to the reference UX.

**TODO (P0):**
- Build a portal page with:
  - search input (typeahead)
  - results list
  - quantity input per row
  - add-to-cart/update-in-cart inline
  - fast keyboard flow
- Back it with real API search (server already has products endpoints; confirm server supports search/filter parameters).

### P1 — Budgets/Targets: cannot add via UI
**User-reported:** “Can’t add budgets/targets via UI”.

**Likely root cause (confirmed by code inspection): DTO mismatch between Angular and .NET.**
- Angular uses a “period + startDate/endDate” request model:
  - `CreateSalesTargetRequest` includes `period`, `startDate`, `endDate`, `assignedToUserId`, etc.
  - `CreateBudgetRequest` includes `category`, `totalAmount`, `period`, `startDate`, `endDate`, etc.
- Backend expects a different shape:
  - Targets API expects `Year`, optional `Month`/`Quarter`, plus `Metric` (and `TargetType` is a different enum)
  - Budgets API expects `BudgetType`, `Year`, optional `Month`/`Quarter`, and `AllocatedAmount`
  - Status enums differ (frontend uses Draft/Active/Closed/Exceeded vs backend workflow Draft/Submitted/Approved/Rejected/Closed).

**TODO (P1):**
- Align request/response contracts:
  - Option A (recommended): Update Angular DTOs + forms to match backend (year/month/quarter + types/statuses).
  - Option B: Update backend to accept the “period + start/end” model and map to year/month/quarter (more invasive).
- Confirm the failure mode via browser Network tab (likely HTTP 400 with model binding/validation errors).

### P1 — Offer/Invoice: Export to PDF
**Requirement:** “Export to PDF” (print exists; export missing).

**Current:**
- Backend PDF endpoints exist (invoice/order/delivery note/packing slip; split invoice supported).
- Some UI surfaces still rely on printing rather than downloading a PDF file.

**TODO (P1):**
- Implement client-side “Download PDF” buttons that call `/api/pdf/*` and save the returned file.
- Decide which documents are needed in which screens (Order Detail, Offer/Invoice detail, portal checkout confirmation, etc.).

### P1 — Essential vs Commercial pricing per canton + period, and optional split order/invoice
**Requirement:**
- Customer selects Commercial vs Essential price type when ordering.
- Essential/commercial pricing depends on canton and validity period.
- Client can choose whether the system splits into 2 orders or 2 invoices.

**Current:**
- Portal already models `PriceType` and supports mixed carts and a split-invoice option (feature-flagged).
- Backend already has split invoice PDF generation.
- Backend product pricing is currently a single `UnitPrice` on Product (no canton/period pricing model).

**Proposed solution (data + behavior):**
1) Add a pricing table:
   - `ProductPrice` (or `PriceListEntry`)
   - Keys: `ProductId`, `CantonId (nullable for all)`, `PriceType` (Commercial/Essential), `ValidFrom`, `ValidTo (nullable)`
   - Fields: `UnitPrice`, optional `MinQty`, optional `CustomerId (nullable)` for customer-specific overrides
   - Add uniqueness/overlap constraints (no overlapping date ranges per key).
2) Update pricing calculation:
   - Extend pricing calculation request to include `PriceType`.
   - Resolve price using (most specific wins): Customer-specific + canton + priceType + active date → then fallback to canton + priceType → then fallback to base product `UnitPrice`.
   - Promotions/price rules apply on top (with rules about stacking).
3) Order/Invoice splitting:
   - Introduce a client setting/feature flag:
     - `SplitBehavior = None | SplitInvoices | SplitOrders`
   - If cart contains both price types:
     - `SplitOrders`: create 2 orders (commercial + essential) and invoice each
     - `SplitInvoices`: create 1 order but generate 2 invoices (and provide split invoice PDF)

**TODO (P1/P2 depending on urgency):**
- Implement the new pricing entity, EF migration, API endpoints for admin management.
- Implement portal UX for selecting price type (and enforcing eligibility rules).
- Implement chosen split behavior end-to-end.

## Recommended execution order (next 2–4 iterations)

1) **P0: Promotions/Actions in portal** (list + add-to-cart)
2) **P0: Wholesale search ordering screen** (API-backed)
3) **P1: Fix Targets/Budgets create flows** (align DTOs)
4) **P1: Add PDF export buttons** (wire to existing `/api/pdf/*` endpoints)
5) **P1/P2: Canton + period pricing & split behavior** (data model + pricing engine)

## Open questions (need product decision)
- What exactly is the difference between “Actions” and “Promotions” in your domain?
  - If actions include “buy X get Y” / free goods / bundles, we should model them separately.
- Is Essential pricing allowed for all customers in a canton, or only specific customers (eligibility)?
- When mixed price types exist in the cart, should we split orders or split invoices by default?
