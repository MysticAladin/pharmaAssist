# PharmaAssist Feature Flag & Authorization System Analysis

> **Document Version:** 2.0  
> **Date:** January 2025  
> **Purpose:** Comprehensive analysis of current authentication, authorization, and feature flag systems with recommendations for a unified two-tier feature flagging architecture.

---

## 🎉 Implementation Status: COMPLETE

The following enhancements have been implemented:

### Backend Enhancements ✅

- [x] **ApplicationUser** - Added `CustomerId`, `IsSuperAdmin`, `Customer` navigation
- [x] **ApplicationRole** - Added `IsSystemRole`, `Permissions` collection
- [x] **Permission Entity** - New entity for granular permission management (Key, Name, Description, Category)
- [x] **RolePermission Entity** - Join table for Role-Permission many-to-many relationship
- [x] **EF Core Configurations** - Added for Permission and RolePermission entities
- [x] **ApplicationDbContext** - Updated with new DbSets
- [x] **TokenService** - Enhanced to include `customerId` and `permissions` in JWT claims
- [x] **AuthService** - Added `GetPermissionsForRolesAsync()` to load permissions from database
- [x] **UserDto** - Updated to include `CustomerId` and `Permissions`
- [x] **FeatureFlagsController** - SuperAdmin-only for system flag mutations, client-scoped Admin access
- [x] **New API Endpoints** - Matrix view (`/matrix`), bulk update (`/bulk`), my flags (`/my-flags`)
- [x] **New DTOs** - FeatureFlagMatrixDto, ClientFlagCellDto, BulkUpdateFlagsDto, BulkUpdateResultDto, ConfigurableFlagDto
- [x] **FeatureFlagService** - Added matrix and bulk operation methods
- [x] **Repository Updates** - Added new query methods for matrix view

### Frontend Enhancements ✅

