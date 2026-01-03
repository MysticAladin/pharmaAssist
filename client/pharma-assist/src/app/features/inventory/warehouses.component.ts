import { AfterViewInit, Component, OnInit, TemplateRef, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { InventoryService } from '../../core/services/inventory.service';
import { LocationService, City } from '../../core/services/location.service';
import { NotificationService } from '../../core/services/notification.service';
import { Warehouse, CreateWarehouseRequest, UpdateWarehouseRequest } from '../../core/models/inventory.model';

import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { SearchInputComponent } from '../../shared/components/search-input/search-input.component';
import { ModalComponent } from '../../shared/components/modal';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

type WarehouseFormData = {
  id?: number;
  name: string;
  code: string;
  cityId: number | null;
  address: string;
  contactPhone: string;
  isActive: boolean;
  isDefault: boolean;
  isManufacturing: boolean;
  canFulfillOrders: boolean;
};

@Component({
  selector: 'app-warehouses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslateModule,
    DataTableComponent,
    EmptyStateComponent,
    SearchInputComponent,
    ModalComponent,
    ConfirmDialogComponent,
    StatusBadgeComponent
  ],
  templateUrl: './warehouses-component/warehouses.component.html',
  styleUrls: ['./warehouses-component/warehouses.component.scss']
})
export class WarehousesComponent implements OnInit, AfterViewInit {
  private readonly inventoryService = inject(InventoryService);
  private readonly locationService = inject(LocationService);
  private readonly notificationService = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  warehouses = signal<Warehouse[]>([]);
  filteredWarehouses = signal<Warehouse[]>([]);
  cities = signal<City[]>([]);
  loading = signal(true);

  searchTerm = '';

  showFormModal = signal(false);
  editingWarehouse = signal<Warehouse | null>(null);

  showDeleteConfirm = signal(false);
  deleteLoading = signal(false);
  deletingWarehouse = signal<Warehouse | null>(null);

  formData: WarehouseFormData = this.getEmptyFormData();

  @ViewChild('nameTemplate') nameTemplate!: TemplateRef<any>;
  @ViewChild('flagsTemplate') flagsTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

  columns: TableColumn[] = [];

  canSave = computed(() => {
    return !!this.formData.name.trim() &&
      !!this.formData.code.trim() &&
      !!this.formData.address.trim() &&
      this.formData.cityId != null;
  });

  ngOnInit(): void {
    this.loadCities();
    this.loadWarehouses();
  }

  ngAfterViewInit(): void {
    this.columns = [
      { key: 'name', label: 'inventory.warehouses.table.name', sortable: true, template: this.nameTemplate },
      { key: 'code', label: 'inventory.warehouses.table.code', sortable: true, width: '140px' },
      { key: 'flags', label: 'inventory.warehouses.table.flags', template: this.flagsTemplate, width: '220px' },
      { key: 'isActive', label: 'inventory.warehouses.table.status', template: this.statusTemplate, width: '120px' },
      { key: 'actions', label: '', template: this.actionsTemplate, width: '140px' }
    ];
  }

