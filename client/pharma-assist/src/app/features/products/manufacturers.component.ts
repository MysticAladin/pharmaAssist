import { Component, OnInit, AfterViewInit, inject, signal, ViewChild, TemplateRef } from '@angular/core';
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
  templateUrl: './manufacturers-component/manufacturers.component.html',
  styleUrls: ['./manufacturers-component/manufacturers.component.scss']
})
export class ManufacturersComponent implements OnInit, AfterViewInit {
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
  }

  ngAfterViewInit(): void {
    this.setupColumns();
  }

  private setupColumns(): void {
    this.columns = [
      { key: 'name', label: 'manufacturers.table.name', sortable: true, template: this.nameTemplate },
      { key: 'country', label: 'manufacturers.table.country', sortable: true, template: this.countryTemplate },
      { key: 'contact', label: 'manufacturers.table.contact', template: this.contactTemplate },
      { key: 'website', label: 'manufacturers.table.website', template: this.websiteTemplate },
      { key: 'productCount', label: 'manufacturers.table.products', sortable: true, template: this.productsTemplate, width: '100px' },
      { key: 'isActive', label: 'manufacturers.table.status', template: this.statusTemplate, width: '100px' },
      { key: 'actions', label: '', template: this.actionsTemplate, width: '100px' }
    ];
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
