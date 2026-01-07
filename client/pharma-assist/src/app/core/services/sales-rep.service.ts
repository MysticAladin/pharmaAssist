import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  SalesRepresentative,
  SalesRepresentativeSummary,
  CreateSalesRepresentative,
  UpdateSalesRepresentative,
  UpdateManagerAssignments,
  AssignCustomers,
  CustomerAssignment,
  RepHierarchy,
  PagedSalesReps,
  SalesRepQuery,
  RepresentativeType,
  RepresentativeStatus
} from '../models/sales-rep.model';

@Injectable({
  providedIn: 'root'
})
export class SalesRepService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/salesreps`;

  /**
   * Get paginated sales representatives with filters
   */
  getAll(query: SalesRepQuery = {}): Observable<PagedSalesReps> {
    let params = new HttpParams();

    if (query.search) {
      params = params.set('search', query.search);
    }
    if (query.repType !== undefined) {
      params = params.set('repType', query.repType.toString());
    }
    if (query.status !== undefined) {
      params = params.set('status', query.status.toString());
    }
    if (query.managerId !== undefined) {
      params = params.set('managerId', query.managerId.toString());
    }
    if (query.pageNumber !== undefined) {
      params = params.set('pageNumber', query.pageNumber.toString());
    }
    if (query.pageSize !== undefined) {
      params = params.set('pageSize', query.pageSize.toString());
    }
    if (query.sortBy) {
      params = params.set('sortBy', query.sortBy);
    }
    if (query.sortDescending !== undefined) {
      params = params.set('sortDescending', query.sortDescending.toString());
    }

    return this.http.get<PagedSalesReps>(this.apiUrl, { params });
  }

  /**
   * Get sales representative by ID
   */
  getById(id: number): Observable<SalesRepresentative> {
    return this.http.get<SalesRepresentative>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get sales representative by user ID
   */
  getByUserId(userId: string): Observable<SalesRepresentative> {
    return this.http.get<SalesRepresentative>(`${this.apiUrl}/by-user/${userId}`);
  }

  /**
   * Create a new sales representative
   */
  create(data: CreateSalesRepresentative): Observable<SalesRepresentative> {
    return this.http.post<SalesRepresentative>(this.apiUrl, data);
  }

  /**
   * Update an existing sales representative
   */
  update(id: number, data: UpdateSalesRepresentative): Observable<SalesRepresentative> {
    return this.http.put<SalesRepresentative>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Delete a sales representative
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get all managers
   */
  getManagers(repType?: RepresentativeType): Observable<SalesRepresentativeSummary[]> {
    let params = new HttpParams();
    if (repType !== undefined) {
      params = params.set('repType', repType.toString());
    }
    return this.http.get<SalesRepresentativeSummary[]>(`${this.apiUrl}/managers`, { params });
  }

  /**
   * Update manager assignments for a sales representative
   */
  updateManagerAssignments(repId: number, data: UpdateManagerAssignments): Observable<SalesRepresentative> {
    return this.http.put<SalesRepresentative>(`${this.apiUrl}/${repId}/managers`, data);
  }

  /**
   * Get customer assignments for a sales representative
   */
  getCustomerAssignments(repId: number): Observable<CustomerAssignment[]> {
    return this.http.get<CustomerAssignment[]>(`${this.apiUrl}/${repId}/customers`);
  }

  /**
   * Assign customers to a sales representative
   */
  assignCustomers(repId: number, data: AssignCustomers): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${repId}/customers`, data);
  }

  /**
   * Remove customer assignments from a sales representative
   */
  removeCustomerAssignments(repId: number, customerIds: number[]): Observable<void> {
    return this.http.request<void>('DELETE', `${this.apiUrl}/${repId}/customers`, {
      body: customerIds
    });
  }

  /**
   * Get hierarchy view (managers and their teams)
   */
  getHierarchy(repType?: RepresentativeType): Observable<RepHierarchy[]> {
    let params = new HttpParams();
    if (repType !== undefined) {
      params = params.set('repType', repType.toString());
    }
    return this.http.get<RepHierarchy[]>(`${this.apiUrl}/hierarchy`, { params });
  }

  /**
   * Get representative type display name
   */
  getRepTypeName(repType: RepresentativeType): string {
    switch (repType) {
      case RepresentativeType.Commercial:
        return 'Commercial';
      case RepresentativeType.Medical:
        return 'Medical';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get status display name
   */
  getStatusName(status: RepresentativeStatus): string {
    switch (status) {
      case RepresentativeStatus.Active:
        return 'Active';
      case RepresentativeStatus.Inactive:
        return 'Inactive';
      case RepresentativeStatus.OnLeave:
        return 'On Leave';
      case RepresentativeStatus.Terminated:
        return 'Terminated';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get status CSS class
   */
  getStatusClass(status: RepresentativeStatus): string {
    switch (status) {
      case RepresentativeStatus.Active:
        return 'status-active';
      case RepresentativeStatus.Inactive:
        return 'status-inactive';
      case RepresentativeStatus.OnLeave:
        return 'status-warning';
      case RepresentativeStatus.Terminated:
        return 'status-danger';
      default:
        return '';
    }
  }
}
