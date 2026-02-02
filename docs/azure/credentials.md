# Azure Credentials & Connection Information

> ⚠️ **IMPORTANT**: This file contains sensitive credentials. Do NOT commit to public repositories.

## Azure Subscription

| Property | Value |
|----------|-------|
| Subscription ID | `cdb91903-49b0-47df-9ebd-009d3a39e29c` |
| Resource Group | `sp-pharma-assist_group` |

---

## SQL Server

| Property | Value |
|----------|-------|
| Server Name | `codian-tech-sql-server` |
| FQDN | `codian-tech-sql-server.database.windows.net` |
| Location | Germany West Central |
| Admin Login | `Codian` |
| Admin Password | `Tech123$` |
| Azure AD Admin | `elmir.halilcevic@hotmail.com` |

### SQL Database

| Property | Value |
|----------|-------|
| Database Name | `PharmaAssist` |
| SKU | Standard S0 (10 DTU) |
| Max Size | 250 GB |
| Collation | SQL_Latin1_General_CP1_CI_AS |

### Connection String

```
Server=tcp:codian-tech-sql-server.database.windows.net,1433;Initial Catalog=PharmaAssist;Persist Security Info=False;User ID=Codian;Password=Tech123$;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
```

---

## App Services

### API (Backend)

| Property | Value |
|----------|-------|
| Name | `pharma-assist-api` |
| URL | https://pharma-assist-api-adgfdgh8bjbafugj.westeurope-01.azurewebsites.net |
| SCM URL | https://pharma-assist-api-adgfdgh8bjbafugj.scm.westeurope-01.azurewebsites.net |
| Location | West Europe |
| SKU | Free |
| Runtime | .NET 10 (Windows) |

### Web (Frontend)

| Property | Value |
|----------|-------|
| Name | `pharma-assist-web` |
| URL | https://pharma-assist-web-bth0auf3ajg3hge8.westeurope-01.azurewebsites.net |
| SCM URL | https://pharma-assist-web-bth0auf3ajg3hge8.scm.westeurope-01.azurewebsites.net |
| Location | West Europe |
| SKU | Free |
| Runtime | Node.js 24 LTS (Linux) |

---

## Application Users

All application users use the password: `Admin@123!`

| Email | Role |
|-------|------|
| admin@pharmaassist.ba | System Administrator |
| manager.user@pharmaassist.com | Manager |
| pharmacist.user@pharmaassist.com | Pharmacist |
| salesrep.user@pharmaassist.com | SalesRep |
| warehouse.user@pharmaassist.com | Warehouse |
| customer.user@pharmaassist.com | Customer |

---

## Firewall Rules

| Rule Name | Start IP | End IP | Purpose |
|-----------|----------|--------|---------|
| AllowAzureServices | 0.0.0.0 | 0.0.0.0 | Azure services access |
| LocalDev | 92.36.218.65 | 92.36.218.65 | Local development |

---

## Deployment Commands

### API Deployment
```powershell
cd server/src/Api
dotnet publish -c Release -o ./publish
Compress-Archive -Path ./publish/* -DestinationPath ./api-deploy.zip -Force
az webapp deploy --name pharma-assist-api --resource-group sp-pharma-assist_group --src-path ./api-deploy.zip --type zip
```

### Frontend Deployment
```powershell
cd client/pharma-assist
npm run build -- --configuration production
cd dist/pharma-assist/browser
Compress-Archive -Path * -DestinationPath ../frontend-static.zip -Force
az webapp deploy --name pharma-assist-web --resource-group sp-pharma-assist_group --src-path ../frontend-static.zip --type zip --async true
```