- [x] **Unified FeatureFlagService** - Merged tier-based and DB-backed services
- [x] **Feature Mapping** - FeatureKey to SystemFlagKey mapping for backwards compatibility
- [x] **Feature Directives** - Updated to react to both tier and DB flag changes
- [x] **Feature Guards** - Work with unified service (no changes needed)
- [x] **Sidebar Navigation** - Added Feature Flags nav item for SuperAdmin
- [x] **Feature Flags Admin UI** - Enhanced with Matrix tab for bulk client management
- [x] **Client Settings Page** - New Features tab for client admins to customize their flags
- [x] **Translation Keys** - Added for all new UI elements

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Architecture Overview](#current-architecture-overview)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Gap Analysis](#gap-analysis)
6. [Proposed Architecture](#proposed-architecture)
7. [Implementation Roadmap](#implementation-roadmap)

---

## Executive Summary

The PharmaAssist application currently has **two parallel feature flag systems** that need to be unified:

1. **Database-backed Feature Flags** - Complete two-tier system (System + Client level) with full CRUD operations
2. **Tier-based Feature Flags** - Local storage-based system for subscription tier upselling

Additionally, there are gaps in:
- User-to-Client association for multi-tenant scenarios
- Permission storage in database (currently hardcoded in frontend)
- System Admin vs Client Admin role distinction for feature management
- Dynamic menu configuration based on features/permissions

---

## Current Architecture Overview

### Technology Stack

| Layer | Technology |
|-------|------------|
| Backend | .NET 10.0, ASP.NET Core, EF Core, Identity Framework |
| Frontend | Angular 19, Standalone Components, Signals, ngx-translate |
| Database | SQL Server |
| Authentication | JWT Tokens with Role-Based Authorization |

### Existing Roles

```typescript
enum UserRole {
  SuperAdmin = 'SuperAdmin',   // Full system access
  Admin = 'Admin',             // Client-level admin
  Manager = 'Manager',         // Department/team management
  Pharmacist = 'Pharmacist',   // Pharmacy operations
  SalesRep = 'SalesRep',       // Sales operations
  Warehouse = 'Warehouse',     // Inventory management
  Customer = 'Customer'        // B2B/B2C customer portal
}
```

### Client Structure (Multi-Tenant)

The system supports multi-tenant operation through the `Customer` entity:

```
Zada d.o.o. (Headquarters)
├── Branch 01 (Sarajevo)
├── Branch 02 (Mostar)
└── Branch 03 (Tuzla)

Pharmamed (Headquarters)
├── Branch 01
└── Branch 02

Hercegovinalijek (Single Location)
```

---

## Backend Implementation

### Entity Model

#### ApplicationUser (`Domain/Entities/ApplicationUser.cs`)

```csharp
public class ApplicationUser : IdentityUser
{
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string? MiddleName { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
```

**⚠️ Gap Identified:** No direct `CustomerId` property to associate user with a client organization.

#### ApplicationRole (`Domain/Entities/ApplicationRole.cs`)

```csharp
public class ApplicationRole : IdentityRole
{
    public string? Description { get; set; }
}
```

**⚠️ Gap Identified:** 
- No `IsSystemRole` flag to distinguish system roles from custom roles
- No `Permissions` collection for role-permission mapping

#### SystemFeatureFlag (`Domain/Entities/SystemFeatureFlag.cs`)

```csharp
public class SystemFeatureFlag : BaseEntity
{
    public string Key { get; set; }              // e.g., "portal.splitInvoice"
    public string Name { get; set; }              // Human-readable name
    public string? Description { get; set; }
    public FlagCategory Category { get; set; }    // Portal, Billing, Inventory, etc.
    public FlagType Type { get; set; }            // Boolean, String, Number, Json, Percentage
    public string Value { get; set; }
    public string DefaultValue { get; set; }
    public bool IsEnabled { get; set; }
    public bool AllowClientOverride { get; set; } // Can clients customize?
    public string? Environment { get; set; }      // dev, staging, production
    
    public virtual ICollection<ClientFeatureFlag> ClientOverrides { get; set; }
}
```

#### ClientFeatureFlag (`Domain/Entities/ClientFeatureFlag.cs`)

```csharp
public class ClientFeatureFlag : BaseEntity
{
    public int CustomerId { get; set; }          // Client organization
    public int SystemFlagId { get; set; }        // Reference to system flag
    public string Value { get; set; }            // Override value
    public bool IsEnabled { get; set; }          // Override enabled state
    public string? Reason { get; set; }          // Why this override exists
    public DateTime? ExpiresAt { get; set; }     // Temporary overrides
    
    public virtual Customer Customer { get; set; }
    public virtual SystemFeatureFlag SystemFlag { get; set; }
}
```

#### FeatureFlagHistory (`Domain/Entities/FeatureFlagHistory.cs`)

Full audit trail for all feature flag changes with:
- System/Client flag references
- Change type, old/new values
- ChangedBy, ChangedAt, Notes

### Enums (`Domain/Enums/Enums.cs`)

```csharp
public enum FlagScope { System = 1, Client = 2 }

public enum FlagType { 
    Boolean = 1, 
    String = 2, 
    Number = 3, 
    Json = 4, 
    Percentage = 5 
}

public enum FlagCategory {
    Portal = 1,
    Billing = 2,
    Inventory = 3,
    Orders = 4,
    Reports = 5,
    Integration = 6,
    UI = 7,
    Experimental = 8
}
```

### Service Layer

#### FeatureFlagService (`Application/Services/FeatureFlagService.cs`)

Comprehensive service with ~756 lines implementing:

| Method | Description |
|--------|-------------|
| `GetAllSystemFlagsAsync()` | List all system flags |
| `GetSystemFlagAsync(id)` | Get specific system flag |
| `GetSystemFlagByKeyAsync(key)` | Lookup by key |
| `CreateSystemFlagAsync(dto)` | Create new system flag |
| `UpdateSystemFlagAsync(id, dto)` | Update system flag |
| `DeleteSystemFlagAsync(id)` | Delete system flag |
| `ToggleSystemFlagAsync(id)` | Enable/disable flag |
| `GetClientOverridesAsync(customerId)` | Get client's overrides |
| `SetClientOverrideAsync(customerId, flagId, dto)` | Set client override |
| `DeleteClientOverrideAsync(customerId, flagId)` | Remove override |
| `EvaluateFlagAsync(key, customerId)` | Evaluate flag for context |

### API Controllers

#### FeatureFlagsController (`Api/Controllers/FeatureFlagsController.cs`)

```csharp
[ApiController]
[Route("api/[controller]")]
public class FeatureFlagsController : ControllerBase
{
    // GET endpoints - [Authorize] (any authenticated user)
    [HttpGet("system")] // List all system flags
    [HttpGet("system/{id}")] // Get specific flag
    [HttpGet("client/{customerId}")] // Get client overrides
    [HttpGet("evaluate/{key}")] // Evaluate flag
    
    // Mutation endpoints - [Authorize(Roles = "Admin,SuperAdmin")]
    [HttpPost("system")] // Create system flag
    [HttpPut("system/{id}")] // Update system flag
    [HttpDelete("system/{id}")] // Delete system flag
    [HttpPost("system/{id}/toggle")] // Toggle flag
    [HttpPost("client/{customerId}/{flagId}")] // Set client override
    [HttpDelete("client/{customerId}/{flagId}")] // Delete override
}
```

**⚠️ Gap Identified:** No distinction between SuperAdmin (can manage all system flags) and Admin (can only manage their client's overrides).

---

## Frontend Implementation

### Models

#### User Model (`core/models/user.model.ts`)

```typescript
export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  lastLogin?: Date;
  // ⚠️ Missing: customerId for client association
}

export enum Permission {
  DashboardView = 'dashboard.view',
  ProductsView = 'products.view',
  ProductsCreate = 'products.create',
  ProductsEdit = 'products.edit',
  ProductsDelete = 'products.delete',
  // ... 30+ permissions defined
}

// ⚠️ Hardcoded role-permission mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SuperAdmin]: Object.values(Permission), // All permissions
  [UserRole.Admin]: [...], // Specific permissions
  // ... etc
};
```

#### Feature Flag Models (`core/models/feature-flag.model.ts`)

```typescript
// For tier-based upselling (NOT database-backed)
export enum FeatureTier {
  Free = 'free',
  Basic = 'basic',
  Professional = 'professional',
  Enterprise = 'enterprise'
}

// For database-backed feature flags
export interface SystemFeatureFlag {
  id: number;
  key: string;
  name: string;
  description?: string;
  category: FlagCategory;
  type: FlagType;
  value: string;
  defaultValue: string;
  isEnabled: boolean;
  allowClientOverride: boolean;
  environment?: string;
}

export interface ClientFeatureFlag {
  id: number;
  customerId: number;
  systemFlagId: number;
  systemFlag?: SystemFeatureFlag;
  value: string;
  isEnabled: boolean;
  reason?: string;
  expiresAt?: Date;
}
```

### Guards

#### Feature Guard (`core/guards/feature.guard.ts`)

```typescript
export const featureGuard: CanActivateFn = (route, state) => {
  const featureService = inject(FeatureFlagService);
  const router = inject(Router);
  
  const requiredFeature = route.data['feature'] as FeatureKey;
  
  if (!requiredFeature) return true;
  
  if (featureService.isFeatureEnabled(requiredFeature)) {
    return true;
  }
  
  return router.parseUrl('/upgrade');
};
```

**Note:** This uses the tier-based FeatureFlagService, not the database-backed DbFeatureFlagService.

#### Role Guard (`core/guards/role.guard.ts`)

```typescript
export const roleGuard: CanActivateFn = (route, state) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);
  
  const requiredRoles = route.data['roles'] as UserRole[];
  
  if (!requiredRoles || requiredRoles.length === 0) return true;
  
  if (authState.hasAnyRole(requiredRoles)) {
    return true;
  }
  
  return router.parseUrl('/access-denied');
};
```

#### Permission Guard (`core/guards/permission.guard.ts`)

```typescript
export const permissionGuard: CanActivateFn = (route, state) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);
  
  const requiredPermissions = route.data['permissions'] as Permission[];
  
  if (!requiredPermissions || requiredPermissions.length === 0) return true;
  
  if (authState.hasAnyPermission(requiredPermissions)) {
    return true;
  }
  
  return router.parseUrl('/access-denied');
};
```

### State Services

#### Auth State Service (`core/state/auth-state.service.ts`)

Provides authentication state with signals:

```typescript
@Injectable({ providedIn: 'root' })
export class AuthStateService {
  readonly currentUser = signal<IUser | null>(null);
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly userRole = computed(() => this.currentUser()?.role);
  
  hasRole(role: UserRole): boolean { ... }
  hasAnyRole(roles: UserRole[]): boolean { ... }
  hasPermission(permission: Permission): boolean { ... }
  hasAnyPermission(permissions: Permission[]): boolean { ... }
  isAdmin(): boolean { ... }
  isSuperAdmin(): boolean { ... }
}
```

**⚠️ Gap:** Uses hardcoded `ROLE_PERMISSIONS` mapping instead of database-stored permissions.

#### Feature Flag Service (`core/state/feature-flag.service.ts`)

Tier-based feature flags using localStorage:

```typescript
@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private readonly tier = signal<FeatureTier>(FeatureTier.Free);
  
  isFeatureEnabled(key: FeatureKey): boolean {
    return TIER_FEATURES[this.tier()].includes(key);
  }
  
  getTier(): FeatureTier { return this.tier(); }
  setTier(tier: FeatureTier): void { ... }
}
```

**⚠️ Gap:** This is completely separate from the database-backed feature flags.

#### DB Feature Flag Service (`core/services/db-feature-flag.service.ts`)

API client for database feature flags:

```typescript
@Injectable({ providedIn: 'root' })
export class DbFeatureFlagService {
  loadFlags(): Observable<SystemFeatureFlag[]> { ... }
  isFlagEnabled(key: string): boolean { ... }
  getFlag(key: string): SystemFeatureFlag | undefined { ... }
  setSystemFlag(id: number, dto: UpdateSystemFlagDto): Observable<SystemFeatureFlag> { ... }
  // ... etc
}
```

### Menu/Sidebar Component

The sidebar already supports role, permission, and feature-based visibility:

```typescript
interface NavItem {
  labelKey: string;
  icon?: string;
  route: string;
  permission?: string;    // Permission required
  feature?: string;       // Feature flag required
  roles?: UserRole[];     // Roles allowed
  children?: NavItem[];
  badge?: string;
}

canShowNavItem(item: NavItem): boolean {
  // Check role-based access
  if (item.roles?.length && !this.authState.hasAnyRole(item.roles)) {
    return false;
  }
  
  // Check feature-based access
  if (item.feature && !this.featureFlags.isFeatureEnabled(item.feature)) {
    return false;
  }
  
  // Check permission-based access
  if (item.permission && !this.authState.hasPermission(item.permission)) {
    return false;
  }
  
  return true;
}
```

**⚠️ Gap:** Uses tier-based `FeatureFlagService` instead of database-backed `DbFeatureFlagService`.

---

## Gap Analysis

### Critical Gaps

| # | Gap | Impact | Priority |
|---|-----|--------|----------|
| 1 | **Two parallel feature flag systems** | Confusion, maintenance burden | High |
| 2 | **No User-Customer association** | Can't determine which client a user belongs to | High |
| 3 | **Hardcoded permissions** | Can't dynamically adjust permissions per client | High |
| 4 | **No SuperAdmin vs Admin distinction in API** | Both can manage all flags | Medium |
| 5 | **Sidebar uses wrong feature flag service** | Menu items not gated by DB flags | Medium |

### Detailed Gap Descriptions

#### Gap 1: Dual Feature Flag Systems

**Current State:**
- `FeatureFlagService` (tier-based, localStorage) - Used by sidebar and route guards
- `DbFeatureFlagService` (database-backed) - Used by admin UI

**Problem:** Features can be enabled in one system but disabled in another.

**Solution:** Unify into single database-backed system.

#### Gap 2: User-Customer Association

**Current State:**
- `Customer.UserId` exists (optional FK to ApplicationUser)
- `ApplicationUser` has no `CustomerId`

**Problem:** When evaluating client-level feature flags, we need to know which customer/client the user belongs to. Current inverse relationship is optional and one-way.

**Solution:** Add `CustomerId` to `ApplicationUser` for direct association.

#### Gap 3: Hardcoded Permissions

**Current State:**
- Permissions defined as TypeScript enum
- Role-permission mapping hardcoded in `ROLE_PERMISSIONS` constant

**Problem:** 
- Cannot dynamically adjust permissions per client
- Cannot create custom roles with specific permissions
- Changes require code deployment

**Solution:** Store permissions in database with role assignments.

#### Gap 4: Authorization Hierarchy

**Current State:**
- `[Authorize(Roles = "Admin,SuperAdmin")]` on all mutation endpoints
- No distinction between system-wide and client-level operations

**Required Hierarchy:**
1. **SuperAdmin** - Can manage all system flags and any client's overrides
2. **Admin** - Can only manage their own client's overrides (where allowed)
3. **Other Roles** - Read-only access to flags

#### Gap 5: Sidebar Feature Service

**Current State:**
```typescript
readonly featureFlags = inject(FeatureFlagService); // Tier-based, not DB
```

**Problem:** Menu items gated by `feature` property use wrong service.

**Solution:** Replace with or combine with `DbFeatureFlagService`.

---

## Proposed Architecture

### Two-Tier Feature Flag System

```
┌─────────────────────────────────────────────────────────────────┐
│                      SYSTEM ADMIN LEVEL                          │
│              (SuperAdmin - Pharma Assist Team)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │               System Feature Flags                          │ │
│  │  - Define available features globally                       │ │
│  │  - Set AllowClientOverride per flag                        │ │
│  │  - Control per-client activation                           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Per-Client Activation Matrix:                                  │
│  ┌──────────────────┬────────┬───────────┬─────────────────┐   │
│  │ Feature          │ Zada   │ Pharmamed │ Hercegovinalijek│   │
│  ├──────────────────┼────────┼───────────┼─────────────────┤   │
│  │ Split Invoice    │ ✓      │ ✗         │ ✓               │   │
│  │ Quick Order      │ ✓      │ ✓         │ ✓               │   │
│  │ Tender Mgmt      │ ✓      │ ✓         │ ✗               │   │
│  │ Advanced Reports │ ✓      │ ✗         │ ✗               │   │
│  └──────────────────┴────────┴───────────┴─────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT ADMIN LEVEL                           │
│               (Admin Role - Client's IT Team)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Can configure (where AllowClientOverride = true):              │
│  - UI preferences (theme, language defaults)                    │
│  - Default values for configurable features                     │
│  - Branch-specific settings (if applicable)                     │
│                                                                  │
│  Cannot:                                                         │
│  - Enable features not activated by System Admin                │
│  - Access other clients' settings                               │
│  - Modify system-level flags                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Enhanced Entity Model

#### ApplicationUser (Enhanced)

```csharp
public class ApplicationUser : IdentityUser
{
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string? MiddleName { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public bool IsActive { get; set; } = true;
    
    // NEW: Client association
    public int? CustomerId { get; set; }
    public virtual Customer? Customer { get; set; }
    
    // Audit fields
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
```

#### Permission Entity (New)

```csharp
public class Permission : BaseEntity
{
    public string Key { get; set; }         // e.g., "products.create"
    public string Name { get; set; }        // Human-readable
    public string? Description { get; set; }
    public string Category { get; set; }    // Group for UI
    
    public virtual ICollection<RolePermission> RolePermissions { get; set; }
}
```

#### RolePermission Entity (New)

```csharp
public class RolePermission
{
    public string RoleId { get; set; }
    public int PermissionId { get; set; }
    
    public virtual ApplicationRole Role { get; set; }
    public virtual Permission Permission { get; set; }
}
```

### Authorization Flow

```
┌────────────────────────────────────────────────────────────────┐
│                      User Authentication                        │
│                                                                 │
│  1. User logs in with email/password                           │
│  2. Server validates credentials                               │
│  3. JWT token generated with claims:                           │
│     - sub: userId                                              │
│     - role: UserRole                                           │
│     - customerId: number (client association)                  │
│     - permissions: string[] (role-based permissions)           │
│                                                                 │
└─────────────────────────┬──────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│                    Feature Flag Evaluation                      │
│                                                                 │
│  evaluateFlag(key: string, customerId: number):                │
│                                                                 │
│  1. Get SystemFeatureFlag by key                               │
│  2. If !systemFlag.IsEnabled → return false                    │
│  3. Check ClientFeatureFlag for customerId + flagId            │
│  4. If clientOverride exists && isEnabled:                     │
│     - If systemFlag.AllowClientOverride → use clientOverride   │
│     - Else → use systemFlag value                              │
│  5. Return effective value                                     │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Menu Configuration Strategy

#### Option A: Static Configuration with Dynamic Visibility (Recommended)

Keep menu items defined in code, use runtime checks for visibility:

```typescript
interface NavItem {
  labelKey: string;
  route: string;
  icon?: string;
  // Visibility rules
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  requiredFeature?: string;  // DB feature flag key
  // Require ALL conditions (AND) or ANY (OR)
  visibilityMode?: 'all' | 'any';
}

// In sidebar component
canShowNavItem(item: NavItem): boolean {
  const checks: boolean[] = [];
  
  if (item.requiredRoles?.length) {
    checks.push(this.authState.hasAnyRole(item.requiredRoles));
  }
  
  if (item.requiredPermissions?.length) {
    checks.push(this.authState.hasAnyPermission(item.requiredPermissions));
  }
  
  if (item.requiredFeature) {
    // Use DB feature flag service
    checks.push(this.dbFeatureFlags.isFlagEnabled(item.requiredFeature));
  }
  
  if (checks.length === 0) return true;
  
  return item.visibilityMode === 'any' 
    ? checks.some(c => c)
    : checks.every(c => c);
}
```

#### Option B: Database-Driven Menu Configuration

Store menu configuration in database for full flexibility:

```csharp
public class MenuItem : BaseEntity
{
    public string Key { get; set; }
    public string LabelKey { get; set; }
    public string Route { get; set; }
    public string? Icon { get; set; }
    public int? ParentId { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    
    // Visibility rules (JSON)
    public string? RequiredRoles { get; set; }
    public string? RequiredPermissions { get; set; }
    public string? RequiredFeatureFlag { get; set; }
    
    public virtual MenuItem? Parent { get; set; }
    public virtual ICollection<MenuItem> Children { get; set; }
}
```

---

## Implementation Roadmap

### Phase 1: Database Schema Enhancement (Backend)

**Duration:** 1-2 days

1. **Add User-Customer Association**
   - Add `CustomerId` to `ApplicationUser`
   - Create migration
   - Update AuthService to include customerId in JWT

2. **Add Permission Tables**
   - Create `Permission` entity
   - Create `RolePermission` entity
   - Seed default permissions
   - Create migration

3. **Update FeatureFlagService**
   - Add SuperAdmin-only system flag operations
   - Add client-scoped override operations
   - Add authorization checks

### Phase 2: API Authorization Enhancement (Backend)

**Duration:** 1 day

1. **Update FeatureFlagsController**
   - Separate SuperAdmin endpoints from Admin endpoints
   - Add `[Authorize(Roles = "SuperAdmin")]` to system flag mutations
   - Add client-scoped authorization for override endpoints

2. **Add Permission Claims to JWT**
   - Fetch permissions from database on login
   - Include in JWT claims

### Phase 3: Frontend Unification (Frontend)

**Duration:** 2-3 days

1. **Merge Feature Flag Services**
   - Update `FeatureFlagService` to use `DbFeatureFlagService`
   - Or create new unified service
   - Update all consumers

2. **Update Auth State Service**
   - Add `customerId` to user state
   - Load permissions from JWT instead of hardcoded mapping

3. **Update Sidebar Component**
   - Use database-backed feature flags
   - Add combined visibility logic

4. **Update Route Guards**
   - Feature guard to use DB flags
   - Add combined guard support

### Phase 4: Admin Dashboards (Full Stack)

**Duration:** 3-4 days

1. **System Admin Dashboard**
   - Feature flag management per client
   - Client matrix view (features × clients)
   - Bulk enable/disable

2. **Client Admin Settings**
   - Client-scoped settings page
   - Only show overridable features
   - Branch-specific settings (if applicable)

### Phase 5: Testing & Documentation

**Duration:** 1-2 days

1. **Unit Tests**
   - FeatureFlagService tests
   - Authorization tests

2. **Integration Tests**
   - End-to-end feature flag evaluation
   - Multi-tenant scenarios

3. **Documentation**
   - API documentation
   - Admin user guide

---

## Appendix

### Existing Feature Flag Keys

Based on sidebar configuration:

| Key | Category | Description |
|-----|----------|-------------|
| `inventory_management` | Inventory | Full inventory module |
| `prescription_management` | Orders | Prescription handling |
| `customer_management` | Portal | B2B customer features |
| `basic_reports` | Reports | Standard reporting |
| `advanced_analytics` | Reports | BI and analytics |
| `audit_logs` | Portal | Audit trail access |
| `api_access` | Integration | External API access |

### Sample Database Seed

```sql
-- System Feature Flags
INSERT INTO SystemFeatureFlags (Key, Name, Category, Type, Value, IsEnabled, AllowClientOverride)
VALUES 
('portal.splitInvoice', 'Split Invoice', 1, 1, 'true', 1, 1),
('orders.quickOrder', 'Quick Order', 4, 1, 'true', 1, 1),
('orders.prescriptions', 'Prescription Management', 4, 1, 'true', 1, 0),
('reports.advanced', 'Advanced Analytics', 5, 1, 'true', 1, 0),
('inventory.batchTracking', 'Batch Tracking', 3, 1, 'true', 1, 1),
('integration.api', 'API Access', 6, 1, 'true', 1, 0);
```

---

## Next Steps

1. Review this analysis with stakeholders
2. Prioritize gaps based on business needs
3. Create detailed technical specifications for each phase
4. Begin Phase 1 implementation

---

*Document prepared as part of PharmaAssist Customer Portal modernization initiative.*
