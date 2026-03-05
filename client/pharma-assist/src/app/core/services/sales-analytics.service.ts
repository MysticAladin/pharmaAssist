import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/product.model';
import {
  SalesAnalyticsFilter,
  SalesDashboard,
  SalesByInstitution,
  SalesByInstitutionType,
  SalesByRegion,
  SalesByProduct,
  SalesByBrand,
  SalesByRep,
  SalesTrend
} from '../models/wholesaler.model';

@Injectable({
  providedIn: 'root'
})
export class SalesAnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/sales-analytics`;

  private buildFilterParams(filter?: SalesAnalyticsFilter): HttpParams {
    let params = new HttpParams();
    if (!filter) return params;
    if (filter.dateFrom) params = params.set('dateFrom', filter.dateFrom);
    if (filter.dateTo) params = params.set('dateTo', filter.dateTo);
    if (filter.period) params = params.set('period', filter.period);
    if (filter.wholesalerId) params = params.set('wholesalerId', filter.wholesalerId.toString());
    if (filter.productId) params = params.set('productId', filter.productId.toString());
    if (filter.brandId) params = params.set('brandId', filter.brandId.toString());
    if (filter.customerId) params = params.set('customerId', filter.customerId.toString());
    if (filter.cantonId) params = params.set('cantonId', filter.cantonId.toString());
    if (filter.customerType !== undefined && filter.customerType !== null) params = params.set('customerType', filter.customerType.toString());
    if (filter.repId) params = params.set('repId', filter.repId.toString());
    return params;
  }

  getDashboard(filter?: SalesAnalyticsFilter): Observable<ApiResponse<SalesDashboard>> {
    return this.http.get<ApiResponse<SalesDashboard>>(`${this.baseUrl}/dashboard`, {
      params: this.buildFilterParams(filter)
    });
  }

  getSalesByInstitution(filter?: SalesAnalyticsFilter): Observable<ApiResponse<SalesByInstitution[]>> {
    return this.http.get<ApiResponse<SalesByInstitution[]>>(`${this.baseUrl}/by-institution`, {
      params: this.buildFilterParams(filter)
    });
  }

  getSalesByInstitutionType(filter?: SalesAnalyticsFilter): Observable<ApiResponse<SalesByInstitutionType[]>> {
    return this.http.get<ApiResponse<SalesByInstitutionType[]>>(`${this.baseUrl}/by-institution-type`, {
      params: this.buildFilterParams(filter)
    });
  }

  getSalesByRegion(filter?: SalesAnalyticsFilter): Observable<ApiResponse<SalesByRegion[]>> {
    return this.http.get<ApiResponse<SalesByRegion[]>>(`${this.baseUrl}/by-region`, {
      params: this.buildFilterParams(filter)
    });
  }

  getSalesByProduct(filter?: SalesAnalyticsFilter): Observable<ApiResponse<SalesByProduct[]>> {
    return this.http.get<ApiResponse<SalesByProduct[]>>(`${this.baseUrl}/by-product`, {
      params: this.buildFilterParams(filter)
    });
  }

  getSalesByBrand(filter?: SalesAnalyticsFilter): Observable<ApiResponse<SalesByBrand[]>> {
    return this.http.get<ApiResponse<SalesByBrand[]>>(`${this.baseUrl}/by-brand`, {
      params: this.buildFilterParams(filter)
    });
  }

  getSalesByRep(filter?: SalesAnalyticsFilter): Observable<ApiResponse<SalesByRep[]>> {
    return this.http.get<ApiResponse<SalesByRep[]>>(`${this.baseUrl}/by-rep`, {
      params: this.buildFilterParams(filter)
    });
  }

  getSalesTrend(filter?: SalesAnalyticsFilter, granularity?: string): Observable<ApiResponse<SalesTrend[]>> {
    let params = this.buildFilterParams(filter);
    if (granularity) params = params.set('granularity', granularity);
    return this.http.get<ApiResponse<SalesTrend[]>>(`${this.baseUrl}/trend`, { params });
  }
}
