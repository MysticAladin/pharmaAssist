import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { RepOrderService } from '../../core/services/rep-order.service';
import { PdfService } from '../../core/services/pdf.service';
import { NotificationService } from '../../core/services/notification.service';

interface OrderConfirmation {
  orderId: number;
  orderNumber: string;
  customer: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  items: OrderConfirmationItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: string;
  createdAt: string;
  estimatedDelivery?: string;
  paymentTerms?: string;
  notes?: string;
  salesRep?: string;
  appliedPromotions?: string[];
}

interface OrderConfirmationItem {
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
}

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <div class="confirmation">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>{{ 'common.loading' | translate }}</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <svg class="error-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2>{{ 'orders.confirmation.errorTitle' | translate }}</h2>
          <p>{{ error() }}</p>
          <button class="btn btn-primary" (click)="goToOrders()">
            {{ 'orders.backToOrders' | translate }}
          </button>
        </div>
      } @else if (order()) {
        <div class="confirmation__success">
          <div class="success-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1>{{ 'orders.confirmation.title' | translate }}</h1>
          <p class="order-number">{{ 'orders.orderNumber' | translate }} {{ order()!.orderNumber }}</p>
        </div>

        <!-- Order Details Card -->
        <div class="confirmation__details">
          <div class="card">
            <div class="card-header">
              <h3>{{ 'orders.orderDetails' | translate }}</h3>
              <span class="status-badge status-badge--{{ order()!.status.toLowerCase() }}">
                {{ order()!.status }}
              </span>
            </div>
            <div class="card-content">
              <!-- Customer Info -->
              <div class="detail-section">
                <h4>{{ 'orders.customer' | translate }}</h4>
                <div class="detail-row">
                  <span class="label">{{ 'common.name' | translate }}:</span>
                  <span class="value">{{ order()!.customer.name }}</span>
                </div>
                @if (order()!.customer.address) {
                  <div class="detail-row">
                    <span class="label">{{ 'common.address' | translate }}:</span>
                    <span class="value">{{ order()!.customer.address }}</span>
                  </div>
                }
                @if (order()!.customer.phone) {
                  <div class="detail-row">
                    <span class="label">{{ 'common.phone' | translate }}:</span>
                    <span class="value">{{ order()!.customer.phone }}</span>
                  </div>
                }
              </div>

              <!-- Order Items -->
              <div class="detail-section">
                <h4>{{ 'orders.items' | translate }}</h4>
                <table class="items-table">
                  <thead>
                    <tr>
                      <th>{{ 'orders.detail.product' | translate }}</th>
                      <th class="text-right">{{ 'orders.detail.quantity' | translate }}</th>
                      <th class="text-right">{{ 'orders.detail.unitPrice' | translate }}</th>
                      <th class="text-right">{{ 'orders.detail.lineTotal' | translate }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of order()!.items; track item.productId) {
                      <tr>
                        <td>
                          <div class="product-name">{{ item.productName }}</div>
                          <div class="product-sku">{{ item.sku }}</div>
                        </td>
                        <td class="text-right">{{ item.quantity }}</td>
                        <td class="text-right">{{ item.unitPrice | currency:'KM ' }}</td>
                        <td class="text-right">{{ item.lineTotal | currency:'KM ' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Order Summary -->
              <div class="order-summary">
                <div class="summary-row">
                  <span>{{ 'orders.detail.subtotal' | translate }}</span>
                  <span>{{ order()!.subtotal | currency:'KM ' }}</span>
                </div>
                @if (order()!.discount > 0) {
                  <div class="summary-row discount">
                    <span>{{ 'orders.discount' | translate }}</span>
                    <span>-{{ order()!.discount | currency:'KM ' }}</span>
                  </div>
                }
                @if (order()!.tax > 0) {
                  <div class="summary-row">
                    <span>{{ 'orders.detail.tax' | translate }}</span>
                    <span>{{ order()!.tax | currency:'KM ' }}</span>
                  </div>
                }
                <div class="summary-row total">
                  <span>{{ 'orders.totalAmount' | translate }}</span>
                  <span>{{ order()!.total | currency:'KM ' }}</span>
                </div>
              </div>

              <!-- Applied Promotions -->
              @if (order()!.appliedPromotions && order()!.appliedPromotions!.length > 0) {
                <div class="detail-section promotions">
                  <h4>{{ 'orders.confirmation.appliedPromotions' | translate }}</h4>
                  <div class="promo-tags">
                    @for (promo of order()!.appliedPromotions; track promo) {
                      <span class="promo-tag">{{ promo }}</span>
                    }
                  </div>
                </div>
              }

              <!-- Estimated Delivery -->
              @if (order()!.estimatedDelivery) {
                <div class="detail-section">
                  <h4>{{ 'orders.confirmation.estimatedDelivery' | translate }}</h4>
                  <p class="delivery-date">{{ order()!.estimatedDelivery | date:'fullDate' }}</p>
                </div>
              }

              <!-- Notes -->
              @if (order()!.notes) {
                <div class="detail-section">
                  <h4>{{ 'orders.notes' | translate }}</h4>
                  <p>{{ order()!.notes }}</p>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="confirmation__actions">
          <button class="btn btn-outline" (click)="downloadReceipt()">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {{ 'orders.confirmation.downloadReceipt' | translate }}
          </button>

          <button class="btn btn-outline" (click)="printReceipt()">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
            </svg>
            {{ 'orders.confirmation.print' | translate }}
          </button>

          <!-- Share Buttons -->
          <div class="share-buttons">
            @if (order()!.customer.email) {
              <button class="btn btn-outline" (click)="shareViaEmail()">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                {{ 'orders.confirmation.shareEmail' | translate }}
              </button>
            }

            @if (order()!.customer.phone) {
              <button class="btn btn-success whatsapp-btn" (click)="shareViaWhatsApp()">
                <svg viewBox="0 0 24 24" class="icon whatsapp-icon">
                  <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {{ 'orders.confirmation.shareWhatsApp' | translate }}
              </button>
            }
          </div>
        </div>

        <!-- Navigation -->
        <div class="confirmation__navigation">
          <button class="btn" (click)="createNewOrder()">
            {{ 'orders.confirmation.createAnother' | translate }}
          </button>
          <button class="btn btn-primary" (click)="goToOrders()">
            {{ 'orders.backToOrders' | translate }}
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .confirmation {
      max-width: 800px;
      margin: 0 auto;
      padding: 24px 16px;
    }

    .loading-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      text-align: center;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid var(--border-color);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-icon {
      width: 64px;
      height: 64px;
      color: var(--color-error);
      margin-bottom: 16px;
    }

    .confirmation__success {
      text-align: center;
      margin-bottom: 32px;
    }

    .success-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 16px;
      background: var(--color-success);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .success-icon svg {
      width: 48px;
      height: 48px;
      color: white;
    }

    .confirmation__success h1 {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0 0 8px;
      color: var(--text-primary);
    }

    .order-number {
      font-size: 1.125rem;
      color: var(--text-secondary);
    }

    .card {
      background: var(--surface-primary);
      border-radius: 12px;
      border: 1px solid var(--border-color);
      overflow: hidden;
      margin-bottom: 24px;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid var(--border-color);
      background: var(--surface-secondary);
    }

    .card-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
    }

    .card-content {
      padding: 16px;
    }

    .detail-section {
      margin-bottom: 24px;
    }

    .detail-section:last-child {
      margin-bottom: 0;
    }

    .detail-section h4 {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary);
      margin: 0 0 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .detail-row {
      display: flex;
      gap: 8px;
      margin-bottom: 6px;
    }

    .detail-row .label {
      color: var(--text-secondary);
      min-width: 100px;
    }

    .detail-row .value {
      font-weight: 500;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .items-table th {
      text-align: left;
      font-weight: 600;
      color: var(--text-secondary);
      padding: 8px 4px;
      border-bottom: 2px solid var(--border-color);
    }

    .items-table td {
      padding: 12px 4px;
      border-bottom: 1px solid var(--border-color);
    }

    .items-table tr:last-child td {
      border-bottom: none;
    }

    .text-right {
      text-align: right;
    }

    .product-name {
      font-weight: 500;
    }

    .product-sku {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .order-summary {
      background: var(--surface-secondary);
      border-radius: 8px;
      padding: 16px;
      margin-top: 16px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }

    .summary-row.discount {
      color: var(--color-success);
    }

    .summary-row.total {
      font-size: 1.125rem;
      font-weight: 700;
      border-top: 2px solid var(--border-color);
      margin-top: 8px;
      padding-top: 16px;
    }

    .promotions .promo-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .promo-tag {
      display: inline-block;
      padding: 4px 12px;
      background: rgba(var(--color-primary-rgb), 0.1);
      color: var(--color-primary);
      border-radius: 16px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .delivery-date {
      font-size: 1rem;
      font-weight: 500;
      color: var(--color-primary);
    }

    .confirmation__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 24px;
    }

    .share-buttons {
      display: flex;
      gap: 12px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: var(--surface-primary);
      color: var(--text-primary);
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn:hover {
      background: var(--surface-secondary);
    }

    .btn-primary {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: white;
    }

    .btn-primary:hover {
      opacity: 0.9;
    }

    .btn-outline {
      border-color: var(--border-color);
      background: transparent;
    }

    .btn-success {
      background: #25D366;
      border-color: #25D366;
      color: white;
    }

    .btn-success:hover {
      background: #128C7E;
      border-color: #128C7E;
    }

    .icon {
      width: 18px;
      height: 18px;
    }

    .whatsapp-icon {
      width: 18px;
      height: 18px;
    }

    .confirmation__navigation {
      display: flex;
      justify-content: center;
      gap: 12px;
      padding-top: 24px;
      border-top: 1px solid var(--border-color);
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-badge--pending {
      background: rgba(245, 158, 11, 0.1);
      color: rgb(245, 158, 11);
    }

    .status-badge--confirmed,
    .status-badge--processing {
      background: rgba(59, 130, 246, 0.1);
      color: rgb(59, 130, 246);
    }

    .status-badge--shipped {
      background: rgba(139, 92, 246, 0.1);
      color: rgb(139, 92, 246);
    }

    .status-badge--delivered {
      background: rgba(16, 185, 129, 0.1);
      color: rgb(16, 185, 129);
    }

    @media (max-width: 640px) {
      .confirmation__actions {
        flex-direction: column;
      }

      .share-buttons {
        flex-direction: column;
        width: 100%;
      }

      .btn {
        width: 100%;
        justify-content: center;
      }

      .items-table {
        font-size: 0.75rem;
      }
    }
  `]
})
export class OrderConfirmationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly repOrderService = inject(RepOrderService);
  private readonly pdfService = inject(PdfService);
  private readonly notification = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  orderId = 0;
  loading = signal(true);
  error = signal<string | null>(null);
  order = signal<OrderConfirmation | null>(null);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.orderId = parseInt(idParam, 10);
      this.loadOrder();
    } else {
      this.error.set('Order ID not provided');
      this.loading.set(false);
    }
  }

  private loadOrder(): void {
    this.loading.set(true);
    this.repOrderService.getOrderDetails(this.orderId).subscribe({
      next: (order) => {
        this.order.set(this.mapToConfirmation(order));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load order');
        this.loading.set(false);
      }
    });
  }

  private mapToConfirmation(order: any): OrderConfirmation {
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customer: {
        id: order.customerId,
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
        address: order.shippingAddress
      },
      items: order.items?.map((item: any) => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        lineTotal: item.lineTotal || (item.quantity * item.unitPrice)
      })) || [],
      subtotal: order.subtotal || order.totalAmount,
      discount: order.discountAmount || 0,
      tax: order.taxAmount || 0,
      total: order.totalAmount,
      status: order.status,
      createdAt: order.orderDate,
      estimatedDelivery: order.estimatedDeliveryDate,
      paymentTerms: order.paymentTerms,
      notes: order.notes,
      salesRep: order.salesRepName,
      appliedPromotions: order.appliedPromotions
    };
  }

  downloadReceipt(): void {
    const order = this.order();
    if (!order) return;

    const receiptContent = this.generateReceiptContent(order);
    this.pdfService.generateFromHtml(receiptContent).subscribe({
      next: (blob) => {
        this.pdfService.downloadPdf(blob, `Order_${order.orderNumber}.pdf`);
        this.notification.success(this.translate.instant('orders.confirmation.downloadStarted'));
      },
      error: () => {
        this.notification.error('Failed to generate receipt');
      }
    });
  }

  printReceipt(): void {
    const order = this.order();
    if (!order) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this.notification.error('Please allow popups to print');
      return;
    }

    const html = this.generatePrintHtml(order);
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }

  shareViaEmail(): void {
    const order = this.order();
    if (!order || !order.customer.email) return;

    const subject = encodeURIComponent(`Order Confirmation - ${order.orderNumber}`);
    const body = encodeURIComponent(this.generateEmailBody(order));
    const mailtoLink = `mailto:${order.customer.email}?subject=${subject}&body=${body}`;

    window.open(mailtoLink);
  }

  shareViaWhatsApp(): void {
    const order = this.order();
    if (!order || !order.customer.phone) return;

    // Clean phone number (remove non-digits except +)
    const phone = order.customer.phone.replace(/[^\d+]/g, '');
    const message = encodeURIComponent(this.generateWhatsAppMessage(order));
    const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

    window.open(whatsappUrl, '_blank');
  }

  createNewOrder(): void {
    const order = this.order();
    if (order) {
      this.router.navigate(['/orders/rep/create'], {
        queryParams: { customerId: order.customer.id }
      });
    } else {
      this.router.navigate(['/orders/rep/create']);
    }
  }

  goToOrders(): void {
    this.router.navigate(['/orders']);
  }

  private generateReceiptContent(order: OrderConfirmation): string {
    const itemsHtml = order.items.map(item => `
      <tr>
        <td>${item.productName}<br><small>${item.sku}</small></td>
        <td align="right">${item.quantity}</td>
        <td align="right">${item.unitPrice.toFixed(2)} KM</td>
        <td align="right">${item.lineTotal.toFixed(2)} KM</td>
      </tr>
    `).join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <h1 style="text-align: center;">Order Receipt</h1>
        <p style="text-align: center;">Order #${order.orderNumber}</p>
        <hr>
        <h3>Customer</h3>
        <p>${order.customer.name}<br>${order.customer.address || ''}</p>
        <h3>Items</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid #ccc;">
              <th align="left">Product</th>
              <th align="right">Qty</th>
              <th align="right">Price</th>
              <th align="right">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <hr>
        <table style="width: 100%; margin-top: 16px;">
          <tr><td>Subtotal</td><td align="right">${order.subtotal.toFixed(2)} KM</td></tr>
          ${order.discount > 0 ? `<tr><td>Discount</td><td align="right">-${order.discount.toFixed(2)} KM</td></tr>` : ''}
          <tr style="font-weight: bold; font-size: 1.2em;"><td>Total</td><td align="right">${order.total.toFixed(2)} KM</td></tr>
        </table>
      </div>
    `;
  }

  private generatePrintHtml(order: OrderConfirmation): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order ${order.orderNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          .total { font-weight: bold; font-size: 1.2em; }
          .right { text-align: right; }
        </style>
      </head>
      <body>
        ${this.generateReceiptContent(order)}
        <script>window.print();</script>
      </body>
      </html>
    `;
  }

  private generateEmailBody(order: OrderConfirmation): string {
    const items = order.items.map(item =>
      `• ${item.productName} x${item.quantity} - ${item.lineTotal.toFixed(2)} KM`
    ).join('\n');

    return `
Dear ${order.customer.name},

Thank you for your order!

Order Number: ${order.orderNumber}
Order Date: ${new Date(order.createdAt).toLocaleDateString()}

Items:
${items}

Subtotal: ${order.subtotal.toFixed(2)} KM
${order.discount > 0 ? `Discount: -${order.discount.toFixed(2)} KM\n` : ''}Total: ${order.total.toFixed(2)} KM

${order.estimatedDelivery ? `Estimated Delivery: ${new Date(order.estimatedDelivery).toLocaleDateString()}` : ''}

Thank you for your business!
    `.trim();
  }

  private generateWhatsAppMessage(order: OrderConfirmation): string {
    const items = order.items.slice(0, 5).map(item =>
      `• ${item.productName} x${item.quantity}`
    ).join('\n');

    const moreItems = order.items.length > 5 ? `\n...and ${order.items.length - 5} more items` : '';

    return `
🧾 *Order Confirmation*

Order #${order.orderNumber}

${items}${moreItems}

*Total: ${order.total.toFixed(2)} KM*

${order.estimatedDelivery ? `📦 Est. Delivery: ${new Date(order.estimatedDelivery).toLocaleDateString()}` : ''}

Thank you for your order!
    `.trim();
  }
}
