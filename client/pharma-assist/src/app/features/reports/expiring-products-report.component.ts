import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../core/services/inventory.service';
import { NotificationService } from '../../core/services/notification.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { PaginationComponent, PageEvent } from '../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { BadgeVariant } from '../../shared/components/status-badge';

interface ExpiringProduct {
  id: string;
  productName: string;
  productSku: string;
  batchNumber: string;
  expiryDate: Date;
  daysUntilExpiry: number;
  quantity: number;
  location: string;
  manufacturer: string;
  value: number;
  status: 'expired' | 'critical' | 'warning' | 'normal';
}

@Component({
  selector: 'app-expiring-products-report',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    FormsModule,
    StatusBadgeComponent,
    PaginationComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="expiring-products-report">
      <div class="page-header">
        <div class="breadcrumb">
          <a routerLink="/reports">{{ 'reports.title' | translate }}</a>
          <span class="separator">/</span>
          <span>{{ 'reports.expiring.title' | translate }}</span>
        </div>
        <div class="header-main">
          <div class="header-content">
            <h1 class="page-title">{{ 'reports.expiring.title' | translate }}</h1>
            <p class="page-description">{{ 'reports.expiring.subtitle' | translate }}</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-secondary" (click)="exportReport()">
              <i class="icon-download"></i>
              {{ 'reports.actions.export' | translate }}
            </button>
            <button class="btn btn-primary" (click)="loadData()">
              <i class="icon-refresh-cw"></i>
              {{ 'reports.actions.refresh' | translate }}
            </button>
          </div>
        </div>
      </div>

      <!-- Alert Summary -->
      <div class="alert-summary">
        <div class="alert-card expired">
          <div class="alert-icon">
            <i class="icon-alert-octagon"></i>
          </div>
          <div class="alert-content">
            <span class="alert-count">{{ expiredCount() }}</span>
            <span class="alert-label">{{ 'reports.expiring.expired' | translate }}</span>
          </div>
          <div class="alert-value">{{ expiredValue() | currency:'BAM ':'symbol':'1.0-0' }}</div>
        </div>
        <div class="alert-card critical">
          <div class="alert-icon">
            <i class="icon-alert-triangle"></i>
          </div>
          <div class="alert-content">
            <span class="alert-count">{{ criticalCount() }}</span>
            <span class="alert-label">{{ 'reports.expiring.critical30' | translate }}</span>
          </div>
          <div class="alert-value">{{ criticalValue() | currency:'BAM ':'symbol':'1.0-0' }}</div>
        </div>
        <div class="alert-card warning">
          <div class="alert-icon">
            <i class="icon-clock"></i>
          </div>
          <div class="alert-content">
            <span class="alert-count">{{ warningCount() }}</span>
            <span class="alert-label">{{ 'reports.expiring.warning90' | translate }}</span>
          </div>
          <div class="alert-value">{{ warningValue() | currency:'BAM ':'symbol':'1.0-0' }}</div>
        </div>
        <div class="alert-card total">
          <div class="alert-icon">
            <i class="icon-package"></i>
          </div>
          <div class="alert-content">
            <span class="alert-count">{{ totalAtRisk() }}</span>
            <span class="alert-label">{{ 'reports.expiring.totalAtRisk' | translate }}</span>
          </div>
          <div class="alert-value">{{ totalRiskValue() | currency:'BAM ':'symbol':'1.0-0' }}</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filter-group">
          <label>{{ 'reports.expiring.expiryRange' | translate }}</label>
          <select [(ngModel)]="expiryRange" (change)="applyFilters()" class="form-select">
            <option value="all">{{ 'reports.expiring.ranges.all' | translate }}</option>
            <option value="expired">{{ 'reports.expiring.ranges.expired' | translate }}</option>
            <option value="30">{{ 'reports.expiring.ranges.next30' | translate }}</option>
            <option value="60">{{ 'reports.expiring.ranges.next60' | translate }}</option>
            <option value="90">{{ 'reports.expiring.ranges.next90' | translate }}</option>
            <option value="180">{{ 'reports.expiring.ranges.next180' | translate }}</option>
          </select>
        </div>
        <div class="filter-group search">
          <i class="icon-search"></i>
          <input
            type="text"
            [(ngModel)]="searchTerm"
            (input)="onSearchChange()"
            [placeholder]="'reports.expiring.searchPlaceholder' | translate"
            class="form-control">
        </div>
        <div class="filter-group">
          <label>{{ 'reports.expiring.sortBy' | translate }}</label>
          <select [(ngModel)]="sortBy" (change)="applyFilters()" class="form-select">
            <option value="daysAsc">{{ 'reports.expiring.sort.daysAsc' | translate }}</option>
            <option value="daysDesc">{{ 'reports.expiring.sort.daysDesc' | translate }}</option>
            <option value="valueDesc">{{ 'reports.expiring.sort.valueDesc' | translate }}</option>
            <option value="quantityDesc">{{ 'reports.expiring.sort.quantityDesc' | translate }}</option>
          </select>
        </div>
      </div>

      <!-- Products Table -->
      <div class="table-section">
        @if (loading()) {
          <div class="loading-container">
            <div class="spinner"></div>
            <span>{{ 'common.loading' | translate }}</span>
          </div>
        } @else if (filteredProducts().length === 0) {
          <app-empty-state
            icon="check-circle"
            [title]="'reports.expiring.noProducts' | translate"
            [description]="'reports.expiring.noProductsDescription' | translate">
          </app-empty-state>
        } @else {
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ 'reports.expiring.columns.product' | translate }}</th>
                  <th>{{ 'reports.expiring.columns.batch' | translate }}</th>
                  <th>{{ 'reports.expiring.columns.expiryDate' | translate }}</th>
                  <th class="text-center">{{ 'reports.expiring.columns.daysLeft' | translate }}</th>
                  <th class="text-right">{{ 'reports.expiring.columns.quantity' | translate }}</th>
                  <th>{{ 'reports.expiring.columns.location' | translate }}</th>
                  <th class="text-right">{{ 'reports.expiring.columns.value' | translate }}</th>
                  <th class="text-center">{{ 'common.status' | translate }}</th>
                  <th class="text-center">{{ 'common.actions' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                @for (product of paginatedProducts(); track product.id) {
                  <tr [class.expired-row]="product.status === 'expired'">
                    <td>
                      <div class="product-info">
                        <span class="product-name">{{ product.productName }}</span>
                        <span class="product-sku">{{ product.productSku }}</span>
                      </div>
                    </td>
                    <td class="batch-number">{{ product.batchNumber }}</td>
                    <td>{{ product.expiryDate | date:'mediumDate' }}</td>
                    <td class="text-center">
                      <span class="days-badge" [class]="'days-' + product.status">
                        @if (product.daysUntilExpiry < 0) {
                          {{ 'reports.expiring.expiredDaysAgo' | translate:{ days: Math.abs(product.daysUntilExpiry) } }}
                        } @else if (product.daysUntilExpiry === 0) {
                          {{ 'reports.expiring.today' | translate }}
                        } @else {
                          {{ product.daysUntilExpiry }} {{ 'common.days' | translate }}
                        }
                      </span>
                    </td>
                    <td class="text-right">{{ product.quantity | number }}</td>
                    <td>{{ product.location }}</td>
                    <td class="text-right value">{{ product.value | currency:'BAM ':'symbol':'1.2-2' }}</td>
                    <td class="text-center">
                      <app-status-badge
                        [variant]="getStatusVariant(product.status)"
                        [label]="'reports.expiring.statuses.' + product.status | translate">
                      </app-status-badge>
                    </td>
                    <td class="text-center">
                      <div class="action-buttons">
                        <button
                          class="btn btn-icon btn-sm"
                          [title]="'reports.expiring.actions.transfer' | translate"
                          (click)="createTransfer(product)">
                          <i class="icon-arrow-right-circle"></i>
                        </button>
                        <button
                          class="btn btn-icon btn-sm"
                          [title]="'reports.expiring.actions.adjust' | translate"
                          (click)="createAdjustment(product)">
                          <i class="icon-edit-3"></i>
                        </button>
                        @if (product.status === 'expired') {
                          <button
                            class="btn btn-icon btn-sm danger"
                            [title]="'reports.expiring.actions.writeOff' | translate"
                            (click)="writeOff(product)">
                            <i class="icon-trash-2"></i>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <app-pagination
            [page]="currentPage()"
            [size]="pageSize()"
            [totalItems]="filteredProducts().length"
            (pageChange)="onPageChange($event)">
          </app-pagination>
        }
      </div>

      <!-- Recommendations Section -->
      @if (!loading() && hasExpiredOrCritical()) {
        <div class="recommendations-section">
          <h3>{{ 'reports.expiring.recommendations.title' | translate }}</h3>
          <div class="recommendations-list">
            @if (expiredCount() > 0) {
              <div class="recommendation expired">
                <i class="icon-alert-octagon"></i>
                <div class="recommendation-content">
                  <strong>{{ 'reports.expiring.recommendations.expired.title' | translate }}</strong>
                  <p>{{ 'reports.expiring.recommendations.expired.description' | translate:{ count: expiredCount() } }}</p>
                </div>
                <button class="btn btn-sm btn-danger" (click)="writeOffAllExpired()">
                  {{ 'reports.expiring.recommendations.expired.action' | translate }}
                </button>
              </div>
            }
            @if (criticalCount() > 0) {
              <div class="recommendation critical">
                <i class="icon-alert-triangle"></i>
                <div class="recommendation-content">
                  <strong>{{ 'reports.expiring.recommendations.critical.title' | translate }}</strong>
                  <p>{{ 'reports.expiring.recommendations.critical.description' | translate:{ count: criticalCount() } }}</p>
                </div>
                <button class="btn btn-sm btn-warning" (click)="prioritizeForSale()">
                  {{ 'reports.expiring.recommendations.critical.action' | translate }}
                </button>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .expiring-products-report {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 1.5rem;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;

      a {
        color: var(--primary);
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }

      .separator {
        color: var(--text-muted);
      }

      span:last-child {
        color: var(--text-muted);
      }
    }

    .header-main {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .page-description {
      margin: 0.25rem 0 0;
      color: var(--text-muted);
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    /* Alert Summary */
    .alert-summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;

      @media (max-width: 1024px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
      }
    }

    .alert-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: var(--card-bg);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);

      .alert-icon {
        width: 48px;
        height: 48px;
        border-radius: var(--radius);
        display: flex;
        align-items: center;
        justify-content: center;

        i {
          font-size: 1.5rem;
        }
      }

      .alert-content {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .alert-count {
        font-size: 1.5rem;
        font-weight: 700;
      }

      .alert-label {
        font-size: 0.8125rem;
        color: var(--text-muted);
      }

      .alert-value {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-secondary);
      }

      &.expired {
        border-left: 4px solid var(--danger);

        .alert-icon {
          background: rgba(var(--danger-rgb), 0.1);
          color: var(--danger);
        }

        .alert-count {
          color: var(--danger);
        }
      }

      &.critical {
        border-left: 4px solid var(--warning);

        .alert-icon {
          background: rgba(var(--warning-rgb), 0.1);
          color: var(--warning);
        }

        .alert-count {
          color: var(--warning);
        }
      }

      &.warning {
        border-left: 4px solid var(--info);

        .alert-icon {
          background: rgba(var(--info-rgb), 0.1);
          color: var(--info);
        }

        .alert-count {
          color: var(--info);
        }
      }

      &.total {
        border-left: 4px solid var(--primary);

        .alert-icon {
          background: rgba(var(--primary-rgb), 0.1);
          color: var(--primary);
        }

        .alert-count {
          color: var(--primary);
        }
      }
    }

    /* Filters */
    .filters-section {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      label {
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      &.search {
        flex: 1;
        min-width: 250px;
        position: relative;

        i {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        input {
          padding-left: 2.5rem;
        }
      }
    }

    .form-select, .form-control {
      padding: 0.625rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      font-size: 0.875rem;
      background: var(--input-bg);
      color: var(--text-primary);
      min-width: 180px;

      &:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px var(--primary-light);
      }
    }

    /* Table */
    .table-section {
      background: var(--card-bg);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
      overflow: hidden;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      gap: 1rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border-color);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .table-container {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;

      th, td {
        padding: 0.75rem 1rem;
        text-align: left;
        border-bottom: 1px solid var(--border-color);
      }

      th {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        background: var(--bg-secondary);
      }

      .text-center { text-align: center; }
      .text-right { text-align: right; }

      .expired-row {
        background: rgba(var(--danger-rgb), 0.05);
      }
    }

    .product-info {
      display: flex;
      flex-direction: column;

      .product-name {
        font-weight: 500;
        color: var(--text-primary);
      }

      .product-sku {
        font-size: 0.75rem;
        color: var(--text-muted);
        font-family: monospace;
      }
    }

    .batch-number {
      font-family: monospace;
      color: var(--text-secondary);
    }

    .days-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius);
      font-size: 0.8125rem;
      font-weight: 500;

      &.days-expired {
        background: rgba(var(--danger-rgb), 0.1);
        color: var(--danger);
      }

      &.days-critical {
        background: rgba(var(--warning-rgb), 0.1);
        color: var(--warning);
      }

      &.days-warning {
        background: rgba(var(--info-rgb), 0.1);
        color: var(--info);
      }

      &.days-normal {
        background: var(--bg-secondary);
        color: var(--text-secondary);
      }
    }

    .value {
      font-weight: 600;
    }

    .action-buttons {
      display: flex;
      justify-content: center;
      gap: 0.25rem;
    }

    /* Recommendations */
    .recommendations-section {
      margin-top: 1.5rem;
      padding: 1.5rem;
      background: var(--card-bg);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);

      h3 {
        margin: 0 0 1rem;
        font-size: 1rem;
        font-weight: 600;
      }
    }

    .recommendations-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .recommendation {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border-radius: var(--radius);

      i {
        font-size: 1.5rem;
      }

      .recommendation-content {
        flex: 1;

        strong {
          display: block;
          margin-bottom: 0.25rem;
        }

        p {
          margin: 0;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
      }

      &.expired {
        background: rgba(var(--danger-rgb), 0.05);
        border: 1px solid rgba(var(--danger-rgb), 0.2);

        i { color: var(--danger); }
        strong { color: var(--danger); }
      }

      &.critical {
        background: rgba(var(--warning-rgb), 0.05);
        border: 1px solid rgba(var(--warning-rgb), 0.2);

        i { color: var(--warning); }
        strong { color: var(--warning); }
      }
    }

    /* Buttons */
    .btn {
      padding: 0.625rem 1rem;
      border-radius: var(--radius);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      border: none;

      &.btn-primary {
        background: var(--primary);
        color: white;

        &:hover { background: var(--primary-dark); }
      }

      &.btn-secondary {
        background: var(--bg-secondary);
        color: var(--text-primary);
        border: 1px solid var(--border-color);

        &:hover { background: var(--hover-bg); }
      }

      &.btn-danger {
        background: var(--danger);
        color: white;

        &:hover { opacity: 0.9; }
      }

      &.btn-warning {
        background: var(--warning);
        color: white;

        &:hover { opacity: 0.9; }
      }

      &.btn-icon {
        padding: 0.5rem;
        background: none;
        color: var(--text-muted);

        &:hover {
          background: var(--hover-bg);
          color: var(--text-primary);
        }

        &.danger:hover { color: var(--danger); }
      }

      &.btn-sm {
        padding: 0.375rem 0.75rem;
        font-size: 0.8125rem;
      }
    }

    @media (max-width: 768px) {
      .expiring-products-report {
        padding: 1rem;
      }

      .header-main {
        flex-direction: column;
      }

      .filters-section {
        flex-direction: column;
      }

      .filter-group {
        width: 100%;
      }

      .form-select, .form-control {
        width: 100%;
        min-width: 0;
      }
    }
  `]
})
export class ExpiringProductsReportComponent implements OnInit {
  private readonly inventoryService = inject(InventoryService);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);

  // Data
  products = signal<ExpiringProduct[]>([]);
  loading = signal(true);

  // Filters
  expiryRange = 'all';
  searchTerm = '';
  sortBy = 'daysAsc';

  // Pagination
  currentPage = signal(1);
  pageSize = signal(20);

  Math = Math; // Expose Math to template

  // Computed values
  filteredProducts = computed(() => {
    let filtered = [...this.products()];

    // Filter by expiry range
    if (this.expiryRange !== 'all') {
      if (this.expiryRange === 'expired') {
        filtered = filtered.filter(p => p.daysUntilExpiry < 0);
      } else {
        const days = parseInt(this.expiryRange, 10);
        filtered = filtered.filter(p => p.daysUntilExpiry >= 0 && p.daysUntilExpiry <= days);
      }
    }

    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.productName.toLowerCase().includes(term) ||
        p.productSku.toLowerCase().includes(term) ||
        p.batchNumber.toLowerCase().includes(term)
      );
    }

    // Sort
    switch (this.sortBy) {
      case 'daysAsc':
        filtered.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
        break;
      case 'daysDesc':
        filtered.sort((a, b) => b.daysUntilExpiry - a.daysUntilExpiry);
        break;
      case 'valueDesc':
        filtered.sort((a, b) => b.value - a.value);
        break;
      case 'quantityDesc':
        filtered.sort((a, b) => b.quantity - a.quantity);
        break;
    }

    return filtered;
  });

  paginatedProducts = computed(() => {
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return this.filteredProducts().slice(start, start + size);
  });

  // Statistics
  expiredCount = computed(() => this.products().filter(p => p.status === 'expired').length);
  expiredValue = computed(() => this.products().filter(p => p.status === 'expired').reduce((sum, p) => sum + p.value, 0));

  criticalCount = computed(() => this.products().filter(p => p.status === 'critical').length);
  criticalValue = computed(() => this.products().filter(p => p.status === 'critical').reduce((sum, p) => sum + p.value, 0));

  warningCount = computed(() => this.products().filter(p => p.status === 'warning').length);
  warningValue = computed(() => this.products().filter(p => p.status === 'warning').reduce((sum, p) => sum + p.value, 0));

  totalAtRisk = computed(() => this.expiredCount() + this.criticalCount() + this.warningCount());
  totalRiskValue = computed(() => this.expiredValue() + this.criticalValue() + this.warningValue());

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    // Mock data for demonstration - in real app, call actual API
    setTimeout(() => {
      const mockData: ExpiringProduct[] = this.generateMockData();
      this.products.set(mockData);
      this.loading.set(false);
    }, 800);
  }

  private generateMockData(): ExpiringProduct[] {
    const now = new Date();
    const products: ExpiringProduct[] = [];

    const productNames = [
      'Aspirin 500mg', 'Ibuprofen 400mg', 'Amoxicillin 250mg',
      'Paracetamol 500mg', 'Omeprazole 20mg', 'Metformin 850mg',
      'Atorvastatin 10mg', 'Lisinopril 5mg', 'Amlodipine 5mg',
      'Pantoprazole 40mg', 'Losartan 50mg', 'Diclofenac 50mg'
    ];

    const locations = ['Warehouse A', 'Warehouse B', 'Store 1', 'Store 2'];
    const manufacturers = ['Bosnalijek', 'Hemofarm', 'Pliva', 'Galenika'];

    // Generate products with various expiry dates
    for (let i = 0; i < 50; i++) {
      const daysUntilExpiry = Math.floor(Math.random() * 200) - 30; // -30 to +170 days
      const expiryDate = new Date(now);
      expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);

      let status: ExpiringProduct['status'];
      if (daysUntilExpiry < 0) {
        status = 'expired';
      } else if (daysUntilExpiry <= 30) {
        status = 'critical';
      } else if (daysUntilExpiry <= 90) {
        status = 'warning';
      } else {
        status = 'normal';
      }

      products.push({
        id: `EP-${i + 1}`,
        productName: productNames[Math.floor(Math.random() * productNames.length)],
        productSku: `SKU-${1000 + i}`,
        batchNumber: `BATCH-${2024}${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
        expiryDate,
        daysUntilExpiry,
        quantity: Math.floor(Math.random() * 500) + 10,
        location: locations[Math.floor(Math.random() * locations.length)],
        manufacturer: manufacturers[Math.floor(Math.random() * manufacturers.length)],
        value: Math.floor(Math.random() * 5000) + 100,
        status
      });
    }

    // Sort by days until expiry by default
    return products.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  }

  applyFilters(): void {
    this.currentPage.set(1);
  }

  onSearchChange(): void {
    this.currentPage.set(1);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.page);
  }

  getStatusVariant(status: string): BadgeVariant {
    const variants: Record<string, BadgeVariant> = {
      'expired': 'danger',
      'critical': 'warning',
      'warning': 'info',
      'normal': 'success'
    };
    return variants[status] || 'secondary';
  }

  hasExpiredOrCritical(): boolean {
    return this.expiredCount() > 0 || this.criticalCount() > 0;
  }

  exportReport(): void {
    this.notificationService.info(
      this.translateService.instant('reports.expiring.exportStarted')
    );
    // Implementation would generate CSV/Excel export
  }

  createTransfer(product: ExpiringProduct): void {
    // Navigate to transfer form with product pre-selected
    this.notificationService.info(
      this.translateService.instant('reports.expiring.transferInitiated', { product: product.productName })
    );
  }

  createAdjustment(product: ExpiringProduct): void {
    // Navigate to adjustment form
    this.notificationService.info(
      this.translateService.instant('reports.expiring.adjustmentInitiated', { product: product.productName })
    );
  }

  writeOff(product: ExpiringProduct): void {
    // Handle write-off for expired product
    this.notificationService.warning(
      this.translateService.instant('reports.expiring.writeOffConfirm', { product: product.productName })
    );
  }

  writeOffAllExpired(): void {
    this.notificationService.warning(
      this.translateService.instant('reports.expiring.writeOffAllConfirm', { count: this.expiredCount() })
    );
  }

  prioritizeForSale(): void {
    this.notificationService.info(
      this.translateService.instant('reports.expiring.prioritizeSuccess', { count: this.criticalCount() })
    );
  }
}
