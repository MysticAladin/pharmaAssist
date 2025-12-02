import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthStateService } from '../../core/state/auth-state.service';
import { FeatureFlagService } from '../../core/state/feature-flag.service';
import { FeatureKey } from '../../core/models/feature-flag.model';
import { HasFeatureDirective } from '../../core/directives/feature.directive';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HasFeatureDirective],
  template: `
    <div class="dashboard">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">Kontrolna ploča</h1>
          <p class="page-subtitle">Dobro došli natrag, {{ user()?.firstName }}!</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14"/><path d="M12 5v14"/>
            </svg>
            Nova narudžba
          </button>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon stat-icon-blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">156</span>
            <span class="stat-label">Danas narudžbi</span>
          </div>
          <div class="stat-change positive">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
            </svg>
            +12%
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon-green">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">24,560 KM</span>
            <span class="stat-label">Dnevni promet</span>
          </div>
          <div class="stat-change positive">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
            </svg>
            +8%
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon-orange">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
              <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">1,234</span>
            <span class="stat-label">Proizvodi na stanju</span>
          </div>
          <div class="stat-change negative">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>
            </svg>
            -2%
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon-red">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <path d="M12 9v4"/><path d="M12 17h.01"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">12</span>
            <span class="stat-label">Nizak nivo zaliha</span>
          </div>
          <a routerLink="/products/low-stock" class="stat-link">Pogledaj</a>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="dashboard-grid">
        <!-- Recent Orders -->
        <div class="dashboard-card orders-card">
          <div class="card-header">
            <h3 class="card-title">Nedavne narudžbe</h3>
            <a routerLink="/orders" class="view-all-link">Pogledaj sve</a>
          </div>
          <div class="orders-list">
            <div class="order-item">
              <div class="order-info">
                <span class="order-id">#ORD-2024-0156</span>
                <span class="order-customer">Apoteka Centar</span>
              </div>
              <div class="order-meta">
                <span class="order-amount">1,250.00 KM</span>
                <span class="order-status status-pending">Na čekanju</span>
              </div>
            </div>
            <div class="order-item">
              <div class="order-info">
                <span class="order-id">#ORD-2024-0155</span>
                <span class="order-customer">Farmacija Plus</span>
              </div>
              <div class="order-meta">
                <span class="order-amount">890.50 KM</span>
                <span class="order-status status-processing">U obradi</span>
              </div>
            </div>
            <div class="order-item">
              <div class="order-info">
                <span class="order-id">#ORD-2024-0154</span>
                <span class="order-customer">Zdravlje d.o.o.</span>
              </div>
              <div class="order-meta">
                <span class="order-amount">2,340.00 KM</span>
                <span class="order-status status-completed">Isporučeno</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Advanced Analytics (Feature Gated) -->
        <ng-container *hasFeature="advancedAnalyticsKey; else upgradePrompt">
          <div class="dashboard-card analytics-card">
            <div class="card-header">
              <h3 class="card-title">Napredna analitika</h3>
            </div>
            <div class="analytics-placeholder">
              <p>Grafikoni i napredna analitika ovdje...</p>
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
              <h4>Napredna analitika</h4>
              <p>Nadogradite na Professional plan za pristup naprednim izvještajima i analitici.</p>
              <a routerLink="/upgrade" [queryParams]="{feature: 'advanced_analytics'}" class="btn btn-outline">
                Nadogradi plan
              </a>
            </div>
          </div>
        </ng-template>

        <!-- Low Stock Alerts -->
        <div class="dashboard-card alerts-card">
          <div class="card-header">
            <h3 class="card-title">Upozorenja o zalihama</h3>
          </div>
          <div class="alerts-list">
            <div class="alert-item alert-warning">
              <i class="icon-alert-triangle"></i>
              <div class="alert-content">
                <span class="alert-title">Paracetamol 500mg</span>
                <span class="alert-desc">Samo 15 kutija na stanju</span>
              </div>
            </div>
            <div class="alert-item alert-danger">
              <i class="icon-alert-circle"></i>
              <div class="alert-content">
                <span class="alert-title">Brufen 400mg</span>
                <span class="alert-desc">Ističe za 7 dana (LOT: 2024-08)</span>
              </div>
            </div>
          </div>
        </div>
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
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }

    .stat-icon-blue { background-color: #eff6ff; color: #3b82f6; }
    .stat-icon-green { background-color: #f0fdf4; color: #10b981; }
    .stat-icon-orange { background-color: #fff7ed; color: #f59e0b; }
    .stat-icon-red { background-color: #fef2f2; color: #ef4444; }

    .stat-content {
      flex: 1;
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

    /* Dashboard Grid */
    .dashboard-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
    }

    .dashboard-card {
      background-color: #fff;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
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

    /* Orders List */
    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .order-item {
      display: flex;
      justify-content: space-between;
      padding: 16px;
      background-color: #f8fafc;
      border-radius: 12px;
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

    .upgrade-content i {
      font-size: 40px;
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
    }

    .alert-warning {
      background-color: #fffbeb;
      border-left: 4px solid #f59e0b;
    }

    .alert-danger {
      background-color: #fef2f2;
      border-left: 4px solid #ef4444;
    }

    .alert-item i {
      font-size: 20px;
    }

    .alert-warning i { color: #f59e0b; }
    .alert-danger i { color: #ef4444; }

    .alert-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .alert-title {
      font-size: 14px;
      font-weight: 500;
    }

    .alert-desc {
      font-size: 13px;
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
    }
  `]
})
export class DashboardComponent {
  private readonly authState = inject(AuthStateService);
  private readonly featureFlags = inject(FeatureFlagService);

  user = this.authState.user;
  advancedAnalyticsKey = FeatureKey.AdvancedAnalytics;
}
