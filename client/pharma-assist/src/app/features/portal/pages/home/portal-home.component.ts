import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CatalogService } from '../../services/catalog.service';
import { CartService } from '../../services/cart.service';
import { ProductCatalogItem, ReorderSuggestion, PriceType } from '../../models/portal.model';
import { KmCurrencyPipe } from '../../../../core/pipes/km-currency.pipe';

@Component({
  selector: 'app-portal-home',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, KmCurrencyPipe],
  template: `
    <div class="portal-home">
      <!-- Hero Banner -->
      <section class="hero-banner">
        <div class="hero-content">
          <h1>{{ 'portal.home.welcome' | translate }}</h1>
          <p>{{ 'portal.home.subtitle' | translate }}</p>
          <div class="hero-actions">
            <a routerLink="/portal/catalog" class="btn btn-primary">
              {{ 'portal.home.browseCatalog' | translate }}
            </a>
            <a routerLink="/portal/quick-order" class="btn btn-secondary">
              {{ 'portal.quickOrder.title' | translate }}
            </a>
          </div>
        </div>
      </section>

      <!-- Quick Stats -->
      <section class="quick-stats">
        <div class="stat-card">
          <span class="stat-icon">📦</span>
          <div class="stat-info">
            <span class="stat-value">{{ pendingOrders() }}</span>
            <span class="stat-label">{{ 'portal.home.pendingOrders' | translate }}</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">❤️</span>
          <div class="stat-info">
            <span class="stat-value">{{ favoriteCount() }}</span>
            <span class="stat-label">{{ 'portal.home.savedProducts' | translate }}</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">🛒</span>
          <div class="stat-info">
            <span class="stat-value">{{ cartItemCount() }}</span>
            <span class="stat-label">{{ 'portal.home.itemsInCart' | translate }}</span>
          </div>
        </div>
        <div class="stat-card clickable" routerLink="/portal/orders">
          <span class="stat-icon">📋</span>
          <div class="stat-info">
            <span class="stat-value">{{ totalOrders() }}</span>
            <span class="stat-label">{{ 'portal.home.totalOrders' | translate }}</span>
          </div>
        </div>
      </section>

      <!-- Reorder Suggestions -->
      @if (reorderSuggestions().length > 0) {
        <section class="section">
          <div class="section-header">
            <h2>{{ 'portal.home.reorderSuggestions' | translate }}</h2>
            <p class="section-subtitle">{{ 'portal.home.reorderSubtitle' | translate }}</p>
          </div>
          <div class="product-grid">
            @for (suggestion of reorderSuggestions(); track suggestion.product.id) {
              <div class="product-card reorder-card">
                <div class="product-image">
                  @if (suggestion.product.imageUrl) {
                    <img [src]="suggestion.product.imageUrl" [alt]="suggestion.product.name" />
                  } @else {
                    <div class="image-placeholder">💊</div>
                  }
                </div>
                <div class="product-info">
                  <h3 class="product-name">{{ suggestion.product.name }}</h3>
                  <p class="product-manufacturer">{{ suggestion.product.manufacturer }}</p>
                  <p class="product-price">{{ suggestion.product.unitPrice | kmCurrency }}</p>
                  <p class="reorder-info">
                    {{ 'portal.home.lastOrdered' | translate }}: {{ suggestion.lastOrderDate | date:'mediumDate' }}
                  </p>
                </div>
                <div class="product-actions">
                  <button class="btn btn-primary btn-sm" (click)="addToCart(suggestion.product, suggestion.usualQuantity)">
                    {{ 'portal.home.reorderQty' | translate:{ qty: suggestion.usualQuantity } }}
                  </button>
                </div>
              </div>
            }
          </div>
        </section>
      }

      <!-- Featured Products -->
      <section class="section">
        <div class="section-header">
          <h2>{{ 'portal.home.featuredProducts' | translate }}</h2>
          <a routerLink="/portal/catalog" class="view-all">{{ 'common.viewAll' | translate }} →</a>
        </div>
        @if (isLoading()) {
          <div class="loading-grid">
            @for (i of [1,2,3,4]; track i) {
              <div class="product-card skeleton"></div>
            }
          </div>
        } @else {
          <div class="product-grid">
            @for (product of featuredProducts(); track product.id) {
              <div class="product-card" [routerLink]="['/portal/product', product.id]">
                <div class="product-image">
                  @if (product.imageUrl) {
                    <img [src]="product.imageUrl" [alt]="product.name" />
                  } @else {
                    <div class="image-placeholder">💊</div>
                  }
                  @if (!product.isAvailable) {
                    <div class="out-of-stock-badge">{{ 'portal.product.outOfStock' | translate }}</div>
                  }
                </div>
                <div class="product-info">
                  <p class="product-code">{{ product.code }}</p>
                  <h3 class="product-name">{{ product.name }}</h3>
                  <p class="product-manufacturer">{{ product.manufacturer }}</p>
                  <p class="product-price">
                    {{ (product.customerPrice ?? product.unitPrice) | kmCurrency }}
                  </p>
                </div>
                <div class="product-actions" (click)="$event.stopPropagation()">
                  <button
                    class="btn btn-primary btn-sm"
                    [disabled]="!product.isAvailable"
                    (click)="addToCart(product)">
                    🛒 {{ 'portal.product.addToCart' | translate }}
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </section>

      <!-- New Arrivals -->
      <section class="section">
        <div class="section-header">
          <h2>{{ 'portal.home.newArrivals' | translate }}</h2>
          <a routerLink="/portal/catalog" [queryParams]="{sort: 'newest'}" class="view-all">
            {{ 'common.viewAll' | translate }} →
          </a>
        </div>
        <div class="product-grid">
          @for (product of newArrivals(); track product.id) {
            <div class="product-card" [routerLink]="['/portal/product', product.id]">
              <div class="product-badge new">{{ 'portal.product.new' | translate }}</div>
              <div class="product-image">
                @if (product.imageUrl) {
                  <img [src]="product.imageUrl" [alt]="product.name" />
                } @else {
                  <div class="image-placeholder">💊</div>
                }
              </div>
              <div class="product-info">
                <p class="product-code">{{ product.code }}</p>
                <h3 class="product-name">{{ product.name }}</h3>
                <p class="product-manufacturer">{{ product.manufacturer }}</p>
                <p class="product-price">
                  {{ (product.customerPrice ?? product.unitPrice) | kmCurrency }}
                </p>
              </div>
              <div class="product-actions" (click)="$event.stopPropagation()">
                <button
                  class="btn btn-primary btn-sm"
                  [disabled]="!product.isAvailable"
                  (click)="addToCart(product)">
                  🛒 {{ 'portal.product.addToCart' | translate }}
                </button>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Categories -->
      <section class="section categories-section">
        <div class="section-header">
          <h2>{{ 'portal.home.browseByCategory' | translate }}</h2>
        </div>
        <div class="category-grid">
          <a routerLink="/portal/catalog" [queryParams]="{category: 'medications'}" class="category-card">
            <span class="category-icon">💊</span>
            <span class="category-name">{{ 'portal.categories.medications' | translate }}</span>
          </a>
          <a routerLink="/portal/catalog" [queryParams]="{category: 'medical-supplies'}" class="category-card">
            <span class="category-icon">🩹</span>
            <span class="category-name">{{ 'portal.categories.medicalSupplies' | translate }}</span>
          </a>
          <a routerLink="/portal/catalog" [queryParams]="{category: 'equipment'}" class="category-card">
            <span class="category-icon">🔬</span>
            <span class="category-name">{{ 'portal.categories.equipment' | translate }}</span>
          </a>
          <a routerLink="/portal/catalog" [queryParams]="{category: 'hygiene'}" class="category-card">
            <span class="category-icon">🧴</span>
            <span class="category-name">{{ 'portal.categories.hygiene' | translate }}</span>
          </a>
          <a routerLink="/portal/catalog" [queryParams]="{category: 'vitamins'}" class="category-card">
            <span class="category-icon">💉</span>
            <span class="category-name">{{ 'portal.categories.vitamins' | translate }}</span>
          </a>
          <a routerLink="/portal/catalog" [queryParams]="{category: 'first-aid'}" class="category-card">
            <span class="category-icon">🏥</span>
            <span class="category-name">{{ 'portal.categories.firstAid' | translate }}</span>
          </a>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .portal-home {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    /* Hero Banner */
    .hero-banner {
      background: linear-gradient(135deg, var(--primary-color) 0%, #1e40af 100%);
      border-radius: 16px;
      padding: 3rem;
      color: white;
    }

    .hero-content h1 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .hero-content p {
      opacity: 0.9;
      margin-bottom: 1.5rem;
    }

    .hero-actions {
      display: flex;
      gap: 1rem;
    }

    /* Quick Stats */
    .quick-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      background: var(--surface-card, white);
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .stat-card.clickable {
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .stat-card.clickable:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .stat-icon {
      font-size: 2rem;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-color, #333);
      display: block;
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--text-secondary, #666);
    }

    /* Sections */
    .section {
      margin-top: 1rem;
    }

    .section-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }

    .section-header h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-color, #333);
    }

    .section-subtitle {
      color: var(--text-secondary, #666);
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .view-all {
      color: var(--primary-color);
      text-decoration: none;
      font-weight: 500;
    }

    .view-all:hover {
      text-decoration: underline;
    }

    /* Product Grid */
    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .product-card {
      background: var(--surface-card, white);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      position: relative;
    }

    .product-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }

    .product-image {
      height: 160px;
      background: var(--surface-ground);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .product-image img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .image-placeholder {
      font-size: 3rem;
      opacity: 0.5;
    }

    .out-of-stock-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      background: var(--color-error);
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .product-badge {
      position: absolute;
      top: 8px;
      left: 8px;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      z-index: 1;
    }

    .product-badge.new {
      background: var(--color-success);
      color: white;
    }

    .product-info {
      padding: 1rem;
    }

    .product-code {
      font-size: 0.75rem;
      color: var(--text-secondary, #666);
      margin-bottom: 0.25rem;
    }

    .product-name {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-color, #333);
      margin-bottom: 0.25rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .product-manufacturer {
      font-size: 0.875rem;
      color: var(--text-secondary, #666);
      margin-bottom: 0.5rem;
    }

    .product-price {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--primary-color);
    }

    .reorder-info {
      font-size: 0.75rem;
      color: var(--text-secondary, #666);
      margin-top: 0.5rem;
    }

    .product-actions {
      padding: 0 1rem 1rem;
    }

    /* Category Grid */
    .category-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 1rem;
    }

    .category-card {
      background: var(--surface-card, white);
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
      text-decoration: none;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .category-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }

    .category-icon {
      font-size: 2.5rem;
      display: block;
      margin-bottom: 0.75rem;
    }

    .category-name {
      font-weight: 500;
      color: var(--text-color, #333);
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 500;
      text-decoration: none;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: var(--primary-color);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--brand-primary-dark);
    }

    .btn-secondary {
      background: white;
      color: var(--text-color, #333);
      border: 1px solid var(--border-color);
    }

    .btn-secondary:hover {
      background: var(--surface-ground);
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      width: 100%;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Loading */
    .loading-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .skeleton {
      height: 300px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .hero-banner {
        padding: 2rem 1.5rem;
      }

      .hero-content h1 {
        font-size: 1.5rem;
      }

      .hero-actions {
        flex-direction: column;
      }

      .product-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
      }
    }
  `]
})
export class PortalHomeComponent implements OnInit {
  private catalogService = inject(CatalogService);
  private cartService = inject(CartService);

