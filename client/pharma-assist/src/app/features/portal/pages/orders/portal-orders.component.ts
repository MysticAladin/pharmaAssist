import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { PortalOrdersService, PortalOrder, OrderStatus } from '../../services/portal-orders.service';
import { KmCurrencyPipe } from '../../../../core/pipes/km-currency.pipe';

@Component({
  selector: 'app-portal-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule, KmCurrencyPipe],
  template: `
    <div class="orders-page">
      <div class="page-header">
        <h1>{{ 'portal.orders.title' | translate }}</h1>
        <div class="filters">
          <select [(ngModel)]="statusFilter" (ngModelChange)="loadOrders()">
            <option [ngValue]="undefined">{{ 'portal.orders.allStatuses' | translate }}</option>
            @for (status of statusOptions; track status.value) {
              <option [ngValue]="status.value">{{ status.label }}</option>
            }
          </select>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (input)="applySearch()"
            [placeholder]="'portal.orders.searchPlaceholder' | translate"
          />
        </div>
      </div>

      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>{{ 'common.loading' | translate }}</p>
        </div>
      } @else if (orders().length === 0) {
        <div class="empty-state">
          <span class="icon">📦</span>
          <h3>{{ 'portal.orders.noOrders' | translate }}</h3>
          <p>{{ 'portal.orders.noOrdersDesc' | translate }}</p>
          <a routerLink="/portal/catalog" class="btn btn-primary">{{ 'portal.orders.startShopping' | translate }}</a>
        </div>
      } @else {
        <div class="orders-list">
          @for (order of orders(); track order.id) {
            <div class="order-card" [routerLink]="['/portal/orders', order.id]">
              <div class="order-header">
                <div class="order-number">
                  <span class="label">{{ 'portal.orders.order' | translate }}</span>
                  <span class="value">#{{ order.orderNumber }}</span>
                </div>
                <span class="status" [class]="getStatusClass(order.status)">
                  {{ getStatusName(order.status) }}
                </span>
              </div>
              <div class="order-body">
                <div class="info-group">
                  <span class="label">{{ 'portal.orders.orderDate' | translate }}</span>
                  <span class="value">{{ order.orderDate | date:'mediumDate' }}</span>
                </div>
                <div class="info-group">
                  <span class="label">{{ 'portal.orders.items' | translate }}</span>
                  <span class="value">{{ order.itemCount }}</span>
                </div>
                <div class="info-group">
                  <span class="label">{{ 'portal.orders.total' | translate }}</span>
                  <span class="value total">{{ order.totalAmount | kmCurrency }}</span>
                </div>
              </div>
              <div class="order-arrow">→</div>
            </div>
          }
        </div>

        <div class="pagination">
          <button [disabled]="currentPage() === 1" (click)="goToPage(currentPage() - 1)">←</button>
          <span>{{ currentPage() }} / {{ totalPages() }}</span>
          <button [disabled]="currentPage() === totalPages()" (click)="goToPage(currentPage() + 1)">→</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .orders-page { max-width: 1000px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
    h1 { font-size: 1.75rem; }
    .filters { display: flex; gap: 1rem; }
    .filters select, .filters input { padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--surface-card); }
    .filters input { min-width: 200px; }

    .loading { text-align: center; padding: 4rem; }
    .spinner { width: 40px; height: 40px; border: 3px solid var(--border-color); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state { text-align: center; padding: 4rem 2rem; background: var(--surface-card); border-radius: 12px; }
    .empty-state .icon { font-size: 4rem; display: block; margin-bottom: 1rem; }
    .empty-state h3 { margin-bottom: 0.5rem; }
    .empty-state p { color: var(--text-secondary); margin-bottom: 1.5rem; }

    .orders-list { display: flex; flex-direction: column; gap: 1rem; }
    .order-card { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; position: relative; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
    .order-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

    .order-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); }
    .order-number .label { font-size: 0.75rem; color: var(--text-secondary); display: block; }
    .order-number .value { font-size: 1.125rem; font-weight: 600; }

    .status { padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-processing { background: #dbeafe; color: #1e40af; }
    .status-shipped { background: #e0e7ff; color: #3730a3; }
    .status-delivered { background: #d1fae5; color: #065f46; }
    .status-cancelled { background: #fee2e2; color: #991b1b; }

    .order-body { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .info-group .label { font-size: 0.75rem; color: var(--text-secondary); display: block; }
    .info-group .value { font-weight: 500; }
    .info-group .value.total { color: var(--primary-color); font-size: 1.125rem; }

    .order-footer { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color); }
    .tracking { font-size: 0.875rem; }
    .tracking-label { color: var(--text-secondary); }

    .order-arrow { position: absolute; right: 1.5rem; top: 50%; transform: translateY(-50%); font-size: 1.5rem; color: var(--text-secondary); }

    .pagination { display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 2rem; }
    .pagination button { width: 40px; height: 40px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-card); cursor: pointer; }
    .pagination button:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn { padding: 0.875rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block; }
    .btn-primary { background: var(--primary-color); color: white; }

    @media (max-width: 640px) {
      .page-header { flex-direction: column; align-items: stretch; }
      .filters { flex-direction: column; }
      .order-body { grid-template-columns: repeat(2, 1fr); }
      .order-arrow { display: none; }
    }
  `]
})
export class PortalOrdersComponent implements OnInit {
  private readonly ordersService = inject(PortalOrdersService);

  loading = signal(true);
  orders = signal<PortalOrder[]>([]);
  currentPage = signal(1);
  totalPages = signal(1);
  pageSize = 10;

  statusFilter: OrderStatus | undefined = undefined;
  searchQuery = '';

  statusOptions: { value: OrderStatus; label: string }[] = [
    { value: OrderStatus.Pending, label: 'Na čekanju' },
    { value: OrderStatus.Confirmed, label: 'Potvrđeno' },
    { value: OrderStatus.Processing, label: 'U obradi' },
    { value: OrderStatus.Shipped, label: 'Poslano' },
    { value: OrderStatus.Delivered, label: 'Dostavljeno' },
    { value: OrderStatus.Cancelled, label: 'Otkazano' }
  ];

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading.set(true);
    this.ordersService.getMyOrders(this.currentPage(), this.pageSize, this.statusFilter).subscribe({
      next: (response) => {
        if (response.success) {
          this.orders.set(response.data);
          this.totalPages.set(response.totalPages);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  applySearch() {
    // For now, search is client-side after loading
    // Could be enhanced to server-side search
    this.currentPage.set(1);
    this.loadOrders();
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

  goToPage(page: number) {
    this.currentPage.set(page);
    this.loadOrders();
  }
}
