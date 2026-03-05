import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Physician,
  CreatePhysicianRequest,
  UpdatePhysicianRequest,
  CustomerVisitHistory
} from '../models/hospital.model';

export interface ApiResponse<T> {
  succeeded: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PagedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PhysicianService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/physicians`;
  private readonly visitReportsUrl = `${environment.apiUrl}/visit-reports`;

  getPaged(page: number = 1, pageSize: number = 20, search?: string, specialty?: number, kolStatus?: number): Observable<PagedResponse<Physician>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    if (search) params = params.set('search', search);
    if (specialty !== undefined && specialty !== null) params = params.set('specialty', specialty.toString());
    if (kolStatus !== undefined && kolStatus !== null) params = params.set('kolStatus', kolStatus.toString());
    return this.http.get<PagedResponse<Physician>>(this.apiUrl, { params });
  }

  getById(id: number): Observable<ApiResponse<Physician>> {
    return this.http.get<ApiResponse<Physician>>(`${this.apiUrl}/${id}`);
  }

  getByInstitution(institutionId: number): Observable<ApiResponse<Physician[]>> {
    return this.http.get<ApiResponse<Physician[]>>(`${this.apiUrl}/by-institution/${institutionId}`);
  }

  getByDepartment(departmentId: number): Observable<ApiResponse<Physician[]>> {
    return this.http.get<ApiResponse<Physician[]>>(`${this.apiUrl}/by-department/${departmentId}`);
  }

  create(request: CreatePhysicianRequest): Observable<ApiResponse<Physician>> {
    return this.http.post<ApiResponse<Physician>>(this.apiUrl, request);
  }

  update(id: number, request: UpdatePhysicianRequest): Observable<ApiResponse<Physician>> {
    return this.http.put<ApiResponse<Physician>>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }

  getCustomerVisitHistory(
    customerId: number,
    page: number = 1,
    pageSize: number = 20,
    from?: string,
    to?: string
  ): Observable<CustomerVisitHistory> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<CustomerVisitHistory>(
      `${this.visitReportsUrl}/customer/${customerId}/visits`,
      { params }
    );
  }
}
