# PharmaAssist — Azure Deployment Plan (free-tier leaning)

_Last updated: 2025-12-25_

Goal: a simple, repeatable deployment from GitHub with minimal monthly cost. This plan is written to support **Dev/Demo** first; production hardening is called out separately.

## Proposed Azure architecture

### Option A (lowest friction)
- Frontend: **Azure Static Web Apps** (Angular)
- API: **Azure App Service (Windows, .NET)**
- Database: **Azure SQL Database**
- Secrets: App Service config (Dev) → **Key Vault** (Prod)
- Observability: **Application Insights**

Notes:
- Static Web Apps has a generous free tier; App Service has a free tier in some SKUs/regions, but it is limited. If free isn’t available/adequate, use the smallest paid SKU.
- Azure SQL is typically not “free”; for dev/demo, choose the smallest/basic option or serverless if available in your subscription/region.

### Option B (container-first)
- Frontend: Static Web Apps
- API: Azure Container Apps
- Database: Azure SQL Database

This can be cost-effective for spiky traffic but has more moving parts.

## CI/CD from GitHub (recommended)

### Workflow 1 — Frontend (Static Web Apps)
- Trigger: on push to `main` (or `dev`)
- Steps:
  - Install Node
  - `npm ci`
  - `npm run build` in `client/pharma-assist`
  - Deploy via `Azure/static-web-apps-deploy`
- Secrets:
  - `AZURE_STATIC_WEB_APPS_API_TOKEN` (created by SWA)

### Workflow 2 — API (App Service)
- Trigger: on push to `main`
- Steps:
  - Setup .NET SDK
  - `dotnet restore` / `dotnet build` / `dotnet test`
  - Publish `server/src/Api/Api.csproj`
  - Deploy via `azure/webapps-deploy`
- Secrets:
  - `AZURE_WEBAPP_PUBLISH_PROFILE` (or OIDC-based auth)

### Database migrations
- Recommended: run EF migrations as a controlled step:
  - Either a separate pipeline job that runs `dotnet ef database update` against the Azure SQL connection string
  - Or apply on startup (not recommended for production).

## Environment configuration

### Required app settings for the API
- Connection string to Azure SQL (`ConnectionStrings__DefaultConnection` or whatever the API expects)
- JWT/auth settings (as used by your current auth implementation)
- CORS allowed origins:
  - Static Web Apps URL(s)

### Static Web Apps settings
- Environment variables if needed for runtime config
- Ensure API base URL points to the deployed API (or use SWA proxies if you co-locate).

## Dev/Demo vs Production

### Dev/Demo (fast + cheap)
- Single environment, single resource group
- App Service small/free SKU if available
- Azure SQL lowest tier
- GitHub secrets for deployment + connection strings

### Production (recommended hardening)
- Separate resource groups for `dev` and `prod`
- Key Vault for secrets
- Managed identity for API → Key Vault/other resources
- App Insights alerts + dashboards
- Backups and a clear migration strategy

## Step-by-step (human execution)

1) Create Azure resources (portal or `az` CLI)
- Resource group
- Static Web App
- App Service plan + Web App
- Azure SQL Server + Database

2) Configure App Service
- Set connection string + app settings
- Enable Application Insights

3) Configure CORS in API
- Allow Static Web Apps origin

4) Set GitHub repo secrets
- SWA deploy token
- Web app publish profile (or OIDC credentials)

5) Add/enable GitHub Actions workflows
- One for Angular
- One for .NET API

6) Validate
- Frontend loads
- Auth works
- API health endpoint responds
- Database migrations applied and basic CRUD works

## Next decision needed
- Do you want **Azure Developer CLI (`azd`)** to manage infra (IaC), or keep it manual + GitHub Actions only?
  - `azd` is recommended once we stabilize the resource set.
