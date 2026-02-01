import { Component, OnInit, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { VisitReportService } from '../../core/services/visit-report.service';
import { EuropeanDatePipe } from '../../core/pipes/european-date.pipe';
import {
  TeamActivityDashboard,
  RepActivitySummary,
  VisitActivity,
  VisitOutcome
} from '../../core/models/visit.model';

@Component({
  selector: 'app-team-activity-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule, EuropeanDatePipe],
  templateUrl: './team-activity-dashboard-component/team-activity-dashboard.component.html',
  styleUrls: ['./team-activity-dashboard-component/team-activity-dashboard.component.scss']
})
export class TeamActivityDashboardComponent implements OnInit {
  private readonly reportService = inject(VisitReportService);
  private readonly router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);
  data = signal<TeamActivityDashboard | null>(null);
  expandedRepId = signal<number | null>(null);

  selectedDate: string = '';
  displayDate: string = '';

  ngOnInit(): void {
    const today = new Date();
    this.selectedDate = today.toISOString().split('T')[0];
    this.displayDate = this.formatDisplayDate(today);
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.reportService.getTeamActivity(this.selectedDate).subscribe({
      next: (result) => {
        this.data.set(result);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to load team activity');
        this.loading.set(false);
      }
    });
  }

  refresh(): void {
    this.loadData();
  }

  toggleExpand(repId: number): void {
    this.expandedRepId.set(this.expandedRepId() === repId ? null : repId);
  }

  openVisit(visitId: number): void {
    this.router.navigate(['/visits', visitId]);
  }

  // Date input handling (pattern from orders)
  onDateInputChange(value: string): void {
    this.displayDate = value;
    const parsed = this.parseEuropeanDate(value);
    if (parsed) {
      this.selectedDate = parsed.toISOString().split('T')[0];
      this.loadData();
    }
  }

  onNativeDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      this.selectedDate = input.value;
      this.displayDate = this.formatDisplayDate(new Date(input.value));
      this.loadData();
    }
  }

  private formatDisplayDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  private parseEuropeanDate(value: string): Date | null {
    const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (match) {
      const [, day, month, year] = match;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return null;
  }

  formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getLocationBadgeClass(v: VisitActivity): string {
    return v.locationVerified ? 'badge--verified' : 'badge--unverified';
  }

  getOutcomeBadgeClass(outcome: VisitOutcome | null | undefined): string {
    switch (outcome) {
      case VisitOutcome.Positive: return 'badge--positive';
      case VisitOutcome.Neutral: return 'badge--neutral';
      case VisitOutcome.Negative: return 'badge--negative';
      default: return 'badge--none';
    }
  }

  getOutcomeIcon(outcome: VisitOutcome | null | undefined): string {
    switch (outcome) {
      case VisitOutcome.Positive: return '👍';
      case VisitOutcome.Neutral: return '😐';
      case VisitOutcome.Negative: return '👎';
      default: return '-';
    }
  }
}
