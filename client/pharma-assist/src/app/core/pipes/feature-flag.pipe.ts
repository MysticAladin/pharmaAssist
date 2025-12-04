import { Pipe, PipeTransform, inject } from '@angular/core';
import { DbFeatureFlagService } from '../services/db-feature-flag.service';
import { SystemFlagKey } from '../models/feature-flag.model';

/**
 * Pipe to check if a feature flag is enabled
 *
 * Usage:
 * ```html
 * <button [disabled]="!('portal.split_invoice' | featureFlagEnabled)">Split Invoice</button>
 * ```
 */
@Pipe({
  name: 'featureFlagEnabled',
  standalone: true,
  pure: false // Impure to react to signal changes
})
export class FeatureFlagEnabledPipe implements PipeTransform {
  private readonly featureFlagService = inject(DbFeatureFlagService);

  transform(key: SystemFlagKey | string): boolean {
    return this.featureFlagService.isEnabled(key);
  }
}

/**
 * Pipe to get a feature flag's value
 *
 * Usage:
 * ```html
 * <span>{{ 'ui.max_items' | featureFlagValue }}</span>
 * <span>{{ 'ui.welcome_message' | featureFlagValue:'Default message' }}</span>
 * ```
 */
@Pipe({
  name: 'featureFlagValue',
  standalone: true,
  pure: false
})
export class FeatureFlagValuePipe implements PipeTransform {
  private readonly featureFlagService = inject(DbFeatureFlagService);

  transform<T = unknown>(key: SystemFlagKey | string, defaultValue?: T): T | null {
    const value = this.featureFlagService.getValue<T>(key);
    return value ?? (defaultValue ?? null);
  }
}
