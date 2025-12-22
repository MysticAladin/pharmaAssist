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
import { EuropeanDatePipe } from '../../core/pipes';

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
    EmptyStateComponent,
    EuropeanDatePipe
  ],
  templateUrl: './transfers-list-component/transfers-list.component.html',
  styleUrls: ['./transfers-list-component/transfers-list.component.scss']
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
