import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import {
  TeamVisitPlanSummary,
  VisitPlanReport,
  TeamActivityDashboard,
  VisitAuditFilter,
  VisitAuditResult
} from '../models/visit.model';
import { ExecutedVisit } from '../models/visit.model';

@Injectable({ providedIn: 'root' })
export class VisitReportService {
  private readonly http = inject(HttpClient);

  getWeekPlans(weekStartUtc?: string) {
    const params: any = {};
    if (weekStartUtc) params.weekStartUtc = weekStartUtc;
    return this.http.get<TeamVisitPlanSummary[]>('/api/visit-reports/week', { params });
  }

  getPlan(planId: number) {
    return this.http.get<VisitPlanReport>(`/api/visit-reports/plans/${planId}`);
  }

  getExecutedVisit(id: number) {
    return this.http.get<ExecutedVisit>(`/api/visit-reports/executed/${id}`);
  }

  getTeamActivity(date?: string) {
    const params: Record<string, string> = {};
    if (date) params['date'] = date;
    return this.http.get<TeamActivityDashboard>('/api/visit-reports/team-activity', { params });
  }

  getVisitAudit(filter: VisitAuditFilter) {
    let params = new HttpParams()
      .set('page', filter.page.toString())
      .set('pageSize', filter.pageSize.toString());

    if (filter.fromDate) params = params.set('fromDate', filter.fromDate);
    if (filter.toDate) params = params.set('toDate', filter.toDate);
    if (filter.repId !== null && filter.repId !== undefined) {
      params = params.set('repId', filter.repId.toString());
    }
    if (filter.locationVerified !== null && filter.locationVerified !== undefined) {
      params = params.set('locationVerified', filter.locationVerified.toString());
    }
    if (filter.hasLocationAlert !== null && filter.hasLocationAlert !== undefined) {
      params = params.set('hasLocationAlert', filter.hasLocationAlert.toString());
    }

    return this.http.get<VisitAuditResult>('/api/visit-reports/audit', { params });
  }
}
