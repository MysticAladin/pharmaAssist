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
  template: `
    <div class="customers-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">{{ 'customers.title' | translate }}</h1>
          <p class="page-description">{{ 'customers.subtitle' | translate }}</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="exportCustomers()">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {{ 'common.export' | translate }}
          </button>
          <button class="btn btn-primary" (click)="openModal()">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {{ 'customers.addCustomer' | translate }}
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon total"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
          <div class="stat-content"><span class="stat-value">{{ totalCustomers() }}</span><span class="stat-label">{{ 'customers.stats.total' | translate }}</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon active"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
          <div class="stat-content"><span class="stat-value">{{ activeCustomers() }}</span><span class="stat-label">{{ 'customers.stats.active' | translate }}</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon premium"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>
          <div class="stat-content"><span class="stat-value">{{ premiumCustomers() }}</span><span class="stat-label">{{ 'customers.stats.premium' | translate }}</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon pharmacy"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16"/><path d="M3 21h18"/><path d="M9 7h1"/><path d="M9 11h1"/><path d="M9 15h1"/><path d="M14 7h1"/><path d="M14 11h1"/><path d="M14 15h1"/></svg></div>
          <div class="stat-content"><span class="stat-value">{{ pharmacyCount() }}</span><span class="stat-label">{{ 'customers.stats.pharmacies' | translate }}</span></div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <app-search-input
          [placeholder]="'customers.searchPlaceholder' | translate"
          (search)="onSearch($event)"
        ></app-search-input>

        <div class="filter-group">
          <select class="filter-select" [(ngModel)]="selectedType" (change)="applyFilters()">
            <option value="">{{ 'customers.allTypes' | translate }}</option>
            <option [value]="CustomerType.Retail">{{ 'customers.types.retail' | translate }}</option>
            <option [value]="CustomerType.Pharmacy">{{ 'customers.types.pharmacy' | translate }}</option>
            <option [value]="CustomerType.Hospital">{{ 'customers.types.hospital' | translate }}</option>
            <option [value]="CustomerType.Wholesale">{{ 'customers.types.wholesale' | translate }}</option>
            <option [value]="CustomerType.Clinic">{{ 'customers.types.clinic' | translate }}</option>
          </select>

          <select class="filter-select" [(ngModel)]="selectedTier" (change)="applyFilters()">
            <option value="">{{ 'customers.allTiers' | translate }}</option>
            <option [value]="CustomerTier.A">{{ 'customers.tiers.premium' | translate }}</option>
            <option [value]="CustomerTier.B">{{ 'customers.tiers.standard' | translate }}</option>
            <option [value]="CustomerTier.C">{{ 'customers.tiers.basic' | translate }}</option>
          </select>

          <label class="filter-checkbox">
            <input type="checkbox" [(ngModel)]="activeOnly" (change)="applyFilters()">
            <span>{{ 'customers.activeOnly' | translate }}</span>
          </label>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-container">
          <div class="loading-grid">
            @for (i of [1,2,3,4,5]; track i) {
              <div class="skeleton-row"><div class="skeleton skeleton-cell"></div><div class="skeleton skeleton-cell wide"></div><div class="skeleton skeleton-cell"></div><div class="skeleton skeleton-cell"></div><div class="skeleton skeleton-cell"></div></div>
            }
          </div>
        </div>
      } @else if (filteredCustomers().length === 0) {
        <app-empty-state
          icon="users"
          [title]="'customers.empty.title' | translate"
          [description]="'customers.empty.description' | translate"
          [actionLabel]="'customers.addCustomer' | translate"
          (actionClick)="openModal()"
        ></app-empty-state>
      } @else {
        <!-- Customers Table -->
        <div class="table-card">
          <table class="data-table">
            <thead>
              <tr>
                <th class="sortable" (click)="sortBy('name')">{{ 'customers.columns.name' | translate }} @if(sortColumn==='name'){<span class="sort-icon">{{sortDirection==='asc'?'↑':'↓'}}</span>}</th>
                <th>{{ 'customers.columns.code' | translate }}</th>
                <th>{{ 'customers.columns.type' | translate }}</th>
                <th>{{ 'customers.columns.tier' | translate }}</th>
                <th>{{ 'customers.columns.contact' | translate }}</th>
                <th class="text-center">{{ 'common.status' | translate }}</th>
                <th class="text-center">{{ 'common.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (customer of filteredCustomers(); track customer.id) {
                <tr>
                  <td>
                    <div class="customer-info">
                      <div class="customer-avatar" [class]="getTierClass(customer.tier)">
                        {{ customer.name.charAt(0) }}
                      </div>
                      <div class="customer-details">
                        <a [routerLink]="['/customers', customer.id]" class="customer-name">{{ customer.name }}</a>
                        <span class="customer-tier-label">{{ getTierLabel(customer.tier) | translate }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="code-cell">{{ customer.customerCode }}</td>
                  <td>
                    <span class="type-badge" [class]="'type-' + customer.customerType">
                      {{ getCustomerTypeLabel(customer.customerType) | translate }}
                    </span>
                  </td>
                  <td>
                    <span class="tier-badge" [class]="getTierClass(customer.tier)">
                      {{ getTierLabel(customer.tier) | translate }}
                    </span>
                  </td>
                  <td>
                    @if (customer.contactPerson) {
                      <div class="contact-info">{{ customer.contactPerson }}</div>
                    } @else {
                      <span class="text-muted">-</span>
                    }
                  </td>
                  <td class="text-center">
                    <app-status-badge
                      [variant]="customer.isActive ? 'success' : 'neutral'"
                      [label]="(customer.isActive ? 'common.active' : 'common.inactive') | translate"
                    ></app-status-badge>
                  </td>
                  <td class="text-center">
                    <div class="action-buttons">
                      <button class="btn-icon" [routerLink]="['/customers', customer.id]" [title]="'common.view' | translate">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button class="btn-icon" (click)="editCustomer(customer)" [title]="'common.edit' | translate">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button class="btn-icon btn-danger" (click)="confirmDelete(customer)" [title]="'common.delete' | translate">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <app-pagination
          [page]="currentPage"
          [size]="pageSize"
          [totalItems]="totalItems()"
          [sizeOptions]="[10, 25, 50]"
          (pageChange)="onPageChange($event)"
        ></app-pagination>
      }

      <!-- Customer Modal -->
      <app-modal
        [isOpen]="showModal()"
        [title]="(editingCustomer() ? 'customers.editCustomer' : 'customers.addCustomer') | translate"
        (close)="closeModal()"
      >
        <form (ngSubmit)="saveCustomer()" #customerForm="ngForm" class="customer-form">
          <div class="form-grid">
            <div class="form-group">
              <label for="name">{{ 'customers.form.name' | translate }} *</label>
              <input type="text" id="name" name="name" [(ngModel)]="formData.name" required>
            </div>
            <div class="form-group">
              <label for="customerType">{{ 'customers.form.type' | translate }} *</label>
              <select id="customerType" name="customerType" [(ngModel)]="formData.customerType" required>
                <option [value]="CustomerType.Retail">{{ 'customers.types.retail' | translate }}</option>
                <option [value]="CustomerType.Pharmacy">{{ 'customers.types.pharmacy' | translate }}</option>
                <option [value]="CustomerType.Hospital">{{ 'customers.types.hospital' | translate }}</option>
                <option [value]="CustomerType.Wholesale">{{ 'customers.types.wholesale' | translate }}</option>
                <option [value]="CustomerType.Clinic">{{ 'customers.types.clinic' | translate }}</option>
              </select>
            </div>
            <div class="form-group">
              <label for="email">{{ 'customers.form.email' | translate }} *</label>
              <input type="email" id="email" name="email" [(ngModel)]="formData.email" required>
            </div>
            <div class="form-group">
              <label for="phone">{{ 'customers.form.phone' | translate }}</label>
              <input type="tel" id="phone" name="phone" [(ngModel)]="formData.phone">
            </div>
            <div class="form-group">
              <label for="contactPerson">{{ 'customers.form.contactPerson' | translate }}</label>
              <input type="text" id="contactPerson" name="contactPerson" [(ngModel)]="formData.contactPerson">
            </div>
            <div class="form-group">
              <label for="tier">{{ 'customers.form.tier' | translate }}</label>
              <select id="tier" name="tier" [(ngModel)]="formData.tier">
                <option [value]="CustomerTier.A">{{ 'customers.tiers.premium' | translate }}</option>
                <option [value]="CustomerTier.B">{{ 'customers.tiers.standard' | translate }}</option>
                <option [value]="CustomerTier.C">{{ 'customers.tiers.basic' | translate }}</option>
              </select>
            </div>
            <div class="form-group">
              <label for="taxId">{{ 'customers.form.taxId' | translate }}</label>
              <input type="text" id="taxId" name="taxId" [(ngModel)]="formData.taxId">
            </div>
            <div class="form-group">
              <label for="discountPercentage">{{ 'customers.form.discount' | translate }} (%)</label>
              <input type="number" id="discountPercentage" name="discountPercentage" [(ngModel)]="formData.discountPercentage" min="0" max="100" step="0.1">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeModal()">{{ 'common.cancel' | translate }}</button>
            <button type="submit" class="btn btn-primary" [disabled]="!customerForm.valid || saving()">
              @if (saving()) { <span class="spinner"></span> }
              {{ (editingCustomer() ? 'common.save' : 'common.create') | translate }}
            </button>
          </div>
        </form>
      </app-modal>

      <!-- Delete Confirmation -->
      <app-confirm-dialog
        [isOpen]="showDeleteConfirm()"
        [title]="'customers.delete.title' | translate"
        [message]="'customers.delete.message' | translate:{ name: customerToDelete()?.name }"
        [confirmLabel]="'common.delete' | translate"
        [cancelLabel]="'common.cancel' | translate"
        variant="danger"
        (confirm)="deleteCustomer()"
        (cancel)="showDeleteConfirm.set(false)"
      ></app-confirm-dialog>
    </div>
  `,
  styles: [`
    :host{--c1:#1a1a2e;--c2:#6b7280;--c3:#e5e7eb;--c4:#f3f4f6;--c5:#0d9488}
    .customers-page{padding:1.5rem;max-width:1400px;margin:0 auto}
    .page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem;gap:1rem;flex-wrap:wrap}
    .page-title{font-size:1.75rem;font-weight:600;color:var(--c1);margin:0 0 .25rem}
    .page-description{color:var(--c2);margin:0;font-size:.9rem}
    .header-actions{display:flex;gap:.75rem}
    .btn{display:inline-flex;align-items:center;gap:.5rem;padding:.5rem 1rem;font-size:.875rem;font-weight:500;border-radius:8px;border:none;cursor:pointer;transition:all .2s}
    .btn-primary{background:var(--c5);color:#fff}.btn-primary:hover{background:#0f766e}
    .btn-secondary{background:#fff;color:var(--c1);border:1px solid var(--c3)}.btn-secondary:hover{background:var(--c4)}
    .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem}
    @media(max-width:1024px){.stats-grid{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:640px){.stats-grid{grid-template-columns:1fr}}
    .stat-card{display:flex;align-items:center;gap:1rem;padding:1.25rem;background:#fff;border-radius:12px;border:1px solid var(--c3)}
    .stat-icon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center}
    .stat-icon.total{background:#f0f9ff;color:#0284c7}
    .stat-icon.active{background:#ecfdf5;color:#059669}
    .stat-icon.premium{background:#fef3c7;color:#d97706}
    .stat-icon.pharmacy{background:#f3e8ff;color:#9333ea}
    .stat-value{font-size:1.5rem;font-weight:600;color:var(--c1);display:block}
    .stat-label{font-size:.8rem;color:var(--c2)}
    .filters-section{display:flex;justify-content:space-between;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap}
    .filter-group{display:flex;gap:.75rem;align-items:center;flex-wrap:wrap}
    .filter-select{padding:.5rem 2rem .5rem .75rem;font-size:.875rem;border:1px solid var(--c3);border-radius:8px;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right .75rem center;appearance:none;cursor:pointer}
    .filter-checkbox{display:flex;align-items:center;gap:.5rem;font-size:.875rem;color:var(--c2);cursor:pointer}
    .filter-checkbox input{width:16px;height:16px;cursor:pointer}
    .table-card{background:#fff;border-radius:12px;border:1px solid var(--c3);overflow:hidden;margin-bottom:1rem}
    .data-table{width:100%;border-collapse:collapse}
    .data-table th{text-align:left;padding:.75rem 1rem;font-size:.75rem;font-weight:600;color:var(--c2);text-transform:uppercase;background:var(--c4);border-bottom:1px solid var(--c3)}
    .data-table th.sortable{cursor:pointer}.data-table th.sortable:hover{color:var(--c5)}
    .sort-icon{margin-left:.25rem}
    .data-table td{padding:1rem;border-bottom:1px solid var(--c3);vertical-align:middle}
    .data-table tr:last-child td{border-bottom:none}.data-table tr:hover{background:var(--c4)}
    .customer-info{display:flex;align-items:center;gap:.75rem}
    .customer-avatar{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;color:#fff;flex-shrink:0}
    .customer-avatar.tier-premium{background:linear-gradient(135deg,#f59e0b,#d97706)}
    .customer-avatar.tier-standard{background:linear-gradient(135deg,#3b82f6,#2563eb)}
    .customer-avatar.tier-basic{background:linear-gradient(135deg,#6b7280,#4b5563)}
    .customer-name{font-weight:500;color:var(--c1);text-decoration:none}.customer-name:hover{color:var(--c5)}
    .customer-location{display:block;font-size:.8rem;color:var(--c2)}
    .code-cell{font-family:monospace;font-size:.85rem;color:var(--c2)}
    .type-badge{display:inline-block;padding:.25rem .5rem;border-radius:4px;font-size:.75rem;font-weight:500}
    .type-badge.type-1{background:#ecfdf5;color:#059669}
    .type-badge.type-2{background:#f3e8ff;color:#9333ea}
    .type-badge.type-3{background:#dbeafe;color:#2563eb}
    .type-badge.type-4{background:#fef3c7;color:#d97706}
    .type-badge.type-5{background:#fee2e2;color:#dc2626}
    .tier-badge{display:inline-block;padding:.25rem .5rem;border-radius:4px;font-size:.75rem;font-weight:500}
    .tier-badge.tier-premium{background:#fef3c7;color:#d97706}
    .tier-badge.tier-standard{background:#dbeafe;color:#2563eb}
    .tier-badge.tier-basic{background:var(--c4);color:var(--c2)}
    .text-center{text-align:center}.text-muted{color:var(--c2)}
    .action-buttons{display:flex;gap:.25rem;justify-content:center}
    .btn-icon{width:32px;height:32px;border:none;border-radius:6px;background:transparent;color:var(--c2);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s}
    .btn-icon:hover{background:var(--c4);color:var(--c5)}
    .btn-icon.btn-danger:hover{background:#fef2f2;color:#dc2626}
    .customer-form{padding:1rem}
    .form-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem}
    @media(max-width:640px){.form-grid{grid-template-columns:1fr}}
    .form-group{display:flex;flex-direction:column;gap:.375rem}
    .form-group label{font-size:.875rem;font-weight:500;color:var(--c1)}
    .form-group input,.form-group select{padding:.5rem .75rem;font-size:.875rem;border:1px solid var(--c3);border-radius:8px}
    .form-group input:focus,.form-group select:focus{outline:none;border-color:var(--c5);box-shadow:0 0 0 3px rgba(13,148,136,.1)}
    .modal-footer{display:flex;justify-content:flex-end;gap:.75rem;padding-top:1.5rem;margin-top:1rem;border-top:1px solid var(--c3)}
    .spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .loading-container{padding:1rem}
    .loading-grid{display:flex;flex-direction:column;gap:.5rem}
    .skeleton-row{display:flex;gap:1rem;padding:1rem;background:#fff;border-radius:8px}
    .skeleton{background:linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:4px}
    .skeleton-cell{height:24px;flex:1}.skeleton-cell.wide{flex:2}
    @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
    @media(max-width:768px){.customers-page{padding:1rem}.page-header{flex-direction:column}.header-actions{width:100%}.filters-section{flex-direction:column}.data-table{display:block;overflow-x:auto}}
  `]
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
  sortColumn = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

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

    result = [...result].sort((a, b) => {
      const aVal = a[this.sortColumn as keyof Customer];
      const bVal = b[this.sortColumn as keyof Customer];
      const modifier = this.sortDirection === 'asc' ? 1 : -1;
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
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
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
