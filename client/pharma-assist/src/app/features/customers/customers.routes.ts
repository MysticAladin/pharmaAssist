import { Routes } from '@angular/router';

export const CUSTOMERS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./customers-list.component').then(m => m.CustomersListComponent) },
  { path: ':id', loadComponent: () => import('./customer-detail.component').then(m => m.CustomerDetailComponent) }
];
