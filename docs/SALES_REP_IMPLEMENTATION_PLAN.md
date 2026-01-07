# Sales Representative Functionality - Phased Implementation Plan

**Document Version:** 1.0  
**Date:** January 5, 2026  
**Status:** Planning  
**Based on:** PharmaAssist_Comprehensive_Requirements.md - Section 11 (Mobile Application)

---

## Executive Summary

This document outlines a phased approach to implementing sales representative functionality in PharmaAssist, covering both administrative oversight and field representative tools. The implementation is divided into 5 major phases, each building upon the previous to deliver incremental value while managing complexity.

**Key Objectives:**
- Enable sales representatives to plan and execute customer visits
- Track performance against targets in real-time
- Provide administrators with visibility into field activities
- Support both commercial (pharmacy/wholesale) and medical (physician) representatives
- Build mobile-responsive web interface accessible from smartphones (no native app required)
- Leverage browser Geolocation API for GPS-based visit verification

---

## User Roles and Hierarchy

### Role Definitions

| Role | Description | Primary Access | Count |
|------|-------------|----------------|-------|
| **System Administrator** | Full system access, configuration | Web portal (all modules) | - |
| **Commercial Manager** | Oversees commercial representatives, approves plans | Web portal (team dashboards, approvals) | 1 |
| **Medical Manager** | Oversees medical representatives (RX medicines), approves plans | Web portal (team dashboards, approvals) | 2 |
| **Commercial Representative** | OTC medicines, pharmacy/wholesale visits | Mobile-responsive web portal | 5 |
| **Medical Representative** | RX medicines, physician/hospital visits ("stručni predstavnik") | Mobile-responsive web portal | 12 |

**Note:** Representatives can report to multiple managers, and managers oversee multiple representatives (many-to-many relationship).

### Reporting Hierarchy

```
Commercial Manager (1)
├── Commercial Rep 1
├── Commercial Rep 2
├── Commercial Rep 3
├── Commercial Rep 4
└── Commercial Rep 5

Medical Manager 1
├── Medical Rep 1
├── Medical Rep 2
├── Medical Rep 3
├── Medical Rep 4
├── Medical Rep 5
└── Medical Rep 6

Medical Manager 2
├── Medical Rep 7
├── Medical Rep 8
├── Medical Rep 9
├── Medical Rep 10
├── Medical Rep 11
└── Medical Rep 12

Note: Some representatives may report to multiple managers (dotted lines not shown).
```

---

## Phase 1: Foundation & User Management

**Duration:** 2-3 weeks  
**Priority:** Critical - Prerequisite for all other phases

### 1.1 Goals

- Establish user roles and permissions framework
- Create basic sales representative user profiles
- Implement manager-representative relationships (many-to-many)
- Implement user hierarchy for reporting

### 1.2 Database Schema Extensions

**New Tables:**

#### SalesRepresentatives
```sql
- RepId (PK)
- UserId (FK to Users)
- RepType (Commercial, Medical)
  // Commercial = OTC medicines, pharmacy visits (5 reps)
  // Medical = RX medicines, doctor visits - "stručni predstavnik" (12 reps)
- EmployeeCode
- FirstName, LastName
- Email, Mobile
- HireDate
- Status (Active, Inactive, OnLeave)
- TerritoryDescription (text field, informal description)
- CreatedAt, UpdatedAt
```

#### RepManagerAssignments
```sql
- AssignmentId (PK)
- RepId (FK to SalesRepresentatives)
- ManagerId (FK to SalesRepresentatives)
  // Manager is also a rep with special permissions
- AssignmentDate
- IsActive (boolean)
- IsPrimary (boolean)
  // One manager marked as primary for notifications
```

#### RepCustomerAssignments
```sql
- AssignmentId (PK)
- RepId (FK)
- CustomerId (FK)
- AssignmentDate
- IsActive
```

### 1.3 Backend Implementation

**New Controllers:**
- `SalesRepresentativesController` - CRUD for rep profiles
- `RepManagersController` - Manager-rep assignments
- `RepAssignmentsController` - Customer assignments

**New Services:**
- `SalesRepService` - Business logic for rep management
- `ManagerService` - Manager-rep relationship logic
- `HierarchyService` - Manager-rep hierarchy

**DTOs:**
- `SalesRepDto`, `CreateSalesRepDto`, `UpdateSalesRepDto`
- `ManagerAssignmentDto`
- `RepHierarchyDto` (for tree views)

### 1.4 Frontend Implementation

**New Admin Screens:**

#### Screen: Sales Representatives List (`/admin/sales-reps`)
- Table showing all reps with filters (active/inactive, type)
- Columns: Name, Type, Managers, Territory Description, Status, Actions
- Search by name/employee code
- Add New Rep button
- Rep type filter: Commercial (5), Medical (12)

#### Screen: Rep Detail/Edit (`/admin/sales-reps/:id`)
- Personal information section
- Rep type selection (Commercial / Medical)
- Territory description (free text field for informal assignment)
- Manager assignments (multi-select, mark primary)
- Customer assignments (searchable customer list)
- Activity summary (orders, visits - Phase 2+)
- Status management

#### Screen: Manager Management (`/admin/managers`)
- List managers (1 Commercial, 2 Medical)
- View each manager's team
- Assign/reassign representatives to managers
- Support many-to-many assignments
- Team performance overview (Phase 4+)

**UI Components:**
- `RepProfileCard` - Display rep summary
- `ManagerSelector` - Multi-select managers for rep
- `RepHierarchyTree` - Visual org chart (managers and reps)
- `CustomerAssignmentGrid` - Assign customers to reps

### 1.5 Permissions Matrix

| Action | System Admin | Supervisor | Sales Rep |
|--------|--------------|------------|-----------||
| View all reps | ✓ | ✓ (team only) | ✗ |
| Create/edit rep | ✓ | ✗ | ✗ |
| Assign supervisors | ✓ | ✗ | ✗ |
| Assign customers | ✓ | ✓ (own team) | ✗ |
| View own profile | ✓ | ✓ | ✓ |
| View team profiles | ✓ | ✓ | ✗ |
| Edit own profile | Limited | Limited | Limited |

