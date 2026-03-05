import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResponse } from '../models/product.model';
import {
  WholesalerDataImport,
  WholesalerDataImportDetail,
  ImportPreview,
  ImportResult,
  WholesalerSalesRecord,
  MatchRecordRequest,
  BulkMatchRequest,
  WholesalerStockSummary,
  WholesalerImportFilters
} from '../models/wholesaler.model';

@Injectable({
  providedIn: 'root'
})
export class WholesalerDataService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/wholesaler-data`;

  // ── File Upload & Preview ──

  previewFile(file: File): Observable<ApiResponse<ImportPreview>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<ImportPreview>>(`${this.baseUrl}/preview`, formData);
  }

  importFile(file: File, wholesalerId: number, period?: string, columnMapping?: string, notes?: string): Observable<ApiResponse<ImportResult>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('wholesalerId', wholesalerId.toString());
    if (period) formData.append('period', period);
    if (columnMapping) formData.append('columnMapping', columnMapping);
    if (notes) formData.append('notes', notes);
    return this.http.post<ApiResponse<ImportResult>>(`${this.baseUrl}/import`, formData);
  }

  // ── Import Management ──

  getImports(filters: WholesalerImportFilters): Observable<PagedResponse<WholesalerDataImport>> {
    let params = new HttpParams()
      .set('page', filters.page.toString())
      .set('pageSize', filters.pageSize.toString());
    if (filters.wholesalerId) params = params.set('wholesalerId', filters.wholesalerId.toString());
    if (filters.status) params = params.set('status', filters.status);
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortDirection) params = params.set('sortDirection', filters.sortDirection);
    return this.http.get<PagedResponse<WholesalerDataImport>>(`${this.baseUrl}/imports`, { params });
  }

  getImportById(id: number): Observable<ApiResponse<WholesalerDataImportDetail>> {
    return this.http.get<ApiResponse<WholesalerDataImportDetail>>(`${this.baseUrl}/imports/${id}`);
  }

  deleteImport(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/imports/${id}`);
  }

  // ── Record Matching ──

  getUnmatchedRecords(importId: number): Observable<ApiResponse<WholesalerSalesRecord[]>> {
    return this.http.get<ApiResponse<WholesalerSalesRecord[]>>(`${this.baseUrl}/imports/${importId}/unmatched`);
  }

  matchRecord(request: MatchRecordRequest): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.baseUrl}/match`, request);
  }

  bulkMatch(request: BulkMatchRequest): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.baseUrl}/match/bulk`, request);
  }

  // ── Stock ──

  getStockSummary(wholesalerId?: number, productId?: number): Observable<ApiResponse<WholesalerStockSummary[]>> {
    let params = new HttpParams();
    if (wholesalerId) params = params.set('wholesalerId', wholesalerId.toString());
    if (productId) params = params.set('productId', productId.toString());
    return this.http.get<ApiResponse<WholesalerStockSummary[]>>(`${this.baseUrl}/stock`, { params });
  }
}
