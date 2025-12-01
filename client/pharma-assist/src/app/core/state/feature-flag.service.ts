import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  FeatureKey,
  FeatureTier,
  TIER_FEATURES,
  FEATURE_METADATA,
  IFeatureFlag
} from '../models/feature-flag.model';

const STORAGE_KEY = 'pa_feature_flags';

@Injectable({
  providedIn: 'root'
})
export class FeatureFlagService {
  // Current subscription tier
  private readonly _currentTier$ = new BehaviorSubject<FeatureTier>(FeatureTier.Professional);

  // Custom feature overrides (from server or local config)
  private readonly _featureOverrides$ = new BehaviorSubject<Map<string, boolean>>(new Map());

  // Signals for template reactivity
  readonly currentTier = signal<FeatureTier>(FeatureTier.Professional);

  // Computed enabled features based on tier
  readonly enabledFeatures = computed(() => {
    return TIER_FEATURES[this.currentTier()] ?? [];
  });

  // Observables
  readonly currentTier$: Observable<FeatureTier> = this._currentTier$.asObservable();

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Load feature flags from storage
   */
  private loadFromStorage(): void {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.tier) {
          this._currentTier$.next(data.tier as FeatureTier);
          this.currentTier.set(data.tier as FeatureTier);
        }
        if (data.overrides) {
          this._featureOverrides$.next(new Map(Object.entries(data.overrides)));
        }
      } catch {
        console.warn('Failed to parse feature flags from storage');
      }
    }
  }

  /**
   * Save feature flags to storage
   */
  private saveToStorage(): void {
    const data = {
      tier: this._currentTier$.getValue(),
      overrides: Object.fromEntries(this._featureOverrides$.getValue())
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  /**
   * Set the subscription tier
   */
  setTier(tier: FeatureTier): void {
    this._currentTier$.next(tier);
    this.currentTier.set(tier);
    this.saveToStorage();
  }

  /**
   * Get current tier
   */
  getTier(): FeatureTier {
    return this._currentTier$.getValue();
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(featureKey: FeatureKey | string): boolean {
    // Check for explicit override first
    const overrides = this._featureOverrides$.getValue();
    if (overrides.has(featureKey)) {
      return overrides.get(featureKey)!;
    }

    // Check tier-based features
    const tierFeatures = TIER_FEATURES[this._currentTier$.getValue()] ?? [];
    return tierFeatures.includes(featureKey as FeatureKey);
  }

  /**
   * Check if any of the features are enabled
   */
  hasAnyFeature(features: (FeatureKey | string)[]): boolean {
    return features.some(feature => this.isFeatureEnabled(feature));
  }

  /**
   * Check if all features are enabled
   */
  hasAllFeatures(features: (FeatureKey | string)[]): boolean {
    return features.every(feature => this.isFeatureEnabled(feature));
  }

  /**
   * Get feature metadata for upsell display
   */
  getFeatureMetadata(featureKey: FeatureKey): typeof FEATURE_METADATA[FeatureKey] | undefined {
    return FEATURE_METADATA[featureKey];
  }

  /**
   * Get required tier for a feature
   */
  getRequiredTier(featureKey: FeatureKey): FeatureTier | undefined {
    return FEATURE_METADATA[featureKey]?.tier;
  }

  /**
   * Check if current tier can access a feature
   */
  canAccessFeature(featureKey: FeatureKey): boolean {
    const requiredTier = this.getRequiredTier(featureKey);
    if (!requiredTier) return false;

    const tierOrder: FeatureTier[] = [
      FeatureTier.Free,
      FeatureTier.Basic,
      FeatureTier.Professional,
      FeatureTier.Enterprise
    ];

    const currentIndex = tierOrder.indexOf(this._currentTier$.getValue());
    const requiredIndex = tierOrder.indexOf(requiredTier);

    return currentIndex >= requiredIndex;
  }

  /**
   * Set a feature override (for testing or server-side flags)
   */
  setFeatureOverride(featureKey: string, enabled: boolean): void {
    const overrides = this._featureOverrides$.getValue();
    overrides.set(featureKey, enabled);
    this._featureOverrides$.next(new Map(overrides));
    this.saveToStorage();
  }

  /**
   * Clear a feature override
   */
  clearFeatureOverride(featureKey: string): void {
    const overrides = this._featureOverrides$.getValue();
    overrides.delete(featureKey);
    this._featureOverrides$.next(new Map(overrides));
    this.saveToStorage();
  }

  /**
   * Clear all feature overrides
   */
  clearAllOverrides(): void {
    this._featureOverrides$.next(new Map());
    this.saveToStorage();
  }

  /**
   * Get all features with their current status
   */
  getAllFeatures(): IFeatureFlag[] {
    return Object.values(FeatureKey).map(key => ({
      key,
      name: FEATURE_METADATA[key]?.name ?? key,
      description: FEATURE_METADATA[key]?.description ?? '',
      enabled: this.isFeatureEnabled(key),
      tier: FEATURE_METADATA[key]?.tier ?? FeatureTier.Free
    }));
  }

  /**
   * Get features for upsell (features not available in current tier)
   */
  getUpsellFeatures(): IFeatureFlag[] {
    return this.getAllFeatures().filter(f => !f.enabled);
  }

  /**
   * Sync features from server
   */
  syncFromServer(features: IFeatureFlag[], tier?: FeatureTier): void {
    if (tier) {
      this._currentTier$.next(tier);
      this.currentTier.set(tier);
    }

    const overrides = new Map<string, boolean>();
    features.forEach(f => {
      const override = f.metadata?.['override'];
      if (override !== undefined) {
        overrides.set(f.key, f.enabled);
      }
    });
    this._featureOverrides$.next(overrides);

    this.saveToStorage();
  }
}
