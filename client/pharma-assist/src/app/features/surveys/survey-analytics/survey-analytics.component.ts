import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SurveyService } from '../../../core/services/survey.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  SurveyAnalytics,
  QuestionAnalytics,
  QuestionType,
  QUESTION_TYPE_LABELS
} from '../../../core/models/survey.model';

@Component({
  selector: 'app-survey-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './survey-analytics.component.html'
})
export class SurveyAnalyticsComponent {
  private readonly surveyService = inject(SurveyService);
  private readonly notification = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);

  analytics = signal<SurveyAnalytics | null>(null);
  loading = signal(true);
  surveyId = signal(0);

  QuestionType = QuestionType;
  QUESTION_TYPE_LABELS = QUESTION_TYPE_LABELS;

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.surveyId.set(id);
      this.loadAnalytics(id);
    }
  }

  loadAnalytics(id: number): void {
    this.loading.set(true);
    this.surveyService.getAnalytics(id).subscribe({
      next: (response) => {
        if (response.data) {
          this.analytics.set(response.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('SURVEYS.ANALYTICS_ERROR'));
        this.loading.set(false);
      }
    });
  }

  getMaxDistribution(dist: { [key: string]: number }): number {
    const vals = Object.values(dist);
    return vals.length > 0 ? Math.max(...vals) : 1;
  }

  getDistributionEntries(dist: { [key: string]: number }): { key: string; value: number }[] {
    return Object.entries(dist).map(([key, value]) => ({ key, value }));
  }

  getPercentage(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }
}
