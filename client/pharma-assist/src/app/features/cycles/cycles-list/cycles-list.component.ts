import { Component, inject, signal, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CycleService } from '../../../core/services/cycle.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CycleSummary, CycleFilters, CYCLE_STATUS_LABELS } from '../../../core/models/cycle.model';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-cycles-list',
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
  templateUrl: './cycles-list.component.html'
})
export class CyclesListComponent implements AfterViewInit {
  private readonly cycleService = inject(CycleService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  // State
  cycles = signal<CycleSummary[]>([]);
  loading = signal(false);
  totalItems = signal(0);
  statusLabels = CYCLE_STATUS_LABELS;

  // Filters
  filters = signal<CycleFilters>({
    page: 1,
    pageSize: 10,
    activeOnly: true
  });

  // Delete dialog
  showDeleteDialog = signal(false);
  cycleToDelete = signal<CycleSummary | null>(null);

  // Column config
  columns: TableColumn[] = [];

  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('progressTemplate') progressTemplate!: TemplateRef<any>;

  constructor() {
    this.loadCycles();
  }

  ngAfterViewInit(): void {
    this.setupColumns();
  }

  private setupColumns(): void {
    this.columns = [
      { key: 'name', label: this.translate.instant('cycles.name'), sortable: true },
      { key: 'startDate', label: this.translate.instant('cycles.startDate'), sortable: true },
      { key: 'endDate', label: this.translate.instant('cycles.endDate'), sortable: true },
      { key: 'status', label: this.translate.instant('common.status'), sortable: true, template: this.statusTemplate },
      { key: 'completionPercentage', label: this.translate.instant('cycles.progress'), sortable: false, template: this.progressTemplate },
      { key: 'campaignCount', label: this.translate.instant('cycles.campaigns'), sortable: false, align: 'center' },
      { key: 'actions', label: '', sortable: false, template: this.actionsTemplate, align: 'right' }
    ];
  }

  loadCycles(): void {
    this.loading.set(true);
    this.cycleService.getCyclesPaged(this.filters()).subscribe({
      next: (response) => {
        this.cycles.set(response.data || []);
        this.totalItems.set(response.totalCount || 0);
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('cycles.loadError'));
        this.loading.set(false);
      }
    });
  }

  onSearch(term: string): void {
    this.filters.update(f => ({ ...f, search: term, page: 1 }));
    this.loadCycles();
  }

  onStatusFilter(status: string): void {
    this.filters.update(f => ({
      ...f,
      status: status ? Number(status) : undefined,
      page: 1
    }));
    this.loadCycles();
  }

  onActiveFilter(value: string): void {
    this.filters.update(f => ({
      ...f,
      activeOnly: value === '' ? undefined : value === 'true',
      page: 1
    }));
    this.loadCycles();
  }

  onSort(event: { column: string; direction: string }): void {
    this.filters.update(f => ({ ...f, sortBy: event.column, sortDirection: event.direction }));
    this.loadCycles();
  }

  onPageChange(page: number): void {
    this.filters.update(f => ({ ...f, page }));
    this.loadCycles();
  }

  onRowClick(cycle: CycleSummary): void {
    this.router.navigate(['/cycles', cycle.id]);
  }

  createCycle(): void {
    this.router.navigate(['/cycles', 'new']);
  }

  editCycle(cycle: CycleSummary): void {
    this.router.navigate(['/cycles', cycle.id, 'edit']);
  }

  confirmDelete(cycle: CycleSummary): void {
    this.cycleToDelete.set(cycle);
    this.showDeleteDialog.set(true);
  }

  onDeleteConfirmed(): void {
    const cycle = this.cycleToDelete();
    if (!cycle) return;

    this.cycleService.deleteCycle(cycle.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success(this.translate.instant('cycles.deleted'));
          this.loadCycles();
        } else {
          this.notification.error(response.message || this.translate.instant('cycles.deleteError'));
        }
        this.showDeleteDialog.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('cycles.deleteError'));
        this.showDeleteDialog.set(false);
      }
    });
  }

  activateCycle(cycle: CycleSummary): void {
    this.cycleService.activateCycle(cycle.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success(this.translate.instant('cycles.activated'));
          this.loadCycles();
        }
      }
    });
  }

  completeCycle(cycle: CycleSummary): void {
    this.cycleService.completeCycle(cycle.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success(this.translate.instant('cycles.completed'));
          this.loadCycles();
        }
      }
    });
  }
}
