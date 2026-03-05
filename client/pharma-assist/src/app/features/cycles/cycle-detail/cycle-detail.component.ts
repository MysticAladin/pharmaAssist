import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CycleService } from '../../../core/services/cycle.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  Cycle,
  CycleTarget,
  CampaignSummary,
  CYCLE_STATUS_LABELS,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_TYPE_LABELS
} from '../../../core/models/cycle.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-cycle-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, StatusBadgeComponent, ConfirmDialogComponent],
  templateUrl: './cycle-detail.component.html'
})
export class CycleDetailComponent {
  private readonly cycleService = inject(CycleService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);

  // State
  cycle = signal<Cycle | null>(null);
  loading = signal(true);
  activeTab = signal<'targets' | 'campaigns'>('targets');

  // Delete dialog
  showDeleteDialog = signal(false);

  // Labels
  statusLabels = CYCLE_STATUS_LABELS;
  campaignStatusLabels = CAMPAIGN_STATUS_LABELS;
  campaignTypeLabels = CAMPAIGN_TYPE_LABELS;

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCycle(Number(id));
    }
  }

  private loadCycle(id: number): void {
    this.loading.set(true);
    this.cycleService.getCycleById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.cycle.set(response.data);
        } else {
          this.notification.error(this.translate.instant('cycles.notFound'));
          this.router.navigate(['/cycles']);
        }
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('cycles.loadError'));
        this.loading.set(false);
        this.router.navigate(['/cycles']);
      }
    });
  }

  setTab(tab: 'targets' | 'campaigns'): void {
    this.activeTab.set(tab);
  }

  editCycle(): void {
    const c = this.cycle();
    if (c) {
      this.router.navigate(['/cycles', c.id, 'edit']);
    }
  }

  confirmDelete(): void {
    this.showDeleteDialog.set(true);
  }

  deleteCycle(): void {
    const c = this.cycle();
    if (!c) return;

    this.cycleService.deleteCycle(c.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success(this.translate.instant('cycles.deleted'));
          this.router.navigate(['/cycles']);
        }
      },
      error: () => this.notification.error(this.translate.instant('cycles.deleteError'))
    });
    this.showDeleteDialog.set(false);
  }

  activateCycle(): void {
    const c = this.cycle();
    if (!c) return;

    this.cycleService.activateCycle(c.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success(this.translate.instant('cycles.activated'));
          this.loadCycle(c.id);
        }
      }
    });
  }

  completeCycle(): void {
    const c = this.cycle();
    if (!c) return;

    this.cycleService.completeCycle(c.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success(this.translate.instant('cycles.completed'));
          this.loadCycle(c.id);
        }
      }
    });
  }

  viewCampaign(campaign: CampaignSummary): void {
    this.router.navigate(['/cycles', 'campaigns', campaign.id]);
  }

  createCampaign(): void {
    const c = this.cycle();
    this.router.navigate(['/cycles', 'campaigns', 'new'], {
      queryParams: c ? { cycleId: c.id } : {}
    });
  }

  removeTarget(target: CycleTarget): void {
    const c = this.cycle();
    if (!c) return;

    this.cycleService.removeCycleTarget(c.id, target.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success(this.translate.instant('cycles.targetRemoved'));
          this.loadCycle(c.id);
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
}
