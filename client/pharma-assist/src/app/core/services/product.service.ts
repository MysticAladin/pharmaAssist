import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Product,
  ProductSummary,
  CreateProductRequest,
  UpdateProductRequest,
  PartialProductUpdate,
  ApiResponse,
  PagedResponse,
  ProductFilters
} from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/products`;

  /**
   * Get all products
   */
  getAll(): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(this.apiUrl);
  }

  /**
   * Get paginated products with filters
   */
  getPaged(filters: ProductFilters): Observable<PagedResponse<ProductSummary>> {
    let params = new HttpParams()
      .set('page', filters.page.toString())
      .set('pageSize', filters.pageSize.toString());

    if (filters.search) {
      params = params.set('search', filters.search);
    }
    if (filters.categoryId) {
      params = params.set('categoryId', filters.categoryId.toString());
    }
    if (filters.manufacturerId) {
      params = params.set('manufacturerId', filters.manufacturerId.toString());
    }
    if (filters.activeOnly !== undefined) {
      params = params.set('activeOnly', filters.activeOnly.toString());
    }

    return this.http.get<PagedResponse<ProductSummary>>(`${this.apiUrl}/paged`, { params });
  }

  /**
   * Get product by ID
   */
  getById(id: number): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Search products
   */
  search(searchTerm: string): Observable<ApiResponse<ProductSummary[]>> {
    const params = new HttpParams().set('searchTerm', searchTerm);
    return this.http.get<ApiResponse<ProductSummary[]>>(`${this.apiUrl}/search`, { params });
  }

  /**
   * Get products by category
   */
  getByCategory(categoryId: number): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${this.apiUrl}/by-category/${categoryId}`);
  }

  /**
   * Get products by manufacturer
   */
  getByManufacturer(manufacturerId: number): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${this.apiUrl}/by-manufacturer/${manufacturerId}`);
  }

  /**
   * Get low stock products
   */
  getLowStock(threshold: number = 10): Observable<ApiResponse<Product[]>> {
    const params = new HttpParams().set('threshold', threshold.toString());
    return this.http.get<ApiResponse<Product[]>>(`${this.apiUrl}/low-stock`, { params });
  }

  /**
   * Create a new product
   */
  create(product: CreateProductRequest): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(this.apiUrl, product);
  }

  /**
   * Update an existing product
   */
  update(id: number, product: UpdateProductRequest): Observable<ApiResponse<Product>> {
    return this.http.put<ApiResponse<Product>>(`${this.apiUrl}/${id}`, product);
  }

  /**
   * Partially update a product (for bulk operations)
   */
  partialUpdate(id: number, updates: PartialProductUpdate): Observable<ApiResponse<Product>> {
    return this.http.patch<ApiResponse<Product>>(`${this.apiUrl}/${id}`, updates);
  }

  /**
   * Delete a product
   */
  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Activate a product
   */
  activate(id: number): Observable<ApiResponse<Product>> {
    return this.http.patch<ApiResponse<Product>>(`${this.apiUrl}/${id}/activate`, {});
  }

  /**
   * Deactivate a product
   */
  deactivate(id: number): Observable<ApiResponse<Product>> {
    return this.http.patch<ApiResponse<Product>>(`${this.apiUrl}/${id}/deactivate`, {});
  }
}
