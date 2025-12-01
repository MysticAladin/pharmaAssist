import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { UIStateService } from '../state/ui-state.service';

/**
 * Error types for standardized handling
 */
interface ApiError {
  status: number;
  message: string;
  errors?: string[];
}

/**
 * Error Interceptor - Handles HTTP errors globally
 */
export const errorInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const uiState = inject(UIStateService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const apiError = parseError(error);

      // Don't show toast for 401 (handled by auth interceptor)
      if (error.status !== 401) {
        showErrorNotification(uiState, apiError);
      }

      // Log error for debugging
      console.error('HTTP Error:', {
        url: req.url,
        method: req.method,
        status: error.status,
        message: apiError.message,
        errors: apiError.errors
      });

      return throwError(() => apiError);
    })
  );
};

function parseError(error: HttpErrorResponse): ApiError {
  // Handle network errors
  if (error.status === 0) {
    return {
      status: 0,
      message: 'Nije moguće uspostaviti vezu sa serverom. Provjerite internet konekciju.',
      errors: ['Network error']
    };
  }

  // Handle timeout
  if (error.status === 504) {
    return {
      status: 504,
      message: 'Server ne odgovara. Molimo pokušajte ponovo.',
      errors: ['Gateway timeout']
    };
  }

  // Handle common HTTP errors
  const errorMessages: Record<number, string> = {
    400: 'Nevažeći zahtjev. Provjerite unesene podatke.',
    401: 'Sesija je istekla. Molimo prijavite se ponovo.',
    403: 'Nemate dozvolu za ovu radnju.',
    404: 'Traženi resurs nije pronađen.',
    409: 'Konflikt podataka. Resurs već postoji.',
    422: 'Podaci nisu validni. Provjerite unesene podatke.',
    429: 'Previše zahtjeva. Molimo sačekajte.',
    500: 'Interna greška servera. Molimo pokušajte kasnije.',
    502: 'Server privremeno nedostupan.',
    503: 'Usluga privremeno nedostupna.'
  };

  // Try to extract error message from response body
  let message = errorMessages[error.status] ?? 'Došlo je do neočekivane greške.';
  let errors: string[] = [];

  if (error.error) {
    if (typeof error.error === 'string') {
      message = error.error;
    } else if (error.error.message) {
      message = error.error.message;
    } else if (error.error.title) {
      message = error.error.title;
    }

    if (error.error.errors) {
      if (Array.isArray(error.error.errors)) {
        errors = error.error.errors;
      } else if (typeof error.error.errors === 'object') {
        // Handle validation errors object { field: [errors] }
        errors = Object.values(error.error.errors).flat() as string[];
      }
    }
  }

  return {
    status: error.status,
    message,
    errors
  };
}

function showErrorNotification(uiState: UIStateService, error: ApiError): void {
  // Skip notification for certain status codes
  const silentCodes = [401, 403];
  if (silentCodes.includes(error.status)) {
    return;
  }

  let message = error.message;
  if (error.errors && error.errors.length > 0) {
    message = error.errors.slice(0, 3).join('. ');
    if (error.errors.length > 3) {
      message += `... i još ${error.errors.length - 3} grešaka.`;
    }
  }

  uiState.showError('Greška', message);
}
