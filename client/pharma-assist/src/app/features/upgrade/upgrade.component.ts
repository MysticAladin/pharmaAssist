import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FeatureFlagService } from '../../core/state/feature-flag.service';
import { FeatureKey, FeatureTier, FEATURE_METADATA } from '../../core/models/feature-flag.model';

@Component({
  selector: 'app-upgrade',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './upgrade-component/upgrade.component.html',
  styleUrls: ['./upgrade-component/upgrade.component.scss']
})
export class UpgradeComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly featureFlags = inject(FeatureFlagService);

  currentTier = this.featureFlags.getTier();
}
