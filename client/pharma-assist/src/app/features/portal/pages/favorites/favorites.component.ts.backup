import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CatalogService } from '../../services/catalog.service';
import { CartService } from '../../services/cart.service';
import { Favorite, ProductCatalogItem, PriceType } from '../../models/portal.model';
import { KmCurrencyPipe } from '../../../../core/pipes/km-currency.pipe';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, KmCurrencyPipe],
  template: `
    <div class="favorites-page">
      <div class="page-header">
        <h1>{{ 'portal.favorites.title' | translate }}</h1>
        <p class="subtitle">{{ 'portal.favorites.subtitle' | translate }}</p>
      </div>

      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>{{ 'common.loading' | translate }}</p>
        </div>
      } @else if (favorites().length === 0) {
        <div class="empty-state">
          <span class="icon">❤️</span>
          <h3>{{ 'portal.favorites.noFavorites' | translate }}</h3>
          <p>{{ 'portal.favorites.noFavoritesDesc' | translate }}</p>
          <a routerLink="/portal/catalog" class="btn btn-primary">{{ 'portal.favorites.browseCatalog' | translate }}</a>
        </div>
      } @else {
        <div class="favorites-grid">
          @for (fav of favorites(); track fav.productId) {
            <div class="favorite-card">
              <button class="remove-btn" (click)="removeFavorite(fav.productId)" [title]="'portal.favorites.remove' | translate">
                ✕
              </button>
              <div class="product-image" [routerLink]="['/portal/product', fav.product.id]">
                @if (fav.product.imageUrl) {
                  <img [src]="fav.product.imageUrl" [alt]="fav.product.name" />
                } @else {
                  <div class="placeholder-img">💊</div>
                }
              </div>
              <div class="product-info">
                <h3 [routerLink]="['/portal/product', fav.product.id]">{{ fav.product.name }}</h3>
                <p class="sku">SKU: {{ fav.product.code }}</p>
                <div class="price-row">
                  <span class="price">{{ fav.product.unitPrice | kmCurrency }}</span>
                  @if (!fav.product.isAvailable) {
                    <span class="out-of-stock">{{ 'portal.catalog.outOfStock' | translate }}</span>
                  }
                </div>
              </div>
              <div class="card-actions">
                <button class="btn btn-primary" [disabled]="!fav.product.isAvailable" (click)="addToCart(fav.product)">
                  {{ 'portal.product.addToCart' | translate }}
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .favorites-page { max-width: 1200px; margin: 0 auto; }

    .page-header { margin-bottom: 2rem; }
    .page-header h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
    .subtitle { color: var(--text-secondary); }

    .loading { text-align: center; padding: 4rem; }
    .spinner { width: 40px; height: 40px; border: 3px solid var(--border-color); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state { text-align: center; padding: 4rem 2rem; background: var(--surface-card); border-radius: 12px; }
    .empty-state .icon { font-size: 4rem; display: block; margin-bottom: 1rem; }
    .empty-state h3 { margin-bottom: 0.5rem; }
    .empty-state p { color: var(--text-secondary); margin-bottom: 1.5rem; }

    .favorites-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem; }

    .favorite-card { background: var(--surface-card); border-radius: 12px; overflow: hidden; position: relative; display: flex; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s; }
    .favorite-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }

    .remove-btn { position: absolute; top: 0.75rem; right: 0.75rem; width: 32px; height: 32px; border-radius: 50%; border: none; background: rgba(0,0,0,0.5); color: white; cursor: pointer; z-index: 2; font-size: 0.875rem; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
    .remove-btn:hover { background: var(--color-error); }

    .product-image { height: 180px; background: var(--surface-ground); display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .product-image img { width: 100%; height: 100%; object-fit: cover; }
    .placeholder-img { font-size: 4rem; }

    .product-info { padding: 1rem; flex: 1; }
    .product-info h3 { font-size: 1rem; margin-bottom: 0.25rem; cursor: pointer; }
    .product-info h3:hover { color: var(--primary-color); }
    .sku { font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.5rem; }

    .price-row { display: flex; align-items: center; gap: 0.75rem; }
    .price { font-size: 1.125rem; font-weight: 600; color: var(--primary-color); }
    .out-of-stock { font-size: 0.75rem; color: var(--color-error); background: var(--color-error-bg); padding: 0.25rem 0.5rem; border-radius: 4px; }

    .card-actions { padding: 0 1rem 1rem; }
    .btn { width: 100%; padding: 0.75rem; border-radius: 8px; border: none; cursor: pointer; font-weight: 500; }
    .btn-primary { background: var(--primary-color); color: white; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }

    @media (max-width: 640px) { .favorites-grid { grid-template-columns: repeat(2, 1fr); gap: 1rem; } }
  `]
})
export class FavoritesComponent implements OnInit {
  private catalogService = inject(CatalogService);
  private cartService = inject(CartService);

  loading = signal(true);
  favorites = signal<Favorite[]>([]);

  ngOnInit() {
    this.loadFavorites();
  }

  loadFavorites() {
    this.loading.set(true);
    this.catalogService.getFavorites().subscribe({
      next: (items) => {
        this.favorites.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  removeFavorite(productId: string) {
    this.catalogService.toggleFavorite(productId).subscribe(() => {
      this.favorites.update(items => items.filter(f => f.productId !== productId));
    });
  }

  addToCart(product: ProductCatalogItem) {
    this.cartService.addItem({
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      manufacturer: product.manufacturer,
      unitPrice: product.unitPrice,
      quantity: 1,
      maxQuantity: product.stockQuantity,
      subtotal: product.unitPrice,
      imageUrl: product.imageUrl,
      priceType: product.priceType || PriceType.Commercial
    });
  }
}
