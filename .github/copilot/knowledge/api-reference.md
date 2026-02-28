# API Reference

## Base Configuration

- **Base URL (dev):** `https://localhost:5001/api` or `http://localhost:5000/api`
- **Base URL (prod):** `https://pharma-assist-api-*.azurewebsites.net/api`
- **Auth:** JWT Bearer tokens in `Authorization: Bearer <token>` header
- **Content-Type:** `application/json`
- **API Docs:** Swagger UI at `/swagger`
- **CORS:** Configured for `http://localhost:4200` (dev)

---

## Controllers (42 Total)

### Authentication & Identity

| Controller | Route Prefix | Purpose |
|-----------|-------------|---------|
| `AuthController` | `/api/auth` | Login, register, refresh token, forgot/reset password, verify email |
| `UsersController` | `/api/users` | User CRUD, profile management |
| `RolesController` | `/api/roles` | Role CRUD, permission assignment |

### Core Business

| Controller | Route Prefix | Purpose |
|-----------|-------------|---------|
| `ProductsController` | `/api/products` | Product CRUD with filtering, search, pagination |
| `CategoriesController` | `/api/categories` | Category CRUD (hierarchical) |
| `ManufacturersController` | `/api/manufacturers` | Manufacturer CRUD |
| `CustomersController` | `/api/customers` | Customer CRUD with type/tier filtering |
| `OrdersController` | `/api/orders` | Order lifecycle management, status transitions |
| `OrderTemplatesController` | `/api/order-templates` | Saved order templates |
| `InventoryController` | `/api/inventory` | Stock management, movements, adjustments, transfers |
| `ClaimsController` | `/api/claims` | Return/claim management |

### Sales Force

| Controller | Route Prefix | Purpose |
|-----------|-------------|---------|
| `SalesRepsController` | `/api/sales-reps` | Sales representative CRUD |
| `RepCustomersController` | `/api/rep-customers` | Rep-to-customer assignments |
| `RepOrdersController` | `/api/rep-orders` | Orders created by reps |
| `VisitsController` | `/api/visits` | Visit execution, check-in/check-out |
| `VisitPlansController` | `/api/visit-plans` | Weekly visit plan CRUD, approval workflow |
| `VisitReportsController` | `/api/visit-reports` | Visit reporting and analytics |
| `RepProductsController` | `/api/rep-products` | Products available to reps |
| `SalesRepDashboardController` | `/api/sales-rep-dashboard` | Rep-specific dashboard data |
| `SalesRepPerformanceController` | `/api/sales-rep-performance` | Performance metrics and KPIs |

### Planning Hierarchy

| Controller | Route Prefix | Purpose |
|-----------|-------------|---------|
| `AnnualPlansController` | `/api/annual-plans` | Annual plan CRUD |
| `QuarterlyPlansController` | `/api/quarterly-plans` | Quarterly plan CRUD |
| `MonthlyPlansController` | `/api/monthly-plans` | Monthly plan CRUD |
| `ManagerPlanningController` | `/api/manager-planning` | Manager view of team plans |
| `ManagerVisitPlansController` | `/api/manager-visit-plans` | Manager approval of visit plans |
| `PlanExecutionReportsController` | `/api/plan-execution-reports` | Plan vs. actual execution reports |

### E-Pharmacy Portal

| Controller | Route Prefix | Purpose |
|-----------|-------------|---------|
| `PortalController` | `/api/portal` | Customer-facing catalog, orders, prescriptions, favorites |

### Pricing & Promotions

| Controller | Route Prefix | Purpose |
|-----------|-------------|---------|
| `PricingController` | `/api/pricing` | Price rules, promotions, pricing engine |
| `TargetsController` | `/api/targets` | Sales target management |
| `BudgetsController` | `/api/budgets` | Budget tracking |
| `TendersController` | `/api/tenders` | Tender management and bidding |

### Reporting

| Controller | Route Prefix | Purpose |
|-----------|-------------|---------|
| `DashboardController` | `/api/dashboard` | Main dashboard aggregated data |
| `ReportsController` | `/api/reports` | Sales, inventory, financial, customer reports |

### System & Admin

