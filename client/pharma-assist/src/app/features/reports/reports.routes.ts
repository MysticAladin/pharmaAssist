import { Routes } from '@angular/router';

export const REPORTS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./reports.component').then(m => m.ReportsComponent) },
  { path: 'sales', loadComponent: () => import('./sales-report.component').then(m => m.SalesReportComponent) },
  { path: 'inventory', loadComponent: () => import('./inventory-report.component').then(m => m.InventoryReportComponent) },
  { path: 'analytics', loadComponent: () => import('./analytics.component').then(m => m.AnalyticsComponent) }
];
