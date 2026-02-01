import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { VisitPlanStatus } from '../models/visit.model';

export interface TeamVisitPlan {
  id: number;
  repId: number;
  repName: string;
  planWeek: string;
  status: VisitPlanStatus;
  statusName: string;
  plannedVisitsCount: number;
  executedVisitsCount: number;
  submittedAt: string | null;
  approvedAt: string | null;
}

export interface TeamPlannedVisit {
  id: number;
  planId: number;
  customerId: number;
  customerName: string;
  customerCity: string | null;
  plannedDate: string;
  plannedTime: string | null;
  estimatedDurationMinutes: number;
  visitObjective: string | null;
  productsToPresent: string | null;
  notes: string | null;
  sequenceNumber: number;
  hasExecutedVisit: boolean;
  executedVisitId: number | null;
}

export interface TeamVisitPlanDetail {
  id: number;
  repId: number;
  repName: string;
  planWeek: string;
  status: VisitPlanStatus;
  statusName: string;
  submittedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  approvalComments: string | null;
  plannedVisits: TeamPlannedVisit[];
}

@Injectable({
  providedIn: 'root'
})
export class ManagerVisitPlanService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/manager/visit-plans`;

  /**
   * Get pending visit plans from team members
   */
  getPendingPlans(): Observable<TeamVisitPlan[]> {
    return this.http.get<TeamVisitPlan[]>(`${this.apiUrl}/pending`);
  }

  /**
   * Get all visit plans from team with optional filters
   */
  getTeamPlans(fromWeek?: Date, status?: number): Observable<TeamVisitPlan[]> {
    const params: Record<string, string> = {};
    if (fromWeek) {
      params['fromWeek'] = fromWeek.toISOString();
    }
    if (status !== undefined && status !== null) {
      params['status'] = status.toString();
    }
    return this.http.get<TeamVisitPlan[]>(this.apiUrl, { params });
  }

  /**
   * Get a specific plan for review
   */
  getPlan(id: number): Observable<TeamVisitPlanDetail> {
    return this.http.get<TeamVisitPlanDetail>(`${this.apiUrl}/${id}`);
  }

  /**
   * Approve a visit plan
   */
  approvePlan(id: number, comments?: string): Observable<TeamVisitPlanDetail> {
    return this.http.post<TeamVisitPlanDetail>(`${this.apiUrl}/${id}/approve`, { comments });
  }

  /**
   * Reject a visit plan
   */
  rejectPlan(id: number, reason: string): Observable<TeamVisitPlanDetail> {
    return this.http.post<TeamVisitPlanDetail>(`${this.apiUrl}/${id}/reject`, { reason });
  }

  /**
   * Format week display
   */
  formatWeek(planWeek: string): string {
    const monday = new Date(planWeek);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${monday.toLocaleDateString(undefined, options)} - ${friday.toLocaleDateString(undefined, options)}`;
  }
}
