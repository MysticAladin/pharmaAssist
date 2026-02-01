import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil, forkJoin, interval } from 'rxjs';
import {
  RepDashboardService,
  RepDashboardSummary,
  RepDashboardWidgets,
  RecentOrder,
  TodaySchedule,
  TopCustomer,
  SalesTrends,
  RepTargetProgress
} from '../../services/rep-dashboard.service';
import { KmCurrencyPipe } from '../../../../core/pipes/km-currency.pipe';
import { AuthStateService } from '../../../../core/state/auth-state.service';

@Component({
  selector: 'app-rep-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, KmCurrencyPipe],
  template: `
    <div class="rep-dashboard">
      <!-- Header -->
      <div class="dashboard-header">
        <div class="header-content">
          <h1>Dobrodošli, {{ summary()?.repName || user()?.firstName }}</h1>
          <p class="subtitle">Pregled performansi i dnevne aktivnosti</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-icon" (click)="refreshAll()" [disabled]="loading()">
            <span class="icon" [class.spinning]="loading()">🔄</span>
          </button>
          <button class="btn btn-primary" routerLink="/orders/new">
            <span class="icon">➕</span>
            Nova narudžba
          </button>
        </div>
      </div>

      <!-- Sync Status Banner -->
      @if (summary()?.pendingOfflineOrders && summary()!.pendingOfflineOrders > 0) {
        <div class="sync-banner warning">
          <span class="icon">⚠️</span>
          <span>{{ summary()!.pendingOfflineOrders }} narudžbi čeka sinkronizaciju</span>
          <button class="btn btn-sm btn-ghost" (click)="syncOfflineOrders()">Sinkroniziraj sada</button>
        </div>
      }

      <!-- Quick Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card primary">
          <div class="stat-icon">📦</div>
          <div class="stat-content">
            <span class="stat-value">{{ widgets()?.todayOrders ?? 0 }}</span>
            <span class="stat-label">Narudžbe danas</span>
          </div>
          @if (summary()?.totalOrders; as total) {
            <div class="stat-trend positive">
              <span>+{{ total }} ovaj mjesec</span>
            </div>
          }
        </div>

        <div class="stat-card success">
          <div class="stat-icon">💰</div>
          <div class="stat-content">
            <span class="stat-value">{{ widgets()?.todayRevenue ?? 0 | kmCurrency }}</span>
            <span class="stat-label">Prihod danas</span>
          </div>
          @if (summary()?.revenueGrowthPercent; as growth) {
            <div class="stat-trend" [class.positive]="growth >= 0" [class.negative]="growth < 0">
              <span>{{ growth > 0 ? '+' : '' }}{{ growth | number:'1.1-1' }}% MoM</span>
            </div>
          }
        </div>

        <div class="stat-card info">
          <div class="stat-icon">🚗</div>
          <div class="stat-content">
            <span class="stat-value">{{ widgets()?.todayVisits ?? 0 }}</span>
            <span class="stat-label">Posjete danas</span>
          </div>
          <div class="stat-trend neutral">
            <span>{{ widgets()?.plannedVisitsToday ?? 0 }} planirano</span>
          </div>
        </div>

        <div class="stat-card warning">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <span class="stat-value">{{ summary()?.customersVisited ?? 0 }}</span>
            <span class="stat-label">Kupaca posjećeno</span>
          </div>
          <div class="stat-trend neutral">
            <span>od {{ summary()?.assignedCustomers ?? 0 }} dodijeljenih</span>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="main-grid">
        <!-- Today's Schedule -->
        <section class="card schedule-card">
          <div class="card-header">
            <h2>📅 Današnji raspored</h2>
            <button class="btn btn-sm btn-ghost" routerLink="/visits/today">Prikaži sve</button>
          </div>
          <div class="card-content">
            @if (schedule()?.plannedVisits?.length) {
              <ul class="schedule-list">
                @for (visit of schedule()!.plannedVisits.slice(0, 5); track visit.visitId) {
                  <li class="schedule-item" [class.completed]="visit.status === 'Completed'">
                    <div class="visit-time">
                      @if (visit.scheduledTime) {
                        <span>{{ visit.scheduledTime }}</span>
                      } @else {
                        <span class="flexible">Fleksibilno</span>
                      }
                    </div>
                    <div class="visit-info">
                      <span class="customer-name">{{ visit.customerName }}</span>
                      <span class="visit-address">{{ visit.customerAddress }}</span>
                    </div>
                    <div class="visit-actions">
                      @if (visit.status === 'Scheduled') {
                        <button class="btn btn-sm btn-primary" routerLink="/visits/check-in" [queryParams]="{customerId: visit.customerId}">
                          Check-in
                        </button>
                      } @else {
                        <span class="status-badge completed">✓ Obavljeno</span>
                      }
                    </div>
                  </li>
                }
              </ul>
              <div class="schedule-summary">
                <span>{{ schedule()!.totalCompleted }}/{{ schedule()!.totalPlanned }} obavljeno</span>
              </div>
            } @else {
              <div class="empty-state">
                <span class="icon">📋</span>
                <p>Nema planiranih posjeta za danas</p>
                <button class="btn btn-sm btn-ghost" routerLink="/visits/planner">Planiraj posjete</button>
              </div>
            }
          </div>
        </section>

        <!-- Recent Orders -->
        <section class="card orders-card">
          <div class="card-header">
            <h2>📦 Nedavne narudžbe</h2>
            <button class="btn btn-sm btn-ghost" routerLink="/orders">Prikaži sve</button>
          </div>
          <div class="card-content">
            @if (recentOrders().length) {
              <table class="orders-table">
                <thead>
                  <tr>
                    <th>Br.</th>
                    <th>Kupac</th>
                    <th>Iznos</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (order of recentOrders().slice(0, 5); track order.orderId) {
                    <tr class="order-row" (click)="viewOrder(order.orderId)">
                      <td class="order-number">{{ order.orderNumber }}</td>
                      <td class="customer">{{ order.customerName }}</td>
                      <td class="amount">{{ order.totalAmount | kmCurrency }}</td>
                      <td>
                        <span class="status-badge" [class]="getStatusClass(order.status)">
                          {{ order.status }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            } @else {
              <div class="empty-state">
                <span class="icon">📄</span>
                <p>Nema nedavnih narudžbi</p>
              </div>
            }
          </div>
        </section>

        <!-- Top Customers -->
        <section class="card customers-card">
          <div class="card-header">
            <h2>⭐ Top kupci (30 dana)</h2>
          </div>
          <div class="card-content">
            @if (topCustomers().length) {
              <ul class="customer-list">
                @for (customer of topCustomers(); track customer.customerId; let i = $index) {
                  <li class="customer-item" (click)="viewCustomer(customer.customerId)">
                    <span class="rank">{{ i + 1 }}</span>
                    <div class="customer-info">
                      <span class="customer-name">{{ customer.customerName }}</span>
                      <span class="customer-stats">{{ customer.totalOrders }} narudžbi</span>
                    </div>
                    <span class="customer-revenue">{{ customer.totalRevenue | kmCurrency }}</span>
                  </li>
                }
              </ul>
            } @else {
              <div class="empty-state">
                <span class="icon">👤</span>
                <p>Nema podataka o kupcima</p>
              </div>
            }
          </div>
        </section>

        <!-- Target Progress -->
        <section class="card targets-card">
          <div class="card-header">
            <h2>🎯 Ciljevi mjeseca</h2>
          </div>
          <div class="card-content">
            @if (targets()?.targets?.length) {
              <ul class="targets-list">
                @for (target of targets()!.targets; track target.targetId) {
                  <li class="target-item">
                    <div class="target-header">
                      <span class="target-name">{{ target.name }}</span>
                      <span class="target-status" [class]="target.status.toLowerCase()">
                        {{ getStatusLabel(target.status) }}
                      </span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill" [style.width.%]="target.achievementPercent | number:'1.0-0'">
                      </div>
                    </div>
                    <div class="target-values">
                      <span>{{ target.currentValue | number:'1.0-0' }}</span>
                      <span>od {{ target.targetValue | number:'1.0-0' }} ({{ target.achievementPercent | number:'1.1-1' }}%)</span>
                    </div>
                  </li>
                }
              </ul>
              <div class="targets-footer">
                <span>Dan {{ targets()!.daysElapsed }}/{{ targets()!.totalDays }} u mjesecu</span>
              </div>
            } @else {
              <div class="empty-state">
                <span class="icon">📊</span>
                <p>Nema definiranih ciljeva</p>
              </div>
            }
          </div>
        </section>
      </div>

      <!-- Performance Metrics -->
      <section class="card performance-card">
        <div class="card-header">
          <h2>📈 Mjesečni pregled</h2>
          <div class="period-info">
            {{ summary()?.periodStart | date:'d. MMM' }} - {{ summary()?.periodEnd | date:'d. MMM yyyy' }}
          </div>
        </div>
        <div class="metrics-grid">
          <div class="metric">
            <span class="metric-label">Ukupne narudžbe</span>
            <span class="metric-value">{{ summary()?.totalOrders ?? 0 }}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Ukupni prihod</span>
            <span class="metric-value">{{ summary()?.totalRevenue ?? 0 | kmCurrency }}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Prosječna vrijednost</span>
            <span class="metric-value">{{ summary()?.averageOrderValue ?? 0 | kmCurrency }}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Posjete</span>
            <span class="metric-value">{{ summary()?.totalVisits ?? 0 }}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Stopa izvršenja</span>
            <span class="metric-value">{{ summary()?.visitCompletionRate ?? 0 }}%</span>
          </div>
          <div class="metric">
            <span class="metric-label">Na čekanju</span>
            <span class="metric-value">{{ summary()?.pendingOrders ?? 0 }}</span>
          </div>
        </div>
      </section>

      <!-- Quick Actions Footer -->
      <div class="quick-actions">
        <button class="action-btn" routerLink="/visits/check-in">
          <span class="icon">📍</span>
          <span>Check-in posjeta</span>
        </button>
        <button class="action-btn" routerLink="/orders/new">
          <span class="icon">📝</span>
          <span>Nova narudžba</span>
        </button>
        <button class="action-btn" routerLink="/visits/planner">
          <span class="icon">🗓️</span>
          <span>Planiraj posjete</span>
        </button>
        <button class="action-btn" routerLink="/customers">
          <span class="icon">👥</span>
          <span>Moji kupci</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .rep-dashboard {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .header-content h1 {
      font-size: 1.75rem;
      font-weight: 600;
      margin: 0;
    }

    .subtitle {
      color: var(--text-secondary);
      margin: 0.25rem 0 0;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .sync-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;

      &.warning {
        background: #fef3c7;
        border: 1px solid #f59e0b;
        color: #92400e;
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border-left: 4px solid;

      &.primary { border-left-color: #3b82f6; }
      &.success { border-left-color: #10b981; }
      &.info { border-left-color: #06b6d4; }
      &.warning { border-left-color: #f59e0b; }
    }

    .stat-icon {
      font-size: 1.75rem;
    }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .stat-trend {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      width: 100%;
      text-align: center;

      &.positive { background: #d1fae5; color: #065f46; }
      &.negative { background: #fee2e2; color: #991b1b; }
      &.neutral { background: #f3f4f6; color: #6b7280; }
    }

    .main-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      margin-bottom: 1.5rem;

      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
      }
    }

    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e5e7eb;

      h2 {
        font-size: 1rem;
        font-weight: 600;
        margin: 0;
      }
    }

    .card-content {
      padding: 1rem 1.25rem;
    }

    .schedule-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .schedule-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid #f3f4f6;

      &:last-child { border-bottom: none; }
      &.completed { opacity: 0.6; }
    }

    .visit-time {
      min-width: 60px;
      font-size: 0.875rem;
      color: #6b7280;

      .flexible { font-style: italic; }
    }

    .visit-info {
      flex: 1;

      .customer-name {
        display: block;
        font-weight: 500;
      }

      .visit-address {
        font-size: 0.75rem;
        color: #9ca3af;
      }
    }

    .orders-table {
      width: 100%;
      border-collapse: collapse;

      th, td {
        padding: 0.75rem 0.5rem;
        text-align: left;
      }

      th {
        font-size: 0.75rem;
        color: #6b7280;
        font-weight: 500;
        border-bottom: 1px solid #e5e7eb;
      }

      .order-row {
        cursor: pointer;
        &:hover { background: #f9fafb; }
      }

      .order-number { font-family: monospace; }
      .amount { font-weight: 500; }
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;

      &.pending { background: #fef3c7; color: #92400e; }
      &.confirmed { background: #dbeafe; color: #1e40af; }
      &.delivered { background: #d1fae5; color: #065f46; }
      &.cancelled { background: #fee2e2; color: #991b1b; }
      &.completed { background: #d1fae5; color: #065f46; }
    }

    .customer-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .customer-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid #f3f4f6;
      cursor: pointer;

      &:hover { background: #f9fafb; }
      &:last-child { border-bottom: none; }
    }

    .rank {
      width: 24px;
      height: 24px;
      background: #f3f4f6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .customer-info {
      flex: 1;

      .customer-name { display: block; font-weight: 500; }
      .customer-stats { font-size: 0.75rem; color: #9ca3af; }
    }

    .customer-revenue {
      font-weight: 600;
      color: #10b981;
    }

    .targets-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .target-item {
      padding: 0.75rem 0;
      border-bottom: 1px solid #f3f4f6;

      &:last-child { border-bottom: none; }
    }

    .target-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;

      .target-name { font-weight: 500; }
      .target-status {
        font-size: 0.75rem;
        padding: 0.125rem 0.5rem;
        border-radius: 4px;

        &.ontrack { background: #d1fae5; color: #065f46; }
        &.atrisk { background: #fef3c7; color: #92400e; }
        &.behind { background: #fee2e2; color: #991b1b; }
      }
    }

    .progress-bar {
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 0.25rem;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #10b981);
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .target-values {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: #6b7280;
    }

    .targets-footer, .schedule-summary {
      padding-top: 0.75rem;
      font-size: 0.75rem;
      color: #6b7280;
      text-align: center;
      border-top: 1px solid #f3f4f6;
      margin-top: 0.5rem;
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: #9ca3af;

      .icon {
        font-size: 2rem;
        display: block;
        margin-bottom: 0.5rem;
      }

      p { margin: 0 0 1rem; }
    }

    .performance-card {
      margin-bottom: 1.5rem;
    }

    .period-info {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      padding: 1rem 1.25rem;
    }

    .metric {
      text-align: center;
      padding: 0.75rem;
      background: #f9fafb;
      border-radius: 8px;

      .metric-label {
        display: block;
        font-size: 0.75rem;
        color: #6b7280;
        margin-bottom: 0.25rem;
      }

      .metric-value {
        font-size: 1.25rem;
        font-weight: 600;
      }
    }

    .quick-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }

    .action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1.25rem;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #f9fafb;
        border-color: #3b82f6;
        transform: translateY(-2px);
      }

      .icon { font-size: 1.5rem; }
      span:last-child { font-size: 0.875rem; font-weight: 500; }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;

      &.btn-primary {
        background: #3b82f6;
        color: white;
        &:hover { background: #2563eb; }
      }

      &.btn-ghost {
        background: transparent;
        color: #6b7280;
        &:hover { background: #f3f4f6; }
      }

      &.btn-icon {
        padding: 0.5rem;
        background: transparent;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
      }

      &.btn-sm {
        padding: 0.375rem 0.75rem;
        font-size: 0.875rem;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class RepDashboardComponent implements OnInit, OnDestroy {
  private readonly dashboardService = inject(RepDashboardService);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  // State signals
  loading = signal(true);
  summary = signal<RepDashboardSummary | null>(null);
  widgets = signal<RepDashboardWidgets | null>(null);
  recentOrders = signal<RecentOrder[]>([]);
  schedule = signal<TodaySchedule | null>(null);
  topCustomers = signal<TopCustomer[]>([]);
  trends = signal<SalesTrends | null>(null);
  targets = signal<RepTargetProgress | null>(null);

  user = this.authState.user;

  ngOnInit(): void {
    this.loadAllData();

    // Auto-refresh every 5 minutes
    interval(5 * 60 * 1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshAll());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAllData(): void {
    this.loading.set(true);

    forkJoin({
      summary: this.dashboardService.getDashboardSummary(),
      widgets: this.dashboardService.getWidgets(),
      recentOrders: this.dashboardService.getRecentOrders(5),
      schedule: this.dashboardService.getTodaySchedule(),
      topCustomers: this.dashboardService.getTopCustomers(5),
      targets: this.dashboardService.getTargetProgress()
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.summary.set(data.summary);
        this.widgets.set(data.widgets);
        this.recentOrders.set(data.recentOrders);
        this.schedule.set(data.schedule);
        this.topCustomers.set(data.topCustomers);
        this.targets.set(data.targets);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load dashboard data:', err);
        this.loading.set(false);
      }
    });
  }

  refreshAll(): void {
    this.loadAllData();
  }

  syncOfflineOrders(): void {
    // Trigger sync service
    // TODO: Integrate with SyncService
    console.log('Syncing offline orders...');
  }

  viewOrder(orderId: number): void {
    this.router.navigate(['/orders', orderId]);
  }

  viewCustomer(customerId: number): void {
    this.router.navigate(['/customers', customerId]);
  }

  getStatusClass(status: string): string {
    const statusMap: Record<string, string> = {
      'Pending': 'pending',
      'Confirmed': 'confirmed',
      'Processing': 'confirmed',
      'Shipped': 'confirmed',
      'Delivered': 'delivered',
      'Cancelled': 'cancelled'
    };
    return statusMap[status] || 'pending';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'OnTrack': 'Na putu',
      'AtRisk': 'Rizično',
      'Behind': 'Zaostaje'
    };
    return labels[status] || status;
  }
}
