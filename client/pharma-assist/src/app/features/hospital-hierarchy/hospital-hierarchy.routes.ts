import { Routes } from '@angular/router';

export const HOSPITAL_ROUTES: Routes = [
  // Global physician list
  {
    path: 'physicians',
    loadComponent: () => import('./physician-list/physician-list.component').then(m => m.PhysicianListComponent)
  },
  {
    path: 'physicians/new',
    loadComponent: () => import('./physician-form/physician-form.component').then(m => m.PhysicianFormComponent)
  },
  // Per-customer routes
  {
    path: ':customerId/departments',
    loadComponent: () => import('./department-list/department-list.component').then(m => m.DepartmentListComponent)
  },
  {
    path: ':customerId/departments/new',
    loadComponent: () => import('./department-form/department-form.component').then(m => m.DepartmentFormComponent)
  },
  {
    path: ':customerId/departments/:id',
    loadComponent: () => import('./department-list/department-list.component').then(m => m.DepartmentListComponent)
  },
  {
    path: ':customerId/departments/:id/edit',
    loadComponent: () => import('./department-form/department-form.component').then(m => m.DepartmentFormComponent)
  },
  {
    path: ':customerId/physicians',
    loadComponent: () => import('./physician-list/physician-list.component').then(m => m.PhysicianListComponent)
  },
  {
    path: ':customerId/physicians/new',
    loadComponent: () => import('./physician-form/physician-form.component').then(m => m.PhysicianFormComponent)
  },
  {
    path: ':customerId/physicians/:id/edit',
    loadComponent: () => import('./physician-form/physician-form.component').then(m => m.PhysicianFormComponent)
  },
  {
    path: ':customerId/hierarchy',
    loadComponent: () => import('./hierarchy-view/hierarchy-view.component').then(m => m.HierarchyViewComponent)
  },
  {
    path: ':customerId/visits',
    loadComponent: () => import('./customer-visits/customer-visits.component').then(m => m.CustomerVisitsComponent)
  }
];