### 1.6 Deliverables

- [ ] Database migration scripts
- [ ] Backend API endpoints with tests
- [ ] Admin screens for rep management
- [ ] Admin screens for manager management
- [ ] Many-to-many manager-rep assignment logic
- [ ] User roles and permissions implementation
- [ ] Documentation: API specs, user guide

### 1.7 Success Criteria

- Sales representatives can be created (5 Commercial, 12 Medical)
- Managers can be assigned to representatives (many-to-many)
- Customer assignments can be configured
- Manager-rep hierarchy is established
- Permissions properly restrict access by role

---

## Phase 2: Visit Planning & Execution

**Duration:** 3-4 weeks  
**Priority:** High - Core field activity tracking  
**Dependencies:** Phase 1 complete

### 2.1 Goals

- Enable reps to plan weekly visits
- Support visit execution with check-in/check-out
- Implement GPS verification for visit authenticity
- Provide manager approval workflow for plans
- Track visit outcomes and customer interactions

### 2.2 Database Schema Extensions

**New Tables:**

#### VisitPlans
```sql
- PlanId (PK)
- RepId (FK)
- PlanWeek (date - Monday of week)
- Status (Draft, Submitted, Approved, Rejected, InProgress, Completed)
- SubmittedAt
- ApprovedBy (FK to Users)
- ApprovedAt
- RejectionReason
```

#### PlannedVisits
```sql
- PlannedVisitId (PK)
- PlanId (FK)
- CustomerId (FK)
- PlannedDate
- PlannedTime
- EstimatedDuration (minutes)
- VisitObjective (text)
- ProductsToPresent (JSON array)
- Notes
- SequenceNumber (for routing)
```

#### ExecutedVisits
```sql
- VisitId (PK)
- PlannedVisitId (FK, nullable for ad-hoc)
- RepId (FK)
- CustomerId (FK)
- CheckInTime
- CheckInLatitude
- CheckInLongitude
- CheckInAddress (captured)
- CheckOutTime
- CheckOutLatitude
- CheckOutLongitude
- ActualDuration (calculated)
- DistanceFromCustomer (meters)
- LocationVerified (boolean)
- VisitType (Planned, AdHoc)
- Outcome (Positive, Neutral, Negative)
- Summary (text)
- ProductsDiscussed (JSON)
- FollowUpRequired (boolean)
- FollowUpDate
- NextVisitDate
- AttachmentsCount
```

#### VisitNotes
```sql
- NoteId (PK)
- VisitId (FK)
- NoteType (Discussion, Issue, Opportunity, Complaint, Other)
- NoteText
- CreatedAt
```

#### VisitAttachments
```sql
- AttachmentId (PK)
- VisitId (FK)
- FileName
- FileType
- FilePath
- FileSize
- UploadedAt
```

### 2.3 Backend Implementation

**New Controllers:**
- `VisitPlansController` - Weekly plan CRUD and approval
- `VisitsController` - Visit execution and tracking
- `VisitNotesController` - Notes management

**New Services:**
- `VisitPlanService` - Plan validation, approval workflow
- `VisitExecutionService` - Check-in/out logic, GPS validation
- `RouteOptimizationService` - Suggest optimal visit sequence
- `GeolocationService` - Distance calculation, address lookup

**Key Methods:**
```csharp
// VisitPlanService
ValidateWeeklyPlan(planId) // Check coverage, conflicts
SubmitForApproval(planId, repId)
ApproveRejectPlan(planId, managerId, approved, reason)

// VisitExecutionService
CheckIn(repId, customerId, latitude, longitude, plannedVisitId?)
ValidateLocation(customerId, latitude, longitude) // Returns distance, verified flag
CheckOut(visitId, latitude, longitude, summary, outcome)
RecordAdHocVisit(repId, customerId, ...)
```

### 2.4 Frontend Implementation

**New Rep Screens:**

#### Screen: Weekly Visit Planner (`/sales-rep/visit-planner`)
- Calendar view showing week (Monday-Friday)
- Drag-and-drop customer visits to days/times
- Daily view with visit sequence
- Map view showing route
- Customer selector with search/filter
- Visit details form (objective, products, estimated duration)
- Submit for approval button
- Status indicators (Draft, Submitted, Approved)

#### Screen: Daily Visit List (`/sales-rep/daily-visits`)
- Today's planned visits in sequence
- Map with route and customer pins
- Check-in button per visit (GPS required)
- Visit status: Not Started, In Progress, Completed
- Add ad-hoc visit button
- Quick stats: visits completed, orders taken, time spent

#### Screen: Visit Execution (`/sales-rep/visit/:id`)
- Check-in panel (automatic GPS capture)
- Location verification status (green/yellow/red)
- Timer showing visit duration
- Customer information summary
- Tabbed sections:
  - **Notes**: Discussion points, issues raised
  - **Products**: Products discussed/presented
  - **Orders**: Create order (links to Phase 3)
  - **Samples**: Record samples given (if medical rep)
  - **Follow-up**: Schedule next visit, set reminders
- Photo attachment option
- Check-out button with outcome selection

#### Screen: Visit History (`/sales-rep/visit-history`)
- List/calendar view of past visits
- Filter by customer, date range, outcome
- Search by keywords in notes
- Export to PDF/Excel

**New Manager Screens:**

#### Screen: Visit Plan Approvals (`/manager/visit-approvals`)
- List of pending weekly plans from team
- Rep name, week, submission date
- Preview plan with map
- Approve/reject with comments
- Bulk approval option

#### Screen: Team Activity Dashboard (`/manager/team-activity`)
- Real-time map showing rep locations (where checked in)
- Today's visit completion by rep
- Visit statistics (planned vs. actual, on-time %)
- Alerts for location discrepancies
- Click rep to see their daily schedule
- Filter by rep type (Commercial / Medical)

