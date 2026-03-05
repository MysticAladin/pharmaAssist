import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResponse } from '../models/product.model';
import {
  Cycle,
  CycleSummary,
  CreateCycleRequest,
  UpdateCycleRequest,
  CycleTarget,
  CreateCycleTargetRequest,
  BulkCreateCycleTargetsRequest,
  Campaign,
  CampaignSummary,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CampaignTarget,
  CreateCampaignTargetRequest,
  UpdateCampaignTargetStatusRequest,
  CampaignExpense,
  CreateCampaignExpenseRequest,
  ClientInvestment,
  CycleFilters,
  CampaignFilters
} from '../models/cycle.model';

@Injectable({
  providedIn: 'root'
})
export class CycleService {
  private readonly http = inject(HttpClient);
  private readonly cyclesUrl = `${environment.apiUrl}/cycles`;
  private readonly campaignsUrl = `${environment.apiUrl}/campaigns`;
  private readonly expensesUrl = `${environment.apiUrl}/expenses`;

  // ── Cycles ──

  getCycleById(id: number): Observable<ApiResponse<Cycle>> {
    return this.http.get<ApiResponse<Cycle>>(`${this.cyclesUrl}/${id}`);
  }

  getCyclesPaged(filters: CycleFilters): Observable<PagedResponse<CycleSummary>> {
    let params = new HttpParams()
      .set('page', filters.page.toString())
      .set('pageSize', filters.pageSize.toString());

    if (filters.search) params = params.set('search', filters.search);
    if (filters.status !== undefined && filters.status !== null) params = params.set('status', filters.status.toString());
    if (filters.activeOnly !== undefined) params = params.set('activeOnly', filters.activeOnly.toString());
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortDirection) params = params.set('sortDirection', filters.sortDirection);

