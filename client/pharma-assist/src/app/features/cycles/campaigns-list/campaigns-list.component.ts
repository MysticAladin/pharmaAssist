import { Component, inject, signal, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CycleService } from '../../../core/services/cycle.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CampaignSummary, CampaignFilters, CAMPAIGN_STATUS_LABELS, CAMPAIGN_TYPE_LABELS } from '../../../core/models/cycle.model';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-campaigns-list',
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
  templateUrl: './campaigns-list.component.html'
})
export class CampaignsListComponent implements AfterViewInit {
  private readonly cycleService = inject(CycleService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  // State
  campaigns = signal<CampaignSummary[]>([]);
  loading = signal(false);
  totalItems = signal(0);
  statusLabels = CAMPAIGN_STATUS_LABELS;
  typeLabels = CAMPAIGN_TYPE_LABELS;

  // Filters
  filters = signal<CampaignFilters>({
    page: 1,
    pageSize: 10
  });

  // Delete dialog
  showDeleteDialog = signal(false);
  campaignToDelete = signal<CampaignSummary | null>(null);

  // Column config
  columns: TableColumn[] = [];

  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('typeTemplate') typeTemplate!: TemplateRef<any>;
  @ViewChild('budgetTemplate') budgetTemplate!: TemplateRef<any>;

  constructor() {
    this.loadCampaigns();
  }

  ngAfterViewInit(): void {
    this.setupColumns();
  }

  private setupColumns(): void {
    this.columns = [
      { key: 'name', label: this.translate.instant('campaigns.name'), sortable: true },
      { key: 'type', label: this.translate.instant('campaigns.type'), sortable: true, template: this.typeTemplate },
      { key: 'cycleName', label: this.translate.instant('campaigns.cycle'), sortable: true },
      { key: 'startDate', label: this.translate.instant('campaigns.startDate'), sortable: true },
      { key: 'endDate', label: this.translate.instant('campaigns.endDate'), sortable: true },
      { key: 'status', label: this.translate.instant('common.status'), sortable: true, template: this.statusTemplate },
      { key: 'plannedBudget', label: this.translate.instant('campaigns.budget'), sortable: false, template: this.budgetTemplate, align: 'right' },
      { key: 'actions', label: '', sortable: false, template: this.actionsTemplate, align: 'right' }
    ];
  }

  loadCampaigns(): void {
    this.loading.set(true);
    this.cycleService.getCampaignsPaged(this.filters()).subscribe({
      next: (response) => {
        this.campaigns.set(response.data || []);
        this.totalItems.set(response.totalCount || 0);
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('campaigns.loadError'));
        this.loading.set(false);
      }
    });
  }

  onSearch(term: string): void {
    this.filters.update(f => ({ ...f, search: term, page: 1 }));
    this.loadCampaigns();
  }

  onTypeFilter(type: string): void {
    this.filters.update(f => ({
      ...f,
      type: type ? Number(type) : undefined,
      page: 1
    }));
    this.loadCampaigns();
  }

  onStatusFilter(status: string): void {
    this.filters.update(f => ({
      ...f,
      status: status ? Number(status) : undefined,
      page: 1
    }));
    this.loadCampaigns();
  }

  onSort(event: { column: string; direction: string }): void {
    this.filters.update(f => ({ ...f, sortBy: event.column, sortDirection: event.direction }));
    this.loadCampaigns();
  }

  onPageChange(page: number): void {
    this.filters.update(f => ({ ...f, page }));
    this.loadCampaigns();
  }

  onRowClick(campaign: CampaignSummary): void {
    this.router.navigate(['/cycles', 'campaigns', campaign.id]);
  }

  createCampaign(): void {
    this.router.navigate(['/cycles', 'campaigns', 'new']);
  }

  editCampaign(campaign: CampaignSummary): void {
    this.router.navigate(['/cycles', 'campaigns', campaign.id, 'edit']);
  }

  confirmDelete(campaign: CampaignSummary): void {
    this.campaignToDelete.set(campaign);
    this.showDeleteDialog.set(true);
  }

  onDeleteConfirmed(): void {
    const campaign = this.campaignToDelete();
    if (!campaign) return;

    this.cycleService.deleteCampaign(campaign.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success(this.translate.instant('campaigns.deleted'));
          this.loadCampaigns();
        } else {
          this.notification.error(response.message || this.translate.instant('campaigns.deleteError'));
        }
        this.showDeleteDialog.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('campaigns.deleteError'));
        this.showDeleteDialog.set(false);
      }
    });
  }

  activateCampaign(campaign: CampaignSummary): void {
    this.cycleService.activateCampaign(campaign.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success(this.translate.instant('campaigns.activated'));
          this.loadCampaigns();
        }
      }
    });
  }

  completeCampaign(campaign: CampaignSummary): void {
    this.cycleService.completeCampaign(campaign.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success(this.translate.instant('campaigns.completed'));
          this.loadCampaigns();
        }
      }
    });
  }
}