#### Screen: Visit Audit Log (`/manager/visit-audit`)
- All visits with location verification status
- Filter by rep, date, location discrepancy
- Click to view on map (check-in location vs. customer address)
- Export for compliance

**UI Components (Mobile-Optimized):**
- `WeeklyPlanCalendar` - Drag-drop visit scheduler (touch-friendly on mobile)
- `VisitCard` - Display visit details (responsive card layout)
- `RouteMap` - Google Maps integration with route (mobile-friendly)
- `CheckInButton` - GPS capture via browser Geolocation API
- `VisitTimer` - Duration tracker (large, readable on mobile)
- `LocationVerificationBadge` - Visual indicator (green/yellow/red)
- `VisitOutcomeSelector` - Positive/Neutral/Negative picker (touch-optimized)

**Mobile-Responsive Design Considerations:**
- Touch-friendly buttons (minimum 44x44px touch targets)
- Simplified navigation for small screens
- Swipe gestures for visit cards and lists
- Bottom navigation bar for primary actions
- Optimized for portrait mobile orientation
- Fast loading on cellular networks (minimal data usage)

### 2.5 GPS Verification Logic

**Browser Geolocation API:**
- Uses HTML5 Geolocation API (works on all modern mobile browsers)
- Requires user permission on first access
- Provides latitude, longitude, and accuracy
- Works on both WiFi and cellular networks

**Distance Thresholds:**
- **< 100m**: ✓ Valid (Green) - Auto-approve
- **100m - 500m**: ⚠️ Warning (Yellow) - Allow with explanation
- **> 500m**: ✗ Alert (Red) - Require manager approval + explanation

**Verification Factors:**
- GPS accuracy (horizontal accuracy < 50m preferred)
- Timestamp validation (within business hours)
- Network type (WiFi/Cellular)
- Address reverse geocoding for audit trail
- Browser permissions (location access must be granted)

### 2.6 Deliverables

- [ ] Database migration for visits schema
- [ ] Backend visit planning API
- [ ] Backend visit execution API with GPS validation
- [ ] Rep weekly planner UI
- [ ] Rep daily visit execution UI
- [ ] Manager approval workflow UI
- [ ] Real-time team activity dashboard
- [ ] GPS verification and audit features
- [ ] Unit and integration tests
- [ ] User guides for reps and managers

### 2.7 Success Criteria

- Reps can create and submit weekly visit plans
- Managers can approve/reject plans
- GPS check-in/out captures accurate location within 100m
- Location discrepancies trigger alerts
- Visit history is searchable and exportable
- 95% of visits have valid GPS verification

---

## Phase 3: Order Taking & Customer Management

**Duration:** 3-4 weeks  
**Priority:** High - Revenue generation  
**Dependencies:** Phase 1 complete, Phase 2 helpful but not required

### 3.1 Goals

- Enable reps to create orders during visits
- Provide real-time inventory visibility
- Apply customer-specific pricing and promotions
- Support offline order creation with sync
- Link orders to visits for attribution

### 3.2 Database Schema Extensions

**Existing Tables Enhanced:**

#### Orders (add columns)
```sql
- VisitId (FK to ExecutedVisits, nullable)
- CreatedViaApp (boolean)
- RepDeviceId (string)
- OfflineCreatedAt (datetime, nullable)
- SyncedAt (datetime, nullable)
```

#### Products (add columns for rep view)
```sql
- RepDescription (simplified description for mobile)
- RepImage (thumbnail URL)
- IsFeatured (boolean for highlighting)
```

**New Tables:**

#### OrderTemplates
```sql
- TemplateId (PK)
- RepId (FK)
- CustomerId (FK)
- TemplateName
- Description
- ProductsJson (array of {productId, defaultQuantity})
- CreatedAt
- LastUsedAt
```

#### RepInventoryViews
```sql
- ViewId (PK)
- RepId (FK)
- ProductId (FK)
- WarehouseId (FK)
- ViewedAt
- Purpose (tracking rep interest in products)
```

### 3.3 Backend Implementation

**Enhanced Controllers:**
- `OrdersController` - Add rep-specific endpoints
- `ProductsController` - Add rep catalog endpoints
- `CustomersController` - Add rep customer list

**New Endpoints:**
```csharp
// Orders
POST /api/orders/rep/create - Create order via rep app
GET /api/orders/rep/my-orders - Rep's order history
POST /api/orders/rep/template - Save order as template
GET /api/orders/rep/templates/{customerId} - Get templates for customer
POST /api/orders/rep/repeat/{orderId} - Repeat previous order

// Products
GET /api/products/rep/catalog - Rep-focused product list
GET /api/products/rep/inventory/{productId} - Multi-warehouse stock
GET /api/products/rep/promotions - Active promotions
GET /api/products/rep/suggested/{customerId} - Suggested products

// Customers
GET /api/customers/rep/my-customers - Rep's assigned customers
GET /api/customers/rep/{id}/recent-orders - Customer order history
GET /api/customers/rep/{id}/credit-status - Credit limit check
```

**New Services:**
- `RepOrderService` - Order creation with validations
- `PromotionEngine` - Auto-apply promotions
- `SuggestedProductsService` - ML-based suggestions (future)
- `OrderSyncService` - Handle offline order sync

### 3.4 Frontend Implementation

**New Rep Screens:**

#### Screen: My Customers (`/sales-rep/customers`)
- List of assigned customers
- Quick search and filters (tier, city, status)
- Customer cards showing:
  - Name, address, contact
  - Last order date and value
  - Credit status (available/limit)
  - Quick action buttons: Call, Navigate, Create Order
- Sort by: Recent visits, High value, Alphabetical

#### Screen: Customer Detail (`/sales-rep/customers/:id`)
- Customer profile summary
- Contact persons list (tap to call/email)
- Recent order history (last 10)
- Products purchased frequency
- Credit limit and outstanding balance
- Visit history with this customer
- Quick actions: Create Order, Schedule Visit, Add Note

#### Screen: Create Order (`/sales-rep/orders/new`)
- Customer selection (or from customer screen)
- Customer info header with credit status
- Product catalog with:
  - Search bar
  - Category filters
  - Barcode scanner (mobile)
  - Product cards: image, name, price, stock status
