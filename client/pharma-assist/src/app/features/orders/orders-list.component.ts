import { Component, OnInit, inject, signal, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { OrderService, PaginatedResult } from '../../core/services/order.service';
import { ExportService, ExportColumn } from '../../core/services/export.service';
import {
  OrderSummary,
  OrderStatus,
  PaymentStatus,
  OrderFilter,
  getOrderStatusLabel,
  getOrderStatusColor,
  getPaymentStatusLabel,
  getPaymentStatusColor
} from '../../core/models/order.model';

import { DataTableComponent, TableColumn } from '../../shared/components/data-table';
import { SearchInputComponent } from '../../shared/components/search-input';
import { StatusBadgeComponent } from '../../shared/components/status-badge';
import { EmptyStateComponent } from '../../shared/components/empty-state';
import { PaginationComponent, PageEvent } from '../../shared/components/pagination';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog';
import { EuropeanDatePipe } from '../../core/pipes';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    DatePipe,
    CurrencyPipe,
    DataTableComponent,
    SearchInputComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    PaginationComponent,
    ConfirmDialogComponent,
    EuropeanDatePipe
  ],
  templateUrl: './orders-list/orders-list.component.html',
  styleUrls: ['./orders-list/orders-list.component.scss']
})
export class OrdersListComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly exportService = inject(ExportService);
  private readonly router = inject(Router);
  private readonly translateService = inject(TranslateService);

  // Templates
  @ViewChild('orderNumberTemplate', { static: true }) orderNumberTemplate!: TemplateRef<unknown>;
  @ViewChild('customerTemplate', { static: true }) customerTemplate!: TemplateRef<unknown>;
  @ViewChild('orderStatusTemplate', { static: true }) orderStatusTemplate!: TemplateRef<unknown>;
  @ViewChild('paymentStatusTemplate', { static: true }) paymentStatusTemplate!: TemplateRef<unknown>;
  @ViewChild('dateTemplate', { static: true }) dateTemplate!: TemplateRef<unknown>;
  @ViewChild('amountTemplate', { static: true }) amountTemplate!: TemplateRef<unknown>;
  @ViewChild('itemsTemplate', { static: true }) itemsTemplate!: TemplateRef<unknown>;
  @ViewChild('actionsTemplate', { static: true }) actionsTemplate!: TemplateRef<unknown>;

  // State
  loading = signal(false);
  orders = signal<OrderSummary[]>([]);
  selectedOrders = signal<OrderSummary[]>([]);
  currentPage = signal(1);
  totalPages = signal(1);
  totalItems = signal(0);
  pageSize = 10;
  showExportMenu = signal(false);

  // Stats
  pendingCount = signal(0);
  processingCount = signal(0);
  shippedCount = signal(0);
  deliveredCount = signal(0);

  // Filters
  searchTerm = '';
  selectedStatus: OrderStatus | null = null;
  selectedPaymentStatus: PaymentStatus | null = null;
  fromDate: string | null = null;
  toDate: string | null = null;

  // Cancel confirmation
  showCancelConfirm = signal(false);
  orderToCancel: OrderSummary | null = null;

  // Status options
  orderStatusOptions = [
    { value: OrderStatus.Pending, label: 'orders.status.pending' },
    { value: OrderStatus.Confirmed, label: 'orders.status.confirmed' },
    { value: OrderStatus.Processing, label: 'orders.status.processing' },
    { value: OrderStatus.ReadyForShipment, label: 'orders.status.readyForShipment' },
    { value: OrderStatus.Shipped, label: 'orders.status.shipped' },
    { value: OrderStatus.Delivered, label: 'orders.status.delivered' },
    { value: OrderStatus.Cancelled, label: 'orders.status.cancelled' },
    { value: OrderStatus.Returned, label: 'orders.status.returned' }
  ];

  paymentStatusOptions = [
    { value: PaymentStatus.Pending, label: 'orders.paymentStatus.pending' },
    { value: PaymentStatus.PartiallyPaid, label: 'orders.paymentStatus.partiallyPaid' },
    { value: PaymentStatus.Paid, label: 'orders.paymentStatus.paid' },
    { value: PaymentStatus.Refunded, label: 'orders.paymentStatus.refunded' },
    { value: PaymentStatus.Failed, label: 'orders.paymentStatus.failed' }
  ];

  // Table columns
  columns: TableColumn[] = [];

  ngOnInit(): void {
    this.initColumns();
    this.loadOrders();
    this.loadStats();
  }

  private initColumns(): void {
    this.columns = [
      {
        key: 'orderNumber',
        label: 'orders.orderNumber',
        sortable: true,
        template: this.orderNumberTemplate
      },
      {
        key: 'customerName',
        label: 'orders.customer',
        sortable: true,
        template: this.customerTemplate
      },
      {
        key: 'status',
        label: 'orders.status.label',
        sortable: true,
        template: this.orderStatusTemplate
      },
      {
        key: 'paymentStatus',
        label: 'orders.paymentStatus.label',
        sortable: true,
        template: this.paymentStatusTemplate
      },
      {
        key: 'orderDate',
        label: 'orders.orderDate',
        sortable: true,
        template: this.dateTemplate
      },
      {
        key: 'totalAmount',
        label: 'orders.totalAmount',
        sortable: true,
        template: this.amountTemplate
      },
      {
        key: 'itemCount',
        label: 'orders.items',
        sortable: true,
        template: this.itemsTemplate
      },
      {
        key: 'actions',
        label: '',
        sortable: false,
        width: '120px',
        template: this.actionsTemplate
      }
    ];
  }

  loadOrders(): void {
    this.loading.set(true);

    const filter: OrderFilter = {};

    if (this.searchTerm) {
      filter.searchTerm = this.searchTerm;
    }
    if (this.selectedStatus !== null) {
      filter.status = this.selectedStatus;
    }
    if (this.selectedPaymentStatus !== null) {
      filter.paymentStatus = this.selectedPaymentStatus;
    }
    if (this.fromDate) {
      filter.fromDate = new Date(this.fromDate);
    }
    if (this.toDate) {
      filter.toDate = new Date(this.toDate);
    }

    this.orderService.getOrders(this.currentPage(), this.pageSize, filter).subscribe({
      next: (result) => {
        this.orders.set(result.items || []);
        this.totalPages.set(result.totalPages || 1);
        this.totalItems.set(result.totalCount || 0);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.loading.set(false);
        // For demo, set mock data
        this.setMockData();
      }
    });
  }

  private setMockData(): void {
    const mockOrders: OrderSummary[] = [
      {
        id: '1',
        orderNumber: 'ORD-2024-0001',
        customerId: 'c1',
        customerName: 'Apoteka Moja',
        status: OrderStatus.Processing,
        paymentStatus: PaymentStatus.Paid,
        orderDate: new Date('2024-01-15'),
        totalAmount: 1250.00,
        itemCount: 5,
        hasPrescription: true
      },
      {
        id: '2',
        orderNumber: 'ORD-2024-0002',
        customerId: 'c2',
        customerName: 'Pharmacy Plus',
        status: OrderStatus.Pending,
        paymentStatus: PaymentStatus.Pending,
        orderDate: new Date('2024-01-16'),
        totalAmount: 890.50,
        itemCount: 3,
        hasPrescription: false
      },
      {
        id: '3',
        orderNumber: 'ORD-2024-0003',
        customerId: 'c3',
        customerName: 'HealthCare Sarajevo',
        status: OrderStatus.Shipped,
        paymentStatus: PaymentStatus.Paid,
        orderDate: new Date('2024-01-14'),
        totalAmount: 2340.75,
        itemCount: 8,
        hasPrescription: true
      },
      {
        id: '4',
        orderNumber: 'ORD-2024-0004',
        customerId: 'c4',
        customerName: 'MediPharm Tuzla',
        status: OrderStatus.Delivered,
        paymentStatus: PaymentStatus.Paid,
        orderDate: new Date('2024-01-12'),
        totalAmount: 560.00,
        itemCount: 2,
        hasPrescription: false
      },
      {
        id: '5',
        orderNumber: 'ORD-2024-0005',
        customerId: 'c5',
        customerName: 'PharmaNet Mostar',
        status: OrderStatus.Cancelled,
        paymentStatus: PaymentStatus.Refunded,
        orderDate: new Date('2024-01-10'),
        totalAmount: 1100.25,
        itemCount: 4,
        hasPrescription: false
      }
    ];

    this.orders.set(mockOrders);
    this.totalPages.set(1);
    this.totalItems.set(mockOrders.length);
  }

  private loadStats(): void {
    this.orderService.getOrderStats().subscribe({
      next: (stats) => {
        this.pendingCount.set(stats.pendingOrders);
        this.processingCount.set(stats.processingOrders);
        // We'll need to add shipped count to the API
        this.deliveredCount.set(stats.completedOrders);
      },
      error: () => {
        // Set mock stats
        this.pendingCount.set(12);
        this.processingCount.set(8);
        this.shippedCount.set(5);
        this.deliveredCount.set(156);
      }
    });
  }

  // Event handlers
  onSearch(term: string): void {
    this.searchTerm = term;
    this.currentPage.set(1);
    this.loadOrders();
  }

  onStatusFilterChange(status: OrderStatus | null): void {
    this.selectedStatus = status;
    this.currentPage.set(1);
    this.loadOrders();
  }

  onPaymentStatusFilterChange(status: PaymentStatus | null): void {
    this.selectedPaymentStatus = status;
    this.currentPage.set(1);
    this.loadOrders();
  }

  onDateFilterChange(): void {
    this.currentPage.set(1);
    this.loadOrders();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.page);
    this.pageSize = event.pageSize;
    this.loadOrders();
  }

  onSelectionChange(selected: OrderSummary[]): void {
    this.selectedOrders.set(selected);
  }

  hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.selectedStatus !== null || this.selectedPaymentStatus !== null || this.fromDate || this.toDate);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = null;
    this.selectedPaymentStatus = null;
    this.fromDate = null;
    this.toDate = null;
    this.currentPage.set(1);
    this.loadOrders();
  }

  clearSelection(): void {
    this.selectedOrders.set([]);
  }

  // Navigation
  createNewOrder(): void {
    this.router.navigate(['/orders/new']);
  }

  viewOrder(order: OrderSummary): void {
    this.router.navigate(['/orders', order.id]);
  }

  editOrder(order: OrderSummary): void {
    this.router.navigate(['/orders', order.id, 'edit']);
  }

  // Order actions
  canEditOrder(order: OrderSummary): boolean {
    return order.status === OrderStatus.Pending || order.status === OrderStatus.Confirmed;
  }

  canCancelOrder(order: OrderSummary): boolean {
    return order.status !== OrderStatus.Cancelled &&
           order.status !== OrderStatus.Delivered &&
           order.status !== OrderStatus.Returned;
  }

  confirmCancelOrder(order: OrderSummary): void {
    this.orderToCancel = order;
    this.showCancelConfirm.set(true);
  }

  closeCancelConfirm(): void {
    this.showCancelConfirm.set(false);
    this.orderToCancel = null;
  }

  cancelOrder(): void {
    if (!this.orderToCancel) return;

    this.orderService.cancelOrder(this.orderToCancel.id).subscribe({
      next: () => {
        this.loadOrders();
        this.loadStats();
        this.closeCancelConfirm();
      },
      error: (error) => {
        console.error('Error cancelling order:', error);
        this.closeCancelConfirm();
      }
    });
  }

  exportSelected(): void {
    // Implementation for exporting selected orders
    const selectedIds = this.selectedOrders().map(o => o.id);
    console.log('Exporting orders:', selectedIds);
    // TODO: Implement export functionality
  }

  // Status helpers
  getOrderStatusLabel(status: OrderStatus): string {
    return getOrderStatusLabel(status);
  }

  getPaymentStatusLabel(status: PaymentStatus): string {
    return getPaymentStatusLabel(status);
  }

  getOrderStatusBadgeVariant(status: OrderStatus): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    const color = getOrderStatusColor(status);
    return color === 'default' ? 'neutral' : color;
  }

  getPaymentStatusBadgeVariant(status: PaymentStatus): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    const color = getPaymentStatusColor(status);
    return color === 'default' ? 'neutral' : color;
  }

  // Export functionality
  toggleExportMenu(): void {
    this.showExportMenu.update(v => !v);
  }

  private getExportColumns(): ExportColumn<OrderSummary>[] {
    return [
      { key: 'orderNumber', header: this.translateService.instant('orders.columns.orderNumber') },
      { key: 'customerName', header: this.translateService.instant('orders.columns.customer') },
      {
        key: 'orderDate',
        header: this.translateService.instant('orders.columns.date'),
        format: (value) => value ? new Date(value).toLocaleDateString('bs-BA') : ''
      },
      {
        key: 'status',
        header: this.translateService.instant('orders.columns.status'),
        format: (value) => this.translateService.instant(getOrderStatusLabel(value))
      },
      {
        key: 'paymentStatus',
        header: this.translateService.instant('orders.columns.paymentStatus'),
        format: (value) => this.translateService.instant(getPaymentStatusLabel(value))
      },
      { key: 'itemCount', header: this.translateService.instant('orders.columns.items') },
      {
        key: 'totalAmount',
        header: this.translateService.instant('orders.columns.total'),
        format: (value) => value?.toFixed(2) + ' BAM' || ''
      }
    ];
  }

  exportToCSV(): void {
    this.showExportMenu.set(false);
    const data = this.selectedOrders().length > 0 ? this.selectedOrders() : this.orders();
    this.exportService.exportToCSV(
      data,
      this.getExportColumns(),
      { filename: `orders-${new Date().toISOString().split('T')[0]}` }
    );
  }

  exportToExcel(): void {
    this.showExportMenu.set(false);
    const data = this.selectedOrders().length > 0 ? this.selectedOrders() : this.orders();
    this.exportService.exportToExcel(
      data,
      this.getExportColumns(),
      { filename: `orders-${new Date().toISOString().split('T')[0]}` }
    );
  }

  exportToPDF(): void {
    this.showExportMenu.set(false);
    const data = this.selectedOrders().length > 0 ? this.selectedOrders() : this.orders();
    this.exportService.exportToPDF(
      data,
      this.getExportColumns(),
      {
        filename: `orders-${new Date().toISOString().split('T')[0]}`,
        title: this.translateService.instant('orders.title'),
        subtitle: this.translateService.instant('orders.subtitle')
      }
    );
  }
}
