import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthStateService } from '../state/auth-state.service';
import { AuthService } from '../services/auth.service';

/**
 * Auth Interceptor - Adds JWT token to requests and handles token refresh
 */
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authState = inject(AuthStateService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip auth header for public endpoints
  const publicEndpoints = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/refresh-token'
  ];

  const isPublicEndpoint = publicEndpoints.some(endpoint => req.url.includes(endpoint));

  if (isPublicEndpoint) {
    return next(req);
  }

  const token = authState.getToken();

  if (token) {
    req = addAuthHeader(req, token);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized - try to refresh token
      if (error.status === 401 && !req.url.includes('/refresh-token')) {
        const refreshToken = authState.getRefreshToken();

        if (refreshToken && token) {
          return authService.refreshToken().pipe(
            switchMap(response => {
              if (response.succeeded && response.accessToken) {
                authState.updateToken(response.accessToken, response.refreshToken);
                const newReq = addAuthHeader(req, response.accessToken);
                return next(newReq);
              }
              return throwError(() => new Error('Token refresh failed'));
            }),
            catchError(refreshError => {
              // Refresh failed - logout and redirect
              authState.clearAuthState();
              router.navigate(['/auth/login']);
              return throwError(() => refreshError);
            })
          );
        } else {
          // No refresh token - logout
          authState.clearAuthState();
          router.navigate(['/auth/login']);
        }
      }

      return throwError(() => error);
    })
  );
};

function addAuthHeader(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}
