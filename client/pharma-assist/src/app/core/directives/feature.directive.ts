import { Directive, Input, TemplateRef, ViewContainerRef, inject, OnInit, effect } from '@angular/core';
import { FeatureFlagService } from '../state/feature-flag.service';
import { FeatureKey, FeatureTier } from '../models/feature-flag.model';

/**
 * Structural directive to conditionally show content based on feature flag
 *
 * Usage:
 * <div *hasFeature="'advanced_analytics'">
 *   <analytics-dashboard></analytics-dashboard>
 * </div>
 *
 * With upsell template:
 * <div *hasFeature="'advanced_analytics'; else upsell">
 *   <analytics-dashboard></analytics-dashboard>
 * </div>
 * <ng-template #upsell>
 *   <upsell-banner feature="advanced_analytics"></upsell-banner>
 * </ng-template>
 */
@Directive({
  selector: '[hasFeature]',
  standalone: true
})
export class HasFeatureDirective implements OnInit {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly featureFlags = inject(FeatureFlagService);

  private feature: FeatureKey | string | null = null;
  private elseTemplateRef: TemplateRef<unknown> | null = null;
  private hasView = false;

  @Input()
  set hasFeature(feature: FeatureKey | string) {
    this.feature = feature;
    this.updateView();
  }

  @Input()
  set hasFeatureElse(templateRef: TemplateRef<unknown>) {
    this.elseTemplateRef = templateRef;
    this.updateView();
  }

  constructor() {
    // React to feature flag changes (e.g., tier changes)
    effect(() => {
      this.featureFlags.currentTier();
      this.updateView();
    });
  }

  ngOnInit(): void {
    this.updateView();
  }

  private updateView(): void {
    const hasAccess = this.feature ? this.featureFlags.isFeatureEnabled(this.feature) : false;

    if (hasAccess && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasAccess) {
      this.viewContainer.clear();
      if (this.elseTemplateRef) {
        this.viewContainer.createEmbeddedView(this.elseTemplateRef);
      }
      this.hasView = false;
    }
  }
}

/**
 * Structural directive to show content for multiple features (ANY)
 *
 * Usage:
 * <div *hasAnyFeature="['advanced_analytics', 'custom_reports']">
 *   Advanced features available
 * </div>
 */
@Directive({
  selector: '[hasAnyFeature]',
  standalone: true
})
export class HasAnyFeatureDirective implements OnInit {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly featureFlags = inject(FeatureFlagService);

  private features: (FeatureKey | string)[] = [];
  private elseTemplateRef: TemplateRef<unknown> | null = null;
  private hasView = false;

  @Input()
  set hasAnyFeature(features: (FeatureKey | string)[]) {
    this.features = features;
    this.updateView();
  }

  @Input()
  set hasAnyFeatureElse(templateRef: TemplateRef<unknown>) {
    this.elseTemplateRef = templateRef;
    this.updateView();
  }

  constructor() {
    effect(() => {
      this.featureFlags.currentTier();
      this.updateView();
    });
  }

  ngOnInit(): void {
    this.updateView();
  }

  private updateView(): void {
    const hasAccess = this.featureFlags.hasAnyFeature(this.features);

    if (hasAccess && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasAccess) {
      this.viewContainer.clear();
      if (this.elseTemplateRef) {
        this.viewContainer.createEmbeddedView(this.elseTemplateRef);
      }
      this.hasView = false;
    }
  }
}

/**
 * Structural directive to show content for multiple features (ALL required)
 */
@Directive({
  selector: '[hasAllFeatures]',
  standalone: true
})
export class HasAllFeaturesDirective implements OnInit {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly featureFlags = inject(FeatureFlagService);

  private features: (FeatureKey | string)[] = [];
  private elseTemplateRef: TemplateRef<unknown> | null = null;
  private hasView = false;

  @Input()
  set hasAllFeatures(features: (FeatureKey | string)[]) {
    this.features = features;
    this.updateView();
  }

  @Input()
  set hasAllFeaturesElse(templateRef: TemplateRef<unknown>) {
    this.elseTemplateRef = templateRef;
    this.updateView();
  }

  constructor() {
    effect(() => {
      this.featureFlags.currentTier();
      this.updateView();
    });
  }

  ngOnInit(): void {
    this.updateView();
  }

  private updateView(): void {
    const hasAccess = this.featureFlags.hasAllFeatures(this.features);

    if (hasAccess && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasAccess) {
      this.viewContainer.clear();
      if (this.elseTemplateRef) {
        this.viewContainer.createEmbeddedView(this.elseTemplateRef);
      }
      this.hasView = false;
    }
  }
}

/**
 * Structural directive to show content based on subscription tier
 *
 * Usage:
 * <div *hasTier="'professional'">
 *   Professional tier content
 * </div>
 *
 * Minimum tier:
 * <div *hasTier="'basic'; minimum: true">
 *   Basic tier or higher
 * </div>
 */
@Directive({
  selector: '[hasTier]',
  standalone: true
})
export class HasTierDirective implements OnInit {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly featureFlags = inject(FeatureFlagService);

  private tier: FeatureTier | null = null;
  private isMinimum = false;
  private elseTemplateRef: TemplateRef<unknown> | null = null;
  private hasView = false;

  @Input()
  set hasTier(tier: FeatureTier) {
    this.tier = tier;
    this.updateView();
  }

  @Input()
  set hasTierMinimum(minimum: boolean) {
    this.isMinimum = minimum;
    this.updateView();
  }

  @Input()
  set hasTierElse(templateRef: TemplateRef<unknown>) {
    this.elseTemplateRef = templateRef;
    this.updateView();
  }

  constructor() {
    effect(() => {
      this.featureFlags.currentTier();
      this.updateView();
    });
  }

  ngOnInit(): void {
    this.updateView();
  }

  private updateView(): void {
    const hasAccess = this.checkTier();

    if (hasAccess && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasAccess) {
      this.viewContainer.clear();
      if (this.elseTemplateRef) {
        this.viewContainer.createEmbeddedView(this.elseTemplateRef);
      }
      this.hasView = false;
    }
  }

  private checkTier(): boolean {
    if (!this.tier) return false;

    const currentTier = this.featureFlags.getTier();

    if (this.isMinimum) {
      // Check if current tier is at least the specified tier
      const tierOrder: FeatureTier[] = [
        FeatureTier.Free,
        FeatureTier.Basic,
        FeatureTier.Professional,
        FeatureTier.Enterprise
      ];

      const currentIndex = tierOrder.indexOf(currentTier);
      const requiredIndex = tierOrder.indexOf(this.tier);

      return currentIndex >= requiredIndex;
    }

    return currentTier === this.tier;
  }
}

/**
 * Attribute directive to disable elements based on feature access
 * Shows a tooltip explaining why it's disabled
 *
 * Usage:
 * <button [disableIfNoFeature]="'bulk_operations'"
 *         [disableMessage]="'Upgrade to Professional for bulk operations'">
 *   Bulk Edit
 * </button>
 */
@Directive({
  selector: '[disableIfNoFeature]',
  standalone: true
})
export class DisableIfNoFeatureDirective implements OnInit {
  private readonly featureFlags = inject(FeatureFlagService);

  @Input() disableIfNoFeature: FeatureKey | string = '';
  @Input() disableMessage = 'This feature requires an upgraded plan';

  constructor(
    private readonly templateRef: TemplateRef<HTMLElement>,
    private readonly viewContainer: ViewContainerRef
  ) {}

  ngOnInit(): void {
    // This would need element reference for attribute directive
    // For now, this is a placeholder - actual implementation would use ElementRef
  }
}
