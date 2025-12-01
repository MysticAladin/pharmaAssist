import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthStateService } from '../state/auth-state.service';
import { FeatureFlagService } from '../state/feature-flag.service';
import { FeatureKey } from '../models/feature-flag.model';
import { UIStateService } from '../state/ui-state.service';

/**
 * Guard to protect routes that require specific feature access
 * Used for tier-based feature gating (upselling)
 *
 * Usage in route config:
 * {
 *   path: 'analytics/advanced',
 *   canActivate: [featureGuard],
 *   data: { feature: FeatureKey.AdvancedAnalytics }
 * }
 */
export const featureGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authState = inject(AuthStateService);
  const featureFlags = inject(FeatureFlagService);
  const uiState = inject(UIStateService);
  const router = inject(Router);

  // First check if user is authenticated
  if (!authState.isAuthenticated()) {
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Get required feature from route data
  const requiredFeature = route.data['feature'] as FeatureKey;

  if (!requiredFeature) {
    // No feature specified, allow access if authenticated
    return true;
  }

  // Check feature access
  if (featureFlags.isFeatureEnabled(requiredFeature)) {
    return true;
  }

  // Feature not available - show upsell notification and redirect
  const metadata = featureFlags.getFeatureMetadata(requiredFeature);
  const requiredTier = metadata?.tier || 'upgraded';

  uiState.showInfo('Premium Feature', `${metadata?.name || 'This feature'} requires a ${requiredTier} plan.`);

  // Redirect to upgrade page with feature info
  router.navigate(['/upgrade'], {
    queryParams: {
      feature: requiredFeature,
      returnUrl: state.url
    }
  });

  return false;
};

/**
 * Guard for multiple features (requires ANY of the specified features)
 *
 * Usage in route config:
 * {
 *   path: 'reports',
 *   canActivate: [anyFeatureGuard],
 *   data: { features: [FeatureKey.AdvancedAnalytics, FeatureKey.CustomReports] }
 * }
 */
export const anyFeatureGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authState = inject(AuthStateService);
  const featureFlags = inject(FeatureFlagService);
  const uiState = inject(UIStateService);
  const router = inject(Router);

  if (!authState.isAuthenticated()) {
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  const requiredFeatures = route.data['features'] as FeatureKey[];

  if (!requiredFeatures || requiredFeatures.length === 0) {
    return true;
  }

  // Check if user has access to ANY of the features
  const hasAnyFeature = requiredFeatures.some(feature =>
    featureFlags.isFeatureEnabled(feature)
  );

  if (hasAnyFeature) {
    return true;
  }

  // Show upgrade prompt
  uiState.showInfo(
    'Premium Features Required',
    'This section requires an upgraded plan. Upgrade to unlock more features!'
  );

  router.navigate(['/upgrade'], {
    queryParams: {
      features: requiredFeatures.join(','),
      returnUrl: state.url
    }
  });

  return false;
};

/**
 * Guard for multiple features (requires ALL of the specified features)
 */
export const allFeaturesGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authState = inject(AuthStateService);
  const featureFlags = inject(FeatureFlagService);
  const uiState = inject(UIStateService);
  const router = inject(Router);

  if (!authState.isAuthenticated()) {
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  const requiredFeatures = route.data['features'] as FeatureKey[];

  if (!requiredFeatures || requiredFeatures.length === 0) {
    return true;
  }

  // Check if user has access to ALL features
  const missingFeatures = requiredFeatures.filter(feature =>
    !featureFlags.isFeatureEnabled(feature)
  );

  if (missingFeatures.length === 0) {
    return true;
  }

  // Show specific missing features in upsell
  const firstMissing = missingFeatures[0];
  const metadata = featureFlags.getFeatureMetadata(firstMissing);

  uiState.showInfo(
    'Additional Features Required',
    `${metadata?.name || 'Additional features'} and ${missingFeatures.length - 1} more required. Upgrade your plan!`
  );

  router.navigate(['/upgrade'], {
    queryParams: {
      features: missingFeatures.join(','),
      returnUrl: state.url
    }
  });

  return false;
};

/**
 * Specific guard for API access feature
 */
export const apiAccessGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authState = inject(AuthStateService);
  const featureFlags = inject(FeatureFlagService);
  const uiState = inject(UIStateService);
  const router = inject(Router);

  if (!authState.isAuthenticated()) {
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  if (featureFlags.isFeatureEnabled(FeatureKey.ApiAccess)) {
    return true;
  }

  uiState.showInfo(
    'API Access Required',
    'API access is available on Professional and Enterprise plans. Upgrade to integrate with external systems!'
  );

  router.navigate(['/upgrade'], {
    queryParams: {
      feature: FeatureKey.ApiAccess,
      returnUrl: state.url
    }
  });

  return false;
};
