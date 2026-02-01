import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { VisitReportService } from '../../core/services/visit-report.service';
import { ManagerVisitPlanService, TeamVisitPlanDetail } from '../../core/services/manager-visit-plan.service';
import { NotificationService } from '../../core/services/notification.service';
import { VisitPlanReport, VisitPlanStatus } from '../../core/models/visit.model';

@Component({
  selector: 'app-visit-plan-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule],
  template: `
    <div class="plan">
      <div class="plan__header">
        <button class="btn" (click)="back()">{{ 'common.back' | translate }}</button>
        <h1 class="plan__title">{{ 'visits.planDetails' | translate }}</h1>
        @if (plan() && canApprove()) {
          <div class="plan__actions">
            <button class="btn btn-success" (click)="openApproveModal()" [disabled]="processing()">
              <i class="material-icons">check_circle</i>
              {{ 'visitApproval.approve' | translate }}
            </button>
            <button class="btn btn-danger" (click)="openRejectModal()" [disabled]="processing()">
              <i class="material-icons">cancel</i>
              {{ 'visitApproval.reject' | translate }}
            </button>
          </div>
        }
      </div>

      <div class="card">
        <div class="card-content">
          @if (loading()) {
            <div class="muted">{{ 'common.loading' | translate }}</div>
          } @else if (!plan()) {
            <div class="error">{{ 'visits.notFound' | translate }}</div>
          } @else {
            <!-- Status Banner -->
            <div class="status-banner" [class]="'status-' + plan()!.status">
              <span class="status-text">{{ statusKey(plan()!.status) | translate }}</span>
              @if (plan()!.rejectionReason) {
                <span class="rejection-reason">{{ plan()!.rejectionReason }}</span>
              }
            </div>

            <div class="meta">
              <div><strong>{{ 'visits.rep' | translate }}:</strong> {{ plan()!.repName }}</div>
              <div><strong>{{ 'visits.weekOf' | translate }}:</strong> {{ formatWeek(plan()!.planWeek) }}</div>
            </div>

            <div class="list">
              @for (v of plan()!.plannedVisits; track v.plannedVisitId) {
                <div class="list__item" [class.executed]="v.hasExecutedVisit">
                  <div class="list__main">
                    <div class="list__title">{{ v.customerName }}</div>
                    <div class="list__meta">
                      {{ formatDate(v.plannedDate) }}
                      @if (v.plannedTime) { · {{ v.plannedTime }} }
                      @if (v.hasExecutedVisit) {
                        · <span class="executed-badge">{{ 'visits.executed' | translate }}</span>
                      } @else {
                        · <span class="pending-badge">{{ 'visits.notExecuted' | translate }}</span>
                      }
                    </div>
                    @if (v.objective) {
                      <div class="list__objective">{{ v.objective }}</div>
                    }
                  </div>

                  @if (v.executedVisitId) {
                    <button class="btn btn-secondary" (click)="openVisit(v.executedVisitId)">
                      {{ 'visits.viewVisit' | translate }}
                    </button>
                  }
                </div>
              }
            </div>
          }
        </div>
      </div>

      @if (error()) {
        <div class="error">{{ error() }}</div>
      }

      <!-- Approve Modal -->
      @if (showApproveModal()) {
        <div class="modal-overlay" (click)="closeModals()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ 'visitApproval.approveTitle' | translate }}</h2>
              <button class="btn btn-icon" (click)="closeModals()">
                <i class="material-icons">close</i>
              </button>
            </div>
            <div class="modal-body">
              <p>{{ 'visitApproval.approveMessage' | translate }}</p>
              <div class="form-group">
                <label>{{ 'visitApproval.comments' | translate }} ({{ 'common.optional' | translate }})</label>
                <textarea [(ngModel)]="approvalComments" rows="3" [placeholder]="'visitApproval.commentsPlaceholder' | translate"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeModals()">{{ 'common.cancel' | translate }}</button>
              <button class="btn btn-success" (click)="approvePlan()" [disabled]="processing()">
                @if (processing()) {
                  <span class="spinner-sm"></span>
                }
                {{ 'visitApproval.approve' | translate }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Reject Modal -->
      @if (showRejectModal()) {
        <div class="modal-overlay" (click)="closeModals()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ 'visitApproval.rejectTitle' | translate }}</h2>
              <button class="btn btn-icon" (click)="closeModals()">
                <i class="material-icons">close</i>
              </button>
            </div>
            <div class="modal-body">
              <p>{{ 'visitApproval.rejectMessage' | translate }}</p>
              <div class="form-group">
                <label>{{ 'visitApproval.reason' | translate }} *</label>
                <textarea [(ngModel)]="rejectionReason" rows="3" [placeholder]="'visitApproval.reasonPlaceholder' | translate"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeModals()">{{ 'common.cancel' | translate }}</button>
              <button class="btn btn-danger" (click)="rejectPlan()" [disabled]="processing() || !rejectionReason.trim()">
                @if (processing()) {
                  <span class="spinner-sm"></span>
                }
                {{ 'visitApproval.reject' | translate }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .plan { display:grid; gap: 16px; max-width: 860px; }
    .plan__header { display:flex; align-items:center; gap: 12px; flex-wrap: wrap; }
    .plan__title { margin: 0; font-size: 18px; font-weight: 700; flex: 1; }
    .plan__actions { display: flex; gap: 8px; }
    .plan__actions .btn i { font-size: 18px; margin-right: 4px; vertical-align: middle; }

    .status-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-weight: 500;
    }
    .status-1 { background: #fef3c7; color: #92400e; }
    .status-2 { background: #dbeafe; color: #1e40af; }
    .status-3 { background: #d1fae5; color: #065f46; }
    .status-4 { background: #fee2e2; color: #991b1b; }
    .status-5 { background: #e0e7ff; color: #3730a3; }
    .status-6 { background: #d1fae5; color: #065f46; }
    .rejection-reason { margin-left: auto; font-style: italic; opacity: 0.8; }

    .meta { display:grid; gap: 6px; font-size: 13px; margin-bottom: 12px; }

    .list { display:grid; gap: 10px; }
    .list__item {
      display:flex;
      align-items:center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px;
      border: 1px solid var(--border-light);
      border-radius: 12px;
      border-left: 3px solid var(--primary);
    }
    .list__item.executed { border-left-color: var(--success, #10b981); background: rgba(16, 185, 129, 0.03); }
    .list__title { font-weight: 700; }
    .list__meta { font-size: 12px; opacity: 0.8; }
    .list__objective { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
    .executed-badge { color: var(--success, #10b981); font-weight: 600; }
    .pending-badge { color: var(--text-secondary); }

    .muted { font-size: 13px; opacity: 0.75; }
    .error { margin-top: 12px; padding: 10px 12px; border: 1px solid var(--error); border-radius: 10px; color: var(--error); }

    .btn-success { background: #10b981; color: white; }
    .btn-success:hover { background: #059669; }
    .btn-danger { background: #ef4444; color: white; }
    .btn-danger:hover { background: #dc2626; }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-content {
      background: var(--surface);
      border-radius: 12px;
      width: 90%;
      max-width: 450px;
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      h2 { margin: 0; font-size: 18px; }
    }
    .modal-body { padding: 20px; }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 20px;
      border-top: 1px solid var(--border);
    }
    .form-group {
      margin-top: 16px;
      label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 6px;
        color: var(--text-secondary);
      }
      textarea {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid var(--border);
        border-radius: 8px;
        font-size: 14px;
        background: var(--background);
        color: var(--text-primary);
        resize: vertical;
      }
    }
    .spinner-sm {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      display: inline-block;
      margin-right: 8px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class VisitPlanDetailComponent implements OnInit {
  private readonly reportService = inject(VisitReportService);
  private readonly managerService = inject(ManagerVisitPlanService);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  loading = signal(true);
  error = signal<string | null>(null);
  plan = signal<VisitPlanReport | null>(null);
  processing = signal(false);

  // Modal state
  showApproveModal = signal(false);
  showRejectModal = signal(false);
  approvalComments = '';
  rejectionReason = '';

  private planId = 0;

  statusKey(status: VisitPlanStatus): string {
    switch (status) {
      case VisitPlanStatus.Draft:
        return 'visits.planStatusDraft';
      case VisitPlanStatus.Submitted:
        return 'visits.planStatusSubmitted';
      case VisitPlanStatus.Approved:
        return 'visits.planStatusApproved';
      case VisitPlanStatus.Rejected:
        return 'visits.planStatusRejected';
      case VisitPlanStatus.InProgress:
        return 'visits.planStatusInProgress';
      case VisitPlanStatus.Completed:
        return 'visits.planStatusCompleted';
      default:
        return 'visits.planStatusUnknown';
    }
  }

  canApprove(): boolean {
    const p = this.plan();
    return p !== null && p.status === VisitPlanStatus.Submitted;
  }

  ngOnInit(): void {
    this.planId = Number(this.route.snapshot.paramMap.get('planId'));
    this.load(this.planId);
  }

  back(): void {
    this.router.navigate(['/visits/team']);
  }

  openVisit(executedVisitId: number): void {
    this.router.navigate(['/visits', executedVisitId]);
  }

  formatWeek(planWeek: string): string {
    const monday = new Date(planWeek);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${monday.toLocaleDateString(undefined, options)} - ${friday.toLocaleDateString(undefined, options)}, ${monday.getFullYear()}`;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  openApproveModal(): void {
    this.approvalComments = '';
    this.showApproveModal.set(true);
  }

  openRejectModal(): void {
    this.rejectionReason = '';
    this.showRejectModal.set(true);
  }

  closeModals(): void {
    this.showApproveModal.set(false);
    this.showRejectModal.set(false);
  }

  approvePlan(): void {
    this.processing.set(true);
    this.managerService.approvePlan(this.planId, this.approvalComments || undefined).subscribe({
      next: () => {
        this.notificationService.success(this.translateService.instant('visitApproval.approveSuccess'));
        this.closeModals();
        this.load(this.planId);
      },
      error: (err) => {
        this.notificationService.error(err?.error?.message || this.translateService.instant('visitApproval.approveError'));
        this.processing.set(false);
      },
      complete: () => this.processing.set(false)
    });
  }

  rejectPlan(): void {
    if (!this.rejectionReason.trim()) return;

    this.processing.set(true);
    this.managerService.rejectPlan(this.planId, this.rejectionReason).subscribe({
      next: () => {
        this.notificationService.success(this.translateService.instant('visitApproval.rejectSuccess'));
        this.closeModals();
        this.load(this.planId);
      },
      error: (err) => {
        this.notificationService.error(err?.error?.message || this.translateService.instant('visitApproval.rejectError'));
        this.processing.set(false);
      },
      complete: () => this.processing.set(false)
    });
  }

  private load(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.reportService.getPlan(id).subscribe({
      next: (plan) => {
        this.plan.set(plan);
        this.loading.set(false);
      },
      error: (err) => {
        this.plan.set(null);
        this.error.set(err?.error?.message ?? 'Failed to load');
        this.loading.set(false);
      }
    });
  }
}
