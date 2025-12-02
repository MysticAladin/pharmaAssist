import { Routes } from '@angular/router';

export const PRODUCTS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./products-list.component').then(m => m.ProductsListComponent) },
  { path: 'new', loadComponent: () => import('./product-form.component').then(m => m.ProductFormComponent) },
  { path: 'categories', loadComponent: () => import('./categories.component').then(m => m.CategoriesComponent) },
  { path: 'manufacturers', loadComponent: () => import('./manufacturers.component').then(m => m.ManufacturersComponent) },
  { path: 'low-stock', loadComponent: () => import('./low-stock.component').then(m => m.LowStockComponent) },
  { path: ':id/edit', loadComponent: () => import('./product-form.component').then(m => m.ProductFormComponent) },
  { path: ':id', loadComponent: () => import('./product-detail.component').then(m => m.ProductDetailComponent) }
];
