import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  RepCustomer,
  RepCustomerCredit,
  RepCustomerOrder,
  RepCustomerVisit,
  RepCustomerFilter,
  RepCustomerResult,
  RepCustomerStats,
  CustomerPhotoArchive
} from '../models/rep-order.model';

@Injectable({
  providedIn: 'root'
})
export class RepCustomerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/customers/rep`;

  /**
   * Get customers assigned to the current sales representative
   */
  getMyCustomers(filter: RepCustomerFilter = {}): Observable<RepCustomerResult> {
    let params = new HttpParams();

    if (filter.search) {
      params = params.set('search', filter.search);
    }
    if (filter.customerType !== undefined) {
      params = params.set('customerType', filter.customerType.toString());
    }
    if (filter.tier !== undefined) {
      params = params.set('tier', filter.tier.toString());
    }
    if (filter.needsVisit !== undefined) {
      params = params.set('needsVisit', filter.needsVisit.toString());
    }
    if (filter.hasCreditWarning !== undefined) {
      params = params.set('hasCreditWarning', filter.hasCreditWarning.toString());
    }
    if (filter.city) {
      params = params.set('city', filter.city);
    }
    if (filter.page !== undefined) {
      params = params.set('page', filter.page.toString());
    }
    if (filter.pageSize !== undefined) {
      params = params.set('pageSize', filter.pageSize.toString());
    }
    if (filter.sortBy) {
      params = params.set('sortBy', filter.sortBy);
    }
    if (filter.sortDescending !== undefined) {
      params = params.set('sortDescending', filter.sortDescending.toString());
    }

    return this.http.get<RepCustomerResult>(`${this.baseUrl}/my-customers`, { params });
  }

  /**
   * Get customer details for an assigned customer
   */
  getCustomerDetails(customerId: number): Observable<RepCustomer> {
    return this.http.get<RepCustomer>(`${this.baseUrl}/${customerId}`);
  }

  /**
   * Get credit status for a customer
   */
  getCustomerCredit(customerId: number): Observable<RepCustomerCredit> {
    return this.http.get<RepCustomerCredit>(`${this.baseUrl}/${customerId}/credit`);
  }

  /**
   * Get recent orders for a customer
   */
  getCustomerOrders(customerId: number, count: number = 10): Observable<RepCustomerOrder[]> {
    const params = new HttpParams().set('count', count.toString());
    return this.http.get<RepCustomerOrder[]>(
      `${this.baseUrl}/${customerId}/orders`,
      { params }
    );
  }

  /**
   * Get visit history for a customer (by this rep)
   */
  getCustomerVisits(customerId: number, count: number = 10): Observable<RepCustomerVisit[]> {
    const params = new HttpParams().set('count', count.toString());
    return this.http.get<RepCustomerVisit[]>(
      `${this.baseUrl}/${customerId}/visits`,
      { params }
    );
  }

  /**
   * Get statistics for rep's assigned customers
   */
  getMyCustomerStats(): Observable<RepCustomerStats> {
    return this.http.get<RepCustomerStats>(`${this.baseUrl}/stats`);
  }

  /**
   * Check if a customer is assigned to the current rep
   */
  isCustomerAssigned(customerId: number): Observable<{ isAssigned: boolean }> {
    return this.http.get<{ isAssigned: boolean }>(`${this.baseUrl}/${customerId}/is-assigned`);
  }

  /**
   * Get photo archive for a customer (images from visit attachments)
   */
  getCustomerPhotos(customerId: number, page: number = 1, pageSize: number = 20): Observable<CustomerPhotoArchive> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<CustomerPhotoArchive>(
      `${this.baseUrl}/${customerId}/photos`,
      { params }
    );
  }
}
