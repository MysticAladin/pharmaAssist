# Deployment

## CI/CD Pipeline

### GitHub Actions Workflows

Located in `.github/workflows/`:

| Workflow | Trigger | What It Does |
|----------|---------|-------------|
| `deploy-frontend.yml` | Manual | Build Angular → Deploy to Azure Static Web Apps |
| `deploy-backend.yml` | Manual | Build .NET → Deploy to Azure App Service |
| `deploy-database.yml` | Manual | Run EF Core migrations against Azure SQL |
| `deploy-full.yml` | Manual | Orchestrated: Build both → Run tests → Deploy all |

All workflows use `workflow_dispatch` (manual trigger) with configurable options.

### Full Deployment Workflow (`deploy-full.yml`)

Options:
- `deploy_frontend` (boolean) — Deploy Angular frontend
- `deploy_backend` (boolean) — Deploy .NET backend
- `run_migrations` (boolean) — Run database migrations

Steps:
1. **Build Frontend** — `npm ci` → `npm run build --configuration=production`
2. **Build Backend** — `dotnet restore` → `dotnet build` → `dotnet test` → `dotnet publish`
3. **Deploy Frontend** — Upload to Azure Static Web Apps
4. **Deploy Backend** — Upload to Azure App Service
5. **Run Migrations** — Apply EF Core migrations (if selected)

### Build Requirements

| Component | Runtime | Version |
|-----------|---------|---------|
| Frontend | Node.js | 20.x |
| Backend | .NET SDK | 8.0.x (CI) / 10.0 (local dev) |

> **Note:** CI uses .NET 8.0.x in workflows but the project targets `net10.0`. This may need updating.

---

## Azure Hosting (Primary)

### Resources

| Resource | Type | Location |
|----------|------|----------|
| SQL Server | Azure SQL Server | Germany West Central |
| SQL Database | Azure SQL Database (S0, 10 DTU) | Germany West Central |
| API Backend | Azure App Service | West Europe |
| Frontend | Azure Static Web Apps | — |

### Azure App Service Configuration

| Setting | Value |
|---------|-------|
| Runtime | .NET 10 |
| API URL | `https://pharma-assist-api-*.westeurope-01.azurewebsites.net` |
| SCM URL | `https://pharma-assist-api-*.scm.westeurope-01.azurewebsites.net` |

### Connection String (Production)

```
Server=tcp:codian-tech-sql-server.database.windows.net,1433;
Initial Catalog=PharmaAssist;
Encrypt=True;TrustServerCertificate=False;
```

### Azure Deployment Commands

```bash
# Deploy backend
az webapp deploy --resource-group sp-pharma-assist_group \
  --name pharma-assist-api \
  --src-path ./publish.zip --type zip

# Deploy frontend (via SWA CLI)
swa deploy ./dist/pharma-assist/browser \
  --deployment-token $SWA_TOKEN
```

---

## Contabo Hosting (Alternative)

An alternative deployment on a Contabo dedicated server is documented in `docs/CONTABO_DEPLOYMENT_GUIDE.md`.

### Architecture

```
Internet → Nginx (reverse proxy, SSL) → .NET Kestrel (localhost:5000)
                                       → Angular static files
```

### Key Configuration

- **Nginx** — Reverse proxy at port 443 (SSL) → Kestrel at localhost:5000
- **SSL** — Let's Encrypt certificates via Certbot
- **Service management** — systemd unit file for .NET app
- **Database** — SQL Server on the same server or Azure SQL

### systemd Service

```ini
[Unit]
Description=PharmaAssist API
After=network.target

[Service]
WorkingDirectory=/var/www/pharma-assist/api
ExecStart=/usr/bin/dotnet PharmaAssist.Api.dll
Restart=always
RestartSec=10
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://localhost:5000

[Install]
WantedBy=multi-user.target
```

---

## Application Startup

### Server Startup (`Program.cs`)

On startup, the backend automatically:
1. Applies pending EF Core migrations
2. Seeds initial data (admin user, BiH geography, demo data)
3. Configures Hangfire dashboard and recurring jobs
4. Starts Serilog logging (Console + File)
5. Enables Swagger in development mode
6. Configures CORS, JWT auth, static files

### Environment Configuration

| Setting | Development | Production |
|---------|------------|------------|
| Database | `Server=.;Database=PharmaAssist` | Azure SQL connection string |
| CORS | `http://localhost:4200` | Production frontend URL |
| Swagger | Enabled | Should be disabled or restricted |
| HTTPS | Optional | Required |
| Logging | Console + File | Console + File (+ optionally App Insights) |
| Hangfire Dashboard | Open | Restrict to Admin roles |

### Configuration Files

| File | Purpose |
|------|---------|
| `appsettings.json` | Base configuration (connection strings, JWT, SMTP, etc.) |
| `appsettings.Development.json` | Dev overrides |
| `appsettings.Production.json` | Production overrides (secrets via env vars) |

---

## Database Migrations

### Local Development

```bash
cd server

# Add new migration
dotnet ef migrations add MigrationName \
  --project src/Infrastructure \
  --startup-project src/Api

# Apply migrations
dotnet ef database update \
  --project src/Infrastructure \
  --startup-project src/Api

# Generate SQL script (for manual review)
dotnet ef migrations script \
  --project src/Infrastructure \
  --startup-project src/Api
```

### Production

Migrations are auto-applied on startup (`Program.cs` calls `context.Database.MigrateAsync()`). For manual control, use the `deploy-database.yml` GitHub Actions workflow.

---

## Build Commands

### Frontend

```bash
cd client/pharma-assist

# Install dependencies
npm ci

# Development server
ng serve                    # http://localhost:4200

# Production build
ng build --configuration=production

# Run tests
ng test
```

### Backend

```bash
cd server

# Restore + Build
dotnet restore
dotnet build

# Run locally
cd src/Api
dotnet run                  # http://localhost:5000 + https://localhost:5001

# Run tests
dotnet test

# Publish for deployment
cd src/Api
dotnet publish -c Release -o ./publish
```
