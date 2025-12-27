import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { PortalOrdersService, PortalOrder, OrderStatus } from '../../services/portal-orders.service';
import { PortalClaimsService, ClaimType, CreateClaimRequest } from '../../services/portal-claims.service';
import { KmCurrencyPipe } from '../../../../core/pipes/km-currency.pipe';

interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

@Component({
  selector: 'app-portal-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule, KmCurrencyPipe],
  template: `
    <div class="order-detail-page">
      <a routerLink="/portal/orders" class="back-link">← {{ 'common.back' | translate }}</a>

      @if (loading()) {
        <div class="loading"><div class="spinner"></div></div>
      } @else if (order()) {
        <div class="order-header">
          <div>
            <h1>{{ 'portal.orders.order' | translate }} #{{ order()!.orderNumber }}</h1>
            <p class="order-date">{{ order()!.orderDate | date:'medium' }}</p>
          </div>
          <span class="status" [class]="getStatusClass(order()!.status)">
            {{ getStatusName(order()!.status) }}
          </span>
        </div>

        <div class="order-content">
          <div class="main-content">
            <!-- Alert Messages -->
            @if (successMessage()) {
              <div class="alert alert-success">
                <span class="icon">✓</span>
                {{ successMessage() }}
                <button class="close" (click)="successMessage.set('')">×</button>
              </div>
            }
            @if (errorMessage()) {
              <div class="alert alert-error">
                <span class="icon">!</span>
                {{ errorMessage() }}
                <button class="close" (click)="errorMessage.set('')">×</button>
              </div>
            }

            <!-- Items -->
            <div class="section">
              <h3>{{ 'portal.orderDetail.items' | translate }}</h3>
              <div class="items-table" [class.has-actions]="canFileClaim()">
                <div class="table-header">
                  <span>{{ 'portal.orderDetail.product' | translate }}</span>
                  <span>{{ 'portal.orderDetail.qty' | translate }}</span>
                  <span>{{ 'portal.orderDetail.price' | translate }}</span>
                  <span>{{ 'portal.orderDetail.total' | translate }}</span>
                  @if (canFileClaim()) {
                    <span>{{ 'portal.claims.actions' | translate }}</span>
                  }
                </div>
                @for (item of orderItems(); track item.id) {
                  <div class="table-row">
                    <div class="product-info">
                      <span class="product-name">{{ item.productName }}</span>
                      <span class="product-sku">SKU: {{ item.sku }}</span>
                    </div>
                    <span>{{ item.quantity }}</span>
                    <span>{{ item.unitPrice | kmCurrency }}</span>
                    <span class="item-total">{{ item.total | kmCurrency }}</span>
                    @if (canFileClaim()) {
                      <button class="btn-claim" (click)="openClaimModal(item)">
                        {{ 'portal.claims.fileClaim' | translate }}
                      </button>
                    }
                  </div>
                }
              </div>
            </div>
          </div>

          <div class="sidebar">
            <!-- Summary -->
            <div class="section summary-section">
              <h3>{{ 'portal.orderDetail.summary' | translate }}</h3>
              <div class="summary-row"><span>{{ 'portal.cart.subtotal' | translate }}</span><span>{{ order()!.subTotal | kmCurrency }}</span></div>
              <div class="summary-row"><span>{{ 'portal.cart.delivery' | translate }}</span><span>{{ order()!.shippingAmount | kmCurrency }}</span></div>
              <div class="summary-row"><span>{{ 'portal.cart.tax' | translate }}</span><span>{{ order()!.taxAmount | kmCurrency }}</span></div>
              <div class="summary-row total"><span>{{ 'portal.cart.total' | translate }}</span><span>{{ order()!.totalAmount | kmCurrency }}</span></div>
            </div>

            <!-- Actions -->
            <div class="section actions-section">
              <h3>{{ 'portal.orderDetail.actions' | translate }}</h3>
              <div class="portal-actions">
                <button class="btn btn-primary" (click)="reorder()" [disabled]="actionLoading()">
                  <span class="icon">🔄</span> {{ 'portal.orderDetail.reorder' | translate }}
                </button>
                <button class="btn btn-outline" (click)="downloadInvoice()">
                  <span class="icon">📄</span> {{ 'portal.orderDetail.downloadInvoice' | translate }}
                </button>
                @if (canCancelOrder()) {
                  <button class="btn btn-danger" (click)="showCancelModal.set(true)" [disabled]="actionLoading()">
                    <span class="icon">✕</span> {{ 'portal.orders.cancel' | translate }}
                  </button>
                }
                @if (canFileClaim()) {
                  <a routerLink="/portal/claims" class="btn btn-secondary">
                    <span class="icon">📋</span> {{ 'portal.claims.viewClaims' | translate }}
                  </a>
                }
              </div>
            </div>

            <!-- Payment Info -->
            <div class="section">
              <h3>{{ 'portal.orderDetail.payment' | translate }}</h3>
              <p>{{ order()!.paymentMethodName || 'Faktura' }}</p>
              <p class="payment-status" [class]="'status-' + order()!.paymentStatus">
                {{ order()!.paymentStatusName || 'Na čekanju' }}
              </p>
            </div>

            <!-- Notes -->
            @if (order()!.notes) {
              <div class="section">
                <h3>{{ 'portal.orderDetail.notes' | translate }}</h3>
                <p>{{ order()!.notes }}</p>
              </div>
            }

            <!-- Cancellation Reason -->
            @if (order()!.cancellationReason) {
              <div class="section cancellation-reason">
                <h3>{{ 'portal.orders.cancellationReason' | translate }}</h3>
                <p>{{ order()!.cancellationReason }}</p>
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="not-found">
          <span class="icon">📦</span>
          <h3>{{ 'portal.orders.notFound' | translate }}</h3>
          <a routerLink="/portal/orders" class="btn btn-primary">{{ 'portal.orders.backToOrders' | translate }}</a>
        </div>
      }

      <!-- Cancel Order Modal -->
      @if (showCancelModal()) {
        <div class="modal-overlay" (click)="showCancelModal.set(false)">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ 'portal.orders.cancelOrder' | translate }}</h2>
              <button class="modal-close" (click)="showCancelModal.set(false)">×</button>
            </div>
            <div class="modal-body">
              <p>{{ 'portal.orders.cancelConfirmation' | translate }}</p>
              <div class="form-group">
                <label>{{ 'portal.orders.cancellationReason' | translate }} *</label>
                <textarea [(ngModel)]="cancelReason" rows="3" [placeholder]="'portal.orders.reasonPlaceholder' | translate"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline" (click)="showCancelModal.set(false)">{{ 'common.cancel' | translate }}</button>
              <button class="btn btn-danger" (click)="cancelOrder()" [disabled]="!cancelReason.trim() || actionLoading()">
                @if (actionLoading()) {
                  <span class="spinner-small"></span>
                }
                {{ 'portal.orders.confirmCancel' | translate }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- File Claim Modal -->
      @if (showClaimModal()) {
        <div class="modal-overlay" (click)="showClaimModal.set(false)">
          <div class="modal modal-lg" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ 'portal.claims.fileClaimTitle' | translate }}</h2>
              <button class="modal-close" (click)="showClaimModal.set(false)">×</button>
            </div>
            <div class="modal-body">
              @if (selectedItem()) {
                <div class="claim-product">
                  <strong>{{ selectedItem()!.productName }}</strong>
                  <span class="sku">SKU: {{ selectedItem()!.sku }}</span>
                </div>
              }
              <div class="form-group">
                <label>{{ 'portal.claims.type' | translate }} *</label>
                <select [(ngModel)]="claimType">
                  @for (option of claimTypeOptions; track option.value) {
                    <option [value]="option.value">{{ option.label }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label>{{ 'portal.claims.quantity' | translate }} *</label>
                <input type="number" [(ngModel)]="claimQuantity" min="1" [max]="selectedItem()?.quantity || 1" />
              </div>
              <div class="form-group">
                <label>{{ 'portal.claims.reason' | translate }} *</label>
                <input type="text" [(ngModel)]="claimReason" [placeholder]="'portal.claims.reasonPlaceholder' | translate" />
              </div>
              <div class="form-group">
                <label>{{ 'portal.claims.description' | translate }}</label>
                <textarea [(ngModel)]="claimDescription" rows="3" [placeholder]="'portal.claims.descriptionPlaceholder' | translate"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline" (click)="showClaimModal.set(false)">{{ 'common.cancel' | translate }}</button>
              <button class="btn btn-primary" (click)="submitClaim()" [disabled]="!isClaimValid() || actionLoading()">
                @if (actionLoading()) {
                  <span class="spinner-small"></span>
                }
                {{ 'portal.claims.submit' | translate }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .order-detail-page { max-width: 1200px; margin: 0 auto; }
    .back-link { display: inline-block; color: var(--primary-600); text-decoration: none; margin-bottom: 1.5rem; font-weight: 500; }
    .back-link:hover { text-decoration: underline; }

    .loading, .not-found { text-align: center; padding: 4rem; }
    .spinner { width: 40px; height: 40px; border: 3px solid var(--border-light); border-top-color: var(--primary-600); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
    .spinner-small { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite; display: inline-block; margin-right: 0.5rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .not-found .icon { font-size: 4rem; display: block; margin-bottom: 1rem; }

    .alert { display: flex; align-items: center; gap: 0.75rem; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
    .alert-success { background: var(--color-success-bg); color: var(--color-success-text); }
    .alert-error { background: var(--color-error-bg); color: var(--color-error-text); }
    .alert .icon { font-weight: bold; }
    .alert .close { margin-left: auto; background: none; border: none; font-size: 1.25rem; cursor: pointer; opacity: 0.7; }
    .alert .close:hover { opacity: 1; }

    .order-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .order-header h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .order-date { color: var(--text-secondary); }

    .status { padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
    .status-pending { background: var(--status-pending-bg); color: var(--status-pending-text); }
    .status-confirmed { background: var(--color-info-bg); color: var(--color-info-text); }
    .status-processing { background: var(--status-processing-bg); color: var(--status-processing-text); }
    .status-ready { background: var(--accent-purple-bg); color: var(--accent-purple); }
    .status-shipped { background: var(--status-shipped-bg); color: var(--status-shipped-text); }
    .status-delivered { background: var(--status-completed-bg); color: var(--status-completed-text); }
    .status-cancelled { background: var(--status-cancelled-bg); color: var(--status-cancelled-text); }
    .status-returned { background: var(--status-pending-bg); color: var(--status-pending-text); }

    .order-content { display: grid; grid-template-columns: 1fr 360px; gap: 2rem; }
    .main-content { display: flex; flex-direction: column; gap: 1.5rem; }
    .section { background: var(--card-bg); border: 1px solid var(--card-border); box-shadow: var(--card-shadow); border-radius: var(--radius-lg); padding: 1.5rem; }
    .section h3 { font-size: 1rem; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-light); }

    .items-table { overflow-x: auto; }
    .items-table.has-actions .table-header,
    .items-table.has-actions .table-row { grid-template-columns: 2fr 0.75fr 1fr 1fr 1fr; min-width: 600px; }
    .items-table:not(.has-actions) .table-header,
    .items-table:not(.has-actions) .table-row { grid-template-columns: 2fr 0.75fr 1fr 1fr; min-width: 520px; }
    .table-header { display: grid; gap: 1rem; padding: 0.75rem 0; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); border-bottom: 1px solid var(--border-color); }
    .table-row { display: grid; gap: 1rem; padding: 1rem 0; align-items: center; border-bottom: 1px solid var(--border-color); }
    .table-row:last-child { border-bottom: none; }
    .product-name { font-weight: 500; display: block; }
    .product-sku { font-size: 0.75rem; color: var(--text-secondary); }
    .item-total { font-weight: 600; }
    .btn-claim { padding: 0.375rem 0.75rem; font-size: 0.75rem; border-radius: 6px; background: var(--color-warning); color: var(--text-inverse); border: none; cursor: pointer; white-space: nowrap; }
    .btn-claim:hover { opacity: 0.9; }

    .sidebar { display: flex; flex-direction: column; gap: 1rem; }
    .summary-row { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
    .summary-row.total { font-size: 1.25rem; font-weight: 700; padding-top: 1rem; margin-top: 0.5rem; border-top: 1px solid var(--border-light); color: var(--primary-600); }

    .portal-actions { display: flex; flex-direction: column; gap: 0.5rem; align-items: stretch; }
    .portal-actions .btn { width: 100%; }
    .icon { font-size: 1rem; }

    .payment-status { margin-top: 0.5rem; font-weight: 500; }
    .cancellation-reason { background: var(--color-error-bg); border: 1px solid var(--color-error-light); }
    .cancellation-reason h3 { color: var(--color-error-text); }

    /* Modal styles */
    .modal-overlay { position: fixed; inset: 0; background: var(--surface-overlay); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: var(--card-bg); border: 1px solid var(--card-border); box-shadow: var(--shadow-lg); border-radius: var(--radius-lg); width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
    .modal-lg { max-width: 560px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-light); }
    .modal-header h2 { font-size: 1.25rem; margin: 0; }
    .modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary); }
    .modal-body { padding: 1.5rem; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid var(--border-light); display: flex; justify-content: flex-end; gap: 0.75rem; }

    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-weight: 500; margin-bottom: 0.5rem; font-size: 0.875rem; }
    .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 0.75rem; border: 1px solid var(--input-border); border-radius: var(--radius-md); font-size: 0.875rem; background: var(--input-bg); color: var(--input-text); }
    .form-group input::placeholder, .form-group textarea::placeholder { color: var(--input-placeholder); }
    .form-group input:focus, .form-group textarea:focus, .form-group select:focus { outline: none; border-color: var(--input-border-focus); }

    .claim-product { background: var(--surface-secondary); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1rem; }
    .claim-product strong { display: block; }
    .claim-product .sku { font-size: 0.75rem; color: var(--text-secondary); }

    @media (max-width: 1024px) {
      .order-content { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .table-header, .table-row { grid-template-columns: 1fr 1fr; }
      .table-header span:nth-child(3), .table-header span:nth-child(5),
      .table-row span:nth-child(3), .table-row > button { display: none; }
    }
  `]
})
export class PortalOrderDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ordersService = inject(PortalOrdersService);
  private readonly claimsService = inject(PortalClaimsService);

  loading = signal(true);
  actionLoading = signal(false);
  order = signal<PortalOrder | null>(null);
  orderItems = signal<OrderItem[]>([]);
  successMessage = signal('');
  errorMessage = signal('');

  // Cancel modal
  showCancelModal = signal(false);
  cancelReason = '';

  // Claim modal
  showClaimModal = signal(false);
  selectedItem = signal<OrderItem | null>(null);
  claimType: ClaimType = ClaimType.Return;
  claimQuantity = 1;
  claimReason = '';
  claimDescription = '';
  claimTypeOptions = this.claimsService.getClaimTypeOptions();

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadOrder(parseInt(id, 10));
    } else {
      this.loading.set(false);
    }
  }

  loadOrder(id: number) {
    this.loading.set(true);
    this.ordersService.getOrderById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.order.set(response.data);
          this.orderItems.set(response.data.items?.map(i => ({
            id: i.id,
            productId: i.productId,
            productName: i.productName,
            sku: i.sku,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            total: i.total
          })) || []);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Greška pri učitavanju narudžbe');
      }
    });
  }

  getStatusClass(status: OrderStatus): string {
    const statusClasses: Record<OrderStatus, string> = {
      [OrderStatus.Pending]: 'status-pending',
      [OrderStatus.Confirmed]: 'status-confirmed',
      [OrderStatus.Processing]: 'status-processing',
      [OrderStatus.ReadyForShipment]: 'status-ready',
      [OrderStatus.Shipped]: 'status-shipped',
      [OrderStatus.Delivered]: 'status-delivered',
      [OrderStatus.Cancelled]: 'status-cancelled',
      [OrderStatus.Returned]: 'status-returned'
    };
    return statusClasses[status] || 'status-pending';
  }

  getStatusName(status: OrderStatus): string {
    return this.ordersService.getStatusDisplayName(status);
  }

  canCancelOrder(): boolean {
    const currentOrder = this.order();
    return currentOrder ? this.ordersService.canCancelOrder(currentOrder.status) : false;
  }

  canFileClaim(): boolean {
    const currentOrder = this.order();
    return currentOrder ? this.ordersService.canFileClaim(currentOrder.status) : false;
  }

  reorder() {
    const currentOrder = this.order();
    if (!currentOrder) return;

    this.actionLoading.set(true);
    this.ordersService.reorder(currentOrder.id).subscribe({
      next: (response) => {
        this.actionLoading.set(false);
        if (response.success && response.data) {
          this.successMessage.set('Nova narudžba kreirana uspješno!');
          setTimeout(() => {
            this.router.navigate(['/portal/orders', response.data!.id]);
          }, 1500);
        } else {
          this.errorMessage.set(response.message || 'Greška pri kreiranju narudžbe');
        }
      },
      error: () => {
        this.actionLoading.set(false);
        this.errorMessage.set('Greška pri kreiranju narudžbe');
      }
    });
  }

  downloadInvoice() {
    const currentOrder = this.order();
    if (!currentOrder) return;

    this.actionLoading.set(true);
    this.ordersService.downloadInvoice(currentOrder.id).subscribe({
      next: (blob) => {
        this.actionLoading.set(false);

        const fileName = `Faktura-${currentOrder.orderNumber}.pdf`;
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        a.remove();

        URL.revokeObjectURL(url);
      },
      error: () => {
        this.actionLoading.set(false);
        this.errorMessage.set('Greška pri preuzimanju fakture');
      }
    });
  }

  cancelOrder() {
    const currentOrder = this.order();
    if (!currentOrder || !this.cancelReason.trim()) return;

    this.actionLoading.set(true);
    this.ordersService.cancelOrder(currentOrder.id, this.cancelReason).subscribe({
      next: (response) => {
        this.actionLoading.set(false);
        this.showCancelModal.set(false);
        if (response.success) {
          this.successMessage.set('Narudžba je uspješno otkazana');
          this.loadOrder(currentOrder.id);
        } else {
          this.errorMessage.set(response.message || 'Greška pri otkazivanju narudžbe');
        }
      },
      error: () => {
        this.actionLoading.set(false);
        this.errorMessage.set('Greška pri otkazivanju narudžbe');
      }
    });
  }

  openClaimModal(item: OrderItem) {
    this.selectedItem.set(item);
    this.claimType = ClaimType.Return;
    this.claimQuantity = 1;
    this.claimReason = '';
    this.claimDescription = '';
    this.showClaimModal.set(true);
  }

  isClaimValid(): boolean {
    const item = this.selectedItem();
    return !!(
      item &&
      this.claimReason.trim() &&
      this.claimQuantity > 0 &&
      this.claimQuantity <= item.quantity
    );
  }

  submitClaim() {
    const currentOrder = this.order();
    const item = this.selectedItem();
    if (!currentOrder || !item || !this.isClaimValid()) return;

    const request: CreateClaimRequest = {
      orderId: currentOrder.id,
      orderItemId: item.id,
      type: this.claimType,
      reason: this.claimReason,
      description: this.claimDescription || undefined,
      quantity: this.claimQuantity
    };

    this.actionLoading.set(true);
    this.claimsService.submitClaim(request).subscribe({
      next: (response) => {
        this.actionLoading.set(false);
        this.showClaimModal.set(false);
        if (response.success) {
          this.successMessage.set(`Reklamacija ${response.data?.claimNumber} je uspješno podnesena`);
        } else {
          this.errorMessage.set(response.message || 'Greška pri podnošenju reklamacije');
        }
      },
      error: () => {
        this.actionLoading.set(false);
        this.errorMessage.set('Greška pri podnošenju reklamacije');
      }
    });
  }
}
