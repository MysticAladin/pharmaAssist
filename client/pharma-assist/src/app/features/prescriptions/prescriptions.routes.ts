import { Routes } from '@angular/router';

export const PRESCRIPTIONS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./prescriptions-list.component').then(m => m.PrescriptionsListComponent) },
  { path: ':id', loadComponent: () => import('./prescription-detail.component').then(m => m.PrescriptionDetailComponent) },
  { path: ':id/dispense', loadComponent: () => import('./prescription-dispense.component').then(m => m.PrescriptionDispenseComponent) }
];
