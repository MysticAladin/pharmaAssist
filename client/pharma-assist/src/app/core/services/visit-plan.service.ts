import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  VisitPlanSummary,
  VisitPlanDetail,
  PlannedVisit,
  CreatePlannedVisitRequest,
  UpdatePlannedVisitRequest
} from '../models/visit.model';

@Injectable({
  providedIn: 'root'
})
export class VisitPlanService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/visit-plans`;

  /**
   * Get all visit plans for the current rep
   */
  getPlans(fromWeek?: Date): Observable<VisitPlanSummary[]> {
    const params: Record<string, string> = {};
    if (fromWeek) {
      params['fromWeek'] = fromWeek.toISOString();
    }
    return this.http.get<VisitPlanSummary[]>(this.apiUrl, { params });
  }

  /**
   * Get a specific plan with all planned visits
   */
  getPlan(id: number): Observable<VisitPlanDetail> {
    return this.http.get<VisitPlanDetail>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get or create a plan for a specific week
   */
  getOrCreateWeekPlan(weekStart: Date): Observable<VisitPlanDetail> {
    const dateStr = weekStart.toISOString().split('T')[0];
    return this.http.get<VisitPlanDetail>(`${this.apiUrl}/week/${dateStr}`);
  }

  /**
   * Add a planned visit to a plan
   */
  addPlannedVisit(planId: number, dto: CreatePlannedVisitRequest): Observable<PlannedVisit> {
    return this.http.post<PlannedVisit>(`${this.apiUrl}/${planId}/visits`, dto);
  }

  /**
   * Update a planned visit
   */
  updatePlannedVisit(planId: number, visitId: number, dto: UpdatePlannedVisitRequest): Observable<PlannedVisit> {
    return this.http.put<PlannedVisit>(`${this.apiUrl}/${planId}/visits/${visitId}`, dto);
  }

  /**
   * Delete a planned visit
   */
  deletePlannedVisit(planId: number, visitId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${planId}/visits/${visitId}`);
  }

  /**
   * Submit a plan for approval
   */
  submitForApproval(planId: number): Observable<VisitPlanDetail> {
    return this.http.post<VisitPlanDetail>(`${this.apiUrl}/${planId}/submit`, {});
  }

  /**
   * Get Monday of the week for a given date
   */
  getMondayOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Get array of weekdays (Mon-Fri) for a given week
   */
  getWeekDays(monday: Date): Date[] {
    const days: Date[] = [];
    for (let i = 0; i < 5; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      days.push(day);
    }
    return days;
  }

  /**
   * Format date for display
   */
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
