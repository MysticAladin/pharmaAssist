import { Component, inject, signal, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { SurveyService } from '../../../core/services/survey.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Survey, SurveyStatus, SURVEY_STATUS_LABELS, SurveyFilters } from '../../../core/models/survey.model';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { PaginationComponent, PageEvent } from '../../../shared/components/pagination/pagination.component';
import { StatusBadgeComponent, BadgeVariant } from '../../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-survey-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    FormsModule,
    DataTableComponent,
    PaginationComponent,
    StatusBadgeComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './survey-list.component.html'
})
export class SurveyListComponent implements AfterViewInit {
  private readonly surveyService = inject(SurveyService);
  private readonly notification = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  @ViewChild('statusTpl') statusTpl!: TemplateRef<unknown>;
  @ViewChild('datesTpl') datesTpl!: TemplateRef<unknown>;
  @ViewChild('actionsTpl') actionsTpl!: TemplateRef<unknown>;

  surveys = signal<Survey[]>([]);
  columns = signal<TableColumn[]>([]);
  loading = signal(false);
  page = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);

  filters = signal<SurveyFilters>({ page: 1, pageSize: 10 });

  showDeleteDialog = signal(false);
  deleteLoading = signal(false);
  selectedSurvey = signal<Survey | null>(null);

  statusOptions = [
    { value: SurveyStatus.Draft, label: 'SURVEYS.STATUS.DRAFT' },
    { value: SurveyStatus.Active, label: 'SURVEYS.STATUS.ACTIVE' },
    { value: SurveyStatus.Closed, label: 'SURVEYS.STATUS.CLOSED' },
    { value: SurveyStatus.Archived, label: 'SURVEYS.STATUS.ARCHIVED' }
  ];

  ngAfterViewInit(): void {
    this.columns.set([
      { key: 'title', label: this.translate.instant('SURVEYS.TITLE'), sortable: true },
      { key: 'status', label: this.translate.instant('SURVEYS.STATUS_LABEL'), template: this.statusTpl },
      { key: 'questionCount', label: this.translate.instant('SURVEYS.QUESTIONS'), sortable: true, align: 'right' },
      { key: 'responseCount', label: this.translate.instant('SURVEYS.RESPONSES'), sortable: true, align: 'right' },
      { key: 'startsAt', label: this.translate.instant('SURVEYS.DATES'), template: this.datesTpl },
      { key: 'actions', label: this.translate.instant('common.actions'), template: this.actionsTpl, align: 'center' }
    ]);
    this.loadSurveys();
  }

  loadSurveys(): void {
    this.loading.set(true);
    const f: SurveyFilters = {
      ...this.filters(),
      page: this.page(),
      pageSize: this.pageSize()
    };
    this.surveyService.getSurveys(f).subscribe({
      next: (response) => {
        this.surveys.set(response.data);
        this.totalItems.set(response.totalCount);
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('SURVEYS.LOAD_ERROR'));
        this.loading.set(false);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.page);
    this.pageSize.set(event.pageSize);
    this.loadSurveys();
  }

  onSearch(value: string): void {
    this.filters.update(f => ({ ...f, search: value || undefined }));
    this.page.set(1);
    this.loadSurveys();
  }

  onStatusFilter(value: string): void {
    this.filters.update(f => ({ ...f, status: value !== '' ? Number(value) as SurveyStatus : undefined }));
    this.page.set(1);
    this.loadSurveys();
  }

  onRowClick(row: Survey): void {
    this.router.navigate(['/surveys', row.id]);
  }

  openDeleteDialog(survey: Survey): void {
    this.selectedSurvey.set(survey);
    this.showDeleteDialog.set(true);
  }

  confirmDelete(): void {
    const s = this.selectedSurvey();
    if (!s) return;

    this.deleteLoading.set(true);
    this.surveyService.deleteSurvey(s.id).subscribe({
      next: () => {
        this.notification.success(this.translate.instant('SURVEYS.DELETE_SUCCESS'));
        this.showDeleteDialog.set(false);
        this.deleteLoading.set(false);
        this.loadSurveys();
      },
      error: () => {
        this.notification.error(this.translate.instant('SURVEYS.DELETE_ERROR'));
        this.deleteLoading.set(false);
      }
    });
  }

  getStatusVariant(status: SurveyStatus): BadgeVariant {
    switch (status) {
      case SurveyStatus.Draft: return 'neutral';
      case SurveyStatus.Active: return 'success';
      case SurveyStatus.Closed: return 'warning';
      case SurveyStatus.Archived: return 'info';
      default: return 'neutral';
    }
  }

  getStatusLabel(status: SurveyStatus): string {
    return SURVEY_STATUS_LABELS[status] || 'Unknown';
  }
}
