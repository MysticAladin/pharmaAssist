# Frontend Architecture

## Overview

The PharmaAssist frontend is an Angular 21 application using standalone components (no NgModules), feature-based lazy-loaded routing, and signals for reactive state management. The app is organized into three main directories: `core/`, `features/`, and `shared/`.

---

## Routing Structure

Routes are defined in `src/app/app.routes.ts`. All feature routes are lazy-loaded and protected by guards.

### Main Routes (Admin/Staff Portal)

| Path | Feature | Guard(s) | Description |
|------|---------|----------|-------------|
| `/` | redirect → `/dashboard` | — | Default redirect |
| `/auth/*` | Auth | `noAuthGuard` | Login, register, forgot/reset password, verify email |
| `/dashboard` | Dashboard | `staffGuard` | Main dashboard |
| `/products` | Products | `staffGuard` | Product list + categories, manufacturers, low-stock |
| `/customers` | Customers | `staffGuard`, `featureGuard` | Customer management (feature: CustomerManagement) |
| `/orders` | Orders | `staffGuard` | Orders, pending, rep orders, templates, claims |
| `/inventory` | Inventory | `staffGuard`, `featureGuard` | Stock, warehouses, adjustments, transfers (feature: InventoryManagement) |
| `/reports` | Reports | `staffGuard`, `featureGuard` | All report types + report builder (feature: BasicReports) |
| `/visits` | Visits | `staffGuard`, `roleGuard` | Visit planner, check-in, history, team activity (roles: SalesRep, Manager, Admin, SuperAdmin) |
| `/tenders` | Tenders | `staffGuard`, `featureGuard` | Tender management (feature: TenderManagement) |
| `/admin/*` | Admin | `staffGuard`, `adminGuard` | Users, feature flags, pricing, sales reps, settings, targets, audit |
| `/settings` | Settings | `staffGuard` | App settings |
| `/profile` | Profile | `staffGuard` | User profile |
| `/upgrade` | Upgrade | `staffGuard` | Upselling page |
| `/access-denied` | Error | — | 403 page |
| `/**` (wildcard) | Error | — | 404 page |

### Portal Routes (E-Pharmacy / Customer-Facing)

| Path | Feature | Guard(s) | Description |
|------|---------|----------|-------------|
| `/portal` | Portal | `customerGuard` | Portal home with catalog |
| `/portal/catalog` | Catalog | `customerGuard` | Product browsing |
| `/portal/product/:id` | Product Detail | `customerGuard` | Single product view |
| `/portal/cart` | Cart | `customerGuard` | Shopping cart |
| `/portal/checkout` | Checkout | `customerGuard` | Multi-step checkout |
| `/portal/quick-order` | Quick Order | `customerGuard` | Fast reorder |
| `/portal/orders` | My Orders | `customerGuard` | Customer order history |
| `/portal/orders/:id` | Order Detail | `customerGuard` | Order detail view |
| `/portal/favorites` | Favorites | `customerGuard` | Wishlist |
| `/portal/claims` | Claims | `customerGuard` | Returns/claims |
| `/portal/promotions` | Promotions | `customerGuard` | Active promotions |
| `/portal/account` | Account | `customerGuard` | Profile |
| `/portal/confirmation` | Confirmation | `customerGuard` | Post-checkout |
| `/portal/rep-dashboard` | Rep Dashboard | `customerGuard` | Sales rep portal view |

---

## Route Guards

| Guard | File | Purpose |
|-------|------|---------|
| `authGuard` | `core/guards/auth.guard.ts` | Requires authenticated user |
| `noAuthGuard` | `core/guards/auth.guard.ts` | Requires unauthenticated user (redirects to dashboard if logged in) |
| `adminGuard` | `core/guards/admin.guard.ts` | Requires Admin or SuperAdmin role |
| `roleGuard` | `core/guards/role.guard.ts` | Requires specific role(s) via route data |
| `featureGuard` | `core/guards/feature.guard.ts` | Checks feature flag is enabled |
| `customerGuard` | `core/guards/customer.guard.ts` | Requires Customer role (redirects to main app if staff) |
| `staffGuard` | `core/guards/staff.guard.ts` | Requires authenticated non-Customer role (redirects to portal if customer) |

---

## Core Services (40+)

Key services in `src/app/core/services/`:

### Authentication & User
- `AuthService` — Login, register, logout, token management
- `UserService` — User CRUD, profile
- `RoleService` — Role management

### Business Data
- `ProductService` — Product CRUD with pagination/filtering
- `CustomerService` — Customer management
- `OrderService` — Order lifecycle
- `InventoryService` — Stock operations
- `PrescriptionService` — Prescription management
- `TenderService` — Tender CRUD

### Sales Force
- `SalesRepService` — Rep management
- `VisitService` — Visit execution
- `VisitPlanService` — Visit planning
- `PlanningService` — Annual/quarterly/monthly plans

### Portal (E-Pharmacy)
- `CatalogService` — Product catalog with batch browsing
- `CartService` — Shopping cart (batch-specific items)
- `FavoritesService` — Wishlist management
- `PortalOrderService` — Customer order placement

