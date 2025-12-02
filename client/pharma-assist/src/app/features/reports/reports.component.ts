import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

interface ReportCard {
  id: string;
  icon: string;
  titleKey: string;
  descriptionKey: string;
  route: string;
  color: string;
  available: boolean;
}

interface QuickStat {
  labelKey: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="reports-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">{{ 'reports.title' | translate }}</h1>
          <p class="page-description">{{ 'reports.description' | translate }}</p>
        </div>
        <div class="header-actions">
          <div class="date-filter">
            <button class="date-btn" [class.active]="selectedPeriod === 'today'" (click)="selectPeriod('today')">{{ 'reports.periods.today' | translate }}</button>
            <button class="date-btn" [class.active]="selectedPeriod === 'week'" (click)="selectPeriod('week')">{{ 'reports.periods.week' | translate }}</button>
            <button class="date-btn" [class.active]="selectedPeriod === 'month'" (click)="selectPeriod('month')">{{ 'reports.periods.month' | translate }}</button>
            <button class="date-btn" [class.active]="selectedPeriod === 'year'" (click)="selectPeriod('year')">{{ 'reports.periods.year' | translate }}</button>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="stats-grid">
        @for (stat of quickStats(); track stat.labelKey) {
          <div class="stat-card">
            <div class="stat-main">
              <span class="stat-value">{{ stat.value }}</span>
              @if (stat.change !== undefined) {
                <span class="stat-change" [class.positive]="stat.trend === 'up'" [class.negative]="stat.trend === 'down'">
                  @if (stat.trend === 'up') { ↑ } @else if (stat.trend === 'down') { ↓ }
                  {{ stat.change }}%
                </span>
              }
            </div>
            <span class="stat-label">{{ stat.labelKey | translate }}</span>
          </div>
        }
      </div>

      <!-- Report Cards -->
      <div class="section-header">
        <h2>{{ 'reports.availableReports' | translate }}</h2>
      </div>

      <div class="reports-grid">
        @for (report of reportCards; track report.id) {
          <a [routerLink]="report.route" class="report-card" [class.disabled]="!report.available">
            <div class="report-icon" [style.background]="report.color">
              @switch (report.icon) {
                @case ('sales') {
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                }
                @case ('inventory') {
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                }
                @case ('chart') {
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                  </svg>
                }
                @case ('users') {
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                }
                @case ('calendar') {
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                }
                @case ('file') {
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                }
              }
            </div>
            <div class="report-content">
              <h3 class="report-title">{{ report.titleKey | translate }}</h3>
              <p class="report-description">{{ report.descriptionKey | translate }}</p>
            </div>
            <div class="report-arrow">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
            @if (!report.available) {
              <span class="coming-soon">{{ 'common.comingSoon' | translate }}</span>
            }
          </a>
        }
      </div>

      <!-- Recent Reports Section -->
      <div class="section-header">
        <h2>{{ 'reports.recentReports' | translate }}</h2>
        <a routerLink="/reports/history" class="view-all">{{ 'common.viewAll' | translate }} →</a>
      </div>

