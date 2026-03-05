import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResponse } from '../models/product.model';
import {
  MaterialDistribution,
  CreateDistributionRequest,
  DistributionFilters,
  RepInventory,
  UpdateRepInventoryRequest,
  RestockInventoryRequest,
  DistributionSummary
} from '../models/material.model';

@Injectable({
  providedIn: 'root'
})
export class MaterialDistributionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/material-distributions`;

  // ── Distributions ──

  getDistributions(filters: DistributionFilters): Observable<PagedResponse<MaterialDistribution>> {
    let params = new HttpParams()
      .set('page', filters.page.toString())
      .set('pageSize', filters.pageSize.toString());
    if (filters.repId) params = params.set('repId', filters.repId.toString());
    if (filters.customerId) params = params.set('customerId', filters.customerId.toString());
    if (filters.materialType !== undefined && filters.materialType !== null) params = params.set('materialType', filters.materialType.toString());
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortDirection) params = params.set('sortDirection', filters.sortDirection);
    return this.http.get<PagedResponse<MaterialDistribution>>(this.baseUrl, { params });
  }

  getDistributionById(id: number): Observable<ApiResponse<MaterialDistribution>> {
    return this.http.get<ApiResponse<MaterialDistribution>>(`${this.baseUrl}/${id}`);
  }

  createDistribution(request: CreateDistributionRequest): Observable<ApiResponse<MaterialDistribution>> {
    return this.http.post<ApiResponse<MaterialDistribution>>(this.baseUrl, request);
  }

  deleteDistribution(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/${id}`);
  }

  // ── Rep Inventory ──

  getRepInventory(repId: number): Observable<ApiResponse<RepInventory[]>> {
    return this.http.get<ApiResponse<RepInventory[]>>(`${this.baseUrl}/inventory/${repId}`);
  }

  updateRepInventory(request: UpdateRepInventoryRequest): Observable<ApiResponse<RepInventory>> {
    return this.http.put<ApiResponse<RepInventory>>(`${this.baseUrl}/inventory/${request.repId}`, request);
  }

  restockInventory(inventoryId: number, request: RestockInventoryRequest): Observable<ApiResponse<RepInventory>> {
    return this.http.post<ApiResponse<RepInventory>>(`${this.baseUrl}/inventory/${inventoryId}/restock`, request);
  }

  deleteInventoryItem(inventoryId: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/inventory/${inventoryId}`);
  }

  // ── Reports & Export ──

  getSummary(from?: string, to?: string, repId?: number): Observable<ApiResponse<DistributionSummary>> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    if (repId) params = params.set('repId', repId.toString());
    return this.http.get<ApiResponse<DistributionSummary>>(`${this.baseUrl}/summary`, { params });
  }

  exportDistributions(from?: string, to?: string, repId?: number): Observable<Blob> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    if (repId) params = params.set('repId', repId.toString());
    return this.http.get(`${this.baseUrl}/export`, { params, responseType: 'blob' });
  }
}
