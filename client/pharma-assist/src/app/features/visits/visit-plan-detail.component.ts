import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { VisitReportService } from '../../core/services/visit-report.service';
import { VisitPlanReport, VisitPlanStatus } from '../../core/models/visit.model';

@Component({
  selector: 'app-visit-plan-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <div class="plan">
      <div class="plan__header">
        <button class="btn" (click)="back()">{{ 'common.back' | translate }}</button>
        <h1 class="plan__title">{{ 'visits.planDetails' | translate }}</h1>
      </div>

      <div class="card">
        <div class="card-content">
          @if (loading()) {
            <div class="muted">{{ 'common.loading' | translate }}</div>
          } @else if (!plan()) {
            <div class="error">{{ 'visits.notFound' | translate }}</div>
          } @else {
            <div class="meta">
              <div><strong>{{ 'visits.rep' | translate }}:</strong> {{ plan()!.repName }}</div>
              <div><strong>{{ 'visits.weekOf' | translate }}:</strong> {{ plan()!.planWeek }}</div>
              <div><strong>{{ 'visits.status' | translate }}:</strong> {{ statusKey(plan()!.status) | translate }}</div>
            </div>

            <div class="list">
              @for (v of plan()!.plannedVisits; track v.plannedVisitId) {
                <div class="list__item">
                  <div class="list__main">
                    <div class="list__title">{{ v.customerName }}</div>
                    <div class="list__meta">
                      {{ v.plannedDate }}
                      @if (v.hasExecutedVisit) {
                        · {{ 'visits.executed' | translate }}
                      } @else {
                        · {{ 'visits.notExecuted' | translate }}
                      }
                    </div>
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
    </div>
  `,
  styles: [`
    .plan { display:grid; gap: 16px; max-width: 860px; }
    .plan__header { display:flex; align-items:center; gap: 12px; flex-wrap: wrap; }
    .plan__title { margin: 0; font-size: 18px; font-weight: 700; }

    .meta { display:grid; gap: 6px; font-size: 13px; margin-bottom: 12px; }

    .list { display:grid; gap: 10px; }
    .list__item { display:flex; align-items:center; justify-content: space-between; gap: 12px; padding: 12px; border: 1px solid var(--border-light); border-radius: 12px; }
    .list__title { font-weight: 700; }
    .list__meta { font-size: 12px; opacity: 0.8; }

    .muted { font-size: 13px; opacity: 0.75; }
    .error { margin-top: 12px; padding: 10px 12px; border: 1px solid var(--error); border-radius: 10px; color: var(--error); }
  `]
})
export class VisitPlanDetailComponent implements OnInit {
  private readonly reportService = inject(VisitReportService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  loading = signal(true);
  error = signal<string | null>(null);
  plan = signal<VisitPlanReport | null>(null);

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

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('planId'));
    this.load(id);
  }

  back(): void {
    this.router.navigate(['/visits/team']);
  }

  openVisit(executedVisitId: number): void {
    this.router.navigate(['/visits', executedVisitId]);
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
