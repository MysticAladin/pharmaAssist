import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SalesAnalyticsService } from '../../../core/services/sales-analytics.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SalesDashboard, SalesAnalyticsFilter } from '../../../core/models/wholesaler.model';

@Component({
  selector: 'app-sales-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule
  ],
  templateUrl: './sales-dashboard.component.html'
})
export class SalesDashboardComponent {
  private readonly analyticsService = inject(SalesAnalyticsService);
  private readonly notification = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  dashboard = signal<SalesDashboard | null>(null);
  loading = signal(false);
  filter = signal<SalesAnalyticsFilter>({});

  constructor() {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.analyticsService.getDashboard(this.filter()).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.dashboard.set(response.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('salesAnalytics.loadError'));
        this.loading.set(false);
      }
    });
  }

  onDateFromChange(value: string): void {
    this.filter.update(f => ({ ...f, dateFrom: value || undefined }));
    this.loadDashboard();
  }

  onDateToChange(value: string): void {
    this.filter.update(f => ({ ...f, dateTo: value || undefined }));
    this.loadDashboard();
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'BAM', minimumFractionDigits: 2 });
  }

  formatNumber(value: number): string {
    return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
}
