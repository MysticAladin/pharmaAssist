import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResponse } from '../models/product.model';
import {
  Brand,
  BrandSummary,
  CreateBrandRequest,
  UpdateBrandRequest,
  BrandGroup,
  CreateBrandGroupRequest,
  UpdateBrandGroupRequest,
  ProductDocument,
  CreateProductDocumentRequest,
  KnowledgeArticle,
  KnowledgeArticleSummary,
  CreateKnowledgeArticleRequest,
  UpdateKnowledgeArticleRequest,
  ProductPromotionReport,
  BrandFilters,
  KnowledgeFilters
} from '../models/brand.model';

@Injectable({
  providedIn: 'root'
})
export class BrandService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/brands`;

  // ── Brand CRUD ──

  getById(id: number): Observable<ApiResponse<Brand>> {
    return this.http.get<ApiResponse<Brand>>(`${this.apiUrl}/${id}`);
  }

  getPaged(filters: BrandFilters): Observable<PagedResponse<BrandSummary>> {
    let params = new HttpParams()
      .set('page', filters.page.toString())
      .set('pageSize', filters.pageSize.toString());

    if (filters.search) params = params.set('search', filters.search);
    if (filters.manufacturerId) params = params.set('manufacturerId', filters.manufacturerId.toString());
    if (filters.activeOnly !== undefined) params = params.set('activeOnly', filters.activeOnly.toString());
    if (filters.therapeuticArea) params = params.set('therapeuticArea', filters.therapeuticArea);
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortDirection) params = params.set('sortDirection', filters.sortDirection);

    return this.http.get<PagedResponse<BrandSummary>>(`${this.apiUrl}/paged`, { params });
  }

  getByManufacturer(manufacturerId: number): Observable<ApiResponse<BrandSummary[]>> {
    return this.http.get<ApiResponse<BrandSummary[]>>(`${this.apiUrl}/by-manufacturer/${manufacturerId}`);
  }

  create(brand: CreateBrandRequest): Observable<ApiResponse<Brand>> {
    return this.http.post<ApiResponse<Brand>>(this.apiUrl, brand);
  }

  update(id: number, brand: UpdateBrandRequest): Observable<ApiResponse<Brand>> {
    return this.http.put<ApiResponse<Brand>>(`${this.apiUrl}/${id}`, brand);
  }

  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }

  activate(id: number): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/${id}/activate`, {});
  }

  deactivate(id: number): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  // ── Brand Groups ──

  getAllGroups(): Observable<ApiResponse<BrandGroup[]>> {
    return this.http.get<ApiResponse<BrandGroup[]>>(`${this.apiUrl}/groups`);
  }

  getGroupById(id: number): Observable<ApiResponse<BrandGroup>> {
    return this.http.get<ApiResponse<BrandGroup>>(`${this.apiUrl}/groups/${id}`);
  }

  createGroup(group: CreateBrandGroupRequest): Observable<ApiResponse<BrandGroup>> {
    return this.http.post<ApiResponse<BrandGroup>>(`${this.apiUrl}/groups`, group);
  }

  updateGroup(id: number, group: UpdateBrandGroupRequest): Observable<ApiResponse<BrandGroup>> {
    return this.http.put<ApiResponse<BrandGroup>>(`${this.apiUrl}/groups/${id}`, group);
  }

  deleteGroup(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/groups/${id}`);
  }

  addBrandToGroup(groupId: number, brandId: number): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/groups/${groupId}/brands/${brandId}`, {});
  }

  removeBrandFromGroup(groupId: number, brandId: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/groups/${groupId}/brands/${brandId}`);
  }

  // ── Product Documents ──

  getProductDocuments(productId: number): Observable<ApiResponse<ProductDocument[]>> {
    return this.http.get<ApiResponse<ProductDocument[]>>(`${environment.apiUrl}/products/${productId}/documents`);
  }

  createProductDocument(productId: number, doc: CreateProductDocumentRequest): Observable<ApiResponse<ProductDocument>> {
    return this.http.post<ApiResponse<ProductDocument>>(`${environment.apiUrl}/products/${productId}/documents`, doc);
  }

  deleteProductDocument(documentId: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${environment.apiUrl}/products/documents/${documentId}`);
  }

  getDocumentVersionHistory(productId: number, documentType: number): Observable<ApiResponse<ProductDocument[]>> {
    return this.http.get<ApiResponse<ProductDocument[]>>(
      `${environment.apiUrl}/products/${productId}/documents/history/${documentType}`
    );
  }

  // ── Knowledge Articles ──

  getKnowledgeArticle(id: number): Observable<ApiResponse<KnowledgeArticle>> {
    return this.http.get<ApiResponse<KnowledgeArticle>>(`${environment.apiUrl}/knowledge/${id}`);
  }

  getKnowledgeArticlesPaged(filters: KnowledgeFilters): Observable<PagedResponse<KnowledgeArticleSummary>> {
    let params = new HttpParams()
      .set('page', filters.page.toString())
      .set('pageSize', filters.pageSize.toString());

    if (filters.search) params = params.set('search', filters.search);
    if (filters.productId) params = params.set('productId', filters.productId.toString());
    if (filters.brandId) params = params.set('brandId', filters.brandId.toString());
    if (filters.category !== undefined) params = params.set('category', filters.category.toString());
    if (filters.publishedOnly !== undefined) params = params.set('publishedOnly', filters.publishedOnly.toString());

    return this.http.get<PagedResponse<KnowledgeArticleSummary>>(`${environment.apiUrl}/knowledge`, { params });
  }

  createKnowledgeArticle(article: CreateKnowledgeArticleRequest): Observable<ApiResponse<KnowledgeArticle>> {
    return this.http.post<ApiResponse<KnowledgeArticle>>(`${environment.apiUrl}/knowledge`, article);
  }

  updateKnowledgeArticle(id: number, article: UpdateKnowledgeArticleRequest): Observable<ApiResponse<KnowledgeArticle>> {
    return this.http.put<ApiResponse<KnowledgeArticle>>(`${environment.apiUrl}/knowledge/${id}`, article);
  }

  deleteKnowledgeArticle(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${environment.apiUrl}/knowledge/${id}`);
  }

  // ── Promotion Reports ──

  getProductPromotionReport(fromDate?: string, toDate?: string, productId?: number, brandId?: number): Observable<ApiResponse<ProductPromotionReport[]>> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    if (productId) params = params.set('productId', productId.toString());
    if (brandId) params = params.set('brandId', brandId.toString());

    return this.http.get<ApiResponse<ProductPromotionReport[]>>(`${environment.apiUrl}/reports/product-promotion`, { params });
  }
}
