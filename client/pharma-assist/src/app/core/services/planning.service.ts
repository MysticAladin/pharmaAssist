import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AnnualPlanSummary,
  AnnualPlanDetail,
  CreateAnnualPlanRequest,
  UpdateAnnualPlanRequest,
  QuarterlyPlanSummary,
  QuarterlyPlanDetail,
  CreateQuarterlyPlanRequest,
  UpdateQuarterlyPlanRequest,
  MonthlyPlanSummary,
  MonthlyPlanDetail,
  CreateMonthlyPlanRequest,
  UpdateMonthlyPlanRequest,
  PlanningHierarchyOverview,
  PendingPlansSummary,
  PlanActionRequest
} from '../models/planning.model';

@Injectable({
  providedIn: 'root'
})
export class PlanningService {
  private readonly http = inject(HttpClient);
  private readonly annualApiUrl = `${environment.apiUrl}/planning/annual`;
  private readonly quarterlyApiUrl = `${environment.apiUrl}/planning/quarterly`;
  private readonly monthlyApiUrl = `${environment.apiUrl}/planning/monthly`;
  private readonly managerApiUrl = `${environment.apiUrl}/manager/planning`;

  // ============ Overview ============

  /**
   * Get planning hierarchy overview for a rep
   */
  getOverview(repId: number): Observable<PlanningHierarchyOverview> {
    return this.http.get<PlanningHierarchyOverview>(`${this.annualApiUrl}/overview`, {
      params: { repId: repId.toString() }
    });
  }

  // ============ Annual Plans ============

  /**
   * Get all annual plans for a rep
   */
  getAnnualPlans(repId: number): Observable<AnnualPlanSummary[]> {
    return this.http.get<AnnualPlanSummary[]>(this.annualApiUrl, {
      params: { repId: repId.toString() }
    });
  }

  /**
   * Get annual plan by id
   */
  getAnnualPlan(id: number): Observable<AnnualPlanDetail> {
    return this.http.get<AnnualPlanDetail>(`${this.annualApiUrl}/${id}`);
  }

  /**
   * Get annual plan for a specific year
   */
  getAnnualPlanByYear(repId: number, year: number): Observable<AnnualPlanDetail> {
    return this.http.get<AnnualPlanDetail>(`${this.annualApiUrl}/year/${year}`, {
      params: { repId: repId.toString() }
    });
  }

  /**
   * Create a new annual plan
   */
  createAnnualPlan(repId: number, dto: CreateAnnualPlanRequest): Observable<AnnualPlanDetail> {
    return this.http.post<AnnualPlanDetail>(this.annualApiUrl, dto, {
      params: { repId: repId.toString() }
    });
  }

  /**
   * Update an annual plan
   */
  updateAnnualPlan(id: number, dto: UpdateAnnualPlanRequest): Observable<AnnualPlanDetail> {
    return this.http.put<AnnualPlanDetail>(`${this.annualApiUrl}/${id}`, dto);
  }

  /**
   * Submit annual plan for approval
   */
  submitAnnualPlan(id: number): Observable<AnnualPlanDetail> {
    return this.http.post<AnnualPlanDetail>(`${this.annualApiUrl}/${id}/submit`, {});
  }

  /**
   * Approve annual plan (manager only)
   */
  approveAnnualPlan(id: number, dto?: PlanActionRequest): Observable<AnnualPlanDetail> {
    return this.http.post<AnnualPlanDetail>(`${this.annualApiUrl}/${id}/approve`, dto || {});
  }

  /**
   * Reject annual plan (manager only)
   */
  rejectAnnualPlan(id: number, dto: PlanActionRequest): Observable<AnnualPlanDetail> {
    return this.http.post<AnnualPlanDetail>(`${this.annualApiUrl}/${id}/reject`, dto);
  }

  /**
   * Delete annual plan (draft only)
   */
  deleteAnnualPlan(id: number): Observable<void> {
    return this.http.delete<void>(`${this.annualApiUrl}/${id}`);
  }

  /**
   * Generate quarterly plans from annual plan
   */
  generateQuarterlyPlans(annualPlanId: number): Observable<QuarterlyPlanDetail[]> {
    return this.http.post<QuarterlyPlanDetail[]>(`${this.annualApiUrl}/${annualPlanId}/generate-quarterly`, {});
  }

  // ============ Quarterly Plans ============

  /**
   * Get all quarterly plans for an annual plan
   */
  getQuarterlyPlans(annualPlanId: number): Observable<QuarterlyPlanSummary[]> {
    return this.http.get<QuarterlyPlanSummary[]>(this.quarterlyApiUrl, {
      params: { annualPlanId: annualPlanId.toString() }
    });
  }

  /**
   * Get quarterly plan by id
   */
  getQuarterlyPlan(id: number): Observable<QuarterlyPlanDetail> {
    return this.http.get<QuarterlyPlanDetail>(`${this.quarterlyApiUrl}/${id}`);
  }

  /**
   * Create a new quarterly plan
   */
  createQuarterlyPlan(repId: number, dto: CreateQuarterlyPlanRequest): Observable<QuarterlyPlanDetail> {
    return this.http.post<QuarterlyPlanDetail>(this.quarterlyApiUrl, dto, {
      params: { repId: repId.toString() }
    });
  }

