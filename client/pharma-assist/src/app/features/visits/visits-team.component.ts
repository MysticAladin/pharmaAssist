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
  templateUrl: './visits-team-component/visits-team.component.html',
  styleUrls: ['./visits-team-component/visits-team.component.scss']
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
