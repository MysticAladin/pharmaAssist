import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RepProduct, ProductStockSummary } from '../models/rep-order.model';
import { PagedResponse } from '../models/customer.model';

export interface RepProductFilter {
  search?: string;
  categoryId?: number;
  manufacturerId?: number;
  inStockOnly?: boolean;
  page?: number;
  pageSize?: number;
}

@Injectable({
  providedIn: 'root'
})
export class RepProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/products/rep`;

  /**
   * Get product catalog for sales representatives
   */
  getCatalog(filter: RepProductFilter = {}): Observable<PagedResponse<RepProduct>> {
    let params = new HttpParams();

    if (filter.search) {
      params = params.set('search', filter.search);
    }
    if (filter.categoryId !== undefined) {
      params = params.set('categoryId', filter.categoryId.toString());
    }
    if (filter.manufacturerId !== undefined) {
      params = params.set('manufacturerId', filter.manufacturerId.toString());
    }
    if (filter.inStockOnly !== undefined) {
      params = params.set('inStockOnly', filter.inStockOnly.toString());
    }
    if (filter.page !== undefined) {
      params = params.set('page', filter.page.toString());
    }
    if (filter.pageSize !== undefined) {
      params = params.set('pageSize', filter.pageSize.toString());
    }

    return this.http.get<PagedResponse<RepProduct>>(`${this.baseUrl}/catalog`, { params });
  }

  /**
   * Get product details by ID
   */
  getProduct(productId: number): Observable<RepProduct> {
    return this.http.get<RepProduct>(`${this.baseUrl}/${productId}`);
  }

  /**
   * Get product inventory/stock across warehouses
   */
  getProductInventory(productId: number): Observable<ProductStockSummary> {
    return this.http.get<ProductStockSummary>(`${this.baseUrl}/${productId}/inventory`);
  }

  /**
   * Search products by name, SKU, or barcode
   */
  searchProducts(query: string): Observable<RepProduct[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<RepProduct[]>(`${this.baseUrl}/search`, { params });
  }

  /**
   * Get products by category
   */
  getByCategory(categoryId: number, page: number = 1, pageSize: number = 20): Observable<PagedResponse<RepProduct>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<PagedResponse<RepProduct>>(
      `${this.baseUrl}/category/${categoryId}`,
      { params }
    );
  }
}