- Shopping cart section:
  - Line items with quantity spinners
  - Real-time total calculation
  - Promotion badges
  - Remove items
- Order summary:
  - Subtotal, discounts, tax, total
  - Delivery date selector
  - Order notes field
  - Payment terms display
- Submit order button
- Save as template option

#### Screen: Order Templates (`/sales-rep/orders/templates`)
- List of saved templates by customer
- Quick reorder from template
- Edit template
- Template usage statistics

#### Screen: Order Confirmation (`/sales-rep/orders/confirmation/:id`)
- Order number and status
- Customer details
- Line items
- Totals
- Estimated delivery
- Share order (email/SMS)
- Print option

**UI Components (Mobile-Optimized):**
- `CustomerCard` - Customer summary display (responsive cards)
- `ProductCatalogGrid` - Scrollable product grid (optimized for mobile scrolling)
- `ProductSearchBar` - Search with autocomplete (mobile keyboard support)
- `ShoppingCart` - Line items with swipe-to-remove on mobile
- `PricingDisplay` - Shows price, discount, final price (large text)
- `StockIndicator` - Visual stock level (in stock/low/out)
- `PromotionBadge` - Highlights active promotions
- `CreditStatusBar` - Visual credit usage indicator (progress bar)
- `OrderSummaryPanel` - Totals breakdown (sticky bottom on mobile)

**Mobile Features:**
- Barcode scanning via device camera (using browser MediaDevices API)
- Quick-add buttons for frequently ordered products
- Voice search for product lookup (browser Speech Recognition API)
- One-tap phone/SMS to customer from contact cards
- Offline order queue with auto-sync (Service Workers)

### 3.5 Order Validation Rules

**Pre-Submit Checks:**
- ✓ Customer credit limit not exceeded
- ✓ Minimum order value met (if applicable)
- ✓ Products in stock or accepted backorder
- ✓ Payment terms valid
- ✓ Delivery date feasible
- ⚠️ Warn if customer has overdue invoices
- ⚠️ Warn if products near expiry

### 3.6 Offline Order Support

**Offline Capabilities:**
- Download customer list (assigned customers)
- Download product catalog with prices
- Create orders locally (stored in browser/app)
- Queue orders for sync when online
- Visual indicators (offline mode, pending sync)
- Conflict resolution (if customer data changed)

**Sync Strategy:**
- Auto-sync every 5 minutes when online
- Manual sync button
- Sync status per order (synced/pending/failed)
- Retry failed syncs with exponential backoff

### 3.7 Deliverables

- [ ] Backend order creation APIs for reps
- [ ] Promotion engine integration
- [ ] Rep customer list and detail screens
- [ ] Mobile-optimized order creation UI
- [ ] Product catalog with search/filter
- [ ] Order templates functionality
- [ ] Credit limit validation
- [ ] Offline order support with sync
- [ ] Order confirmation and sharing
- [ ] Unit and integration tests

### 3.8 Success Criteria

- Reps can create orders in < 2 minutes
- Real-time inventory check within 1 second
- Promotions auto-apply correctly 100% of time
- Credit limit warnings prevent over-limit orders
- Offline orders sync successfully when online
- Order attribution to visits tracked accurately

---

## Phase 4: Targets & Performance Tracking

**Duration:** 3-4 weeks  
**Priority:** Medium-High - Performance management  
**Dependencies:** Phase 1, Phase 3 (orders needed for tracking)

### 4.1 Goals

- Extend existing targets module for sales reps
- Enable reps to view their assigned targets
- Provide real-time progress tracking
- Implement performance dashboards for reps and managers
- Support target-based notifications and alerts

### 4.2 Database Schema Extensions

**Enhanced Existing Tables:**

#### Targets (add columns)
```sql
- RepId (FK to SalesRepresentatives, nullable)
  // Allows rep-specific targets in addition to company/product targets
- VisibilityLevel (Company, Team, Individual)
```

**New Tables:**

#### PerformanceSnapshots
```sql
- SnapshotId (PK)
- RepId (FK)
- SnapshotDate
- Period (Day, Week, Month, Quarter, Year)
- TotalRevenue
- TotalOrders
- VisitsCompleted
- NewCustomersAcquired
- TargetAchievementPercent
- Ranking (within team)
- CreatedAt
```

#### PerformanceAlerts
```sql
- AlertId (PK)
- RepId (FK)
- AlertType (TargetRisk, Achievement, Milestone)
- Severity (Info, Warning, Critical)
- Message
- TriggeredAt
- ReadAt (nullable)
- AcknowledgedAt (nullable)
```

### 4.3 Backend Implementation

**Enhanced Controllers:**
- `TargetsController` - Add rep-specific endpoints

**New Endpoints:**
```csharp
// Targets
GET /api/targets/rep/my-targets - Rep's assigned targets
GET /api/targets/rep/progress - Current achievement vs. targets
GET /api/targets/rep/history - Historical performance
GET /api/targets/team/{teamId}/leaderboard - Team rankings

// Performance
GET /api/performance/rep/dashboard - Dashboard metrics
GET /api/performance/rep/alerts - Active alerts
POST /api/performance/rep/alerts/{id}/acknowledge
GET /api/performance/manager/team-summary - Team performance
GET /api/performance/manager/team-details/{repId} - Rep details
```

**New Services:**
- `PerformanceTrackingService` - Calculate achievement metrics
- `TargetAllocationService` - Distribute targets to reps
- `AlertGenerationService` - Trigger performance alerts
- `LeaderboardService` - Calculate rankings

**Background Jobs:**
- `DailyPerformanceSnapshot` - Capture daily metrics
- `TargetRiskAlert` - Detect at-risk targets (run daily)
- `AchievementNotification` - Celebrate milestones

### 4.4 Frontend Implementation

**Enhanced Admin Screens:**

