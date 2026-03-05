import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CycleService } from '../../../core/services/cycle.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CampaignType,
  CAMPAIGN_TYPE_LABELS
} from '../../../core/models/cycle.model';

@Component({
  selector: 'app-campaign-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './campaign-form.component.html'
})
export class CampaignFormComponent {
  private readonly cycleService = inject(CycleService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);

  // State
  loading = signal(false);
  saving = signal(false);
  campaignId = signal<number | null>(null);
  isEditMode = computed(() => this.campaignId() !== null);
  typeLabels = CAMPAIGN_TYPE_LABELS;

  // Form model
  form = signal({
    name: '',
    nameLocal: '',
    cycleId: null as number | null,
    type: CampaignType.Detail as CampaignType,
    startDate: '',
    endDate: '',
    plannedBudget: 0,
    targetingCriteria: '',
    description: '',
    isActive: true
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.campaignId.set(Number(id));
      this.loadCampaign(Number(id));
    } else {
      // Check for cycleId query param
      const cycleId = this.route.snapshot.queryParamMap.get('cycleId');
      if (cycleId) {
        this.form.update(f => ({ ...f, cycleId: Number(cycleId) }));
      }
    }
  }

  private loadCampaign(id: number): void {
    this.loading.set(true);
    this.cycleService.getCampaignById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const c = response.data;
          this.form.set({
            name: c.name,
            nameLocal: c.nameLocal || '',
            cycleId: c.cycleId || null,
            type: c.type,
            startDate: c.startDate?.substring(0, 10) || '',
            endDate: c.endDate?.substring(0, 10) || '',
            plannedBudget: c.plannedBudget,
            targetingCriteria: c.targetingCriteria || '',
            description: c.description || '',
            isActive: c.isActive
          });
        }
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('campaigns.loadError'));
        this.loading.set(false);
      }
    });
  }

  save(): void {
    const f = this.form();
    if (!f.name || !f.startDate || !f.endDate) {
      this.notification.error(this.translate.instant('campaigns.validation.required'));
      return;
    }

    this.saving.set(true);

    if (this.isEditMode()) {
      const dto: UpdateCampaignRequest = {
        name: f.name,
        nameLocal: f.nameLocal || undefined,
        cycleId: f.cycleId || undefined,
        type: f.type,
        startDate: f.startDate,
        endDate: f.endDate,
        plannedBudget: f.plannedBudget,
        targetingCriteria: f.targetingCriteria || undefined,
        description: f.description || undefined,
        isActive: f.isActive
      };

      this.cycleService.updateCampaign(this.campaignId()!, dto).subscribe({
        next: (response) => {
          if (response.success) {
            this.notification.success(this.translate.instant('campaigns.updated'));
            this.router.navigate(['/cycles', 'campaigns', this.campaignId()]);
          } else {
            this.notification.error(response.message || this.translate.instant('campaigns.saveError'));
          }
          this.saving.set(false);
        },
        error: () => {
          this.notification.error(this.translate.instant('campaigns.saveError'));
          this.saving.set(false);
        }
      });
    } else {
      const dto: CreateCampaignRequest = {
        name: f.name,
        nameLocal: f.nameLocal || undefined,
        cycleId: f.cycleId || undefined,
        type: f.type,
        startDate: f.startDate,
        endDate: f.endDate,
        plannedBudget: f.plannedBudget,
        targetingCriteria: f.targetingCriteria || undefined,
        description: f.description || undefined
      };

      this.cycleService.createCampaign(dto).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.notification.success(this.translate.instant('campaigns.created'));
            this.router.navigate(['/cycles', 'campaigns', response.data.id]);
          } else {
            this.notification.error(response.message || this.translate.instant('campaigns.saveError'));
          }
          this.saving.set(false);
        },
        error: () => {
          this.notification.error(this.translate.instant('campaigns.saveError'));
          this.saving.set(false);
        }
      });
    }
  }

  cancel(): void {
    if (this.isEditMode()) {
      this.router.navigate(['/cycles', 'campaigns', this.campaignId()]);
    } else {
      this.router.navigate(['/cycles', 'campaigns']);
    }
  }
}
