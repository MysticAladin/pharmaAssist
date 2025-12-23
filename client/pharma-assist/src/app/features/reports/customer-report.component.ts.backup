import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ReportService } from '../../core/services/report.service';
import { ReportFilters, ReportPeriod, CustomerReport } from '../../core/models/report.model';

@Component({
  selector: 'app-customer-report',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule, CurrencyPipe, DecimalPipe],
  template: `
    <div class="customer-report">
      <div class="page-header">
        <div class="breadcrumb">
          <a routerLink="/reports">{{ 'reports.title' | translate }}</a>
          <span class="separator">/</span>
          <span>{{ 'reports.customers.title' | translate }}</span>
        </div>
        <div class="header-main">
          <div class="header-content">
            <h1 class="page-title">{{ 'reports.customers.title' | translate }}</h1>
            <p class="page-description">{{ 'reports.customers.subtitle' | translate }}</p>
          </div>
          <div class="header-actions">
            <select [(ngModel)]="selectedPeriod" (ngModelChange)="loadReport()">
              <option value="this_month">{{ 'reports.periods.thisMonth' | translate }}</option>
              <option value="last_month">{{ 'reports.periods.lastMonth' | translate }}</option>
              <option value="this_quarter">{{ 'reports.periods.thisQuarter' | translate }}</option>
              <option value="this_year">{{ 'reports.periods.thisYear' | translate }}</option>
            </select>
            <button class="btn btn-secondary" (click)="exportReport()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {{ 'common.export' | translate }}
            </button>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <span>{{ 'common.loading' | translate }}</span>
        </div>
      } @else if (report()) {
        <!-- Key Metrics -->
        <section class="metrics-section">
          <div class="metric-card">
            <div class="metric-icon">👥</div>
            <div class="metric-content">
              <span class="metric-value">{{ report()!.metrics.totalCustomers | number }}</span>
              <span class="metric-label">{{ 'reports.customers.totalCustomers' | translate }}</span>
            </div>
          </div>
          <div class="metric-card success">
            <div class="metric-icon">✅</div>
            <div class="metric-content">
              <span class="metric-value">{{ report()!.metrics.activeCustomers | number }}</span>
              <span class="metric-label">{{ 'reports.customers.activeCustomers' | translate }}</span>
            </div>
          </div>
          <div class="metric-card primary">
            <div class="metric-icon">🆕</div>
            <div class="metric-content">
              <span class="metric-value">{{ report()!.metrics.newCustomers }}</span>
              <span class="metric-label">{{ 'reports.customers.newCustomers' | translate }}</span>
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-icon">🔄</div>
            <div class="metric-content">
              <span class="metric-value">{{ report()!.metrics.repeatCustomerRate | number:'1.1-1' }}%</span>
              <span class="metric-label">{{ 'reports.customers.repeatRate' | translate }}</span>
            </div>
          </div>
        </section>

        <!-- Lifetime Value Highlight -->
        <section class="highlight-section">
          <div class="highlight-card">
            <span class="highlight-label">{{ 'reports.customers.avgLifetimeValue' | translate }}</span>
            <span class="highlight-value">{{ report()!.metrics.averageLifetimeValue | currency:'BAM':'symbol':'1.0-0' }}</span>
          </div>
        </section>

        <!-- Customer Segments -->
        <section class="charts-section">
          <div class="chart-card">
            <h3>{{ 'reports.customers.bySegment' | translate }}</h3>
            <div class="segment-list">
              @for (segment of report()!.segments; track segment.name) {
                <div class="segment-item">
                  <div class="segment-info">
                    <span class="segment-name">{{ segment.name }}</span>
                    <span class="segment-count">{{ segment.count }} {{ 'reports.customers.customers' | translate }}</span>
                  </div>
                  <div class="segment-bar">
                    <div class="segment-fill" [style.width.%]="segment.percentage"></div>
                  </div>
                  <span class="segment-value">{{ segment.revenue | currency:'BAM':'symbol':'1.0-0' }}</span>
                </div>
              }
            </div>
          </div>

          <div class="chart-card">
            <h3>{{ 'reports.customers.growth' | translate }}</h3>
            <div class="growth-list">
              @for (point of report()!.growth; track point.date) {
                <div class="growth-item">
                  <span class="growth-month">{{ point.date }}</span>
                  <span class="growth-new">+{{ point.newCustomers }}</span>
                  <span class="growth-total">{{ point.totalCustomers }} total</span>
                </div>
              }
            </div>
          </div>
        </section>

        <!-- Top Customers -->
        <section class="table-section">
          <div class="table-card">
            <h3>{{ 'reports.customers.topCustomers' | translate }}</h3>
            <table>
              <thead>
                <tr>
                  <th>{{ 'common.customer' | translate }}</th>
                  <th>{{ 'reports.orders' | translate }}</th>
                  <th>{{ 'reports.totalSpent' | translate }}</th>
                  <th>{{ 'reports.percentage' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                @for (customer of report()!.topCustomers; track customer.id) {
                  <tr>
                    <td>
                      <span class="customer-name">{{ customer.name }}</span>
                      <span class="customer-email">{{ customer.email }}</span>
                    </td>
                    <td>{{ customer.orders }}</td>
                    <td>{{ customer.totalSpent | currency:'BAM':'symbol':'1.0-0' }}</td>
                    <td>{{ customer.percentage | number:'1.1-1' }}%</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .customer-report {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header { margin-bottom: 2rem; }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 1rem;
    }

    .breadcrumb a { color: var(--primary); text-decoration: none; }
    .breadcrumb a:hover { text-decoration: underline; }

    .header-main {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .page-title { margin: 0; font-size: 1.5rem; font-weight: 600; }
    .page-description { margin: 0.25rem 0 0; color: var(--text-secondary); }

    .header-actions { display: flex; gap: 0.75rem; }

    .header-actions select {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: var(--bg-primary);
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 8px;
      font-size: 0.875rem;
      cursor: pointer;
    }

    .btn-secondary { background: var(--bg-secondary); border: 1px solid var(--border-color); }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 4rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border-color);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* Metrics */
    .metrics-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .metric-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 12px;
    }

    .metric-card.primary { border-color: var(--primary); background: rgba(79, 70, 229, 0.05); }
    .metric-card.success { border-color: var(--color-success); background: rgba(var(--color-success-rgb), 0.05); }

    .metric-icon { font-size: 2rem; }
    .metric-content { display: flex; flex-direction: column; }
    .metric-value { font-size: 1.5rem; font-weight: 700; }
    .metric-label { font-size: 0.8125rem; color: var(--text-secondary); }

    /* Highlight */
    .highlight-section { margin-bottom: 1.5rem; }

    .highlight-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 2rem;
      background: linear-gradient(135deg, var(--primary), #818cf8);
      border-radius: 12px;
      color: white;
    }

    .highlight-label { font-size: 0.875rem; opacity: 0.9; }
    .highlight-value { font-size: 2.5rem; font-weight: 700; }

    /* Charts */
    .charts-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .chart-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.25rem;
    }

    .chart-card h3 { margin: 0 0 1rem; font-size: 1rem; font-weight: 600; }

    .segment-list, .growth-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .segment-item {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .segment-info {
      display: flex;
      flex-direction: column;
      min-width: 120px;
    }

    .segment-name { font-weight: 500; }
    .segment-count { font-size: 0.75rem; color: var(--text-secondary); }

    .segment-bar {
      flex: 1;
      height: 8px;
      background: var(--bg-secondary);
      border-radius: 4px;
      overflow: hidden;
    }

    .segment-fill {
      height: 100%;
      background: var(--primary);
      border-radius: 4px;
    }

    .segment-value {
      font-weight: 600;
      min-width: 100px;
      text-align: right;
    }

    .growth-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem;
      background: var(--bg-secondary);
      border-radius: 8px;
    }

    .growth-month { color: var(--text-secondary); }
    .growth-new { color: var(--color-success); font-weight: 600; }
    .growth-total { color: var(--text-secondary); font-size: 0.875rem; }

    /* Table */
    .table-section { margin-bottom: 1.5rem; }

    .table-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      overflow: hidden;
    }

    .table-card h3 {
      margin: 0;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
      font-size: 1rem;
      font-weight: 600;
    }

    table { width: 100%; border-collapse: collapse; }

    th, td {
      padding: 0.75rem 1.25rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }

    th {
      background: var(--bg-secondary);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
    }

    .customer-name { display: block; font-weight: 500; }
    .customer-email { display: block; font-size: 0.75rem; color: var(--text-secondary); }
  `]
})
export class CustomerReportComponent implements OnInit {
  private readonly reportService = inject(ReportService);

  loading = signal(false);
  report = signal<CustomerReport | null>(null);
  selectedPeriod: ReportPeriod = 'this_month';

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.loading.set(true);
    const filters: ReportFilters = { period: this.selectedPeriod };

    this.reportService.getCustomerReport(filters).subscribe({
      next: (data) => {
        this.report.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  exportReport(): void {
    this.reportService.exportReport('customer', 'csv', { period: this.selectedPeriod });
  }
}
