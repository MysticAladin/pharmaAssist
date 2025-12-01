import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthStateService } from '../state/auth-state.service';
import { Permission } from '../models/user.model';

/**
 * Guard to protect routes that require specific permissions
 * Usage in route config:
 * {
 *   path: 'products/create',
 *   canActivate: [permissionGuard],
 *   data: { permissions: [Permission.ProductsCreate] }
 * }
 */
export const permissionGuard: CanActivateFn = (
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

  // Get required permissions from route data
  const requiredPermissions = route.data['permissions'] as Permission[];
  const requireAll = route.data['requireAllPermissions'] as boolean ?? false;

  if (!requiredPermissions || requiredPermissions.length === 0) {
    // No permissions specified, allow access if authenticated
    return true;
  }

  // Check permissions based on requireAll flag
  let hasAccess: boolean;

  if (requireAll) {
    hasAccess = authState.hasAllPermissions(requiredPermissions);
  } else {
    hasAccess = authState.hasAnyPermission(requiredPermissions);
  }

  if (hasAccess) {
    return true;
  }

  // User doesn't have required permissions, redirect to access denied
  router.navigate(['/access-denied']);
  return false;
};

/**
 * Guard that requires ALL specified permissions
 * Usage in route config:
 * {
 *   path: 'admin/users',
 *   canActivate: [allPermissionsGuard],
 *   data: { permissions: [Permission.UsersView, Permission.UsersManage] }
 * }
 */
export const allPermissionsGuard: CanActivateFn = (
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

  const requiredPermissions = route.data['permissions'] as Permission[];

  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  if (authState.hasAllPermissions(requiredPermissions)) {
    return true;
  }

  router.navigate(['/access-denied']);
  return false;
};

/**
 * Guard for viewing resources (generic view permission check)
 * Expects route data: { resource: 'products' } -> checks 'products.view' permission
 */
export const viewResourceGuard: CanActivateFn = (
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

  const resource = route.data['resource'] as string;

  if (!resource) {
    return true;
  }

  const permission = `${resource}.view` as Permission;

  if (authState.hasPermission(permission)) {
    return true;
  }

  router.navigate(['/access-denied']);
  return false;
};

/**
 * Guard for creating resources
 * Expects route data: { resource: 'products' } -> checks 'products.create' permission
 */
export const createResourceGuard: CanActivateFn = (
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

  const resource = route.data['resource'] as string;

  if (!resource) {
    return true;
  }

  const permission = `${resource}.create` as Permission;

  if (authState.hasPermission(permission)) {
    return true;
  }

  router.navigate(['/access-denied']);
  return false;
};

/**
 * Guard for editing resources
 * Expects route data: { resource: 'products' } -> checks 'products.edit' permission
 */
export const editResourceGuard: CanActivateFn = (
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

  const resource = route.data['resource'] as string;

  if (!resource) {
    return true;
  }

  const permission = `${resource}.edit` as Permission;

  if (authState.hasPermission(permission)) {
    return true;
  }

  router.navigate(['/access-denied']);
  return false;
};
