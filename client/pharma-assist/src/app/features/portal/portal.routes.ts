import { Routes } from '@angular/router';

export const PORTAL_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/portal-home.component')
      .then(m => m.PortalHomeComponent)
  },
  {
    path: 'catalog',
    loadComponent: () => import('./pages/catalog/product-catalog.component')
      .then(m => m.ProductCatalogComponent)
  },
  {
    path: 'product/:id',
    loadComponent: () => import('./pages/product-detail/product-detail.component')
      .then(m => m.ProductDetailComponent)
  },
  {
    path: 'cart',
    loadComponent: () => import('./pages/cart/cart.component')
      .then(m => m.CartComponent)
  },
  {
    path: 'checkout',
    loadComponent: () => import('./pages/checkout/checkout.component')
      .then(m => m.CheckoutComponent)
  },
  {
    path: 'order-confirmation/:id',
    loadComponent: () => import('./pages/order-confirmation/order-confirmation.component')
      .then(m => m.OrderConfirmationComponent)
  },
  {
    path: 'orders',
    loadComponent: () => import('./pages/orders/portal-orders.component')
      .then(m => m.PortalOrdersComponent)
  },
  {
    path: 'orders/:id',
    loadComponent: () => import('./pages/order-detail/portal-order-detail.component')
      .then(m => m.PortalOrderDetailComponent)
  },
  {
    path: 'favorites',
    loadComponent: () => import('./pages/favorites/favorites.component')
      .then(m => m.FavoritesComponent)
  },
  {
    path: 'quick-order',
    loadComponent: () => import('./pages/quick-order/quick-order.component')
      .then(m => m.QuickOrderComponent)
  },
  {
    path: 'account',
    loadComponent: () => import('./pages/account/account.component')
      .then(m => m.AccountComponent)
  },
  {
    path: 'claims',
    loadComponent: () => import('./pages/claims/portal-claims.component')
      .then(m => m.PortalClaimsComponent)
  }
];
