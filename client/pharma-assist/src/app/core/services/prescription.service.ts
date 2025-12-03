import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Prescription,
  PrescriptionSummary,
  PrescriptionFilter,
  ReviewPrescriptionRequest,
  DispensePrescriptionRequest
} from '../models/prescription.model';

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class PrescriptionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/prescriptions`;

  /**
   * Get paginated list of prescriptions
   */
  getAll(filter: PrescriptionFilter): Observable<PaginatedResult<PrescriptionSummary>> {
    let params = new HttpParams()
      .set('page', filter.page.toString())
      .set('pageSize', filter.pageSize.toString());

    if (filter.searchTerm) params = params.set('searchTerm', filter.searchTerm);
    if (filter.status !== undefined) params = params.set('status', filter.status.toString());
    if (filter.priority !== undefined) params = params.set('priority', filter.priority.toString());
    if (filter.isControlled !== undefined) params = params.set('isControlled', filter.isControlled.toString());
    if (filter.customerId) params = params.set('customerId', filter.customerId);
    if (filter.dateFrom) params = params.set('dateFrom', filter.dateFrom.toISOString());
    if (filter.dateTo) params = params.set('dateTo', filter.dateTo.toISOString());

    return this.http.get<PaginatedResult<PrescriptionSummary>>(this.baseUrl, { params });
  }

  /**
   * Get prescription by ID
   */
  getById(id: string): Observable<Prescription> {
    return this.http.get<Prescription>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get prescriptions pending review
   */
  getPendingReview(): Observable<PrescriptionSummary[]> {
    return this.http.get<PrescriptionSummary[]>(`${this.baseUrl}/pending-review`);
  }

  /**
   * Get prescription statistics
   */
  getStats(): Observable<PrescriptionStats> {
    return this.http.get<PrescriptionStats>(`${this.baseUrl}/stats`);
  }

  /**
   * Upload a new prescription
   */
  upload(formData: FormData): Observable<Prescription> {
    return this.http.post<Prescription>(this.baseUrl, formData);
  }

  /**
   * Review a prescription (approve/reject)
   */
  review(id: string, request: ReviewPrescriptionRequest): Observable<Prescription> {
    return this.http.post<Prescription>(`${this.baseUrl}/${id}/review`, request);
  }

  /**
   * Dispense prescription items
   */
  dispense(id: string, request: DispensePrescriptionRequest): Observable<Prescription> {
    return this.http.post<Prescription>(`${this.baseUrl}/${id}/dispense`, request);
  }

  /**
   * Cancel a prescription
   */
  cancel(id: string, reason: string): Observable<Prescription> {
    return this.http.post<Prescription>(`${this.baseUrl}/${id}/cancel`, { reason });
  }

  /**
   * Download prescription file
   */
  downloadFile(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/file`, { responseType: 'blob' });
  }
}

export interface PrescriptionStats {
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
  dispensed: number;
  urgentCount: number;
  controlledCount: number;
}
