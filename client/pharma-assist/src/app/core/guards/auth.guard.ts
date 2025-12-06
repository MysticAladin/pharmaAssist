import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthStateService } from '../state/auth-state.service';
import { UserRole } from '../models/user.model';

/**
 * Guard to protect routes that require authentication
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  if (authState.isAuthenticated()) {
    return true;
  }

  // Store the attempted URL for redirecting after login
  router.navigate(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });

  return false;
};

/**
 * Guard to prevent authenticated users from accessing auth pages (login, register)
 */
export const noAuthGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  if (!authState.isAuthenticated()) {
    return true;
  }

  // Redirect customers to portal, others to dashboard
  if (authState.hasRole(UserRole.Customer) && !authState.hasAnyRole([UserRole.Admin, UserRole.Manager])) {
    router.navigate(['/portal']);
  } else {
    router.navigate(['/dashboard']);
  }

  return false;
};

/**
 * Guard to allow only customers to access portal routes
 */
export const customerGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  if (!authState.isAuthenticated()) {
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Allow customers, or admins/managers who might need to view portal
  if (authState.hasRole(UserRole.Customer) || authState.hasAnyRole([UserRole.Admin, UserRole.Manager])) {
    return true;
  }

  // Redirect non-customers to dashboard
  router.navigate(['/dashboard']);
  return false;
};
