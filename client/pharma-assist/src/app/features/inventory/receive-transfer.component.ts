import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InventoryService } from '../../core/services/inventory.service';
import { NotificationService } from '../../core/services/notification.service';
import { StockTransfer, StockTransferItem } from '../../core/models/inventory.model';

interface ReceiveItem extends StockTransferItem {
  receivedQty: number;
  notes?: string;
}

@Component({
  selector: 'app-receive-transfer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslateModule
  ],
  template: `
    <div class="receive-transfer-page">
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
              <a [routerLink]="['/inventory/transfers', transfer()!.id]">{{ transfer()!.referenceNumber }}</a>
              <i class="icon-chevron-right"></i>
              <span>{{ 'inventory.receive' | translate }}</span>
            </div>
            <h1>{{ 'inventory.receiveTransfer' | translate }}</h1>
            <p class="subtitle">{{ transfer()!.referenceNumber }}</p>
          </div>
        </header>

        <!-- Transfer Info -->
        <section class="info-section">
          <div class="info-row">
            <div class="info-item">
              <span class="info-label">{{ 'inventory.from' | translate }}</span>
              <span class="info-value">{{ transfer()!.sourceLocationName }}</span>
            </div>
            <i class="icon-arrow-right"></i>
            <div class="info-item">
              <span class="info-label">{{ 'inventory.to' | translate }}</span>
              <span class="info-value">{{ transfer()!.destinationLocationName }}</span>
            </div>
          </div>
        </section>

        <!-- Items to Receive -->
        <section class="items-section">
          <div class="section-header">
            <h2>{{ 'inventory.itemsToReceive' | translate }}</h2>
            <button class="btn btn-text" (click)="receiveAll()">
              <i class="icon-check-circle"></i>
              {{ 'inventory.receiveAll' | translate }}
            </button>
          </div>

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ 'inventory.product' | translate }}</th>
                  <th>{{ 'inventory.sku' | translate }}</th>
                  @if (items()[0]?.batchNumber) {
                    <th>{{ 'inventory.batch' | translate }}</th>
                  }
                  <th class="text-right">{{ 'inventory.expected' | translate }}</th>
                  <th class="text-right">{{ 'inventory.received' | translate }}</th>
                  <th class="text-center">{{ 'inventory.status' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                @for (item of items(); track item.id) {
                  <tr [class.discrepancy]="item.receivedQty !== item.quantity">
                    <td>{{ item.productName }}</td>
                    <td><code class="sku">{{ item.productSku }}</code></td>
                    @if (item.batchNumber) {
                      <td>{{ item.batchNumber }}</td>
                    }
                    <td class="text-right">{{ item.quantity }}</td>
                    <td class="text-right">
                      <input
                        type="number"
                        class="quantity-input"
                        [(ngModel)]="item.receivedQty"
                        min="0"
                        [max]="item.quantity * 2">
                    </td>
                    <td class="text-center">
                      @if (item.receivedQty === item.quantity) {
                        <span class="status-badge success">
                          <i class="icon-check"></i>
                          {{ 'inventory.match' | translate }}
                        </span>
                      } @else if (item.receivedQty < item.quantity) {
                        <span class="status-badge warning">
                          <i class="icon-alert-triangle"></i>
                          {{ 'inventory.shortage' | translate }}: {{ item.quantity - item.receivedQty }}
                        </span>
                      } @else {
                        <span class="status-badge info">
                          <i class="icon-plus"></i>
                          {{ 'inventory.overage' | translate }}: {{ item.receivedQty - item.quantity }}
                        </span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr>
                  <td [attr.colspan]="items()[0]?.batchNumber ? 3 : 2" class="text-right">
                    <strong>{{ 'inventory.total' | translate }}:</strong>
                  </td>
                  <td class="text-right">
                    <strong>{{ getTotalExpected() }}</strong>
                  </td>
                  <td class="text-right">
                    <strong [class.text-danger]="getTotalReceived() !== getTotalExpected()">
                      {{ getTotalReceived() }}
                    </strong>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          @if (hasDiscrepancies()) {
            <div class="discrepancy-note">
              <i class="icon-alert-circle"></i>
              <p>{{ 'inventory.discrepancyNote' | translate }}</p>
            </div>
          }
        </section>

        <!-- Actions -->
        <div class="form-actions">
          <button class="btn btn-secondary" [routerLink]="['/inventory/transfers', transfer()!.id]">
            {{ 'common.cancel' | translate }}
          </button>
          <button
            class="btn btn-primary"
            (click)="confirmReceive()"
            [disabled]="submitting()">
            @if (submitting()) {
              <span class="spinner-small light"></span>
            }
            {{ 'inventory.confirmReceive' | translate }}
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .receive-transfer-page {
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

    .page-header h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .subtitle {
      margin: 0.25rem 0 0;
      color: var(--text-secondary);
    }

    /* Info Section */
    .info-section {
      background: var(--surface);
      border-radius: 8px;
      padding: 1rem 1.5rem;
      margin-bottom: 1.5rem;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
    }

    .info-label {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-bottom: 0.25rem;
    }

    .info-value {
      font-weight: 600;
      color: var(--text-primary);
    }

    .info-row > i {
      color: var(--text-muted);
      font-size: 1.25rem;
    }

    /* Items Section */
    .items-section {
      background: var(--surface);
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .section-header h2 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
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

    .data-table tr.discrepancy {
      background: rgba(var(--color-warning-rgb), 0.05);
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

    .text-danger {
      color: var(--color-danger);
    }

    .sku {
      background: var(--surface-hover);
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      font-size: 0.75rem;
    }

    .quantity-input {
      width: 80px;
      padding: 0.375rem 0.5rem;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      text-align: right;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-badge.success {
      background: var(--color-success-bg);
      color: var(--color-success);
    }

    .status-badge.warning {
      background: var(--color-warning-bg);
      color: var(--color-warning);
    }

    .status-badge.info {
      background: var(--color-info-bg);
      color: var(--color-info);
    }

    .discrepancy-note {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-top: 1rem;
      padding: 1rem;
      background: var(--color-warning-bg);
      border-radius: 6px;
      color: var(--color-warning);
    }

    .discrepancy-note i {
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .discrepancy-note p {
      margin: 0;
      font-size: 0.875rem;
    }

    /* Actions */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

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

    .btn-primary:hover:not(:disabled) {
      background: var(--primary-dark);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: var(--surface-hover);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
    }

    .btn-secondary:hover {
      background: var(--border-color);
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

    .spinner-small {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .spinner-small.light {
      border-color: rgba(255, 255, 255, 0.3);
      border-top-color: white;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .info-row {
        flex-direction: column;
        gap: 0.5rem;
      }

      .info-row > i {
        transform: rotate(90deg);
      }

      .form-actions {
        flex-direction: column-reverse;
      }

      .form-actions .btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class ReceiveTransferComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly inventoryService = inject(InventoryService);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);

  transfer = signal<StockTransfer | null>(null);
  items = signal<ReceiveItem[]>([]);
  loading = signal(true);
  submitting = signal(false);

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
          // Convert items to receive items with receivedQty defaulting to expected quantity
          const receiveItems = response.data.items.map(item => ({
            ...item,
            receivedQty: item.quantity
          }));
          this.items.set(receiveItems);
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

  receiveAll(): void {
    const updated = this.items().map(item => ({
      ...item,
      receivedQty: item.quantity
    }));
    this.items.set(updated);
  }

  getTotalExpected(): number {
    return this.items().reduce((sum, item) => sum + item.quantity, 0);
  }

  getTotalReceived(): number {
    return this.items().reduce((sum, item) => sum + item.receivedQty, 0);
  }

  hasDiscrepancies(): boolean {
    return this.items().some(item => item.receivedQty !== item.quantity);
  }

  confirmReceive(): void {
    if (!this.transfer()) return;

    this.submitting.set(true);

    const receivedItems = this.items().map(item => ({
      itemId: item.id,
      receivedQuantity: item.receivedQty
    }));

    this.inventoryService.updateTransferStatus(
      this.transfer()!.id,
      'completed',
      receivedItems
    ).subscribe({
      next: () => {
        this.notificationService.success(
          this.translateService.instant('inventory.transferReceived')
        );
        this.router.navigate(['/inventory/transfers']);
      },
      error: () => {
        this.notificationService.error(
          this.translateService.instant('inventory.receiveError')
        );
        this.submitting.set(false);
      }
    });
  }
}
