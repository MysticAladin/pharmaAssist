import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SurveyService } from '../../../core/services/survey.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  SurveyDetail,
  SurveyStatus,
  SurveyResponse,
  SURVEY_STATUS_LABELS,
  QUESTION_TYPE_LABELS,
  QuestionType,
  UpdateSurveyStatusRequest
} from '../../../core/models/survey.model';
import { StatusBadgeComponent, BadgeVariant } from '../../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-survey-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, StatusBadgeComponent, ConfirmDialogComponent, EmptyStateComponent],
  templateUrl: './survey-detail.component.html'
})
export class SurveyDetailComponent {
  private readonly surveyService = inject(SurveyService);
  private readonly notification = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  survey = signal<SurveyDetail | null>(null);
  responses = signal<SurveyResponse[]>([]);
  loading = signal(true);
  showDeleteDialog = signal(false);
  deleting = signal(false);
  statusUpdating = signal(false);
  responsePage = signal(1);
  responseTotalItems = signal(0);

  SurveyStatus = SurveyStatus;
  SURVEY_STATUS_LABELS = SURVEY_STATUS_LABELS;
  QUESTION_TYPE_LABELS = QUESTION_TYPE_LABELS;

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadSurvey(id);
      this.loadResponses(id);
    }
  }

  loadSurvey(id: number): void {
    this.loading.set(true);
    this.surveyService.getSurveyById(id).subscribe({
      next: (response) => {
        if (response.data) {
          this.survey.set(response.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('SURVEYS.LOAD_ERROR'));
        this.loading.set(false);
      }
    });
  }

  loadResponses(surveyId: number, page: number = 1): void {
    this.surveyService.getResponses(surveyId, page, 10).subscribe({
      next: (response) => {
        this.responses.set(response.data || []);
        this.responseTotalItems.set(response.totalCount || 0);
        this.responsePage.set(page);
      }
    });
  }

  getStatusVariant(status: SurveyStatus): BadgeVariant {
    switch (status) {
      case SurveyStatus.Draft: return 'neutral';
      case SurveyStatus.Active: return 'success';
      case SurveyStatus.Closed: return 'warning';
      case SurveyStatus.Archived: return 'danger';
      default: return 'neutral';
    }
  }

  updateStatus(status: SurveyStatus): void {
    const s = this.survey();
    if (!s) return;
    this.statusUpdating.set(true);
    const request: UpdateSurveyStatusRequest = { status };
    this.surveyService.updateSurveyStatus(s.id, request).subscribe({
      next: () => {
        this.notification.success(this.translate.instant('SURVEYS.STATUS_UPDATED'));
        this.statusUpdating.set(false);
        this.loadSurvey(s.id);
      },
      error: () => {
        this.notification.error(this.translate.instant('SURVEYS.STATUS_UPDATE_ERROR'));
        this.statusUpdating.set(false);
      }
    });
  }

  deleteSurvey(): void {
    const s = this.survey();
    if (!s) return;
    this.deleting.set(true);
    this.surveyService.deleteSurvey(s.id).subscribe({
      next: () => {
        this.notification.success(this.translate.instant('SURVEYS.DELETE_SUCCESS'));
        this.deleting.set(false);
        this.showDeleteDialog.set(false);
        this.router.navigate(['/surveys']);
      },
      error: () => {
        this.notification.error(this.translate.instant('SURVEYS.DELETE_ERROR'));
        this.deleting.set(false);
      }
    });
  }

  exportSurvey(): void {
    const s = this.survey();
    if (!s) return;
    this.surveyService.exportSurvey(s.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `survey-${s.id}-export.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    });
  }

  getQuestionTypeLabel(type: QuestionType): string {
    return QUESTION_TYPE_LABELS[type] || 'Unknown';
  }
}
