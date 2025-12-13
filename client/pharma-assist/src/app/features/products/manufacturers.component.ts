import { Component, OnInit, inject, signal, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { CatalogService } from '../../core/services/catalog.service';
import { Manufacturer } from '../../core/models/catalog.model';

import { DataTableComponent, TableColumn } from '../../shared/components/data-table';
import { SearchInputComponent } from '../../shared/components/search-input';
import { ModalComponent } from '../../shared/components/modal';
import { StatusBadgeComponent } from '../../shared/components/status-badge';
import { EmptyStateComponent } from '../../shared/components/empty-state';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog';

interface ManufacturerFormData {
  name: string;
  nameLocal: string;
  country: string;
  countryCode: string;
  website: string;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
}

@Component({
  selector: 'app-manufacturers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    DataTableComponent,
    SearchInputComponent,
    ModalComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    ConfirmDialogComponent
  ],
  template: `
    <div class="manufacturers-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">{{ 'manufacturers.title' | translate }}</h1>
          <p class="page-subtitle">{{ 'manufacturers.subtitle' | translate }}</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          {{ 'manufacturers.addManufacturer' | translate }}
        </button>
      </div>

      <!-- Filters Bar -->
      <div class="filters-bar">
        <app-search-input
          [placeholder]="'common.search' | translate"
          [debounceTime]="300"
          (searchChange)="onSearch($event)"
        ></app-search-input>

        <div class="filter-group">
          <label class="toggle-filter">
            <input
              type="checkbox"
              [(ngModel)]="showActiveOnly"
              (ngModelChange)="filterManufacturers()"
            >
            <span>{{ 'common.activeOnly' | translate }}</span>
          </label>
        </div>
      </div>

      <!-- Manufacturers Table -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>{{ 'common.loading' | translate }}</p>
        </div>
      } @else if (filteredManufacturers().length === 0 && !searchTerm) {
        <app-empty-state
          icon="building"
          [title]="'manufacturers.empty.title' | translate"
          [description]="'manufacturers.empty.description' | translate"
          [actionLabel]="'manufacturers.addManufacturer' | translate"
          (actionClick)="openCreateModal()"
        ></app-empty-state>
      } @else if (filteredManufacturers().length === 0 && searchTerm) {
        <app-empty-state
          icon="search"
          [title]="'common.noSearchResults' | translate"
          [description]="'common.tryDifferentSearch' | translate"
        ></app-empty-state>
      } @else {
        <app-data-table
          [data]="filteredManufacturers()"
          [columns]="columns"
          [selectable]="false"
          [hoverable]="true"
          [striped]="true"
          (rowClick)="onRowClick($event)"
        >
          <!-- Name Column Template -->
          <ng-template #nameTemplate let-row>
            <div class="manufacturer-name-cell">
              <div class="manufacturer-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 21h18"/>
                  <path d="M5 21V7l8-4v18"/>
                  <path d="M19 21V11l-6-4"/>
                  <path d="M9 9v.01"/>
                  <path d="M9 12v.01"/>
                  <path d="M9 15v.01"/>
                  <path d="M9 18v.01"/>
                </svg>
              </div>
              <div class="manufacturer-info">
                <span class="manufacturer-name">{{ row.name }}</span>
                @if (row.nameLocal && row.nameLocal !== row.name) {
                  <span class="manufacturer-name-local">{{ row.nameLocal }}</span>
                }
              </div>
            </div>
          </ng-template>

          <!-- Country Column Template -->
          <ng-template #countryTemplate let-row>
            @if (row.country) {
              <div class="country-cell">
                @if (row.countryCode) {
                  <span class="country-code">{{ row.countryCode }}</span>
                }
                <span class="country-name">{{ row.country }}</span>
              </div>
            } @else {
              <span class="no-value">—</span>
            }
          </ng-template>

          <!-- Contact Column Template -->
          <ng-template #contactTemplate let-row>
            <div class="contact-cell">
              @if (row.contactEmail) {
                <a [href]="'mailto:' + row.contactEmail" class="contact-link" (click)="$event.stopPropagation()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  {{ row.contactEmail }}
                </a>
              }
              @if (row.contactPhone) {
                <a [href]="'tel:' + row.contactPhone" class="contact-link" (click)="$event.stopPropagation()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  {{ row.contactPhone }}
                </a>
              }
              @if (!row.contactEmail && !row.contactPhone) {
                <span class="no-value">—</span>
              }
            </div>
          </ng-template>

          <!-- Website Column Template -->
          <ng-template #websiteTemplate let-row>
            @if (row.website) {
              <a [href]="row.website" target="_blank" class="website-link" (click)="$event.stopPropagation()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                {{ getWebsiteDisplay(row.website) }}
              </a>
            } @else {
              <span class="no-value">—</span>
            }
          </ng-template>

          <!-- Products Column Template -->
          <ng-template #productsTemplate let-row>
            <span class="product-count">{{ row.productCount || 0 }}</span>
          </ng-template>

          <!-- Status Column Template -->
          <ng-template #statusTemplate let-row>
            <app-status-badge
              [label]="row.isActive ? 'common.active' : 'common.inactive'"
              [variant]="row.isActive ? 'success' : 'neutral'"
              [shouldTranslate]="true"
              [dot]="true"
            ></app-status-badge>
          </ng-template>

          <!-- Actions Column Template -->
          <ng-template #actionsTemplate let-row>
            <div class="action-buttons">
              <button class="btn-icon" (click)="editManufacturer(row); $event.stopPropagation()" [title]="'common.edit' | translate">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button
                class="btn-icon btn-icon-danger"
                (click)="confirmDelete(row); $event.stopPropagation()"
                [title]="'common.delete' | translate"
                [disabled]="(row.productCount || 0) > 0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </button>
            </div>
          </ng-template>
        </app-data-table>
      }

      <!-- Manufacturer Form Modal -->
      <app-modal
        [isOpen]="showFormModal()"
        [title]="(editingManufacturer() ? 'manufacturers.editManufacturer' : 'manufacturers.addManufacturer') | translate"
        [size]="'large'"
        (closeModal)="closeFormModal()"
      >
        <div class="modal-body" body>
          <form class="manufacturer-form" (ngSubmit)="saveManufacturer()">
            <div class="form-section">
              <h3 class="section-title">{{ 'manufacturers.form.basicInfo' | translate }}</h3>
              <div class="form-row">
                <div class="form-group">
                  <label for="name">{{ 'manufacturers.form.name' | translate }} *</label>
                  <input
                    type="text"
                    id="name"
                    [(ngModel)]="formData.name"
                    name="name"
                    class="form-control"
                    required
                    [placeholder]="'manufacturers.form.namePlaceholder' | translate"
                  >
                </div>
                <div class="form-group">
                  <label for="nameLocal">{{ 'manufacturers.form.nameLocal' | translate }}</label>
                  <input
                    type="text"
                    id="nameLocal"
                    [(ngModel)]="formData.nameLocal"
                    name="nameLocal"
                    class="form-control"
                    [placeholder]="'manufacturers.form.nameLocalPlaceholder' | translate"
                  >
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="country">{{ 'manufacturers.form.country' | translate }}</label>
                  <input
                    type="text"
                    id="country"
                    [(ngModel)]="formData.country"
                    name="country"
                    class="form-control"
                    [placeholder]="'manufacturers.form.countryPlaceholder' | translate"
                  >
                </div>
                <div class="form-group">
                  <label for="countryCode">{{ 'manufacturers.form.countryCode' | translate }}</label>
                  <input
                    type="text"
                    id="countryCode"
                    [(ngModel)]="formData.countryCode"
                    name="countryCode"
                    class="form-control"
                    maxlength="3"
                    [placeholder]="'manufacturers.form.countryCodePlaceholder' | translate"
                  >
                </div>
              </div>
            </div>

            <div class="form-section">
              <h3 class="section-title">{{ 'manufacturers.form.contactInfo' | translate }}</h3>
              <div class="form-group">
                <label for="website">{{ 'manufacturers.form.website' | translate }}</label>
                <input
                  type="url"
                  id="website"
                  [(ngModel)]="formData.website"
                  name="website"
                  class="form-control"
                  [placeholder]="'manufacturers.form.websitePlaceholder' | translate"
                >
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="contactEmail">{{ 'manufacturers.form.email' | translate }}</label>
                  <input
                    type="email"
                    id="contactEmail"
                    [(ngModel)]="formData.contactEmail"
                    name="contactEmail"
                    class="form-control"
                    [placeholder]="'manufacturers.form.emailPlaceholder' | translate"
                  >
                </div>
                <div class="form-group">
                  <label for="contactPhone">{{ 'manufacturers.form.phone' | translate }}</label>
                  <input
                    type="tel"
                    id="contactPhone"
                    [(ngModel)]="formData.contactPhone"
                    name="contactPhone"
                    class="form-control"
                    [placeholder]="'manufacturers.form.phonePlaceholder' | translate"
                  >
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  [(ngModel)]="formData.isActive"
                  name="isActive"
                >
                <span>{{ 'manufacturers.form.isActive' | translate }}</span>
              </label>
            </div>
          </form>
        </div>
        <div class="modal-footer" footer>
          <button type="button" class="btn btn-secondary" (click)="closeFormModal()">
            {{ 'common.cancel' | translate }}
          </button>
          <button
            type="button"
            class="btn btn-primary"
            (click)="saveManufacturer()"
            [disabled]="saving() || !formData.name"
          >
            @if (saving()) {
              <span class="spinner-small"></span>
            }
            {{ (editingManufacturer() ? 'common.save' : 'common.create') | translate }}
          </button>
        </div>
      </app-modal>

      <!-- Delete Confirmation Dialog -->
      <app-confirm-dialog
        [isOpen]="showDeleteDialog()"
        [title]="'manufacturers.delete.title' | translate"
        [message]="'manufacturers.delete.message' | translate : { name: deletingManufacturer()?.name }"
        [confirmLabel]="'common.delete' | translate"
        [cancelLabel]="'common.cancel' | translate"
        variant="danger"
        (confirmed)="deleteManufacturer()"
        (cancelled)="cancelDelete()"
      ></app-confirm-dialog>
    </div>
  `,
  styles: [`
    .manufacturers-page {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .header-content {
      flex: 1;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 600;
      color: var(--pharma-teal-900);
      margin: 0 0 4px 0;
    }

    .page-subtitle {
      color: var(--pharma-teal-600);
      margin: 0;
      font-size: 0.9rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: var(--pharma-teal-600);
      color: white;
    }

    .btn-primary:hover {
      background: var(--pharma-teal-700);
    }

    .btn-primary:disabled {
      background: var(--pharma-teal-300);
      cursor: not-allowed;
    }

    .btn-secondary {
      background: var(--pharma-teal-50);
      color: var(--pharma-teal-700);
      border: 1px solid var(--pharma-teal-200);
    }

    .btn-secondary:hover {
      background: var(--pharma-teal-100);
    }

    .filters-bar {
      display: flex;
      gap: 16px;
      align-items: center;
      margin-bottom: 20px;
      padding: 16px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .toggle-filter {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--pharma-teal-700);
    }

    .toggle-filter input[type="checkbox"] {
      width: 16px;
      height: 16px;
      accent-color: var(--pharma-teal-600);
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: var(--pharma-teal-600);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--pharma-teal-100);
      border-top-color: var(--pharma-teal-600);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 12px;
    }

    .spinner-small {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .manufacturer-name-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .manufacturer-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: var(--pharma-teal-50);
      color: var(--pharma-teal-600);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .manufacturer-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .manufacturer-name {
      font-weight: 500;
      color: var(--pharma-teal-900);
    }

    .manufacturer-name-local {
      font-size: 0.75rem;
      color: var(--pharma-teal-500);
    }

    .country-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .country-code {
      display: inline-block;
      padding: 2px 6px;
      background: var(--pharma-teal-100);
      color: var(--pharma-teal-700);
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .country-name {
      color: var(--pharma-teal-700);
    }

    .contact-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .contact-link {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--pharma-teal-600);
      text-decoration: none;
      font-size: 0.85rem;
      transition: color 0.2s ease;
    }

    .contact-link:hover {
      color: var(--pharma-teal-700);
    }

    .website-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--pharma-teal-600);
      text-decoration: none;
      font-size: 0.85rem;
      transition: color 0.2s ease;
    }

    .website-link:hover {
      color: var(--pharma-teal-700);
      text-decoration: underline;
    }

    .no-value {
      color: var(--pharma-teal-300);
    }

    .product-count {
      font-weight: 500;
      color: var(--pharma-teal-700);
    }

    .action-buttons {
      display: flex;
      gap: 4px;
    }

    .btn-icon {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      border: none;
      background: transparent;
      color: var(--pharma-teal-600);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .btn-icon:hover {
      background: var(--pharma-teal-50);
    }

    .btn-icon-danger:hover {
      background: var(--color-error-bg);
      color: var(--color-error-dark);
    }

    .btn-icon:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .btn-icon:disabled:hover {
      background: transparent;
      color: var(--pharma-teal-600);
    }

    /* Modal Form Styles */
    .modal-body {
      padding: 20px;
    }

    .manufacturer-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .section-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--pharma-teal-700);
      margin: 0;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--pharma-teal-100);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--pharma-teal-700);
    }

    .form-control {
      padding: 10px 12px;
      border: 1px solid var(--pharma-teal-200);
      border-radius: 8px;
      font-size: 0.9rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: var(--pharma-teal-500);
      box-shadow: 0 0 0 3px var(--pharma-teal-100);
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--pharma-teal-700);
    }

    .checkbox-label input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: var(--pharma-teal-600);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 20px;
      border-top: 1px solid var(--pharma-teal-100);
      background: var(--pharma-teal-50);
      border-radius: 0 0 12px 12px;
    }

    @media (max-width: 768px) {
      .manufacturers-page {
        padding: 16px;
      }

      .page-header {
        flex-direction: column;
        gap: 16px;
      }

      .filters-bar {
        flex-direction: column;
        align-items: stretch;
      }

      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ManufacturersComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);

  // State
  manufacturers = signal<Manufacturer[]>([]);
  filteredManufacturers = signal<Manufacturer[]>([]);
  loading = signal(true);
  saving = signal(false);
  showFormModal = signal(false);
  showDeleteDialog = signal(false);
  editingManufacturer = signal<Manufacturer | null>(null);
  deletingManufacturer = signal<Manufacturer | null>(null);

  // Filters
  searchTerm = '';
  showActiveOnly = false;

  // Form
  formData: ManufacturerFormData = this.getEmptyFormData();

  // Table columns
  @ViewChild('nameTemplate') nameTemplate!: TemplateRef<any>;
  @ViewChild('countryTemplate') countryTemplate!: TemplateRef<any>;
  @ViewChild('contactTemplate') contactTemplate!: TemplateRef<any>;
  @ViewChild('websiteTemplate') websiteTemplate!: TemplateRef<any>;
  @ViewChild('productsTemplate') productsTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

  columns: TableColumn[] = [];

  ngOnInit(): void {
    this.loadManufacturers();
    this.setupColumns();
  }

  private setupColumns(): void {
    setTimeout(() => {
      this.columns = [
        { key: 'name', label: 'manufacturers.table.name', sortable: true, template: this.nameTemplate },
        { key: 'country', label: 'manufacturers.table.country', sortable: true, template: this.countryTemplate },
        { key: 'contact', label: 'manufacturers.table.contact', template: this.contactTemplate },
        { key: 'website', label: 'manufacturers.table.website', template: this.websiteTemplate },
        { key: 'productCount', label: 'manufacturers.table.products', sortable: true, template: this.productsTemplate, width: '100px' },
        { key: 'isActive', label: 'manufacturers.table.status', template: this.statusTemplate, width: '100px' },
        { key: 'actions', label: '', template: this.actionsTemplate, width: '100px' }
      ];
    });
  }

  loadManufacturers(): void {
    this.loading.set(true);
    this.catalogService.getManufacturers().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.manufacturers.set(response.data);
          this.filterManufacturers();
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  filterManufacturers(): void {
    let result = [...this.manufacturers()];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(m =>
        m.name.toLowerCase().includes(term) ||
        (m.nameLocal && m.nameLocal.toLowerCase().includes(term)) ||
        (m.country && m.country.toLowerCase().includes(term)) ||
        (m.contactEmail && m.contactEmail.toLowerCase().includes(term))
      );
    }

    if (this.showActiveOnly) {
      result = result.filter(m => m.isActive);
    }

    this.filteredManufacturers.set(result);
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.filterManufacturers();
  }

  onRowClick(manufacturer: Manufacturer): void {
    this.editManufacturer(manufacturer);
  }

  openCreateModal(): void {
    this.editingManufacturer.set(null);
    this.formData = this.getEmptyFormData();
    this.showFormModal.set(true);
  }

  editManufacturer(manufacturer: Manufacturer): void {
    this.editingManufacturer.set(manufacturer);
    this.formData = {
      name: manufacturer.name,
      nameLocal: manufacturer.nameLocal || '',
      country: manufacturer.country || '',
      countryCode: manufacturer.countryCode || '',
      website: manufacturer.website || '',
      contactEmail: manufacturer.contactEmail || '',
      contactPhone: manufacturer.contactPhone || '',
      isActive: manufacturer.isActive
    };
    this.showFormModal.set(true);
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
    this.editingManufacturer.set(null);
    this.formData = this.getEmptyFormData();
  }

  getWebsiteDisplay(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '');
    } catch {
      return url;
    }
  }

  saveManufacturer(): void {
    if (!this.formData.name || this.saving()) return;

    this.saving.set(true);
    const manufacturerData: Partial<Manufacturer> = {
      name: this.formData.name,
      nameLocal: this.formData.nameLocal || this.formData.name,
      country: this.formData.country || undefined,
      countryCode: this.formData.countryCode || undefined,
      website: this.formData.website || undefined,
      contactEmail: this.formData.contactEmail || undefined,
      contactPhone: this.formData.contactPhone || undefined,
      isActive: this.formData.isActive
    };

    const editing = this.editingManufacturer();
    const request = editing
      ? this.catalogService.updateManufacturer(editing.id, manufacturerData)
      : this.catalogService.createManufacturer(manufacturerData);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.loadManufacturers();
          this.closeFormModal();
        }
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
      }
    });
  }

  confirmDelete(manufacturer: Manufacturer): void {
    this.deletingManufacturer.set(manufacturer);
    this.showDeleteDialog.set(true);
  }

  cancelDelete(): void {
    this.showDeleteDialog.set(false);
    this.deletingManufacturer.set(null);
  }

  deleteManufacturer(): void {
    const manufacturer = this.deletingManufacturer();
    if (!manufacturer) return;

    this.catalogService.deleteManufacturer(manufacturer.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadManufacturers();
        }
        this.cancelDelete();
      },
      error: () => {
        this.cancelDelete();
      }
    });
  }

  private getEmptyFormData(): ManufacturerFormData {
    return {
      name: '',
      nameLocal: '',
      country: '',
      countryCode: '',
      website: '',
      contactEmail: '',
      contactPhone: '',
      isActive: true
    };
  }
}
