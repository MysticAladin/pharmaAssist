import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CustomerService } from '../../core/services/customer.service';
import {
  Customer,
  CustomerType,
  CustomerTier,
  getCustomerTypeLabel,
  getTierLabel,
  getTierClass
} from '../../core/models/customer.model';
import { SearchInputComponent } from '../../shared/components/search-input/search-input.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PaginationComponent, PageEvent } from '../../shared/components/pagination/pagination.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-customers-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    TranslateModule,
    SearchInputComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    PaginationComponent,
    ConfirmDialogComponent,
    ModalComponent
  ],
  templateUrl: './customers-list-component/customers-list.component.html',
  styleUrls: ['./customers-list-component/customers-list.component.scss']
})
export class CustomersListComponent implements OnInit {
  private readonly customerService = inject(CustomerService);

  // State
  loading = signal(true);
  customers = signal<Customer[]>([]);
  saving = signal(false);
  showModal = signal(false);
  showDeleteConfirm = signal(false);
  editingCustomer = signal<Customer | null>(null);
  customerToDelete = signal<Customer | null>(null);

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalItems = signal(0);

  // Filters
  searchTerm = '';
  selectedType = '';
  selectedTier = '';
  activeOnly = false;
  sortColumn = signal('name');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Form
  formData = this.getEmptyFormData();

  // Enums for template
  CustomerType = CustomerType;
  CustomerTier = CustomerTier;
  getCustomerTypeLabel = getCustomerTypeLabel;
  getTierLabel = getTierLabel;
  getTierClass = getTierClass;

  // Stats computed
  totalCustomers = computed(() => this.customers().length);
  activeCustomers = computed(() => this.customers().filter(c => c.isActive).length);
  premiumCustomers = computed(() => this.customers().filter(c => c.tier === CustomerTier.A).length);
  pharmacyCount = computed(() => this.customers().filter(c => c.customerType === CustomerType.Pharmacy).length);

  filteredCustomers = computed(() => {
    let result = this.customers();

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.customerCode.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term)
      );
    }

    if (this.selectedType) {
      result = result.filter(c => c.customerType === +this.selectedType);
    }

    if (this.selectedTier) {
      result = result.filter(c => c.tier === +this.selectedTier);
    }

    if (this.activeOnly) {
      result = result.filter(c => c.isActive);
    }

    const column = this.sortColumn();
    const direction = this.sortDirection();
    result = [...result].sort((a, b) => {
      const aVal = a[column as keyof Customer];
      const bVal = b[column as keyof Customer];
      const modifier = direction === 'asc' ? 1 : -1;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * modifier;
      }
      return 0;
    });

    return result;
  });

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading.set(true);
    this.customerService.getAll().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.customers.set(response.data);
          this.totalItems.set(response.data.length);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading customers:', err);
        this.loading.set(false);
      }
    });
  }

  onSearch(term: string): void {
    this.searchTerm = term;
  }

  applyFilters(): void {
    // Triggers computed recalculation
  }

  sortBy(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.page;
    this.pageSize = event.pageSize;
  }

  getEmptyFormData() {
    return {
      name: '',
      customerType: CustomerType.Retail,
      email: '',
      phone: '',
      contactPerson: '',
      tier: CustomerTier.C,
      taxId: '',
      pharmacyLicense: '',
      discountPercentage: 0
    };
  }

  openModal(): void {
    this.editingCustomer.set(null);
    this.formData = this.getEmptyFormData();
    this.showModal.set(true);
  }

  editCustomer(customer: Customer): void {
    this.editingCustomer.set(customer);
    this.formData = {
      name: customer.name,
      customerType: customer.customerType,
      email: customer.email,
      phone: customer.phone || '',
      contactPerson: customer.contactPerson || '',
      tier: customer.tier,
      taxId: customer.taxId || '',
      pharmacyLicense: customer.pharmacyLicense || '',
      discountPercentage: customer.discountPercentage
    };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingCustomer.set(null);
  }

  saveCustomer(): void {
    this.saving.set(true);
    const editing = this.editingCustomer();

    if (editing) {
      this.customerService.update(editing.id, {
        name: this.formData.name,
        customerType: +this.formData.customerType,
        email: this.formData.email,
        phone: this.formData.phone || undefined,
        contactPerson: this.formData.contactPerson || undefined,
        tier: +this.formData.tier,
        taxId: this.formData.taxId || undefined,
        pharmacyLicense: this.formData.pharmacyLicense || undefined,
        discountPercentage: this.formData.discountPercentage,
        creditLimit: editing.creditLimit,
        paymentTermDays: editing.paymentTermDays,
        isActive: editing.isActive
      }).subscribe({
        next: () => {
          this.loadCustomers();
          this.closeModal();
          this.saving.set(false);
        },
        error: () => this.saving.set(false)
      });
    } else {
      this.customerService.create({
        name: this.formData.name,
        customerType: +this.formData.customerType,
        email: this.formData.email,
        phone: this.formData.phone || undefined,
        contactPerson: this.formData.contactPerson || undefined,
        tier: +this.formData.tier,
        taxId: this.formData.taxId || undefined,
        pharmacyLicense: this.formData.pharmacyLicense || undefined,
        discountPercentage: this.formData.discountPercentage,
        creditLimit: 0,
        paymentTermDays: 30
      }).subscribe({
        next: () => {
          this.loadCustomers();
          this.closeModal();
          this.saving.set(false);
        },
        error: () => this.saving.set(false)
      });
    }
  }

  confirmDelete(customer: Customer): void {
    this.customerToDelete.set(customer);
    this.showDeleteConfirm.set(true);
  }

  deleteCustomer(): void {
    const customer = this.customerToDelete();
    if (!customer) return;

    this.customerService.delete(customer.id).subscribe({
      next: () => {
        this.loadCustomers();
        this.showDeleteConfirm.set(false);
        this.customerToDelete.set(null);
      }
    });
  }

  exportCustomers(): void {
    console.log('Exporting customers...');
  }
}