  isLoading = signal(true);
  featuredProducts = signal<ProductCatalogItem[]>([]);
  newArrivals = signal<ProductCatalogItem[]>([]);
  reorderSuggestions = signal<ReorderSuggestion[]>([]);

  // Stats
  pendingOrders = signal(0);
  favoriteCount = signal(0);
  totalOrders = signal(0);

  cartItemCount = computed(() => this.cartService.itemCount());

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    // Load featured products
    this.catalogService.getFeaturedProducts().subscribe({
      next: (products) => {
        this.featuredProducts.set(products);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        // Use mock data for demo
        this.featuredProducts.set(this.getMockProducts());
      }
    });

    // Load new arrivals
    this.catalogService.getNewArrivals().subscribe({
      next: (products) => this.newArrivals.set(products),
      error: () => this.newArrivals.set(this.getMockProducts().slice(0, 4))
    });

    // Load reorder suggestions
    this.catalogService.getReorderSuggestions().subscribe({
      next: (suggestions) => this.reorderSuggestions.set(suggestions),
      error: () => {} // Silently fail
    });
  }

  addToCart(product: ProductCatalogItem, quantity: number = 1) {
    this.cartService.addItem(product, quantity);
  }

  private getMockProducts(): ProductCatalogItem[] {
    return [
      {
        id: '1',
        code: 'MED-001',
        name: 'Aspirin 500mg',
        manufacturer: 'Bayer',
        manufacturerId: '1',
        category: 'Pain Relief',
        categoryId: '1',
        unitPrice: 8.50,
        stockQuantity: 150,
        isAvailable: true,
        requiresPrescription: false,
        priceType: PriceType.Commercial
      },
      {
        id: '2',
        code: 'MED-002',
        name: 'Ibuprofen 400mg',
        manufacturer: 'Hemofarm',
        manufacturerId: '2',
        category: 'Pain Relief',
        categoryId: '1',
        unitPrice: 12.00,
        stockQuantity: 200,
        isAvailable: true,
        requiresPrescription: false,
        priceType: PriceType.Essential
      },
      {
        id: '3',
        code: 'MED-003',
        name: 'Amoxicillin 500mg',
        manufacturer: 'Bosnalijek',
        manufacturerId: '3',
        category: 'Antibiotics',
        categoryId: '2',
        unitPrice: 25.00,
        stockQuantity: 75,
        isAvailable: true,
        requiresPrescription: true,
        priceType: PriceType.Essential
      },
      {
        id: '4',
        code: 'MED-004',
        name: 'Vitamin C 1000mg',
        manufacturer: 'Pliva',
        manufacturerId: '4',
        category: 'Vitamins',
        categoryId: '3',
        unitPrice: 15.50,
        stockQuantity: 300,
        isAvailable: true,
        requiresPrescription: false,
        priceType: PriceType.Commercial
      }
    ];
  }
}
