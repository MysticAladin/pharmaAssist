import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { VisitReportService } from '../../core/services/visit-report.service';
import { TeamVisitPlanSummary } from '../../core/models/visit.model';

@Component({
  selector: 'app-visits-team',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <div class="team">
      <div class="team__header">
        <h1 class="team__title">{{ 'visits.teamTitle' | translate }}</h1>
      </div>

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">{{ 'visits.weekPlans' | translate }}</h2>
        </div>
        <div class="card-content">
          @if (loading()) {
            <div class="muted">{{ 'common.loading' | translate }}</div>
          } @else if (items().length === 0) {
            <div class="muted">{{ 'visits.noTeamPlans' | translate }}</div>
          } @else {
            <div class="list">
              @for (p of items(); track p.planId) {
                <div class="list__item">
                  <div class="list__main">
                    <div class="list__title">{{ p.repName }}</div>
                    <div class="list__meta">
                      {{ 'visits.planned' | translate }}: {{ p.plannedCount }} ·
                      {{ 'visits.executed' | translate }}: {{ p.executedCount }}
                    </div>
                  </div>
                  <button class="btn btn-secondary" (click)="openPlan(p.planId)">
                    {{ 'visits.viewPlan' | translate }}
                  </button>
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
    .team { display:grid; gap: 16px; max-width: 860px; }
    .team__header { display:flex; align-items:center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .team__title { margin: 0; font-size: 18px; font-weight: 700; }

    .list { display:grid; gap: 10px; }
    .list__item { display:flex; align-items:center; justify-content: space-between; gap: 12px; padding: 12px; border: 1px solid var(--border-light); border-radius: 12px; }
    .list__title { font-weight: 700; }
    .list__meta { font-size: 12px; opacity: 0.8; }

    .muted { font-size: 13px; opacity: 0.75; }
    .error { margin-top: 12px; padding: 10px 12px; border: 1px solid var(--error); border-radius: 10px; color: var(--error); }
  `]
})
export class VisitsTeamComponent implements OnInit {
  private readonly reportService = inject(VisitReportService);
  private readonly router = inject(Router);

  loading = signal(true);
  error = signal<string | null>(null);
  items = signal<TeamVisitPlanSummary[]>([]);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.reportService.getWeekPlans().subscribe({
      next: (items) => {
        this.items.set(items ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.items.set([]);
        this.error.set(err?.error?.message ?? 'Failed to load');
        this.loading.set(false);
      }
    });
  }

  openPlan(planId: number): void {
    this.router.navigate(['/visits/plans', planId]);
  }
}
