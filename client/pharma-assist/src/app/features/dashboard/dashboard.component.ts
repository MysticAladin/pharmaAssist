import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthStateService } from '../../core/state/auth-state.service';
import { FeatureFlagService } from '../../core/state/feature-flag.service';
import { FeatureKey } from '../../core/models/feature-flag.model';
import { HasFeatureDirective } from '../../core/directives/feature.directive';
import { TranslateModule } from '@ngx-translate/core';
import { DashboardService, DashboardData, DashboardAlert } from '../../core/services/dashboard.service';
import { OrderSummary, OrderStatus, PaymentStatus } from '../../core/models/order.model';
import { BarcodeScannerComponent } from '../../shared/components/barcode-scanner/barcode-scanner.component';
import { ActivityFeedComponent } from '../../shared/components/activity-feed/activity-feed.component';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HasFeatureDirective, TranslateModule, BarcodeScannerComponent, ActivityFeedComponent],
  template: `
    <div class="dashboard">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">{{ 'dashboard.title' | translate }}</h1>
          <p class="page-subtitle">{{ 'dashboard.welcome' | translate }}, {{ user()?.firstName }}!</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-icon btn-ghost" (click)="refreshData()" [disabled]="loading()">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class.spinning]="loading()">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/>
            </svg>
          </button>
          <button class="btn btn-primary" (click)="createNewOrder()">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14"/><path d="M12 5v14"/>
            </svg>
            {{ 'dashboard.newOrder' | translate }}
          </button>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <button class="quick-action-btn" (click)="navigateTo('/orders/new')">
          <div class="action-icon action-icon-blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
          </div>
          <span>{{ 'dashboard.actions.newOrder' | translate }}</span>
        </button>
        <button class="quick-action-btn" (click)="navigateTo('/prescriptions')">
          <div class="action-icon action-icon-red">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14h.01"/><path d="M13 14h2"/><path d="M9 17h.01"/><path d="M13 17h2"/></svg>
          </div>
          <span>{{ 'dashboard.actions.prescriptions' | translate }}</span>
        </button>
        <button class="quick-action-btn" (click)="navigateTo('/products/new')">
          <div class="action-icon action-icon-green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
          </div>
          <span>{{ 'dashboard.actions.addProduct' | translate }}</span>
        </button>
        <button class="quick-action-btn" (click)="navigateTo('/customers')">
          <div class="action-icon action-icon-purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <span>{{ 'dashboard.actions.customers' | translate }}</span>
        </button>
        <button class="quick-action-btn" (click)="navigateTo('/inventory')">
          <div class="action-icon action-icon-orange">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <span>{{ 'dashboard.actions.lowStock' | translate }}</span>
        </button>
        <button class="quick-action-btn" (click)="navigateTo('/reports/expiring-products')">
          <div class="action-icon action-icon-yellow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <span>{{ 'dashboard.actions.expiringProducts' | translate }}</span>
        </button>
        <button class="quick-action-btn" (click)="navigateTo('/reports')">
          <div class="action-icon action-icon-teal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
          </div>
          <span>{{ 'dashboard.actions.reports' | translate }}</span>
        </button>
        <button class="quick-action-btn" (click)="openBarcodeScanner()">
          <div class="action-icon action-icon-indigo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 5v14"/><path d="M21 5v14"/><path d="M6 5v14"/><path d="M18 5v14"/><path d="M10 5v14"/><path d="M14 5v14"/></svg>
          </div>
          <span>{{ 'dashboard.actions.scanBarcode' | translate }}</span>
        </button>
      </div>

      <!-- Barcode Scanner Modal -->
      @if (showBarcodeScanner()) {
        <app-barcode-scanner
          (closed)="showBarcodeScanner.set(false)"
          (productSelected)="onBarcodeProductSelected($event)">
        </app-barcode-scanner>
      }

      <!-- Quick Stats -->
      <div class="stats-grid">
        <!-- Today's Orders -->
        <div class="stat-card" [class.loading]="loading()">
          <div class="stat-icon stat-icon-blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ dashboardData()?.stats?.orders?.todayCount ?? 0 }}</span>
            <span class="stat-label">{{ 'dashboard.stats.todayOrders' | translate }}</span>
          </div>
          @if (dashboardData()?.stats?.orders?.changePercent; as change) {
            <div class="stat-change" [class.positive]="change >= 0" [class.negative]="change < 0">
              @if (change >= 0) {
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
                </svg>
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>
                </svg>
              }
              {{ change >= 0 ? '+' : '' }}{{ change }}%
            </div>
          }
        </div>

        <!-- Daily Revenue -->
        <div class="stat-card" [class.loading]="loading()">
          <div class="stat-icon stat-icon-green">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ formatCurrency(dashboardData()?.stats?.orders?.todayRevenue ?? 0) }}</span>
            <span class="stat-label">{{ 'dashboard.stats.dailyRevenue' | translate }}</span>
          </div>
          <div class="stat-change positive">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
            </svg>
            +8%
          </div>
        </div>

        <!-- Low Stock Count -->
        <div class="stat-card" [class.loading]="loading()" (click)="navigateTo('/inventory')">
          <div class="stat-icon stat-icon-orange">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
              <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ dashboardData()?.stats?.inventory?.lowStockCount ?? 0 }}</span>
            <span class="stat-label">{{ 'dashboard.stats.lowStockItems' | translate }}</span>
          </div>
          <a class="stat-link">{{ 'common.view' | translate }}</a>
        </div>

        <!-- Pending Prescriptions -->
        <div class="stat-card" [class.loading]="loading()" (click)="navigateTo('/prescriptions')">
          <div class="stat-icon stat-icon-red">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <path d="M12 9v4"/><path d="M12 17h.01"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ dashboardData()?.stats?.prescriptions?.pendingCount ?? 0 }}</span>
            <span class="stat-label">{{ 'dashboard.stats.pendingPrescriptions' | translate }}</span>
          </div>
          @if (dashboardData()?.stats?.prescriptions?.urgentCount; as urgent) {
            <span class="stat-badge urgent">{{ urgent }} {{ 'dashboard.stats.urgent' | translate }}</span>
          }
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="dashboard-grid">
        <!-- Recent Orders -->
        <div class="dashboard-card orders-card">
          <div class="card-header">
            <h3 class="card-title">{{ 'dashboard.recentOrders' | translate }}</h3>
            <a routerLink="/orders" class="view-all-link">{{ 'common.viewAll' | translate }}</a>
          </div>

          @if (loading()) {
            <div class="orders-list">
              @for (i of [1, 2, 3]; track i) {
                <div class="order-item skeleton">
                  <div class="skeleton-content"></div>
                </div>
              }
            </div>
          } @else if (recentOrders().length === 0) {
            <div class="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              <p>{{ 'dashboard.noRecentOrders' | translate }}</p>
              <button class="btn btn-primary btn-sm" (click)="navigateTo('/orders/new')">
                {{ 'dashboard.createFirstOrder' | translate }}
              </button>
            </div>
          } @else {
            <div class="orders-list">
              @for (order of recentOrders(); track order.id) {
                <div class="order-item" (click)="navigateTo('/orders/' + order.id)">
                  <div class="order-info">
                    <span class="order-id">#{{ order.orderNumber || order.id }}</span>
                    <span class="order-customer">{{ order.customerName || 'Unknown Customer' }}</span>
                  </div>
                  <div class="order-meta">
                    <span class="order-amount">{{ formatCurrency(order.totalAmount) }}</span>
                    <span class="order-status" [class]="'status-' + getStatusClass(order.status)">
                      {{ getStatusLabel(order.status) | translate }}
                    </span>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Alerts Section -->
        <div class="dashboard-card alerts-card">
          <div class="card-header">
            <h3 class="card-title">{{ 'dashboard.alerts' | translate }}</h3>
            @if (alerts().length > 0) {
              <span class="alert-count">{{ alerts().length }}</span>
            }
          </div>

          @if (loading()) {
            <div class="alerts-list">
              @for (i of [1, 2]; track i) {
                <div class="alert-item skeleton">
                  <div class="skeleton-content"></div>
                </div>
              }
            </div>
          } @else if (alerts().length === 0) {
            <div class="empty-state small">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <p>{{ 'dashboard.noAlerts' | translate }}</p>
            </div>
          } @else {
            <div class="alerts-list">
              @for (alert of alerts(); track alert.id) {
                <div class="alert-item" [class]="'alert-' + alert.type" (click)="alert.link && navigateTo(alert.link)">
                  @if (alert.type === 'danger') {
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  }
                  <div class="alert-content">
                    <span class="alert-title">{{ alert.title }}</span>
                    <span class="alert-desc">{{ alert.description }}</span>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Activity Feed -->
        <div class="dashboard-card activity-card">
          <app-activity-feed />
        </div>

        <!-- Advanced Analytics (Feature Gated) -->
        <ng-container *hasFeature="advancedAnalyticsKey; else upgradePrompt">
          <div class="dashboard-card analytics-card full-width">
            <div class="card-header">
              <h3 class="card-title">{{ 'dashboard.advancedAnalytics' | translate }}</h3>
            </div>
            <div class="analytics-placeholder">
              <p>{{ 'dashboard.analyticsComingSoon' | translate }}</p>
            </div>
          </div>
        </ng-container>

        <ng-template #upgradePrompt>
          <div class="dashboard-card upgrade-prompt-card">
            <div class="upgrade-content">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="upgrade-icon">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <h4>{{ 'dashboard.advancedAnalytics' | translate }}</h4>
              <p>{{ 'dashboard.upgradeMessage' | translate }}</p>
              <a routerLink="/upgrade" [queryParams]="{feature: 'advanced_analytics'}" class="btn btn-outline">
                {{ 'dashboard.upgradePlan' | translate }}
              </a>
            </div>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    /* Page Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
    }

    .page-title {
      font-size: 28px;
      font-weight: 700;
      color: var(--text-primary, #1e293b);
      margin-bottom: 4px;
    }

    .page-subtitle {
      font-size: 14px;
      color: var(--text-muted, #64748b);
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }

    .btn-sm {
      padding: 8px 16px;
      font-size: 13px;
    }

    .btn-primary {
      background-color: var(--primary, #3b82f6);
      color: #fff;
    }

    .btn-primary:hover {
      background-color: #2563eb;
    }

    .btn-outline {
      background-color: transparent;
      border: 2px solid var(--primary);
      color: var(--primary);
    }

    .btn-icon {
      padding: 10px;
      border-radius: 10px;
    }

    .btn-ghost {
      background: transparent;
      color: var(--text-muted, #64748b);
    }

    .btn-ghost:hover {
      background: #f1f5f9;
      color: var(--text-primary, #1e293b);
    }

    .btn-ghost:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 32px;
    }

    .stat-card {
      background-color: #fff;
      border-radius: 16px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .stat-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transform: translateY(-2px);
    }

    .stat-card.loading {
      pointer-events: none;
    }

    .stat-card.loading .stat-value,
    .stat-card.loading .stat-label {
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
      color: transparent;
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      flex-shrink: 0;
    }

    .stat-icon-blue { background-color: #eff6ff; color: #3b82f6; }
    .stat-icon-green { background-color: #f0fdf4; color: #10b981; }
    .stat-icon-orange { background-color: #fff7ed; color: #f59e0b; }
    .stat-icon-red { background-color: #fef2f2; color: #ef4444; }

    .stat-content {
      flex: 1;
      min-width: 0;
    }

    .stat-value {
      display: block;
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .stat-label {
      font-size: 13px;
      color: var(--text-muted);
    }

    .stat-change {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      font-weight: 600;
    }

    .stat-change.positive { color: #10b981; }
    .stat-change.negative { color: #ef4444; }

    .stat-link {
      font-size: 13px;
      color: var(--primary);
      text-decoration: none;
    }

    .stat-badge {
      padding: 4px 8px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
    }

    .stat-badge.urgent {
      background-color: #fef2f2;
      color: #ef4444;
    }

    /* Quick Actions */
    .quick-actions {
      display: flex;
      gap: 12px;
      margin-bottom: 32px;
      flex-wrap: wrap;
    }

    .quick-action-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary, #1e293b);
    }

    .quick-action-btn:hover {
      border-color: var(--primary, #3b82f6);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
      transform: translateY(-2px);
    }

    .action-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .action-icon-blue { background: #eff6ff; color: #3b82f6; }
    .action-icon-green { background: #f0fdf4; color: #10b981; }
    .action-icon-purple { background: #f5f3ff; color: #8b5cf6; }
    .action-icon-orange { background: #fff7ed; color: #f59e0b; }
    .action-icon-teal { background: #f0fdfa; color: #14b8a6; }
    .action-icon-red { background: #fef2f2; color: #ef4444; }
    .action-icon-yellow { background: #fffbeb; color: #eab308; }
    .action-icon-indigo { background: #eef2ff; color: #6366f1; }

    /* Dashboard Grid */
    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
    }

    .orders-card {
      grid-column: span 1;
    }

    .alerts-card {
      grid-column: span 1;
    }

    .activity-card {
      grid-column: span 1;
    }

    .dashboard-card {
      background-color: #fff;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .dashboard-card.full-width {
      grid-column: 1 / -1;
    }

    .activity-card {
      padding: 0;
    }

    .activity-card ::ng-deep .activity-feed {
      border: none;
      box-shadow: none;
      border-radius: 16px;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .view-all-link {
      font-size: 13px;
      color: var(--primary);
      text-decoration: none;
    }

    .alert-count {
      background-color: #ef4444;
      color: white;
      font-size: 12px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 20px;
    }

    /* Orders List */
    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .order-item {
      display: flex;
      justify-content: space-between;
      padding: 16px;
      background-color: #f8fafc;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .order-item:hover {
      background-color: #f1f5f9;
    }

    .order-item.skeleton {
      height: 72px;
    }

    .skeleton-content {
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 8px;
    }

    .order-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .order-id {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .order-customer {
      font-size: 13px;
      color: var(--text-muted);
    }

    .order-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .order-amount {
      font-size: 14px;
      font-weight: 600;
    }

    .order-status {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-pending { background-color: #fef3c7; color: #d97706; }
    .status-processing { background-color: #dbeafe; color: #2563eb; }
    .status-completed { background-color: #d1fae5; color: #059669; }
    .status-cancelled { background-color: #fee2e2; color: #dc2626; }
    .status-shipped { background-color: #e0e7ff; color: #4f46e5; }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
      color: var(--text-muted, #64748b);
    }

    .empty-state.small {
      padding: 24px 16px;
    }

    .empty-state svg {
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-state p {
      margin-bottom: 16px;
    }

    /* Upgrade Prompt */
    .upgrade-prompt-card {
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 2px dashed #bae6fd;
    }

    .upgrade-content {
      text-align: center;
      padding: 20px;
    }

    .upgrade-content svg {
      color: #0ea5e9;
      margin-bottom: 16px;
    }

    .upgrade-content h4 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .upgrade-content p {
      font-size: 14px;
      color: var(--text-muted);
      margin-bottom: 16px;
    }

    /* Alerts */
    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .alert-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .alert-item:hover {
      filter: brightness(0.97);
    }

    .alert-item.skeleton {
      height: 60px;
    }

    .alert-warning {
      background-color: #fffbeb;
      border-left: 4px solid #f59e0b;
    }

    .alert-warning svg { color: #f59e0b; }

    .alert-danger {
      background-color: #fef2f2;
      border-left: 4px solid #ef4444;
    }

    .alert-danger svg { color: #ef4444; }

    .alert-info {
      background-color: #eff6ff;
      border-left: 4px solid #3b82f6;
    }

    .alert-info svg { color: #3b82f6; }

    .alert-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
    }

    .alert-title {
      font-size: 14px;
      font-weight: 500;
    }

    .alert-desc {
      font-size: 13px;
      color: var(--text-muted);
    }

    /* Analytics Card */
    .analytics-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 200px;
      background-color: #f8fafc;
      border-radius: 12px;
      color: var(--text-muted);
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .page-header {
        flex-direction: column;
        gap: 16px;
      }

      .quick-actions {
        overflow-x: auto;
        flex-wrap: nowrap;
        padding-bottom: 8px;
      }

      .quick-action-btn {
        flex-shrink: 0;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authState = inject(AuthStateService);
  private readonly featureFlags = inject(FeatureFlagService);
  private readonly dashboardService = inject(DashboardService);

  user = this.authState.user;
  advancedAnalyticsKey = FeatureKey.AdvancedAnalytics;

  // Dashboard state
  loading = signal(true);
  dashboardData = signal<DashboardData | null>(null);
  showBarcodeScanner = signal(false);

  // Computed signals for template
  recentOrders = computed(() => this.dashboardData()?.recentOrders ?? []);
  alerts = computed(() => this.dashboardData()?.alerts ?? []);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading.set(true);
    this.dashboardService.getDashboardData().subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        // Show mock data on error for development
        this.dashboardData.set(this.getMockData());
      }
    });
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  createNewOrder(): void {
    this.router.navigate(['/orders/new']);
  }

  openBarcodeScanner(): void {
    this.showBarcodeScanner.set(true);
  }

  onBarcodeProductSelected(product: Product): void {
    // Navigate to product detail page
    this.router.navigate(['/products', product.id]);
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('bs-BA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value) + ' KM';
  }

  getStatusClass(status: OrderStatus): string {
    const statusClasses: Record<OrderStatus, string> = {
      [OrderStatus.Pending]: 'pending',
      [OrderStatus.Confirmed]: 'processing',
      [OrderStatus.Processing]: 'processing',
      [OrderStatus.ReadyForShipment]: 'shipped',
      [OrderStatus.Shipped]: 'shipped',
      [OrderStatus.Delivered]: 'completed',
      [OrderStatus.Cancelled]: 'cancelled',
      [OrderStatus.Returned]: 'cancelled'
    };
    return statusClasses[status] || 'pending';
  }

  getStatusLabel(status: OrderStatus): string {
    const statusLabels: Record<OrderStatus, string> = {
      [OrderStatus.Pending]: 'orders.status.pending',
      [OrderStatus.Confirmed]: 'orders.status.confirmed',
      [OrderStatus.Processing]: 'orders.status.processing',
      [OrderStatus.ReadyForShipment]: 'orders.status.readyForShipment',
      [OrderStatus.Shipped]: 'orders.status.shipped',
      [OrderStatus.Delivered]: 'orders.status.delivered',
      [OrderStatus.Cancelled]: 'orders.status.cancelled',
      [OrderStatus.Returned]: 'orders.status.returned'
    };
    return statusLabels[status] || 'orders.status.pending';
  }

  private getMockData(): DashboardData {
    return {
      stats: {
        orders: {
          todayCount: 156,
          todayRevenue: 24560,
          pendingCount: 23,
          changePercent: 12
        },
        inventory: {
          totalProducts: 1234,
          lowStockCount: 12,
          expiringCount: 8,
          changePercent: -2
        },
        prescriptions: {
          pendingCount: 15,
          urgentCount: 3
        }
      },
      recentOrders: [
        {
          id: '1',
          orderNumber: 'ORD-2024-0156',
          customerId: '1',
          customerName: 'Apoteka Centar',
          status: OrderStatus.Pending,
          paymentStatus: PaymentStatus.Pending,
          orderDate: new Date(),
          totalAmount: 1250.00,
          itemCount: 5,
          hasPrescription: false
        },
        {
          id: '2',
          orderNumber: 'ORD-2024-0155',
          customerId: '2',
          customerName: 'Farmacija Plus',
          status: OrderStatus.Processing,
          paymentStatus: PaymentStatus.Pending,
          orderDate: new Date(),
          totalAmount: 890.50,
          itemCount: 3,
          hasPrescription: true
        },
        {
          id: '3',
          orderNumber: 'ORD-2024-0154',
          customerId: '3',
          customerName: 'Zdravlje d.o.o.',
          status: OrderStatus.Delivered,
          paymentStatus: PaymentStatus.Paid,
          orderDate: new Date(),
          totalAmount: 2340.00,
          itemCount: 8,
          hasPrescription: false
        }
      ],
      alerts: [
        {
          id: 'low-stock-1',
          type: 'warning',
          title: 'Paracetamol 500mg',
          description: 'Only 15 boxes in stock',
          link: '/inventory'
        },
        {
          id: 'expiring-1',
          type: 'danger',
          title: 'Brufen 400mg',
          description: 'Expires in 7 days (Batch: 2024-08)',
          link: '/reports/expiring'
        }
      ],
      lowStockItems: [],
      expiringItems: []
    };
  }
}
