# Technology Stack

## Backend

### Runtime & Framework

| Technology | Version | Purpose |
|-----------|---------|---------|
| .NET | 10.0 (`net10.0`) | Runtime |
| ASP.NET Core | 10.0 | Web API framework |
| C# | Latest (with .NET 10) | Primary language |

### Core NuGet Packages

| Package | Version | Purpose |
|---------|---------|---------|
| **Entity Framework Core** | 10.0.0 | ORM / database access |
| EF Core SqlServer | 10.0.0 | SQL Server provider |
| EF Core Design | 10.0.0 | Migration tooling |
| **ASP.NET Identity** | — (via EF Core Identity) | User/role management |
| **Hangfire** | 1.8.x | Background job processing |
| Hangfire.SqlServer | — | Job storage in SQL Server |
| **QuestPDF** | 2024.12.2 | PDF generation (invoices, orders, reports) |
| **AutoMapper** | 15.1.0 | Object-to-object mapping |
| **FluentValidation** | — | Request validation |
| SharpGrip.FluentValidation.AutoValidation | 1.5.0 | Auto-wiring validation |
| **Serilog** | — | Structured logging |
| Serilog.Sinks.Console | — | Console log output |
| Serilog.Sinks.File | — | File log output (daily rolling) |
| **Swashbuckle** | — | Swagger/OpenAPI documentation |
| **JWT Bearer** | — | Token-based authentication |
| **BCrypt.Net** | — | Password hashing |

### Backend Architecture (Clean Architecture)

```
server/src/
├── Domain/                     # Core business entities & interfaces
│   ├── Entities/               # 40+ entity classes (Product, Order, Customer, etc.)
│   ├── Enums/                  # Business enums (OrderStatus, CustomerType, etc.)
│   └── Interfaces/             # Repository interfaces
├── Application/                # Business logic contracts & DTOs
│   ├── Interfaces/             # 30+ service interfaces
│   ├── DTOs/                   # Data transfer objects (20+ groups)
│   ├── Validators/             # FluentValidation validators
│   └── Mappings/               # AutoMapper profiles
├── Infrastructure/             # Implementation details
│   ├── Data/                   # ApplicationDbContext, EF configurations
│   ├── Migrations/             # 25+ EF Core migrations
│   ├── Repositories/           # Repository implementations
│   ├── Services/               # Service implementations
│   ├── Identity/               # ASP.NET Identity configuration
│   └── Jobs/                   # Hangfire recurring jobs
└── Api/                        # Presentation layer
    ├── Controllers/            # 42 API controllers
    ├── Program.cs              # Application entry point & middleware
    └── DependencyInjection.cs  # Service registration
```

### Hangfire Configuration

- **3 queues:** `default`, `emails`, `reports`
- **4 recurring jobs:** Email retry, email cleanup, low stock alerts, expiring product alerts
- **Dashboard:** Available at `/hangfire` (restricted to Admin/SuperAdmin)

---

## Frontend

### Runtime & Framework

| Technology | Version | Purpose |
|-----------|---------|---------|
| Angular | 21.0.0 | Frontend framework |
| TypeScript | 5.9.2 | Primary language |
| Node.js | 20.x | Build runtime |
| SCSS | — | Styling preprocessor |

### Key NPM Packages

| Package | Version | Purpose |
|---------|---------|---------|
| `@angular/core` | 21.0.0 | Angular framework |
| `@angular/router` | 21.0.0 | Client-side routing |
| `@angular/forms` | 21.0.0 | Template & reactive forms |
| `@angular/animations` | 21.0.0 | UI animations |
| `@ngx-translate/core` | 17.0.0 | Internationalization (i18n) |
| `@ngx-translate/http-loader` | 17.0.0 | Translation file loading |
| `leaflet` | 1.9.4 | Interactive maps (visit GPS) |
| `@types/leaflet` | 1.9.21 | Leaflet type definitions |
| `rxjs` | ~7.8.0 | Reactive programming |
| `tslib` | ^2.3.0 | TypeScript helpers |
| `zone.js` | ^0.16.0 | Angular change detection |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `vitest` | 4.0.8 | Unit testing framework |
| `jsdom` | 27.1.0 | Test DOM environment |
| `@angular/build` | 21.0.1 | Build tooling (esbuild-based) |
| `typescript` | 5.9.2 | TypeScript compiler |

