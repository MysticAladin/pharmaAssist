import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

interface KPI {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  target?: string;
}

interface Insight {
  type: 'success' | 'warning' | 'info';
  title: string;
  description: string;
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="analytics">
      <div class="page-header">
        <div class="breadcrumb">
          <a routerLink="/reports">{{ 'reports.title' | translate }}</a>
          <span class="separator">/</span>
          <span>{{ 'reports.analytics.title' | translate }}</span>
        </div>
        <div class="header-main">
          <div class="header-content">
            <h1 class="page-title">{{ 'reports.analytics.title' | translate }}</h1>
            <p class="page-description">{{ 'reports.analytics.subtitle' | translate }}</p>
          </div>
          <div class="header-actions">
            <div class="period-selector">
              <button [class.active]="period === 'week'" (click)="setPeriod('week')">Week</button>
              <button [class.active]="period === 'month'" (click)="setPeriod('month')">Month</button>
              <button [class.active]="period === 'quarter'" (click)="setPeriod('quarter')">Quarter</button>
              <button [class.active]="period === 'year'" (click)="setPeriod('year')">Year</button>
            </div>
          </div>
        </div>
      </div>

      <!-- KPI Grid -->
      <div class="section-title">{{ 'reports.analytics.kpis' | translate }}</div>
      <div class="kpi-grid">
        @for (kpi of kpis(); track kpi.label) {
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-label">{{ kpi.label }}</span>
              <span class="kpi-trend" [class]="kpi.trend">
                @if (kpi.trend === 'up') { ↑ } @else if (kpi.trend === 'down') { ↓ }
                {{ kpi.change > 0 ? '+' : '' }}{{ kpi.change }}%
              </span>
            </div>
            <div class="kpi-value">{{ kpi.value }}</div>
            @if (kpi.target) {
              <div class="kpi-target">Target: {{ kpi.target }}</div>
            }
          </div>
        }
      </div>

