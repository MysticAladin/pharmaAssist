import { Routes } from '@angular/router';

export const ORDERS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./orders-list.component').then(m => m.OrdersListComponent) },
  { path: 'pending', loadComponent: () => import('./pending-orders.component').then(m => m.PendingOrdersComponent) },
  { path: 'prescriptions', loadComponent: () => import('./prescriptions.component').then(m => m.PrescriptionsComponent) },
  { path: ':id', loadComponent: () => import('./order-detail.component').then(m => m.OrderDetailComponent) }
];
