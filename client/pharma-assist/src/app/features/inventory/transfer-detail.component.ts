import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InventoryService } from '../../core/services/inventory.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { StockTransfer, getTransferStatusColor } from '../../core/models/inventory.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { BadgeVariant } from '../../shared/components/status-badge';

@Component({
  selector: 'app-transfer-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    StatusBadgeComponent
  ],
  template: `
    <div class="transfer-detail-page">
      @if (loading()) {
        <div class="loading-container">
          <div class="spinner"></div>
          <span>{{ 'common.loading' | translate }}</span>
        </div>
      } @else if (transfer()) {
        <!-- Header -->
        <header class="page-header">
          <div class="header-content">
            <div class="breadcrumb">
              <a routerLink="/inventory">{{ 'inventory.title' | translate }}</a>
              <i class="icon-chevron-right"></i>
              <a routerLink="/inventory/transfers">{{ 'inventory.transfers' | translate }}</a>
              <i class="icon-chevron-right"></i>
              <span>{{ transfer()!.referenceNumber }}</span>
            </div>
            <div class="title-row">
              <div class="title-section">
                <h1>{{ transfer()!.referenceNumber }}</h1>
                <app-status-badge
                  [variant]="getStatusColor(transfer()!.status)"
                  [label]="getStatusLabel(transfer()!.status) | translate">
                </app-status-badge>
              </div>
              <div class="header-actions">
                @if (transfer()!.status === 'pending') {
                  <button class="btn btn-secondary" (click)="markInTransit()">
                    <i class="icon-truck"></i>
                    {{ 'inventory.markInTransit' | translate }}
                  </button>
                  <button class="btn btn-danger" (click)="cancelTransfer()">
                    <i class="icon-x"></i>
                    {{ 'common.cancel' | translate }}
                  </button>
                }
                @if (transfer()!.status === 'in_transit') {
                  <button class="btn btn-primary" [routerLink]="['receive']">
                    <i class="icon-check"></i>
                    {{ 'inventory.receiveTransfer' | translate }}
                  </button>
                }
              </div>
            </div>
          </div>
        </header>

        <!-- Transfer Info -->
        <section class="info-section">
          <div class="info-grid">
            <div class="info-card">
              <h3>{{ 'inventory.from' | translate }}</h3>
              <div class="location-info">
                <i class="icon-map-pin"></i>
                <span>{{ transfer()!.sourceLocationName }}</span>
              </div>
            </div>
            <div class="info-arrow">
              <i class="icon-arrow-right"></i>
            </div>
            <div class="info-card">
              <h3>{{ 'inventory.to' | translate }}</h3>
              <div class="location-info">
                <i class="icon-map-pin"></i>
                <span>{{ transfer()!.destinationLocationName }}</span>
              </div>
            </div>
          </div>

          <div class="meta-info">
            <div class="meta-item">
              <span class="meta-label">{{ 'inventory.createdBy' | translate }}</span>
              <span class="meta-value">{{ transfer()!.createdBy }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">{{ 'inventory.createdAt' | translate }}</span>
              <span class="meta-value">{{ transfer()!.createdAt | date:'medium' }}</span>
            </div>
            @if (transfer()!.completedAt) {
              <div class="meta-item">
                <span class="meta-label">{{ 'inventory.completedAt' | translate }}</span>
                <span class="meta-value">{{ transfer()!.completedAt | date:'medium' }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">{{ 'inventory.completedBy' | translate }}</span>
                <span class="meta-value">{{ transfer()!.completedBy }}</span>
              </div>
            }
          </div>

          @if (transfer()!.notes) {
            <div class="notes-section">
              <h4>{{ 'inventory.notes' | translate }}</h4>
              <p>{{ transfer()!.notes }}</p>
            </div>
          }
        </section>

        <!-- Items -->
        <section class="items-section">
          <h2>{{ 'inventory.transferItems' | translate }}</h2>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ 'inventory.product' | translate }}</th>
                  <th>{{ 'inventory.sku' | translate }}</th>
                  @if (transfer()!.items[0]?.batchNumber) {
                    <th>{{ 'inventory.batch' | translate }}</th>
                    <th>{{ 'inventory.expiryDate' | translate }}</th>
                  }
                  <th class="text-right">{{ 'inventory.quantity' | translate }}</th>
                  @if (transfer()!.status === 'completed') {
                    <th class="text-right">{{ 'inventory.received' | translate }}</th>
                    <th class="text-center">{{ 'inventory.discrepancy' | translate }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (item of transfer()!.items; track item.id) {
                  <tr>
                    <td>{{ item.productName }}</td>
                    <td><code class="sku">{{ item.productSku }}</code></td>
                    @if (item.batchNumber) {
                      <td>{{ item.batchNumber }}</td>
                      <td>{{ item.expiryDate | date:'mediumDate' }}</td>
                    }
                    <td class="text-right">{{ item.quantity }}</td>
                    @if (transfer()!.status === 'completed') {
                      <td class="text-right">{{ item.receivedQuantity }}</td>
                      <td class="text-center">
                        @if (item.receivedQuantity !== item.quantity) {
                          <span class="discrepancy">
                            {{ (item.receivedQuantity || 0) - item.quantity }}
                          </span>
                        } @else {
                          <span class="match">✓</span>
                        }
                      </td>
                    }
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr>
                  <td [attr.colspan]="transfer()!.items[0]?.batchNumber ? 4 : 2" class="text-right">
                    <strong>{{ 'inventory.total' | translate }}:</strong>
                  </td>
                  <td class="text-right">
                    <strong>{{ getTotalQuantity() }}</strong>
                  </td>
                  @if (transfer()!.status === 'completed') {
                    <td class="text-right">
                      <strong>{{ getTotalReceived() }}</strong>
                    </td>
                    <td></td>
                  }
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <!-- Back Button -->
        <div class="page-actions">
          <button class="btn btn-secondary" routerLink="/inventory/transfers">
            <i class="icon-arrow-left"></i>
            {{ 'common.back' | translate }}
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .transfer-detail-page {
      padding: 1.5rem;
      max-width: 1000px;
      margin: 0 auto;
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

    .title-section {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .title-section h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    /* Info Section */
    .info-section {
      background: var(--surface);
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .info-grid {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .info-card {
      flex: 1;
      background: var(--surface-hover);
      border-radius: 8px;
      padding: 1rem;
    }

    .info-card h3 {
      margin: 0 0 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
    }

    .location-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.125rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .info-arrow {
      font-size: 1.5rem;
      color: var(--text-muted);
    }

    .meta-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .meta-item {
      display: flex;
      flex-direction: column;
    }

    .meta-label {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-bottom: 0.25rem;
    }

    .meta-value {
      font-weight: 500;
      color: var(--text-primary);
    }

    .notes-section {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .notes-section h4 {
      margin: 0 0 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .notes-section p {
      margin: 0;
      color: var(--text-primary);
    }

    /* Items Section */
    .items-section {
      background: var(--surface);
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .items-section h2 {
      margin: 0 0 1rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
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
    }

    .data-table tfoot td {
      border-top: 2px solid var(--border-color);
      border-bottom: none;
      background: var(--surface-hover);
    }

    .text-right {
      text-align: right !important;
    }

    .text-center {
      text-align: center !important;
    }

    .sku {
      background: var(--surface-hover);
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      font-size: 0.75rem;
    }

    .discrepancy {
      color: var(--color-danger);
      font-weight: 600;
    }

    .match {
      color: var(--color-success);
      font-weight: 600;
    }

    /* Page Actions */
    .page-actions {
      display: flex;
      gap: 0.75rem;
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

    .btn-danger {
      background: var(--color-danger);
      color: white;
    }

    .btn-danger:hover {
      opacity: 0.9;
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

      .info-grid {
        flex-direction: column;
      }

      .info-arrow {
        transform: rotate(90deg);
      }

      .info-card {
        width: 100%;
      }

      .header-actions {
        width: 100%;
        flex-direction: column;
      }
    }
  `]
})
export class TransferDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly inventoryService = inject(InventoryService);
  private readonly notificationService = inject(NotificationService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translateService = inject(TranslateService);

  transfer = signal<StockTransfer | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadTransfer(+id);
    }
  }

  loadTransfer(id: number): void {
    this.loading.set(true);
    this.inventoryService.getTransferById(id).subscribe({
      next: (response) => {
        if (response.data) {
          this.transfer.set(response.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.notificationService.error(
          this.translateService.instant('inventory.loadError')
        );
        this.loading.set(false);
        this.router.navigate(['/inventory/transfers']);
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'inventory.transferStatus.pending',
      in_transit: 'inventory.transferStatus.inTransit',
      completed: 'inventory.transferStatus.completed',
      cancelled: 'inventory.transferStatus.cancelled'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): BadgeVariant {
    return getTransferStatusColor(status as any);
  }

  getTotalQuantity(): number {
    return this.transfer()?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }

  getTotalReceived(): number {
    return this.transfer()?.items.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0) || 0;
  }

  markInTransit(): void {
    this.confirmationService.confirm({
      title: this.translateService.instant('inventory.confirmInTransit'),
      message: this.translateService.instant('inventory.confirmInTransitMessage'),
      variant: 'warning'
    }).then(confirmed => {
      if (confirmed && this.transfer()) {
        this.inventoryService.updateTransferStatus(this.transfer()!.id, 'in_transit').subscribe({
          next: () => {
            this.notificationService.success(
              this.translateService.instant('inventory.statusUpdated')
            );
            this.loadTransfer(this.transfer()!.id);
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

  cancelTransfer(): void {
    this.confirmationService.confirm({
      title: this.translateService.instant('inventory.confirmCancel'),
      message: this.translateService.instant('inventory.confirmCancelMessage'),
      variant: 'danger'
    }).then(confirmed => {
      if (confirmed && this.transfer()) {
        this.inventoryService.cancelTransfer(this.transfer()!.id, 'Cancelled by user').subscribe({
          next: () => {
            this.notificationService.success(
              this.translateService.instant('inventory.transferCancelled')
            );
            this.router.navigate(['/inventory/transfers']);
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
