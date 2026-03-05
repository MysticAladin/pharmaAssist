import { Component, inject, signal, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MaterialDistributionService } from '../../../core/services/material-distribution.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  MaterialDistribution,
  DistributionFilters,
  MaterialType,
  MATERIAL_TYPE_LABELS
} from '../../../core/models/material.model';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { PaginationComponent, PageEvent } from '../../../shared/components/pagination/pagination.component';
import { StatusBadgeComponent, BadgeVariant } from '../../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-distribution-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink, TranslateModule,
    DataTableComponent, PaginationComponent, StatusBadgeComponent, ConfirmDialogComponent, EmptyStateComponent
  ],
  templateUrl: './distribution-list.component.html'
})
export class DistributionListComponent implements AfterViewInit {
  private readonly materialService = inject(MaterialDistributionService);
  private readonly notification = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  @ViewChild('typeTemplate') typeTemplate!: TemplateRef<any>;
  @ViewChild('dateTemplate') dateTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

  distributions = signal<MaterialDistribution[]>([]);
  loading = signal(true);
  columns: TableColumn[] = [];

  page = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);
  search = signal('');
  materialTypeFilter = signal<MaterialType | null>(null);
  fromDate = signal('');
  toDate = signal('');

  showDeleteDialog = signal(false);
  deleteTarget = signal<MaterialDistribution | null>(null);
  deleting = signal(false);

  materialTypes = Object.entries(MATERIAL_TYPE_LABELS).map(([key, label]) => ({
    value: Number(key) as MaterialType,
    label
  }));

  MATERIAL_TYPE_LABELS = MATERIAL_TYPE_LABELS;

  ngAfterViewInit(): void {
    this.columns = [
      { key: 'materialName', label: this.translate.instant('MATERIALS.NAME'), sortable: true },
      { key: 'materialType', label: this.translate.instant('MATERIALS.TYPE'), template: this.typeTemplate },
      { key: 'repName', label: this.translate.instant('MATERIALS.REP'), sortable: true },
      { key: 'customerName', label: this.translate.instant('MATERIALS.CUSTOMER'), sortable: true },
      { key: 'quantity', label: this.translate.instant('MATERIALS.QUANTITY'), sortable: true },
      { key: 'distributedAt', label: this.translate.instant('MATERIALS.DISTRIBUTED_AT'), template: this.dateTemplate, sortable: true },
      { key: 'actions', label: '', template: this.actionsTemplate }
    ];
    this.loadDistributions();
  }

  loadDistributions(): void {
    this.loading.set(true);
    const filters: DistributionFilters = {
      page: this.page(),
      pageSize: this.pageSize(),
      search: this.search() || undefined,
      materialType: this.materialTypeFilter() ?? undefined,
      from: this.fromDate() || undefined,
      to: this.toDate() || undefined
    };
    this.materialService.getDistributions(filters).subscribe({
      next: (response) => {
        this.distributions.set(response.data || []);
        this.totalItems.set(response.totalCount || 0);
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('MATERIALS.LOAD_ERROR'));
        this.loading.set(false);
      }
    });
  }

  onSearch(): void {
    this.page.set(1);
    this.loadDistributions();
  }

  onFilterChange(): void {
    this.page.set(1);
    this.loadDistributions();
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.page);
    this.pageSize.set(event.pageSize);
    this.loadDistributions();
  }

  getTypeVariant(type: MaterialType): BadgeVariant {
    switch (type) {
      case MaterialType.Sample: return 'primary';
      case MaterialType.Brochure: return 'info';
      case MaterialType.Gift: return 'success';
      case MaterialType.Equipment: return 'warning';
      default: return 'neutral';
    }
  }

  getTypeLabel(type: MaterialType): string {
    return MATERIAL_TYPE_LABELS[type] || 'MATERIALS.TYPE.OTHER';
  }

  confirmDelete(item: MaterialDistribution): void {
    this.deleteTarget.set(item);
    this.showDeleteDialog.set(true);
  }

  deleteDistribution(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.deleting.set(true);
    this.materialService.deleteDistribution(target.id).subscribe({
      next: () => {
        this.notification.success(this.translate.instant('MATERIALS.DELETE_SUCCESS'));
        this.deleting.set(false);
        this.showDeleteDialog.set(false);
        this.loadDistributions();
      },
      error: () => {
        this.notification.error(this.translate.instant('MATERIALS.DELETE_ERROR'));
        this.deleting.set(false);
      }
    });
  }

  exportDistributions(): void {
    this.materialService.exportDistributions(
      this.fromDate() || undefined,
      this.toDate() || undefined
    ).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'material-distributions.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      }
    });
  }
}
