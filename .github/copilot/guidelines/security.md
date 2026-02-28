# Security

## Authentication

### JWT Bearer Token Authentication

- **Implementation:** ASP.NET Core JWT Bearer middleware
- **Token type:** JSON Web Token (JWT)
- **Signing algorithm:** HMAC-SHA256
- **Access token lifetime:** 60 minutes
- **Refresh token lifetime:** 7 days
- **Issuer:** `PharmaAssist`
- **Audience:** `PharmaAssistClient`

### Token Flow

1. User authenticates via `POST /api/auth/login` with email + password
2. Server returns JWT access token + refresh token
3. Client stores tokens and sends access token in `Authorization: Bearer <token>` header
4. When access token expires, client calls `POST /api/auth/refresh-token` with both tokens
5. Server validates refresh token, issues new token pair
6. On logout, refresh token is revoked server-side

### Password Security

- Passwords hashed with BCrypt.Net
- ASP.NET Identity handles password complexity rules
- Password reset via email with time-limited tokens
- Email verification required for new accounts

---

## Authorization

### Role-Based Access Control (RBAC)

7 built-in roles with hierarchical permissions:

| Role | Level | Access Scope |
|------|-------|-------------|
| SuperAdmin | Full | All modules, system settings, user management |
| Admin | High | All modules except system settings |
| Manager | Medium-High | Inventory, orders, reports, staff oversight, visit plan approval |
| Pharmacist | Medium | Prescriptions, dispensing, patient counseling, read-only on orders |
| SalesRep | Medium | Customers (own), orders (own), visits, limited inventory view |
| Warehouse | Medium-Low | Inventory (full), stock movements, receiving, read-only orders |
| Customer | Low | Portal only: shopping, own orders, prescriptions, account |

### Permission-Based Access Control

Fine-grained permissions are assigned to roles via `RolePermission` entities:

```csharp
// Controller level
[Authorize(Roles = "Admin,SuperAdmin")]

// Or with custom permission attribute
[HasPermission("orders.create")]
[HasPermission("inventory.adjust")]
```

### Route Guards (Frontend)

| Guard | Purpose |
|-------|---------|
| `authGuard` | Checks JWT token validity, redirects to login if expired |
| `adminGuard` | Requires Admin or SuperAdmin role |
| `roleGuard` | Checks for specific role(s) passed as route data |
| `featureGuard` | Checks if feature flag is enabled before allowing access |
| `customerGuard` | Restricts to Customer role (portal routes) |
| `staffGuard` | Restricts to non-Customer roles (admin routes) |

### Sidebar Navigation

The sidebar dynamically shows/hides menu items based on user role. Customer users see only portal navigation.

---

## Data Protection

### CORS Configuration

```csharp
// Configured in Program.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.WithOrigins("http://localhost:4200")  // Dev
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
```

Production CORS origins must be updated for the deployed frontend URL.

### File Upload Security

- Maximum file size: 10MB
- Allowed image extensions: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- Allowed document extensions: `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`
- Files stored on server filesystem (not in database)
- File paths are sanitized to prevent path traversal

### SQL Injection Prevention

- Entity Framework Core parameterized queries (default protection)
- No raw SQL strings in application code
- FluentValidation for input sanitization

### XSS Prevention

- Angular's built-in template sanitization
- Server-side response encoding

---

## Audit Trail

### Audit Logging

All significant business operations are logged in the `AuditLog` table:

| Field | Description |
|-------|-------------|
| `EntityName` | The entity being modified (e.g., "Order", "Product") |
| `EntityId` | The primary key of the modified entity |
| `Action` | Create, Update, Delete |
| `OldValues` | JSON of previous values (for updates) |
| `NewValues` | JSON of new values |
| `UserId` | Who performed the action |
| `Timestamp` | When it occurred |
| `IpAddress` | Client IP address |

### Audit Log Access

- Viewable via Admin → Audit Logs in the UI
- Filterable by entity, user, action, date range
- API: `GET /api/audit`
- Restricted to Admin and SuperAdmin roles

---

## Feature Flags as Security Controls

Feature flags can control access to experimental or restricted features:

- **System flags** — Global on/off for entire features
- **Client flags** — Per-pharmacy overrides (enable beta features for select customers)
- Flag changes are tracked in `FeatureFlagHistory` with who/when/what

---

## Sensitive Data Handling

### Credentials in Repository

> **WARNING:** `docs/azure/credentials.md` contains Azure SQL Server credentials. This file should NOT be in a public repository.

### Environment-Specific Configuration

| Setting | Dev (appsettings.json) | Production |
|---------|----------------------|------------|
| DB Connection | `Server=.;Database=PharmaAssist` | Azure SQL Server connection string |
| JWT Secret | In config file | Environment variable / Azure Key Vault |
| SMTP Password | In config file | Environment variable / Azure Key Vault |
| CORS Origins | `localhost:4200` | Production frontend URL |

### Recommendations

- Move secrets to Azure Key Vault or environment variables in production
- Remove `docs/azure/credentials.md` from version control (add to `.gitignore`)
- Use `appsettings.Production.json` with environment variable overrides
- Enable HTTPS-only in production
- Implement rate limiting on auth endpoints
- Add CSRF protection for cookie-based sessions (if used)
