import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthStateService } from '../state/auth-state.service';
import { UserRole } from '../models/user.model';

/**
 * Guard to protect routes that require specific roles
 * Usage in route config:
 * {
 *   path: 'admin',
 *   canActivate: [roleGuard],
 *   data: { roles: [UserRole.Admin, UserRole.SuperAdmin] }
 * }
 */
export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  // First check if user is authenticated
  if (!authState.isAuthenticated()) {
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Get required roles from route data
  const requiredRoles = route.data['roles'] as UserRole[];

  if (!requiredRoles || requiredRoles.length === 0) {
    // No roles specified, allow access if authenticated
    return true;
  }

  // Check if user has any of the required roles
  if (authState.hasAnyRole(requiredRoles)) {
    return true;
  }

  // User doesn't have required role, redirect to access denied
  router.navigate(['/access-denied']);
  return false;
};

/**
 * Guard that requires ALL specified roles (for multi-role requirements)
 * Usage in route config:
 * {
 *   path: 'special',
 *   canActivate: [allRolesGuard],
 *   data: { roles: [UserRole.Admin, UserRole.Manager] }
 * }
 */
export const allRolesGuard: CanActivateFn = (
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

  const requiredRoles = route.data['roles'] as UserRole[];

  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  // Check if user has ALL required roles (rarely used but available)
  const userRoles = authState.userRoles();
  const hasAllRoles = requiredRoles.every(role => userRoles.includes(role));

  if (hasAllRoles) {
    return true;
  }

  router.navigate(['/access-denied']);
  return false;
};

/**
 * Guard specifically for admin routes
 */
export const adminGuard: CanActivateFn = (
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

  if (authState.hasAnyRole([UserRole.SuperAdmin, UserRole.Admin])) {
    return true;
  }

  router.navigate(['/access-denied']);
  return false;
};

/**
 * Guard specifically for management routes (Admin, SuperAdmin, Manager)
 */
export const managementGuard: CanActivateFn = (
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

  if (authState.hasAnyRole([UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager])) {
    return true;
  }

  router.navigate(['/access-denied']);
  return false;
};

/**
 * Guard specifically for internal staff (not customers)
 */
export const staffGuard: CanActivateFn = (
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

  // All roles except Customer
  if (!authState.hasRole(UserRole.Customer)) {
    return true;
  }

  router.navigate(['/access-denied']);
  return false;
};
