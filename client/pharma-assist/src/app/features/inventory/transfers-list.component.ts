import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InventoryService } from '../../core/services/inventory.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import {
  StockTransfer,
  TransferFilters,
  TransferStatus,
  Location,
  getTransferStatusColor,
  getTransferStatusLabel
} from '../../core/models/inventory.model';
import { PagedResponse } from '../../core/models/product.model';
import { PaginationComponent, PageEvent } from '../../shared/components/pagination/pagination.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { BadgeVariant } from '../../shared/components/status-badge';

@Component({
  selector: 'app-transfers-list',
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
    <div class="transfers-page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="breadcrumb">
            <a routerLink="/inventory">{{ 'inventory.title' | translate }}</a>
            <i class="icon-chevron-right"></i>
            <span>{{ 'inventory.transfers' | translate }}</span>
          </div>
          <div class="title-row">
            <h1>{{ 'inventory.stockTransfers' | translate }}</h1>
            <button class="btn btn-primary" routerLink="new">
              <i class="icon-plus"></i>
              {{ 'inventory.newTransfer' | translate }}
            </button>
          </div>
        </div>
      </header>

      <!-- Filters -->
      <section class="filters-section">
        <div class="filter-row">
          <select class="form-select" [(ngModel)]="selectedStatus" (change)="applyFilters()">
            <option [value]="null">{{ 'inventory.allStatuses' | translate }}</option>
            @for (status of transferStatuses; track status) {
              <option [value]="status">{{ getStatusLabel(status) | translate }}</option>
            }
          </select>

          <select class="form-select" [(ngModel)]="selectedSourceLocation" (change)="applyFilters()">
            <option [value]="null">{{ 'inventory.allSourceLocations' | translate }}</option>
            @for (location of locations(); track location.id) {
              <option [value]="location.id">{{ location.name }}</option>
            }
          </select>

          <select class="form-select" [(ngModel)]="selectedDestLocation" (change)="applyFilters()">
            <option [value]="null">{{ 'inventory.allDestLocations' | translate }}</option>
            @for (location of locations(); track location.id) {
              <option [value]="location.id">{{ location.name }}</option>
            }
          </select>

          @if (hasFilters()) {
            <button class="btn btn-text" (click)="clearFilters()">
              <i class="icon-x"></i>
              {{ 'common.clearFilters' | translate }}
            </button>
          }
        </div>
      </section>

      <!-- Transfers Table -->
      <section class="table-section">
        @if (loading()) {
          <div class="loading-container">
            <div class="spinner"></div>
            <span>{{ 'common.loading' | translate }}</span>
          </div>
        } @else if (transfers().length === 0) {
          <app-empty-state
            icon="truck"
            [title]="'inventory.noTransfers' | translate"
            [description]="'inventory.noTransfersDescription' | translate">
          </app-empty-state>
        } @else {
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ 'inventory.reference' | translate }}</th>
                  <th>{{ 'inventory.from' | translate }}</th>
                  <th>{{ 'inventory.to' | translate }}</th>
                  <th class="text-center">{{ 'inventory.items' | translate }}</th>
                  <th class="text-center">{{ 'inventory.status' | translate }}</th>
                  <th>{{ 'inventory.createdAt' | translate }}</th>
                  <th>{{ 'inventory.createdBy' | translate }}</th>
                  <th class="text-center">{{ 'common.actions' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                @for (transfer of transfers(); track transfer.id) {
                  <tr>
                    <td>
                      <a class="reference-link" [routerLink]="[transfer.id]">
                        {{ transfer.referenceNumber }}
                      </a>
                    </td>
                    <td>{{ transfer.sourceLocationName }}</td>
                    <td>{{ transfer.destinationLocationName }}</td>
                    <td class="text-center">
                      <span class="items-count">{{ transfer.items.length }}</span>
                    </td>
                    <td class="text-center">
                      <app-status-badge
                        [variant]="getStatusColor(transfer.status)"
                        [label]="getStatusLabel(transfer.status) | translate">
                      </app-status-badge>
                    </td>
                    <td>{{ transfer.createdAt | date:'short' }}</td>
                    <td>{{ transfer.createdBy }}</td>
                    <td class="text-center">
                      <div class="action-buttons">
                        <button
                          class="btn btn-icon btn-sm"
                          [title]="'common.view' | translate"
                          [routerLink]="[transfer.id]">
                          <i class="icon-eye"></i>
                        </button>
                        @if (transfer.status === 'pending') {
                          <button
                            class="btn btn-icon btn-sm success"
                            [title]="'inventory.markInTransit' | translate"
                            (click)="markInTransit(transfer)">
                            <i class="icon-truck"></i>
                          </button>
                          <button
                            class="btn btn-icon btn-sm danger"
                            [title]="'common.cancel' | translate"
                            (click)="cancelTransfer(transfer)">
                            <i class="icon-x"></i>
                          </button>
                        }
                        @if (transfer.status === 'in_transit') {
                          <button
                            class="btn btn-icon btn-sm success"
                            [title]="'inventory.receive' | translate"
                            (click)="receiveTransfer(transfer)">
                            <i class="icon-check"></i>
                          </button>
                        }
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
    .transfers-page {
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

    .form-select {
      padding: 0.5rem 0.875rem;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      background: var(--surface);
      color: var(--text-primary);
      min-width: 180px;
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

    .text-center {
      text-align: center !important;
    }

    .reference-link {
      color: var(--primary);
      font-weight: 500;
      text-decoration: none;
    }

    .reference-link:hover {
      text-decoration: underline;
    }

    .items-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 24px;
      height: 24px;
      padding: 0 0.5rem;
      background: var(--surface-hover);
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 500;
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

    .btn-icon.success:hover {
      color: var(--color-success);
    }

    .btn-icon.danger:hover {
      color: var(--color-danger);
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

    /* Loading spinner */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      gap: 1rem;
      color: var(--text-secondary);
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

    @media (max-width: 768px) {
      .title-row {
        flex-direction: column;
        align-items: flex-start;
      }

      .filter-row {
        flex-direction: column;
        align-items: stretch;
      }

      .form-select {
        width: 100%;
      }
    }
  `]
})
export class TransfersListComponent implements OnInit {
  private readonly inventoryService = inject(InventoryService);
  private readonly notificationService = inject(NotificationService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translateService = inject(TranslateService);
  private readonly router = inject(Router);

  // State
  transfers = signal<StockTransfer[]>([]);
  locations = signal<Location[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  pageSize = signal(20);
  totalItems = signal(0);

  // Filters
  selectedStatus: TransferStatus | null = null;
  selectedSourceLocation: number | null = null;
  selectedDestLocation: number | null = null;

  transferStatuses: TransferStatus[] = ['pending', 'in_transit', 'completed', 'cancelled'];

  ngOnInit(): void {
    this.loadLocations();
    this.loadTransfers();
  }

  loadLocations(): void {
    this.inventoryService.getActiveLocations().subscribe({
      next: (response) => {
        if (response.data) {
          this.locations.set(response.data);
        }
      }
    });
  }

  loadTransfers(): void {
    this.loading.set(true);

    const filters: TransferFilters = {
      status: this.selectedStatus || undefined,
      sourceLocationId: this.selectedSourceLocation || undefined,
      destinationLocationId: this.selectedDestLocation || undefined,
      page: this.currentPage(),
      pageSize: this.pageSize()
    };

    this.inventoryService.getTransfers(filters).subscribe({
      next: (response: PagedResponse<StockTransfer>) => {
        this.transfers.set(response.data);
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
    this.loadTransfers();
  }

  clearFilters(): void {
    this.selectedStatus = null;
    this.selectedSourceLocation = null;
    this.selectedDestLocation = null;
    this.applyFilters();
  }

  hasFilters(): boolean {
    return !!(this.selectedStatus || this.selectedSourceLocation || this.selectedDestLocation);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.page);
    this.loadTransfers();
  }

  getStatusLabel(status: TransferStatus): string {
    const labels: Record<TransferStatus, string> = {
      pending: 'inventory.transferStatus.pending',
      in_transit: 'inventory.transferStatus.inTransit',
      completed: 'inventory.transferStatus.completed',
      cancelled: 'inventory.transferStatus.cancelled'
    };
    return labels[status];
  }

  getStatusColor(status: TransferStatus): BadgeVariant {
    return getTransferStatusColor(status);
  }

  markInTransit(transfer: StockTransfer): void {
    this.confirmationService.confirm({
      title: this.translateService.instant('inventory.confirmInTransit'),
      message: this.translateService.instant('inventory.confirmInTransitMessage'),
      variant: 'warning'
    }).then(confirmed => {
      if (confirmed) {
        this.inventoryService.updateTransferStatus(transfer.id, 'in_transit').subscribe({
          next: () => {
            this.notificationService.success(
              this.translateService.instant('inventory.statusUpdated')
            );
            this.loadTransfers();
          },
          error: () => {
            this.notificationService.error(
              this.translateService.instant('inventory.statusUpdateError')
            );
          }
        });
      }
    });
  }

  receiveTransfer(transfer: StockTransfer): void {
    this.router.navigate(['/inventory/transfers', transfer.id, 'receive']);
  }

  cancelTransfer(transfer: StockTransfer): void {
    this.confirmationService.confirm({
      title: this.translateService.instant('inventory.confirmCancel'),
      message: this.translateService.instant('inventory.confirmCancelMessage'),
      variant: 'danger'
    }).then(confirmed => {
      if (confirmed) {
        this.inventoryService.cancelTransfer(transfer.id, 'Cancelled by user').subscribe({
          next: () => {
            this.notificationService.success(
              this.translateService.instant('inventory.transferCancelled')
            );
            this.loadTransfers();
          },
          error: () => {
            this.notificationService.error(
              this.translateService.instant('inventory.cancelError')
            );
          }
        });
      }
    });
  }
}
