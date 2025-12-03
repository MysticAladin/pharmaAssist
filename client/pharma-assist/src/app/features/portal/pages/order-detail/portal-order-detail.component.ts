import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

interface OrderItem {
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  date: Date;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  deliveryAddress: { street: string; city: string; postalCode: string; country: string; };
  billingAddress: { street: string; city: string; postalCode: string; country: string; };
  paymentMethod: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  timeline: { date: Date; status: string; description: string; }[];
}

@Component({
  selector: 'app-portal-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <div class="order-detail-page">
      <a routerLink="/portal/orders" class="back-link">← {{ 'common.back' | translate }}</a>

      @if (loading()) {
        <div class="loading"><div class="spinner"></div></div>
      } @else if (order()) {
        <div class="order-header">
          <div>
            <h1>{{ 'portal.orders.order' | translate }} #{{ order()!.orderNumber }}</h1>
            <p class="order-date">{{ order()!.date | date:'medium' }}</p>
          </div>
          <span class="status" [class]="'status-' + order()!.status">
            {{ 'portal.orders.' + order()!.status | translate }}
          </span>
        </div>

        <div class="order-content">
          <div class="main-content">
            <!-- Timeline -->
            <div class="section timeline-section">
              <h3>{{ 'portal.orderDetail.timeline' | translate }}</h3>
              <div class="timeline">
                @for (event of order()!.timeline; track event.date) {
                  <div class="timeline-item" [class.completed]="isCompleted(event.status)">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                      <span class="event-status">{{ event.status }}</span>
                      <span class="event-date">{{ event.date | date:'short' }}</span>
                      <span class="event-desc">{{ event.description }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Items -->
            <div class="section">
              <h3>{{ 'portal.orderDetail.items' | translate }}</h3>
              <div class="items-table">
                <div class="table-header">
                  <span>{{ 'portal.orderDetail.product' | translate }}</span>
                  <span>{{ 'portal.orderDetail.qty' | translate }}</span>
                  <span>{{ 'portal.orderDetail.price' | translate }}</span>
                  <span>{{ 'portal.orderDetail.total' | translate }}</span>
                </div>
                @for (item of order()!.items; track item.productId) {
                  <div class="table-row">
                    <div class="product-info">
                      <span class="product-name">{{ item.productName }}</span>
                      <span class="product-sku">SKU: {{ item.sku }}</span>
                    </div>
                    <span>{{ item.quantity }}</span>
                    <span>{{ item.unitPrice | currency:'BAM':'symbol':'1.2-2' }}</span>
                    <span class="item-total">{{ item.total | currency:'BAM':'symbol':'1.2-2' }}</span>
                  </div>
                }
              </div>
            </div>
          </div>

          <div class="sidebar">
            <!-- Summary -->
            <div class="section summary-section">
              <h3>{{ 'portal.orderDetail.summary' | translate }}</h3>
              <div class="summary-row"><span>{{ 'portal.cart.subtotal' | translate }}</span><span>{{ order()!.subtotal | currency:'BAM':'symbol':'1.2-2' }}</span></div>
              <div class="summary-row"><span>{{ 'portal.cart.delivery' | translate }}</span><span>{{ order()!.shipping | currency:'BAM':'symbol':'1.2-2' }}</span></div>
              <div class="summary-row"><span>{{ 'portal.cart.tax' | translate }}</span><span>{{ order()!.tax | currency:'BAM':'symbol':'1.2-2' }}</span></div>
              <div class="summary-row total"><span>{{ 'portal.cart.total' | translate }}</span><span>{{ order()!.total | currency:'BAM':'symbol':'1.2-2' }}</span></div>
            </div>

            @if (order()!.trackingNumber) {
              <div class="section">
                <h3>{{ 'portal.orderDetail.tracking' | translate }}</h3>
                <p class="tracking-number">{{ order()!.trackingNumber }}</p>
                @if (order()!.estimatedDelivery) {
                  <p class="estimated">{{ 'portal.orderConfirmation.estimatedDelivery' | translate }}: {{ order()!.estimatedDelivery | date:'mediumDate' }}</p>
                }
              </div>
            }

            <!-- Addresses -->
            <div class="section">
              <h3>{{ 'portal.orderDetail.delivery' | translate }}</h3>
              <p>{{ order()!.deliveryAddress.street }}<br>
                {{ order()!.deliveryAddress.postalCode }} {{ order()!.deliveryAddress.city }}<br>
                {{ order()!.deliveryAddress.country }}</p>
            </div>

            <div class="section">
              <h3>{{ 'portal.orderDetail.payment' | translate }}</h3>
              <p>{{ order()!.paymentMethod }}</p>
            </div>

            <div class="actions">
              <button class="btn btn-secondary" (click)="reorder()">{{ 'portal.orderDetail.reorder' | translate }}</button>
              <button class="btn btn-outline">{{ 'portal.orderDetail.downloadInvoice' | translate }}</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .order-detail-page { max-width: 1200px; margin: 0 auto; }
    .back-link { display: inline-block; color: var(--primary-color); text-decoration: none; margin-bottom: 1.5rem; }
    .loading { text-align: center; padding: 4rem; }
    .spinner { width: 40px; height: 40px; border: 3px solid var(--border-color); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .order-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .order-header h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .order-date { color: var(--text-secondary); }
    .status { padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-processing { background: #dbeafe; color: #1e40af; }
    .status-shipped { background: #e0e7ff; color: #3730a3; }
    .status-delivered { background: #d1fae5; color: #065f46; }
    .status-cancelled { background: #fee2e2; color: #991b1b; }

    .order-content { display: grid; grid-template-columns: 1fr 360px; gap: 2rem; }
    .main-content { display: flex; flex-direction: column; gap: 1.5rem; }
    .section { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; }
    .section h3 { font-size: 1rem; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-color); }

    .timeline { position: relative; padding-left: 2rem; }
    .timeline-item { position: relative; padding-bottom: 1.5rem; }
    .timeline-item:last-child { padding-bottom: 0; }
    .timeline-marker { width: 12px; height: 12px; background: var(--border-color); border-radius: 50%; position: absolute; left: -1.5rem; top: 4px; }
    .timeline-item.completed .timeline-marker { background: var(--primary-color); }
    .timeline-item::before { content: ''; position: absolute; left: calc(-1.5rem + 5px); top: 16px; width: 2px; height: calc(100% - 12px); background: var(--border-color); }
    .timeline-item:last-child::before { display: none; }
    .event-status { font-weight: 600; display: block; }
    .event-date { font-size: 0.75rem; color: var(--text-secondary); display: block; }
    .event-desc { font-size: 0.875rem; color: var(--text-secondary); }

    .items-table { }
    .table-header { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 1rem; padding: 0.75rem 0; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); border-bottom: 1px solid var(--border-color); }
    .table-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 1rem; padding: 1rem 0; align-items: center; border-bottom: 1px solid var(--border-color); }
    .table-row:last-child { border-bottom: none; }
    .product-name { font-weight: 500; display: block; }
    .product-sku { font-size: 0.75rem; color: var(--text-secondary); }
    .item-total { font-weight: 600; }

    .sidebar { display: flex; flex-direction: column; gap: 1rem; }
    .summary-row { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
    .summary-row.total { font-size: 1.25rem; font-weight: 700; padding-top: 1rem; margin-top: 0.5rem; border-top: 1px solid var(--border-color); }
    .tracking-number { font-size: 1.125rem; font-weight: 600; font-family: monospace; }
    .estimated { font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.5rem; }

    .actions { display: flex; flex-direction: column; gap: 0.5rem; }
    .btn { padding: 0.75rem 1rem; border-radius: 8px; border: none; cursor: pointer; font-weight: 500; text-align: center; }
    .btn-secondary { background: var(--primary-color); color: white; }
    .btn-outline { background: transparent; border: 1px solid var(--border-color); color: var(--text-color); }

    @media (max-width: 1024px) {
      .order-content { grid-template-columns: 1fr; }
      .table-header, .table-row { grid-template-columns: 1fr 1fr; }
    }
  `]
})
export class PortalOrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  loading = signal(true);
  order = signal<OrderDetail | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    setTimeout(() => {
      this.order.set({
        id: id || '1',
        orderNumber: 'ORD-2024-001',
        date: new Date('2024-01-15'),
        status: 'shipped',
        items: [
          { productId: 1, productName: 'Paracetamol 500mg', sku: 'PAR-500', quantity: 10, unitPrice: 5.50, total: 55.00 },
          { productId: 2, productName: 'Ibuprofen 400mg', sku: 'IBU-400', quantity: 5, unitPrice: 8.00, total: 40.00 },
          { productId: 3, productName: 'Vitamin C 1000mg', sku: 'VIT-C1000', quantity: 20, unitPrice: 12.00, total: 240.00 },
        ],
        subtotal: 335.00,
        shipping: 15.00,
        tax: 17.50,
        total: 367.50,
        deliveryAddress: { street: 'Ferhadija 12', city: 'Sarajevo', postalCode: '71000', country: 'Bosnia and Herzegovina' },
        billingAddress: { street: 'Ferhadija 12', city: 'Sarajevo', postalCode: '71000', country: 'Bosnia and Herzegovina' },
        paymentMethod: 'Invoice (Net 30)',
        trackingNumber: 'BA123456789',
        estimatedDelivery: new Date('2024-01-18'),
        timeline: [
          { date: new Date('2024-01-15T10:30:00'), status: 'Order Placed', description: 'Your order has been received' },
          { date: new Date('2024-01-15T14:00:00'), status: 'Payment Confirmed', description: 'Invoice generated' },
          { date: new Date('2024-01-16T09:00:00'), status: 'Processing', description: 'Order is being prepared' },
          { date: new Date('2024-01-17T11:30:00'), status: 'Shipped', description: 'Package handed to courier' },
        ]
      });
      this.loading.set(false);
    }, 300);
  }

  isCompleted(status: string): boolean {
    const completedStatuses = ['Order Placed', 'Payment Confirmed', 'Processing', 'Shipped'];
    const currentOrder = this.order();
    if (!currentOrder) return false;
    const orderStatus = currentOrder.status;
    if (orderStatus === 'delivered') return true;
    return completedStatuses.includes(status);
  }

  reorder() {
    // TODO: Add items to cart
    console.log('Reorder clicked');
  }
}
