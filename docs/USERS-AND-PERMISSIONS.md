# PharmaAssist - User Roles, Permissions & Menu Access

## Test Users Credentials

All test users use the password: **`test123`**

| Role | Email | Description |
|------|-------|-------------|
| **System Admin** | `admin@pharmaassist.ba` | Full system access, manages all clients |
| **Manager** | `manager.user@pharmaassist.com` | Operational oversight, sales & inventory management |
| **Pharmacist** | `pharmacist.user@pharmaassist.com` | Prescription handling, medication dispensing |
| **Sales Rep** | `salesrep.user@pharmaassist.com` | Customer relations, order creation |
| **Warehouse** | `warehouse.user@pharmaassist.com` | Inventory and shipping operations |
| **Customer** | `customer.user@pharmaassist.com` | Customer portal access (e-Pharmacy) |

---

## User Roles & Their Access

### 🔐 SuperAdmin
**Full system access** - Can do everything

| Menu Section | Access |
|--------------|--------|
| Dashboard | ✅ Full |
| Products | ✅ Full CRUD |
| Inventory | ✅ Full |
| Orders | ✅ Full CRUD |
| Customers | ✅ Full CRUD |
| Reports | ✅ All reports including advanced analytics |
| **Administration** | |
| User Management | ✅ |
| Feature Flags | ✅ |
| Pricing | ✅ |
| Targets | ✅ |
| Settings | ✅ |
| Audit Logs | ✅ |
| Integrations | ✅ |

---

### 👔 Admin
**Client administrator** - Manages their organization

| Menu Section | Access |
|--------------|--------|
| Dashboard | ✅ Full (including admin dashboard) |
| Products | ✅ Full CRUD |
| Inventory | ✅ Full management |
| Orders | ✅ Full CRUD + processing |
| Customers | ✅ Full CRUD |
| Reports | ✅ All reports + financial + export |
| **Administration** | |
| User Management | ✅ (view, create, edit) |
| Feature Flags | ❌ |
| Pricing | ✅ |
| Targets | ✅ |
| Settings | ✅ |
| Audit Logs | ✅ |
| Integrations | ❌ |

---

### 📊 Manager
**Operational oversight** - Sales and operations

| Menu Section | Access |
|--------------|--------|
| Dashboard | ✅ Full (including admin dashboard) |
| Products | ✅ View + Edit |
| Inventory | ✅ Full management |
| Orders | ✅ Create, Edit, Process |
| Customers | ✅ View, Create, Edit |
| Reports | ✅ View + Export |
| **Administration** | |
| User Management | ✅ View only |
| Targets | ✅ |
| Audit Logs | ✅ |
| Other Admin | ❌ |

---

### 💊 Pharmacist
**Clinical operations** - Prescriptions and medications

| Menu Section | Access |
|--------------|--------|
| Dashboard | ✅ View |
| Products | ✅ View only |
| Inventory | ✅ View only |
| Orders | ✅ View + Edit |
| Customers | ✅ View only |
| Prescriptions | ✅ Full (create, approve, reject, dispense) |
| Reports | ✅ View only |
| **Administration** | ❌ |

---

### 💼 SalesRep
**Customer relations** - Sales and customer management

| Menu Section | Access |
|--------------|--------|
| Dashboard | ✅ View |
| Products | ✅ View only |
| Inventory | ❌ |
| Orders | ✅ View, Create, Edit |
| Customers | ✅ View, Create, Edit |
| Reports | ✅ View only |
| **Administration** | ❌ |

---

### 📦 Warehouse
**Logistics** - Inventory and shipping

| Menu Section | Access |
|--------------|--------|
| Dashboard | ✅ View |
| Products | ✅ View only |
| Inventory | ✅ Full management |
| Orders | ✅ View only |
| Customers | ❌ |
| Reports | ❌ |
| **Administration** | ❌ |

---

### 🛒 Customer (E-Pharmacy Portal)
**Customer portal** - Ordering and account management

| Menu Section | Access |
|--------------|--------|
| Dashboard | ✅ Personal dashboard |
| Products | ✅ Browse catalog |
| Orders | ✅ View own orders, Create new orders |
| Prescriptions | ✅ View own, Submit new |
| Inventory | ❌ |
| Customers | ❌ |
| Reports | ❌ |
| **Administration** | ❌ |

---

## Navigation Menu Structure

### Main Menu (All Users)
```
📊 Dashboard
📦 Products
    ├── All Products
    ├── Categories
    ├── Manufacturers
    └── Low Stock (badge)
📋 Inventory*
🛒 Orders
    ├── All Orders
    ├── Pending
    └── Prescriptions*
👥 Customers*
📈 Reports*
    ├── Sales Report
    ├── Inventory Report
    └── Advanced Analytics*
```
*Feature flag controlled

### Administration Menu (Admin/Manager only)
```
👤 User Management
🎚️ Feature Flags (SuperAdmin only)
🏷️ Pricing
🎯 Targets
⚙️ Settings
📝 Audit Logs*
🔗 Integrations* (SuperAdmin only)
```
*Feature flag controlled

---

## Feature Flags

Some features require feature flags to be enabled:

| Feature | Flag Key | Required Tier |
|---------|----------|---------------|
| Inventory Management | `inventory_management` | Basic+ |
| Customer Management | `customer_management` | Basic+ |
| Basic Reports | `basic_reports` | Basic+ |
| Advanced Analytics | `advanced_analytics` | Professional+ |
| Prescription Management | `prescription_management` | Professional+ |
| Audit Logs | `audit_logs` | Professional+ |
| API Access | `api_access` | Enterprise |

---

## Permissions Matrix

| Permission | SuperAdmin | Admin | Manager | Pharmacist | SalesRep | Warehouse | Customer |
|------------|------------|-------|---------|------------|----------|-----------|----------|
| **Dashboard** |
| View Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Admin Dashboard | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Products** |
| View Products | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Products | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Edit Products | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete Products | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Orders** |
| View Orders | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Orders | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| Edit Orders | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete Orders | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Process Orders | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Inventory** |
| View Inventory | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Manage Inventory | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Customers** |
| View Customers | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create Customers | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Edit Customers | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Delete Customers | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Prescriptions** |
| View Prescriptions | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Create Prescriptions | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Approve Prescriptions | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Reject Prescriptions | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Dispense Prescriptions | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Users** |
| View Users | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Users | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Edit Users | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Delete Users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage Roles | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Reports** |
| View Reports | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Export Reports | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Financial Reports | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Settings & Audit** |
| View Settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage Settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Audit Logs | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Files & Email** |
| Upload Files | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Delete Files | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Send Emails | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Email Logs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Quick Start

### Running the Application

**Backend (API):**
```powershell
cd D:\Code\Private\PharmaAssist\server\src\Api
dotnet run
# API runs on https://localhost:5200
```

**Frontend (Angular):**
```powershell
cd D:\Code\Private\PharmaAssist\client\pharma-assist
npm start
# App runs on http://localhost:4200
```

### Login URLs
- **Admin Portal:** http://localhost:4200/auth/login
- **Customer Portal:** http://localhost:4200/e-pharmacy/login

---

## Database Seed Script

To reset and populate the database with test data:

```powershell
cd D:\Code\Private\PharmaAssist\server\scripts
.\RunSeed.ps1
```

This creates:
- 6 users (one per role)
- 12 customers (HQ + branches)
- 26 products
- 192 orders with ~900 order items
- Feature flags, promotions, inventory, etc.
