import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Customer,
  CustomerSummary,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  ApiResponse,
  PagedResponse,
  CustomerFilters
} from '../models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/customers`;

  /**
   * Get all customers
   */
  getAll(): Observable<ApiResponse<Customer[]>> {
    return this.http.get<ApiResponse<Customer[]>>(this.apiUrl);
  }

  /**
   * Get paginated customers with filters
   */
  getPaged(filters: CustomerFilters): Observable<PagedResponse<CustomerSummary>> {
    let params = new HttpParams()
      .set('page', filters.page.toString())
      .set('pageSize', filters.pageSize.toString());

    if (filters.search) {
      params = params.set('search', filters.search);
    }
    if (filters.customerType !== undefined) {
      params = params.set('customerType', filters.customerType.toString());
    }
    if (filters.tier !== undefined) {
      params = params.set('tier', filters.tier.toString());
    }
    if (filters.activeOnly !== undefined) {
      params = params.set('activeOnly', filters.activeOnly.toString());
    }

    return this.http.get<PagedResponse<CustomerSummary>>(`${this.apiUrl}/paged`, { params });
  }

  /**
   * Get customer by ID
   */
  getById(id: number): Observable<ApiResponse<Customer>> {
    return this.http.get<ApiResponse<Customer>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get customer by code
   */
  getByCode(code: string): Observable<ApiResponse<Customer>> {
    return this.http.get<ApiResponse<Customer>>(`${this.apiUrl}/by-code/${code}`);
  }

  /**
   * Get customer summaries for dropdowns
   */
  getSummaries(): Observable<ApiResponse<CustomerSummary[]>> {
    return this.http.get<ApiResponse<CustomerSummary[]>>(`${this.apiUrl}/summaries`);
  }

  /**
   * Create a new customer
   */
  create(customer: CreateCustomerRequest): Observable<ApiResponse<Customer>> {
    return this.http.post<ApiResponse<Customer>>(this.apiUrl, customer);
  }

  /**
   * Update an existing customer
   */
  update(id: number, customer: UpdateCustomerRequest): Observable<ApiResponse<Customer>> {
    return this.http.put<ApiResponse<Customer>>(`${this.apiUrl}/${id}`, customer);
  }

  /**
   * Delete a customer
   */
  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Activate a customer
   */
  activate(id: number): Observable<ApiResponse<Customer>> {
    return this.http.patch<ApiResponse<Customer>>(`${this.apiUrl}/${id}/activate`, {});
  }

  /**
   * Deactivate a customer
   */
  deactivate(id: number): Observable<ApiResponse<Customer>> {
    return this.http.patch<ApiResponse<Customer>>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  /**
   * Get customer order history
   */
  getOrderHistory(id: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/${id}/orders`);
  }
}
