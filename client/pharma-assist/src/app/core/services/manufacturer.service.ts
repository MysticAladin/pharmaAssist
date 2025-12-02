import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Manufacturer, ManufacturerSummary, CreateManufacturerRequest, UpdateManufacturerRequest } from '../models/manufacturer.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ManufacturerService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/manufacturers`;

  getAll(): Observable<ApiResponse<Manufacturer[]>> {
    return this.http.get<ApiResponse<Manufacturer[]>>(this.apiUrl);
  }

  getActive(): Observable<ApiResponse<ManufacturerSummary[]>> {
    return this.http.get<ApiResponse<ManufacturerSummary[]>>(`${this.apiUrl}/active`);
  }

  getById(id: number): Observable<ApiResponse<Manufacturer>> {
    return this.http.get<ApiResponse<Manufacturer>>(`${this.apiUrl}/${id}`);
  }

  create(request: CreateManufacturerRequest): Observable<ApiResponse<Manufacturer>> {
    return this.http.post<ApiResponse<Manufacturer>>(this.apiUrl, request);
  }

  update(id: number, request: UpdateManufacturerRequest): Observable<ApiResponse<Manufacturer>> {
    return this.http.put<ApiResponse<Manufacturer>>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  toggleActive(id: number): Observable<ApiResponse<Manufacturer>> {
    return this.http.patch<ApiResponse<Manufacturer>>(`${this.apiUrl}/${id}/toggle-active`, {});
  }
}
