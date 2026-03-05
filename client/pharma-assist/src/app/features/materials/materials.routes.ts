import { Routes } from '@angular/router';

export const MATERIALS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./distribution-list/distribution-list.component').then(m => m.DistributionListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./distribution-form/distribution-form.component').then(m => m.DistributionFormComponent)
  },
  {
    path: 'inventory/:repId',
    loadComponent: () => import('./rep-inventory/rep-inventory.component').then(m => m.RepInventoryComponent)
  }
];
