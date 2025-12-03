import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, map, catchError, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ProductCatalogItem,
  ProductFilter,
  CategoryNode,
  Favorite,
  ReorderSuggestion
} from '../models/portal.model';

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Portal Catalog Service
 * Handles product browsing, search, and catalog operations for customers
 */
@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/portal`;

  // Cached categories
  private categoriesCache = signal<CategoryNode[]>([]);
  private manufacturersCache = signal<{ id: string; name: string }[]>([]);

  categories = computed(() => this.categoriesCache());
  manufacturers = computed(() => this.manufacturersCache());

  /**
   * Get paginated product catalog
   */
  getProducts(
    filter: ProductFilter = {},
    pagination: PaginationParams = { page: 1, pageSize: 20 }
  ): Observable<PaginatedResult<ProductCatalogItem>> {
    let params = new HttpParams()
      .set('page', pagination.page.toString())
      .set('pageSize', pagination.pageSize.toString());

    if (filter.search) params = params.set('search', filter.search);
    if (filter.categoryId) params = params.set('categoryId', filter.categoryId);
    if (filter.manufacturerId) params = params.set('manufacturerId', filter.manufacturerId);
    if (filter.minPrice) params = params.set('minPrice', filter.minPrice.toString());
    if (filter.maxPrice) params = params.set('maxPrice', filter.maxPrice.toString());
    if (filter.inStockOnly) params = params.set('inStockOnly', 'true');
    if (filter.requiresPrescription !== undefined) {
      params = params.set('requiresPrescription', filter.requiresPrescription.toString());
    }

    if (pagination.sortBy) {
      params = params.set('sortBy', pagination.sortBy);
      params = params.set('sortOrder', pagination.sortOrder || 'asc');
    }

    return this.http.get<PaginatedResult<ProductCatalogItem>>(
      `${this.apiUrl}/products`,
      { params }
    );
  }

  /**
   * Get single product details
   */
  getProduct(id: string): Observable<ProductCatalogItem> {
    return this.http.get<ProductCatalogItem>(`${this.apiUrl}/products/${id}`);
  }

  /**
   * Search products by name or code
   */
  searchProducts(query: string, limit: number = 10): Observable<ProductCatalogItem[]> {
    if (!query || query.length < 2) {
      return of([]);
    }

    const params = new HttpParams()
      .set('search', query)
      .set('pageSize', limit.toString());

    return this.http.get<PaginatedResult<ProductCatalogItem>>(
      `${this.apiUrl}/products`,
      { params }
    ).pipe(
      map(result => result.items)
    );
  }

  /**
   * Get product categories
   */
  getCategories(): Observable<CategoryNode[]> {
    // Return cached if available
    if (this.categoriesCache().length > 0) {
      return of(this.categoriesCache());
    }

    return this.http.get<CategoryNode[]>(`${this.apiUrl}/categories`).pipe(
      tap(categories => this.categoriesCache.set(categories)),
      catchError(() => of([]))
    );
  }

  /**
   * Get manufacturers list
   */
  getManufacturers(): Observable<{ id: string; name: string }[]> {
    if (this.manufacturersCache().length > 0) {
      return of(this.manufacturersCache());
    }

    return this.http.get<{ id: string; name: string }[]>(`${this.apiUrl}/manufacturers`).pipe(
      tap(manufacturers => this.manufacturersCache.set(manufacturers)),
      catchError(() => of([]))
    );
  }

  /**
   * Get products by category
   */
  getProductsByCategory(
    categoryId: string,
    pagination: PaginationParams = { page: 1, pageSize: 20 }
  ): Observable<PaginatedResult<ProductCatalogItem>> {
    return this.getProducts({ categoryId }, pagination);
  }

  /**
   * Get products by manufacturer
   */
  getProductsByManufacturer(
    manufacturerId: string,
    pagination: PaginationParams = { page: 1, pageSize: 20 }
  ): Observable<PaginatedResult<ProductCatalogItem>> {
    return this.getProducts({ manufacturerId }, pagination);
  }

  /**
   * Get featured/promoted products
   */
  getFeaturedProducts(): Observable<ProductCatalogItem[]> {
    return this.http.get<ProductCatalogItem[]>(`${this.apiUrl}/products/featured`);
  }

  /**
   * Get new arrivals
   */
  getNewArrivals(limit: number = 10): Observable<ProductCatalogItem[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<ProductCatalogItem[]>(`${this.apiUrl}/products/new`, { params });
  }

  /**
   * Get customer's favorite products
   */
  getFavorites(): Observable<Favorite[]> {
    return this.http.get<Favorite[]>(`${this.apiUrl}/favorites`);
  }

  /**
   * Add product to favorites
   */
  addFavorite(productId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/favorites/${productId}`, {});
  }

  /**
   * Remove product from favorites
   */
  removeFavorite(productId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/favorites/${productId}`);
  }

  /**
   * Toggle product favorite status
   */
  toggleFavorite(productId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/favorites/${productId}/toggle`, {});
  }

  /**
   * Get reorder suggestions based on order history
   */
  getReorderSuggestions(): Observable<ReorderSuggestion[]> {
    return this.http.get<ReorderSuggestion[]>(`${this.apiUrl}/reorder-suggestions`);
  }

  /**
   * Check product availability
   */
  checkAvailability(productId: string, quantity: number): Observable<{
    available: boolean;
    stockQuantity: number;
    message?: string;
  }> {
    const params = new HttpParams().set('quantity', quantity.toString());
    return this.http.get<{ available: boolean; stockQuantity: number; message?: string }>(
      `${this.apiUrl}/products/${productId}/availability`,
      { params }
    );
  }

  /**
   * Get customer-specific pricing for products
   */
  getCustomerPricing(productIds: string[]): Observable<Record<string, number>> {
    return this.http.post<Record<string, number>>(
      `${this.apiUrl}/pricing`,
      { productIds }
    );
  }

  /**
   * Clear category cache
   */
  clearCache(): void {
    this.categoriesCache.set([]);
    this.manufacturersCache.set([]);
  }
}
