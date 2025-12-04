import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect, OnInit, Injector } from '@angular/core';
import { DbFeatureFlagService } from '../services/db-feature-flag.service';
import { SystemFlagKey } from '../models/feature-flag.model';

/**
 * Structural directive to conditionally render content based on feature flags
 *
 * Usage:
 * ```html
 * <div *featureFlag="'portal.split_invoice'">Split invoice enabled!</div>
 * <div *featureFlag="'portal.split_invoice'; else disabledTpl">Enabled content</div>
 * <ng-template #disabledTpl>Feature disabled</ng-template>
 * ```
 */
@Directive({
  selector: '[featureFlag]',
  standalone: true
})
export class FeatureFlagDirective implements OnInit {
  private readonly templateRef = inject(TemplateRef<any>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly featureFlagService = inject(DbFeatureFlagService);
  private readonly injector = inject(Injector);

  private flagKey: string = '';
  private elseTemplateRef: TemplateRef<any> | null = null;
  private hasView = false;
  private showElse = false;

  @Input()
  set featureFlag(key: SystemFlagKey | string) {
    this.flagKey = key;
    this.updateView();
  }

  @Input()
  set featureFlagElse(templateRef: TemplateRef<any> | null) {
    this.elseTemplateRef = templateRef;
    this.updateView();
  }

  ngOnInit(): void {
    // React to flag changes
    effect(() => {
      // Access the evaluated flags to trigger reactivity
      this.featureFlagService.evaluatedFlags();
      this.updateView();
    }, { injector: this.injector });
  }

  private updateView(): void {
    const isEnabled = this.featureFlagService.isEnabled(this.flagKey);

    if (isEnabled && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
      this.showElse = false;
    } else if (!isEnabled && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;

      if (this.elseTemplateRef) {
        this.viewContainer.createEmbeddedView(this.elseTemplateRef);
        this.showElse = true;
      }
    } else if (!isEnabled && !this.showElse && this.elseTemplateRef) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.elseTemplateRef);
      this.showElse = true;
    }
  }
}

/**
 * Directive to hide content when feature is NOT enabled (opposite of featureFlag)
 *
 * Usage:
 * ```html
 * <div *featureFlagDisabled="'experimental.feature'">Coming soon!</div>
 * ```
 */
@Directive({
  selector: '[featureFlagDisabled]',
  standalone: true
})
export class FeatureFlagDisabledDirective implements OnInit {
  private readonly templateRef = inject(TemplateRef<any>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly featureFlagService = inject(DbFeatureFlagService);
  private readonly injector = inject(Injector);

  private flagKey: string = '';
  private hasView = false;

  @Input()
  set featureFlagDisabled(key: SystemFlagKey | string) {
    this.flagKey = key;
    this.updateView();
  }

  ngOnInit(): void {
    effect(() => {
      this.featureFlagService.evaluatedFlags();
      this.updateView();
    }, { injector: this.injector });
  }

  private updateView(): void {
    const isDisabled = !this.featureFlagService.isEnabled(this.flagKey);

    if (isDisabled && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!isDisabled && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
