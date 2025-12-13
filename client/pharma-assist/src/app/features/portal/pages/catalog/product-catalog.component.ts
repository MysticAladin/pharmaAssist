import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { CatalogService, PaginatedResult, PaginationParams } from '../../services/catalog.service';
import { CartService } from '../../services/cart.service';
import { ProductCatalogItem, ProductFilter, CategoryNode, PriceType } from '../../models/portal.model';
import { KmCurrencyPipe } from '../../../../core/pipes/km-currency.pipe';

@Component({
  selector: 'app-product-catalog',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule, KmCurrencyPipe],
  template: `
    <div class="catalog-page">
      <!-- Sidebar Filters -->
      <aside class="filters-sidebar" [class.open]="showMobileFilters()">
        <div class="filters-header">
          <h3>{{ 'portal.catalog.filters' | translate }}</h3>
          <button class="close-filters" (click)="showMobileFilters.set(false)">✕</button>
        </div>

        <!-- Search -->
        <div class="filter-group">
          <label>{{ 'portal.catalog.search' | translate }}</label>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange($event)"
            [placeholder]="'portal.catalog.searchPlaceholder' | translate"
            class="filter-input"
          />
        </div>

        <!-- Categories -->
        <div class="filter-group">
          <label>{{ 'portal.catalog.category' | translate }}</label>
          <div class="category-list">
            <button
              class="category-item"
              [class.active]="!selectedCategory()"
              (click)="selectCategory(null)">
              {{ 'portal.catalog.all' | translate }}
            </button>
            @for (category of categories(); track category.id) {
              <button
                class="category-item"
                [class.active]="selectedCategory() === category.id"
                (click)="selectCategory(category.id)">
                {{ category.name }}
                <span class="count">({{ category.productCount }})</span>
              </button>
            }
          </div>
        </div>

        <!-- Manufacturer -->
        <div class="filter-group">
          <label>{{ 'portal.catalog.manufacturer' | translate }}</label>
          <select [(ngModel)]="selectedManufacturer" (ngModelChange)="applyFilters()" class="filter-select">
            <option [value]="null">{{ 'portal.catalog.allManufacturers' | translate }}</option>
            @for (mfr of manufacturers(); track mfr.id) {
              <option [value]="mfr.id">{{ mfr.name }}</option>
            }
          </select>
        </div>

        <!-- Price Range -->
        <div class="filter-group">
          <label>{{ 'portal.catalog.priceRange' | translate }}</label>
          <div class="price-inputs">
            <input
              type="number"
              [(ngModel)]="minPrice"
              (ngModelChange)="applyFilters()"
              [placeholder]="'portal.catalog.min' | translate"
              class="filter-input price"
            />
            <span>-</span>
            <input
              type="number"
              [(ngModel)]="maxPrice"
              (ngModelChange)="applyFilters()"
              [placeholder]="'portal.catalog.max' | translate"
              class="filter-input price"
            />
          </div>
        </div>

        <!-- Availability -->
        <div class="filter-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              [(ngModel)]="inStockOnly"
              (ngModelChange)="applyFilters()"
            />
            {{ 'portal.catalog.inStockOnly' | translate }}
          </label>
        </div>

        <!-- Clear Filters -->
        <button class="btn btn-secondary btn-block" (click)="clearFilters()">
          {{ 'portal.catalog.clearFilters' | translate }}
        </button>
      </aside>

      <!-- Main Content -->
      <main class="catalog-main">
        <!-- Toolbar -->
        <div class="catalog-toolbar">
          <div class="toolbar-left">
            <button class="filter-toggle" (click)="showMobileFilters.set(true)">
              🔽 {{ 'portal.catalog.filters' | translate }}
            </button>
            <span class="results-count">
              {{ totalCount() }} {{ 'portal.catalog.productsFound' | translate }}
            </span>
          </div>
          <div class="toolbar-right">
            <!-- View Toggle -->
            <div class="view-toggle">
              <button
                [class.active]="viewMode() === 'grid'"
                (click)="viewMode.set('grid')"
                title="Grid view">
                ▦
              </button>
              <button
                [class.active]="viewMode() === 'list'"
                (click)="viewMode.set('list')"
                title="List view">
                ☰
              </button>
            </div>

            <!-- Sort -->
            <select [(ngModel)]="sortBy" (ngModelChange)="applyFilters()" class="sort-select">
              <option value="name">{{ 'portal.catalog.sortByName' | translate }}</option>
              <option value="price-asc">{{ 'portal.catalog.sortByPriceLow' | translate }}</option>
              <option value="price-desc">{{ 'portal.catalog.sortByPriceHigh' | translate }}</option>
              <option value="newest">{{ 'portal.catalog.sortByNewest' | translate }}</option>
            </select>
          </div>
        </div>

        <!-- Products Grid/List -->
        @if (isLoading()) {
          <div class="loading-container">
            <div class="spinner"></div>
            <p>{{ 'common.loading' | translate }}</p>
          </div>
        } @else if (products().length === 0) {
          <div class="empty-state">
            <span class="empty-icon">📦</span>
            <h3>{{ 'portal.catalog.noProducts' | translate }}</h3>
            <p>{{ 'portal.catalog.noProductsMessage' | translate }}</p>
            <button class="btn btn-primary" (click)="clearFilters()">
              {{ 'portal.catalog.clearFilters' | translate }}
            </button>
          </div>
        } @else {
          <div class="product-container" [class.list-view]="viewMode() === 'list'">
            @for (product of products(); track product.id) {
              <div class="product-card" [routerLink]="['/portal/product', product.id]">
                <div class="product-badges">
                  @if (product.requiresPrescription) {
                    <span class="product-badge rx">Rx</span>
                  }
                  @if (product.priceType) {
                    <span class="product-badge price-type" [class.essential]="product.priceType === 'essential'" [class.commercial]="product.priceType === 'commercial'">
                      {{ product.priceType === 'essential' ? 'E' : 'C' }}
                    </span>
                  }
                </div>
                <div class="product-image">
                  @if (product.imageUrl) {
                    <img [src]="product.imageUrl" [alt]="product.name" />
                  } @else {
                    <div class="image-placeholder">💊</div>
                  }
                  @if (!product.isAvailable) {
                    <div class="out-of-stock-overlay">
                      {{ 'portal.product.outOfStock' | translate }}
                    </div>
                  }
                </div>
                <div class="product-info">
                  <p class="product-code">{{ product.code }}</p>
                  <h3 class="product-name">{{ product.name }}</h3>
                  @if (product.genericName) {
                    <p class="product-generic">{{ product.genericName }}</p>
                  }
                  <p class="product-manufacturer">{{ product.manufacturer }}</p>
                  @if (product.dosageForm && product.strength) {
                    <p class="product-details">{{ product.dosageForm }} • {{ product.strength }}</p>
                  }
                  <div class="product-footer">
                    <p class="product-price">
                      @if (product.customerPrice && product.customerPrice < product.unitPrice) {
                        <span class="original-price">{{ product.unitPrice | kmCurrency }}</span>
                      }
                      {{ (product.customerPrice ?? product.unitPrice) | kmCurrency }}
                    </p>
                    <p class="product-stock" [class.low]="product.stockQuantity < 10">
                      {{ product.stockQuantity }} {{ 'portal.product.inStock' | translate }}
                    </p>
                  </div>
                </div>
                <div class="product-actions" (click)="$event.stopPropagation()">
                  <div class="quantity-control">
                    <button (click)="decrementQty(product.id)" [disabled]="getQty(product.id) <= 1">-</button>
                    <span>{{ getQty(product.id) }}</span>
                    <button (click)="incrementQty(product.id)" [disabled]="getQty(product.id) >= product.stockQuantity">+</button>
                  </div>
                  <button
                    class="btn btn-primary add-to-cart"
                    [disabled]="!product.isAvailable"
                    (click)="addToCart(product)">
                    🛒 {{ 'portal.product.add' | translate }}
                  </button>
                </div>
              </div>
            }
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="pagination">
              <button
                class="page-btn"
                [disabled]="currentPage() === 1"
                (click)="goToPage(currentPage() - 1)">
                ← {{ 'common.previous' | translate }}
              </button>

              <div class="page-numbers">
                @for (page of visiblePages(); track page) {
                  @if (page === '...') {
                    <span class="ellipsis">...</span>
                  } @else {
                    <button
                      class="page-num"
                      [class.active]="currentPage() === page"
                      (click)="goToPage(+page)">
                      {{ page }}
                    </button>
                  }
                }
              </div>

              <button
                class="page-btn"
                [disabled]="currentPage() === totalPages()"
                (click)="goToPage(currentPage() + 1)">
                {{ 'common.next' | translate }} →
              </button>
            </div>
          }
        }
      </main>
    </div>
  `,
  styles: [`
    .catalog-page {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 2rem;
      min-height: calc(100vh - 200px);
    }

    /* Sidebar */
    .filters-sidebar {
      background: var(--surface-card, white);
      border-radius: 12px;
      padding: 1.5rem;
      height: fit-content;
      position: sticky;
      top: 180px;
    }

    .filters-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .filters-header h3 {
      font-size: 1.125rem;
      font-weight: 600;
    }

    .close-filters {
      display: none;
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
    }

    .filter-group {
      margin-bottom: 1.5rem;
    }

    .filter-group label {
      display: block;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: var(--text-color, #333);
      font-size: 0.875rem;
    }

    .filter-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 0.875rem;
    }

    .filter-select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 0.875rem;
      background: white;
    }

    .category-list {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .category-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0.75rem;
      border: none;
      background: none;
      text-align: left;
      cursor: pointer;
      border-radius: 6px;
      color: var(--text-color, #333);
      font-size: 0.875rem;
    }

    .category-item:hover {
      background: var(--surface-ground);
    }

    .category-item.active {
      background: var(--primary-color);
      color: white;
    }

    .category-item .count {
      color: var(--text-secondary, #666);
      font-size: 0.75rem;
    }

    .category-item.active .count {
      color: rgba(255, 255, 255, 0.8);
    }

    .price-inputs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .filter-input.price {
      width: calc(50% - 1rem);
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    /* Toolbar */
    .catalog-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .filter-toggle {
      display: none;
      padding: 0.5rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: white;
      cursor: pointer;
    }

    .results-count {
      color: var(--text-secondary, #666);
      font-size: 0.875rem;
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .view-toggle {
      display: flex;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow: hidden;
    }

    .view-toggle button {
      padding: 0.5rem 0.75rem;
      border: none;
      background: white;
      cursor: pointer;
      font-size: 1rem;
    }

    .view-toggle button.active {
      background: var(--primary-color);
      color: white;
    }

    .sort-select {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 0.875rem;
      background: white;
    }

    /* Products Grid */
    .product-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .product-container.list-view {
      grid-template-columns: 1fr;
    }

    .product-container.list-view .product-card {
      display: grid;
      grid-template-columns: 120px 1fr auto;
      gap: 1rem;
    }

    .product-container.list-view .product-image {
      height: 120px;
    }

    .product-container.list-view .product-actions {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-end;
      padding: 1rem;
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

    .product-badges {
      position: absolute;
      top: 8px;
      left: 8px;
      display: flex;
      gap: 4px;
      z-index: 1;
    }

    .product-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .product-badge.rx {
      background: var(--color-warning);
      color: white;
    }

    .product-badge.price-type {
      width: 22px;
      height: 22px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-size: 0.625rem;
    }

    .product-badge.price-type.commercial {
      background: var(--status-processing-bg);
      color: var(--brand-primary-darker);
    }

    .product-badge.price-type.essential {
      background: var(--color-success-bg);
      color: #15803d;
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

    .out-of-stock-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
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

    .product-generic {
      font-size: 0.75rem;
      color: var(--text-secondary, #666);
      font-style: italic;
    }

    .product-manufacturer {
      font-size: 0.875rem;
      color: var(--text-secondary, #666);
      margin-bottom: 0.25rem;
    }

    .product-details {
      font-size: 0.75rem;
      color: var(--text-secondary, #666);
    }

    .product-footer {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-top: 0.5rem;
    }

    .product-price {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--primary-color);
    }

    .original-price {
      text-decoration: line-through;
      color: var(--text-secondary, #666);
      font-size: 0.875rem;
      margin-right: 0.5rem;
    }

    .product-stock {
      font-size: 0.75rem;
      color: var(--color-success);
    }

    .product-stock.low {
      color: var(--color-warning);
    }

    .product-actions {
      padding: 0 1rem 1rem;
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .quantity-control {
      display: flex;
      align-items: center;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      overflow: hidden;
    }

    .quantity-control button {
      width: 32px;
      height: 32px;
      border: none;
      background: var(--surface-ground);
      cursor: pointer;
      font-size: 1rem;
    }

    .quantity-control button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .quantity-control span {
      width: 40px;
      text-align: center;
      font-weight: 500;
    }

    .add-to-cart {
      flex: 1;
      padding: 0.5rem;
      font-size: 0.875rem;
    }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border-color);
    }

    .page-btn {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      background: white;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-numbers {
      display: flex;
      gap: 0.25rem;
    }

    .page-num {
      width: 36px;
      height: 36px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      background: white;
      cursor: pointer;
    }

    .page-num.active {
      background: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
    }

    .ellipsis {
      padding: 0 0.5rem;
      color: var(--text-secondary, #666);
    }

    /* Loading & Empty */
    .loading-container {
      text-align: center;
      padding: 4rem 2rem;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid var(--surface-ground);
      border-top-color: var(--primary-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
    }

    .empty-icon {
      font-size: 4rem;
      display: block;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      font-size: 1.25rem;
      margin-bottom: 0.5rem;
    }

    .empty-state p {
      color: var(--text-secondary, #666);
      margin-bottom: 1.5rem;
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
      border: none;
      cursor: pointer;
    }

    .btn-primary {
      background: var(--primary-color);
      color: white;
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: var(--surface-ground);
      color: var(--text-color, #333);
    }

    .btn-block {
      width: 100%;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .catalog-page {
        grid-template-columns: 1fr;
      }

      .filters-sidebar {
        position: fixed;
        top: 0;
        left: -300px;
        bottom: 0;
        width: 280px;
        z-index: 1000;
        border-radius: 0;
        transition: left 0.3s ease;
        overflow-y: auto;
      }

      .filters-sidebar.open {
        left: 0;
      }

      .close-filters {
        display: block;
      }

      .filter-toggle {
        display: flex;
      }
    }

    @media (max-width: 640px) {
      .product-container {
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
      }

      .product-container.list-view {
        grid-template-columns: 1fr;
      }

      .product-container.list-view .product-card {
        grid-template-columns: 1fr;
      }

      .toolbar-right {
        width: 100%;
        justify-content: space-between;
      }
    }
  `]
})
export class ProductCatalogComponent implements OnInit, OnDestroy {
  private catalogService = inject(CatalogService);
  private cartService = inject(CartService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  // State
  isLoading = signal(true);
  products = signal<ProductCatalogItem[]>([]);
  categories = signal<CategoryNode[]>([]);
  manufacturers = signal<{ id: string; name: string }[]>([]);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(20);
  totalCount = signal(0);
  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()));

  // Filters
  searchQuery = '';
  selectedCategory = signal<string | null>(null);
  categorySlug = signal<string | null>(null); // For nav links like 'medications', 'medical-supplies'
  selectedManufacturer: string | null = null;
  minPrice: number | null = null;
  maxPrice: number | null = null;
  inStockOnly = false;
  sortBy = 'name';

  // UI
  viewMode = signal<'grid' | 'list'>('grid');
  showMobileFilters = signal(false);

  // Quantity tracking for quick add
  private quantities = new Map<string, number>();

  // Search debounce
  private searchSubject = new Subject<string>();

  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');

      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
      }

      if (current < total - 2) pages.push('...');
      pages.push(total);
    }

    return pages;
  });

  ngOnInit() {
    // Setup search debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage.set(1);
      this.loadProducts();
    });

    // Load filters
    this.loadCategories();
    this.loadManufacturers();

    // Handle route params
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['search']) this.searchQuery = params['search'];
      if (params['category']) {
        const categoryParam = params['category'];
        // Check if it's a GUID (ID) or a slug/name
        const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryParam);
        if (isGuid) {
          this.selectedCategory.set(categoryParam);
          this.categorySlug.set(null);
        } else {
          this.categorySlug.set(categoryParam);
          this.selectedCategory.set(null);
        }
      }
      if (params['manufacturer']) this.selectedManufacturer = params['manufacturer'];
      this.loadProducts();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProducts() {
    this.isLoading.set(true);

    const filter: ProductFilter = {};
    if (this.searchQuery) filter.search = this.searchQuery;
    if (this.categorySlug()) filter.category = this.categorySlug()!;
    if (this.selectedCategory()) filter.categoryId = this.selectedCategory()!;
    if (this.selectedManufacturer) filter.manufacturerId = this.selectedManufacturer;
    if (this.minPrice) filter.minPrice = this.minPrice;
    if (this.maxPrice) filter.maxPrice = this.maxPrice;
    if (this.inStockOnly) filter.inStockOnly = true;

    const pagination: PaginationParams = {
      page: this.currentPage(),
      pageSize: this.pageSize(),
      sortBy: this.sortBy.replace('-asc', '').replace('-desc', ''),
      sortOrder: this.sortBy.includes('-desc') ? 'desc' : 'asc'
    };

    this.catalogService.getProducts(filter, pagination).subscribe({
      next: (result) => {
        this.products.set(result.items);
        this.totalCount.set(result.totalCount);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        // Use mock data for demo
        this.products.set(this.getMockProducts());
        this.totalCount.set(20);
      }
    });
  }

  private loadCategories() {
    this.catalogService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: () => this.categories.set(this.getMockCategories())
    });
  }

  private loadManufacturers() {
    this.catalogService.getManufacturers().subscribe({
      next: (mfrs) => this.manufacturers.set(mfrs),
      error: () => this.manufacturers.set([
        { id: '1', name: 'Bayer' },
        { id: '2', name: 'Hemofarm' },
        { id: '3', name: 'Bosnalijek' },
        { id: '4', name: 'Pliva' }
      ])
    });
  }

  onSearchChange(value: string) {
    this.searchSubject.next(value);
  }

  selectCategory(categoryId: string | null) {
    this.selectedCategory.set(categoryId);
    this.categorySlug.set(null); // Clear slug when selecting from sidebar
    this.currentPage.set(1);
    this.loadProducts();
  }

  applyFilters() {
    this.currentPage.set(1);
    this.loadProducts();
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedCategory.set(null);
    this.categorySlug.set(null);
    this.selectedManufacturer = null;
    this.minPrice = null;
    this.maxPrice = null;
    this.inStockOnly = false;
    this.sortBy = 'name';
    this.currentPage.set(1);
    this.loadProducts();
  }

  goToPage(page: number) {
    this.currentPage.set(page);
    this.loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getQty(productId: string): number {
    return this.quantities.get(productId) ?? 1;
  }

  incrementQty(productId: string) {
    const current = this.getQty(productId);
    this.quantities.set(productId, current + 1);
  }

  decrementQty(productId: string) {
    const current = this.getQty(productId);
    if (current > 1) {
      this.quantities.set(productId, current - 1);
    }
  }

  addToCart(product: ProductCatalogItem) {
    const qty = this.getQty(product.id);
    this.cartService.addItem(product, qty);
    this.quantities.delete(product.id); // Reset after adding
  }

  private getMockProducts(): ProductCatalogItem[] {
    return [
      { id: '1', code: 'MED-001', name: 'Aspirin 500mg', manufacturer: 'Bayer', manufacturerId: '1', category: 'Pain Relief', categoryId: '1', unitPrice: 8.50, stockQuantity: 150, isAvailable: true, requiresPrescription: false, priceType: PriceType.Commercial },
      { id: '2', code: 'MED-002', name: 'Ibuprofen 400mg', manufacturer: 'Hemofarm', manufacturerId: '2', category: 'Pain Relief', categoryId: '1', unitPrice: 12.00, stockQuantity: 200, isAvailable: true, requiresPrescription: false, priceType: PriceType.Essential },
      { id: '3', code: 'MED-003', name: 'Amoxicillin 500mg', manufacturer: 'Bosnalijek', manufacturerId: '3', category: 'Antibiotics', categoryId: '2', unitPrice: 25.00, stockQuantity: 75, isAvailable: true, requiresPrescription: true, priceType: PriceType.Essential },
      { id: '4', code: 'MED-004', name: 'Vitamin C 1000mg', manufacturer: 'Pliva', manufacturerId: '4', category: 'Vitamins', categoryId: '3', unitPrice: 15.50, stockQuantity: 300, isAvailable: true, requiresPrescription: false, priceType: PriceType.Commercial },
      { id: '5', code: 'MED-005', name: 'Paracetamol 500mg', manufacturer: 'Bayer', manufacturerId: '1', category: 'Pain Relief', categoryId: '1', unitPrice: 6.00, stockQuantity: 0, isAvailable: false, requiresPrescription: false, priceType: PriceType.Commercial },
      { id: '6', code: 'MED-006', name: 'Omeprazole 20mg', manufacturer: 'Hemofarm', manufacturerId: '2', category: 'Digestive', categoryId: '4', unitPrice: 18.00, stockQuantity: 120, isAvailable: true, requiresPrescription: true, priceType: PriceType.Essential },
    ];
  }

  private getMockCategories(): CategoryNode[] {
    return [
      { id: '1', name: 'Pain Relief', productCount: 45 },
      { id: '2', name: 'Antibiotics', productCount: 32 },
      { id: '3', name: 'Vitamins', productCount: 28 },
      { id: '4', name: 'Digestive', productCount: 15 },
      { id: '5', name: 'Cardiovascular', productCount: 22 },
    ];
  }
}
