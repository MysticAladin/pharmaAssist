# PharmaAssist - Copilot Instructions

> This file is the main entry point for GitHub Copilot context. It is automatically loaded when opening a new chat session. It provides project overview and links to detailed documentation in `knowledge/` and `guidelines/` subdirectories.

## Project Identity

**Name:** PharmaAssist
**Type:** Pharmaceutical distribution and sales management platform
**Target Market:** Bosnia and Herzegovina (BiH)
**Company:** Codian Tech
**Primary Language:** Bosnian (bs), with English (en) support
**Currency:** KM (Konvertibilna Marka / BAM)

## Quick Summary

PharmaAssist is a full-stack web application for pharmaceutical distribution companies in Bosnia and Herzegovina. It connects sales representatives, pharmacies, hospitals, wholesale drugstores, and physicians through order management, inventory tracking, sales rep visit planning with GPS verification, prescription management, tender management, reporting/analytics, and an e-Pharmacy customer portal.

## Architecture

- **Backend:** ASP.NET Core (.NET 10) — Clean Architecture (Domain → Application → Infrastructure → Api)
- **Frontend:** Angular 21 — Standalone components, feature-based lazy-loaded routing
- **Database:** SQL Server with Entity Framework Core (Code-First migrations)
- **Background Jobs:** Hangfire (3 queues: default, emails, reports)

## Repository Structure

```
├── .github/
│   ├── copilot/                    # Copilot knowledge base (THIS directory)
│   │   ├── copilot-instructions.md # Main entry point (this file)
│   │   ├── knowledge/             # Domain knowledge docs
│   │   └── guidelines/            # Coding & operational guidelines
│   └── workflows/                 # CI/CD pipelines (Azure deployment)
├── client/pharma-assist/          # Angular 21 frontend
│   └── src/app/
│       ├── core/                  # Services, models, guards, interceptors, pipes
│       ├── features/              # Feature modules (lazy-loaded)
│       └── shared/                # Shared/reusable components
├── server/                        # .NET 10 backend
│   ├── src/
│   │   ├── Api/                   # Web API (42 controllers, Program.cs)
│   │   ├── Application/           # Interfaces, DTOs, validators, mappings
│   │   ├── Domain/                # Entities, enums, repository interfaces
│   │   └── Infrastructure/        # EF Core, repositories, services, Hangfire
│   └── tests/                     # xUnit tests
├── docs/                          # Extended project documentation
│   ├── requirements/             # Business requirements & specifications
│   ├── implementations/          # Technical implementation details
│   ├── operations/               # Deployment guides & testing
│   ├── status/                   # Progress tracking
│   ├── business/                 # Commercial documents
│   ├── azure/                    # Azure credentials & config
│   └── archive/                  # Superseded documents
├── frontend-clean/                # Production build output
└── frontend-static/               # Static frontend assets
```

## Knowledge Base (Copilot Auto-Loaded)

Detailed project knowledge is organized in subdirectories of this folder. These are the primary reference documents for Copilot.

### Knowledge (`knowledge/`)

| File | When to Reference |
|------|-------------------|
| [project-overview.md](knowledge/project-overview.md) | Understanding business domain, features, user roles, BiH regulatory context, pricing |
| [tech-stack.md](knowledge/tech-stack.md) | Technology choices, package versions, dependencies, architecture layers |
| [database-schema.md](knowledge/database-schema.md) | Entity structure, enums, relationships, migrations — before any DB work |
| [api-reference.md](knowledge/api-reference.md) | All 42 controllers, 34 service interfaces, endpoints, auth flow, API patterns |
| [frontend-architecture.md](knowledge/frontend-architecture.md) | Angular routing (30+ routes with guards), components, services, shared UI |

### Guidelines (`guidelines/`)

| File | When to Reference |
|------|-------------------|
| [coding-standards.md](guidelines/coding-standards.md) | Before writing any code — backend (.NET) and frontend (Angular) conventions |
| [security.md](guidelines/security.md) | Auth, RBAC (7 roles), permissions, data protection, audit trail |
| [testing.md](guidelines/testing.md) | Writing tests — xUnit (backend), Vitest (frontend), patterns, CI integration |
| [deployment.md](guidelines/deployment.md) | CI/CD, Azure hosting, Contabo alternative, build commands, migrations |

