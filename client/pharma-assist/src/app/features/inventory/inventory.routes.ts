import { Routes } from '@angular/router';

export const INVENTORY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./inventory-list.component').then(m => m.InventoryComponent)
  },
  {
    path: 'adjustments',
    loadComponent: () => import('./adjustments-list.component').then(m => m.AdjustmentsListComponent)
  },
  {
    path: 'adjustments/new',
    loadComponent: () => import('./stock-adjustment-form.component').then(m => m.StockAdjustmentFormComponent)
  },
  {
    path: 'transfers',
    loadComponent: () => import('./transfers-list.component').then(m => m.TransfersListComponent)
  },
  {
    path: 'transfers/new',
    loadComponent: () => import('./stock-transfer-form.component').then(m => m.StockTransferFormComponent)
  },
  {
    path: 'transfers/:id',
    loadComponent: () => import('./transfer-detail.component').then(m => m.TransferDetailComponent)
  },
  {
    path: 'transfers/:id/receive',
    loadComponent: () => import('./receive-transfer.component').then(m => m.ReceiveTransferComponent)
  }
];
