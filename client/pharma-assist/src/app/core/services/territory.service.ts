import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResponse } from '../models/product.model';
import {
  Territory,
  TerritorySummary,
  CreateTerritoryRequest,
  UpdateTerritoryRequest,
  TerritoryAssignment,
  CreateTerritoryAssignmentRequest,
  BulkAssignCustomersRequest,
  TransferCustomersRequest,
  TerritoryPerformance,
  VisitFrequency,
  FieldWorkMetrics,
  InstitutionAnalytics,
  TerritoryFilters,
  AnalyticsFilters
} from '../models/territory.model';

@Injectable({
  providedIn: 'root'
})
export class TerritoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/territories`;

  // ── Territories ──

  getTerritoryById(id: number): Observable<ApiResponse<Territory>> {
    return this.http.get<ApiResponse<Territory>>(`${this.baseUrl}/${id}`);
  }

  getTerritoriesPaged(filters: TerritoryFilters): Observable<PagedResponse<TerritorySummary>> {
    let params = new HttpParams()
      .set('page', filters.page.toString())
      .set('pageSize', filters.pageSize.toString());

    if (filters.search) params = params.set('search', filters.search);
    if (filters.type !== undefined && filters.type !== null) params = params.set('type', filters.type.toString());
    if (filters.activeOnly !== undefined) params = params.set('activeOnly', filters.activeOnly.toString());
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortDirection) params = params.set('sortDirection', filters.sortDirection);

    return this.http.get<PagedResponse<TerritorySummary>>(`${this.baseUrl}/paged`, { params });
  }

  getTerritoryTree(): Observable<ApiResponse<Territory[]>> {
    return this.http.get<ApiResponse<Territory[]>>(`${this.baseUrl}/tree`);
  }

  createTerritory(territory: CreateTerritoryRequest): Observable<ApiResponse<Territory>> {
    return this.http.post<ApiResponse<Territory>>(this.baseUrl, territory);
  }

  updateTerritory(id: number, territory: UpdateTerritoryRequest): Observable<ApiResponse<Territory>> {
    return this.http.put<ApiResponse<Territory>>(`${this.baseUrl}/${id}`, territory);
  }

  deleteTerritory(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/${id}`);
  }

  // ── Territory Assignments ──

  assignRep(territoryId: number, assignment: CreateTerritoryAssignmentRequest): Observable<ApiResponse<TerritoryAssignment>> {
    return this.http.post<ApiResponse<TerritoryAssignment>>(`${this.baseUrl}/${territoryId}/assignments`, assignment);
  }

  removeAssignment(territoryId: number, assignmentId: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/${territoryId}/assignments/${assignmentId}`);
  }

  getTerritoryAssignments(territoryId: number): Observable<ApiResponse<TerritoryAssignment[]>> {
    return this.http.get<ApiResponse<TerritoryAssignment[]>>(`${this.baseUrl}/${territoryId}/assignments`);
  }

  getRepAssignments(repId: number): Observable<ApiResponse<TerritoryAssignment[]>> {
    return this.http.get<ApiResponse<TerritoryAssignment[]>>(`${this.baseUrl}/rep/${repId}/assignments`);
  }

  // ── Customer Administration ──

  bulkAssignCustomers(dto: BulkAssignCustomersRequest): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.baseUrl}/customers/bulk-assign`, dto);
  }

  transferCustomers(dto: TransferCustomersRequest): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.baseUrl}/customers/transfer`, dto);
  }

  // ── Analytics ──

  getTerritoryPerformance(territoryId: number, filters?: AnalyticsFilters): Observable<ApiResponse<TerritoryPerformance>> {
    let params = new HttpParams();
    if (filters?.fromDate) params = params.set('fromDate', filters.fromDate);
    if (filters?.toDate) params = params.set('toDate', filters.toDate);
    return this.http.get<ApiResponse<TerritoryPerformance>>(`${this.baseUrl}/${territoryId}/performance`, { params });
  }

  compareTerritoryPerformance(territoryIds?: number[], filters?: AnalyticsFilters): Observable<ApiResponse<TerritoryPerformance[]>> {
    let params = new HttpParams();
    if (territoryIds) territoryIds.forEach(id => params = params.append('territoryIds', id.toString()));
    if (filters?.fromDate) params = params.set('fromDate', filters.fromDate);
    if (filters?.toDate) params = params.set('toDate', filters.toDate);
    return this.http.get<ApiResponse<TerritoryPerformance[]>>(`${this.baseUrl}/analytics/compare`, { params });
  }

  getVisitFrequency(filters?: AnalyticsFilters): Observable<ApiResponse<VisitFrequency[]>> {
    let params = new HttpParams();
    if (filters?.repId) params = params.set('repId', filters.repId.toString());
    if (filters?.territoryId) params = params.set('territoryId', filters.territoryId.toString());
    if (filters?.overdueOnly) params = params.set('overdueOnly', filters.overdueOnly.toString());
    return this.http.get<ApiResponse<VisitFrequency[]>>(`${this.baseUrl}/analytics/visit-frequency`, { params });
  }

  getFieldWorkMetrics(filters?: AnalyticsFilters): Observable<ApiResponse<FieldWorkMetrics[]>> {
    let params = new HttpParams();
    if (filters?.fromDate) params = params.set('fromDate', filters.fromDate);
    if (filters?.toDate) params = params.set('toDate', filters.toDate);
    if (filters?.repId) params = params.set('repId', filters.repId.toString());
    return this.http.get<ApiResponse<FieldWorkMetrics[]>>(`${this.baseUrl}/analytics/field-work`, { params });
  }

  getInstitutionAnalytics(filters?: AnalyticsFilters): Observable<ApiResponse<InstitutionAnalytics[]>> {
    let params = new HttpParams();
    if (filters?.fromDate) params = params.set('fromDate', filters.fromDate);
    if (filters?.toDate) params = params.set('toDate', filters.toDate);
    return this.http.get<ApiResponse<InstitutionAnalytics[]>>(`${this.baseUrl}/analytics/institutions`, { params });
  }
}
