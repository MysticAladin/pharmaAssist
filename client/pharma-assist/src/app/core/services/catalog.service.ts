import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, Manufacturer, CategorySelectOption, ManufacturerSelectOption } from '../models/catalog.model';

interface ApiResponse<T> {
  data?: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // Categories
  getCategories(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(`${this.apiUrl}/categories`);
  }

  getCategoryById(id: number): Observable<ApiResponse<Category>> {
    return this.http.get<ApiResponse<Category>>(`${this.apiUrl}/categories/${id}`);
  }

  getCategoriesForSelect(): Observable<ApiResponse<CategorySelectOption[]>> {
    return this.http.get<ApiResponse<CategorySelectOption[]>>(`${this.apiUrl}/categories/select`);
  }

  createCategory(category: Partial<Category>): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(`${this.apiUrl}/categories`, category);
  }

  updateCategory(id: number, category: Partial<Category>): Observable<ApiResponse<Category>> {
    return this.http.put<ApiResponse<Category>>(`${this.apiUrl}/categories/${id}`, category);
  }

  deleteCategory(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/categories/${id}`);
  }

  // Manufacturers
  getManufacturers(): Observable<ApiResponse<Manufacturer[]>> {
    return this.http.get<ApiResponse<Manufacturer[]>>(`${this.apiUrl}/manufacturers`);
  }

  getManufacturerById(id: number): Observable<ApiResponse<Manufacturer>> {
    return this.http.get<ApiResponse<Manufacturer>>(`${this.apiUrl}/manufacturers/${id}`);
  }

  getManufacturersForSelect(): Observable<ApiResponse<ManufacturerSelectOption[]>> {
    return this.http.get<ApiResponse<ManufacturerSelectOption[]>>(`${this.apiUrl}/manufacturers/select`);
  }

  createManufacturer(manufacturer: Partial<Manufacturer>): Observable<ApiResponse<Manufacturer>> {
    return this.http.post<ApiResponse<Manufacturer>>(`${this.apiUrl}/manufacturers`, manufacturer);
  }

  updateManufacturer(id: number, manufacturer: Partial<Manufacturer>): Observable<ApiResponse<Manufacturer>> {
    return this.http.put<ApiResponse<Manufacturer>>(`${this.apiUrl}/manufacturers/${id}`, manufacturer);
  }

  deleteManufacturer(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/manufacturers/${id}`);
  }
}