  loadCities(): void {
    this.locationService.getAllCities().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.cities.set(res.data);
        }
      },
      error: () => {
        // Cities are needed for create/edit; keep empty and let user retry via refresh.
      }
    });
  }

  loadWarehouses(): void {
    this.loading.set(true);
    this.inventoryService.getWarehouses(false).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.warehouses.set(res.data);
          this.applyFilter();
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.error(this.translate.instant('inventory.warehouses.loadError'));
      }
    });
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.applyFilter();
  }

  applyFilter(): void {
    let result = [...this.warehouses()];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(w =>
        w.name.toLowerCase().includes(term) ||
        w.code.toLowerCase().includes(term) ||
        (w.cityName?.toLowerCase().includes(term) ?? false)
      );
    }

    this.filteredWarehouses.set(result);
  }

  openCreateModal(): void {
    this.editingWarehouse.set(null);
    this.formData = this.getEmptyFormData();
    this.showFormModal.set(true);
  }

  openEditModal(warehouse: Warehouse): void {
    this.editingWarehouse.set(warehouse);
    this.formData = {
      id: warehouse.id,
      name: warehouse.name,
      code: warehouse.code,
      cityId: warehouse.cityId ?? null,
      address: warehouse.address ?? '',
      contactPhone: warehouse.contactPhone ?? '',
      isActive: warehouse.isActive,
      isDefault: warehouse.isDefault ?? false,
      isManufacturing: warehouse.isManufacturing ?? false,
      canFulfillOrders: warehouse.canFulfillOrders ?? false
    };
    this.showFormModal.set(true);
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
    this.editingWarehouse.set(null);
    this.formData = this.getEmptyFormData();
  }

  onManufacturingChange(): void {
    if (this.formData.isManufacturing) {
      this.formData.canFulfillOrders = false;
    }
  }

  saveWarehouse(): void {
    if (!this.canSave()) {
      this.notificationService.error(this.translate.instant('common.fillRequiredFields'));
      return;
    }

    const cityId = this.formData.cityId as number;

    if (this.editingWarehouse()) {
      const dto: UpdateWarehouseRequest = {
        name: this.formData.name.trim(),
        cityId,
        address: this.formData.address.trim(),
        contactPhone: this.formData.contactPhone.trim() || undefined,
        isActive: this.formData.isActive,
        isDefault: this.formData.isDefault,
        isManufacturing: this.formData.isManufacturing,
        canFulfillOrders: this.formData.canFulfillOrders
      };

      this.inventoryService.updateWarehouse(this.formData.id!, dto).subscribe({
        next: (res) => {
          if (res.success) {
            this.notificationService.success(this.translate.instant('inventory.warehouses.saved'));
            this.closeFormModal();
            this.loadWarehouses();
          } else {
            this.notificationService.error(res.message || this.translate.instant('common.saveFailed'));
          }
        },
        error: (err) => {
          const msg = err?.error?.message || this.translate.instant('common.saveFailed');
          this.notificationService.error(msg);
        }
      });

      return;
    }

    const dto: CreateWarehouseRequest = {
      name: this.formData.name.trim(),
      code: this.formData.code.trim(),
      cityId,
      address: this.formData.address.trim(),
      contactPhone: this.formData.contactPhone.trim() || undefined,
      isDefault: this.formData.isDefault,
      isManufacturing: this.formData.isManufacturing,
      canFulfillOrders: this.formData.canFulfillOrders
    };

    this.inventoryService.createWarehouse(dto).subscribe({
      next: (res) => {
        if (res.success) {
          this.notificationService.success(this.translate.instant('inventory.warehouses.created'));
          this.closeFormModal();
          this.loadWarehouses();
        } else {
          this.notificationService.error(res.message || this.translate.instant('common.saveFailed'));
        }
      },
      error: (err) => {
        const msg = err?.error?.message || this.translate.instant('common.saveFailed');
        this.notificationService.error(msg);
      }
    });
  }

  setDefault(warehouse: Warehouse): void {
    this.inventoryService.setDefaultWarehouse(warehouse.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.notificationService.success(this.translate.instant('inventory.warehouses.defaultUpdated'));
          this.loadWarehouses();
        } else {
          this.notificationService.error(res.message || this.translate.instant('common.saveFailed'));
        }
      },
      error: () => {
        this.notificationService.error(this.translate.instant('common.saveFailed'));
      }
    });
  }

  confirmDelete(warehouse: Warehouse): void {
    this.deletingWarehouse.set(warehouse);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.deletingWarehouse.set(null);
    this.deleteLoading.set(false);
  }

  deleteWarehouse(): void {
    const warehouse = this.deletingWarehouse();
    if (!warehouse) return;

    this.deleteLoading.set(true);
    this.inventoryService.deleteWarehouse(warehouse.id).subscribe({
      next: (res) => {
        this.deleteLoading.set(false);
        if (res.success) {
          this.notificationService.success(this.translate.instant('inventory.warehouses.deleted'));
          this.cancelDelete();
          this.loadWarehouses();
        } else {
          this.notificationService.error(res.message || this.translate.instant('common.deleteFailed'));
        }
      },
      error: (err) => {
        this.deleteLoading.set(false);
        const msg = err?.error?.message || this.translate.instant('common.deleteFailed');
        this.notificationService.error(msg);
      }
    });
  }

  private getEmptyFormData(): WarehouseFormData {
    return {
      name: '',
      code: '',
      cityId: null,
      address: '',
      contactPhone: '',
      isActive: true,
      isDefault: false,
      isManufacturing: false,
      canFulfillOrders: false
    };
  }
}
