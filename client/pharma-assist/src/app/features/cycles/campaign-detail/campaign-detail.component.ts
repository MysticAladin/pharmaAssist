import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CycleService } from '../../../core/services/cycle.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  Campaign,
  CampaignTarget,
  CampaignExpense,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_TYPE_LABELS,
  CAMPAIGN_TARGET_STATUS_LABELS,
  EXPENSE_CATEGORY_LABELS,
  CampaignTargetStatus
} from '../../../core/models/cycle.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-campaign-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, StatusBadgeComponent, ConfirmDialogComponent],
  templateUrl: './campaign-detail.component.html'
})
export class CampaignDetailComponent {
  private readonly cycleService = inject(CycleService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);

  // State
  campaign = signal<Campaign | null>(null);
  loading = signal(true);
  activeTab = signal<'targets' | 'expenses'>('targets');

  // Delete dialog
  showDeleteDialog = signal(false);

  // Labels
  statusLabels = CAMPAIGN_STATUS_LABELS;
  typeLabels = CAMPAIGN_TYPE_LABELS;
  targetStatusLabels = CAMPAIGN_TARGET_STATUS_LABELS;
  categoryLabels = EXPENSE_CATEGORY_LABELS;

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCampaign(Number(id));
    }
  }

  private loadCampaign(id: number): void {
    this.loading.set(true);
    this.cycleService.getCampaignById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.campaign.set(response.data);
        } else {
          this.notification.error(this.translate.instant('campaigns.notFound'));
          this.router.navigate(['/cycles', 'campaigns']);
        }
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('campaigns.loadError'));
        this.loading.set(false);
        this.router.navigate(['/cycles', 'campaigns']);
      }
    });
  }

  setTab(tab: 'targets' | 'expenses'): void {
    this.activeTab.set(tab);
  }

  editCampaign(): void {
    const c = this.campaign();
    if (c) {
      this.router.navigate(['/cycles', 'campaigns', c.id, 'edit']);
    }
  }

  confirmDelete(): void {
    this.showDeleteDialog.set(true);
  }

  deleteCampaign(): void {
    const c = this.campaign();
    if (!c) return;

    this.cycleService.deleteCampaign(c.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success(this.translate.instant('campaigns.deleted'));
          this.router.navigate(['/cycles', 'campaigns']);
        }
      },
      error: () => this.notification.error(this.translate.instant('campaigns.deleteError'))
    });
    this.showDeleteDialog.set(false);
  }

  activateCampaign(): void {
    const c = this.campaign();
    if (!c) return;

    this.cycleService.activateCampaign(c.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success(this.translate.instant('campaigns.activated'));
          this.loadCampaign(c.id);
        }
      }
    });
  }

  completeCampaign(): void {
    const c = this.campaign();
    if (!c) return;

    this.cycleService.completeCampaign(c.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success(this.translate.instant('campaigns.completed'));
          this.loadCampaign(c.id);
        }
      }
    });
  }

  removeTarget(target: CampaignTarget): void {
    const c = this.campaign();
    if (!c) return;

    this.cycleService.removeCampaignTarget(c.id, target.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success(this.translate.instant('campaigns.targetRemoved'));
          this.loadCampaign(c.id);
        }
      }
    });
  }

  updateTargetStatus(target: CampaignTarget, status: CampaignTargetStatus): void {
    const c = this.campaign();
    if (!c) return;

    this.cycleService.updateCampaignTargetStatus(c.id, target.id, { status }).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success(this.translate.instant('campaigns.targetStatusUpdated'));
          this.loadCampaign(c.id);
        }
      }
    });
  }

  approveExpense(expense: CampaignExpense): void {
    this.cycleService.approveExpense(expense.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success(this.translate.instant('campaigns.expenseApproved'));
          const c = this.campaign();
          if (c) this.loadCampaign(c.id);
        }
      }
    });
  }

  deleteExpense(expense: CampaignExpense): void {
    this.cycleService.deleteExpense(expense.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success(this.translate.instant('campaigns.expenseDeleted'));
          const c = this.campaign();
          if (c) this.loadCampaign(c.id);
        }
      }
    });
  }

  getStatusClass(status: number): string {
    switch (status) {
      case 0: return 'draft';
      case 1: return 'active';
      case 2: return 'paused';
      case 3: return 'completed';
      case 4: return 'cancelled';
      default: return '';
    }
  }

  getTargetStatusClass(status: number): string {
    switch (status) {
      case 0: return 'pending';
      case 1: return 'contacted';
      case 2: return 'in-progress';
      case 3: return 'completed';
      case 4: return 'skipped';
      default: return '';
    }
  }
}