    return this.http.get<PagedResponse<CycleSummary>>(`${this.cyclesUrl}/paged`, { params });
  }

  createCycle(cycle: CreateCycleRequest): Observable<ApiResponse<Cycle>> {
    return this.http.post<ApiResponse<Cycle>>(this.cyclesUrl, cycle);
  }

  updateCycle(id: number, cycle: UpdateCycleRequest): Observable<ApiResponse<Cycle>> {
    return this.http.put<ApiResponse<Cycle>>(`${this.cyclesUrl}/${id}`, cycle);
  }

  deleteCycle(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.cyclesUrl}/${id}`);
  }

  activateCycle(id: number): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.cyclesUrl}/${id}/activate`, {});
  }

  completeCycle(id: number): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.cyclesUrl}/${id}/complete`, {});
  }

  copyCycle(id: number, newName: string, startDate: string, endDate: string): Observable<ApiResponse<Cycle>> {
    const params = new HttpParams()
      .set('newName', newName)
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.post<ApiResponse<Cycle>>(`${this.cyclesUrl}/${id}/copy`, {}, { params });
  }

  // ── Cycle Targets ──

  getCycleTargets(cycleId: number, repId?: number): Observable<ApiResponse<CycleTarget[]>> {
    let params = new HttpParams();
    if (repId) params = params.set('repId', repId.toString());
    return this.http.get<ApiResponse<CycleTarget[]>>(`${this.cyclesUrl}/${cycleId}/targets`, { params });
  }

  addCycleTarget(cycleId: number, target: CreateCycleTargetRequest): Observable<ApiResponse<CycleTarget>> {
    return this.http.post<ApiResponse<CycleTarget>>(`${this.cyclesUrl}/${cycleId}/targets`, target);
  }

  bulkAddCycleTargets(cycleId: number, dto: BulkCreateCycleTargetsRequest): Observable<ApiResponse<CycleTarget[]>> {
    return this.http.post<ApiResponse<CycleTarget[]>>(`${this.cyclesUrl}/${cycleId}/targets/bulk`, dto);
  }

  removeCycleTarget(cycleId: number, targetId: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.cyclesUrl}/${cycleId}/targets/${targetId}`);
  }

  // ── Campaigns ──

  getCampaignById(id: number): Observable<ApiResponse<Campaign>> {
    return this.http.get<ApiResponse<Campaign>>(`${this.campaignsUrl}/${id}`);
  }

  getCampaignsPaged(filters: CampaignFilters): Observable<PagedResponse<CampaignSummary>> {
    let params = new HttpParams()
      .set('page', filters.page.toString())
      .set('pageSize', filters.pageSize.toString());

    if (filters.search) params = params.set('search', filters.search);
    if (filters.cycleId) params = params.set('cycleId', filters.cycleId.toString());
    if (filters.type !== undefined && filters.type !== null) params = params.set('type', filters.type.toString());
    if (filters.status !== undefined && filters.status !== null) params = params.set('status', filters.status.toString());
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortDirection) params = params.set('sortDirection', filters.sortDirection);

    return this.http.get<PagedResponse<CampaignSummary>>(`${this.campaignsUrl}/paged`, { params });
  }

  createCampaign(campaign: CreateCampaignRequest): Observable<ApiResponse<Campaign>> {
    return this.http.post<ApiResponse<Campaign>>(this.campaignsUrl, campaign);
  }

  updateCampaign(id: number, campaign: UpdateCampaignRequest): Observable<ApiResponse<Campaign>> {
    return this.http.put<ApiResponse<Campaign>>(`${this.campaignsUrl}/${id}`, campaign);
  }

  deleteCampaign(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.campaignsUrl}/${id}`);
  }

  activateCampaign(id: number): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.campaignsUrl}/${id}/activate`, {});
  }

  completeCampaign(id: number): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.campaignsUrl}/${id}/complete`, {});
  }

  // ── Campaign Targets ──

  addCampaignTarget(campaignId: number, target: CreateCampaignTargetRequest): Observable<ApiResponse<CampaignTarget>> {
    return this.http.post<ApiResponse<CampaignTarget>>(`${this.campaignsUrl}/${campaignId}/targets`, target);
  }

  removeCampaignTarget(campaignId: number, targetId: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.campaignsUrl}/${campaignId}/targets/${targetId}`);
  }

  updateCampaignTargetStatus(campaignId: number, targetId: number, dto: UpdateCampaignTargetStatusRequest): Observable<ApiResponse<CampaignTarget>> {
    return this.http.put<ApiResponse<CampaignTarget>>(`${this.campaignsUrl}/${campaignId}/targets/${targetId}/status`, dto);
  }

  // ── Budget Expenses ──

  createExpense(expense: CreateCampaignExpenseRequest): Observable<ApiResponse<CampaignExpense>> {
    return this.http.post<ApiResponse<CampaignExpense>>(this.expensesUrl, expense);
  }

  deleteExpense(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.expensesUrl}/${id}`);
  }

  getCampaignExpenses(campaignId: number): Observable<ApiResponse<CampaignExpense[]>> {
    return this.http.get<ApiResponse<CampaignExpense[]>>(`${this.campaignsUrl}/${campaignId}/expenses`);
  }

  approveExpense(id: number, notes?: string): Observable<ApiResponse<boolean>> {
    let params = new HttpParams();
    if (notes) params = params.set('notes', notes);
    return this.http.post<ApiResponse<boolean>>(`${this.expensesUrl}/${id}/approve`, {}, { params });
  }

  // ── Client Investment ──

  getClientInvestment(customerId: number, fromDate?: string, toDate?: string): Observable<ApiResponse<ClientInvestment>> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get<ApiResponse<ClientInvestment>>(`${environment.apiUrl}/customers/${customerId}/investment`, { params });
  }

  getTopInvestments(top: number = 20, fromDate?: string, toDate?: string): Observable<ApiResponse<ClientInvestment[]>> {
    let params = new HttpParams().set('top', top.toString());
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get<ApiResponse<ClientInvestment[]>>(`${environment.apiUrl}/investments/top`, { params });
  }
}
