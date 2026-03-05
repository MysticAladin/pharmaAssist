import { Component, inject, signal, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TerritoryService } from '../../../core/services/territory.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TerritorySummary, TerritoryFilters, TERRITORY_TYPE_LABELS } from '../../../core/models/territory.model';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-territories-list',
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
  templateUrl: './territories-list.component.html'
})
export class TerritoriesListComponent implements AfterViewInit {
  private readonly territoryService = inject(TerritoryService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  // State
  territories = signal<TerritorySummary[]>([]);
  loading = signal(false);
  totalItems = signal(0);
  typeLabels = TERRITORY_TYPE_LABELS;

  // Filters
  filters = signal<TerritoryFilters>({
    page: 1,
    pageSize: 10,
    activeOnly: true
  });

  // Delete dialog
  showDeleteDialog = signal(false);
  territoryToDelete = signal<TerritorySummary | null>(null);

  // Column config
  columns: TableColumn[] = [];

  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('typeTemplate') typeTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;

  constructor() {
    this.loadTerritories();
  }

  ngAfterViewInit(): void {
    this.setupColumns();
  }

  private setupColumns(): void {
    this.columns = [
      { key: 'name', label: this.translate.instant('territories.name'), sortable: true },
      { key: 'type', label: this.translate.instant('territories.type'), sortable: true, template: this.typeTemplate },
      { key: 'parentTerritoryName', label: this.translate.instant('territories.parent'), sortable: false },
      { key: 'assignedRepCount', label: this.translate.instant('territories.reps'), sortable: false, align: 'center' },
      { key: 'customerCount', label: this.translate.instant('territories.customers'), sortable: false, align: 'center' },
      { key: 'isActive', label: this.translate.instant('common.status'), sortable: false, template: this.statusTemplate },
      { key: 'actions', label: '', sortable: false, template: this.actionsTemplate, align: 'right' }
    ];
  }

  loadTerritories(): void {
    this.loading.set(true);
    this.territoryService.getTerritoriesPaged(this.filters()).subscribe({
      next: (response) => {
        this.territories.set(response.data || []);
        this.totalItems.set(response.totalCount || 0);
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('territories.loadError'));
        this.loading.set(false);
      }
    });
  }

  onSearch(term: string): void {
    this.filters.update(f => ({ ...f, search: term, page: 1 }));
    this.loadTerritories();
  }

  onPageChange(page: number): void {
    this.filters.update(f => ({ ...f, page }));
    this.loadTerritories();
  }

  onSort(event: { column: string; direction: string }): void {
    this.filters.update(f => ({ ...f, sortBy: event.column, sortDirection: event.direction, page: 1 }));
    this.loadTerritories();
  }

  onTypeFilterChange(type: string): void {
    this.filters.update(f => ({ ...f, type: type ? parseInt(type) : undefined, page: 1 }));
    this.loadTerritories();
  }

  viewTerritory(territory: TerritorySummary): void {
    this.router.navigate(['/territories', territory.id]);
  }

  editTerritory(territory: TerritorySummary): void {
    this.router.navigate(['/territories', territory.id, 'edit']);
  }

  confirmDelete(territory: TerritorySummary): void {
    this.territoryToDelete.set(territory);
    this.showDeleteDialog.set(true);
  }

  deleteTerritory(): void {
    const territory = this.territoryToDelete();
    if (!territory) return;

    this.territoryService.deleteTerritory(territory.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success(this.translate.instant('territories.deleteSuccess'));
          this.loadTerritories();
        } else {
          this.notification.error(response.message || this.translate.instant('territories.deleteError'));
        }
        this.showDeleteDialog.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('territories.deleteError'));
        this.showDeleteDialog.set(false);
      }
    });
  }
}
