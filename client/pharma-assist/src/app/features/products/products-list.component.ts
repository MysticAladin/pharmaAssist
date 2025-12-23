import { Component, OnInit, inject, signal, TemplateRef, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { trigger, transition, style, animate } from '@angular/animations';

import { ProductService } from '../../core/services/product.service';
import { CatalogService } from '../../core/services/catalog.service';
import { ExportService, ExportColumn } from '../../core/services/export.service';
import { ProductSummary, ProductFilters } from '../../core/models/product.model';
import { Category, Manufacturer } from '../../core/models/catalog.model';

import { DataTableComponent, TableColumn, SortEvent } from '../../shared/components/data-table';
import { SearchInputComponent } from '../../shared/components/search-input';
import { PaginationComponent, PageEvent } from '../../shared/components/pagination';
import { EmptyStateComponent } from '../../shared/components/empty-state';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    DataTableComponent,
    SearchInputComponent,
    PaginationComponent,
    EmptyStateComponent,
    ConfirmDialogComponent
  ],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ height: 0, opacity: 0, overflow: 'hidden' }),
        animate('200ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ height: '*', opacity: 1, overflow: 'hidden' }),
        animate('200ms ease-in', style({ height: 0, opacity: 0 }))
      ])
    ])
  ],
  templateUrl: './products-list-component/products-list.component.html',
  styleUrls: ['./products-list-component/products-list.component.scss']
})
export class ProductsListComponent implements OnInit {
  @ViewChild('actionsTemplate', { static: true }) actionsTemplate!: TemplateRef<any>;

  private readonly productService = inject(ProductService);
  private readonly catalogService = inject(CatalogService);
  private readonly exportService = inject(ExportService);
  private readonly translateService = inject(TranslateService);
  private readonly router = inject(Router);

  // Signals
  products = signal<ProductSummary[]>([]);
  categories = signal<Category[]>([]);
  manufacturers = signal<Manufacturer[]>([]);
  loading = signal(false);
  totalItems = signal(0);
  showExportMenu = signal(false);
  filters = signal<ProductFilters>({
    page: 1,
    pageSize: 10,
    activeOnly: true,
    stockStatus: undefined,
    sortBy: 'name',
    sortDirection: 'asc'
  });

  // Bulk selection
  selectedProducts = signal<Set<number>>(new Set());
  showBulkActions = signal(false);
  showBulkExportDropdown = signal(false);
  bulkActionLoading = signal(false);
  showBulkDeleteDialog = signal(false);
  showBulkPriceDialog = signal(false);
  bulkPriceAction = signal<'increase' | 'decrease' | 'set'>('increase');
  bulkPriceValue = signal<number>(0);
  bulkPriceType = signal<'percentage' | 'fixed'>('percentage');

  // Computed for bulk selection
  allSelected = computed(() => {
    const products = this.products();
    const selected = this.selectedProducts();
    return products.length > 0 && products.every(p => selected.has(p.id));
  });

  someSelected = computed(() => {
    const products = this.products();
    const selected = this.selectedProducts();
    const selectedCount = products.filter(p => selected.has(p.id)).length;
    return selectedCount > 0 && selectedCount < products.length;
  });

  selectedCount = computed(() => this.selectedProducts().size);

  // Advanced filters
  showAdvancedFilters = signal(false);

  // Computed signals for filter values
  prescriptionFilterValue = computed(() => {
    const val = this.filters().requiresPrescription;
    if (val === true) return 'yes';
    if (val === false) return 'no';
    return 'all';
  });

  barcodeFilterValue = computed(() => {
    const val = this.filters().hasBarcode;
    if (val === true) return 'yes';
    if (val === false) return 'no';
    return 'all';
  });

  // Count of active advanced filters
  activeFilterCount = computed(() => {
    const f = this.filters();
    let count = 0;
    if (f.minPrice !== undefined && f.minPrice !== null) count++;
    if (f.maxPrice !== undefined && f.maxPrice !== null) count++;
    if (f.stockStatus && f.stockStatus !== 'all') count++;
    if (f.requiresPrescription !== undefined && f.requiresPrescription !== null) count++;
    if (f.hasBarcode !== undefined && f.hasBarcode !== null) count++;
    if (f.expiryStatus && f.expiryStatus !== 'all') count++;
    if (f.sortBy && f.sortBy !== 'name') count++;
    return count;
  });

