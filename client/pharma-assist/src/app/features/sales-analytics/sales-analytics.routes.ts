import { Routes } from '@angular/router';

export const SALES_ANALYTICS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./sales-dashboard/sales-dashboard.component').then(m => m.SalesDashboardComponent)
  },
  {
    path: 'by-institution',
    loadComponent: () => import('./analytics-detail/analytics-detail.component').then(m => m.AnalyticsDetailComponent),
    data: { view: 'institution' }
  },
  {
    path: 'by-region',
    loadComponent: () => import('./analytics-detail/analytics-detail.component').then(m => m.AnalyticsDetailComponent),
    data: { view: 'region' }
  },
  {
    path: 'by-product',
    loadComponent: () => import('./analytics-detail/analytics-detail.component').then(m => m.AnalyticsDetailComponent),
    data: { view: 'product' }
  },
  {
    path: 'by-brand',
    loadComponent: () => import('./analytics-detail/analytics-detail.component').then(m => m.AnalyticsDetailComponent),
    data: { view: 'brand' }
  },
  {
    path: 'by-rep',
    loadComponent: () => import('./analytics-detail/analytics-detail.component').then(m => m.AnalyticsDetailComponent),
    data: { view: 'rep' }
  },
  {
    path: 'trends',
    loadComponent: () => import('./analytics-detail/analytics-detail.component').then(m => m.AnalyticsDetailComponent),
    data: { view: 'trends' }
  }
];
