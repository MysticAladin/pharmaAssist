import { Component, OnInit, inject, signal, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { ProductService } from '../../core/services/product.service';
import { CatalogService } from '../../core/services/catalog.service';
import { ProductSummary, ProductFilters } from '../../core/models/product.model';
import { Category, Manufacturer } from '../../core/models/catalog.model';

import { DataTableComponent, TableColumn } from '../../shared/components/data-table';
import { SearchInputComponent } from '../../shared/components/search-input';
import { PaginationComponent, PageEvent } from '../../shared/components/pagination';
import { EmptyStateComponent } from '../../shared/components/empty-state';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    DataTableComponent,
    SearchInputComponent,
    PaginationComponent,
    EmptyStateComponent,
    ConfirmDialogComponent
  ],
  template: `
    <div class="products-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">{{ 'products.title' | translate }}</h1>
          <p class="page-subtitle">{{ 'products.subtitle' | translate }}</p>
        </div>
        <button class="btn btn-primary" (click)="createProduct()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          {{ 'products.addProduct' | translate }}
        </button>
      </div>

      <!-- Filters Bar -->
      <div class="filters-bar">
        <app-search-input
          [placeholder]="'products.searchPlaceholder'"
          (search)="onSearch($event)"
        ></app-search-input>

        <div class="filter-group">
          <select
            class="filter-select"
            [ngModel]="filters().categoryId || ''"
            (ngModelChange)="onCategoryChange($event)"
          >
            <option value="">{{ 'products.allCategories' | translate }}</option>
            @for (cat of categories(); track cat.id) {
              <option [value]="cat.id">{{ cat.name }}</option>
            }
          </select>

          <select
            class="filter-select"
            [ngModel]="filters().manufacturerId || ''"
            (ngModelChange)="onManufacturerChange($event)"
          >
            <option value="">{{ 'products.allManufacturers' | translate }}</option>
            @for (mfr of manufacturers(); track mfr.id) {
              <option [value]="mfr.id">{{ mfr.name }}</option>
            }
          </select>

          <label class="filter-checkbox">
            <input
              type="checkbox"
              [ngModel]="filters().activeOnly"
              (ngModelChange)="onActiveOnlyChange($event)"
            />
            <span>{{ 'products.activeOnly' | translate }}</span>
          </label>
        </div>
      </div>

      <!-- Data Table -->
      <app-data-table
        [columnDefs]="columns"
        [items]="products()"
        [isLoading]="loading()"
        [enableActions]="true"
        [enableRowClick]="true"
        [actionsTemplate]="actionsTemplate"
        (rowClick)="viewProduct($event)"
      >
        <ng-container emptyState>
          <app-empty-state
            [title]="'products.noProducts'"
            [description]="'products.noProductsDescription'"
            [isCompact]="true"
          >
            <button class="btn btn-primary" (click)="createProduct()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              {{ 'products.addProduct' | translate }}
            </button>
          </app-empty-state>
        </ng-container>
      </app-data-table>

      <!-- Actions Template -->
      <ng-template #actionsTemplate let-row>
        <div class="row-actions">
          <button class="action-btn" (click)="viewProduct(row)" title="{{ 'common.view' | translate }}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
          <button class="action-btn" (click)="editProduct(row); $event.stopPropagation()" title="{{ 'common.edit' | translate }}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="action-btn action-btn-danger" (click)="confirmDelete(row); $event.stopPropagation()" title="{{ 'common.delete' | translate }}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </ng-template>

      <!-- Pagination -->
      @if (totalItems() > 0) {
        <app-pagination
          [page]="filters().page"
          [size]="filters().pageSize"
          [totalItems]="totalItems()"
          (pageChange)="onPageChange($event)"
        ></app-pagination>
      }

      <!-- Delete Confirmation Dialog -->
      <app-confirm-dialog
        [open]="showDeleteDialog()"
        [title]="'products.deleteProduct'"
        [message]="'products.deleteConfirmation'"
        [confirmText]="'common.delete'"
        [cancelText]="'common.cancel'"
        type="danger"
        [isLoading]="deleting()"
        (openChange)="showDeleteDialog.set($event)"
        (confirm)="deleteProduct()"
        (cancel)="showDeleteDialog.set(false)"
      ></app-confirm-dialog>
    </div>
  `,
  styles: [`
    .products-page {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      gap: 16px;
      flex-wrap: wrap;
    }

    .header-content {
      flex: 1;
      min-width: 200px;
    }

    .page-title {
      margin: 0 0 4px;
      font-size: 24px;
      font-weight: 600;
      color: var(--text);
    }

    .page-subtitle {
      margin: 0;
      font-size: 14px;
      color: var(--text-secondary);
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.15s;
    }

    .btn-primary {
      background: var(--primary);
      color: white;

      &:hover {
        background: var(--primary-dark, #0f766e);
      }
    }

    .filters-bar {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .filter-select {
      padding: 10px 32px 10px 12px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--surface);
      color: var(--text);
      font-size: 14px;
      cursor: pointer;
      appearance: none;
      min-width: 160px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;

      &:hover {
        border-color: var(--border-hover, #94a3b8);
      }

      &:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
      }
    }

    .filter-checkbox {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--text-secondary);
      cursor: pointer;

      input {
        width: 18px;
        height: 18px;
        accent-color: var(--primary);
        cursor: pointer;
      }
    }

    .row-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      justify-content: center;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        background: var(--surface-hover, #f1f5f9);
        color: var(--text);
      }

      &.action-btn-danger:hover {
        background: #fee2e2;
        color: #dc2626;
      }
    }
  `]
})
export class ProductsListComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly catalogService = inject(CatalogService);
  private readonly router = inject(Router);

  // Signals
  products = signal<ProductSummary[]>([]);
  categories = signal<Category[]>([]);
  manufacturers = signal<Manufacturer[]>([]);
  loading = signal(false);
  totalItems = signal(0);
  filters = signal<ProductFilters>({
    page: 1,
    pageSize: 10,
    activeOnly: true
  });

  // Delete dialog
  showDeleteDialog = signal(false);
  productToDelete = signal<ProductSummary | null>(null);
  deleting = signal(false);

  // Table columns
  columns: TableColumn[] = [
    { key: 'name', label: 'products.columns.name', sortable: true },
    { key: 'categoryName', label: 'products.columns.category', sortable: true },
    { key: 'manufacturerName', label: 'products.columns.manufacturer', sortable: true },
    { key: 'unitPrice', label: 'products.columns.price', sortable: true, align: 'right' },
    { key: 'stockQuantity', label: 'products.columns.stock', sortable: true, align: 'center' },
    { key: 'isActive', label: 'products.columns.status', align: 'center' }
  ];

  ngOnInit(): void {
    this.loadCategories();
    this.loadManufacturers();
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.productService.getPaged(this.filters()).subscribe({
      next: (response) => {
        this.products.set(response.data || []);
        this.totalItems.set(response.totalCount || 0);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.loading.set(false);
      }
    });
  }

  loadCategories(): void {
    this.catalogService.getCategories().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.categories.set(response.data);
        }
      }
    });
  }

  loadManufacturers(): void {
    this.catalogService.getManufacturers().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.manufacturers.set(response.data);
        }
      }
    });
  }

  onSearch(term: string): void {
    this.filters.update(f => ({ ...f, search: term || undefined, page: 1 }));
    this.loadProducts();
  }

  onCategoryChange(categoryId: string): void {
    this.filters.update(f => ({ ...f, categoryId: categoryId ? +categoryId : undefined, page: 1 }));
    this.loadProducts();
  }

  onManufacturerChange(manufacturerId: string): void {
    this.filters.update(f => ({ ...f, manufacturerId: manufacturerId ? +manufacturerId : undefined, page: 1 }));
    this.loadProducts();
  }

  onActiveOnlyChange(activeOnly: boolean): void {
    this.filters.update(f => ({ ...f, activeOnly, page: 1 }));
    this.loadProducts();
  }

  onPageChange(event: PageEvent): void {
    this.filters.update(f => ({ ...f, page: event.page, pageSize: event.pageSize }));
    this.loadProducts();
  }

  createProduct(): void {
    this.router.navigate(['/products/new']);
  }

  viewProduct(product: ProductSummary): void {
    this.router.navigate(['/products', product.id]);
  }

  editProduct(product: ProductSummary): void {
    this.router.navigate(['/products', product.id, 'edit']);
  }

  confirmDelete(product: ProductSummary): void {
    this.productToDelete.set(product);
    this.showDeleteDialog.set(true);
  }

  deleteProduct(): void {
    const product = this.productToDelete();
    if (!product) return;

    this.deleting.set(true);
    this.productService.delete(product.id).subscribe({
      next: () => {
        this.showDeleteDialog.set(false);
        this.productToDelete.set(null);
        this.deleting.set(false);
        this.loadProducts();
      },
      error: (error) => {
        console.error('Error deleting product:', error);
        this.deleting.set(false);
      }
    });
  }
}