| Controller | Route Prefix | Purpose |
|-----------|-------------|---------|
| `FeatureFlagsController` | `/api/feature-flags` | Feature flag management (system + client) |
| `AuditController` | `/api/audit` | Audit log viewing and filtering |
| `EmailController` | `/api/email` | Email log management, resend |
| `NotificationSettingsController` | `/api/notification-settings` | Email notification recipients config |
| `FilesController` | `/api/files` | File upload/download (10MB max) |
| `PdfController` | `/api/pdf` | PDF generation (invoices, orders, delivery notes, packing slips) |
| `JobsController` | `/api/jobs` | Background job management |
| `LocationsController` | `/api/locations` | BiH geographic data (entities, cantons, municipalities, cities) |
| `WeatherForecastController` | `/api/weather` | Default template controller (placeholder) |

---

## Service Interfaces (34 Total)

All service interfaces are in `server/src/Application/Interfaces/`:

### Auth & Identity
- `IAuthService` — Login, register, password management
- `IUserService` — User CRUD operations
- `IRoleService` — Role management with permissions
- `ITokenService` — JWT + refresh token generation/validation

### Core Business
- `IProductService` — Product catalog management
- `ICategoryService` — Category hierarchy
- `IManufacturerService` — Manufacturer data
- `ICustomerService` — Customer management with hierarchy
- `IOrderService` — Order processing and lifecycle
- `IOrderTemplateService` — Order template CRUD
- `IOrderEmailService` — Order-related email notifications
- `IInventoryService` — Stock tracking, movements, batch management
- `IClaimService` — Returns and claims processing

### Sales Force
- `ISalesRepService` — Sales representative management
- `IRepCustomerService` — Rep-customer assignments
- `IRepOrderService` — Rep order creation
- `IVisitService` — Visit execution with GPS
- `IVisitPlanService` — Visit plan CRUD and workflow
- `IVisitReportService` — Visit analytics
- `IPlanningHierarchyService` — Annual/Quarterly/Monthly plan management
- `IPlanExecutionReportService` — Plan vs. execution analytics

### Pricing & Reporting
- `IPricingService` — Price rules and promotion engine
- `IPromotionEngineService` — Promotion calculation logic
- `IReportService` — Report generation
- `IDashboardService` — Dashboard data aggregation
- `ITenderService` — Tender management

### System Services
- `IFeatureFlagService` — Feature flag CRUD with history
- `IAuditService` — Audit log recording and querying
- `IEmailService` — SMTP email sending
- `IEmailSchedulingManager` — Scheduled email operations (weekly manager reports, daily visit reminders, retry failed, cleanup logs)
- `IFileService` — File upload/storage
- `IPdfService` — PDF document generation
- `ILocationService` — BiH geographic data queries
- `INotificationSettingsService` — Notification recipient configuration

---

## Authentication Flow

### Login
```
POST /api/auth/login
Body: { "email": "...", "password": "..." }
Response: { "token": "jwt...", "refreshToken": "...", "user": {...} }
```

### Token Refresh
```
POST /api/auth/refresh-token
Body: { "token": "jwt...", "refreshToken": "..." }
Response: { "token": "new-jwt...", "refreshToken": "new-refresh..." }
```

### JWT Configuration
- **Issuer:** `PharmaAssist`
- **Audience:** `PharmaAssistClient`
- **Access token lifetime:** 60 minutes
- **Refresh token lifetime:** 7 days
- **Algorithm:** HMAC-SHA256

### Authorization
- **Role-based:** `[Authorize(Roles = "Admin,SuperAdmin")]`
- **Permission-based:** Custom `[HasPermission("...")]` attribute
- **Default roles:** SuperAdmin, Admin, Manager, Pharmacist, SalesRep, Warehouse, Customer

---

## Common API Patterns

### Pagination
Most list endpoints accept:
```
?page=1&pageSize=20&sortBy=createdAt&sortOrder=desc
```

Response includes:
```json
{
  "items": [...],
  "totalCount": 245,
  "page": 1,
  "pageSize": 20,
  "totalPages": 13,
  "hasPrevious": false,
  "hasNext": true
}
```

### Filtering
List endpoints typically support:
```
?search=keyword&status=Active&dateFrom=2025-01-01&dateTo=2025-12-31
```

### Error Responses
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Bad Request",
  "status": 400,
  "errors": { "field": ["Error message"] }
}
```