### Frontend Architecture

```
client/pharma-assist/src/app/
├── core/                       # Singleton services & app-wide concerns
│   ├── services/               # 40+ injectable services
│   ├── models/                 # 25+ TypeScript interfaces/models
│   ├── guards/                 # Route guards (auth, admin, role, feature, customer, staff)
│   ├── interceptors/           # HTTP interceptors (auth token, error handling)
│   ├── pipes/                  # Custom pipes (EuropeanDate, KmCurrency, FeatureFlag)
│   └── directives/             # Custom directives
├── features/                   # Lazy-loaded feature modules
│   ├── admin/                  # Users, Feature Flags, Pricing, Sales Reps, Settings, Targets, Audit
│   ├── auth/                   # Login, Register, Forgot/Reset Password, Verify Email
│   ├── customers/              # Customer CRUD + Rep Customers
│   ├── dashboard/              # Main dashboard
│   ├── errors/                 # 403, 404, 500 pages
│   ├── inventory/              # Stock, Warehouses, Adjustments, Transfers
│   ├── orders/                 # Orders, Rep Orders, Templates, Claims, Prescriptions
│   ├── portal/                 # E-Pharmacy portal (Catalog, Cart, Checkout, etc.)
│   ├── prescriptions/          # Prescription management
│   ├── products/               # Products, Categories, Manufacturers
│   ├── reports/                # 10+ report types + Report Builder
│   ├── settings/               # Application settings
│   ├── tenders/                # Tender management
│   ├── visits/                 # Visit planning, check-in, history, team activity
│   └── upgrade/                # Upselling page
└── shared/                     # Reusable components
    └── components/             # DataTable, Modal, Pagination, SearchInput, StatusBadge, etc.
```

### Angular Patterns

- **Standalone components** — No NgModules; all components use `standalone: true`
- **Signals** — Used for reactive state management in components
- **Lazy loading** — All feature routes use `loadChildren`/`loadComponent`
- **Route guards** — `authGuard`, `adminGuard`, `roleGuard`, `featureGuard`, `customerGuard`, `staffGuard`
- **HTTP interceptors** — Token injection, error handling, loading state
- **Translation** — `ngx-translate` with `TranslateModule` and `translate` pipe
- **SCSS modules** — Shared styles: `_buttons.scss`, `_cards.scss`, `_layouts.scss`, `_filters.scss`

---

## Database

| Property | Value |
|----------|-------|
| Engine | SQL Server |
| ORM | Entity Framework Core 10.0 |
| Strategy | Code-First with migrations |
| Context | `ApplicationDbContext` |
| Migrations | 25+ (Nov 2025 – Jan 2026) |
| Startup behavior | Auto-migrate + seed data |
| Connection (dev) | `Server=.;Database=PharmaAssist` |

---

## Infrastructure & DevOps

### CI/CD
- **GitHub Actions** — 4 workflow files in `.github/workflows/`
  - `deploy-frontend.yml` — Build Angular, deploy to Azure Static Web Apps
  - `deploy-backend.yml` — Build .NET, deploy to Azure App Service
  - `deploy-database.yml` — Run EF Core migrations
  - `deploy-full.yml` — Orchestrated full deployment with options

### Azure Hosting (Primary)
- **Frontend:** Azure Static Web Apps
- **Backend:** Azure App Service (West Europe)
- **Database:** Azure SQL Server (Germany West Central, Standard S0 / 10 DTU)
- **API URL:** `https://pharma-assist-api-*.westeurope-01.azurewebsites.net`

### Contabo Hosting (Alternative)
- Dedicated server with Nginx reverse proxy
- systemd service for .NET backend
- SSL via Let's Encrypt

### Logging
- **Serilog** with Console + File sinks
- Daily rolling log files, 30-day retention
- Log path: `Logs/log-.txt`

### API Documentation
- **Swagger/OpenAPI** at `/swagger` endpoint
- Auto-generated from controller actions and XML comments