## Extended Documentation (`docs/`)

For deeper dives, reference these categorized docs at the project root:

### Requirements

- `docs/requirements/PharmaAssist_Comprehensive_Requirements.md` — **Canonical** full requirements specification (3,000+ lines)
- `docs/requirements/Frontend_UIUX_Plan.md` — UI/UX specifications with layout mockups and access matrix
- `docs/requirements/MISSING_FEATURES_ANALYSIS.md` — Gap analysis comparing implementation vs. requirements

### Implementation Details

- `docs/implementations/BATCH-ARCHITECTURE-IMPLEMENTATION.md` — Batch-based product catalog architecture (frontend)
- `docs/implementations/BATCH-BACKEND-IMPLEMENTATION.md` — Batch catalog backend endpoints and DTOs
- `docs/implementations/FEATURE-FLAG-ANALYSIS.md` — Two-tier feature flag and authorization system design
- `docs/implementations/EMAIL_AND_SCHEDULER_IMPLEMENTATION.md` — Email system & Hangfire scheduler setup
- `docs/implementations/SALES_REP_IMPLEMENTATION_PLAN.md` — 6-phase sales representative feature plan

### Operations

- `docs/operations/CONTABO_DEPLOYMENT_GUIDE.md` — Alternative Contabo server deployment (Nginx, systemd, SSL)
- `docs/operations/CLIENT_TESTING_GUIDE.md` — Test accounts & role-based access for client testers
- `docs/operations/USERS-AND-PERMISSIONS.md` — Role-based access matrix with detailed menu permissions

### Frontend Coding Reference

- `client/pharma-assist/CODING_GUIDELINES.md` — **Detailed** Angular page patterns, SCSS module system, component structure

## Key Conventions

- **Backend namespaces** follow Clean Architecture layers: `Domain.*`, `Application.*`, `Infrastructure.*`, `Api.*`
- **Frontend** uses Angular standalone components (no NgModules), signals for state, and feature-based folder organization
- **Route protection:** Staff routes use `staffGuard` (not `authGuard`); portal routes use `customerGuard`; feature-gated routes add `featureGuard`; auth routes use `noAuthGuard`
- **i18n** is handled via `ngx-translate` (v17) with translation keys in `assets/i18n/en.json` and `assets/i18n/bs.json`
- **All user-visible text** must use translation keys — never hardcode display strings
- **Date format:** European `dd.MM.yyyy` via `EuropeanDatePipe` — never use `toLocaleDateString()`
- **Currency format:** `1.234,56 KM` via `KmCurrencyPipe`
- **Database** uses EF Core Code-First with `ApplicationDbContext` and auto-applied migrations on startup
- **PDF generation** uses QuestPDF (v2024.12.2) for invoices, orders, delivery notes, packing slips
- **Validation** uses FluentValidation with auto-validation (SharpGrip v1.5)
- **Mapping** uses AutoMapper (v15) with profiles defined in `Application/Mappings/`
- **Testing:** xUnit + FluentAssertions + Moq (backend); Vitest v4 + jsdom (frontend)
- **New Angular components** must use `@if`/`@for` control flow, not `*ngIf`/`*ngFor`

## Current Status

- **Overall completion:** ~50% of comprehensive requirements
- **Fully operational:** Core order management, inventory, products, customers, prescriptions, reports, e-Pharmacy portal, sales rep visits, feature flags, email notifications, PDF generation, audit logging
- **In progress:** Component refactoring (inline → separate files), additional portal features
- **Known gaps:** Sample/gratis management (~5%), medical/scientific rep module (~10%), territory management (~40%), activity reporting (~30%)
- **Priority issues (P0):** Customer portal promotions listing, wholesale search-based ordering
- **Priority issues (P1):** Targets/Budgets create flows (DTO mismatch), PDF export buttons in UI
