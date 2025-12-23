import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ReportService } from '../../core/services/report.service';
import { ReportFilters, ReportPeriod, FinancialReport } from '../../core/models/report.model';

@Component({
  selector: 'app-financial-report',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule, CurrencyPipe, DecimalPipe],
  template: `
    <div class="financial-report">
      <div class="page-header">
        <div class="breadcrumb">
          <a routerLink="/reports">{{ 'reports.title' | translate }}</a>
          <span class="separator">/</span>
          <span>{{ 'reports.financial.title' | translate }}</span>
        </div>
        <div class="header-main">
          <div class="header-content">
            <h1 class="page-title">{{ 'reports.financial.title' | translate }}</h1>
            <p class="page-description">{{ 'reports.financial.subtitle' | translate }}</p>
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
          <div class="metric-card primary">
            <div class="metric-icon">💵</div>
            <div class="metric-content">
              <span class="metric-value">{{ report()!.metrics.grossRevenue | currency:'BAM':'symbol':'1.0-0' }}</span>
              <span class="metric-label">{{ 'reports.financial.grossRevenue' | translate }}</span>
            </div>
          </div>
          <div class="metric-card success">
            <div class="metric-icon">📈</div>
            <div class="metric-content">
              <span class="metric-value">{{ report()!.metrics.grossProfit | currency:'BAM':'symbol':'1.0-0' }}</span>
              <span class="metric-label">{{ 'reports.financial.grossProfit' | translate }}</span>
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-icon">📊</div>
            <div class="metric-content">
              <span class="metric-value">{{ report()!.metrics.grossMargin | number:'1.1-1' }}%</span>
              <span class="metric-label">{{ 'reports.financial.grossMargin' | translate }}</span>
            </div>
          </div>
          <div class="metric-card warning">
            <div class="metric-icon">⏳</div>
            <div class="metric-content">
              <span class="metric-value">{{ report()!.metrics.pendingPayments | currency:'BAM':'symbol':'1.0-0' }}</span>
              <span class="metric-label">{{ 'reports.financial.pendingPayments' | translate }}</span>
            </div>
          </div>
          <div class="metric-card danger">
            <div class="metric-icon">🚨</div>
            <div class="metric-content">
              <span class="metric-value">{{ report()!.metrics.overduePayments | currency:'BAM':'symbol':'1.0-0' }}</span>
              <span class="metric-label">{{ 'reports.financial.overduePayments' | translate }}</span>
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-icon">🧾</div>
            <div class="metric-content">
              <span class="metric-value">{{ report()!.metrics.taxCollected | currency:'BAM':'symbol':'1.0-0' }}</span>
              <span class="metric-label">{{ 'reports.financial.taxCollected' | translate }}</span>
            </div>
          </div>
        </section>

        <!-- Payment Methods -->
        <section class="charts-section">
          <div class="chart-card">
            <h3>{{ 'reports.financial.byPaymentMethod' | translate }}</h3>
            <div class="payment-list">
              @for (method of report()!.byPaymentMethod; track method.method) {
                <div class="payment-item">
                  <div class="payment-info">
                    <span class="payment-method">{{ method.method }}</span>
                    <span class="payment-count">{{ method.count }} {{ 'reports.transactions' | translate }}</span>
                  </div>
                  <div class="payment-bar">
                    <div class="payment-fill" [style.width.%]="method.percentage"></div>
                  </div>
                  <span class="payment-amount">{{ method.amount | currency:'BAM':'symbol':'1.0-0' }}</span>
                </div>
              }
            </div>
          </div>

          <div class="chart-card">
            <h3>{{ 'reports.financial.revenueBreakdown' | translate }}</h3>
            <div class="breakdown-list">
              @for (item of report()!.revenueBreakdown; track item.category) {
                <div class="breakdown-item">
                  <span class="breakdown-category">{{ item.category }}</span>
                  <span class="breakdown-amount">{{ item.amount | currency:'BAM':'symbol':'1.0-0' }}</span>
                  <span class="breakdown-percent">{{ item.percentage | number:'1.1-1' }}%</span>
                </div>
              }
            </div>
          </div>
        </section>

        <!-- Profit Trends -->
        <section class="table-section">
          <div class="table-card">
            <h3>{{ 'reports.financial.profitTrends' | translate }}</h3>
            <table>
              <thead>
                <tr>
                  <th>{{ 'reports.month' | translate }}</th>
                  <th>{{ 'reports.revenue' | translate }}</th>
                  <th>{{ 'reports.cost' | translate }}</th>
                  <th>{{ 'reports.profit' | translate }}</th>
                  <th>{{ 'reports.margin' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                @for (trend of report()!.profitTrends; track trend.date) {
                  <tr>
                    <td>{{ trend.date }}</td>
                    <td>{{ trend.revenue | currency:'BAM':'symbol':'1.0-0' }}</td>
                    <td>{{ trend.cost | currency:'BAM':'symbol':'1.0-0' }}</td>
                    <td class="profit">{{ trend.profit | currency:'BAM':'symbol':'1.0-0' }}</td>
                    <td>{{ trend.margin }}%</td>
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
    .financial-report {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 1rem;
    }

    .breadcrumb a {
      color: var(--primary);
      text-decoration: none;
    }

    .breadcrumb a:hover {
      text-decoration: underline;
    }

    .header-main {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .page-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .page-description {
      margin: 0.25rem 0 0;
      color: var(--text-secondary);
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

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

    .btn-secondary {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
    }

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

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Metrics */
    .metrics-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
    .metric-card.warning { border-color: var(--color-warning); background: rgba(245, 158, 11, 0.05); }
    .metric-card.danger { border-color: var(--color-error); background: rgba(var(--color-error-rgb), 0.05); }

    .metric-icon { font-size: 2rem; }
    .metric-content { display: flex; flex-direction: column; }
    .metric-value { font-size: 1.25rem; font-weight: 700; }
    .metric-label { font-size: 0.8125rem; color: var(--text-secondary); }

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

    .chart-card h3 {
      margin: 0 0 1rem;
      font-size: 1rem;
      font-weight: 600;
    }

    .payment-list, .breakdown-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .payment-item {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .payment-info {
      display: flex;
      flex-direction: column;
      min-width: 140px;
    }

    .payment-method { font-weight: 500; }
    .payment-count { font-size: 0.75rem; color: var(--text-secondary); }

    .payment-bar {
      flex: 1;
      height: 8px;
      background: var(--bg-secondary);
      border-radius: 4px;
      overflow: hidden;
    }

    .payment-fill {
      height: 100%;
      background: var(--primary);
      border-radius: 4px;
    }

    .payment-amount {
      font-weight: 600;
      min-width: 100px;
      text-align: right;
    }

    .breakdown-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--border-color);
    }

    .breakdown-item:last-child { border-bottom: none; }
    .breakdown-category { flex: 1; }
    .breakdown-amount { font-weight: 600; margin-right: 1rem; }
    .breakdown-percent { color: var(--text-secondary); min-width: 50px; text-align: right; }

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

    table {
      width: 100%;
      border-collapse: collapse;
    }

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

    .profit { color: var(--color-success); font-weight: 600; }
  `]
})
export class FinancialReportComponent implements OnInit {
  private readonly reportService = inject(ReportService);

  loading = signal(false);
  report = signal<FinancialReport | null>(null);
  selectedPeriod: ReportPeriod = 'this_month';

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.loading.set(true);
    const filters: ReportFilters = { period: this.selectedPeriod };

    this.reportService.getFinancialReport(filters).subscribe({
      next: (data) => {
        this.report.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  exportReport(): void {
    this.reportService.exportReport('financial', 'csv', { period: this.selectedPeriod });
  }
}
