import { Routes } from '@angular/router';
import { authGuard, noAuthGuard, adminGuard, featureGuard, customerGuard, staffGuard, roleGuard } from './core/guards';
import { FeatureKey } from './core/models/feature-flag.model';
import { UserRole } from './core/models/user.model';

export const routes: Routes = [
  // Auth routes (no auth required)
  {
    path: 'auth',
    canActivate: [noAuthGuard],
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  // E-Pharmacy Portal (customer-facing)
  {
    path: 'portal',
    canActivate: [customerGuard],
    loadComponent: () => import('./features/portal/components/layout/portal-layout.component')
      .then(m => m.PortalLayoutComponent),
    loadChildren: () => import('./features/portal/portal.routes').then(m => m.PORTAL_ROUTES)
  },

  // Main application routes (require auth - staff only, not customers)
  {
    path: '',
    canActivate: [staffGuard],
    loadComponent: () => import('./shared/components/layout/main-layout/main-layout.component')
      .then(m => m.MainLayoutComponent),
    children: [
      // Dashboard
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
      },

      // Products
      {
        path: 'products',
        loadChildren: () => import('./features/products/products.routes').then(m => m.PRODUCTS_ROUTES)
      },

      // Inventory
      {
        path: 'inventory',
        canActivate: [featureGuard],
        data: { feature: FeatureKey.InventoryManagement },
        loadChildren: () => import('./features/inventory/inventory.routes').then(m => m.INVENTORY_ROUTES)
      },

      // Orders
      {
        path: 'orders',
        loadChildren: () => import('./features/orders/orders.routes').then(m => m.ORDERS_ROUTES)
      },

      // Tenders
      {
        path: 'tenders',
        canActivate: [featureGuard],
        data: {
          feature: FeatureKey.TenderManagement,
          roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager, UserRole.SalesRep]
        },
        loadChildren: () => import('./features/tenders/tenders.routes').then(m => m.TENDERS_ROUTES)
      },

      // Customers
      {
        path: 'customers',
        canActivate: [featureGuard],
        data: {
          feature: FeatureKey.CustomerManagement,
          roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager, UserRole.SalesRep]
        },
        loadChildren: () => import('./features/customers/customers.routes').then(m => m.CUSTOMERS_ROUTES)
      },

      // Visits (Sales Rep mobile workflow)
      {
        path: 'visits',
        canActivate: [roleGuard],
        data: { roles: [UserRole.SalesRep, UserRole.Manager, UserRole.Admin, UserRole.SuperAdmin] },
        loadChildren: () => import('./features/visits/visits.routes').then(m => m.VISITS_ROUTES)
      },

      // Reports
      {
        path: 'reports',
        canActivate: [featureGuard],
        data: { feature: FeatureKey.BasicReports },
        loadChildren: () => import('./features/reports/reports.routes').then(m => m.REPORTS_ROUTES)
      },

      // Profile & Settings
      {
        path: 'profile',
        loadChildren: () => import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES)
      },
      {
        path: 'settings',
        loadChildren: () => import('./features/settings/settings.routes').then(m => m.SETTINGS_ROUTES)
      },

      // Admin routes
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
      },

      // Upgrade page (for upselling)
      {
        path: 'upgrade',
        loadComponent: () => import('./features/upgrade/upgrade.component')
          .then(m => m.UpgradeComponent)
      }
    ]
  },

  // Access denied page
  {
    path: 'access-denied',
    loadComponent: () => import('./features/errors/access-denied.component')
      .then(m => m.AccessDeniedComponent)
  },

  // 404 Not Found
  {
    path: '**',
    loadComponent: () => import('./features/errors/not-found.component')
      .then(m => m.NotFoundComponent)
  }
];
