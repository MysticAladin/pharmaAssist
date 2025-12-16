import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';
import { SearchInputComponent } from '../../shared/components/search-input/search-input.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-low-stock',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    TranslateModule,
    SearchInputComponent,
    StatusBadgeComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="low-stock-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">{{ 'lowStock.title' | translate }}</h1>
          <p class="page-description">{{ 'lowStock.description' | translate }}</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="exportReport()">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {{ 'common.export' | translate }}
          </button>
          <button class="btn btn-primary" routerLink="/products/new">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {{ 'lowStock.reorder' | translate }}
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card critical">
          <div class="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ criticalCount() }}</span>
            <span class="stat-label">{{ 'lowStock.critical' | translate }}</span>
          </div>
        </div>
        <div class="stat-card warning">
          <div class="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ warningCount() }}</span>
            <span class="stat-label">{{ 'lowStock.warning' | translate }}</span>
          </div>
        </div>
        <div class="stat-card info">
          <div class="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ pendingOrdersCount() }}</span>
            <span class="stat-label">{{ 'lowStock.pendingOrders' | translate }}</span>
          </div>
        </div>
        <div class="stat-card total">
          <div class="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ totalLowStock() }}</span>
            <span class="stat-label">{{ 'lowStock.totalItems' | translate }}</span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <app-search-input
          [placeholder]="'lowStock.searchPlaceholder' | translate"
          (search)="onSearch($event)"
        ></app-search-input>

        <div class="filter-group">
          <select class="filter-select" [(ngModel)]="selectedSeverity" (change)="applyFilters()">
            <option value="all">{{ 'lowStock.allSeverities' | translate }}</option>
            <option value="critical">{{ 'lowStock.critical' | translate }}</option>
            <option value="warning">{{ 'lowStock.warning' | translate }}</option>
          </select>

          <select class="filter-select" [(ngModel)]="threshold" (change)="loadProducts()">
            <option [value]="10">{{ 'lowStock.threshold' | translate }}: 10</option>
            <option [value]="25">{{ 'lowStock.threshold' | translate }}: 25</option>
            <option [value]="50">{{ 'lowStock.threshold' | translate }}: 50</option>
            <option [value]="100">{{ 'lowStock.threshold' | translate }}: 100</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-container">
          <div class="loading-grid">
            @for (i of [1,2,3,4,5]; track i) {
              <div class="skeleton-row">
                <div class="skeleton skeleton-cell"></div>
                <div class="skeleton skeleton-cell wide"></div>
                <div class="skeleton skeleton-cell"></div>
                <div class="skeleton skeleton-cell"></div>
                <div class="skeleton skeleton-cell"></div>
              </div>
            }
          </div>
        </div>
      } @else if (filteredProducts().length === 0) {
        <app-empty-state
          icon="package"
          [title]="'lowStock.empty.title' | translate"
          [description]="'lowStock.empty.description' | translate"
        ></app-empty-state>
      } @else {
        <!-- Products Table -->
        <div class="table-card">
          <table class="data-table">
            <thead>
              <tr>
                <th class="sortable" (click)="sortBy('name')">
                  {{ 'lowStock.columns.product' | translate }}
                  @if (sortColumn() === 'name') {
                    <span class="sort-icon">{{ sortDirection() === 'asc' ? '↑' : '↓' }}</span>
                  }
                </th>
                <th>{{ 'lowStock.columns.sku' | translate }}</th>
                <th>{{ 'lowStock.columns.category' | translate }}</th>
                <th class="text-right sortable" (click)="sortBy('stockQuantity')">
                  {{ 'lowStock.columns.currentStock' | translate }}
                  @if (sortColumn() === 'stockQuantity') {
                    <span class="sort-icon">{{ sortDirection() === 'asc' ? '↑' : '↓' }}</span>
                  }
                </th>
                <th class="text-right sortable" (click)="sortBy('reorderLevel')">
                  {{ 'lowStock.columns.reorderLevel' | translate }}
                  @if (sortColumn() === 'reorderLevel') {
                    <span class="sort-icon">{{ sortDirection() === 'asc' ? '↑' : '↓' }}</span>
                  }
                </th>
                <th class="text-center">{{ 'lowStock.columns.status' | translate }}</th>
                <th class="text-center">{{ 'common.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (product of filteredProducts(); track product.id) {
                <tr [class.critical-row]="getStockLevel(product) === 'critical'">
                  <td>
                    <div class="product-info">
                      @if (product.imageUrl) {
                        <img [src]="product.imageUrl" [alt]="product.name" class="product-image">
                      } @else {
                        <div class="product-image-placeholder">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                            <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                          </svg>
                        </div>
                      }
                      <div class="product-details">
                        <a [routerLink]="['/products', product.id]" class="product-name">{{ product.name }}</a>
                        <span class="product-local">{{ product.nameLocal }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="sku-cell">{{ product.sku }}</td>
                  <td>{{ product.categoryName || '-' }}</td>
                  <td class="text-right">
                    <span class="stock-value" [class]="getStockLevel(product)">
                      {{ product.stockQuantity }}
                    </span>
                  </td>
                  <td class="text-right">{{ product.reorderLevel }}</td>
                  <td class="text-center">
                    <app-status-badge
                      [variant]="getStockLevel(product) === 'critical' ? 'danger' : 'warning'"
                      [label]="(getStockLevel(product) === 'critical' ? 'lowStock.critical' : 'lowStock.warning') | translate"
                    ></app-status-badge>
                  </td>
                  <td class="text-center">
                    <div class="action-buttons">
                      <button class="btn-icon" [routerLink]="['/products', product.id]" [title]="'common.view' | translate">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      <button class="btn-icon btn-reorder" (click)="reorderProduct(product)" [title]="'lowStock.reorder' | translate">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Summary Footer -->
        <div class="summary-footer">
          <div class="summary-text">
            {{ 'lowStock.showing' | translate:{ count: filteredProducts().length, total: products().length } }}
          </div>
          <div class="estimated-value">
            <span class="value-label">{{ 'lowStock.estimatedReorderValue' | translate }}:</span>
            <span class="value-amount">{{ calculateReorderValue() | currency:'BAM ':'symbol':'1.2-2' }}</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host{--c1:#1a1a2e;--c2:#6b7280;--c3:#e5e7eb;--c4:#f3f4f6;--c5:#0aaaaa;--danger:#dc2626;--warn:#f59e0b}
    .low-stock-page{padding:1.5rem;max-width:1400px;margin:0 auto}
    .page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem;gap:1rem;flex-wrap:wrap}
    .page-title{font-size:1.75rem;font-weight:600;color:var(--c1);margin:0 0 .25rem}
    .page-description{color:var(--c2);margin:0;font-size:.9rem}
    .header-actions{display:flex;gap:.75rem}
    .btn{display:inline-flex;align-items:center;gap:.5rem;padding:.5rem 1rem;font-size:.875rem;font-weight:500;border-radius:8px;border:none;cursor:pointer;transition:all .2s}
    .btn-primary{background:var(--brand-primary, #0aaaaa);color:#fff}
    .btn-primary:hover{background:var(--brand-primary-dark, #088888)}
    .btn-secondary{background:#fff;color:var(--c1);border:1px solid var(--c3)}
    .btn-secondary:hover{background:var(--c4)}
    .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem}
    @media(max-width:1024px){.stats-grid{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:640px){.stats-grid{grid-template-columns:1fr}}
    .stat-card{display:flex;align-items:center;gap:1rem;padding:1.25rem;background:#fff;border-radius:12px;border:1px solid var(--c3)}
    .stat-icon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center}
    .stat-card.critical .stat-icon{background:#fef2f2;color:var(--danger)}
    .stat-card.warning .stat-icon{background:#fffbeb;color:var(--warn)}
    .stat-card.info .stat-icon{background:#ecfdf5;color:#059669}
    .stat-card.total .stat-icon{background:#f0f9ff;color:#0284c7}
    .stat-value{font-size:1.5rem;font-weight:600;color:var(--c1);display:block}
    .stat-label{font-size:.8rem;color:var(--c2)}
    .filters-section{display:flex;justify-content:space-between;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap}
    .filter-group{display:flex;gap:.75rem}
    .filter-select{padding:.5rem 2rem .5rem .75rem;font-size:.875rem;border:1px solid var(--c3);border-radius:8px;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right .75rem center;appearance:none;cursor:pointer}
    .table-card{background:#fff;border-radius:12px;border:1px solid var(--c3);overflow:hidden}
    .data-table{width:100%;border-collapse:collapse}
    .data-table th{text-align:left;padding:.75rem 1rem;font-size:.75rem;font-weight:600;color:var(--c2);text-transform:uppercase;background:var(--c4);border-bottom:1px solid var(--c3)}
    .data-table th.sortable{cursor:pointer}
    .data-table th.sortable:hover{color:var(--c5)}
    .sort-icon{margin-left:.25rem}
    .data-table td{padding:1rem;border-bottom:1px solid var(--c3);vertical-align:middle}
    .data-table tr:last-child td{border-bottom:none}
    .data-table tr:hover{background:var(--c4)}
    .critical-row{background:#fef2f2}
    .critical-row:hover{background:#fee2e2}
    .product-info{display:flex;align-items:center;gap:.75rem}
    .product-image,.product-image-placeholder{width:40px;height:40px;border-radius:8px;object-fit:cover;flex-shrink:0}
    .product-image-placeholder{background:var(--c4);display:flex;align-items:center;justify-content:center;color:var(--c2)}
    .product-name{font-weight:500;color:var(--c1);text-decoration:none}
    .product-name:hover{color:var(--c5)}
    .product-local{display:block;font-size:.8rem;color:var(--c2)}
    .sku-cell{font-family:monospace;font-size:.85rem;color:var(--c2)}
    .text-right{text-align:right}.text-center{text-align:center}
    .stock-value{font-weight:600}
    .stock-value.critical{color:var(--danger)}
    .stock-value.warning{color:var(--warn)}
    .action-buttons{display:flex;gap:.25rem;justify-content:center}
    .btn-icon{width:32px;height:32px;border:none;border-radius:6px;background:transparent;color:var(--c2);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s}
    .btn-icon:hover{background:var(--c4);color:var(--c5)}
    .btn-reorder:hover{color:var(--c5)}
    .summary-footer{display:flex;justify-content:space-between;align-items:center;padding:1rem;margin-top:1rem;background:#fff;border-radius:8px;border:1px solid var(--c3)}
    .summary-text{font-size:.875rem;color:var(--c2)}
    .estimated-value{display:flex;gap:.5rem;align-items:center}
    .value-label{font-size:.875rem;color:var(--c2)}
    .value-amount{font-size:1.125rem;font-weight:600;color:var(--c1)}
    .loading-container{padding:1rem}
    .loading-grid{display:flex;flex-direction:column;gap:.5rem}
    .skeleton-row{display:flex;gap:1rem;padding:1rem;background:#fff;border-radius:8px}
    .skeleton{background:linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:4px}
    .skeleton-cell{height:24px;flex:1}
    .skeleton-cell.wide{flex:2}
    @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
    @media(max-width:768px){.low-stock-page{padding:1rem}.page-header{flex-direction:column}.header-actions{width:100%}.filters-section{flex-direction:column}.data-table{display:block;overflow-x:auto}}
  `]
})
export class LowStockComponent implements OnInit {
  private readonly productService = inject(ProductService);

  // State
  loading = signal(true);
  products = signal<Product[]>([]);
  searchTerm = '';
  selectedSeverity = 'all';
  threshold = 10;
  sortColumn = signal('stockQuantity');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Computed values
  filteredProducts = computed(() => {
    let result = this.products();

    // Filter by search
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.nameLocal.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term)
      );
    }

    // Filter by severity
    if (this.selectedSeverity !== 'all') {
      result = result.filter(p => this.getStockLevel(p) === this.selectedSeverity);
    }

    // Sort
    const column = this.sortColumn();
    const direction = this.sortDirection();
    result = [...result].sort((a, b) => {
      const aVal = a[column as keyof Product];
      const bVal = b[column as keyof Product];
      const modifier = direction === 'asc' ? 1 : -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * modifier;
      }
      return ((aVal as number) - (bVal as number)) * modifier;
    });

    return result;
  });

  criticalCount = computed(() =>
    this.products().filter(p => p.stockQuantity === 0 || p.stockQuantity <= p.reorderLevel * 0.5).length
  );

  warningCount = computed(() =>
    this.products().filter(p => p.stockQuantity > p.reorderLevel * 0.5 && p.stockQuantity <= p.reorderLevel).length
  );

  pendingOrdersCount = signal(0); // Would be fetched from orders service
  totalLowStock = computed(() => this.products().length);

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.productService.getLowStock(this.threshold).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.products.set(response.data);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading low stock products:', err);
        this.loading.set(false);
      }
    });
  }

  getStockLevel(product: Product): 'critical' | 'warning' {
    if (product.stockQuantity === 0 || product.stockQuantity <= product.reorderLevel * 0.5) {
      return 'critical';
    }
    return 'warning';
  }

  onSearch(term: string): void {
    this.searchTerm = term;
  }

  applyFilters(): void {
    // Triggers computed recalculation
  }

  sortBy(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  calculateReorderValue(): number {
    return this.filteredProducts().reduce((total, product) => {
      const reorderQty = Math.max(0, product.reorderLevel - product.stockQuantity + product.reorderQuantity);
      return total + (reorderQty * (product.costPrice || product.unitPrice));
    }, 0);
  }

  reorderProduct(product: Product): void {
    // Navigate to create purchase order or show reorder dialog
    console.log('Reorder product:', product.id);
  }

  exportReport(): void {
    // Export low stock report
    console.log('Exporting low stock report...');
  }
}
