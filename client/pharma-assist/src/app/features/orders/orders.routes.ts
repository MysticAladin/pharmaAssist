import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards';
import { UserRole } from '../../core/models/user.model';

export const ORDERS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./orders-list.component').then(m => m.OrdersListComponent) },
  { path: 'new', loadComponent: () => import('./order-create.component').then(m => m.OrderCreateComponent) },
  { path: 'pending', loadComponent: () => import('./pending-orders.component').then(m => m.PendingOrdersComponent) },
  {
    path: 'claims',
    canActivate: [roleGuard],
    data: { roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager] },
    loadComponent: () => import('./claims-list.component').then(m => m.ClaimsListComponent)
  },
  {
    path: 'prescriptions',
    loadChildren: () => import('../prescriptions/prescriptions.routes').then(m => m.PRESCRIPTIONS_ROUTES)
  },
  { path: ':id/edit', loadComponent: () => import('./order-detail.component').then(m => m.OrderDetailComponent) },
  { path: ':id', loadComponent: () => import('./order-detail.component').then(m => m.OrderDetailComponent) }
];
