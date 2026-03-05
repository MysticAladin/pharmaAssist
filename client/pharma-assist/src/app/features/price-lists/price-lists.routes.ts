import { Routes } from '@angular/router';

export const PRICE_LISTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./price-list-list/price-list-list.component').then(m => m.PriceListListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./price-list-form/price-list-form.component').then(m => m.PriceListFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./price-list-detail/price-list-detail.component').then(m => m.PriceListDetailComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./price-list-form/price-list-form.component').then(m => m.PriceListFormComponent)
  }
];
