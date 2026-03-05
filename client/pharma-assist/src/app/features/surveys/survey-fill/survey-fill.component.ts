import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SurveyService } from '../../../core/services/survey.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  SurveyDetail,
  SurveyQuestion,
  QuestionType,
  SubmitSurveyResponseRequest,
  SubmitAnswerRequest,
  QUESTION_TYPE_LABELS
} from '../../../core/models/survey.model';

interface AnswerState {
  questionId: number;
  answerValue: string;
  selectedOptions: string[];
}

@Component({
  selector: 'app-survey-fill',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './survey-fill.component.html'
})
export class SurveyFillComponent {
  private readonly surveyService = inject(SurveyService);
  private readonly notification = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  survey = signal<SurveyDetail | null>(null);
  loading = signal(true);
  submitting = signal(false);
  answers = signal<AnswerState[]>([]);

  respondentRepId = signal<number | null>(null);
  customerId = signal<number | null>(null);
  visitId = signal<number | null>(null);

  QuestionType = QuestionType;

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadSurvey(id);
    }
    // Pre-fill from query params if coming from a visit
    const qp = this.route.snapshot.queryParams;
    if (qp['repId']) this.respondentRepId.set(Number(qp['repId']));
    if (qp['customerId']) this.customerId.set(Number(qp['customerId']));
    if (qp['visitId']) this.visitId.set(Number(qp['visitId']));
  }

  loadSurvey(id: number): void {
    this.loading.set(true);
    this.surveyService.getSurveyById(id).subscribe({
      next: (response) => {
        if (response.data) {
          this.survey.set(response.data);
          this.answers.set(response.data.questions.map(q => ({
            questionId: q.id,
            answerValue: '',
            selectedOptions: []
          })));
        }
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('SURVEYS.LOAD_ERROR'));
        this.loading.set(false);
      }
    });
  }

  updateAnswer(questionIndex: number, value: string): void {
    this.answers.update(ans => {
      const updated = [...ans];
      updated[questionIndex] = { ...updated[questionIndex], answerValue: value };
      return updated;
    });
  }

  toggleOption(questionIndex: number, option: string): void {
    this.answers.update(ans => {
      const updated = [...ans];
      const a = { ...updated[questionIndex] };
      const opts = [...a.selectedOptions];
      const idx = opts.indexOf(option);
      if (idx >= 0) {
        opts.splice(idx, 1);
      } else {
        opts.push(option);
      }
      a.selectedOptions = opts;
      updated[questionIndex] = a;
      return updated;
    });
  }

  selectSingleOption(questionIndex: number, option: string): void {
    this.answers.update(ans => {
      const updated = [...ans];
      updated[questionIndex] = { ...updated[questionIndex], selectedOptions: [option] };
      return updated;
    });
  }

  onSubmit(): void {
    const s = this.survey();
    if (!s) return;
    if (!this.respondentRepId() || !this.customerId()) {
      this.notification.warning(this.translate.instant('SURVEYS.REP_CUSTOMER_REQUIRED'));
      return;
    }

    // Validate required questions
    for (let i = 0; i < s.questions.length; i++) {
      const q = s.questions[i];
      const a = this.answers()[i];
      if (q.isRequired) {
        const hasAnswer = a.answerValue?.trim() || a.selectedOptions.length > 0;
        if (!hasAnswer) {
          this.notification.warning(
            this.translate.instant('SURVEYS.REQUIRED_QUESTION', { question: q.questionText })
          );
          return;
        }
      }
    }

    this.submitting.set(true);
    const request: SubmitSurveyResponseRequest = {
      surveyId: s.id,
      respondentRepId: this.respondentRepId()!,
      customerId: this.customerId()!,
      visitId: this.visitId() || undefined,
      answers: this.answers().map(a => {
        const req: SubmitAnswerRequest = { questionId: a.questionId };
        if (a.answerValue) req.answerValue = a.answerValue;
        if (a.selectedOptions.length > 0) req.selectedOptions = a.selectedOptions;
        return req;
      })
    };

    this.surveyService.submitResponse(request).subscribe({
      next: () => {
        this.notification.success(this.translate.instant('SURVEYS.SUBMIT_SUCCESS'));
        this.submitting.set(false);
        this.router.navigate(['/surveys', s.id]);
      },
      error: () => {
        this.notification.error(this.translate.instant('SURVEYS.SUBMIT_ERROR'));
        this.submitting.set(false);
      }
    });
  }

  isOptionSelected(questionIndex: number, option: string): boolean {
    return this.answers()[questionIndex]?.selectedOptions.includes(option) || false;
  }
}
