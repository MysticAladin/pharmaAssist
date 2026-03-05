import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Department,
  DepartmentDetail,
  CreateDepartmentRequest,
  UpdateDepartmentRequest
} from '../models/hospital.model';

export interface ApiResponse<T> {
  succeeded: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/departments`;

  getByCustomer(customerId: number): Observable<ApiResponse<Department[]>> {
    return this.http.get<ApiResponse<Department[]>>(`${this.apiUrl}/by-customer/${customerId}`);
  }

  getById(id: number): Observable<ApiResponse<DepartmentDetail>> {
    return this.http.get<ApiResponse<DepartmentDetail>>(`${this.apiUrl}/${id}`);
  }

  create(request: CreateDepartmentRequest): Observable<ApiResponse<Department>> {
    return this.http.post<ApiResponse<Department>>(this.apiUrl, request);
  }

  update(id: number, request: UpdateDepartmentRequest): Observable<ApiResponse<Department>> {
    return this.http.put<ApiResponse<Department>>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }
}
