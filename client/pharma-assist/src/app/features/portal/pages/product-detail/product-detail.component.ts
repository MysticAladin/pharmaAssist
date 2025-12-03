import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CatalogService } from '../../services/catalog.service';
import { CartService } from '../../services/cart.service';
import { ProductCatalogItem } from '../../models/portal.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <div class="product-detail">
      @if (isLoading()) {
        <div class="loading">{{ 'common.loading' | translate }}...</div>
      } @else if (product()) {
        <div class="product-content">
          <div class="product-gallery">
            <div class="main-image">
              @if (product()!.imageUrl) {
                <img [src]="product()!.imageUrl" [alt]="product()!.name" />
              } @else {
                <div class="image-placeholder">💊</div>
              }
            </div>
          </div>

          <div class="product-info">
            <p class="product-code">{{ product()!.code }}</p>
            <h1>{{ product()!.name }}</h1>
            @if (product()!.genericName) {
              <p class="generic-name">{{ product()!.genericName }}</p>
            }
            <p class="manufacturer">{{ 'portal.product.by' | translate }} {{ product()!.manufacturer }}</p>

            <div class="price-section">
              <span class="price">{{ (product()!.customerPrice ?? product()!.unitPrice) | currency:'BAM':'symbol':'1.2-2' }}</span>
              @if (product()?.customerPrice && product()!.customerPrice! < product()!.unitPrice) {
                <span class="original-price">{{ product()!.unitPrice | currency:'BAM':'symbol':'1.2-2' }}</span>
              }
            </div>

            <div class="stock-info" [class.low]="product()!.stockQuantity < 10" [class.out]="!product()!.isAvailable">
              @if (product()!.isAvailable) {
                ✓ {{ product()!.stockQuantity }} {{ 'portal.product.inStock' | translate }}
              } @else {
                ✗ {{ 'portal.product.outOfStock' | translate }}
              }
            </div>

            @if (product()!.requiresPrescription) {
              <div class="prescription-warning">
                ⚠️ {{ 'portal.product.requiresPrescription' | translate }}
              </div>
            }

            <div class="add-to-cart-section">
              <div class="quantity-control">
                <button (click)="decrementQty()" [disabled]="quantity() <= 1">-</button>
                <span>{{ quantity() }}</span>
                <button (click)="incrementQty()" [disabled]="quantity() >= product()!.stockQuantity">+</button>
              </div>
              <button
                class="btn btn-primary btn-lg"
                [disabled]="!product()!.isAvailable"
                (click)="addToCart()">
                🛒 {{ 'portal.product.addToCart' | translate }}
              </button>
            </div>

            <div class="product-details">
              <h3>{{ 'portal.product.details' | translate }}</h3>
              <dl>
                @if (product()!.dosageForm) {
                  <dt>{{ 'portal.product.dosageForm' | translate }}</dt>
                  <dd>{{ product()!.dosageForm }}</dd>
                }
                @if (product()!.strength) {
                  <dt>{{ 'portal.product.strength' | translate }}</dt>
                  <dd>{{ product()!.strength }}</dd>
                }
                @if (product()!.packSize) {
                  <dt>{{ 'portal.product.packSize' | translate }}</dt>
                  <dd>{{ product()!.packSize }}</dd>
                }
                <dt>{{ 'portal.product.category' | translate }}</dt>
                <dd>{{ product()!.category }}</dd>
              </dl>
            </div>

            @if (product()!.description) {
              <div class="product-description">
                <h3>{{ 'portal.product.description' | translate }}</h3>
                <p>{{ product()!.description }}</p>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .product-detail { max-width: 1200px; margin: 0 auto; }
    .product-content { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; }
    .main-image { background: var(--surface-card, white); border-radius: 12px; padding: 2rem; display: flex; align-items: center; justify-content: center; min-height: 400px; }
    .main-image img { max-width: 100%; max-height: 400px; object-fit: contain; }
    .image-placeholder { font-size: 6rem; opacity: 0.3; }
    .product-code { color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem; }
    h1 { font-size: 1.75rem; margin-bottom: 0.5rem; }
    .generic-name { font-style: italic; color: var(--text-secondary); }
    .manufacturer { color: var(--text-secondary); margin-bottom: 1.5rem; }
    .price-section { margin-bottom: 1rem; }
    .price { font-size: 2rem; font-weight: 700; color: var(--primary-color); }
    .original-price { text-decoration: line-through; color: var(--text-secondary); margin-left: 0.5rem; }
    .stock-info { padding: 0.5rem 1rem; border-radius: 6px; display: inline-block; margin-bottom: 1rem; background: #d1fae5; color: #059669; }
    .stock-info.low { background: #fef3c7; color: #d97706; }
    .stock-info.out { background: #fee2e2; color: #dc2626; }
    .prescription-warning { background: #fef3c7; color: #d97706; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; }
    .add-to-cart-section { display: flex; gap: 1rem; margin-bottom: 2rem; }
    .quantity-control { display: flex; align-items: center; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; }
    .quantity-control button { width: 48px; height: 48px; border: none; background: var(--surface-ground); cursor: pointer; font-size: 1.25rem; }
    .quantity-control button:disabled { opacity: 0.5; }
    .quantity-control span { width: 60px; text-align: center; font-weight: 600; font-size: 1.125rem; }
    .btn { padding: 0.75rem 2rem; border-radius: 8px; border: none; cursor: pointer; font-weight: 500; }
    .btn-primary { background: var(--primary-color); color: white; }
    .btn-lg { padding: 1rem 2rem; font-size: 1.125rem; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .product-details, .product-description { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .product-details h3, .product-description h3 { font-size: 1rem; margin-bottom: 1rem; }
    dl { display: grid; grid-template-columns: 1fr 2fr; gap: 0.5rem; }
    dt { color: var(--text-secondary); }
    .loading { text-align: center; padding: 4rem; }
    @media (max-width: 768px) { .product-content { grid-template-columns: 1fr; } }
  `]
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private catalogService = inject(CatalogService);
  private cartService = inject(CartService);

  isLoading = signal(true);
  product = signal<ProductCatalogItem | null>(null);
  quantity = signal(1);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.catalogService.getProduct(id).subscribe({
        next: (product) => { this.product.set(product); this.isLoading.set(false); },
        error: () => { this.isLoading.set(false); }
      });
    }
  }

  incrementQty() { this.quantity.update(q => q + 1); }
  decrementQty() { this.quantity.update(q => Math.max(1, q - 1)); }

  addToCart() {
    const p = this.product();
    if (p) {
      this.cartService.addItem(p, this.quantity());
      this.quantity.set(1);
    }
  }
}
