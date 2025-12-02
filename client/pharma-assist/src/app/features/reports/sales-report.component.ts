import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

interface SalesData {
  period: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
}

interface TopItem {
  name: string;
  value: number;
  percentage: number;
}

@Component({
  selector: 'app-sales-report',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, FormsModule],
  template: `
    <div class="sales-report">
      <div class="page-header">
        <div class="breadcrumb">
          <a routerLink="/reports">{{ 'reports.title' | translate }}</a>
          <span class="separator">/</span>
          <span>{{ 'reports.sales.title' | translate }}</span>
        </div>
        <div class="header-main">
          <div class="header-content">
            <h1 class="page-title">{{ 'reports.sales.title' | translate }}</h1>
            <p class="page-description">{{ 'reports.sales.subtitle' | translate }}</p>
          </div>
          <div class="header-actions">
            <button class="btn-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {{ 'reports.actions.export' | translate }}
            </button>
            <button class="btn-primary" (click)="generateReport()">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              {{ 'reports.actions.generate' | translate }}
            </button>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="date-range">
          <label>{{ 'reports.filters.dateRange' | translate }}</label>
          <div class="date-inputs">
            <input type="date" [(ngModel)]="startDate" class="date-input">
            <span class="date-separator">-</span>
            <input type="date" [(ngModel)]="endDate" class="date-input">
          </div>
        </div>
        <div class="quick-ranges">
          <button class="range-btn" [class.active]="selectedRange === '7d'" (click)="setRange('7d')">{{ 'reports.filters.last7Days' | translate }}</button>
          <button class="range-btn" [class.active]="selectedRange === '30d'" (click)="setRange('30d')">{{ 'reports.filters.last30Days' | translate }}</button>
          <button class="range-btn" [class.active]="selectedRange === 'month'" (click)="setRange('month')">{{ 'reports.filters.thisMonth' | translate }}</button>
          <button class="range-btn" [class.active]="selectedRange === 'year'" (click)="setRange('year')">{{ 'reports.filters.thisYear' | translate }}</button>
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon revenue"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
          <div class="stat-content">
            <span class="stat-label">{{ 'reports.sales.revenue' | translate }}</span>
            <span class="stat-value">{{ totalRevenue() | number:'1.2-2' }} KM</span>
            <span class="stat-change positive">↑ 12.5%</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon orders"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg></div>
          <div class="stat-content">
            <span class="stat-label">{{ 'reports.sales.orders' | translate }}</span>
            <span class="stat-value">{{ totalOrders() }}</span>
            <span class="stat-change positive">↑ 8.2%</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon avg"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
          <div class="stat-content">
            <span class="stat-label">{{ 'reports.sales.avgOrderValue' | translate }}</span>
            <span class="stat-value">{{ avgOrderValue() | number:'1.2-2' }} KM</span>
            <span class="stat-change negative">↓ 2.1%</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon growth"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg></div>
          <div class="stat-content">
            <span class="stat-label">{{ 'reports.sales.growth' | translate }}</span>
            <span class="stat-value">+15.3%</span>
            <span class="stat-change positive">vs last period</span>
          </div>
        </div>
      </div>

      <!-- Charts Placeholder -->
      <div class="charts-section">
        <div class="chart-card large">
          <h3 class="chart-title">{{ 'reports.sales.dailySales' | translate }}</h3>
          <div class="chart-placeholder">
            <div class="bar-chart">
              @for (day of dailySales(); track $index) {
                <div class="bar-container">
                  <div class="bar" [style.height.%]="(day.value / maxDailySale()) * 100"></div>
                  <span class="bar-label">{{ day.label }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Top Products & Customers -->
      <div class="lists-section">
        <div class="list-card">
          <h3 class="list-title">{{ 'reports.sales.topProducts' | translate }}</h3>
          <div class="list-items">
            @for (product of topProducts(); track product.name) {
              <div class="list-item">
                <div class="item-info">
                  <span class="item-rank">{{ $index + 1 }}</span>
                  <span class="item-name">{{ product.name }}</span>
                </div>
                <div class="item-stats">
                  <span class="item-value">{{ product.value | number:'1.2-2' }} KM</span>
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="product.percentage"></div>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
        <div class="list-card">
          <h3 class="list-title">{{ 'reports.sales.topCustomers' | translate }}</h3>
          <div class="list-items">
            @for (customer of topCustomers(); track customer.name) {
              <div class="list-item">
                <div class="item-info">
                  <span class="item-rank">{{ $index + 1 }}</span>
                  <span class="item-name">{{ customer.name }}</span>
                </div>
                <div class="item-stats">
                  <span class="item-value">{{ customer.value | number:'1.2-2' }} KM</span>
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="customer.percentage"></div>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host{--c1:#1a1a2e;--c2:#6b7280;--c3:#e5e7eb;--c4:#f3f4f6;--c5:#0d9488;--c6:#059669;--c7:#dc2626}
    .sales-report{padding:1.5rem;max-width:1400px;margin:0 auto}
    .page-header{margin-bottom:1.5rem}
    .breadcrumb{font-size:.875rem;color:var(--c2);margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem}
    .breadcrumb a{color:var(--c5);text-decoration:none}
    .breadcrumb a:hover{text-decoration:underline}
    .separator{color:var(--c3)}
    .header-main{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;flex-wrap:wrap}
    .page-title{font-size:1.5rem;font-weight:600;color:var(--c1);margin:0 0 .25rem}
    .page-description{color:var(--c2);margin:0;font-size:.9rem}
    .header-actions{display:flex;gap:.75rem}
    .btn-primary,.btn-secondary{display:flex;align-items:center;gap:.5rem;padding:.625rem 1rem;border-radius:8px;font-size:.875rem;font-weight:500;cursor:pointer;transition:all .2s}
    .btn-primary{background:var(--c5);color:#fff;border:none}
    .btn-primary:hover{background:#0f766e}
    .btn-secondary{background:#fff;color:var(--c1);border:1px solid var(--c3)}
    .btn-secondary:hover{border-color:var(--c5);color:var(--c5)}
    .filters-bar{background:#fff;border-radius:12px;padding:1rem;border:1px solid var(--c3);margin-bottom:1.5rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem}
    .date-range label{font-size:.75rem;text-transform:uppercase;font-weight:600;color:var(--c2);display:block;margin-bottom:.375rem}
    .date-inputs{display:flex;align-items:center;gap:.5rem}
    .date-input{padding:.5rem;border:1px solid var(--c3);border-radius:6px;font-size:.875rem}
    .date-separator{color:var(--c2)}
    .quick-ranges{display:flex;gap:.25rem}
    .range-btn{padding:.5rem 1rem;border:1px solid var(--c3);background:#fff;border-radius:6px;font-size:.8rem;color:var(--c2);cursor:pointer;transition:all .2s}
    .range-btn:hover{border-color:var(--c5);color:var(--c5)}
    .range-btn.active{background:var(--c5);color:#fff;border-color:var(--c5)}
    .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem}
    @media(max-width:1024px){.stats-grid{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:640px){.stats-grid{grid-template-columns:1fr}}
    .stat-card{background:#fff;border-radius:12px;padding:1.25rem;border:1px solid var(--c3);display:flex;align-items:flex-start;gap:1rem}
    .stat-icon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0}
    .stat-icon.revenue{background:var(--c6)}
    .stat-icon.orders{background:#3b82f6}
    .stat-icon.avg{background:#8b5cf6}
    .stat-icon.growth{background:#f59e0b}
    .stat-content{display:flex;flex-direction:column;gap:.125rem}
    .stat-label{font-size:.8rem;color:var(--c2)}
    .stat-value{font-size:1.375rem;font-weight:600;color:var(--c1)}
    .stat-change{font-size:.75rem;font-weight:500}
    .stat-change.positive{color:var(--c6)}
    .stat-change.negative{color:var(--c7)}
    .charts-section{margin-bottom:1.5rem}
    .chart-card{background:#fff;border-radius:12px;padding:1.25rem;border:1px solid var(--c3)}
    .chart-card.large{grid-column:span 2}
    .chart-title{font-size:1rem;font-weight:600;color:var(--c1);margin:0 0 1rem}
    .chart-placeholder{height:200px}
    .bar-chart{display:flex;align-items:flex-end;justify-content:space-between;height:100%;gap:.5rem;padding-bottom:1.5rem}
    .bar-container{display:flex;flex-direction:column;align-items:center;flex:1;height:100%}
    .bar{width:100%;max-width:40px;background:linear-gradient(180deg,var(--c5),#14b8a6);border-radius:4px 4px 0 0;transition:height .3s}
    .bar-label{font-size:.65rem;color:var(--c2);margin-top:.5rem;position:absolute;bottom:0}
    .bar-container{position:relative}
    .lists-section{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem}
    @media(max-width:768px){.lists-section{grid-template-columns:1fr}}
    .list-card{background:#fff;border-radius:12px;padding:1.25rem;border:1px solid var(--c3)}
    .list-title{font-size:1rem;font-weight:600;color:var(--c1);margin:0 0 1rem}
    .list-items{display:flex;flex-direction:column;gap:.75rem}
    .list-item{display:flex;justify-content:space-between;align-items:center;gap:1rem}
    .item-info{display:flex;align-items:center;gap:.75rem}
    .item-rank{width:24px;height:24px;border-radius:50%;background:var(--c4);color:var(--c2);font-size:.75rem;font-weight:600;display:flex;align-items:center;justify-content:center}
    .item-name{font-size:.875rem;color:var(--c1)}
    .item-stats{display:flex;align-items:center;gap:.75rem;flex:1;justify-content:flex-end}
    .item-value{font-size:.875rem;font-weight:600;color:var(--c1);white-space:nowrap}
    .progress-bar{width:80px;height:6px;background:var(--c4);border-radius:3px;overflow:hidden}
    .progress-fill{height:100%;background:var(--c5);border-radius:3px}
    @media(max-width:640px){.sales-report{padding:1rem}.header-main{flex-direction:column}.header-actions{width:100%}.header-actions button{flex:1;justify-content:center}}
  `]
})
export class SalesReportComponent implements OnInit {
  startDate = '';
  endDate = '';
  selectedRange = '30d';

