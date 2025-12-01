import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, tap, throwError, BehaviorSubject, filter, take, switchMap } from 'rxjs';
import {
  ILoginRequest,
  ILoginResponse,
  IRefreshTokenRequest,
  IUser
} from '../models/user.model';
import { AuthStateService } from '../state/auth-state.service';
import { environment } from '../../../environments/environment';

// Simple response wrapper for non-auth endpoints
interface ISimpleResponse {
  succeeded: boolean;
  message?: string;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // Token refresh state to prevent multiple simultaneous refresh attempts
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  /**
   * Attempt to log in with credentials
   */
  login(request: ILoginRequest): Observable<ILoginResponse> {
    return this.http.post<ILoginResponse>(
      `${this.apiUrl}/login`,
      request
    ).pipe(
      tap(response => {
        if (response.succeeded && response.user && response.accessToken) {
          this.authState.login(response, request.rememberMe);
        }
      }),
      catchError(error => {
        console.error('Login failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Register a new user
   */
  register(request: {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
  }): Observable<ILoginResponse> {
    return this.http.post<ILoginResponse>(
      `${this.apiUrl}/register`,
      request
    ).pipe(
      tap(response => {
        if (response.succeeded && response.user && response.accessToken) {
          this.authState.login(response);
        }
      })
    );
  }

  /**
   * Log out the current user
   */
  logout(): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/logout`,
      {}
    ).pipe(
      tap(() => {
        this.authState.logout();
        this.router.navigate(['/auth/login']);
      }),
      catchError(error => {
        // Still log out locally even if API call fails
        this.authState.logout();
        this.router.navigate(['/auth/login']);
        return throwError(() => error);
      })
    );
  }

  /**
   * Silently log out (clear state without API call)
   */
  silentLogout(): void {
    this.authState.logout();
    this.router.navigate(['/auth/login']);
  }

  /**
   * Refresh the access token using refresh token
   */
  refreshToken(): Observable<ILoginResponse> {
    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(() => this.getCurrentUser())
      );
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    const accessToken = this.authState.getToken();
    const refreshToken = this.authState.getRefreshToken();

    if (!refreshToken || !accessToken) {
      this.isRefreshing = false;
      this.authState.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    const request: IRefreshTokenRequest = { accessToken, refreshToken };

    return this.http.post<ILoginResponse>(
      `${this.apiUrl}/refresh-token`,
      request
    ).pipe(
      tap(response => {
        this.isRefreshing = false;
        if (response.succeeded && response.accessToken) {
          this.authState.updateToken(response.accessToken, response.refreshToken);
          this.refreshTokenSubject.next(response.accessToken);
        }
      }),
      catchError(error => {
        this.isRefreshing = false;
        this.authState.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Request password reset email
   */
  forgotPassword(email: string): Observable<ISimpleResponse> {
    return this.http.post<ISimpleResponse>(
      `${this.apiUrl}/forgot-password`,
      { email }
    );
  }

  /**
   * Reset password with token from email
   */
  resetPassword(request: {
    email: string;
    token: string;
    newPassword: string;
    confirmPassword: string;
  }): Observable<ISimpleResponse> {
    return this.http.post<ISimpleResponse>(
      `${this.apiUrl}/reset-password`,
      request
    );
  }

  /**
   * Change password for authenticated user
   */
  changePassword(request: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Observable<ISimpleResponse> {
    return this.http.post<ISimpleResponse>(
      `${this.apiUrl}/change-password`,
      request
    );
  }

  /**
   * Get current user profile
   */
  getCurrentUser(): Observable<ILoginResponse> {
    return this.http.get<ILoginResponse>(`${this.apiUrl}/me`);
  }

  /**
   * Initialize auth state from stored tokens (call on app startup)
   */
  initializeAuth(): void {
    this.authState.initializeFromStorage();

    // If we have a token, try to get fresh user data
    if (this.authState.isAuthenticated()) {
      this.getCurrentUser().pipe(
        catchError(error => {
          // Token might be expired, try refresh
          if (error.status === 401) {
            return this.refreshToken();
          }
          return throwError(() => error);
        })
      ).subscribe({
        error: () => {
          // If all fails, log out
          this.silentLogout();
        }
      });
    }
  }

  /**
   * Check if token needs refresh (called by interceptor)
   */
  shouldRefreshToken(): boolean {
    const token = this.authState.getToken();
    if (!token) return false;

    try {
      // Decode JWT to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();

      // Refresh if token expires in less than 5 minutes
      return exp - now < 5 * 60 * 1000;
    } catch {
      return false;
    }
  }

  /**
   * Get current access token
   */
  getToken(): string | null {
    return this.authState.getToken();
  }
}
