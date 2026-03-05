import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResponse } from '../models/product.model';
import {
  PriceList,
  PriceListDetail,
  PriceListItem,
  CreatePriceListRequest,
  UpdatePriceListRequest,
  CreatePriceListItemRequest,
  UpdatePriceListItemRequest,
  BulkPriceListItemRequest,
  PriceComparison,
  PriceListFilters
} from '../models/price-list.model';

@Injectable({
  providedIn: 'root'
})
export class PriceListService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/price-lists`;

  // ── Price Lists CRUD ──

  getPriceLists(filters: PriceListFilters): Observable<PagedResponse<PriceList>> {
    let params = new HttpParams()
      .set('page', filters.page.toString())
      .set('pageSize', filters.pageSize.toString());
    if (filters.search) params = params.set('search', filters.search);
    if (filters.type !== undefined && filters.type !== null) params = params.set('type', filters.type.toString());
    if (filters.activeOnly !== undefined) params = params.set('activeOnly', filters.activeOnly.toString());
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortDirection) params = params.set('sortDirection', filters.sortDirection);
    return this.http.get<PagedResponse<PriceList>>(this.baseUrl, { params });
  }

  getPriceListById(id: number): Observable<ApiResponse<PriceListDetail>> {
    return this.http.get<ApiResponse<PriceListDetail>>(`${this.baseUrl}/${id}`);
  }

  createPriceList(request: CreatePriceListRequest): Observable<ApiResponse<PriceList>> {
    return this.http.post<ApiResponse<PriceList>>(this.baseUrl, request);
  }

  updatePriceList(id: number, request: UpdatePriceListRequest): Observable<ApiResponse<PriceList>> {
    return this.http.put<ApiResponse<PriceList>>(`${this.baseUrl}/${id}`, request);
  }

  deletePriceList(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/${id}`);
  }

  // ── Price List Items ──

  addItem(priceListId: number, request: CreatePriceListItemRequest): Observable<ApiResponse<PriceListItem>> {
    return this.http.post<ApiResponse<PriceListItem>>(`${this.baseUrl}/${priceListId}/items`, request);
  }

  updateItem(priceListId: number, itemId: number, request: UpdatePriceListItemRequest): Observable<ApiResponse<PriceListItem>> {
    return this.http.put<ApiResponse<PriceListItem>>(`${this.baseUrl}/${priceListId}/items/${itemId}`, request);
  }

  deleteItem(priceListId: number, itemId: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/${priceListId}/items/${itemId}`);
  }

  bulkAddItems(request: BulkPriceListItemRequest): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.baseUrl}/${request.priceListId}/items/bulk`, request);
  }

  // ── Comparison ──

  comparePrices(priceListIds: number[]): Observable<ApiResponse<PriceComparison[]>> {
    let params = new HttpParams();
    priceListIds.forEach(id => params = params.append('priceListIds', id.toString()));
    return this.http.get<ApiResponse<PriceComparison[]>>(`${this.baseUrl}/compare`, { params });
  }
}
