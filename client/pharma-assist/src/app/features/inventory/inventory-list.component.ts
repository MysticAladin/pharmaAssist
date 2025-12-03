import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InventoryService } from '../../core/services/inventory.service';
import { NotificationService } from '../../core/services/notification.service';
import { StockLevel, InventoryFilters, Location } from '../../core/models/inventory.model';
import { PagedResponse } from '../../core/models/product.model';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { SearchInputComponent } from '../../shared/components/search-input/search-input.component';
import { BadgeVariant } from '../../shared/components/status-badge';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslateModule,
    PaginationComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    SearchInputComponent
  ],
  template: `
    <div class="inventory-page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="title-section">
            <h1>{{ 'inventory.title' | translate }}</h1>
            <p class="subtitle">{{ 'inventory.subtitle' | translate }}</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-secondary" routerLink="adjustments">
              <i class="icon-sliders"></i>
              {{ 'inventory.adjustments' | translate }}
            </button>
            <button class="btn btn-secondary" routerLink="transfers">
              <i class="icon-truck"></i>
              {{ 'inventory.transfers' | translate }}
            </button>
            <button class="btn btn-primary" routerLink="adjustments/new">
              <i class="icon-plus"></i>
              {{ 'inventory.newAdjustment' | translate }}
            </button>
          </div>
        </div>
      </header>

      <!-- Quick Stats -->
      <section class="stats-section">
        <div class="stat-card warning">
          <div class="stat-icon">
            <i class="icon-alert-triangle"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ lowStockCount() }}</span>
            <span class="stat-label">{{ 'inventory.lowStock' | translate }}</span>
          </div>
        </div>
        <div class="stat-card danger">
          <div class="stat-icon">
            <i class="icon-clock"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ expiringSoonCount() }}</span>
            <span class="stat-label">{{ 'inventory.expiringSoon' | translate }}</span>
          </div>
        </div>
        <div class="stat-card info">
          <div class="stat-icon">
            <i class="icon-package"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ totalProducts() }}</span>
            <span class="stat-label">{{ 'inventory.totalProducts' | translate }}</span>
          </div>
        </div>
      </section>

      <!-- Filters -->
      <section class="filters-section">
        <div class="filter-row">
          <app-search-input
            [placeholder]="'inventory.searchPlaceholder' | translate"
            (searchChange)="onSearch($event)">
          </app-search-input>

          <select class="form-select" [(ngModel)]="selectedLocationId" (change)="onLocationChange()">
            <option [value]="null">{{ 'inventory.allLocations' | translate }}</option>
            @for (location of locations(); track location.id) {
              <option [value]="location.id">{{ location.name }}</option>
            }
          </select>

          <div class="filter-toggles">
            <label class="toggle-label">
              <input type="checkbox" [(ngModel)]="showLowStockOnly" (change)="applyFilters()">
              <span>{{ 'inventory.lowStockOnly' | translate }}</span>
            </label>
            <label class="toggle-label">
              <input type="checkbox" [(ngModel)]="showExpiringSoonOnly" (change)="applyFilters()">
              <span>{{ 'inventory.expiringSoonOnly' | translate }}</span>
            </label>
          </div>
        </div>
      </section>

      <!-- Stock Table -->
      <section class="table-section">
        @if (loading()) {
          <div class="loading-container">
            <div class="spinner"></div>
            <span>{{ 'common.loading' | translate }}</span>
          </div>
        } @else if (stockLevels().length === 0) {
          <app-empty-state
            icon="package"
            [title]="'inventory.noProducts' | translate"
            [description]="'inventory.noProductsDescription' | translate">
          </app-empty-state>
        } @else {
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ 'inventory.product' | translate }}</th>
                  <th>{{ 'inventory.sku' | translate }}</th>
                  <th>{{ 'inventory.location' | translate }}</th>
                  <th class="text-right">{{ 'inventory.available' | translate }}</th>
                  <th class="text-right">{{ 'inventory.reserved' | translate }}</th>
                  <th class="text-right">{{ 'inventory.total' | translate }}</th>
                  <th class="text-center">{{ 'inventory.status' | translate }}</th>
                  <th>{{ 'inventory.batches' | translate }}</th>
                  <th class="text-center">{{ 'common.actions' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                @for (stock of stockLevels(); track stock.productId) {
                  <tr [class.low-stock]="stock.isLowStock">
                    <td>
                      <div class="product-info">
                        <span class="product-name">{{ stock.productName }}</span>
                      </div>
                    </td>
                    <td>
                      <code class="sku">{{ stock.productSku }}</code>
                    </td>
                    <td>{{ stock.locationName }}</td>
                    <td class="text-right">
                      <span [class.text-danger]="stock.availableQuantity < stock.reorderLevel">
                        {{ stock.availableQuantity }}
                      </span>
                    </td>
                    <td class="text-right">{{ stock.reservedQuantity }}</td>
                    <td class="text-right">
                      <strong>{{ stock.totalQuantity }}</strong>
                    </td>
                    <td class="text-center">
                      <app-status-badge
                        [variant]="getStockStatus(stock).variant"
                        [label]="getStockStatus(stock).label | translate">
                      </app-status-badge>
                    </td>
                    <td>
                      <div class="batch-summary">
                        @if (stock.batches.length > 0) {
                          <span class="batch-count">{{ stock.batches.length }} {{ 'inventory.batchCount' | translate }}</span>
                          @if (hasExpiringBatches(stock)) {
                            <span class="expiring-badge">
                              <i class="icon-alert-circle"></i>
                              {{ getExpiringBatchCount(stock) }} {{ 'inventory.expiring' | translate }}
                            </span>
                          }
                        } @else {
                          <span class="no-batches">-</span>
                        }
                      </div>
                    </td>
                    <td class="text-center">
                      <div class="action-buttons">
                        <button
                          class="btn btn-icon btn-sm"
                          [title]="'inventory.viewDetails' | translate"
                          (click)="viewProductDetails(stock.productId)">
                          <i class="icon-eye"></i>
                        </button>
                        <button
                          class="btn btn-icon btn-sm"
                          [title]="'inventory.adjust' | translate"
                          (click)="adjustStock(stock)">
                          <i class="icon-edit"></i>
                        </button>
                        <button
                          class="btn btn-icon btn-sm"
                          [title]="'inventory.history' | translate"
                          (click)="viewHistory(stock.productId)">
                          <i class="icon-list"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <app-pagination
            [page]="currentPage()"
            [size]="pageSize()"
            [totalItems]="totalItems()"
            (pageChange)="onPageChange($event)">
          </app-pagination>
        }
      </section>
    </div>
  `,
  styles: [`
    .inventory-page {
      padding: 1.5rem;
    }

    .page-header {
      margin-bottom: 1.5rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .title-section h1 {
      margin: 0 0 0.25rem;
      font-size: 1.75rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .subtitle {
      margin: 0;
      color: var(--text-secondary);
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    /* Stats Section */
    .stats-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: var(--surface);
      border-radius: 8px;
      border-left: 4px solid transparent;
    }

    .stat-card.warning {
      border-left-color: var(--color-warning);
    }

    .stat-card.danger {
      border-left-color: var(--color-danger);
    }

    .stat-card.info {
      border-left-color: var(--color-info);
    }

    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 8px;
      font-size: 1.5rem;
    }

    .stat-card.warning .stat-icon {
      background: var(--color-warning-bg);
      color: var(--color-warning);
    }

    .stat-card.danger .stat-icon {
      background: var(--color-danger-bg);
      color: var(--color-danger);
    }

    .stat-card.info .stat-icon {
      background: var(--color-info-bg);
      color: var(--color-info);
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    /* Filters Section */
    .filters-section {
      background: var(--surface);
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .filter-row {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .filter-row app-search-input {
      flex: 1;
      min-width: 250px;
    }

    .form-select {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      background: var(--surface);
      color: var(--text-primary);
      min-width: 180px;
    }

    .filter-toggles {
      display: flex;
      gap: 1rem;
    }

    .toggle-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .toggle-label input {
      width: 16px;
      height: 16px;
    }

    /* Table Section */
    .table-section {
      background: var(--surface);
      border-radius: 8px;
      overflow: hidden;
    }

    .table-container {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th,
    .data-table td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }

    .data-table th {
      background: var(--surface-hover);
      font-weight: 600;
      color: var(--text-secondary);
      font-size: 0.875rem;
      white-space: nowrap;
    }

    .data-table tr:hover {
      background: var(--surface-hover);
    }

    .data-table tr.low-stock {
      background: rgba(var(--color-warning-rgb), 0.05);
    }

    .text-right {
      text-align: right !important;
    }

    .text-center {
      text-align: center !important;
    }

    .text-danger {
      color: var(--color-danger);
      font-weight: 600;
    }

    .product-info {
      display: flex;
      flex-direction: column;
    }

    .product-name {
      font-weight: 500;
      color: var(--text-primary);
    }

    .sku {
      background: var(--surface-hover);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8125rem;
    }

    .batch-summary {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .batch-count {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .expiring-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: var(--color-warning);
    }

    .no-batches {
      color: var(--text-muted);
    }

    .action-buttons {
      display: flex;
      gap: 0.25rem;
      justify-content: center;
    }

    .btn-icon {
      padding: 0.375rem;
      background: transparent;
      border: none;
      border-radius: 4px;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-icon:hover {
      background: var(--surface-hover);
      color: var(--primary);
    }

    .btn-sm {
      font-size: 0.875rem;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      text-decoration: none;
    }

    .btn-primary {
      background: var(--primary);
      color: white;
    }

    .btn-primary:hover {
      background: var(--primary-dark);
    }

    .btn-secondary {
      background: var(--surface-hover);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
    }

    .btn-secondary:hover {
      background: var(--border-color);
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
      }

      .header-actions {
        width: 100%;
      }

      .filter-row {
        flex-direction: column;
        align-items: stretch;
      }

      .filter-row app-search-input {
        width: 100%;
      }

      .filter-toggles {
        flex-direction: column;
        gap: 0.5rem;
      }
    }
  `]
})
export class InventoryComponent implements OnInit {
  private readonly inventoryService = inject(InventoryService);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);
  private readonly router = inject(Router);

  // State
  stockLevels = signal<StockLevel[]>([]);
  locations = signal<Location[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  pageSize = signal(20);
  totalItems = signal(0);

  // Filters
  searchTerm = '';
  selectedLocationId: number | null = null;
  showLowStockOnly = false;
  showExpiringSoonOnly = false;

  // Computed stats
  lowStockCount = computed(() => this.stockLevels().filter(s => s.isLowStock).length);
  expiringSoonCount = computed(() => this.stockLevels().filter(s => this.hasExpiringBatches(s)).length);
  totalProducts = computed(() => this.totalItems());

  ngOnInit(): void {
    this.loadLocations();
    this.loadStockLevels();
  }

  loadLocations(): void {
    this.inventoryService.getActiveLocations().subscribe({
      next: (response) => {
        if (response.data) {
          this.locations.set(response.data);
        }
      },
      error: () => {
        // Locations are optional, continue without them
      }
    });
  }

  loadStockLevels(): void {
    this.loading.set(true);

    const filters: InventoryFilters = {
      search: this.searchTerm || undefined,
      locationId: this.selectedLocationId || undefined,
      lowStockOnly: this.showLowStockOnly || undefined,
      expiringSoonOnly: this.showExpiringSoonOnly || undefined,
      page: this.currentPage(),
      pageSize: this.pageSize()
    };

    this.inventoryService.getStockLevels(filters).subscribe({
      next: (response: PagedResponse<StockLevel>) => {
        this.stockLevels.set(response.data);
        this.totalItems.set(response.totalCount);
        this.loading.set(false);
      },
      error: () => {
        this.notificationService.error(
          this.translateService.instant('inventory.loadError')
        );
        this.loading.set(false);
      }
    });
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.currentPage.set(1);
    this.loadStockLevels();
  }

  onLocationChange(): void {
    this.currentPage.set(1);
    this.loadStockLevels();
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadStockLevels();
  }

  onPageChange(event: { page: number }): void {
    this.currentPage.set(event.page);
    this.loadStockLevels();
  }

  getStockStatus(stock: StockLevel): { variant: BadgeVariant; label: string } {
    if (stock.availableQuantity === 0) {
      return { variant: 'danger', label: 'inventory.outOfStock' };
    }
    if (stock.isLowStock) {
      return { variant: 'warning', label: 'inventory.lowStock' };
    }
    return { variant: 'success', label: 'inventory.inStock' };
  }

  hasExpiringBatches(stock: StockLevel): boolean {
    return stock.batches.some(b => b.isExpiringSoon && !b.isExpired);
  }

  getExpiringBatchCount(stock: StockLevel): number {
    return stock.batches.filter(b => b.isExpiringSoon && !b.isExpired).length;
  }

  viewProductDetails(productId: number): void {
    this.router.navigate(['/products', productId]);
  }

  adjustStock(stock: StockLevel): void {
    this.router.navigate(['/inventory/adjustments/new'], {
      queryParams: { productId: stock.productId }
    });
  }

  viewHistory(productId: number): void {
    this.router.navigate(['/inventory/adjustments'], {
      queryParams: { productId }
    });
  }
}
