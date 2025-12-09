import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  FeatureKey,
  FeatureTier,
  TIER_FEATURES,
  FEATURE_METADATA,
  IFeatureFlag,
  SystemFlagKey,
  SYSTEM_FLAGS
} from '../models/feature-flag.model';
import { DbFeatureFlagService } from '../services/db-feature-flag.service';

const STORAGE_KEY = 'pa_feature_flags';

/**
 * Mapping from tier-based FeatureKeys to database SystemFlagKeys
 * This allows the tier-based UI to work with database-backed flags
 */
const FEATURE_TO_DB_FLAG_MAP: Partial<Record<FeatureKey, SystemFlagKey>> = {
  [FeatureKey.BasicDashboard]: SYSTEM_FLAGS.PORTAL_ENABLED,
  [FeatureKey.ProductCatalog]: SYSTEM_FLAGS.PORTAL_ENABLED,
  [FeatureKey.BasicOrders]: SYSTEM_FLAGS.PORTAL_ENABLED,
  [FeatureKey.InventoryManagement]: SYSTEM_FLAGS.INVENTORY_LOW_STOCK_ALERT,
  [FeatureKey.BasicReports]: SYSTEM_FLAGS.REPORTS_PDF_EXPORT,
  [FeatureKey.PrescriptionManagement]: SYSTEM_FLAGS.PORTAL_PRESCRIPTION_UPLOAD,
  [FeatureKey.AdvancedReports]: SYSTEM_FLAGS.REPORTS_CUSTOM,
  [FeatureKey.ExportReports]: SYSTEM_FLAGS.REPORTS_PDF_EXPORT,
  [FeatureKey.BulkOperations]: SYSTEM_FLAGS.ORDERS_BULK_IMPORT,
  [FeatureKey.LowStockAlerts]: SYSTEM_FLAGS.INVENTORY_LOW_STOCK_ALERT,
  [FeatureKey.ExpiryAlerts]: SYSTEM_FLAGS.INVENTORY_EXPIRY_ALERT,
  [FeatureKey.CustomReports]: SYSTEM_FLAGS.REPORTS_CUSTOM,
  [FeatureKey.ApiAccess]: SYSTEM_FLAGS.INTEGRATION_API_ACCESS,
  [FeatureKey.SsoIntegration]: SYSTEM_FLAGS.INTEGRATION_SSO,
};

/**
 * Unified Feature Flag Service
 *
 * This service provides a unified API for feature flag checking:
 * 1. Database-backed flags (via DbFeatureFlagService) - Primary source of truth
 * 2. Tier-based features (FeatureKey enum) - For upselling and backwards compatibility
 *
 * The service first checks if a feature is enabled in the database.
 * If not found, it falls back to tier-based logic.
 */
@Injectable({
  providedIn: 'root'
})
export class FeatureFlagService {
  private readonly dbFeatureFlags = inject(DbFeatureFlagService);

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

  // Computed: All evaluated DB flags
  readonly dbFlags = this.dbFeatureFlags.evaluatedFlags;

  // Computed: Check if DB flags are loaded
  readonly dbFlagsLoaded = this.dbFeatureFlags.initialized;

  // Observables
  readonly currentTier$: Observable<FeatureTier> = this._currentTier$.asObservable();

  constructor() {
    this.loadFromStorage();

    // Sync tier from user data when available
    effect(() => {
      // The DB feature flag service auto-loads when user authenticates
      // We can use the initialized signal to track state
      if (this.dbFeatureFlags.initialized()) {
        // Flags are loaded from server
      }
    });
  }

  /**
   * Initialize the feature flag system
   * Call this after user authentication
   */
  initialize(): Observable<void> {
    return this.dbFeatureFlags.initialize();
  }

  /**
   * Refresh all flags from server
   */
  refresh(): void {
    this.dbFeatureFlags.refresh();
  }

  /**
   * Load feature flags from storage (fallback/cache)
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
   *
   * Priority order:
   * 1. Database-backed flag (if the key matches a SystemFlagKey)
   * 2. Mapped database flag (if FeatureKey maps to a SystemFlagKey)
   * 3. Explicit override
   * 4. Tier-based feature access
   */
  isFeatureEnabled(featureKey: FeatureKey | SystemFlagKey | string): boolean {
    // 1. Check if it's a database-backed flag key (e.g., "portal.enabled")
    if (this.isDbFlagKey(featureKey)) {
      const dbEnabled = this.dbFeatureFlags.isEnabled(featureKey);
      if (dbEnabled !== undefined) {
        return dbEnabled;
      }
    }

    // 2. Check if this FeatureKey maps to a database flag
    const mappedDbKey = FEATURE_TO_DB_FLAG_MAP[featureKey as FeatureKey];
    if (mappedDbKey) {
      const dbEnabled = this.dbFeatureFlags.isEnabled(mappedDbKey);
      // If DB flag is explicitly disabled, respect that
      const dbFlag = this.dbFeatureFlags.evaluatedFlags().get(mappedDbKey);
      if (dbFlag && !dbFlag.enabled) {
        return false;
      }
    }

    // 3. Check for explicit override
    const overrides = this._featureOverrides$.getValue();
    if (overrides.has(featureKey)) {
      return overrides.get(featureKey)!;
    }

    // 4. Check tier-based features
    const tierFeatures = TIER_FEATURES[this._currentTier$.getValue()] ?? [];
    return tierFeatures.includes(featureKey as FeatureKey);
  }

  /**
   * Check if the key is a database flag key format (contains a dot)
   */
  private isDbFlagKey(key: string): boolean {
    return key.includes('.');
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

  // ===================================
  // Database Flag Delegation Methods
  // ===================================

  /**
   * Check if a database-backed flag is enabled
   */
  isDbFlagEnabled(key: SystemFlagKey | string): boolean {
    return this.dbFeatureFlags.isEnabled(key);
  }

  /**
   * Get a database flag's value
   */
  getDbFlagValue<T = unknown>(key: SystemFlagKey | string): T | null {
    return this.dbFeatureFlags.getValue<T>(key);
  }

  /**
   * Get all evaluated database flags
   */
  getEvaluatedFlags(): Map<string, import('../models/feature-flag.model').EvaluatedFlag> {
    return this.dbFeatureFlags.evaluatedFlags();
  }

  /**
   * Create a signal that tracks a specific database flag
   */
  createDbFlagSignal(key: SystemFlagKey | string) {
    return this.dbFeatureFlags.createFlagSignal(key);
  }

  /**
   * Get the underlying DbFeatureFlagService for admin operations
   * Only use this for admin UI that needs full access
   */
  getDbService(): DbFeatureFlagService {
    return this.dbFeatureFlags;
  }
}