      <div class="recent-reports">
        @for (report of recentReports(); track $index) {
          <div class="recent-item">
            <div class="recent-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div class="recent-info">
              <span class="recent-name">{{ report.name }}</span>
              <span class="recent-date">{{ report.date | date:'medium' }}</span>
            </div>
            <button class="btn-download" [title]="'common.download' | translate">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
          </div>
        }
        @if (recentReports().length === 0) {
          <div class="no-recent">
            <p>{{ 'reports.noRecentReports' | translate }}</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host{--c1:#1a1a2e;--c2:#6b7280;--c3:#e5e7eb;--c4:#f3f4f6;--c5:#0d9488}
    .reports-page{padding:1.5rem;max-width:1400px;margin:0 auto}
    .page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2rem;gap:1rem;flex-wrap:wrap}
    .page-title{font-size:1.75rem;font-weight:600;color:var(--c1);margin:0 0 .25rem}
    .page-description{color:var(--c2);margin:0;font-size:.9rem}
    .date-filter{display:flex;gap:.25rem;background:#fff;border-radius:8px;padding:.25rem;border:1px solid var(--c3)}
    .date-btn{padding:.5rem 1rem;border:none;background:none;font-size:.875rem;color:var(--c2);cursor:pointer;border-radius:6px;transition:all .2s}
    .date-btn:hover{color:var(--c1)}
    .date-btn.active{background:var(--c5);color:#fff}
    .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:2rem}
    @media(max-width:1024px){.stats-grid{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:640px){.stats-grid{grid-template-columns:1fr}}
    .stat-card{background:#fff;border-radius:12px;padding:1.5rem;border:1px solid var(--c3)}
    .stat-main{display:flex;align-items:baseline;gap:.5rem;margin-bottom:.25rem}
    .stat-value{font-size:1.75rem;font-weight:600;color:var(--c1)}
    .stat-change{font-size:.875rem;font-weight:500}
    .stat-change.positive{color:#059669}
    .stat-change.negative{color:#dc2626}
    .stat-label{font-size:.875rem;color:var(--c2)}
    .section-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem}
    .section-header h2{font-size:1.125rem;font-weight:600;color:var(--c1);margin:0}
    .view-all{font-size:.875rem;color:var(--c5);text-decoration:none}
    .view-all:hover{text-decoration:underline}
    .reports-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:2rem}
    @media(max-width:1024px){.reports-grid{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:640px){.reports-grid{grid-template-columns:1fr}}
    .report-card{display:flex;align-items:center;gap:1rem;padding:1.25rem;background:#fff;border-radius:12px;border:1px solid var(--c3);text-decoration:none;transition:all .2s;position:relative}
    .report-card:hover{border-color:var(--c5);box-shadow:0 4px 12px rgba(0,0,0,.08)}
    .report-card.disabled{opacity:.6;pointer-events:none}
    .report-icon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0}
    .report-content{flex:1;min-width:0}
    .report-title{font-size:.95rem;font-weight:600;color:var(--c1);margin:0 0 .25rem}
    .report-description{font-size:.8rem;color:var(--c2);margin:0;line-height:1.4}
    .report-arrow{color:var(--c3);transition:color .2s}
    .report-card:hover .report-arrow{color:var(--c5)}
    .coming-soon{position:absolute;top:.5rem;right:.5rem;font-size:.65rem;text-transform:uppercase;background:#fef3c7;color:#d97706;padding:.125rem .5rem;border-radius:4px;font-weight:600}
    .recent-reports{background:#fff;border-radius:12px;border:1px solid var(--c3);overflow:hidden}
    .recent-item{display:flex;align-items:center;gap:1rem;padding:1rem 1.25rem;border-bottom:1px solid var(--c3)}
    .recent-item:last-child{border-bottom:none}
    .recent-icon{width:36px;height:36px;border-radius:8px;background:var(--c4);display:flex;align-items:center;justify-content:center;color:var(--c2)}
    .recent-info{flex:1;display:flex;flex-direction:column;gap:.125rem}
    .recent-name{font-size:.9rem;font-weight:500;color:var(--c1)}
    .recent-date{font-size:.8rem;color:var(--c2)}
    .btn-download{width:36px;height:36px;border:none;border-radius:8px;background:transparent;color:var(--c2);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s}
    .btn-download:hover{background:var(--c4);color:var(--c5)}
    .no-recent{padding:2rem;text-align:center;color:var(--c2)}
    @media(max-width:768px){.reports-page{padding:1rem}.page-header{flex-direction:column}.date-filter{width:100%;overflow-x:auto}}
  `]
})
export class ReportsComponent implements OnInit {
  selectedPeriod = 'month';

  reportCards: ReportCard[] = [
    { id: 'sales', icon: 'sales', titleKey: 'reports.types.sales.title', descriptionKey: 'reports.types.sales.description', route: '/reports/sales', color: '#0d9488', available: true },
    { id: 'inventory', icon: 'inventory', titleKey: 'reports.types.inventory.title', descriptionKey: 'reports.types.inventory.description', route: '/reports/inventory', color: '#3b82f6', available: true },
    { id: 'analytics', icon: 'chart', titleKey: 'reports.types.analytics.title', descriptionKey: 'reports.types.analytics.description', route: '/reports/analytics', color: '#8b5cf6', available: true },
    { id: 'customers', icon: 'users', titleKey: 'reports.types.customers.title', descriptionKey: 'reports.types.customers.description', route: '/reports/customers', color: '#f59e0b', available: false },
    { id: 'prescriptions', icon: 'file', titleKey: 'reports.types.prescriptions.title', descriptionKey: 'reports.types.prescriptions.description', route: '/reports/prescriptions', color: '#ec4899', available: false },
    { id: 'expiring', icon: 'calendar', titleKey: 'reports.types.expiring.title', descriptionKey: 'reports.types.expiring.description', route: '/reports/expiring', color: '#ef4444', available: false }
  ];

  quickStats = signal<QuickStat[]>([
    { labelKey: 'reports.stats.totalRevenue', value: '45,230 KM', change: 12.5, trend: 'up' },
    { labelKey: 'reports.stats.ordersCount', value: '128', change: 8.2, trend: 'up' },
    { labelKey: 'reports.stats.avgOrderValue', value: '353.36 KM', change: -2.1, trend: 'down' },
    { labelKey: 'reports.stats.topProduct', value: 'Aspirin 500mg', trend: 'neutral' }
  ]);

  recentReports = signal<{ name: string; date: Date }[]>([
    { name: 'Sales Report - November 2024', date: new Date('2024-11-30') },
    { name: 'Inventory Status Report', date: new Date('2024-11-28') },
    { name: 'Monthly Analytics', date: new Date('2024-11-15') }
  ]);

  ngOnInit(): void {
    // Load actual stats from API
  }

  selectPeriod(period: string): void {
    this.selectedPeriod = period;
    // Reload stats for selected period
  }
}