  // Delete dialog
  showDeleteDialog = signal(false);
  productToDelete = signal<ProductSummary | null>(null);
  deleting = signal(false);

  // Table columns
  columns: TableColumn[] = [
    { key: 'name', label: 'products.columns.name', sortable: true },
    { key: 'categoryName', label: 'products.columns.category', sortable: true },
    { key: 'manufacturerName', label: 'products.columns.manufacturer', sortable: true },
    { key: 'dosageForm', label: 'products.columns.form', sortable: true },
    { key: 'packageSize', label: 'products.columns.packageSize', sortable: true },
    { key: 'unitPrice', label: 'products.columns.price', sortable: true, align: 'right' },
    { key: 'stockQuantity', label: 'products.columns.stock', sortable: true, align: 'center' }
  ];

  ngOnInit(): void {
    this.loadCategories();
    this.loadManufacturers();
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.productService.getPaged(this.filters()).subscribe({
      next: (response) => {
        this.products.set(response.data || []);
        this.totalItems.set(response.totalCount || 0);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.loading.set(false);
      }
    });
  }

  loadCategories(): void {
    this.catalogService.getCategories().subscribe({
      next: (response) => {
        // Handle both wrapped response {success, data} and direct array
        if (Array.isArray(response)) {
          this.categories.set(response);
        } else if (response.success && response.data) {
          this.categories.set(response.data);
        } else if (response.data) {
          this.categories.set(response.data);
        }
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadManufacturers(): void {
    this.catalogService.getManufacturers().subscribe({
      next: (response) => {
        // Handle both wrapped response {success, data} and direct array
        if (Array.isArray(response)) {
          this.manufacturers.set(response);
        } else if (response.success && response.data) {
          this.manufacturers.set(response.data);
        } else if (response.data) {
          this.manufacturers.set(response.data);
        }
      },
      error: (error) => {
        console.error('Error loading manufacturers:', error);
      }
    });
  }

  onSearch(term: string): void {
    this.filters.update(f => ({ ...f, search: term || undefined, page: 1 }));
    this.loadProducts();
  }

  onCategoryChange(categoryId: string): void {
    this.filters.update(f => ({ ...f, categoryId: categoryId ? +categoryId : undefined, page: 1 }));
    this.loadProducts();
  }

  onManufacturerChange(manufacturerId: string): void {
    this.filters.update(f => ({ ...f, manufacturerId: manufacturerId ? +manufacturerId : undefined, page: 1 }));
    this.loadProducts();
  }

  onActiveOnlyChange(activeOnly: boolean): void {
    this.filters.update(f => ({ ...f, activeOnly, page: 1 }));
    this.loadProducts();
  }

  onPageChange(event: PageEvent): void {
    this.filters.update(f => ({ ...f, page: event.page, pageSize: event.pageSize }));
    this.loadProducts();
  }

  createProduct(): void {
    this.router.navigate(['/products/new']);
  }

  viewProduct(product: ProductSummary, event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(['/products', product.id]);
  }

  editProduct(product: ProductSummary, event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(['/products', product.id, 'edit']);
  }

  confirmDelete(product: ProductSummary, event?: Event): void {
    event?.stopPropagation();
    this.productToDelete.set(product);
    this.showDeleteDialog.set(true);
  }

  deleteProduct(): void {
    const product = this.productToDelete();
    if (!product) return;

    this.deleting.set(true);
    this.productService.delete(product.id).subscribe({
      next: () => {
        this.showDeleteDialog.set(false);
        this.productToDelete.set(null);
        this.deleting.set(false);
        this.loadProducts();
      },
      error: (error) => {
        console.error('Error deleting product:', error);
        this.deleting.set(false);
      }
    });
  }

  // Advanced filter methods
  toggleAdvancedFilters(): void {
    this.showAdvancedFilters.update(v => !v);
  }

  onMinPriceChange(value: number | null): void {
    this.filters.update(f => ({ ...f, minPrice: value ?? undefined }));
  }

  onMaxPriceChange(value: number | null): void {
    this.filters.update(f => ({ ...f, maxPrice: value ?? undefined }));
  }

  onStockStatusChange(status: 'all' | 'inStock' | 'lowStock' | 'outOfStock'): void {
    this.filters.update(f => ({
      ...f,
      stockStatus: status === 'all' ? undefined : status
    }));
  }

  onPrescriptionChange(value: 'all' | 'yes' | 'no'): void {
    let prescriptionValue: boolean | null = null;
    if (value === 'yes') prescriptionValue = true;
    else if (value === 'no') prescriptionValue = false;
    this.filters.update(f => ({ ...f, requiresPrescription: prescriptionValue ?? undefined }));
  }

  onBarcodeChange(value: 'all' | 'yes' | 'no'): void {
    let barcodeValue: boolean | null = null;
    if (value === 'yes') barcodeValue = true;
    else if (value === 'no') barcodeValue = false;
    this.filters.update(f => ({ ...f, hasBarcode: barcodeValue ?? undefined }));
  }

  onExpiryStatusChange(status: 'all' | 'expiringSoon' | 'expired' | 'valid'): void {
    this.filters.update(f => ({
      ...f,
      expiryStatus: status === 'all' ? undefined : status
    }));
  }

  onSortByChange(sortBy: string): void {
    this.filters.update(f => ({ ...f, sortBy }));
  }

  toggleSortDirection(): void {
    this.filters.update(f => ({
      ...f,
      sortDirection: f.sortDirection === 'desc' ? 'asc' : 'desc'
    }));
  }

  onTableSort(event: SortEvent): void {
    this.filters.update(f => ({
      ...f,
      sortBy: event.column,
      sortDirection: event.direction,
      page: 1
    }));
    this.loadProducts();
  }

  clearAdvancedFilters(): void {
    this.filters.update(f => ({
      ...f,
      minPrice: undefined,
      maxPrice: undefined,
      stockStatus: undefined,
      requiresPrescription: undefined,
      hasBarcode: undefined,
      expiryStatus: undefined,
      sortBy: undefined,
      sortDirection: undefined,
      page: 1
    }));
    this.loadProducts();
  }

  applyFilters(): void {
    this.filters.update(f => ({ ...f, page: 1 }));
    this.loadProducts();
  }

  // Export functionality
  toggleExportMenu(): void {
    this.showExportMenu.update(v => !v);
  }

  private getExportColumns(): ExportColumn<ProductSummary>[] {
    return [
      { key: 'name', header: this.translateService.instant('products.columns.name') },
      { key: 'sku', header: 'SKU' },
      { key: 'categoryName', header: this.translateService.instant('products.columns.category') },
      { key: 'manufacturerName', header: this.translateService.instant('products.columns.manufacturer') },
      {
        key: 'unitPrice',
        header: this.translateService.instant('products.columns.price'),
        format: (value) => value?.toFixed(2) + ' BAM' || ''
      },
      { key: 'stockQuantity', header: this.translateService.instant('products.columns.stock') },
      {
        key: 'requiresPrescription',
        header: this.translateService.instant('products.form.requiresPrescription'),
        format: (value) => value ? this.translateService.instant('common.yes') : this.translateService.instant('common.no')
      },
      {
        key: 'isActive',
        header: this.translateService.instant('products.columns.status'),
        format: (value) => value ? this.translateService.instant('products.status.active') : this.translateService.instant('products.status.inactive')
      }
    ];
  }

  exportToCSV(): void {
    this.showExportMenu.set(false);
    this.exportService.exportToCSV(
      this.products(),
      this.getExportColumns(),
      { filename: `products-${new Date().toISOString().split('T')[0]}` }
    );
  }

  exportToExcel(): void {
    this.showExportMenu.set(false);
    this.exportService.exportToExcel(
      this.products(),
      this.getExportColumns(),
      { filename: `products-${new Date().toISOString().split('T')[0]}` }
    );
  }

  exportToPDF(): void {
    this.showExportMenu.set(false);
    this.exportService.exportToPDF(
      this.products(),
      this.getExportColumns(),
      {
        filename: `products-${new Date().toISOString().split('T')[0]}`,
        title: this.translateService.instant('products.title'),
        subtitle: this.translateService.instant('products.subtitle')
      }
    );
  }

  // ========== BULK OPERATIONS ==========

  toggleSelectAll(): void {
    const products = this.products();

    if (this.allSelected()) {
      // Deselect all
      this.selectedProducts.set(new Set());
    } else {
      // Select all on current page
      this.selectedProducts.set(new Set(products.map(p => p.id)));
    }
  }

  toggleProductSelection(productId: number): void {
    const selected = new Set(this.selectedProducts());
    if (selected.has(productId)) {
      selected.delete(productId);
    } else {
      selected.add(productId);
    }
    this.selectedProducts.set(selected);
  }

  isProductSelected(productId: number): boolean {
    return this.selectedProducts().has(productId);
  }

  clearSelection(): void {
    this.selectedProducts.set(new Set());
  }

  toggleBulkExportDropdown(): void {
    this.showBulkExportDropdown.update(v => !v);
  }

  // Bulk Delete
  openBulkDeleteDialog(): void {
    if (this.selectedCount() > 0) {
      this.showBulkDeleteDialog.set(true);
    }
  }

  closeBulkDeleteDialog(): void {
    this.showBulkDeleteDialog.set(false);
  }

  async confirmBulkDelete(): Promise<void> {
    this.bulkActionLoading.set(true);
    const selectedIds = Array.from(this.selectedProducts());

    try {
      // Delete each selected product
      for (const id of selectedIds) {
        await this.productService.delete(id).toPromise();
      }

      // Refresh and clear selection
      this.loadProducts();
      this.clearSelection();
      this.showBulkDeleteDialog.set(false);
    } catch (error) {
      console.error('Bulk delete failed:', error);
    } finally {
      this.bulkActionLoading.set(false);
    }
  }

  // Bulk Status Toggle
  async bulkToggleStatus(activate: boolean): Promise<void> {
    this.bulkActionLoading.set(true);
    const selectedIds = Array.from(this.selectedProducts());

    try {
      for (const id of selectedIds) {
        if (activate) {
          await this.productService.activate(id).toPromise();
        } else {
          await this.productService.deactivate(id).toPromise();
        }
      }

      this.loadProducts();
      this.clearSelection();
    } catch (error) {
      console.error('Bulk status update failed:', error);
    } finally {
      this.bulkActionLoading.set(false);
    }
  }

  // Bulk Price Update
  openBulkPriceDialog(): void {
    if (this.selectedCount() > 0) {
      this.bulkPriceAction.set('increase');
      this.bulkPriceValue.set(0);
      this.bulkPriceType.set('percentage');
      this.showBulkPriceDialog.set(true);
    }
  }

  closeBulkPriceDialog(): void {
    this.showBulkPriceDialog.set(false);
  }

  async confirmBulkPriceUpdate(): Promise<void> {
    this.bulkActionLoading.set(true);
    const selectedIds = Array.from(this.selectedProducts());
    const action = this.bulkPriceAction();
    const value = this.bulkPriceValue();
    const type = this.bulkPriceType();

    try {
      for (const id of selectedIds) {
        const product = this.products().find(p => p.id === id);
        if (!product) continue;

        let newPrice = product.unitPrice;

        if (action === 'set') {
          newPrice = value;
        } else if (type === 'percentage') {
          const change = product.unitPrice * (value / 100);
          newPrice = action === 'increase'
            ? product.unitPrice + change
            : product.unitPrice - change;
        } else {
          newPrice = action === 'increase'
            ? product.unitPrice + value
            : product.unitPrice - value;
        }

        // Ensure price doesn't go negative
        newPrice = Math.max(0, Math.round(newPrice * 100) / 100);

        await this.productService.partialUpdate(id, { unitPrice: newPrice }).toPromise();
      }

      this.loadProducts();
      this.clearSelection();
      this.showBulkPriceDialog.set(false);
    } catch (error) {
      console.error('Bulk price update failed:', error);
    } finally {
      this.bulkActionLoading.set(false);
    }
  }

  // Export selected products
  exportSelected(format: 'csv' | 'excel' | 'pdf'): void {
    this.showBulkExportDropdown.set(false);
    const selectedProducts = this.products().filter(p => this.selectedProducts().has(p.id));
    const columns = this.getExportColumns();
    const filename = `products-selected-${new Date().toISOString().split('T')[0]}`;

    switch (format) {
      case 'csv':
        this.exportService.exportToCSV(selectedProducts, columns, { filename });
        break;
      case 'excel':
        this.exportService.exportToExcel(selectedProducts, columns, { filename });
        break;
      case 'pdf':
        this.exportService.exportToPDF(selectedProducts, columns, {
          filename,
          title: this.translateService.instant('products.title'),
          subtitle: `${selectedProducts.length} selected products`
        });
        break;
    }
  }
}