      <!-- Trends Chart -->
      <div class="trends-section">
        <h3 class="section-title">{{ 'reports.analytics.trends' | translate }}</h3>
        <div class="trend-chart">
          <div class="chart-legend">
            <span class="legend-item"><span class="dot revenue"></span> Revenue</span>
            <span class="legend-item"><span class="dot orders"></span> Orders</span>
          </div>
          <div class="chart-area">
            <div class="y-axis">
              <span>50K</span><span>40K</span><span>30K</span><span>20K</span><span>10K</span><span>0</span>
            </div>
            <div class="chart-lines">
              @for (point of trendData(); track $index) {
                <div class="chart-column">
                  <div class="column-bars">
                    <div class="bar revenue" [style.height.%]="(point.revenue / 50000) * 100"></div>
                    <div class="bar orders" [style.height.%]="(point.orders / 200) * 100"></div>
                  </div>
                  <span class="x-label">{{ point.label }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Insights & Recommendations -->
      <div class="bottom-section">
        <div class="insights-card">
          <h3 class="section-title">{{ 'reports.analytics.insights' | translate }}</h3>
          <div class="insights-list">
            @for (insight of insights(); track insight.title) {
              <div class="insight-item" [class]="insight.type">
                <div class="insight-icon">
                  @switch (insight.type) {
                    @case ('success') { <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> }
                    @case ('warning') { <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }
                    @case ('info') { <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> }
                  }
                </div>
                <div class="insight-content">
                  <span class="insight-title">{{ insight.title }}</span>
                  <span class="insight-desc">{{ insight.description }}</span>
                </div>
              </div>
            }
          </div>
        </div>

        <div class="recommendations-card">
          <h3 class="section-title">{{ 'reports.analytics.recommendations' | translate }}</h3>
          <div class="recommendations-list">
            @for (rec of recommendations(); track rec; let i = $index) {
              <div class="recommendation-item">
                <span class="rec-number">{{ i + 1 }}</span>
                <span class="rec-text">{{ rec }}</span>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Period Comparison -->
      <div class="comparison-section">
        <h3 class="section-title">{{ 'reports.analytics.comparison' | translate }}</h3>
        <div class="comparison-table">
          <div class="comp-header">
            <span>Metric</span>
            <span>Current Period</span>
            <span>Previous Period</span>
            <span>Change</span>
          </div>
          @for (row of comparisonData(); track row.metric) {
            <div class="comp-row">
              <span class="comp-metric">{{ row.metric }}</span>
              <span class="comp-current">{{ row.current }}</span>
              <span class="comp-previous">{{ row.previous }}</span>
              <span class="comp-change" [class.positive]="row.changePercent > 0" [class.negative]="row.changePercent < 0">
                {{ row.changePercent > 0 ? '+' : '' }}{{ row.changePercent }}%
              </span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host{--c1:#1a1a2e;--c2:#6b7280;--c3:#e5e7eb;--c4:#f3f4f6;--c5:#0aaaaa;--c6:#088888;--c7:#dc2626;--c8:#f59e0b;--c9:#3b82f6}
    .analytics{padding:1.5rem;max-width:1400px;margin:0 auto}
    .page-header{margin-bottom:1.5rem}
    .breadcrumb{font-size:.875rem;color:var(--c2);margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem}
    .breadcrumb a{color:var(--c5);text-decoration:none}
    .separator{color:var(--c3)}
    .header-main{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;flex-wrap:wrap}
    .page-title{font-size:1.5rem;font-weight:600;color:var(--c1);margin:0 0 .25rem}
    .page-description{color:var(--c2);margin:0;font-size:.9rem}
    .period-selector{display:flex;gap:.25rem;background:#fff;border-radius:8px;padding:.25rem;border:1px solid var(--c3)}
    .period-selector button{padding:.5rem 1rem;border:none;background:none;font-size:.8rem;color:var(--c2);cursor:pointer;border-radius:6px;transition:all .2s}
    .period-selector button:hover{color:var(--c1)}
    .period-selector button.active{background:var(--c5);color:#fff}
    .section-title{font-size:1rem;font-weight:600;color:var(--c1);margin:0 0 1rem}
    .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem}
    @media(max-width:1024px){.kpi-grid{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:640px){.kpi-grid{grid-template-columns:1fr}}
    .kpi-card{background:#fff;border-radius:12px;padding:1.25rem;border:1px solid var(--c3)}
    .kpi-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem}
    .kpi-label{font-size:.8rem;color:var(--c2);text-transform:uppercase;font-weight:500}
    .kpi-trend{font-size:.75rem;font-weight:600;padding:.25rem .5rem;border-radius:4px}
    .kpi-trend.up{background:#dcfce7;color:var(--c6)}
    .kpi-trend.down{background:#fee2e2;color:var(--c7)}
    .kpi-trend.neutral{background:var(--c4);color:var(--c2)}
    .kpi-value{font-size:1.75rem;font-weight:700;color:var(--c1)}
    .kpi-target{font-size:.75rem;color:var(--c2);margin-top:.375rem}
    .trends-section{background:#fff;border-radius:12px;padding:1.25rem;border:1px solid var(--c3);margin-bottom:1.5rem}
    .chart-legend{display:flex;gap:1.5rem;margin-bottom:1rem}
    .legend-item{display:flex;align-items:center;gap:.375rem;font-size:.8rem;color:var(--c2)}
    .dot{width:10px;height:10px;border-radius:50%}
    .dot.revenue{background:var(--c5)}
    .dot.orders{background:var(--c9)}
    .chart-area{display:flex;gap:.5rem}
    .y-axis{display:flex;flex-direction:column;justify-content:space-between;font-size:.7rem;color:var(--c2);padding:.5rem 0;text-align:right;width:40px}
    .chart-lines{display:flex;flex:1;gap:.5rem;align-items:flex-end;height:200px;padding-bottom:1.5rem;position:relative;border-bottom:1px solid var(--c3)}
    .chart-column{flex:1;display:flex;flex-direction:column;align-items:center;height:100%;position:relative}
    .column-bars{display:flex;gap:4px;align-items:flex-end;height:100%}
    .bar{width:16px;border-radius:4px 4px 0 0;transition:height .3s}
    .bar.revenue{background:var(--c5)}
    .bar.orders{background:var(--c9)}
    .x-label{font-size:.7rem;color:var(--c2);position:absolute;bottom:-1.25rem}
    .bottom-section{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem}
    @media(max-width:768px){.bottom-section{grid-template-columns:1fr}}
    .insights-card,.recommendations-card{background:#fff;border-radius:12px;padding:1.25rem;border:1px solid var(--c3)}
    .insights-list{display:flex;flex-direction:column;gap:.75rem}
    .insight-item{display:flex;gap:.75rem;padding:.75rem;border-radius:8px}
    .insight-item.success{background:#f0fdf4}
    .insight-item.warning{background:#fffbeb}
    .insight-item.info{background:#eff6ff}
    .insight-icon{flex-shrink:0}
    .insight-item.success .insight-icon{color:var(--c6)}
    .insight-item.warning .insight-icon{color:var(--c8)}
    .insight-item.info .insight-icon{color:var(--c9)}
    .insight-content{display:flex;flex-direction:column;gap:.125rem}
    .insight-title{font-size:.875rem;font-weight:600;color:var(--c1)}
    .insight-desc{font-size:.8rem;color:var(--c2)}
    .recommendations-list{display:flex;flex-direction:column;gap:.75rem}
    .recommendation-item{display:flex;gap:.75rem;align-items:flex-start}
    .rec-number{width:24px;height:24px;border-radius:50%;background:var(--c5);color:#fff;font-size:.75rem;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .rec-text{font-size:.875rem;color:var(--c1);line-height:1.5}
    .comparison-section{background:#fff;border-radius:12px;padding:1.25rem;border:1px solid var(--c3)}
    .comparison-table{margin-top:.5rem}
    .comp-header,.comp-row{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:1rem;padding:.75rem 0;align-items:center}
    .comp-header{font-size:.75rem;text-transform:uppercase;font-weight:600;color:var(--c2);border-bottom:1px solid var(--c3)}
    .comp-row{border-bottom:1px solid var(--c4);font-size:.875rem}
    .comp-row:last-child{border-bottom:none}
    .comp-metric{font-weight:500;color:var(--c1)}
    .comp-current{font-weight:600;color:var(--c1)}
    .comp-previous{color:var(--c2)}
    .comp-change{font-weight:600}
    .comp-change.positive{color:var(--c6)}
    .comp-change.negative{color:var(--c7)}
    @media(max-width:640px){.analytics{padding:1rem}.header-main{flex-direction:column}.period-selector{width:100%;justify-content:center}}
  `]
})
export class AnalyticsComponent implements OnInit {
  period = 'month';

  kpis = signal<KPI[]>([
    { label: 'Revenue', value: '145,230 KM', change: 12.5, trend: 'up', target: '150,000 KM' },
    { label: 'Orders', value: '428', change: 8.2, trend: 'up', target: '450' },
    { label: 'Customers', value: '89', change: 15.3, trend: 'up' },
    { label: 'Avg. Order', value: '339 KM', change: -2.1, trend: 'down', target: '350 KM' }
  ]);

  trendData = signal([
    { label: 'Jan', revenue: 32000, orders: 95 },
    { label: 'Feb', revenue: 28500, orders: 82 },
    { label: 'Mar', revenue: 35200, orders: 108 },
    { label: 'Apr', revenue: 38900, orders: 115 },
    { label: 'May', revenue: 42100, orders: 128 },
    { label: 'Jun', revenue: 45230, orders: 135 }
  ]);

  insights = signal<Insight[]>([
    { type: 'success', title: 'Strong Growth', description: 'Revenue increased 12.5% compared to last period' },
    { type: 'warning', title: 'Stock Alert', description: '23 products are below reorder level' },
    { type: 'info', title: 'Seasonal Pattern', description: 'Sales typically increase 15% in December' }
  ]);

  recommendations = signal([
    'Consider increasing stock for top-selling antibiotics before flu season',
    'Review pricing strategy for cardiovascular medications - margins below target',
    'Expand customer base in Zenica region - high growth potential identified',
    'Implement automated reordering for frequently depleted items'
  ]);

  comparisonData = signal([
    { metric: 'Total Revenue', current: '145,230 KM', previous: '129,100 KM', changePercent: 12.5 },
    { metric: 'Number of Orders', current: '428', previous: '395', changePercent: 8.4 },
    { metric: 'New Customers', current: '12', previous: '8', changePercent: 50 },
    { metric: 'Average Order Value', current: '339 KM', previous: '327 KM', changePercent: 3.7 },
    { metric: 'Returns', current: '8', previous: '12', changePercent: -33.3 }
  ]);

  ngOnInit(): void {}

  setPeriod(p: string): void {
    this.period = p;
  }
}
