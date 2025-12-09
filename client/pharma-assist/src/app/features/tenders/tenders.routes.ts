import { Routes } from '@angular/router';

export const TENDERS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./tenders-list.component').then(m => m.TendersListComponent) },
  { path: 'new', loadComponent: () => import('./tender-form.component').then(m => m.TenderFormComponent) },
  { path: 'my', loadComponent: () => import('./my-tenders.component').then(m => m.MyTendersComponent) },
  { path: ':id', loadComponent: () => import('./tender-detail.component').then(m => m.TenderDetailComponent) },
  { path: ':id/edit', loadComponent: () => import('./tender-form.component').then(m => m.TenderFormComponent) },
  { path: ':id/bid', loadComponent: () => import('./tender-bid-form.component').then(m => m.TenderBidFormComponent) }
];
