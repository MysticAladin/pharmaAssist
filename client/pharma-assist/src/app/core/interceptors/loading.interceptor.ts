import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { UIStateService } from '../state/ui-state.service';

/**
 * Endpoints that should NOT trigger global loading indicator
 */
const SILENT_ENDPOINTS = [
  '/api/health',
  '/api/notifications',
  '/api/auth/refresh-token'
];

/**
 * Loading Interceptor - Shows global loading indicator for API calls
 */
export const loadingInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const uiState = inject(UIStateService);

  // Check if this is a silent request
  const isSilent = SILENT_ENDPOINTS.some(endpoint => req.url.includes(endpoint));

  // Check for custom header to skip loading
  const skipLoading = req.headers.has('X-Skip-Loading');

  if (isSilent || skipLoading) {
    // Remove custom header before sending
    const cleanReq = req.clone({
      headers: req.headers.delete('X-Skip-Loading')
    });
    return next(cleanReq);
  }

  // Start loading
  uiState.startLoading();

  return next(req).pipe(
    finalize(() => {
      uiState.stopLoading();
    })
  );
};
