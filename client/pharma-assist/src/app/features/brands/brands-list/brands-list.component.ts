import { Component, inject, signal, computed, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BrandService } from '../../../core/services/brand.service';
import { ManufacturerService } from '../../../core/services/manufacturer.service';
import { NotificationService } from '../../../core/services/notification.service';
import { BrandSummary, BrandFilters } from '../../../core/models/brand.model';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-brands-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslateModule,
    DataTableComponent,
    PaginationComponent,
    SearchInputComponent,
    EmptyStateComponent,
    ConfirmDialogComponent,
    StatusBadgeComponent
  ],
  templateUrl: './brands-list.component.html'
})
export class BrandsListComponent implements AfterViewInit {
  private readonly brandService = inject(BrandService);
  private readonly manufacturerService = inject(ManufacturerService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  // State
  brands = signal<BrandSummary[]>([]);
  loading = signal(false);
  totalItems = signal(0);
  manufacturers = signal<{ id: number; name: string }[]>([]);

  // Filters
  filters = signal<BrandFilters>({
    page: 1,
    pageSize: 10,
    activeOnly: true
  });

  // Delete dialog
  showDeleteDialog = signal(false);
  brandToDelete = signal<BrandSummary | null>(null);

  // Column config
  columns: TableColumn[] = [];

  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('nameTemplate') nameTemplate!: TemplateRef<any>;

  constructor() {
    this.loadBrands();
    this.loadManufacturers();
  }

  ngAfterViewInit(): void {
    this.setupColumns();
  }

  private setupColumns(): void {
    this.columns = [
      { key: 'name', label: this.translate.instant('brands.name'), sortable: true, template: this.nameTemplate },
      { key: 'manufacturerName', label: this.translate.instant('brands.manufacturer'), sortable: true },
      { key: 'therapeuticArea', label: this.translate.instant('brands.therapeuticArea'), sortable: true },
      { key: 'productCount', label: this.translate.instant('brands.products'), sortable: true, align: 'center' },
      { key: 'isActive', label: this.translate.instant('common.status'), sortable: false, template: this.statusTemplate },
      { key: 'actions', label: '', sortable: false, template: this.actionsTemplate, align: 'right' }
    ];
  }

  loadBrands(): void {
    this.loading.set(true);
    this.brandService.getPaged(this.filters()).subscribe({
      next: (response) => {
        this.brands.set(response.data || []);
        this.totalItems.set(response.totalCount || 0);
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('brands.loadError'));
        this.loading.set(false);
      }
    });
  }

  private loadManufacturers(): void {
    this.manufacturerService.getAll().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.manufacturers.set(response.data.map(m => ({ id: m.id, name: m.name })));
        }
      }
    });
  }

  onSearch(term: string): void {
    this.filters.update(f => ({ ...f, search: term, page: 1 }));
    this.loadBrands();
  }

  onManufacturerFilter(manufacturerId: string): void {
    this.filters.update(f => ({
      ...f,
      manufacturerId: manufacturerId ? Number(manufacturerId) : undefined,
      page: 1
    }));
    this.loadBrands();
  }

  onActiveFilter(value: string): void {
    this.filters.update(f => ({
      ...f,
      activeOnly: value === '' ? undefined : value === 'true',
      page: 1
    }));
    this.loadBrands();
  }

  onSort(event: { column: string; direction: string }): void {
    this.filters.update(f => ({ ...f, sortBy: event.column, sortDirection: event.direction }));
    this.loadBrands();
  }

  onPageChange(page: number): void {
    this.filters.update(f => ({ ...f, page }));
    this.loadBrands();
  }

  onRowClick(brand: BrandSummary): void {
    this.router.navigate(['/brands', brand.id]);
  }

  createBrand(): void {
    this.router.navigate(['/brands', 'new']);
  }

  editBrand(brand: BrandSummary, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/brands', brand.id, 'edit']);
  }

  confirmDelete(brand: BrandSummary, event: Event): void {
    event.stopPropagation();
    this.brandToDelete.set(brand);
    this.showDeleteDialog.set(true);
  }

  deleteBrand(): void {
    const brand = this.brandToDelete();
    if (!brand) return;

    this.brandService.delete(brand.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success(this.translate.instant('brands.deleted'));
          this.loadBrands();
        } else {
          this.notification.error(response.message || this.translate.instant('brands.deleteError'));
        }
      },
      error: () => this.notification.error(this.translate.instant('brands.deleteError'))
    });
    this.showDeleteDialog.set(false);
    this.brandToDelete.set(null);
  }

  toggleStatus(brand: BrandSummary, event: Event): void {
    event.stopPropagation();
    const action = brand.isActive
      ? this.brandService.deactivate(brand.id)
      : this.brandService.activate(brand.id);

    action.subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success(
            brand.isActive
              ? this.translate.instant('brands.deactivated')
              : this.translate.instant('brands.activated')
          );
          this.loadBrands();
        }
      },
      error: () => this.notification.error(this.translate.instant('common.error'))
    });
  }
}
