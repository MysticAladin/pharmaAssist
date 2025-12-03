import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InventoryService } from '../../core/services/inventory.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  StockAdjustment,
  AdjustmentFilters,
  AdjustmentType,
  getAdjustmentTypeColor,
  getAdjustmentTypeLabel
} from '../../core/models/inventory.model';
import { PagedResponse } from '../../core/models/product.model';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { BadgeVariant } from '../../shared/components/status-badge';

@Component({
  selector: 'app-adjustments-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslateModule,
    PaginationComponent,
    StatusBadgeComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="adjustments-page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="breadcrumb">
            <a routerLink="/inventory">{{ 'inventory.title' | translate }}</a>
            <i class="icon-chevron-right"></i>
            <span>{{ 'inventory.adjustments' | translate }}</span>
          </div>
          <div class="title-row">
            <h1>{{ 'inventory.adjustmentHistory' | translate }}</h1>
            <button class="btn btn-primary" routerLink="new">
              <i class="icon-plus"></i>
              {{ 'inventory.newAdjustment' | translate }}
            </button>
          </div>
        </div>
      </header>

      <!-- Filters -->
      <section class="filters-section">
        <div class="filter-row">
          <select class="form-select" [(ngModel)]="selectedType" (change)="applyFilters()">
            <option [value]="null">{{ 'inventory.allTypes' | translate }}</option>
            @for (type of adjustmentTypes; track type) {
              <option [value]="type">{{ getTypeLabel(type) | translate }}</option>
            }
          </select>

          <div class="date-range">
            <input
              type="date"
              class="form-control"
              [(ngModel)]="startDate"
              (change)="applyFilters()"
              [placeholder]="'common.startDate' | translate">
            <span>-</span>
            <input
              type="date"
              class="form-control"
              [(ngModel)]="endDate"
              (change)="applyFilters()"
              [placeholder]="'common.endDate' | translate">
          </div>

          @if (hasFilters()) {
            <button class="btn btn-text" (click)="clearFilters()">
              <i class="icon-x"></i>
              {{ 'common.clearFilters' | translate }}
            </button>
          }
        </div>
      </section>

      <!-- Adjustments Table -->
      <section class="table-section">
        @if (loading()) {
          <div class="loading-container">
            <div class="spinner"></div>
          </div>
        } @else if (adjustments().length === 0) {
          <app-empty-state
            icon="sliders"
            [title]="'inventory.noAdjustments' | translate"
            [description]="'inventory.noAdjustmentsDescription' | translate">
          </app-empty-state>
        } @else {
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ 'inventory.date' | translate }}</th>
                  <th>{{ 'inventory.product' | translate }}</th>
                  <th>{{ 'inventory.type' | translate }}</th>
                  <th class="text-right">{{ 'inventory.quantity' | translate }}</th>
                  <th class="text-right">{{ 'inventory.previousStock' | translate }}</th>
                  <th class="text-right">{{ 'inventory.newStock' | translate }}</th>
                  <th>{{ 'inventory.reason' | translate }}</th>
                  <th>{{ 'inventory.adjustedBy' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                @for (adjustment of adjustments(); track adjustment.id) {
                  <tr>
                    <td>
                      <span class="date">{{ adjustment.adjustedAt | date:'short' }}</span>
                    </td>
                    <td>
                      <div class="product-info">
                        <span class="product-name">{{ adjustment.productName }}</span>
                        <code class="sku">{{ adjustment.productSku }}</code>
                      </div>
                    </td>
                    <td>
                      <app-status-badge
                        [variant]="getTypeColor(adjustment.adjustmentType)"
                        [label]="getTypeLabel(adjustment.adjustmentType) | translate">
                      </app-status-badge>
                    </td>
                    <td class="text-right">
                      <span
                        class="quantity-change"
                        [class.positive]="isAdditionType(adjustment.adjustmentType)"
                        [class.negative]="!isAdditionType(adjustment.adjustmentType)">
                        {{ isAdditionType(adjustment.adjustmentType) ? '+' : '-' }}{{ adjustment.quantity }}
                      </span>
                    </td>
                    <td class="text-right">{{ adjustment.previousQuantity }}</td>
                    <td class="text-right">
                      <strong>{{ adjustment.newQuantity }}</strong>
                    </td>
                    <td>
                      <span class="reason">{{ adjustment.reason }}</span>
                      @if (adjustment.notes) {
                        <span class="notes" [title]="adjustment.notes">
                          <i class="icon-info"></i>
                        </span>
                      }
                    </td>
                    <td>{{ adjustment.adjustedBy }}</td>
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
    .adjustments-page {
      padding: 1.5rem;
    }

    .page-header {
      margin-bottom: 1.5rem;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
    }

    .breadcrumb a {
      color: var(--primary);
      text-decoration: none;
    }

    .breadcrumb a:hover {
      text-decoration: underline;
    }

    .title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .title-row h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    /* Filters */
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

    .form-select,
    .form-control {
      padding: 0.5rem 0.875rem;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      background: var(--surface);
      color: var(--text-primary);
    }

    .date-range {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .date-range input {
      width: 150px;
    }

    .btn-text {
      background: transparent;
      border: none;
      color: var(--primary);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.875rem;
      padding: 0.5rem;
    }

    .btn-text:hover {
      text-decoration: underline;
    }

    /* Table */
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

    .text-right {
      text-align: right !important;
    }

    .date {
      white-space: nowrap;
    }

    .product-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .product-name {
      font-weight: 500;
      color: var(--text-primary);
    }

    .sku {
      background: var(--surface-hover);
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      font-size: 0.75rem;
    }

    .quantity-change {
      font-weight: 600;
    }

    .quantity-change.positive {
      color: var(--color-success);
    }

    .quantity-change.negative {
      color: var(--color-danger);
    }

    .reason {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .notes {
      margin-left: 0.5rem;
      color: var(--text-muted);
      cursor: help;
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

    @media (max-width: 768px) {
      .title-row {
        flex-direction: column;
        align-items: flex-start;
      }

      .filter-row {
        flex-direction: column;
        align-items: stretch;
      }

      .date-range {
        flex-direction: column;
      }

      .date-range input {
        width: 100%;
      }
    }
  `]
})
export class AdjustmentsListComponent implements OnInit {
  private readonly inventoryService = inject(InventoryService);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);

  // State
  adjustments = signal<StockAdjustment[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  pageSize = signal(20);
  totalItems = signal(0);

  // Filters
  selectedType: AdjustmentType | null = null;
  startDate = '';
  endDate = '';
  productId: number | null = null;

  adjustmentTypes: AdjustmentType[] = ['addition', 'removal', 'correction', 'damaged', 'expired', 'returned'];

  ngOnInit(): void {
    // Check for pre-selected product from query params
    const productIdParam = this.route.snapshot.queryParams['productId'];
    if (productIdParam) {
      this.productId = +productIdParam;
    }

    this.loadAdjustments();
  }

  loadAdjustments(): void {
    this.loading.set(true);

    const filters: AdjustmentFilters = {
      productId: this.productId || undefined,
      adjustmentType: this.selectedType || undefined,
      startDate: this.startDate || undefined,
      endDate: this.endDate || undefined,
      page: this.currentPage(),
      pageSize: this.pageSize()
    };

    this.inventoryService.getAdjustments(filters).subscribe({
      next: (response: PagedResponse<StockAdjustment>) => {
        this.adjustments.set(response.data);
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

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadAdjustments();
  }

  clearFilters(): void {
    this.selectedType = null;
    this.startDate = '';
    this.endDate = '';
    this.productId = null;
    this.applyFilters();
  }

  hasFilters(): boolean {
    return !!(this.selectedType || this.startDate || this.endDate || this.productId);
  }

  onPageChange(event: { page: number }): void {
    this.currentPage.set(event.page);
    this.loadAdjustments();
  }

  getTypeLabel(type: AdjustmentType): string {
    const labels: Record<AdjustmentType, string> = {
      addition: 'inventory.type.addition',
      removal: 'inventory.type.removal',
      correction: 'inventory.type.correction',
      damaged: 'inventory.type.damaged',
      expired: 'inventory.type.expired',
      returned: 'inventory.type.returned'
    };
    return labels[type];
  }

  getTypeColor(type: AdjustmentType): BadgeVariant {
    return getAdjustmentTypeColor(type);
  }

  isAdditionType(type: AdjustmentType): boolean {
    return ['addition', 'returned'].includes(type);
  }
}
