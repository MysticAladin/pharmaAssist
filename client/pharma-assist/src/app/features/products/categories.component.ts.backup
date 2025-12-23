import { Component, OnInit, inject, signal, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { CatalogService } from '../../core/services/catalog.service';
import { Category } from '../../core/models/catalog.model';

import { DataTableComponent, TableColumn } from '../../shared/components/data-table';
import { SearchInputComponent } from '../../shared/components/search-input';
import { ModalComponent } from '../../shared/components/modal';
import { StatusBadgeComponent } from '../../shared/components/status-badge';
import { EmptyStateComponent } from '../../shared/components/empty-state';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog';

interface CategoryFormData {
  name: string;
  nameLocal: string;
  description: string;
  parentId: number | null;
  sortOrder: number;
  isActive: boolean;
}

@Component({
  selector: 'app-categories',
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
    <div class="categories-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">{{ 'categories.title' | translate }}</h1>
          <p class="page-subtitle">{{ 'categories.subtitle' | translate }}</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          {{ 'categories.addCategory' | translate }}
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
              (ngModelChange)="filterCategories()"
            >
            <span>{{ 'common.activeOnly' | translate }}</span>
          </label>
        </div>
      </div>

      <!-- Categories Table -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>{{ 'common.loading' | translate }}</p>
        </div>
      } @else if (filteredCategories().length === 0 && !searchTerm) {
        <app-empty-state
          icon="folder"
          [title]="'categories.empty.title' | translate"
          [description]="'categories.empty.description' | translate"
          [actionLabel]="'categories.addCategory' | translate"
          (actionClick)="openCreateModal()"
        ></app-empty-state>
      } @else if (filteredCategories().length === 0 && searchTerm) {
        <app-empty-state
          icon="search"
          [title]="'common.noSearchResults' | translate"
          [description]="'common.tryDifferentSearch' | translate"
        ></app-empty-state>
      } @else {
        <app-data-table
          [data]="filteredCategories()"
          [columns]="columns"
          [selectable]="false"
          [hoverable]="true"
          [striped]="true"
          (rowClick)="onRowClick($event)"
        >
          <!-- Name Column Template -->
          <ng-template #nameTemplate let-row>
            <div class="category-name-cell">
              <div class="category-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div class="category-info">
                <span class="category-name">{{ row.name }}</span>
                @if (row.nameLocal && row.nameLocal !== row.name) {
                  <span class="category-name-local">{{ row.nameLocal }}</span>
                }
              </div>
            </div>
          </ng-template>

          <!-- Parent Column Template -->
          <ng-template #parentTemplate let-row>
            @if (row.parentName) {
              <span class="parent-badge">{{ row.parentName }}</span>
            } @else {
              <span class="no-parent">—</span>
            }
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

          <!-- Products Column Template -->
          <ng-template #productsTemplate let-row>
            <span class="product-count">{{ row.productCount || 0 }}</span>
          </ng-template>

          <!-- Actions Column Template -->
          <ng-template #actionsTemplate let-row>
            <div class="action-buttons">
              <button class="btn-icon" (click)="editCategory(row); $event.stopPropagation()" [title]="'common.edit' | translate">
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

      <!-- Category Form Modal -->
      <app-modal
        [isOpen]="showFormModal()"
        [title]="(editingCategory() ? 'categories.editCategory' : 'categories.addCategory') | translate"
        [size]="'medium'"
        (closeModal)="closeFormModal()"
      >
        <div class="modal-body" body>
          <form class="category-form" (ngSubmit)="saveCategory()">
            <div class="form-row">
              <div class="form-group">
                <label for="name">{{ 'categories.form.name' | translate }} *</label>
                <input
                  type="text"
                  id="name"
                  [(ngModel)]="formData.name"
                  name="name"
                  class="form-control"
                  required
                  [placeholder]="'categories.form.namePlaceholder' | translate"
                >
              </div>
              <div class="form-group">
                <label for="nameLocal">{{ 'categories.form.nameLocal' | translate }}</label>
                <input
                  type="text"
                  id="nameLocal"
                  [(ngModel)]="formData.nameLocal"
                  name="nameLocal"
                  class="form-control"
                  [placeholder]="'categories.form.nameLocalPlaceholder' | translate"
                >
              </div>
            </div>

            <div class="form-group">
              <label for="description">{{ 'categories.form.description' | translate }}</label>
              <textarea
                id="description"
                [(ngModel)]="formData.description"
                name="description"
                class="form-control"
                rows="3"
                [placeholder]="'categories.form.descriptionPlaceholder' | translate"
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="parentId">{{ 'categories.form.parent' | translate }}</label>
                <select
                  id="parentId"
                  [(ngModel)]="formData.parentId"
                  name="parentId"
                  class="form-control"
                >
                  <option [ngValue]="null">{{ 'categories.form.noParent' | translate }}</option>
                  @for (cat of getParentOptions(); track cat.id) {
                    <option [ngValue]="cat.id">{{ cat.name }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label for="sortOrder">{{ 'categories.form.sortOrder' | translate }}</label>
                <input
                  type="number"
                  id="sortOrder"
                  [(ngModel)]="formData.sortOrder"
                  name="sortOrder"
                  class="form-control"
                  min="0"
                >
              </div>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  [(ngModel)]="formData.isActive"
                  name="isActive"
                >
                <span>{{ 'categories.form.isActive' | translate }}</span>
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
            (click)="saveCategory()"
            [disabled]="saving() || !formData.name"
          >
            @if (saving()) {
              <span class="spinner-small"></span>
            }
            {{ (editingCategory() ? 'common.save' : 'common.create') | translate }}
          </button>
        </div>
      </app-modal>

      <!-- Delete Confirmation Dialog -->
      <app-confirm-dialog
        [isOpen]="showDeleteDialog()"
        [title]="'categories.delete.title' | translate"
        [message]="'categories.delete.message' | translate : { name: deletingCategory()?.name }"
        [confirmLabel]="'common.delete' | translate"
        [cancelLabel]="'common.cancel' | translate"
        variant="danger"
        (confirmed)="deleteCategory()"
        (cancelled)="cancelDelete()"
      ></app-confirm-dialog>
    </div>
  `,
  styles: [`
    .categories-page {
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
      font-size: var(--font-size-2xl);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 4px 0;
    }

    .page-subtitle {
      color: var(--text-secondary);
      margin: 0;
      font-size: var(--font-size-sm);
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

    .category-name-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .category-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: var(--pharma-teal-50);
      color: var(--pharma-teal-600);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .category-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .category-name {
      font-weight: 500;
      color: var(--pharma-teal-900);
    }

    .category-name-local {
      font-size: 0.75rem;
      color: var(--pharma-teal-500);
    }

    .parent-badge {
      display: inline-block;
      padding: 4px 10px;
      background: var(--pharma-teal-50);
      color: var(--pharma-teal-700);
      border-radius: 12px;
      font-size: 0.8rem;
    }

    .no-parent {
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

    .category-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
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

    textarea.form-control {
      resize: vertical;
      min-height: 80px;
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
      .categories-page {
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
export class CategoriesComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);

  // State
  categories = signal<Category[]>([]);
  filteredCategories = signal<Category[]>([]);
  loading = signal(true);
  saving = signal(false);
  showFormModal = signal(false);
  showDeleteDialog = signal(false);
  editingCategory = signal<Category | null>(null);
  deletingCategory = signal<Category | null>(null);

  // Filters
  searchTerm = '';
  showActiveOnly = false;

  // Form
  formData: CategoryFormData = this.getEmptyFormData();

  // Table columns
  @ViewChild('nameTemplate') nameTemplate!: TemplateRef<any>;
  @ViewChild('parentTemplate') parentTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('productsTemplate') productsTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

  columns: TableColumn[] = [];

  ngOnInit(): void {
    this.loadCategories();
    this.setupColumns();
  }

  private setupColumns(): void {
    setTimeout(() => {
      this.columns = [
        { key: 'name', label: 'categories.table.name', sortable: true, template: this.nameTemplate },
        { key: 'parentName', label: 'categories.table.parent', sortable: true, template: this.parentTemplate },
        { key: 'sortOrder', label: 'categories.table.sortOrder', sortable: true, width: '100px' },
        { key: 'productCount', label: 'categories.table.products', sortable: true, template: this.productsTemplate, width: '120px' },
        { key: 'isActive', label: 'categories.table.status', template: this.statusTemplate, width: '120px' },
        { key: 'actions', label: '', template: this.actionsTemplate, width: '100px' }
      ];
    });
  }

  loadCategories(): void {
    this.loading.set(true);
    this.catalogService.getCategories().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.categories.set(response.data);
          this.filterCategories();
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  filterCategories(): void {
    let result = [...this.categories()];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(cat =>
        cat.name.toLowerCase().includes(term) ||
        (cat.nameLocal && cat.nameLocal.toLowerCase().includes(term)) ||
        (cat.description && cat.description.toLowerCase().includes(term))
      );
    }

    if (this.showActiveOnly) {
      result = result.filter(cat => cat.isActive);
    }

    this.filteredCategories.set(result);
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.filterCategories();
  }

  onRowClick(category: Category): void {
    this.editCategory(category);
  }

  openCreateModal(): void {
    this.editingCategory.set(null);
    this.formData = this.getEmptyFormData();
    this.showFormModal.set(true);
  }

  editCategory(category: Category): void {
    this.editingCategory.set(category);
    this.formData = {
      name: category.name,
      nameLocal: category.nameLocal || '',
      description: category.description || '',
      parentId: category.parentId || null,
      sortOrder: category.sortOrder,
      isActive: category.isActive
    };
    this.showFormModal.set(true);
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
    this.editingCategory.set(null);
    this.formData = this.getEmptyFormData();
  }

  getParentOptions(): Category[] {
    const currentId = this.editingCategory()?.id;
    return this.categories().filter(cat => cat.id !== currentId);
  }

  saveCategory(): void {
    if (!this.formData.name || this.saving()) return;

    this.saving.set(true);
    const categoryData: Partial<Category> = {
      name: this.formData.name,
      nameLocal: this.formData.nameLocal || this.formData.name,
      description: this.formData.description,
      parentId: this.formData.parentId || undefined,
      sortOrder: this.formData.sortOrder,
      isActive: this.formData.isActive
    };

    const editing = this.editingCategory();
    const request = editing
      ? this.catalogService.updateCategory(editing.id, categoryData)
      : this.catalogService.createCategory(categoryData);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.loadCategories();
          this.closeFormModal();
        }
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
      }
    });
  }

  confirmDelete(category: Category): void {
    this.deletingCategory.set(category);
    this.showDeleteDialog.set(true);
  }

  cancelDelete(): void {
    this.showDeleteDialog.set(false);
    this.deletingCategory.set(null);
  }

  deleteCategory(): void {
    const category = this.deletingCategory();
    if (!category) return;

    this.catalogService.deleteCategory(category.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadCategories();
        }
        this.cancelDelete();
      },
      error: () => {
        this.cancelDelete();
      }
    });
  }

  private getEmptyFormData(): CategoryFormData {
    return {
      name: '',
      nameLocal: '',
      description: '',
      parentId: null,
      sortOrder: 0,
      isActive: true
    };
  }
}
