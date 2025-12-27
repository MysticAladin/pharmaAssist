import { Component, OnInit, AfterViewInit, ContentChild, inject, signal, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
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
export class OrdersListComponent implements OnInit, AfterViewInit {
  private readonly orderService = inject(OrderService);
  private readonly exportService = inject(ExportService);
  private readonly router = inject(Router);
  private readonly translateService = inject(TranslateService);

  // Templates
  @ViewChild('orderNumberTemplate', { static: false }) orderNumberTemplate!: TemplateRef<unknown>;
  @ViewChild('customerTemplate', { static: false }) customerTemplate!: TemplateRef<unknown>;
  @ViewChild('orderStatusTemplate', { static: false }) orderStatusTemplate!: TemplateRef<unknown>;
  @ViewChild('paymentStatusTemplate', { static: false }) paymentStatusTemplate!: TemplateRef<unknown>;
  @ViewChild('dateTemplate', { static: false }) dateTemplate!: TemplateRef<unknown>;
  @ViewChild('amountTemplate', { static: false }) amountTemplate!: TemplateRef<unknown>;
  @ViewChild('itemsTemplate', { static: false }) itemsTemplate!: TemplateRef<unknown>;
  @ViewChild('actionsTemplate', { static: false }) actionsTemplate!: TemplateRef<unknown>;

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

  // Sorting
  sortBy: string | null = null;
  sortDirection: 'asc' | 'desc' = 'desc';

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
    this.loadStats();
    this.loadOrders();
  }

  ngAfterViewInit(): void {
    // Use setTimeout to ensure templates are available after change detection
    setTimeout(() => {
      this.initColumns();
    });
  }

  private initColumns(): void {
    console.log('🔧 Template refs:', {
      orderStatus: this.orderStatusTemplate,
      paymentStatus: this.paymentStatusTemplate,
      date: this.dateTemplate,
      amount: this.amountTemplate
    });

    this.columns = [
      {
        key: 'orderNumber',
        label: 'orders.orderNumber',
        sortable: true,
        width: '160px',
        template: this.orderNumberTemplate
      },
      {
        key: 'customerName',
        label: 'orders.customer',
        sortable: true,
        width: '220px',
        template: this.customerTemplate
      },
      {
        key: 'status',
        label: 'orders.status.label',
        sortable: true,
        width: '140px',
        template: this.orderStatusTemplate
      },
      {
        key: 'paymentStatus',
        label: 'orders.paymentStatus.label',
        sortable: true,
        width: '140px',
        template: this.paymentStatusTemplate
      },
      {
        key: 'orderDate',
        label: 'orders.orderDate',
        sortable: true,
        width: '170px',
        template: this.dateTemplate
      },
      {
        key: 'totalAmount',
        label: 'orders.totalAmount',
        sortable: true,
        align: 'right',
        width: '120px',
        template: this.amountTemplate
      },
      {
        key: 'itemCount',
        label: 'orders.items',
        sortable: true,
        align: 'center',
        width: '80px',
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
      // Parse European format dd.MM.yyyy
      const parts = this.fromDate.split('.');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const year = parseInt(parts[2], 10);
        filter.fromDate = new Date(year, month, day);
      }
    }
    if (this.toDate) {
      // Parse European format dd.MM.yyyy
      const parts = this.toDate.split('.');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const year = parseInt(parts[2], 10);
        filter.toDate = new Date(year, month, day);
      }
    }

    if (this.sortBy) {
      filter.sortBy = this.sortBy;
      filter.sortDirection = this.sortDirection;
    }

    this.orderService.getOrders(this.currentPage(), this.pageSize, filter).subscribe({
      next: (result) => {
        console.log('🔍 RAW API RESPONSE:', result);
        console.log('🔍 Response keys:', Object.keys(result));
        const firstOrder = result.data?.[0];
        if (firstOrder) {
          console.log('🔍 FIRST ORDER:', firstOrder);
          console.log('🔍 Order keys:', Object.keys(firstOrder));
          console.log('🔍 Status info:', {
            status: firstOrder.status,
            statusType: typeof firstOrder.status,
            statusName: firstOrder.statusName,
            paymentStatus: firstOrder.paymentStatus,
            paymentStatusName: firstOrder.paymentStatusName
          });
        }
        this.orders.set(result.data || []);
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
        id: 1,
        orderNumber: 'ORD-2024-0001',
        customerName: 'Apoteka Moja',
        customerCode: 'APT-001',
        status: OrderStatus.Processing,
        statusName: 'Processing',
        paymentStatus: PaymentStatus.Paid,
        paymentStatusName: 'Paid',
        orderDate: new Date('2024-01-15'),
        totalAmount: 1250.00,
        itemCount: 5
      },
      {
        id: 2,
        orderNumber: 'ORD-2024-0002',
        customerName: 'Pharmacy Plus',
        customerCode: 'APT-002',
        status: OrderStatus.Pending,
        statusName: 'Pending',
        paymentStatus: PaymentStatus.Pending,
        paymentStatusName: 'Pending',
        orderDate: new Date('2024-01-16'),
        totalAmount: 890.50,
        itemCount: 3
      },
      {
        id: 3,
        orderNumber: 'ORD-2024-0003',
        customerName: 'HealthCare Sarajevo',
        customerCode: 'APT-003',
        status: OrderStatus.Shipped,
        statusName: 'Shipped',
        paymentStatus: PaymentStatus.Paid,
        paymentStatusName: 'Paid',
        orderDate: new Date('2024-01-14'),
        totalAmount: 2340.75,
        itemCount: 8
      },
      {
        id: 4,
        orderNumber: 'ORD-2024-0004',
        customerName: 'MediPharm Tuzla',
        customerCode: 'APT-004',
        status: OrderStatus.Delivered,
        statusName: 'Delivered',
        paymentStatus: PaymentStatus.Paid,
        paymentStatusName: 'Paid',
        orderDate: new Date('2024-01-12'),
        totalAmount: 560.00,
        itemCount: 2
      },
      {
        id: 5,
        orderNumber: 'ORD-2024-0005',
        customerName: 'PharmaNet Mostar',
        customerCode: 'APT-005',
        status: OrderStatus.Cancelled,
        statusName: 'Cancelled',
        paymentStatus: PaymentStatus.Refunded,
        paymentStatusName: 'Refunded',
        orderDate: new Date('2024-01-10'),
        totalAmount: 1100.25,
        itemCount: 4
      }
    ];

    this.orders.set(mockOrders);
    this.totalPages.set(1);
    this.totalItems.set(mockOrders.length);
  }

  private loadStats(): void {
    this.orderService.getOrderStats().subscribe({
      next: (stats) => {
        console.log('📊 STATS API RESPONSE:', stats);
        console.log('📊 Type of stats:', typeof stats);
        console.log('📊 Stats keys:', Object.keys(stats));
        console.log('📊 Stats JSON:', JSON.stringify(stats, null, 2));
        console.log('📊 Direct access test:', {
          'stats.pendingOrders': stats.pendingOrders,
          'stats["pendingOrders"]': stats['pendingOrders'],
          'all props': {
            pending: stats.pendingOrders,
            processing: stats.processingOrders,
            shipped: stats.shippedOrders,
            completed: stats.completedOrders
          }
        });
        this.pendingCount.set(stats.pendingOrders || 0);
        this.processingCount.set(stats.processingOrders || 0);
        this.shippedCount.set(stats.shippedOrders || 0);
        this.deliveredCount.set(stats.completedOrders || 0);
      },
      error: () => {
        // Set zeros on error
        this.pendingCount.set(0);
        this.processingCount.set(0);
        this.shippedCount.set(0);
        this.deliveredCount.set(0);
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

  onNativeFromDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      const date = new Date(input.value);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      this.fromDate = `${day}.${month}.${year}`;
      this.onDateFilterChange();
    }
  }

  onNativeToDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      const date = new Date(input.value);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      this.toDate = `${day}.${month}.${year}`;
      this.onDateFilterChange();
    }
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.page);
    this.pageSize = event.pageSize;
    this.loadOrders();
  }

  onSortChange(event: { column: string; direction: 'asc' | 'desc' }): void {
    // Map table column keys to backend sort fields
    const sortBy = (event.column || '').trim();
    this.sortBy = sortBy;
    this.sortDirection = event.direction;
    this.currentPage.set(1);
    this.loadOrders();
  }

  onStatCardClick(status: OrderStatus): void {
    // Toggle behavior: clicking the same card clears the filter
    this.selectedStatus = this.selectedStatus === status ? null : status;
    this.currentPage.set(1);
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
    const label = getOrderStatusLabel(status);
    console.log(`🏷️ Status: ${status} → Label: ${label}`);
    return label;
  }

  getPaymentStatusLabel(status: PaymentStatus): string {
    const label = getPaymentStatusLabel(status);
    console.log(`💳 Payment Status: ${status} → Label: ${label}`);
    return label;
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
