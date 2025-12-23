import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { EuropeanDatePipe } from '../../core/pipes';

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
  imports: [CommonModule, RouterLink, TranslateModule, EuropeanDatePipe],
  templateUrl: './reports-component/reports.component.html',
  styleUrls: ['./reports-component/reports.component.scss']
})
export class ReportsComponent implements OnInit {
  selectedPeriod = 'month';

  reportCards: ReportCard[] = [
    { id: 'builder', icon: 'builder', titleKey: 'reports.types.builder.title', descriptionKey: 'reports.types.builder.description', route: '/reports/builder', color: '#059669', available: true },
    { id: 'sales', icon: 'sales', titleKey: 'reports.types.sales.title', descriptionKey: 'reports.types.sales.description', route: '/reports/sales', color: '#0aaaaa', available: true },
    { id: 'inventory', icon: 'inventory', titleKey: 'reports.types.inventory.title', descriptionKey: 'reports.types.inventory.description', route: '/reports/inventory', color: '#3b82f6', available: true },
    { id: 'analytics', icon: 'chart', titleKey: 'reports.types.analytics.title', descriptionKey: 'reports.types.analytics.description', route: '/reports/analytics', color: '#8b5cf6', available: true },
    { id: 'expiring', icon: 'calendar', titleKey: 'reports.types.expiring.title', descriptionKey: 'reports.types.expiring.description', route: '/reports/expiring', color: '#ef4444', available: true },
    { id: 'customers', icon: 'users', titleKey: 'reports.types.customers.title', descriptionKey: 'reports.types.customers.description', route: '/reports/customers', color: '#f59e0b', available: false },
    { id: 'prescriptions', icon: 'file', titleKey: 'reports.types.prescriptions.title', descriptionKey: 'reports.types.prescriptions.description', route: '/reports/prescriptions', color: '#ec4899', available: false }
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
