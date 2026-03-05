import { Routes } from '@angular/router';

export const CYCLES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./cycles-list/cycles-list.component').then(m => m.CyclesListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./cycle-form/cycle-form.component').then(m => m.CycleFormComponent)
  },
  {
    path: 'campaigns',
    loadComponent: () => import('./campaigns-list/campaigns-list.component').then(m => m.CampaignsListComponent)
  },
  {
    path: 'campaigns/new',
    loadComponent: () => import('./campaign-form/campaign-form.component').then(m => m.CampaignFormComponent)
  },
  {
    path: 'campaigns/:id/edit',
    loadComponent: () => import('./campaign-form/campaign-form.component').then(m => m.CampaignFormComponent)
  },
  {
    path: 'campaigns/:id',
    loadComponent: () => import('./campaign-detail/campaign-detail.component').then(m => m.CampaignDetailComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./cycle-form/cycle-form.component').then(m => m.CycleFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./cycle-detail/cycle-detail.component').then(m => m.CycleDetailComponent)
  }
];
