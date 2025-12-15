import { Component, OnInit, inject, signal, TemplateRef, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ProductService } from '../../core/services/product.service';
import { CatalogService } from '../../core/services/catalog.service';
import { ExportService, ExportColumn } from '../../core/services/export.service';
import { ProductSummary, ProductFilters } from '../../core/models/product.model';
import { Category, Manufacturer } from '../../core/models/catalog.model';

import { DataTableComponent, TableColumn, SortEvent } from '../../shared/components/data-table';
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
        <div class="header-actions">
          <div class="export-dropdown" [class.open]="showExportMenu()">
            <button class="btn btn-secondary" (click)="toggleExportMenu()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {{ 'common.export' | translate }}
            </button>
            @if (showExportMenu()) {
              <div class="export-menu">
                <button (click)="exportToCSV()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  CSV
                </button>
                <button (click)="exportToExcel()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  Excel
                </button>
                <button (click)="exportToPDF()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  PDF
                </button>
              </div>
            }
          </div>
          <button class="btn btn-primary" (click)="createProduct()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            {{ 'products.addProduct' | translate }}
          </button>
        </div>
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

          <button class="btn btn-filter" [class.active]="showAdvancedFilters()" (click)="toggleAdvancedFilters()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            {{ 'products.filters.advanced' | translate }}
            @if (activeFilterCount() > 0) {
              <span class="filter-badge">{{ activeFilterCount() }}</span>
            }
          </button>
        </div>
      </div>

      <!-- Advanced Filters Panel -->
      @if (showAdvancedFilters()) {
        <div class="advanced-filters-panel" @slideDown>
          <div class="filters-grid">
            <!-- Price Range -->
            <div class="filter-section">
              <label class="filter-label">{{ 'products.filters.priceRange' | translate }}</label>
              <div class="price-range">
                <input
                  type="number"
                  class="filter-input"
                  [placeholder]="'products.filters.minPrice' | translate"
                  [ngModel]="filters().minPrice"
                  (ngModelChange)="onMinPriceChange($event)"
                  min="0"
                  step="0.01"
                />
                <span class="range-separator">—</span>
                <input
                  type="number"
                  class="filter-input"
                  [placeholder]="'products.filters.maxPrice' | translate"
                  [ngModel]="filters().maxPrice"
                  (ngModelChange)="onMaxPriceChange($event)"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <!-- Stock Status -->
            <div class="filter-section">
              <label class="filter-label">{{ 'products.filters.stockStatus' | translate }}</label>
              <select
                class="filter-select full-width"
                [ngModel]="filters().stockStatus || 'all'"
                (ngModelChange)="onStockStatusChange($event)"
              >
                <option value="all">{{ 'products.filters.stockAll' | translate }}</option>
                <option value="inStock">{{ 'products.filters.stockInStock' | translate }}</option>
                <option value="lowStock">{{ 'products.filters.stockLow' | translate }}</option>
                <option value="outOfStock">{{ 'products.filters.stockOut' | translate }}</option>
              </select>
            </div>

            <!-- Prescription Required -->
            <div class="filter-section">
              <label class="filter-label">{{ 'products.filters.prescriptionRequired' | translate }}</label>
              <select
                class="filter-select full-width"
                [ngModel]="prescriptionFilterValue()"
                (ngModelChange)="onPrescriptionChange($event)"
              >
                <option value="all">{{ 'products.filters.prescriptionAll' | translate }}</option>
                <option value="yes">{{ 'products.filters.prescriptionYes' | translate }}</option>
                <option value="no">{{ 'products.filters.prescriptionNo' | translate }}</option>
              </select>
            </div>

            <!-- Barcode Status -->
            <div class="filter-section">
              <label class="filter-label">{{ 'products.filters.barcode' | translate }}</label>
              <select
                class="filter-select full-width"
                [ngModel]="barcodeFilterValue()"
                (ngModelChange)="onBarcodeChange($event)"
              >
                <option value="all">{{ 'products.filters.barcodeAll' | translate }}</option>
                <option value="yes">{{ 'products.filters.barcodeYes' | translate }}</option>
                <option value="no">{{ 'products.filters.barcodeNo' | translate }}</option>
              </select>
            </div>

            <!-- Expiry Status -->
            <div class="filter-section">
              <label class="filter-label">{{ 'products.filters.expiryStatus' | translate }}</label>
              <select
                class="filter-select full-width"
                [ngModel]="filters().expiryStatus || 'all'"
                (ngModelChange)="onExpiryStatusChange($event)"
              >
                <option value="all">{{ 'products.filters.expiryAll' | translate }}</option>
                <option value="valid">{{ 'products.filters.expiryValid' | translate }}</option>
                <option value="expiringSoon">{{ 'products.filters.expiringSoon' | translate }}</option>
                <option value="expired">{{ 'products.filters.expiryExpired' | translate }}</option>
              </select>
            </div>

            <!-- Sort By -->
            <div class="filter-section">
              <label class="filter-label">{{ 'products.filters.sortBy' | translate }}</label>
              <div class="sort-controls">
                <select
                  class="filter-select"
                  [ngModel]="filters().sortBy || 'name'"
                  (ngModelChange)="onSortByChange($event)"
                >
                  <option value="name">{{ 'products.columns.name' | translate }}</option>
                  <option value="unitPrice">{{ 'products.columns.price' | translate }}</option>
                  <option value="stockQuantity">{{ 'products.columns.stock' | translate }}</option>
                  <option value="createdAt">{{ 'products.filters.dateAdded' | translate }}</option>
                </select>
                <button
                  class="sort-direction-btn"
                  [class.desc]="filters().sortDirection === 'desc'"
                  (click)="toggleSortDirection()"
                  [title]="(filters().sortDirection === 'desc' ? 'products.filters.sortDesc' : 'products.filters.sortAsc') | translate"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 5v14M5 12l7-7 7 7"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Filter Actions -->
          <div class="filter-actions">
            <button class="btn btn-ghost" (click)="clearAdvancedFilters()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
              {{ 'products.filters.clearAll' | translate }}
            </button>
            <button class="btn btn-primary" (click)="applyFilters()">
              {{ 'products.filters.apply' | translate }}
            </button>
          </div>
        </div>
      }

      <!-- Bulk Actions Bar -->
      @if (selectedCount() > 0) {
        <div class="bulk-actions-bar">
          <div class="bulk-info">
            <button class="btn-checkbox" (click)="clearSelection()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <span>{{ selectedCount() }} {{ 'bulk.selected' | translate }}</span>
          </div>
          <div class="bulk-buttons">
            <button class="btn btn-bulk" (click)="bulkToggleStatus(true)" [disabled]="bulkActionLoading()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              {{ 'bulk.activate' | translate }}
            </button>
            <button class="btn btn-bulk" (click)="bulkToggleStatus(false)" [disabled]="bulkActionLoading()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
              </svg>
              {{ 'bulk.deactivate' | translate }}
            </button>
            <button class="btn btn-bulk" (click)="openBulkPriceDialog()" [disabled]="bulkActionLoading()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              {{ 'bulk.updatePrices' | translate }}
            </button>
            <div class="bulk-export-dropdown">
              <button class="btn btn-bulk" (click)="toggleBulkExportDropdown()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                {{ 'bulk.exportSelected' | translate }}
              </button>
              @if (showBulkExportDropdown()) {
                <div class="bulk-export-menu">
                  <button (click)="exportSelected('csv')">CSV</button>
                  <button (click)="exportSelected('excel')">Excel</button>
                  <button (click)="exportSelected('pdf')">PDF</button>
                </div>
              }
            </div>
            <button class="btn btn-bulk btn-danger" (click)="openBulkDeleteDialog()" [disabled]="bulkActionLoading()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              {{ 'bulk.delete' | translate }}
            </button>
          </div>
        </div>
      }

      <!-- Data Table -->
      <app-data-table
        [columnDefs]="columns"
        [items]="products()"
        [isLoading]="loading()"
        [enableActions]="true"
        [enableRowClick]="true"
        [actionsTemplate]="actionsTemplate"
        (sortChange)="onTableSort($event)"
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
          <button class="action-btn" (click)="viewProduct(row, $event)" title="{{ 'common.view' | translate }}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
          <button class="action-btn" (click)="editProduct(row, $event)" title="{{ 'common.edit' | translate }}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="action-btn action-btn-danger" (click)="confirmDelete(row, $event)" title="{{ 'common.delete' | translate }}">
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
        background: var(--primary-dark);
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
        border-color: var(--border-hover);
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
        background: var(--surface-hover);
        color: var(--text);
      }

      &.action-btn-danger:hover {
        background: var(--color-error-bg);
        color: var(--color-error-dark);
      }
    }

    .btn-filter {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--surface);
      color: var(--text-secondary);
      font-size: 13px;
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        border-color: var(--primary);
        color: var(--primary);
      }

      &.active {
        background: var(--primary);
        color: white;
        border-color: var(--primary);
      }
    }

    .filter-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      background: white;
      color: var(--primary);
      border-radius: 9px;
      font-size: 11px;
      font-weight: 600;
    }

    .advanced-filters-panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .filter-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .filter-label {
      font-size: 13px;
      font-weight: 500;
      color: var(--text);
    }

    .filter-input {
      padding: 10px 12px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--bg);
      color: var(--text);
      font-size: 14px;
      width: 100%;

      &:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
      }

      &::placeholder {
        color: var(--text-secondary);
      }
    }

    .filter-select.full-width {
      width: 100%;
    }

    .price-range {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .range-separator {
      color: var(--text-secondary);
      flex-shrink: 0;
    }

    .sort-controls {
      display: flex;
      gap: 8px;
    }

    .sort-controls .filter-select {
      flex: 1;
    }

    .sort-direction-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--surface);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.15s;

      svg {
        transition: transform 0.2s;
      }

      &:hover {
        border-color: var(--primary);
        color: var(--primary);
      }

      &.desc svg {
        transform: rotate(180deg);
      }
    }

    .filter-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }

    .btn-ghost {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 500;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        background: var(--surface-hover);
        color: var(--text);
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .btn-secondary {
      background: var(--surface);
      color: var(--text);
      border: 1px solid var(--border);

      &:hover {
        background: var(--surface-hover);
        border-color: var(--border-hover);
      }
    }

    .export-dropdown {
      position: relative;
    }

    .export-menu {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 4px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      min-width: 140px;
      z-index: 50;
      overflow: hidden;

      button {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 10px 14px;
        border: none;
        background: transparent;
        color: var(--text);
        font-size: 14px;
        cursor: pointer;
        transition: all 0.15s;

        &:hover {
          background: var(--surface-hover);
        }

        svg {
          color: var(--text-secondary);
        }
      }
    }
  `]
})
export class ProductsListComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly catalogService = inject(CatalogService);
  private readonly exportService = inject(ExportService);
  private readonly translateService = inject(TranslateService);
  private readonly router = inject(Router);

  // Signals
  products = signal<ProductSummary[]>([]);
  categories = signal<Category[]>([]);
  manufacturers = signal<Manufacturer[]>([]);
  loading = signal(false);
  totalItems = signal(0);
  showExportMenu = signal(false);
  filters = signal<ProductFilters>({
    page: 1,
    pageSize: 10,
    activeOnly: true,
    stockStatus: undefined,
    sortBy: 'name',
    sortDirection: 'asc'
  });

  // Bulk selection
  selectedProducts = signal<Set<number>>(new Set());
  showBulkActions = signal(false);
  showBulkExportDropdown = signal(false);
  bulkActionLoading = signal(false);
  showBulkDeleteDialog = signal(false);
  showBulkPriceDialog = signal(false);
  bulkPriceAction = signal<'increase' | 'decrease' | 'set'>('increase');
  bulkPriceValue = signal<number>(0);
  bulkPriceType = signal<'percentage' | 'fixed'>('percentage');

  // Computed for bulk selection
  allSelected = computed(() => {
    const products = this.products();
    const selected = this.selectedProducts();
    return products.length > 0 && products.every(p => selected.has(p.id));
  });

  someSelected = computed(() => {
    const products = this.products();
    const selected = this.selectedProducts();
    const selectedCount = products.filter(p => selected.has(p.id)).length;
    return selectedCount > 0 && selectedCount < products.length;
  });

  selectedCount = computed(() => this.selectedProducts().size);

  // Advanced filters
  showAdvancedFilters = signal(false);

  // Computed signals for filter values
  prescriptionFilterValue = computed(() => {
    const val = this.filters().requiresPrescription;
    if (val === true) return 'yes';
    if (val === false) return 'no';
    return 'all';
  });

  barcodeFilterValue = computed(() => {
    const val = this.filters().hasBarcode;
    if (val === true) return 'yes';
    if (val === false) return 'no';
    return 'all';
  });

  // Count of active advanced filters
  activeFilterCount = computed(() => {
    const f = this.filters();
    let count = 0;
    if (f.minPrice !== undefined && f.minPrice !== null) count++;
    if (f.maxPrice !== undefined && f.maxPrice !== null) count++;
    if (f.stockStatus && f.stockStatus !== 'all') count++;
    if (f.requiresPrescription !== undefined && f.requiresPrescription !== null) count++;
    if (f.hasBarcode !== undefined && f.hasBarcode !== null) count++;
    if (f.expiryStatus && f.expiryStatus !== 'all') count++;
    if (f.sortBy && f.sortBy !== 'name') count++;
    return count;
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

  viewProduct(product: ProductSummary, event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(['/products', product.id]);
  }

  editProduct(product: ProductSummary, event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(['/products', product.id, 'edit']);
  }

  confirmDelete(product: ProductSummary, event?: Event): void {
    event?.stopPropagation();
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

  // Advanced filter methods
  toggleAdvancedFilters(): void {
    this.showAdvancedFilters.update(v => !v);
  }

  onMinPriceChange(value: number | null): void {
    this.filters.update(f => ({ ...f, minPrice: value ?? undefined }));
  }

  onMaxPriceChange(value: number | null): void {
    this.filters.update(f => ({ ...f, maxPrice: value ?? undefined }));
  }

  onStockStatusChange(status: 'all' | 'inStock' | 'lowStock' | 'outOfStock'): void {
    this.filters.update(f => ({
      ...f,
      stockStatus: status === 'all' ? undefined : status
    }));
  }

  onPrescriptionChange(value: 'all' | 'yes' | 'no'): void {
    let prescriptionValue: boolean | null = null;
    if (value === 'yes') prescriptionValue = true;
    else if (value === 'no') prescriptionValue = false;
    this.filters.update(f => ({ ...f, requiresPrescription: prescriptionValue ?? undefined }));
  }

  onBarcodeChange(value: 'all' | 'yes' | 'no'): void {
    let barcodeValue: boolean | null = null;
    if (value === 'yes') barcodeValue = true;
    else if (value === 'no') barcodeValue = false;
    this.filters.update(f => ({ ...f, hasBarcode: barcodeValue ?? undefined }));
  }

  onExpiryStatusChange(status: 'all' | 'expiringSoon' | 'expired' | 'valid'): void {
    this.filters.update(f => ({
      ...f,
      expiryStatus: status === 'all' ? undefined : status
    }));
  }

  onSortByChange(sortBy: string): void {
    this.filters.update(f => ({ ...f, sortBy }));
  }

  toggleSortDirection(): void {
    this.filters.update(f => ({
      ...f,
      sortDirection: f.sortDirection === 'desc' ? 'asc' : 'desc'
    }));
  }

  onTableSort(event: SortEvent): void {
    this.filters.update(f => ({
      ...f,
      sortBy: event.column,
      sortDirection: event.direction,
      page: 1
    }));
    this.loadProducts();
  }

  clearAdvancedFilters(): void {
    this.filters.update(f => ({
      ...f,
      minPrice: undefined,
      maxPrice: undefined,
      stockStatus: undefined,
      requiresPrescription: undefined,
      hasBarcode: undefined,
      expiryStatus: undefined,
      sortBy: undefined,
      sortDirection: undefined,
      page: 1
    }));
    this.loadProducts();
  }

  applyFilters(): void {
    this.filters.update(f => ({ ...f, page: 1 }));
    this.loadProducts();
  }

  // Export functionality
  toggleExportMenu(): void {
    this.showExportMenu.update(v => !v);
  }

  private getExportColumns(): ExportColumn<ProductSummary>[] {
    return [
      { key: 'name', header: this.translateService.instant('products.columns.name') },
      { key: 'sku', header: 'SKU' },
      { key: 'categoryName', header: this.translateService.instant('products.columns.category') },
      { key: 'manufacturerName', header: this.translateService.instant('products.columns.manufacturer') },
      {
        key: 'unitPrice',
        header: this.translateService.instant('products.columns.price'),
        format: (value) => value?.toFixed(2) + ' BAM' || ''
      },
      { key: 'stockQuantity', header: this.translateService.instant('products.columns.stock') },
      {
        key: 'requiresPrescription',
        header: this.translateService.instant('products.form.requiresPrescription'),
        format: (value) => value ? this.translateService.instant('common.yes') : this.translateService.instant('common.no')
      },
      {
        key: 'isActive',
        header: this.translateService.instant('products.columns.status'),
        format: (value) => value ? this.translateService.instant('products.status.active') : this.translateService.instant('products.status.inactive')
      }
    ];
  }

  exportToCSV(): void {
    this.showExportMenu.set(false);
    this.exportService.exportToCSV(
      this.products(),
      this.getExportColumns(),
      { filename: `products-${new Date().toISOString().split('T')[0]}` }
    );
  }

  exportToExcel(): void {
    this.showExportMenu.set(false);
    this.exportService.exportToExcel(
      this.products(),
      this.getExportColumns(),
      { filename: `products-${new Date().toISOString().split('T')[0]}` }
    );
  }

  exportToPDF(): void {
    this.showExportMenu.set(false);
    this.exportService.exportToPDF(
      this.products(),
      this.getExportColumns(),
      {
        filename: `products-${new Date().toISOString().split('T')[0]}`,
        title: this.translateService.instant('products.title'),
        subtitle: this.translateService.instant('products.subtitle')
      }
    );
  }

  // ========== BULK OPERATIONS ==========

  toggleSelectAll(): void {
    const products = this.products();

    if (this.allSelected()) {
      // Deselect all
      this.selectedProducts.set(new Set());
    } else {
      // Select all on current page
      this.selectedProducts.set(new Set(products.map(p => p.id)));
    }
  }

  toggleProductSelection(productId: number): void {
    const selected = new Set(this.selectedProducts());
    if (selected.has(productId)) {
      selected.delete(productId);
    } else {
      selected.add(productId);
    }
    this.selectedProducts.set(selected);
  }

  isProductSelected(productId: number): boolean {
    return this.selectedProducts().has(productId);
  }

  clearSelection(): void {
    this.selectedProducts.set(new Set());
  }

  toggleBulkExportDropdown(): void {
    this.showBulkExportDropdown.update(v => !v);
  }

  // Bulk Delete
  openBulkDeleteDialog(): void {
    if (this.selectedCount() > 0) {
      this.showBulkDeleteDialog.set(true);
    }
  }

  closeBulkDeleteDialog(): void {
    this.showBulkDeleteDialog.set(false);
  }

  async confirmBulkDelete(): Promise<void> {
    this.bulkActionLoading.set(true);
    const selectedIds = Array.from(this.selectedProducts());

    try {
      // Delete each selected product
      for (const id of selectedIds) {
        await this.productService.delete(id).toPromise();
      }

      // Refresh and clear selection
      this.loadProducts();
      this.clearSelection();
      this.showBulkDeleteDialog.set(false);
    } catch (error) {
      console.error('Bulk delete failed:', error);
    } finally {
      this.bulkActionLoading.set(false);
    }
  }

  // Bulk Status Toggle
  async bulkToggleStatus(activate: boolean): Promise<void> {
    this.bulkActionLoading.set(true);
    const selectedIds = Array.from(this.selectedProducts());

    try {
      for (const id of selectedIds) {
        if (activate) {
          await this.productService.activate(id).toPromise();
        } else {
          await this.productService.deactivate(id).toPromise();
        }
      }

      this.loadProducts();
      this.clearSelection();
    } catch (error) {
      console.error('Bulk status update failed:', error);
    } finally {
      this.bulkActionLoading.set(false);
    }
  }

  // Bulk Price Update
  openBulkPriceDialog(): void {
    if (this.selectedCount() > 0) {
      this.bulkPriceAction.set('increase');
      this.bulkPriceValue.set(0);
      this.bulkPriceType.set('percentage');
      this.showBulkPriceDialog.set(true);
    }
  }

  closeBulkPriceDialog(): void {
    this.showBulkPriceDialog.set(false);
  }

  async confirmBulkPriceUpdate(): Promise<void> {
    this.bulkActionLoading.set(true);
    const selectedIds = Array.from(this.selectedProducts());
    const action = this.bulkPriceAction();
    const value = this.bulkPriceValue();
    const type = this.bulkPriceType();

    try {
      for (const id of selectedIds) {
        const product = this.products().find(p => p.id === id);
        if (!product) continue;

        let newPrice = product.unitPrice;

        if (action === 'set') {
          newPrice = value;
        } else if (type === 'percentage') {
          const change = product.unitPrice * (value / 100);
          newPrice = action === 'increase'
            ? product.unitPrice + change
            : product.unitPrice - change;
        } else {
          newPrice = action === 'increase'
            ? product.unitPrice + value
            : product.unitPrice - value;
        }

        // Ensure price doesn't go negative
        newPrice = Math.max(0, Math.round(newPrice * 100) / 100);

        await this.productService.partialUpdate(id, { unitPrice: newPrice }).toPromise();
      }

      this.loadProducts();
      this.clearSelection();
      this.showBulkPriceDialog.set(false);
    } catch (error) {
      console.error('Bulk price update failed:', error);
    } finally {
      this.bulkActionLoading.set(false);
    }
  }

  // Export selected products
  exportSelected(format: 'csv' | 'excel' | 'pdf'): void {
    this.showBulkExportDropdown.set(false);
    const selectedProducts = this.products().filter(p => this.selectedProducts().has(p.id));
    const columns = this.getExportColumns();
    const filename = `products-selected-${new Date().toISOString().split('T')[0]}`;

    switch (format) {
      case 'csv':
        this.exportService.exportToCSV(selectedProducts, columns, { filename });
        break;
      case 'excel':
        this.exportService.exportToExcel(selectedProducts, columns, { filename });
        break;
      case 'pdf':
        this.exportService.exportToPDF(selectedProducts, columns, {
          filename,
          title: this.translateService.instant('products.title'),
          subtitle: `${selectedProducts.length} selected products`
        });
        break;
    }
  }
}

