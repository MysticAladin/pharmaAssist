import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ReportService } from '../../core/services/report.service';
import {
  SalesRepPerformanceReport,
  SalesRepPerformanceItem,
  SalesRepPerformanceFilter,
  SalesRepOption
} from '../../core/models/report.model';

@Component({
  selector: 'app-sales-rep-performance',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule, CurrencyPipe, DecimalPipe, PercentPipe],
  templateUrl: './sales-rep-performance-component/sales-rep-performance.component.html',
  styleUrls: ['./sales-rep-performance-component/sales-rep-performance.component.scss']
})
export class SalesRepPerformanceComponent implements OnInit {
  private readonly reportService = inject(ReportService);

  loading = signal(false);
  reps = signal<SalesRepOption[]>([]);
  report = signal<SalesRepPerformanceReport | null>(null);

  // Filter fields
  selectedRepId: number | null = null;
  selectedRepType: number | null = null;
  includeInactive = false;
  startDate: Date = new Date();
  endDate: Date = new Date();

  // Rep type options
  readonly repTypes = [
    { value: 0, label: 'salesRep.types.field' },
    { value: 1, label: 'salesRep.types.telesales' },
    { value: 2, label: 'salesRep.types.keyAccount' }
  ];

  ngOnInit(): void {
    // Default: current month
    this.endDate = this.endOfDay(new Date());
    const start = new Date(this.endDate.getFullYear(), this.endDate.getMonth(), 1);
    this.startDate = this.startOfDay(start);

    this.loadReps();
  }

  private loadReps(): void {
    this.reportService.getSalesRepsForFilter().subscribe({
      next: (res) => {
        this.reps.set(res ?? []);
      },
      error: () => {
        this.reps.set([]);
      }
    });
  }

  onStartDateTextChange(value: string): void {
    const parsed = this.tryParseEuDate(value);
    if (!parsed) return;
    this.startDate = this.startOfDay(parsed);
  }

  onEndDateTextChange(value: string): void {
    const parsed = this.tryParseEuDate(value);
    if (!parsed) return;
    this.endDate = this.endOfDay(parsed);
  }

  get startDateText(): string {
    return this.toEuDateOnly(this.startDate);
  }

  get endDateText(): string {
    return this.toEuDateOnly(this.endDate);
  }

  generateReport(): void {
    this.loading.set(true);

    const filter: SalesRepPerformanceFilter = {
      fromDate: this.startDate,
      toDate: this.endDate,
      includeInactive: this.includeInactive
    };

    if (this.selectedRepId) {
      filter.repId = this.selectedRepId;
    }
    if (this.selectedRepType !== null) {
      filter.repType = this.selectedRepType;
    }

    this.reportService.getSalesRepPerformanceReport(filter).subscribe({
      next: (data) => {
        this.report.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load sales rep performance report', err);
        this.report.set(null);
        this.loading.set(false);
      }
    });
  }

  clearFilters(): void {
    this.selectedRepId = null;
    this.selectedRepType = null;
    this.includeInactive = false;

    this.endDate = this.endOfDay(new Date());
    const start = new Date(this.endDate.getFullYear(), this.endDate.getMonth(), 1);
    this.startDate = this.startOfDay(start);

    this.report.set(null);
  }

  getRepTypeName(type: number): string {
    const found = this.repTypes.find(t => t.value === type);
    return found?.label ?? 'common.unknown';
  }

  getPerformanceClass(score: number): string {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'average';
    return 'poor';
  }

  // Date helpers
  private toEuDateOnly(date: Date): string {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }

  private tryParseEuDate(value: string): Date | null {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const normalized = trimmed.replace(/\//g, '.');
    const match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(normalized);
    if (!match) return null;

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null;

    const candidate = new Date(year, month - 1, day);
    if (
      candidate.getFullYear() !== year ||
      candidate.getMonth() !== month - 1 ||
      candidate.getDate() !== day
    ) {
      return null;
    }

    return candidate;
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  }

  private endOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  }
}