  /**
   * Update a quarterly plan
   */
  updateQuarterlyPlan(id: number, dto: UpdateQuarterlyPlanRequest): Observable<QuarterlyPlanDetail> {
    return this.http.put<QuarterlyPlanDetail>(`${this.quarterlyApiUrl}/${id}`, dto);
  }

  /**
   * Submit quarterly plan for approval
   */
  submitQuarterlyPlan(id: number): Observable<QuarterlyPlanDetail> {
    return this.http.post<QuarterlyPlanDetail>(`${this.quarterlyApiUrl}/${id}/submit`, {});
  }

  /**
   * Approve quarterly plan (manager only)
   */
  approveQuarterlyPlan(id: number, dto?: PlanActionRequest): Observable<QuarterlyPlanDetail> {
    return this.http.post<QuarterlyPlanDetail>(`${this.quarterlyApiUrl}/${id}/approve`, dto || {});
  }

  /**
   * Reject quarterly plan (manager only)
   */
  rejectQuarterlyPlan(id: number, dto: PlanActionRequest): Observable<QuarterlyPlanDetail> {
    return this.http.post<QuarterlyPlanDetail>(`${this.quarterlyApiUrl}/${id}/reject`, dto);
  }

  /**
   * Delete quarterly plan (draft only)
   */
  deleteQuarterlyPlan(id: number): Observable<void> {
    return this.http.delete<void>(`${this.quarterlyApiUrl}/${id}`);
  }

  /**
   * Generate monthly plans from quarterly plan
   */
  generateMonthlyPlans(quarterlyPlanId: number): Observable<MonthlyPlanDetail[]> {
    return this.http.post<MonthlyPlanDetail[]>(`${this.quarterlyApiUrl}/${quarterlyPlanId}/generate-monthly`, {});
  }

  // ============ Monthly Plans ============

  /**
   * Get all monthly plans for a quarterly plan
   */
  getMonthlyPlans(quarterlyPlanId: number): Observable<MonthlyPlanSummary[]> {
    return this.http.get<MonthlyPlanSummary[]>(this.monthlyApiUrl, {
      params: { quarterlyPlanId: quarterlyPlanId.toString() }
    });
  }

  /**
   * Get monthly plan by id
   */
  getMonthlyPlan(id: number): Observable<MonthlyPlanDetail> {
    return this.http.get<MonthlyPlanDetail>(`${this.monthlyApiUrl}/${id}`);
  }

  /**
   * Create a new monthly plan
   */
  createMonthlyPlan(repId: number, dto: CreateMonthlyPlanRequest): Observable<MonthlyPlanDetail> {
    return this.http.post<MonthlyPlanDetail>(this.monthlyApiUrl, dto, {
      params: { repId: repId.toString() }
    });
  }

  /**
   * Update a monthly plan
   */
  updateMonthlyPlan(id: number, dto: UpdateMonthlyPlanRequest): Observable<MonthlyPlanDetail> {
    return this.http.put<MonthlyPlanDetail>(`${this.monthlyApiUrl}/${id}`, dto);
  }

  /**
   * Submit monthly plan for approval
   */
  submitMonthlyPlan(id: number): Observable<MonthlyPlanDetail> {
    return this.http.post<MonthlyPlanDetail>(`${this.monthlyApiUrl}/${id}/submit`, {});
  }

  /**
   * Approve monthly plan (manager only)
   */
  approveMonthlyPlan(id: number, dto?: PlanActionRequest): Observable<MonthlyPlanDetail> {
    return this.http.post<MonthlyPlanDetail>(`${this.monthlyApiUrl}/${id}/approve`, dto || {});
  }

  /**
   * Reject monthly plan (manager only)
   */
  rejectMonthlyPlan(id: number, dto: PlanActionRequest): Observable<MonthlyPlanDetail> {
    return this.http.post<MonthlyPlanDetail>(`${this.monthlyApiUrl}/${id}/reject`, dto);
  }

  /**
   * Delete monthly plan (draft only)
   */
  deleteMonthlyPlan(id: number): Observable<void> {
    return this.http.delete<void>(`${this.monthlyApiUrl}/${id}`);
  }

  /**
   * Link a weekly plan to a monthly plan
   */
  linkWeeklyPlan(monthlyPlanId: number, weeklyPlanId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.monthlyApiUrl}/${monthlyPlanId}/link-weekly/${weeklyPlanId}`,
      {}
    );
  }

  // ============ Manager Endpoints ============

  /**
   * Get all pending plans for the manager's team
   */
  getPendingPlansSummary(): Observable<PendingPlansSummary> {
    return this.http.get<PendingPlansSummary>(`${this.managerApiUrl}/pending-summary`);
  }

  /**
   * Get pending annual plans for manager's team
   */
  getTeamPendingAnnualPlans(): Observable<AnnualPlanSummary[]> {
    return this.http.get<AnnualPlanSummary[]>(`${this.managerApiUrl}/annual/pending`);
  }

  /**
   * Get pending quarterly plans for manager's team
   */
  getTeamPendingQuarterlyPlans(): Observable<QuarterlyPlanSummary[]> {
    return this.http.get<QuarterlyPlanSummary[]>(`${this.managerApiUrl}/quarterly/pending`);
  }

  /**
   * Get pending monthly plans for manager's team
   */
  getTeamPendingMonthlyPlans(): Observable<MonthlyPlanSummary[]> {
    return this.http.get<MonthlyPlanSummary[]>(`${this.managerApiUrl}/monthly/pending`);
  }
}
