import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe, PercentPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { PlanExecutionReportService } from '../../core/services/plan-execution-report.service';
import { AuthStateService } from '../../core/state/auth-state.service';
import {
  DailyActivityReport,
  WeeklyActivityReport,
  MonthlyActivityReport,
  PlanExecutionReport,
  TeamExecutionSummary
} from '../../core/models/plan-execution-report.model';
import { ReportService } from '../../core/services/report.service';
import { SalesRepOption } from '../../core/models/report.model';

type ReportView = 'daily' | 'weekly' | 'monthly' | 'execution' | 'team';

@Component({
  selector: 'app-activity-report',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule, CurrencyPipe, DecimalPipe, PercentPipe, DatePipe],
  templateUrl: './activity-report-component/activity-report.component.html',
  styleUrls: ['./activity-report-component/activity-report.component.scss']
})
export class ActivityReportComponent implements OnInit {
  private readonly reportService = inject(PlanExecutionReportService);
  private readonly salesRepService = inject(ReportService);
  private readonly authState = inject(AuthStateService);

  loading = signal(false);
  activeView = signal<ReportView>('daily');
  reps = signal<SalesRepOption[]>([]);

  // Report data
  dailyReport = signal<DailyActivityReport | null>(null);
  weeklyReport = signal<WeeklyActivityReport | null>(null);
  monthlyReport = signal<MonthlyActivityReport | null>(null);
  executionReport = signal<PlanExecutionReport | null>(null);
  teamSummary = signal<TeamExecutionSummary | null>(null);

  // Filter values
  selectedRepId: number | null = null;
  selectedDate: Date = new Date();
  startDate: Date = new Date();
  endDate: Date = new Date();
  selectedYear: number = new Date().getFullYear();
  selectedMonth: number = new Date().getMonth() + 1;
  includeProducts = true;
  includeCustomers = true;
  includeTerritories = false;

  // Check if user is manager
  isManager = computed(() => {
    const roles = this.authState.userRoles();
    return roles.includes('Manager') || roles.includes('Admin') || roles.includes('SuperAdmin');
  });

  // Available years for selection
  availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // Month options
  months = [
    { value: 1, label: 'common.months.january' },
    { value: 2, label: 'common.months.february' },
    { value: 3, label: 'common.months.march' },
    { value: 4, label: 'common.months.april' },
    { value: 5, label: 'common.months.may' },
    { value: 6, label: 'common.months.june' },
    { value: 7, label: 'common.months.july' },
    { value: 8, label: 'common.months.august' },
    { value: 9, label: 'common.months.september' },
    { value: 10, label: 'common.months.october' },
    { value: 11, label: 'common.months.november' },
    { value: 12, label: 'common.months.december' }
  ];

  ngOnInit(): void {
    this.endDate = this.endOfDay(new Date());
    const start = new Date(this.endDate.getFullYear(), this.endDate.getMonth(), 1);
    this.startDate = this.startOfDay(start);

    this.loadReps();
  }

  private loadReps(): void {
    this.salesRepService.getSalesRepsForFilter().subscribe({
      next: (res) => {
        this.reps.set(res ?? []);
        // Auto-select first rep if available
        if (res?.length && !this.selectedRepId) {
          this.selectedRepId = res[0].id;
        }
      },
      error: () => this.reps.set([])
    });
  }

  setActiveView(view: ReportView): void {
    this.activeView.set(view);
    this.clearReports();
  }

  private clearReports(): void {
    this.dailyReport.set(null);
    this.weeklyReport.set(null);
    this.monthlyReport.set(null);
    this.executionReport.set(null);
    this.teamSummary.set(null);
  }

  generateReport(): void {
    if (!this.selectedRepId && this.activeView() !== 'team') {
      return;
    }

    this.loading.set(true);

    switch (this.activeView()) {
      case 'daily':
        this.loadDailyReport();
        break;
      case 'weekly':
        this.loadWeeklyReport();
        break;
      case 'monthly':
        this.loadMonthlyReport();
        break;
      case 'execution':
        this.loadExecutionReport();
        break;
      case 'team':
        this.loadTeamSummary();
        break;
    }
  }

  private loadDailyReport(): void {
    this.reportService.getDailyActivityReport(this.selectedRepId!, this.selectedDate).subscribe({
      next: (data) => {
        this.dailyReport.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load daily report', err);
        this.loading.set(false);
      }
    });
  }

  private loadWeeklyReport(): void {
    // Get the start of week (Monday)
    const weekStart = this.getWeekStart(this.selectedDate);
    this.reportService.getWeeklyActivityReport(this.selectedRepId!, weekStart).subscribe({
      next: (data) => {
        this.weeklyReport.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load weekly report', err);
        this.loading.set(false);
      }
    });
  }

  private loadMonthlyReport(): void {
    this.reportService.getMonthlyActivityReport(
      this.selectedRepId!,
      this.selectedYear,
      this.selectedMonth,
      {
        includeProducts: this.includeProducts,
        includeCustomers: this.includeCustomers,
        includeTerritories: this.includeTerritories
      }
    ).subscribe({
      next: (data) => {
        this.monthlyReport.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load monthly report', err);
        this.loading.set(false);
      }
    });
  }

  private loadExecutionReport(): void {
    this.reportService.getPlanExecutionReport(this.selectedRepId!, this.startDate, this.endDate).subscribe({
      next: (data) => {
        this.executionReport.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load execution report', err);
        this.loading.set(false);
      }
    });
  }

  private loadTeamSummary(): void {
    this.reportService.getTeamExecutionSummary(this.startDate, this.endDate).subscribe({
      next: (data) => {
        this.teamSummary.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load team summary', err);
        this.loading.set(false);
      }
    });
  }

  // Date utilities
  onDateTextChange(value: string, field: 'selectedDate' | 'startDate' | 'endDate'): void {
    const parsed = this.tryParseEuDate(value);
    if (!parsed) return;

    switch (field) {
      case 'selectedDate':
        this.selectedDate = parsed;
        break;
      case 'startDate':
        this.startDate = this.startOfDay(parsed);
        break;
      case 'endDate':
        this.endDate = this.endOfDay(parsed);
        break;
    }
  }

  getDateText(field: 'selectedDate' | 'startDate' | 'endDate'): string {
    switch (field) {
      case 'selectedDate':
        return this.toEuDateOnly(this.selectedDate);
      case 'startDate':
        return this.toEuDateOnly(this.startDate);
      case 'endDate':
        return this.toEuDateOnly(this.endDate);
    }
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  private tryParseEuDate(val: string): Date | null {
    if (!val) return null;
    const parts = val.split('.');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (isNaN(d.getTime())) return null;
    return d;
  }

  private toEuDateOnly(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }

  private startOfDay(d: Date): Date {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  private endOfDay(d: Date): Date {
    const copy = new Date(d);
    copy.setHours(23, 59, 59, 999);
    return copy;
  }

  getPerformanceClass(value: number): string {
    if (value >= 90) return 'excellent';
    if (value >= 70) return 'good';
    if (value >= 50) return 'average';
    return 'poor';
  }

  getTrendIcon(growth: number): string {
    if (growth > 0) return '↑';
    if (growth < 0) return '↓';
    return '→';
  }

  getTrendClass(growth: number): string {
    if (growth > 0) return 'positive';
    if (growth < 0) return 'negative';
    return 'neutral';
  }
}
