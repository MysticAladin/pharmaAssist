import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResponse } from '../models/product.model';
import {
  Survey,
  SurveyDetail,
  CreateSurveyRequest,
  UpdateSurveyRequest,
  UpdateSurveyStatusRequest,
  CreateSurveyQuestionRequest,
  SurveyResponse,
  SubmitSurveyResponseRequest,
  SurveyAnalytics,
  SurveyFilters,
  SurveyQuestion
} from '../models/survey.model';

@Injectable({
  providedIn: 'root'
})
export class SurveyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/surveys`;

  // ── Survey CRUD ──

  getSurveys(filters: SurveyFilters): Observable<PagedResponse<Survey>> {
    let params = new HttpParams()
      .set('page', filters.page.toString())
      .set('pageSize', filters.pageSize.toString());
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status !== undefined && filters.status !== null) params = params.set('status', filters.status.toString());
    if (filters.cycleId) params = params.set('cycleId', filters.cycleId.toString());
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortDirection) params = params.set('sortDirection', filters.sortDirection);
    return this.http.get<PagedResponse<Survey>>(this.baseUrl, { params });
  }

  getSurveyById(id: number): Observable<ApiResponse<SurveyDetail>> {
    return this.http.get<ApiResponse<SurveyDetail>>(`${this.baseUrl}/${id}`);
  }

  createSurvey(request: CreateSurveyRequest): Observable<ApiResponse<Survey>> {
    return this.http.post<ApiResponse<Survey>>(this.baseUrl, request);
  }

  updateSurvey(id: number, request: UpdateSurveyRequest): Observable<ApiResponse<Survey>> {
    return this.http.put<ApiResponse<Survey>>(`${this.baseUrl}/${id}`, request);
  }

  deleteSurvey(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/${id}`);
  }

  updateSurveyStatus(id: number, request: UpdateSurveyStatusRequest): Observable<ApiResponse<boolean>> {
    return this.http.patch<ApiResponse<boolean>>(`${this.baseUrl}/${id}/status`, request);
  }

  // ── Questions ──

  addQuestion(surveyId: number, request: CreateSurveyQuestionRequest): Observable<ApiResponse<SurveyQuestion>> {
    return this.http.post<ApiResponse<SurveyQuestion>>(`${this.baseUrl}/${surveyId}/questions`, request);
  }

  updateQuestion(surveyId: number, questionId: number, request: CreateSurveyQuestionRequest): Observable<ApiResponse<SurveyQuestion>> {
    return this.http.put<ApiResponse<SurveyQuestion>>(`${this.baseUrl}/${surveyId}/questions/${questionId}`, request);
  }

  deleteQuestion(surveyId: number, questionId: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/${surveyId}/questions/${questionId}`);
  }

  reorderQuestions(surveyId: number, questionIds: number[]): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.baseUrl}/${surveyId}/questions/reorder`, questionIds);
  }

  // ── Responses ──

  submitResponse(request: SubmitSurveyResponseRequest): Observable<ApiResponse<SurveyResponse>> {
    return this.http.post<ApiResponse<SurveyResponse>>(`${this.baseUrl}/responses`, request);
  }

  getResponses(surveyId: number, page: number = 1, pageSize: number = 10): Observable<PagedResponse<SurveyResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<PagedResponse<SurveyResponse>>(`${this.baseUrl}/${surveyId}/responses`, { params });
  }

  getResponseById(responseId: number): Observable<ApiResponse<SurveyResponse>> {
    return this.http.get<ApiResponse<SurveyResponse>>(`${this.baseUrl}/responses/${responseId}`);
  }

  // ── Analytics & Export ──

  getAnalytics(surveyId: number): Observable<ApiResponse<SurveyAnalytics>> {
    return this.http.get<ApiResponse<SurveyAnalytics>>(`${this.baseUrl}/${surveyId}/analytics`);
  }

  exportSurvey(surveyId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${surveyId}/export`, {
      responseType: 'blob'
    });
  }
}
