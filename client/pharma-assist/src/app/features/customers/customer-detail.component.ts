import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CustomerService, Customer, CustomerNote, AddNoteRequest } from '../../core/services/customer.service';
import { OrderService, OrderSummary, OrderStatus } from '../../core/services/order.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { StatusBadgeComponent, BadgeVariant } from '../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PaginationComponent, PageEvent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslateModule,
    StatusBadgeComponent,
    EmptyStateComponent,
    PaginationComponent
  ],
  templateUrl: './customer-detail-component/customer-detail.component.html',
  styleUrls: ['./customer-detail-component/customer-detail.component.scss']
})
export class CustomerDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private customerService = inject(CustomerService);
  private orderService = inject(OrderService);
  private notificationService = inject(NotificationService);
  private confirmationService = inject(ConfirmationService);
  private translateService = inject(TranslateService);

  customer = signal<Customer | null>(null);
  loading = signal(true);
  orders = signal<OrderSummary[]>([]);
  loadingOrders = signal(false);
  ordersPage = signal(1);
  ordersTotalItems = signal(0);
  notes = signal<CustomerNote[]>([]);
  loadingNotes = signal(false);
  showNoteForm = signal(false);
  newNoteContent = signal('');
  savingNote = signal(false);
  orderStats = signal({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    lastOrderDate: null as string | null
  });

  availableCredit = computed(() => {
    const customer = this.customer();
    if (!customer) return 0;
    return Math.max(0, customer.creditLimit - customer.currentBalance);
  });

  creditUtilization = computed(() => {
    const customer = this.customer();
    if (!customer || customer.creditLimit === 0) return 0;
    return Math.min(100, (customer.currentBalance / customer.creditLimit) * 100);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCustomer(+id);
    }
  }

  loadCustomer(id: number): void {
    this.loading.set(true);
    this.customerService.getCustomer(id).subscribe({
      next: (customer) => {
        this.customer.set(customer);
        this.loading.set(false);
        this.loadOrders(customer.id);
        this.loadNotes(customer.id);
        this.loadOrderStats(customer.id);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  loadOrders(customerId: number): void {
    this.loadingOrders.set(true);
    this.orderService.getOrders(this.ordersPage(), 5, { customerId }).subscribe({
      next: (response) => {
        this.orders.set(response.items);
        this.ordersTotalItems.set(response.totalItems);
        this.loadingOrders.set(false);
      },
      error: () => {
        this.loadingOrders.set(false);
      }
    });
  }

  loadNotes(customerId: number): void {
    this.loadingNotes.set(true);
    this.customerService.getCustomerNotes(customerId).subscribe({
      next: (notes) => {
        this.notes.set(notes);
        this.loadingNotes.set(false);
      },
      error: () => {
        this.loadingNotes.set(false);
      }
    });
  }

  loadOrderStats(customerId: number): void {
    this.customerService.getCustomerStats(customerId).subscribe({
      next: (stats) => {
        this.orderStats.set(stats);
      },
      error: () => {
        // Stats are optional, ignore errors
      }
    });
  }

  getFullAddress(): string {
    const customer = this.customer();
    if (!customer?.addresses || customer.addresses.length === 0) {
      return '-';
    }

    const primaryAddress = customer.addresses.find(a => a.isPrimary) || customer.addresses[0];
    const parts = [
      primaryAddress.street,
      primaryAddress.buildingNumber,
      primaryAddress.postalCode,
      primaryAddress.city
    ].filter(Boolean);

    return parts.join(', ') || '-';
  }

  getTypeClass(type: string): string {
    return type.toLowerCase();
  }

  getStatusName(status: OrderStatus): string {
    return `ORDER_STATUS.${status}`;
  }

  getOrderStatusVariant(status: string): BadgeVariant {
    const statusMap: { [key: string]: BadgeVariant } = {
      'PENDING': 'warning',
      'PROCESSING': 'info',
      'CONFIRMED': 'primary',
      'SHIPPED': 'info',
      'DELIVERED': 'success',
      'CANCELLED': 'danger'
    };
    return statusMap[status] || 'primary';
  }

  onOrdersPageChange(event: PageEvent): void {
    this.ordersPage.set(event.page);
    const customer = this.customer();
    if (customer) {
      this.loadOrders(customer.id);
    }
  }

  cancelNote(): void {
    this.showNoteForm.set(false);
    this.newNoteContent.set('');
  }

  saveNote(): void {
    const content = this.newNoteContent();
    const customer = this.customer();

    if (!content.trim() || !customer) return;

    this.savingNote.set(true);
    const request: AddNoteRequest = { content };

    this.customerService.addCustomerNote(customer.id, request).subscribe({
      next: () => {
        this.notificationService.success(this.translateService.instant('CUSTOMERS.NOTE_ADDED'));
        this.newNoteContent.set('');
        this.showNoteForm.set(false);
        this.savingNote.set(false);
        this.loadNotes(customer.id);
      },
      error: () => {
        this.savingNote.set(false);
      }
    });
  }

  deleteNote(note: CustomerNote): void {
    const customer = this.customer();
    if (!customer) return;

    this.confirmationService.confirm({
      title: this.translateService.instant('COMMON.CONFIRM_DELETE'),
      message: this.translateService.instant('CUSTOMERS.CONFIRM_DELETE_NOTE'),
      confirmText: this.translateService.instant('COMMON.DELETE'),
      confirmButtonClass: 'btn-danger'
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.customerService.deleteCustomerNote(customer.id, note.id).subscribe({
          next: () => {
            this.notificationService.success(this.translateService.instant('CUSTOMERS.NOTE_DELETED'));
            this.loadNotes(customer.id);
          }
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/customers']);
  }
}