#### Screen: Target Setting (existing `/admin/targets`) - Add Rep Tab
- New tab: "Sales Representative Targets"
- Table of reps with target assignment
- Bulk target setting by team
- Individual rep target override
- Target type: Revenue, Volume, Visits, New Customers
- Period: Weekly, Monthly, Quarterly, Annual
- Cascade targets (company → team → rep)

#### Screen: Target Distribution (`/admin/targets/distribute`)
- Top-down target allocation
- Set company target
- Auto-distribute to teams (by proportion or manual)
- Further distribute to reps
- Preview impact before saving
- Validation (sum of rep targets = team target)

**New Rep Screens:**

#### Screen: My Targets Dashboard (`/sales-rep/targets`)
- Current period targets overview
- Visual progress bars per target type
- Traffic light indicators (green/yellow/red)
- Comparison to same period last year
- Daily run-rate needed to achieve target
- Top contributing customers
- Top contributing products
- Gap analysis: on track / needs push
- Motivational messages

#### Screen: Performance History (`/sales-rep/performance`)
- Line charts showing trends (revenue, orders, visits)
- Period selector (week/month/quarter/year)
- Target vs. actual overlay
- Achievement percentage over time
- Download performance report

**New Manager Screens:**

#### Screen: Team Performance Dashboard (`/manager/team-performance`)
- Team summary metrics
- Individual rep cards with KPIs:
  - Revenue achievement %
  - Orders count
  - Visit completion rate
  - New customers acquired
- Traffic light status per rep
- Drill-down to rep details
- Team leaderboard (rankings)
- Alerts for at-risk reps
- Filter by rep type (Commercial / Medical)

#### Screen: Performance Comparison (`/manager/performance-comparison`)
- Side-by-side rep comparison
- Multi-select reps to compare
- Metrics: Revenue, Orders, Visits, Conversion rate
- Time period selector
- Export comparison report

**UI Components:**
- `TargetProgressBar` - Visual progress with color coding
- `PerformanceCard` - KPI card with trend arrow
- `TrafficLightIndicator` - Green/Yellow/Red status
- `LeaderboardTable` - Rankings with medals/badges
- `TrendChart` - Line/bar charts for metrics
- `GapAnalysis` - Shows gap to target with actionable insights
- `AlertBadge` - Notification badge for alerts

### 4.5 Target Calculation Logic

**Achievement Calculation:**
```
Current Achievement % = (Actual / Target) * 100

Pro-rata Target = Target * (Days Elapsed / Total Days in Period)
Pro-rata Achievement % = (Actual / Pro-rata Target) * 100

Status:
- Green: Pro-rata Achievement >= 100%
- Yellow: 80% <= Pro-rata Achievement < 100%
- Red: Pro-rata Achievement < 80%
```

**Daily Run Rate:**
```
Remaining Target = Target - Actual Achieved
Days Remaining = Total Days - Days Elapsed
Daily Run Rate Needed = Remaining Target / Days Remaining
```

### 4.6 Alert Triggers

**Automatic Alerts:**
- 🔴 **Critical**: Achievement < 70% at month midpoint
- 🟡 **Warning**: Achievement < 85% at month midpoint
- 🟢 **Success**: Target achieved
- 🏆 **Milestone**: 50%, 75%, 100%, 125% achieved
- 📊 **Weekly Reminder**: Every Monday morning with status

### 4.7 Deliverables

- [ ] Enhanced targets module with rep assignments
- [ ] Target distribution/allocation tools
- [ ] Rep targets dashboard with real-time progress
- [ ] Manager team performance dashboard
- [ ] Performance alerts and notifications
- [ ] Leaderboard and rankings
- [ ] Historical performance tracking
- [ ] Background jobs for snapshots and alerts
- [ ] Unit and integration tests

### 4.8 Success Criteria

- Reps can view their targets in real-time
- Progress updates within 5 minutes of order creation
- Alerts trigger accurately based on thresholds
- Managers have visibility into team performance
- Target distribution matches company goals
- Leaderboard motivates healthy competition

---

## Phase 5: Reporting & Advanced Features

**Duration:** 2-3 weeks  
**Priority:** Medium - Enhanced insights  
**Dependencies:** Phases 1-4 complete

### 5.1 Goals

- Implement comprehensive reporting for reps and managers
- Weekly activity reports with auto-generation
- Sample/gratis tracking and reconciliation
- Expense reporting (future consideration)
- Advanced analytics and insights

### 5.2 Database Schema Extensions

**New Tables:**

#### ActivityReports
```sql
- ReportId (PK)
- RepId (FK)
- ReportType (Daily, Weekly, Monthly)
- ReportPeriod (date)
- Status (Draft, Submitted, Approved)
- VisitsCount
- OrdersCount
- OrdersValue
- SamplesDistributed
- GratisDistributed
- TravelDistance (km)
- WorkingHours
- KeyWins (text)
- Challenges (text)
- NextWeekFocus (text)
- SubmittedAt
- ApprovedBy
- ApprovedAt
```

#### SampleDistributions (for Medical Reps)
```sql
- DistributionId (PK)
- RepId (FK)
- VisitId (FK)
- ProductId (FK)
- Quantity
- LotNumber
- ExpiryDate
- RecipientType (Physician, Pharmacist, Institution)
- RecipientName
- RecipientLicense (optional)
- Signature (image path or digital signature)
- DistributionDate
- Purpose (Trial, Initiation, Replacement)
- FollowUpDate
- Notes
```

#### GratisDistributions (for Commercial Reps)
```sql
- GratisId (PK)
- RepId (FK)
- CustomerId (FK)
- VisitId (FK, nullable)
- ProductId (FK)
- QuantityGiven
- Reason (Promotion, Compensation, Sample, Other)
- JustificationText
- DistributionDate
- LinkedOrderId (FK to Orders, nullable)
- IsJustified (boolean)
- JustifiedAt
- ROICalculated (decimal, nullable)
```

#### GratisAllocations
```sql
- AllocationId (PK)
- RepId (FK)
- ProductId (FK)
- AllocatedQuantity
- Period (month/quarter)
- AllocationDate
- AllocatedBy (FK to Users)
- Notes
```

