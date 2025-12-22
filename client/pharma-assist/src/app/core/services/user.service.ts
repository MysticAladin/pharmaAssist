import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IUser, UserRole } from '../models/user.model';
import { ApiResponse, PagedResponse } from '../models/product.model';

export interface UserFilters {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  password: string;
  roles: string[];
  isActive: boolean;
}

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  roles: string[];
  isActive: boolean;
}

export interface ResetUserPasswordRequest {
  newPassword: string;
  confirmPassword: string;
}

export interface UserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber?: string;
  roles: string[];
  isActive: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/users`;

  /**
   * Get paginated list of users
   */
  getUsers(filters: UserFilters = {}): Observable<PagedResponse<UserSummary>> {
    let params = new HttpParams();

    if (filters.search) params = params.set('search', filters.search);
    if (filters.role) params = params.set('role', filters.role);
    if (filters.isActive !== undefined) params = params.set('activeOnly', filters.isActive.toString());
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.pageSize) params = params.set('pageSize', filters.pageSize.toString());

    return this.http.get<PagedResponse<UserSummary>>(`${this.apiUrl}/paged`, { params });
  }

  /**
   * Get user by ID
   */
  getUser(id: string): Observable<ApiResponse<IUser>> {
    return this.http.get<ApiResponse<IUser>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new user
   */
  createUser(request: CreateUserRequest): Observable<ApiResponse<IUser>> {
    return this.http.post<ApiResponse<IUser>>(this.apiUrl, request);
  }

  /**
   * Update user
   */
  updateUser(id: string, request: UpdateUserRequest): Observable<ApiResponse<IUser>> {
    return this.http.put<ApiResponse<IUser>>(`${this.apiUrl}/${id}`, request);
  }

  /**
   * Delete user (soft delete)
   */
  deleteUser(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Activate user
   */
  activateUser(id: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/${id}/activate`, {});
  }

  /**
   * Deactivate user
   */
  deactivateUser(id: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  /**
   * Reset user password (admin action)
   */
  resetUserPassword(id: string, request: ResetUserPasswordRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/${id}/reset-password`, request);
  }

  /**
   * Get available roles
   */
  getRoles(): Observable<ApiResponse<{ name: string; description: string }[]>> {
    return this.http.get<ApiResponse<{ name: string; description: string }[]>>(`${this.apiUrl}/roles`);
  }

  /**
   * Update user roles
   */
  updateUserRoles(id: string, roles: string[]): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.apiUrl}/${id}/roles`, { roles });
  }
}
