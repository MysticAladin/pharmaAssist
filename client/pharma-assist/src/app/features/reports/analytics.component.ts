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
  templateUrl: './analytics-component/analytics.component.html',
  styleUrls: ['./analytics-component/analytics.component.scss']
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