### 5.3 Backend Implementation

**New Controllers:**
- `ActivityReportsController` - Report CRUD and submission
- `SamplesController` - Sample distribution tracking
- `GratisController` - Gratis allocation and reconciliation

**New Endpoints:**
```csharp
// Activity Reports
GET /api/reports/rep/current-week - Current week's activity
POST /api/reports/rep/submit - Submit weekly report
GET /api/reports/rep/history - Past reports
GET /api/reports/manager/team-reports - Team reports for review

// Samples
POST /api/samples/distribute - Record sample distribution
GET /api/samples/rep/my-distributions - Rep's sample history
GET /api/samples/rep/allocations - Available samples
GET /api/samples/manager/audit - Sample audit trail

// Gratis
POST /api/gratis/allocate - Allocate gratis to rep (admin)
POST /api/gratis/distribute - Record gratis distribution (rep)
POST /api/gratis/justify - Link gratis to resulting order
GET /api/gratis/rep/balance - Rep's gratis balance
GET /api/gratis/manager/reconciliation - Gratis reconciliation report
GET /api/gratis/manager/roi - Gratis ROI analysis
```

**New Services:**
- `ActivityReportService` - Auto-generate report from data
- `SampleTrackingService` - Sample allocation and compliance
- `GratisReconciliationService` - Match gratis to orders
- `ReportGenerationService` - PDF/Excel report generation

### 5.4 Frontend Implementation

**New Rep Screens:**

#### Screen: Weekly Activity Report (`/sales-rep/reports/weekly`)
- Auto-populated sections:
  - Visits: Count, customers visited, completion rate
  - Orders: Count, total value, top products
  - Samples distributed (if medical rep)
  - Gratis given (if commercial rep)
  - Travel: Distance, time spent
- Manual entry sections:
  - Key wins/achievements
  - Challenges faced
  - Customer feedback highlights
  - Competitive intelligence
  - Next week focus areas
- Submit button (auto-sends to manager)
- Status: Draft / Submitted / Approved

#### Screen: Sample Management (`/sales-rep/samples`)
- Medical rep only
- Available sample allocations
- Record sample distribution form:
  - Search physician/institution
  - Select product and quantity
  - Enter lot number and expiry
  - Capture signature (digital or photo)
  - Add notes and follow-up date
- Sample distribution history
- Compliance alerts (approaching limits)

#### Screen: Gratis Management (`/sales-rep/gratis`)
- Commercial rep only
- Gratis allocation balance by product
- Record gratis distribution:
  - Select customer
  - Select product and quantity
  - Choose reason
  - Add justification
  - Link to visit (if during visit)
- Unjustified gratis list (needs order linkage)
- Justify gratis:
  - Select gratis distribution
  - Link to resulting customer order
  - System calculates ROI
- Gratis history and balance

**New Manager Screens:**

#### Screen: Team Reports Review (`/manager/reports-review`)
- List of submitted weekly reports from team
- Rep name, week, submission date
- Approve/request revision
- Add manager comments
- Compare week-over-week for each rep
- Export team summary
- Filter by rep type (Commercial / Medical)

#### Screen: Sample Audit (`/manager/samples-audit`)
- All sample distributions by team medical reps
- Filter by rep, product, date, recipient
- Compliance status
- Export for regulatory purposes
- Alerts for unusual patterns

#### Screen: Gratis Reconciliation (`/manager/gratis-reconciliation`)
- Gratis allocated vs. distributed vs. justified
- Unjustified gratis by rep (needs attention)
- ROI analysis:
  - Gratis value vs. resulting order value
  - Conversion rate (gratis → order)
  - Cost-effectiveness by product
- Approve/reject gratis justifications
- Set gratis policies and limits

**New Admin Screens:**

#### Screen: Gratis Allocation (`/admin/gratis-allocations`)
- Allocate gratis quota to reps
- By product, by period
- Bulk allocation by team
- Allocation history
- Remaining balances overview

**UI Components:**
- `ActivityReportForm` - Weekly report template
- `SampleDistributionForm` - Record sample with signature
- `GratisDistributionForm` - Record gratis with justification
- `GratisJustificationModal` - Link gratis to order
- `ROICalculator` - Display gratis ROI metrics
- `ReportApprovalCard` - Manager review interface
- `ComplianceAlert` - Sample limit warnings

### 5.5 Weekly Report Auto-Generation

**Auto-Populated Fields:**
```sql
SELECT 
  COUNT(DISTINCT v.VisitId) as VisitsCompleted,
  COUNT(DISTINCT o.OrderId) as OrdersCount,
  SUM(o.TotalAmount) as OrdersValue,
  COUNT(DISTINCT s.DistributionId) as SamplesCount,
  COUNT(DISTINCT g.GratisId) as GratisCount,
  SUM(distance calculated from GPS) as TravelDistance
FROM ExecutedVisits v
LEFT JOIN Orders o ON o.RepId = @RepId AND o.CreatedAt BETWEEN @StartDate AND @EndDate
LEFT JOIN SampleDistributions s ON s.RepId = @RepId AND s.DistributionDate BETWEEN @StartDate AND @EndDate
LEFT JOIN GratisDistributions g ON g.RepId = @RepId AND g.DistributionDate BETWEEN @StartDate AND @EndDate
WHERE v.RepId = @RepId 
  AND v.CheckInTime BETWEEN @StartDate AND @EndDate
```

### 5.6 Gratis Reconciliation Logic

**Justification Process:**
1. Rep distributes gratis (e.g., 10 boxes of Flodinax to Apoteka ABC)
2. System creates unjustified gratis record
3. Customer later places order including Flodinax
4. Rep links gratis distribution to this order
5. System validates: Order date after gratis date, same customer, same product
6. System calculates ROI: Order value / Gratis value
7. Gratis marked as justified
8. Manager can review and approve justification

### 5.7 Deliverables

