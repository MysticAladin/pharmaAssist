import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

import { ReportService } from '../../core/services/report.service';
import { ReportFilters, ReportPeriod, SalesReport } from '../../core/models/report.model';

@Component({
  selector: 'app-sales-report',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, FormsModule],
  templateUrl: './sales-report-component/sales-report.component.html',
  styleUrls: ['./sales-report-component/sales-report.component.scss']
})
export class SalesReportComponent implements OnInit {
  private readonly reportService = inject(ReportService);

  // UI filter state
  startDate: Date = new Date();
  endDate: Date = new Date();
  selectedRange: '7d' | '30d' | 'month' | 'year' | 'custom' = '30d';

  // Loading + report
  loading = signal(false);
  report = signal<SalesReport | null>(null);

  // View-model signals used by the existing template
  totalRevenue = signal(0);
  totalOrders = signal(0);
  avgOrderValue = signal(0);
  revenueGrowth = signal(0);
  ordersGrowth = signal(0);

  dailySales = signal<{ label: string; value: number }[]>([]);
  maxDailySale = signal(1);

  topProducts = signal<{ name: string; value: number; percentage: number }[]>([]);
  topCustomers = signal<{ name: string; value: number; percentage: number }[]>([]);

  ngOnInit(): void {
    this.setRange('30d');
  }

  setRange(range: '7d' | '30d' | 'month' | 'year'): void {
    this.selectedRange = range;
    const today = new Date();
    let start = new Date();
    switch (range) {
      case '7d': start.setDate(today.getDate() - 7); break;
      case '30d': start.setDate(today.getDate() - 30); break;
      case 'month': start = new Date(today.getFullYear(), today.getMonth(), 1); break;
      case 'year': start = new Date(today.getFullYear(), 0, 1); break;
    }
    this.startDate = this.startOfDay(start);
    this.endDate = this.endOfDay(today);
    this.loadReport();
  }

  onStartDateChange(value: string): void {
    const parsed = this.tryParseAnyDate(value);
    if (parsed) {
      this.startDate = this.startOfDay(parsed);
      this.selectedRange = 'custom';
      this.loadReport();
    }
  }

  onEndDateChange(value: string): void {
    const parsed = this.tryParseAnyDate(value);
    if (parsed) {
      this.endDate = this.endOfDay(parsed);
      this.selectedRange = 'custom';
      this.loadReport();
    }
  }

  get startDateText(): string {
    return this.formatEuDate(this.startDate);
  }

  get endDateText(): string {
    return this.formatEuDate(this.endDate);
  }

  get startDateIso(): string {
    return this.toIsoDateOnly(this.startDate);
  }

  get endDateIso(): string {
    return this.toIsoDateOnly(this.endDate);
  }

  private loadReport(): void {
    const filters = this.buildFilters();
    this.loading.set(true);

    this.reportService.getSalesReport(filters).subscribe({
      next: (data) => {
        this.report.set(data);
        this.applyReportToViewModel(data);
        this.loading.set(false);
      },
      error: (err) => {
        // Real-data only: no mock fallback.
        console.error('Failed to load sales report', err);
        this.loading.set(false);
      }
    });
  }

  private buildFilters(): ReportFilters {
    const period: ReportPeriod = this.selectedRange === 'month'
      ? 'this_month'
      : this.selectedRange === 'year'
        ? 'this_year'
        : 'custom';

    return {
      period,
      customRange: {
        start: this.startDate,
        end: this.endDate
      }
    };
  }

  private applyReportToViewModel(data: SalesReport): void {
    this.totalRevenue.set(data.metrics.totalRevenue ?? 0);
    this.totalOrders.set(data.metrics.totalOrders ?? 0);
    this.avgOrderValue.set(data.metrics.averageOrderValue ?? 0);
    this.revenueGrowth.set(data.metrics.revenueGrowth ?? 0);
    this.ordersGrowth.set(data.metrics.ordersGrowth ?? 0);

    const trendPoints = (data.trends ?? []).map(t => ({
      label: this.formatWeekday(t.date),
      value: t.revenue
    }));

    this.dailySales.set(trendPoints);
    const max = trendPoints.reduce((acc, p) => Math.max(acc, p.value), 0);
    this.maxDailySale.set(max > 0 ? max : 1);

    this.topProducts.set((data.topProducts ?? []).map(p => ({
      name: p.name,
      value: p.revenue,
      percentage: p.percentage
    })));

    this.topCustomers.set((data.topCustomers ?? []).map(c => ({
      name: c.name,
      value: c.totalSpent,
      percentage: c.percentage
    })));
  }

  private toIsoDateOnly(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private tryParseAnyDate(value: string): Date | null {
    const trimmed = value.trim();

    // Accept YYYY-MM-DD (ISO)
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const d = new Date(trimmed + 'T00:00:00');
      return Number.isNaN(d.getTime()) ? null : d;
    }

    // Accept dd.MM.yyyy (also allow / or - as separators)
    const m = /^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/.exec(trimmed);
    if (!m) return null;

    const day = Number(m[1]);
    const month = Number(m[2]);
    const year = Number(m[3]);

    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;

    const d = new Date(year, month - 1, day);
    if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
    return d;
  }

  private formatEuDate(date: Date): string {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  }

  private endOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  }

  private formatWeekday(dateStr: string): string {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    // Short weekday in EU locale
    return d.toLocaleDateString('de', { weekday: 'short' });
  }

  generateReport(): void {
    this.loadReport();
  }
}
