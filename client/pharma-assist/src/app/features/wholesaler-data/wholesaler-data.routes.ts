import { Routes } from '@angular/router';

export const WHOLESALER_DATA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./import-list/import-list.component').then(m => m.ImportListComponent)
  },
  {
    path: 'upload',
    loadComponent: () => import('./import-wizard/import-wizard.component').then(m => m.ImportWizardComponent)
  },
  {
    path: 'stock',
    loadComponent: () => import('./stock-overview/stock-overview.component').then(m => m.StockOverviewComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./import-detail/import-detail.component').then(m => m.ImportDetailComponent)
  }
];