- [ ] Weekly activity report generation and submission
- [ ] Sample distribution tracking (medical reps)
- [ ] Gratis allocation and reconciliation (commercial reps)
- [ ] Manager report review and approval
- [ ] Sample audit and compliance features
- [ ] Gratis ROI analysis tools
- [ ] PDF/Excel report exports
- [ ] Background jobs for auto-generation
- [ ] Unit and integration tests

### 5.8 Success Criteria

- Weekly reports auto-populate 80% of data
- Reps submit weekly reports on time (>90%)
- Sample distributions tracked with compliance (medical reps)
- Gratis justified within 30 days (>85%) (commercial reps)
- ROI calculated accurately for all justified gratis
- Managers can review and approve efficiently

---

## Phase 6: Mobile Web Optimization & PWA Features

**Duration:** 2-3 weeks  
**Priority:** Medium - Enhanced mobile user experience  
**Dependencies:** Phases 1-5 complete

### 6.1 Goals

- Optimize all screens for mobile devices (responsive design)
- Implement Progressive Web App (PWA) features
- Enable offline-first architecture using Service Workers
- Add "Add to Home Screen" capability
- Optimize performance for mobile networks

### 6.2 Mobile Web Technologies

**Browser APIs Used:**
- **Geolocation API**: GPS location capture for visit check-in
- **MediaDevices API**: Camera access for barcode scanning, photo capture
- **Service Workers**: Offline functionality, background sync
- **IndexedDB**: Local data storage for offline mode
- **Web App Manifest**: "Add to Home Screen" functionality
- **Push API**: Push notifications (optional)
- **Speech Recognition API**: Voice search for products

**Why Mobile Web Instead of Native App:**
- ✅ No app store approval process
- ✅ Instant updates (no user app updates needed)
- ✅ Single codebase (Angular) for desktop and mobile
- ✅ Works on all devices (iOS, Android, tablets)
- ✅ Lower development and maintenance cost
- ✅ Same authentication/data as desktop

### 6.3 Progressive Web App (PWA) Features

**PWA Capabilities:**
- **Install to Home Screen**: Acts like native app icon
- **Full-screen mode**: Hides browser UI for app-like experience
- **Offline mode**: Works without internet using cached data
- **Background sync**: Queues actions when offline, syncs when online
- **App-like navigation**: Bottom navigation, swipe gestures
- **Fast loading**: Service worker caching

**Offline Strategy:**
- Cache essential resources (HTML, CSS, JS, images)
- Store customer list, product catalog in IndexedDB
- Queue visits, orders, notes when offline
- Auto-sync when connection restored
- Show offline indicator in UI

### 6.4 Mobile-Responsive Design Enhancements

**Layout Optimizations:**
- Single-column layouts on mobile
- Collapsible sections to reduce scrolling
- Fixed bottom action bar for primary CTAs
- Swipe-able cards for lists
- Pull-to-refresh gesture
- Touch-friendly form inputs (date pickers, dropdowns)

**Performance Optimizations:**
- Lazy load images and components
- Minimize bundle size (code splitting)
- Compress images for mobile networks
- Use WebP format for images
- Implement virtual scrolling for long lists
- Debounce search inputs

**Mobile-Specific UX:**
- Large touch targets (minimum 44x44px)
- Bottom sheet modals (easier thumb reach)
- Sticky headers for context
- Loading skeletons for slow connections
- Toast notifications instead of modals
- Haptic feedback on actions (where supported)

### 6.5 Location Capture Implementation

**Geolocation API Usage:**
```typescript
// Request location permission and capture GPS coordinates
navigator.geolocation.getCurrentPosition(
  (position) => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const accuracy = position.coords.accuracy; // in meters
    
    // Send to backend for verification
    checkInToVisit(customerId, latitude, longitude, accuracy);
  },
  (error) => {
    // Handle permission denied or GPS unavailable
    showLocationError(error.message);
  },
  {
    enableHighAccuracy: true, // Use GPS instead of WiFi/cell tower
    timeout: 10000, // 10 second timeout
    maximumAge: 0 // Don't use cached location
  }
);
```

**Location Permissions:**
- Browser prompts user for permission on first use
- Permission persists across sessions (unless revoked)
- "Allow" or "Block" options
- HTTPS required for Geolocation API (security)
- Clear messaging: "We need your location to verify pharmacy visits"

### 6.6 Deliverables

- [ ] Responsive CSS for all rep screens (mobile-first)
- [ ] Service Worker implementation for offline mode
- [ ] Web App Manifest for PWA installation
- [ ] Geolocation API integration for visit check-in
- [ ] Camera API for barcode scanning
- [ ] IndexedDB storage for offline data
- [ ] Background sync for queued actions
- [ ] Mobile testing on real devices (iOS Safari, Android Chrome)
- [ ] Performance optimization (Lighthouse score > 90)
- [ ] Mobile user guide

### 6.7 Success Criteria

- Works on mobile browsers (iOS Safari, Android Chrome)
- Can be installed to home screen (PWA)
- GPS location capture accuracy < 50m
- Offline mode works for 24+ hours
- Page load < 3 seconds on 3G network
- Lighthouse mobile score > 90
- Touch targets meet accessibility standards (44x44px)
- Works in portrait and landscape orientations

---

## Cross-Phase Considerations

### Integration with Existing Modules

**Existing Systems to Integrate:**
- **Customers**: Rep assignments, visit tracking, order attribution
- **Products**: Catalog access, pricing, promotions
- **Orders**: Rep-created orders, commission tracking
- **Inventory**: Real-time stock checks, warehouse allocation
- **Targets** (existing admin module): Extend for rep-level targets
- **Users**: Authentication, authorization, hierarchy

### Security and Compliance

**Data Protection:**
- GDPR compliance for customer/physician data
- Role-based access control (RBAC)
- Audit logs for all sensitive operations
- Encryption at rest and in transit
- Secure API authentication (JWT)

**Industry Compliance:**
- Pharmaceutical industry regulations (sample tracking)
- GPS data privacy (store only for business purposes)
- Signature capture for legal validity
- Data retention policies

### Performance Requirements

