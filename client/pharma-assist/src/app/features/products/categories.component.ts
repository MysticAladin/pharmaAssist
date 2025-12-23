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
  templateUrl: './categories-component/categories.component.html',
  styleUrls: ['./categories-component/categories.component.scss']
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
