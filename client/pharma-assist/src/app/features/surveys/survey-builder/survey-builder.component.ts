import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SurveyService } from '../../../core/services/survey.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  SurveyDetail,
  CreateSurveyRequest,
  CreateSurveyQuestionRequest,
  QuestionType,
  QUESTION_TYPE_LABELS
} from '../../../core/models/survey.model';

@Component({
  selector: 'app-survey-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './survey-builder.component.html'
})
export class SurveyBuilderComponent {
  private readonly surveyService = inject(SurveyService);
  private readonly notification = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  surveyId = signal<number | null>(null);
  loading = signal(false);
  saving = signal(false);

  title = signal('');
  titleLocal = signal('');
  description = signal('');
  cycleId = signal<number | null>(null);
  isAnonymous = signal(false);
  startsAt = signal('');
  expiresAt = signal('');

  questions = signal<EditableQuestion[]>([]);

  questionTypes = Object.entries(QUESTION_TYPE_LABELS).map(([key, label]) => ({
    value: Number(key) as QuestionType,
    label
  }));

  QuestionType = QuestionType;

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.surveyId.set(Number(id));
      this.loadSurvey(Number(id));
    }
  }

  loadSurvey(id: number): void {
    this.loading.set(true);
    this.surveyService.getSurveyById(id).subscribe({
      next: (response) => {
        if (response.data) {
          const s = response.data;
          this.title.set(s.title);
          this.titleLocal.set(s.titleLocal || '');
          this.description.set(s.description || '');
          this.cycleId.set(s.cycleId || null);
          this.isAnonymous.set(s.isAnonymous);
          this.startsAt.set(s.startsAt ? s.startsAt.substring(0, 10) : '');
          this.expiresAt.set(s.expiresAt ? s.expiresAt.substring(0, 10) : '');
          this.questions.set(s.questions.map(q => ({
            questionType: q.questionType,
            questionText: q.questionText,
            questionTextLocal: q.questionTextLocal || '',
            options: q.options || [],
            isRequired: q.isRequired,
            sortOrder: q.sortOrder,
            newOption: ''
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

  addQuestion(): void {
    this.questions.update(qs => [...qs, {
      questionType: QuestionType.Text,
      questionText: '',
      questionTextLocal: '',
      options: [],
      isRequired: true,
      sortOrder: qs.length + 1,
      newOption: ''
    }]);
  }

  removeQuestion(index: number): void {
    this.questions.update(qs => {
      const updated = qs.filter((_, i) => i !== index);
      return updated.map((q, i) => ({ ...q, sortOrder: i + 1 }));
    });
  }

  moveQuestion(index: number, direction: 'up' | 'down'): void {
    this.questions.update(qs => {
      const arr = [...qs];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= arr.length) return arr;
      [arr[index], arr[swapIndex]] = [arr[swapIndex], arr[index]];
      return arr.map((q, i) => ({ ...q, sortOrder: i + 1 }));
    });
  }

  addOption(questionIndex: number): void {
    this.questions.update(qs => {
      const updated = [...qs];
      const q = { ...updated[questionIndex] };
      if (q.newOption && q.newOption.trim()) {
        q.options = [...q.options, q.newOption.trim()];
        q.newOption = '';
      }
      updated[questionIndex] = q;
      return updated;
    });
  }

  removeOption(questionIndex: number, optionIndex: number): void {
    this.questions.update(qs => {
      const updated = [...qs];
      const q = { ...updated[questionIndex] };
      q.options = q.options.filter((_, i) => i !== optionIndex);
      updated[questionIndex] = q;
      return updated;
    });
  }

  needsOptions(type: QuestionType): boolean {
    return type === QuestionType.SingleChoice || type === QuestionType.MultiChoice;
  }

  updateQuestionField(index: number, field: keyof EditableQuestion, value: any): void {
    this.questions.update(qs => {
      const updated = [...qs];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  onSave(): void {
    if (!this.title()) {
      this.notification.warning(this.translate.instant('SURVEYS.TITLE_REQUIRED'));
      return;
    }

    this.saving.set(true);
    const request: CreateSurveyRequest = {
      title: this.title(),
      titleLocal: this.titleLocal() || undefined,
      description: this.description() || undefined,
      cycleId: this.cycleId() || undefined,
      isAnonymous: this.isAnonymous(),
      startsAt: this.startsAt() || undefined,
      expiresAt: this.expiresAt() || undefined,
      questions: this.questions().map((q, i) => ({
        questionType: q.questionType,
        questionText: q.questionText,
        questionTextLocal: q.questionTextLocal || undefined,
        options: q.options.length > 0 ? q.options : undefined,
        isRequired: q.isRequired,
        sortOrder: i + 1
      } as CreateSurveyQuestionRequest))
    };

    const obs = this.surveyId()
      ? this.surveyService.updateSurvey(this.surveyId()!, { ...request, id: this.surveyId()! })
      : this.surveyService.createSurvey(request);

    obs.subscribe({
      next: (response) => {
        this.notification.success(this.translate.instant(
          this.surveyId() ? 'SURVEYS.UPDATE_SUCCESS' : 'SURVEYS.CREATE_SUCCESS'
        ));
        this.saving.set(false);
        const id = this.surveyId() || response.data?.id;
        if (id) {
          this.router.navigate(['/surveys', id]);
        } else {
          this.router.navigate(['/surveys']);
        }
      },
      error: () => {
        this.notification.error(this.translate.instant('SURVEYS.SAVE_ERROR'));
        this.saving.set(false);
      }
    });
  }
}

interface EditableQuestion {
  questionType: QuestionType;
  questionText: string;
  questionTextLocal: string;
  options: string[];
  isRequired: boolean;
  sortOrder: number;
  newOption: string;
}
