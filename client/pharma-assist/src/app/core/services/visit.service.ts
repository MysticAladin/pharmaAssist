import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PlannedVisitSummary,
  ExecutedVisitSummary,
  ExecutedVisit,
  CheckInVisitRequest,
  UpdateExecutedVisitRequest,
  CheckOutVisitRequest,
  VisitHistoryFilter,
  VisitHistoryResult
} from '../models/visit.model';

@Injectable({
  providedIn: 'root'
})
export class VisitService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/visits`;

  getTodayPlanned(): Observable<PlannedVisitSummary[]> {
    return this.http.get<PlannedVisitSummary[]>(`${this.apiUrl}/today/planned`);
  }

  getTodayExecuted(): Observable<ExecutedVisitSummary[]> {
    return this.http.get<ExecutedVisitSummary[]>(`${this.apiUrl}/today/executed`);
  }

  getExecuted(id: number): Observable<ExecutedVisit> {
    return this.http.get<ExecutedVisit>(`${this.apiUrl}/executed/${id}`);
  }

  checkIn(dto: CheckInVisitRequest): Observable<ExecutedVisit> {
    return this.http.post<ExecutedVisit>(`${this.apiUrl}/check-in`, dto);
  }

  updateExecuted(id: number, dto: UpdateExecutedVisitRequest): Observable<ExecutedVisit> {
    return this.http.put<ExecutedVisit>(`${this.apiUrl}/executed/${id}`, dto);
  }

  checkOut(id: number, dto: CheckOutVisitRequest): Observable<ExecutedVisit> {
    return this.http.post<ExecutedVisit>(`${this.apiUrl}/executed/${id}/check-out`, dto);
  }

  getHistory(filter: VisitHistoryFilter): Observable<VisitHistoryResult> {
    const params: Record<string, string> = {
      page: filter.page.toString(),
      pageSize: filter.pageSize.toString()
    };
    if (filter.fromDate) params['fromDate'] = filter.fromDate;
    if (filter.toDate) params['toDate'] = filter.toDate;
    if (filter.customerId != null) params['customerId'] = filter.customerId.toString();
    if (filter.outcome != null) params['outcome'] = filter.outcome.toString();
    if (filter.searchTerm) params['searchTerm'] = filter.searchTerm;

    return this.http.get<VisitHistoryResult>(`${this.apiUrl}/history`, { params });
  }
}
