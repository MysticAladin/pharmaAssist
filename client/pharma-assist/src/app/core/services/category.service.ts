import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Category, CategorySummary, CreateCategoryRequest, UpdateCategoryRequest } from '../models/category.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/categories`;

  getAll(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(this.apiUrl);
  }

  getActive(): Observable<ApiResponse<CategorySummary[]>> {
    // Backend doesn't have /active endpoint, so we get all and filter client-side
    return this.http.get<ApiResponse<Category[]>>(this.apiUrl).pipe(
      map(response => {
        if (!response.success || !response.data) {
          return response as ApiResponse<CategorySummary[]>;
        }
        const activeCategories = response.data
          .filter(cat => cat.isActive)
          .map(cat => ({
            id: cat.id,
            name: cat.name,
            nameLocal: cat.nameLocal
          } as CategorySummary));
        return {
          ...response,
          data: activeCategories
        };
      })
    );
  }

  getById(id: number): Observable<ApiResponse<Category>> {
    return this.http.get<ApiResponse<Category>>(`${this.apiUrl}/${id}`);
  }

  getHierarchy(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(`${this.apiUrl}/hierarchy`);
  }

  create(request: CreateCategoryRequest): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(this.apiUrl, request);
  }

  update(id: number, request: UpdateCategoryRequest): Observable<ApiResponse<Category>> {
    return this.http.put<ApiResponse<Category>>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  toggleActive(id: number): Observable<ApiResponse<Category>> {
    return this.http.patch<ApiResponse<Category>>(`${this.apiUrl}/${id}/toggle-active`, {});
  }
}
