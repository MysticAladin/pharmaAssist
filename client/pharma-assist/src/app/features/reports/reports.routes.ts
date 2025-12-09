import { Routes } from '@angular/router';

export const REPORTS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./reports.component').then(m => m.ReportsComponent) },
  { path: 'sales', loadComponent: () => import('./sales-report.component').then(m => m.SalesReportComponent) },
  { path: 'inventory', loadComponent: () => import('./inventory-report.component').then(m => m.InventoryReportComponent) },
  { path: 'expiring', loadComponent: () => import('./expiring-products-report.component').then(m => m.ExpiringProductsReportComponent) },
  { path: 'analytics', loadComponent: () => import('./analytics.component').then(m => m.AnalyticsComponent) },
  { path: 'financial', loadComponent: () => import('./financial-report.component').then(m => m.FinancialReportComponent) },
  { path: 'customers', loadComponent: () => import('./customer-report.component').then(m => m.CustomerReportComponent) },
  { path: 'builder', loadComponent: () => import('./report-builder/report-builder.component').then(m => m.ReportBuilderComponent) },
  { path: 'builder/:id', loadComponent: () => import('./report-builder/report-builder.component').then(m => m.ReportBuilderComponent) }
];
