import { Routes } from '@angular/router';

export const TERRITORIES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./territories-list/territories-list.component').then(m => m.TerritoriesListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./territory-form/territory-form.component').then(m => m.TerritoryFormComponent)
  },
  {
    path: 'analytics',
    loadComponent: () => import('./territory-analytics/territory-analytics.component').then(m => m.TerritoryAnalyticsComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./territory-form/territory-form.component').then(m => m.TerritoryFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./territory-detail/territory-detail.component').then(m => m.TerritoryDetailComponent)
  }
];