### System
- `FeatureFlagService` — Feature flag queries
- `NotificationService` — In-app notifications
- `TranslateService` — i18n (ngx-translate)
- `ThemeService` — Theme management
- `ExportService` — Data export
- `ReportService` — Report generation

---

## Core Models (25+)

TypeScript interfaces in `src/app/core/models/`:

- `user.model.ts` — User, LoginRequest, LoginResponse, TokenRefresh
- `product.model.ts` — Product, ProductFilter, ProductBatch
- `customer.model.ts` — Customer, CustomerAddress, CustomerType
- `order.model.ts` — Order, OrderItem, OrderCreate, OrderStatus
- `inventory.model.ts` — InventoryStock, StockMovement, Warehouse
- `prescription.model.ts` — Prescription, PrescriptionStatus
- `portal.model.ts` — CartItem, ProductBatchCatalogItem, CheckoutData
- `sales-rep.model.ts` — SalesRepresentative, RepresentativeType
- `visit.model.ts` — Visit, VisitPlan, PlannedVisit, ExecutedVisit
- `report.model.ts` — ReportFilter, ReportData
- `feature-flag.model.ts` — FeatureFlag, FlagScope, FlagType
- `tender.model.ts` — Tender, TenderBid
- `pagination.model.ts` — PaginatedResult, PaginationParams
- `claim.model.ts` — Claim, ClaimType, ClaimStatus

---

## Custom Pipes

| Pipe | File | Usage |
|------|------|-------|
| `EuropeanDatePipe` | `core/pipes/european-date.pipe.ts` | Formats dates as DD.MM.YYYY (European/BiH format) |
| `KmCurrencyPipe` | `core/pipes/km-currency.pipe.ts` | Formats currency as "1.234,56 KM" |
| `FeatureFlagPipe` | `core/pipes/feature-flag.pipe.ts` | Checks if feature flag is enabled in templates |

---

## Shared Components

Reusable UI components in `src/app/shared/components/`:

| Component | Purpose |
|-----------|---------|
| `DataTableComponent` | Configurable data table with sorting, selection |
| `ModalComponent` | Generic modal dialog |
| `ConfirmDialogComponent` | Confirmation dialog |
| `PaginationComponent` | Pagination controls |
| `SearchInputComponent` | Debounced search input |
| `StatusBadgeComponent` | Colored status indicators |
| `EmptyStateComponent` | Empty data placeholder with icon and CTA |
| `LoadingSkeletonComponent` | Skeleton loading placeholders |
| `PageHeaderComponent` | Reusable page header with breadcrumbs and actions |
| `CommandPaletteComponent` | Ctrl+K command palette for quick navigation |
| `NotificationPanelComponent` | Notification dropdown |
| `HeaderComponent` | App header bar |
| `SidebarComponent` | Navigation sidebar (role-based menu items) |
| `FooterComponent` | App footer |
| `LoadingOverlayComponent` | Full-page loading overlay |
| `BarcodeScannerComponent` | Camera-based barcode scanning |
| `ActivityFeedComponent` | Activity timeline display |
| `VirtualScrollComponent` | Virtualized list rendering for large datasets |
| `TourOverlayComponent` | Guided tour/onboarding overlay |

---

## Shared SCSS Modules

Located in `src/styles/` and imported by components:

| Module | Lines | Contents |
|--------|-------|----------|
| `_buttons.scss` | ~290 | Button variants (primary, secondary, outline, ghost, danger), sizes |
| `_cards.scss` | ~200 | Card layouts, stat cards, dashboard cards |
| `_layouts.scss` | ~300 | Page layouts, headers, grids, empty/loading states |
| `_filters.scss` | ~150 | Filter bars, search inputs, date pickers, select dropdowns |
| `_theme.scss` | — | CSS custom properties (colors, spacing, typography) |
| `_icons.scss` | — | Icon definitions |

---

## Internationalization (i18n)

- **Library:** `ngx-translate`
- **Languages:** English (`en.json`), Bosnian (`bs.json`)
- **Default:** Bosnian (BiH market)
- **Translation files:** `src/assets/i18n/en.json`, `src/assets/i18n/bs.json`
- **Usage in templates:** `{{ 'key.subkey' | translate }}`
- **Usage in components:** `this.translate.instant('key.subkey')`

---

## HTTP Interceptors

| Interceptor | Purpose |
|-------------|---------|
| Auth Interceptor | Injects `Authorization: Bearer <token>` header on API requests |
| Error Interceptor | Handles 401 (redirect to login), 403 (access denied), 500 (server error) |

---

## Component Refactoring Status

The codebase is undergoing a refactoring from inline templates/styles to separate files:

- **Completed:** 3/50+ components (PageHeader, Orders List, Dashboard, Products List)
- **Strategy:** Extract template → Create SCSS file using shared modules → Clean TypeScript
- **Target reduction:** 40-45% code reduction through shared styles and components
- **Shared SCSS modules:** Created and fully usable (buttons, cards, layouts, filters)

### Refactoring Pattern

**Before (inline):**
```typescript
@Component({
  selector: 'app-example',
  template: `<div>...</div>`,
  styles: [`...`]
})
```

**After (separated):**
```typescript
@Component({
  selector: 'app-example',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.scss']
})
```