  totalRevenue = signal(45230.50);
  totalOrders = signal(128);
  avgOrderValue = signal(353.36);

  dailySales = signal([
    { label: 'Mon', value: 5200 },
    { label: 'Tue', value: 4800 },
    { label: 'Wed', value: 6100 },
    { label: 'Thu', value: 5500 },
    { label: 'Fri', value: 7200 },
    { label: 'Sat', value: 8900 },
    { label: 'Sun', value: 3200 }
  ]);

  maxDailySale = signal(8900);

  topProducts = signal<TopItem[]>([
    { name: 'Aspirin 500mg', value: 8450.00, percentage: 100 },
    { name: 'Ibuprofen 400mg', value: 6230.50, percentage: 74 },
    { name: 'Paracetamol 500mg', value: 5120.00, percentage: 61 },
    { name: 'Vitamin C 1000mg', value: 4890.00, percentage: 58 },
    { name: 'Omeprazol 20mg', value: 3560.00, percentage: 42 }
  ]);

  topCustomers = signal<TopItem[]>([
    { name: 'Gradska Apoteka Sarajevo', value: 12500.00, percentage: 100 },
    { name: 'Apoteka Centar Mostar', value: 9800.50, percentage: 78 },
    { name: 'Klinički Centar Tuzla', value: 7450.00, percentage: 60 },
    { name: 'Apoteka Banja Luka', value: 5230.00, percentage: 42 },
    { name: 'Dom Zdravlja Zenica', value: 4120.00, percentage: 33 }
  ]);

  ngOnInit(): void {
    this.setRange('30d');
  }

  setRange(range: string): void {
    this.selectedRange = range;
    const today = new Date();
    let start = new Date();
    switch (range) {
      case '7d': start.setDate(today.getDate() - 7); break;
      case '30d': start.setDate(today.getDate() - 30); break;
      case 'month': start = new Date(today.getFullYear(), today.getMonth(), 1); break;
      case 'year': start = new Date(today.getFullYear(), 0, 1); break;
    }
    this.startDate = start.toISOString().split('T')[0];
    this.endDate = today.toISOString().split('T')[0];
  }

  generateReport(): void {
    // Generate report logic
  }
}
