import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { TeamVisitPlanSummary, VisitPlanReport } from '../models/visit.model';
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
}
