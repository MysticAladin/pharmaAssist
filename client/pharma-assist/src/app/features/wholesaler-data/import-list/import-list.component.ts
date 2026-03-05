import { Component, inject, signal, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { WholesalerDataService } from '../../../core/services/wholesaler-data.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  WholesalerDataImport,
  WholesalerImportFilters,
  IMPORT_STATUS_LABELS,
  IMPORT_STATUS_VARIANTS
} from '../../../core/models/wholesaler.model';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-import-list',
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
  templateUrl: './import-list.component.html'
})
export class ImportListComponent implements AfterViewInit {
  private readonly wholesalerService = inject(WholesalerDataService);
  private readonly notification = inject(NotificationService);
  readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  // State
  imports = signal<WholesalerDataImport[]>([]);
  loading = signal(false);
  totalItems = signal(0);
  statusLabels = IMPORT_STATUS_LABELS;
  statusVariants = IMPORT_STATUS_VARIANTS;

  // Filters
  filters = signal<WholesalerImportFilters>({
    page: 1,
    pageSize: 10
  });

  // Delete dialog
  showDeleteDialog = signal(false);
  importToDelete = signal<WholesalerDataImport | null>(null);

  // Column config
  columns: TableColumn[] = [];

  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('matchTemplate') matchTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

  constructor() {
    this.loadImports();
  }

  ngAfterViewInit(): void {
    this.setupColumns();
  }

  private setupColumns(): void {
    this.columns = [
      { key: 'wholesalerName', label: this.translate.instant('wholesalerData.wholesaler'), sortable: true },
      { key: 'fileName', label: this.translate.instant('wholesalerData.fileName'), sortable: false },
      { key: 'importDate', label: this.translate.instant('wholesalerData.importDate'), sortable: true },
      { key: 'period', label: this.translate.instant('wholesalerData.period'), sortable: false },
      { key: 'recordCount', label: this.translate.instant('wholesalerData.records'), sortable: true, align: 'center' },
      { key: 'status', label: this.translate.instant('common.status'), sortable: true, template: this.statusTemplate },
      { key: 'matched', label: this.translate.instant('wholesalerData.matched'), sortable: false, template: this.matchTemplate, align: 'center' },
      { key: 'actions', label: '', sortable: false, template: this.actionsTemplate, align: 'right' }
    ];
  }

  loadImports(): void {
    this.loading.set(true);
    this.wholesalerService.getImports(this.filters()).subscribe({
      next: (response) => {
        this.imports.set(response.data || []);
        this.totalItems.set(response.totalCount || 0);
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('wholesalerData.loadError'));
        this.loading.set(false);
      }
    });
  }

  onPageChange(page: number): void {
    this.filters.update(f => ({ ...f, page }));
    this.loadImports();
  }

  onSort(event: { column: string; direction: string }): void {
    this.filters.update(f => ({ ...f, sortBy: event.column, sortDirection: event.direction, page: 1 }));
    this.loadImports();
  }

  onStatusFilterChange(status: string): void {
    this.filters.update(f => ({ ...f, status: status || undefined, page: 1 }));
    this.loadImports();
  }

  viewImport(imp: WholesalerDataImport): void {
    this.router.navigate(['/wholesaler-data', imp.id]);
  }

  confirmDelete(imp: WholesalerDataImport): void {
    this.importToDelete.set(imp);
    this.showDeleteDialog.set(true);
  }

  deleteImport(): void {
    const imp = this.importToDelete();
    if (!imp) return;

    this.wholesalerService.deleteImport(imp.id).subscribe({
      next: () => {
        this.notification.success(this.translate.instant('wholesalerData.deleteSuccess'));
        this.showDeleteDialog.set(false);
        this.importToDelete.set(null);
        this.loadImports();
      },
      error: () => {
        this.notification.error(this.translate.instant('wholesalerData.deleteError'));
      }
    });
  }

  getMatchPercent(imp: WholesalerDataImport): number {
    const total = imp.matchedProductCount + imp.unmatchedProductCount;
    if (total === 0) return 0;
    return Math.round((imp.matchedProductCount / total) * 100);
  }
}
