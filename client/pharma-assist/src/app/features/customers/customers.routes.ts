import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { UserRole } from '../../core/models/user.model';

export const CUSTOMERS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./customers-list.component').then(m => m.CustomersListComponent) },
  { path: 'new', loadComponent: () => import('./customer-form.component').then(m => m.CustomerFormComponent) },
  {
    path: 'rep',
    canActivate: [roleGuard],
    data: { roles: [UserRole.SalesRep] },
    loadComponent: () => import('./rep-customers.component').then(m => m.RepCustomersComponent)
  },
  {
    path: 'rep/map',
    canActivate: [roleGuard],
    data: { roles: [UserRole.SalesRep] },
    loadComponent: () => import('./customer-map.component').then(m => m.CustomerMapComponent)
  },
  {
    path: 'rep/:id',
    canActivate: [roleGuard],
    data: { roles: [UserRole.SalesRep] },
    loadComponent: () => import('./rep-customer-detail.component').then(m => m.RepCustomerDetailComponent)
  },
  { path: ':id', loadComponent: () => import('./customer-detail.component').then(m => m.CustomerDetailComponent) },
  { path: ':id/edit', loadComponent: () => import('./customer-form.component').then(m => m.CustomerFormComponent) }
];
