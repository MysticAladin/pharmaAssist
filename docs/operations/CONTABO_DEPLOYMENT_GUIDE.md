# PharmaAssist - Contabo Deployment Guide

## 📋 Table of Contents

1. [Server Specifications](#server-specifications)
2. [Initial Server Setup](#initial-server-setup)
3. [Software Installation](#software-installation)
4. [Database Setup](#database-setup)
5. [Application Deployment](#application-deployment)
6. [LLM Setup (Qwen 7B)](#llm-setup-qwen-7b)
7. [Nginx Configuration](#nginx-configuration)
8. [SSL Certificates](#ssl-certificates)
9. [Systemd Services](#systemd-services)
10. [CI/CD Pipelines](#cicd-pipelines)
11. [Monitoring & Maintenance](#monitoring--maintenance)
12. [Troubleshooting](#troubleshooting)

---

## 🔧 Configuration Placeholders

Replace these placeholders throughout the guide:

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{{SERVER_IP}}` | Contabo server IP address | `185.xxx.xxx.xxx` |
| `{{DOMAIN}}` | Your domain name | `pharmaassist.example.com` |
| `{{API_DOMAIN}}` | API subdomain | `api.pharmaassist.example.com` |
| `{{DB_PASSWORD}}` | SQL Server SA password | `YourStr0ngP@ssw0rd!` |
| `{{SSH_USER}}` | SSH username | `root` or custom user |
| `{{SSH_KEY_PATH}}` | Path to SSH private key | `~/.ssh/contabo_key` |
| `{{GITHUB_REPO}}` | GitHub repository | `username/PharmaAssist` |
| `{{HANGFIRE_ADMIN_USER}}` | Hangfire dashboard username | `admin` |
| `{{HANGFIRE_ADMIN_PASSWORD}}` | Hangfire dashboard password | `SecureHangfirePass!` |
| `{{GENERATE_256_BIT_KEY}}` | JWT signing key (256-bit) | Use `openssl rand -base64 32` |

---

## 🖥️ Server Specifications

### Recommended: Contabo Dedicated Server - AMD Ryzen 12 cores

| Spec | Value |
|------|-------|
| **Price** | €86/month (~$93) |
| **CPU** | 12x 3.70 GHz AMD Ryzen 9 7900 |
| **RAM** | 64 GB DDR5 |
| **Storage** | 1 TB NVMe SSD |
| **Bandwidth** | 32 TB/month |
| **OS** | Ubuntu 24.04 LTS |

### Resource Allocation

| Component | CPU | RAM | Storage | Notes |
|-----------|-----|-----|---------|-------|
| Angular Frontend (Nginx) | 1 core | 512 MB | 500 MB | Static files |
| .NET 8 API + Hangfire | 2 cores | 2 GB | 1 GB | Includes scheduler |
| SQL Server Express | 2 cores | 4 GB | 20 GB | + Hangfire tables |
| Qwen 7B LLM | 6 cores | 16 GB | 10 GB | llama.cpp server |
| **Reserved/OS** | 1 core | ~41 GB | ~968 GB | Buffer + OS |

> **Note**: Hangfire runs in-process with the API, using the same SQL Server database for job persistence. No separate service needed.

---

## 🚀 Initial Server Setup

### 1. Connect to Server

```bash
ssh {{SSH_USER}}@{{SERVER_IP}}
```

### 2. Update System

```bash
apt update && apt upgrade -y
apt install -y curl wget git unzip htop nano ufw fail2ban
```

### 3. Create Application User

```bash
# Create dedicated user for the application
useradd -m -s /bin/bash pharmaassist
usermod -aG sudo pharmaassist

# Set password
passwd pharmaassist

# Create application directories
mkdir -p /var/www/pharmaassist/{frontend,api,llm}
chown -R pharmaassist:pharmaassist /var/www/pharmaassist
```

### 4. Configure Firewall

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 5. Configure Fail2Ban

```bash
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
systemctl enable fail2ban
systemctl start fail2ban
```

### 6. Set Timezone

```bash
timedatectl set-timezone Europe/Sarajevo
```

---

## 📦 Software Installation

### 1. Install Nginx

```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

### 2. Install .NET 8 Runtime

```bash
# Add Microsoft package repository
wget https://packages.microsoft.com/config/ubuntu/24.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
dpkg -i packages-microsoft-prod.deb
rm packages-microsoft-prod.deb

# Install .NET 8
apt update
apt install -y dotnet-sdk-8.0 aspnetcore-runtime-8.0
```

### 3. Install SQL Server 2022 Express

```bash
# Import Microsoft GPG key
curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add -

# Add SQL Server repository
add-apt-repository "$(wget -qO- https://packages.microsoft.com/config/ubuntu/22.04/mssql-server-2022.list)"

# Install SQL Server
apt update
apt install -y mssql-server

# Configure SQL Server
/opt/mssql/bin/mssql-conf setup
# Choose: Express Edition (free)
# Set SA password: {{DB_PASSWORD}}
# Accept license terms

# Verify installation
systemctl status mssql-server

# Install SQL Server tools
apt install -y mssql-tools18 unixodbc-dev
echo 'export PATH="$PATH:/opt/mssql-tools18/bin"' >> ~/.bashrc
source ~/.bashrc
```

### 4. Install Node.js (for build tools if needed)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

### 5. Install Build Tools for llama.cpp

```bash
apt install -y build-essential cmake libopenblas-dev
```

---

## 🗄️ Database Setup

### 1. Create Database and User

```bash
sqlcmd -S localhost -U SA -P '{{DB_PASSWORD}}' -C
```

```sql
-- Create database
CREATE DATABASE PharmaAssist;
GO

-- Create application login
CREATE LOGIN pharmaassist_app WITH PASSWORD = '{{DB_PASSWORD}}';
GO

USE PharmaAssist;
GO

-- Create user and grant permissions
CREATE USER pharmaassist_app FOR LOGIN pharmaassist_app;
ALTER ROLE db_owner ADD MEMBER pharmaassist_app;
GO

EXIT
```

### 2. Run Migrations

```bash
cd /var/www/pharmaassist/api

# Run EF Core migrations (from deployment package)
dotnet ef database update --connection "Server=localhost;Database=PharmaAssist;User Id=pharmaassist_app;Password={{DB_PASSWORD}};TrustServerCertificate=True"
```

### 3. Seed Initial Data

```bash
# Copy seed scripts to server and run
sqlcmd -S localhost -U SA -P '{{DB_PASSWORD}}' -d PharmaAssist -i SeedData_00_Master.sql -C
```

---

## 🌐 Application Deployment

### 1. Frontend Deployment Structure

```
/var/www/pharmaassist/frontend/
├── browser/
│   ├── index.html
│   ├── main.js
│   ├── polyfills.js
│   ├── styles.css
│   └── assets/
└── ...
```

### 2. API Deployment Structure

```
/var/www/pharmaassist/api/
├── Api.dll
├── Api.deps.json
├── Api.runtimeconfig.json
├── appsettings.json
├── appsettings.Production.json
└── ...
```

### 3. Create Production appsettings

```bash
nano /var/www/pharmaassist/api/appsettings.Production.json
```

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=PharmaAssist;User Id=pharmaassist_app;Password={{DB_PASSWORD}};TrustServerCertificate=True"
  },
  "Jwt": {
    "Key": "{{GENERATE_256_BIT_KEY}}",
    "Issuer": "{{API_DOMAIN}}",
    "Audience": "{{DOMAIN}}"
  },
  "Cors": {
    "AllowedOrigins": ["https://{{DOMAIN}}"]
  },
  "LlmService": {
    "BaseUrl": "http://localhost:8080",
    "Model": "qwen2.5-7b",
    "TimeoutSeconds": 60
  },
  "Hangfire": {
    "Dashboard": {
      "Username": "{{HANGFIRE_ADMIN_USER}}",
      "Password": "{{HANGFIRE_ADMIN_PASSWORD}}"
    }
  },
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft.AspNetCore": "Warning",
      "Hangfire": "Information"
    }
  }
}
```

---

## ⏰ Hangfire Scheduler

Hangfire runs as part of the .NET API and handles background jobs:

### Configured Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| `weekly-manager-reports` | Monday 7:30 AM | Weekly sales reports for managers |

### Job Queues

- `default` - General background tasks
- `emails` - Email notifications
- `reports` - Report generation

### Dashboard Access

The Hangfire dashboard is available at `https://{{API_DOMAIN}}/hangfire`

**Production Security**: The dashboard requires authentication. Update `HangfireAuthorizationFilter.cs` to use proper authentication:

```csharp
// In Api/Filters/HangfireAuthorizationFilter.cs
public class HangfireAuthorizationFilter : IDashboardAuthorizationFilter
{
    private readonly IWebHostEnvironment _environment;

    public HangfireAuthorizationFilter(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public bool Authorize(DashboardContext context)
    {
        // In development, allow all
        if (_environment.IsDevelopment())
            return true;

        // In production, require authentication
        var httpContext = context.GetHttpContext();
        
        // Option 1: Check if user is authenticated and has Admin role
        return httpContext.User.Identity?.IsAuthenticated == true 
            && httpContext.User.IsInRole("Admin");
        
        // Option 2: Basic Auth (if not using cookie auth)
        // Implement Basic Auth header check here
    }
}
```

### Monitoring Jobs

```bash
# View Hangfire-specific logs
journalctl -u pharmaassist-api | grep -i hangfire

# Check job status in database
sqlcmd -S localhost -U SA -P '{{DB_PASSWORD}}' -d PharmaAssist -C -Q "
SELECT TOP 10 
    Id, StateName, CreatedAt, 
    JSON_VALUE(InvocationData, '$.Type') as JobType
FROM HangFire.Job 
ORDER BY CreatedAt DESC"

# Check scheduled/recurring jobs
sqlcmd -S localhost -U SA -P '{{DB_PASSWORD}}' -d PharmaAssist -C -Q "
SELECT * FROM HangFire.[Set] WHERE [Key] LIKE 'recurring-job%'"
```

### Manual Job Execution

If you need to trigger a job manually:

```bash
# Via curl to API endpoint (if you create one)
curl -X POST https://{{API_DOMAIN}}/api/admin/jobs/weekly-manager-reports/trigger \
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"

# Or directly via Hangfire dashboard at https://{{API_DOMAIN}}/hangfire
```

### Hangfire Database Tables

Hangfire creates these tables in the `HangFire` schema:

- `HangFire.Job` - Job definitions and state
- `HangFire.State` - Job state history
- `HangFire.JobQueue` - Queued jobs
- `HangFire.Server` - Active Hangfire servers
- `HangFire.Set` - Recurring jobs configuration
- `HangFire.Hash` - Job parameters and metadata
- `HangFire.Counter` - Statistics counters
- `HangFire.AggregatedCounter` - Aggregated statistics

---

## 🤖 LLM Setup (Qwen 7B)

### 1. Clone and Build llama.cpp

```bash
cd /var/www/pharmaassist/llm

git clone https://github.com/ggml-org/llama.cpp.git
cd llama.cpp

# Build with OpenBLAS for better CPU performance
cmake -B build -DGGML_BLAS=ON -DGGML_BLAS_VENDOR=OpenBLAS
cmake --build build --config Release -j$(nproc)
```

### 2. Download Qwen Model

```bash
pip3 install huggingface_hub

# Download Q4_K_M quantized model (best quality/speed balance)
huggingface-cli download Qwen/Qwen2.5-7B-Instruct-GGUF \
  --include "qwen2.5-7b-instruct-q4_k_m*.gguf" \
  --local-dir /var/www/pharmaassist/llm/models \
  --local-dir-use-symlinks False

# Merge split files if needed
cd /var/www/pharmaassist/llm/llama.cpp
./build/bin/llama-gguf-split --merge \
  /var/www/pharmaassist/llm/models/qwen2.5-7b-instruct-q4_k_m-00001-of-00002.gguf \
  /var/www/pharmaassist/llm/models/qwen2.5-7b-instruct-q4_k_m.gguf
```

### 3. Test LLM Server

```bash
./build/bin/llama-server \
  -m /var/www/pharmaassist/llm/models/qwen2.5-7b-instruct-q4_k_m.gguf \
  --host 127.0.0.1 \
  --port 8080 \
  -c 4096 \
  -t 8 \
  --log-disable

# Test with curl
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5-7b",
    "messages": [{"role": "user", "content": "List 3 products from Hemofarm"}],
    "max_tokens": 200
  }'
```

---

## 🔒 Nginx Configuration

### 1. Create Main Site Configuration

```bash
nano /etc/nginx/sites-available/pharmaassist
```

```nginx
# Frontend - Angular Application
server {
    listen 80;
    server_name {{DOMAIN}} www.{{DOMAIN}};
    
    # Redirect to HTTPS (uncomment after SSL setup)
    # return 301 https://$server_name$request_uri;
    
    root /var/www/pharmaassist/frontend/browser;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;
    
    # Angular routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}

# API - .NET Application
server {
    listen 80;
    server_name {{API_DOMAIN}};
    
    # Redirect to HTTPS (uncomment after SSL setup)
    # return 301 https://$server_name$request_uri;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings for long-running requests (LLM calls)
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

### 2. Enable Site

```bash
ln -s /etc/nginx/sites-available/pharmaassist /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

---

## 🔐 SSL Certificates

### Install Certbot and Get Certificates

```bash
apt install -y certbot python3-certbot-nginx

# Get certificates for both domains
certbot --nginx -d {{DOMAIN}} -d www.{{DOMAIN}} -d {{API_DOMAIN}}

# Auto-renewal is set up automatically
# Test renewal
certbot renew --dry-run
```

---

## ⚙️ Systemd Services

### 1. API Service

```bash
nano /etc/systemd/system/pharmaassist-api.service
```

```ini
[Unit]
Description=PharmaAssist .NET API
After=network.target mssql-server.service

[Service]
Type=notify
User=pharmaassist
Group=pharmaassist
WorkingDirectory=/var/www/pharmaassist/api
ExecStart=/usr/bin/dotnet /var/www/pharmaassist/api/Api.dll
Restart=always
RestartSec=10
KillSignal=SIGINT
SyslogIdentifier=pharmaassist-api
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://localhost:5000
Environment=DOTNET_PRINT_TELEMETRY_MESSAGE=false

[Install]
WantedBy=multi-user.target
```

### 2. LLM Service

```bash
nano /etc/systemd/system/pharmaassist-llm.service
```

```ini
[Unit]
Description=PharmaAssist LLM Server (Qwen 7B)
After=network.target

[Service]
Type=simple
User=pharmaassist
Group=pharmaassist
WorkingDirectory=/var/www/pharmaassist/llm/llama.cpp
ExecStart=/var/www/pharmaassist/llm/llama.cpp/build/bin/llama-server \
    -m /var/www/pharmaassist/llm/models/qwen2.5-7b-instruct-q4_k_m.gguf \
    --host 127.0.0.1 \
    --port 8080 \
    -c 4096 \
    -t 8 \
    --log-disable
Restart=always
RestartSec=30
KillSignal=SIGTERM
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
```

### 3. Enable and Start Services

```bash
systemctl daemon-reload

# Enable services
systemctl enable pharmaassist-api
systemctl enable pharmaassist-llm

# Start services
systemctl start pharmaassist-llm
systemctl start pharmaassist-api

# Check status
systemctl status pharmaassist-api
systemctl status pharmaassist-llm
```

---

## 🔄 CI/CD Pipelines

### GitHub Actions - Frontend Deployment

Create `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy Frontend to Contabo

on:
  push:
    branches: [main]
    paths:
      - 'client/pharma-assist/**'
  workflow_dispatch:

env:
  NODE_VERSION: '20.x'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: client/pharma-assist/package-lock.json
      
      - name: Install dependencies
        working-directory: client/pharma-assist
        run: npm ci
      
      - name: Build Angular app
        working-directory: client/pharma-assist
        run: npm run build -- --configuration=production
        env:
          NODE_OPTIONS: --max_old_space_size=4096
      
      - name: Deploy to Contabo
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.CONTABO_HOST }}
          username: ${{ secrets.CONTABO_USER }}
          key: ${{ secrets.CONTABO_SSH_KEY }}
          source: "client/pharma-assist/dist/pharma-assist/browser/*"
          target: "/var/www/pharmaassist/frontend/"
          strip_components: 5
      
      - name: Restart Nginx
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.CONTABO_HOST }}
          username: ${{ secrets.CONTABO_USER }}
          key: ${{ secrets.CONTABO_SSH_KEY }}
          script: |
            sudo systemctl reload nginx
            echo "Frontend deployed successfully!"
```

### GitHub Actions - Backend Deployment

Create `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend to Contabo

on:
  push:
    branches: [main]
    paths:
      - 'server/**'
  workflow_dispatch:

env:
  DOTNET_VERSION: '8.0.x'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: ${{ env.DOTNET_VERSION }}
      
      - name: Restore dependencies
        working-directory: server
        run: dotnet restore
      
      - name: Build
        working-directory: server
        run: dotnet build --configuration Release --no-restore
      
      - name: Run tests
        working-directory: server
        run: dotnet test --configuration Release --no-build --verbosity normal
      
      - name: Publish
        working-directory: server/src/Api
        run: dotnet publish -c Release -o ./publish --no-restore
      
      - name: Create deployment package
        run: |
          cd server/src/Api/publish
          tar -czvf ../../../../api-package.tar.gz .
      
      - name: Deploy to Contabo
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.CONTABO_HOST }}
          username: ${{ secrets.CONTABO_USER }}
          key: ${{ secrets.CONTABO_SSH_KEY }}
          source: "api-package.tar.gz"
          target: "/tmp/"
      
      - name: Extract and restart API
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.CONTABO_HOST }}
          username: ${{ secrets.CONTABO_USER }}
          key: ${{ secrets.CONTABO_SSH_KEY }}
          script: |
            # Stop API service
            sudo systemctl stop pharmaassist-api
            
            # Backup current deployment
            if [ -d "/var/www/pharmaassist/api" ]; then
              sudo mv /var/www/pharmaassist/api /var/www/pharmaassist/api.backup.$(date +%Y%m%d%H%M%S)
            fi
            
            # Extract new deployment
            sudo mkdir -p /var/www/pharmaassist/api
            sudo tar -xzvf /tmp/api-package.tar.gz -C /var/www/pharmaassist/api
            
            # Copy production settings (preserved on server)
            sudo cp /var/www/pharmaassist/config/appsettings.Production.json /var/www/pharmaassist/api/
            
            # Set permissions
            sudo chown -R pharmaassist:pharmaassist /var/www/pharmaassist/api
            
            # Start API service
            sudo systemctl start pharmaassist-api
            
            # Cleanup
            rm /tmp/api-package.tar.gz
            
            # Keep only last 3 backups
            cd /var/www/pharmaassist
            ls -dt api.backup.* 2>/dev/null | tail -n +4 | xargs -r sudo rm -rf
            
            echo "Backend deployed successfully!"
      
      - name: Health check
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.CONTABO_HOST }}
          username: ${{ secrets.CONTABO_USER }}
          key: ${{ secrets.CONTABO_SSH_KEY }}
          script: |
            sleep 10
            curl -f http://localhost:5000/health || exit 1
            echo "Health check passed!"
```

### GitHub Actions - Database Migration

Create `.github/workflows/deploy-migrations.yml`:

```yaml
name: Run Database Migrations

on:
  workflow_dispatch:
    inputs:
      confirm:
        description: 'Type "migrate" to confirm'
        required: true

jobs:
  migrate:
    runs-on: ubuntu-latest
    if: github.event.inputs.confirm == 'migrate'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'
      
      - name: Install EF Core tools
        run: dotnet tool install --global dotnet-ef
      
      - name: Generate migration script
        working-directory: server
        run: |
          dotnet ef migrations script \
            --idempotent \
            --project src/Infrastructure \
            --startup-project src/Api \
            --output ./migration.sql
      
      - name: Copy migration script
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.CONTABO_HOST }}
          username: ${{ secrets.CONTABO_USER }}
          key: ${{ secrets.CONTABO_SSH_KEY }}
          source: "server/migration.sql"
          target: "/tmp/"
          strip_components: 1
      
      - name: Apply migrations
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.CONTABO_HOST }}
          username: ${{ secrets.CONTABO_USER }}
          key: ${{ secrets.CONTABO_SSH_KEY }}
          script: |
            /opt/mssql-tools18/bin/sqlcmd \
              -S localhost \
              -U SA \
              -P "${{ secrets.DB_SA_PASSWORD }}" \
              -d PharmaAssist \
              -i /tmp/migration.sql \
              -C
            
            rm /tmp/migration.sql
            echo "Migrations applied successfully!"
```

### GitHub Secrets Required

Add these secrets to your GitHub repository:

| Secret Name | Description |
|-------------|-------------|
| `CONTABO_HOST` | Server IP address ({{SERVER_IP}}) |
| `CONTABO_USER` | SSH username (pharmaassist or root) |
| `CONTABO_SSH_KEY` | Private SSH key content |
| `DB_SA_PASSWORD` | SQL Server SA password |

---

## 📊 Monitoring & Maintenance

### 1. View Logs

```bash
# API logs
journalctl -u pharmaassist-api -f

# LLM logs
journalctl -u pharmaassist-llm -f

# Nginx access logs
tail -f /var/log/nginx/access.log

# Nginx error logs
tail -f /var/log/nginx/error.log
```

### 2. System Monitoring Script

```bash
nano /usr/local/bin/pharmaassist-status.sh
```

```bash
#!/bin/bash

echo "=========================================="
echo "PharmaAssist System Status"
echo "=========================================="
echo ""

echo "🖥️  System Resources:"
echo "--------------------"
echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')%"
echo "Memory: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
echo "Disk: $(df -h / | awk 'NR==2 {print $3 "/" $2 " (" $5 " used)"}')"
echo ""

echo "🔧 Services Status:"
echo "-------------------"
systemctl is-active pharmaassist-api >/dev/null && echo "✅ API + Hangfire: Running" || echo "❌ API + Hangfire: Stopped"
systemctl is-active pharmaassist-llm >/dev/null && echo "✅ LLM: Running" || echo "❌ LLM: Stopped"
systemctl is-active nginx >/dev/null && echo "✅ Nginx: Running" || echo "❌ Nginx: Stopped"
systemctl is-active mssql-server >/dev/null && echo "✅ SQL Server: Running" || echo "❌ SQL Server: Stopped"
echo ""

echo "🌐 Health Checks:"
echo "-----------------"
curl -s -o /dev/null -w "API: %{http_code}\n" http://localhost:5000/health 2>/dev/null || echo "API: Unreachable"
curl -s -o /dev/null -w "LLM: %{http_code}\n" http://localhost:8080/health 2>/dev/null || echo "LLM: Unreachable"
echo ""

echo "⏰ Hangfire Status:"
echo "-------------------"
# Check for active Hangfire servers
HANGFIRE_SERVERS=$(/opt/mssql-tools18/bin/sqlcmd -S localhost -U SA -P '{{DB_PASSWORD}}' -d PharmaAssist -h -1 -W -C -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM HangFire.Server WHERE LastHeartbeat > DATEADD(MINUTE, -5, GETUTCDATE())" 2>/dev/null | tr -d '[:space:]')
echo "Active Servers: ${HANGFIRE_SERVERS:-0}"

# Check pending jobs
PENDING_JOBS=$(/opt/mssql-tools18/bin/sqlcmd -S localhost -U SA -P '{{DB_PASSWORD}}' -d PharmaAssist -h -1 -W -C -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM HangFire.Job WHERE StateName IN ('Enqueued', 'Scheduled', 'Processing')" 2>/dev/null | tr -d '[:space:]')
echo "Pending Jobs: ${PENDING_JOBS:-0}"

# Check failed jobs (last 24h)
FAILED_JOBS=$(/opt/mssql-tools18/bin/sqlcmd -S localhost -U SA -P '{{DB_PASSWORD}}' -d PharmaAssist -h -1 -W -C -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM HangFire.Job WHERE StateName = 'Failed' AND CreatedAt > DATEADD(DAY, -1, GETUTCDATE())" 2>/dev/null | tr -d '[:space:]')
echo "Failed (24h): ${FAILED_JOBS:-0}"
echo ""

echo "📈 LLM Performance (last request):"
echo "-----------------------------------"
journalctl -u pharmaassist-llm --no-pager -n 5 | grep -E "tokens|speed" || echo "No recent requests"
echo ""
```

```bash
chmod +x /usr/local/bin/pharmaassist-status.sh
```

### 3. Automated Backups

```bash
nano /usr/local/bin/pharmaassist-backup.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/pharmaassist"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

mkdir -p $BACKUP_DIR

# Database backup
echo "Backing up database..."
/opt/mssql-tools18/bin/sqlcmd -S localhost -U SA -P '{{DB_PASSWORD}}' -Q "BACKUP DATABASE PharmaAssist TO DISK='$BACKUP_DIR/db_$DATE.bak'" -C

# Compress backup
gzip $BACKUP_DIR/db_$DATE.bak

# Remove old backups
find $BACKUP_DIR -name "*.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $BACKUP_DIR/db_$DATE.bak.gz"
```

```bash
chmod +x /usr/local/bin/pharmaassist-backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /usr/local/bin/pharmaassist-backup.sh >> /var/log/pharmaassist-backup.log 2>&1
```

---

## 🔍 Troubleshooting

### API Not Starting

```bash
# Check logs
journalctl -u pharmaassist-api -n 50

# Common issues:
# 1. Connection string wrong - check appsettings.Production.json
# 2. Port 5000 in use - check with: lsof -i :5000
# 3. Permissions - ensure pharmaassist user owns files
```

### LLM Slow or Not Responding

```bash
# Check if model is loaded
curl http://localhost:8080/health

# Check RAM usage (model needs ~8GB)
free -h

# Check CPU usage during inference
htop

# Restart with more threads if needed
# Edit /etc/systemd/system/pharmaassist-llm.service
# Change -t 8 to -t 10 or -t 12
```

### Database Connection Failed

```bash
# Check SQL Server status
systemctl status mssql-server

# Test connection
sqlcmd -S localhost -U SA -P '{{DB_PASSWORD}}' -Q "SELECT 1" -C

# Check logs
cat /var/opt/mssql/log/errorlog
```

### SSL Certificate Renewal Issues

```bash
# Test renewal
certbot renew --dry-run

# Force renewal
certbot renew --force-renewal

# Check certificate expiry
certbot certificates
```

---

## 📋 Quick Commands Reference

```bash
# Start all services
sudo systemctl start pharmaassist-api pharmaassist-llm nginx mssql-server

# Stop all services
sudo systemctl stop pharmaassist-api pharmaassist-llm

# Restart API after code changes
sudo systemctl restart pharmaassist-api

# Reload Nginx after config changes
sudo systemctl reload nginx

# View real-time logs
journalctl -u pharmaassist-api -f

# Check system status
/usr/local/bin/pharmaassist-status.sh

# Manual database backup
/usr/local/bin/pharmaassist-backup.sh
```

---

## 📞 Contabo Support

- **Control Panel**: https://my.contabo.com
- **Support**: support@contabo.com
- **Status Page**: https://contabo-status.com

---

*Last Updated: February 2026*
