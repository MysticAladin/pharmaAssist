// Survey interfaces matching backend DTOs

export enum SurveyStatus {
  Draft = 0,
  Active = 1,
  Closed = 2,
  Archived = 3
}

export enum QuestionType {
  Text = 1,
  SingleChoice = 2,
  MultiChoice = 3,
  Rating = 4,
  Number = 5,
  YesNo = 6
}

export interface Survey {
  id: number;
  title: string;
  titleLocal?: string;
  description?: string;
  cycleId?: number;
  cycleName?: string;
  status: SurveyStatus;
  statusName: string;
  isAnonymous: boolean;
  startsAt?: string;
  expiresAt?: string;
  questionCount: number;
  responseCount: number;
  createdAt: string;
}

export interface SurveyDetail extends Survey {
  questions: SurveyQuestion[];
}

export interface SurveyQuestion {
  id: number;
  surveyId: number;
  questionType: QuestionType;
  questionTypeName: string;
  questionText: string;
  questionTextLocal?: string;
  options?: string[];
  isRequired: boolean;
  sortOrder: number;
}

export interface CreateSurveyRequest {
  title: string;
  titleLocal?: string;
  description?: string;
  cycleId?: number;
  isAnonymous: boolean;
  startsAt?: string;
  expiresAt?: string;
  questions: CreateSurveyQuestionRequest[];
}

export interface UpdateSurveyRequest extends CreateSurveyRequest {
  id: number;
}

export interface CreateSurveyQuestionRequest {
  questionType: QuestionType;
  questionText: string;
  questionTextLocal?: string;
  options?: string[];
  isRequired: boolean;
  sortOrder: number;
}

export interface UpdateSurveyStatusRequest {
  status: SurveyStatus;
}

// ───── Survey Response ─────

export interface SurveyResponse {
  id: number;
  surveyId: number;
  surveyTitle: string;
  respondentRepId: number;
  repName: string;
  customerId: number;
  customerName: string;
  visitId?: number;
  completedAt: string;
  answers: SurveyAnswer[];
}

export interface SurveyAnswer {
  id: number;
  questionId: number;
  questionText: string;
  questionType: QuestionType;
  answerValue?: string;
  selectedOptions?: string[];
}

export interface SubmitSurveyResponseRequest {
  surveyId: number;
  respondentRepId: number;
  customerId: number;
  visitId?: number;
  answers: SubmitAnswerRequest[];
}

export interface SubmitAnswerRequest {
  questionId: number;
  answerValue?: string;
  selectedOptions?: string[];
}

// ───── Survey Analytics ─────

export interface SurveyAnalytics {
  surveyId: number;
  surveyTitle: string;
  totalResponses: number;
  questionAnalytics: QuestionAnalytics[];
}

export interface QuestionAnalytics {
  questionId: number;
  questionText: string;
  questionType: QuestionType;
  answerCount: number;
  averageRating?: number;
  optionDistribution: { [key: string]: number };
  textResponses: string[];
}

// ───── Filters ─────

export interface SurveyFilters {
  page: number;
  pageSize: number;
  search?: string;
  status?: SurveyStatus;
  cycleId?: number;
  sortBy?: string;
  sortDirection?: string;
}

export const SURVEY_STATUS_LABELS: Record<SurveyStatus, string> = {
  [SurveyStatus.Draft]: 'SURVEYS.STATUS.DRAFT',
  [SurveyStatus.Active]: 'SURVEYS.STATUS.ACTIVE',
  [SurveyStatus.Closed]: 'SURVEYS.STATUS.CLOSED',
  [SurveyStatus.Archived]: 'SURVEYS.STATUS.ARCHIVED'
};

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  [QuestionType.Text]: 'SURVEYS.QUESTION_TYPE.TEXT',
  [QuestionType.SingleChoice]: 'SURVEYS.QUESTION_TYPE.SINGLE_CHOICE',
  [QuestionType.MultiChoice]: 'SURVEYS.QUESTION_TYPE.MULTI_CHOICE',
  [QuestionType.Rating]: 'SURVEYS.QUESTION_TYPE.RATING',
  [QuestionType.Number]: 'SURVEYS.QUESTION_TYPE.NUMBER',
  [QuestionType.YesNo]: 'SURVEYS.QUESTION_TYPE.YES_NO'
};
