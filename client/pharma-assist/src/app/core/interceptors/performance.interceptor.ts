import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap, finalize } from 'rxjs';
import { PerformanceService } from '../services/performance.service';
import { CacheService } from '../services/cache.service';

/**
 * HTTP Performance Interceptor
 * Tracks API request performance and manages caching
 */
export const performanceInterceptor: HttpInterceptorFn = (req, next) => {
  const performanceService = inject(PerformanceService);
  const cacheService = inject(CacheService);

  // Skip non-GET requests for caching
  const isGetRequest = req.method === 'GET';
  const startTime = performance.now();

  // Generate cache key for GET requests
  const cacheKey = isGetRequest
    ? cacheService.generateKey(req.url, Object.fromEntries(req.params.keys().map(k => [k, req.params.get(k)])))
    : null;

  // Check cache for GET requests
  if (isGetRequest && cacheKey) {
    const cached = cacheService.get(cacheKey);
    if (cached) {
      // Return cached response
      return new Promise((resolve) => {
        resolve(new HttpResponse({
          body: cached,
          status: 200,
          statusText: 'OK (cached)'
        }));
      }) as any;
    }
  }

  // Extract endpoint name for metrics
  const endpoint = extractEndpoint(req.url);

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse && isGetRequest && cacheKey) {
          // Cache successful GET responses
          const config = cacheService.getConfigForEndpoint(endpoint);
          cacheService.set(cacheKey, event.body, config, [endpoint]);
        }
      }
    }),
    finalize(() => {
      // Track performance
      performanceService.trackApiRequest(
        endpoint,
        startTime,
        true // Assume success - errors are handled separately
      );
    })
  );
};

/**
 * Extract endpoint name from URL for metrics
 */
function extractEndpoint(url: string): string {
  try {
    const urlObj = new URL(url, window.location.origin);
    // Get path segments after /api/
    const path = urlObj.pathname;
    const apiIndex = path.indexOf('/api/');
    if (apiIndex !== -1) {
      const endpoint = path.substring(apiIndex + 5).split('/')[0];
      return endpoint || 'unknown';
    }
    return path.split('/').filter(Boolean)[0] || 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Error tracking interceptor
 */
export const errorTrackingInterceptor: HttpInterceptorFn = (req, next) => {
  const performanceService = inject(PerformanceService);
  const startTime = performance.now();
  const endpoint = extractEndpoint(req.url);

  return next(req).pipe(
    tap({
      error: () => {
        performanceService.trackApiRequest(endpoint, startTime, false);
      }
    })
  );
};
