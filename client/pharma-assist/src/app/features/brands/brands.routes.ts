import { Routes } from '@angular/router';

export const BRANDS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./brands-list/brands-list.component').then(m => m.BrandsListComponent) },
  { path: 'new', loadComponent: () => import('./brand-form/brand-form.component').then(m => m.BrandFormComponent) },
  { path: 'knowledge', loadComponent: () => import('./knowledge-list/knowledge-list.component').then(m => m.KnowledgeListComponent) },
  { path: 'knowledge/new', loadComponent: () => import('./knowledge-form/knowledge-form.component').then(m => m.KnowledgeFormComponent) },
  { path: 'knowledge/:id/edit', loadComponent: () => import('./knowledge-form/knowledge-form.component').then(m => m.KnowledgeFormComponent) },
  { path: 'knowledge/:id', loadComponent: () => import('./knowledge-form/knowledge-form.component').then(m => m.KnowledgeFormComponent) },
  { path: ':id/edit', loadComponent: () => import('./brand-form/brand-form.component').then(m => m.BrandFormComponent) },
  { path: ':id', loadComponent: () => import('./brand-detail/brand-detail.component').then(m => m.BrandDetailComponent) }
];
