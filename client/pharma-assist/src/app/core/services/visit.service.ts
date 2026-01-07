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
  CheckOutVisitRequest
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
}