**Response Times:**
- API endpoints: < 500ms (95th percentile)
- Page loads: < 2 seconds
- Mobile app startup: < 3 seconds
- GPS capture: < 5 seconds
- Order submission: < 2 seconds

**Scalability:**
- Support 100+ concurrent reps
- 500+ visits per day
- 1,000+ orders per day
- GPS data points: 10,000+ per day

### Testing Strategy

**Testing Phases:**
1. **Unit Tests**: 80%+ code coverage per phase
2. **Integration Tests**: API contract tests
3. **E2E Tests**: Critical user journeys
4. **UAT**: Rep and manager testing before deployment
5. **Performance Tests**: Load testing with realistic data
6. **Mobile Testing**: Device matrix (iOS/Android versions)
7. **GPS Testing**: Location accuracy validation

### Training and Rollout

**Phased Rollout:**
1. **Pilot**: 5-10 reps (1 week)
2. **Early Adopters**: 20-30 reps (2 weeks)
3. **Regional**: By canton (4 weeks)
4. **Full Deployment**: All reps

**Training Materials:**
- Video tutorials (5-10 min per feature)
- Quick reference guides (PDF)
- In-app tooltips and onboarding
- Live training sessions (webinars)
- FAQ and knowledge base

### Documentation Requirements

**Per Phase:**
- [ ] Technical specifications
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Database schema diagrams
- [ ] UI/UX mockups and flows
- [ ] User guides (rep, manager, admin)
- [ ] Release notes
- [ ] Known issues and workarounds

---

## Implementation Timeline

### Gantt Chart Overview

```
Phase 1: Foundation & User Management      [Weeks 1-3]
  ├── Database schema                      Week 1
  ├── Backend API                          Week 2
  ├── Frontend screens                     Week 2-3
  └── Testing & docs                       Week 3

Phase 2: Visit Planning & Execution        [Weeks 4-7]
  ├── Database schema                      Week 4
  ├── Backend API (GPS logic)              Week 4-5
  ├── Rep screens (planner, execution)     Week 5-6
  ├── Manager screens (approval, audit)    Week 6-7
  └── Testing & docs                       Week 7

Phase 3: Order Taking & Customers          [Weeks 8-11]
  ├── Database enhancements                Week 8
  ├── Backend order APIs                   Week 8-9
  ├── Rep order creation UI                Week 9-10
  ├── Offline support                      Week 10-11
  └── Testing & docs                       Week 11

Phase 4: Targets & Performance             [Weeks 12-15]
  ├── Database schema                      Week 12
  ├── Backend APIs & services              Week 12-13
  ├── Rep dashboard                        Week 13-14
  ├── Manager dashboards                   Week 14
  └── Testing & docs                       Week 15

Phase 5: Reporting & Advanced              [Weeks 16-18]
  ├── Database schema                      Week 16
  ├── Backend reporting APIs               Week 16-17
  ├── Rep & manager screens                Week 17
  ├── Gratis/sample features               Week 17-18
  └── Testing & docs                       Week 18

Phase 6: Mobile Web & PWA                  [Weeks 19-21]
  ├── Responsive design refinements        Week 19
  ├── Service Workers & offline mode       Week 19-20
  ├── PWA features & optimizations         Week 20-21
  └── Mobile testing & refinement          Week 21

TOTAL ESTIMATED DURATION: 21 weeks (~5 months)
```

### Dependencies and Critical Path

**Critical Path:**
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

**Possible Parallelization:**
- Phase 3 and Phase 4 can partially overlap (once Phase 1 complete)
- Phase 5 reporting can start once data exists from Phase 2-4

---

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| GPS accuracy issues | High | Medium | Multiple validation methods, manual override option |
| Offline sync conflicts | Medium | Medium | Conflict resolution UI, timestamp-based priority |
| User adoption resistance | High | Low | Comprehensive training, pilot program, feedback loops |
| Performance at scale | Medium | Low | Load testing, optimization, caching strategies |
| Browser compatibility | Low | Low | Test on major mobile browsers, use polyfills if needed |
| Integration complexity | Medium | Medium | Phased approach, clear API contracts |
| Data privacy concerns | High | Low | Security review, compliance checks, encryption |

---

## Success Metrics (KPIs)

### System Metrics
- **Uptime**: 99.5%+
- **API Response Time**: < 500ms (p95)
- **GPS Accuracy**: 95%+ within 100m
- **Offline Sync Success**: 99%+

### User Adoption Metrics
- **Active Rep Users**: 90%+ of reps use weekly
- **Visit Check-ins**: 95%+ of visits checked in
- **Orders via Mobile**: 60%+ of orders from mobile devices
- **Weekly Reports Submitted**: 90%+ on time
- **PWA Installations**: 70%+ of reps install to home screen

### Business Metrics
- **Target Achievement**: 80%+ reps meet monthly targets
- **Visit Efficiency**: 6+ visits per day average
- **Order Conversion**: 70%+ of visits result in orders
- **Gratis ROI**: 3:1 ratio (order value to gratis value)

---

## Conclusion

This phased implementation plan provides a structured approach to delivering sales representative functionality in PharmaAssist. Each phase builds upon the previous, ensuring a stable foundation while delivering incremental value.

**Key Priorities:**
1. **Phase 1** establishes the foundation - critical for all subsequent work
2. **Phases 2-3** deliver core field functionality - highest ROI
3. **Phase 4** adds performance management - differentiator
4. **Phase 5** provides insights and compliance - operational excellence
5. **Phase 6** optimizes mobile experience - ensures field usability

**Technology Approach:**
- **Mobile-responsive web application** (no native app needed)
- Reps access via mobile browser (Chrome, Safari)
- GPS location via browser Geolocation API
- Progressive Web App (PWA) for app-like experience
- Single Angular codebase for desktop and mobile

**Recommended Start:** Begin with Phase 1 immediately, with goal of having Phases 1-3 completed within 3 months to enable field reps to use the system from their mobile phones for core activities.

---

**Document Approval:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Tech Lead | | | |
| Sales Director | | | |

**Document History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-05 | GitHub Copilot | Initial phased implementation plan |
