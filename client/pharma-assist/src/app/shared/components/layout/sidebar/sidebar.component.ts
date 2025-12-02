import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { UIStateService } from '../../../../core/state/ui-state.service';
import { AuthStateService } from '../../../../core/state/auth-state.service';
import { FeatureFlagService } from '../../../../core/state/feature-flag.service';
import { UserRole } from '../../../../core/models/user.model';

interface NavItem {
  labelKey: string;  // Translation key
  icon?: string;
  route: string;
  permission?: string;
  feature?: string;
  roles?: UserRole[];
  children?: NavItem[];
  badge?: string;
  badgeType?: 'info' | 'warning' | 'danger';
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <aside
      class="sidebar"
      [class.collapsed]="uiState.sidebarCollapsed()"
      [class.mobile-open]="uiState.sidebarMobileOpen()">

      <!-- Logo -->
      <div class="sidebar-header">
        <div class="logo-wrapper">
          <img
            src="assets/images/logo.svg"
            alt="PharmaAssist"
            class="logo"
            [class.hidden]="uiState.sidebarCollapsed()">
          <img
            src="assets/images/logo-icon.svg"
            alt="PA"
            class="logo-icon"
            [class.visible]="uiState.sidebarCollapsed()">
        </div>
        <button
          class="mobile-close"
          (click)="uiState.closeMobileSidebar()"
          aria-label="Close sidebar">
          <i class="icon-x"></i>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <!-- Main Menu -->
        <div class="nav-section">
          @if (!uiState.sidebarCollapsed()) {
            <span class="nav-section-title">{{ 'sidebar.menu' | translate }}</span>
          }

          <ul class="nav-list">
            @for (item of mainNavItems; track item.route) {
              @if (canShowNavItem(item)) {
                <li class="nav-item" [class.has-children]="item.children?.length">
                  <a
                    [routerLink]="item.route"
                    routerLinkActive="active"
                    [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
                    class="nav-link"
                    [title]="uiState.sidebarCollapsed() ? (item.labelKey | translate) : ''">
                    <i class="nav-icon" [class]="item.icon"></i>
                    @if (!uiState.sidebarCollapsed()) {
                      <span class="nav-label">{{ item.labelKey | translate }}</span>
                      @if (item.badge) {
                        <span class="nav-badge" [class]="'badge-' + (item.badgeType || 'info')">
                          {{ item.badge }}
                        </span>
                      }
                    }
                  </a>

                  @if (item.children?.length && !uiState.sidebarCollapsed()) {
                    <ul class="nav-submenu">
                      @for (child of item.children; track child.route) {
                        @if (canShowNavItem(child)) {
                          <li class="nav-subitem">
                            <a
                              [routerLink]="child.route"
                              routerLinkActive="active"
                              class="nav-sublink">
                              {{ child.labelKey | translate }}
                            </a>
                          </li>
                        }
                      }
                    </ul>
                  }
                </li>
              }
            }
          </ul>
        </div>

        <!-- Admin Section -->
        @if (isAdminOrManager()) {
          <div class="nav-section">
            @if (!uiState.sidebarCollapsed()) {
              <span class="nav-section-title">{{ 'sidebar.administration' | translate }}</span>
            }

            <ul class="nav-list">
              @for (item of adminNavItems; track item.route) {
                @if (canShowNavItem(item)) {
                  <li class="nav-item">
                    <a
                      [routerLink]="item.route"
                      routerLinkActive="active"
                      class="nav-link"
                      [title]="uiState.sidebarCollapsed() ? (item.labelKey | translate) : ''">
                      <i class="nav-icon" [class]="item.icon"></i>
                      @if (!uiState.sidebarCollapsed()) {
                        <span class="nav-label">{{ item.labelKey | translate }}</span>
                      }
                    </a>
                  </li>
                }
              }
            </ul>
          </div>
        }
      </nav>

      <!-- Sidebar Footer -->
      <div class="sidebar-footer">
        @if (!uiState.sidebarCollapsed()) {
          <div class="tier-badge" [class]="'tier-' + featureFlags.getTier()">
            {{ 'sidebar.plan' | translate:{ tier: featureFlags.getTier() | titlecase } }}
          </div>
        }

        <button
          class="collapse-btn"
          (click)="uiState.toggleSidebar()"
          [attr.aria-label]="uiState.sidebarCollapsed() ? ('sidebar.expand' | translate) : ('sidebar.collapse' | translate)">
          <i [class]="uiState.sidebarCollapsed() ? 'icon-chevron-right' : 'icon-chevron-left'"></i>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      width: 260px;
      background-color: var(--sidebar-bg, #1e293b);
      color: var(--sidebar-text, #94a3b8);
      display: flex;
      flex-direction: column;
      z-index: 50;
      transition: width 0.3s ease;
      overflow: hidden;
    }

    .sidebar.collapsed {
      width: 72px;
    }

    /* Header */
    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .logo-wrapper {
      display: flex;
      align-items: center;
    }

    .logo {
      height: 32px;
      transition: opacity 0.3s ease;
    }

    .logo.hidden {
      display: none;
    }

    .logo-icon {
      height: 32px;
      display: none;
    }

    .logo-icon.visible {
      display: block;
    }

    .mobile-close {
      display: none;
      background: none;
      border: none;
      color: var(--sidebar-text);
      font-size: 24px;
      cursor: pointer;
    }

    /* Navigation */
    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: 16px 0;
    }

    .nav-section {
      margin-bottom: 24px;
    }

    .nav-section-title {
      display: block;
      padding: 0 20px;
      margin-bottom: 8px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--sidebar-muted, #64748b);
    }

    .nav-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .nav-item {
      margin: 2px 8px;
    }

    .nav-link {
      display: flex;
      align-items: center;
      padding: 10px 12px;
      color: var(--sidebar-text);
      text-decoration: none;
      border-radius: 8px;
      transition: all 0.2s ease;
      gap: 12px;
    }

    .nav-link:hover {
      background-color: rgba(255, 255, 255, 0.1);
      color: var(--sidebar-hover, #fff);
    }

    .nav-link.active {
      background-color: var(--primary, #3b82f6);
      color: #fff;
    }

    .nav-icon {
      font-size: 20px;
      width: 24px;
      text-align: center;
      flex-shrink: 0;
    }

    .nav-label {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .nav-badge {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }

    .badge-info {
      background-color: #3b82f6;
      color: #fff;
    }

    .badge-warning {
      background-color: #f59e0b;
      color: #000;
    }

    .badge-danger {
      background-color: #ef4444;
      color: #fff;
    }

    /* Submenu */
    .nav-submenu {
      list-style: none;
      padding: 6px 0 6px 20px;
      margin: 4px 0 0 16px;
      border-left: 2px solid rgba(255, 255, 255, 0.15);
    }

    .nav-subitem {
      margin: 2px 0;
    }

    .nav-sublink {
      display: block;
      padding: 8px 12px;
      font-size: 13px;
      color: var(--sidebar-muted, #64748b);
      text-decoration: none;
      border-radius: 6px;
      transition: all 0.2s ease;
      position: relative;
    }

    .nav-sublink::before {
      content: '';
      position: absolute;
      left: -14px;
      top: 50%;
      width: 8px;
      height: 2px;
      background-color: rgba(255, 255, 255, 0.15);
    }

    .nav-sublink:hover {
      color: #fff;
      background-color: rgba(255, 255, 255, 0.05);
    }

    .nav-sublink:hover::before {
      background-color: rgba(255, 255, 255, 0.3);
    }

    .nav-sublink.active {
      color: var(--primary-400, #60a5fa);
      background-color: rgba(59, 130, 246, 0.1);
    }

    .nav-sublink.active::before {
      background-color: var(--primary-400, #60a5fa);
    }

    /* Parent item with children styling */
    .has-children > .nav-link {
      position: relative;
    }

    .has-children > .nav-link::after {
      content: '';
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 0;
      height: 0;
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
      border-top: 5px solid currentColor;
      opacity: 0.5;
    }

    /* Footer */
    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .tier-badge {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
    }

    .tier-free {
      background-color: #64748b;
      color: #fff;
    }

    .tier-basic {
      background-color: #3b82f6;
      color: #fff;
    }

    .tier-professional {
      background-color: #8b5cf6;
      color: #fff;
    }

    .tier-enterprise {
      background-color: #f59e0b;
      color: #000;
    }

    .collapse-btn {
      background: none;
      border: none;
      color: var(--sidebar-text);
      cursor: pointer;
      padding: 8px;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .collapse-btn:hover {
      background-color: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .sidebar {
        transform: translateX(-100%);
      }

      .sidebar.mobile-open {
        transform: translateX(0);
      }

      .mobile-close {
        display: block;
      }

      .collapse-btn {
        display: none;
      }
    }
  `]
})
export class SidebarComponent {
  readonly uiState = inject(UIStateService);
  readonly authState = inject(AuthStateService);
  readonly featureFlags = inject(FeatureFlagService);

  mainNavItems: NavItem[] = [
    {
      labelKey: 'nav.dashboard',
      icon: 'icon-home',
      route: '/dashboard'
    },
    {
      labelKey: 'nav.products',
      icon: 'icon-package',
      route: '/products',
      children: [
        { labelKey: 'nav.allProducts', route: '/products' },
        { labelKey: 'nav.categories', route: '/products/categories' },
        { labelKey: 'nav.manufacturers', route: '/products/manufacturers' },
        { labelKey: 'nav.lowStock', route: '/products/low-stock', badge: '12', badgeType: 'warning' }
      ]
    },
    {
      labelKey: 'nav.inventory',
      icon: 'icon-layers',
      route: '/inventory',
      feature: 'inventory_management'
    },
    {
      labelKey: 'nav.orders',
      icon: 'icon-shopping-cart',
      route: '/orders',
      children: [
        { labelKey: 'nav.allOrders', route: '/orders' },
        { labelKey: 'nav.pending', route: '/orders/pending' },
        { labelKey: 'nav.prescriptions', route: '/orders/prescriptions', feature: 'prescription_management' }
      ]
    },
    {
      labelKey: 'nav.customers',
      icon: 'icon-users',
      route: '/customers',
      feature: 'customer_management',
      roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager, UserRole.SalesRep]
    },
    {
      labelKey: 'nav.reports',
      icon: 'icon-bar-chart',
      route: '/reports',
      feature: 'basic_reports',
      children: [
        { labelKey: 'nav.salesReport', route: '/reports/sales' },
        { labelKey: 'nav.inventoryReport', route: '/reports/inventory' },
        { labelKey: 'nav.advancedAnalytics', route: '/reports/analytics', feature: 'advanced_analytics' }
      ]
    }
  ];

  adminNavItems: NavItem[] = [
    {
      labelKey: 'nav.userManagement',
      icon: 'icon-user-cog',
      route: '/admin/users',
      roles: [UserRole.SuperAdmin, UserRole.Admin]
    },
    {
      labelKey: 'nav.settings',
      icon: 'icon-settings',
      route: '/admin/settings',
      roles: [UserRole.SuperAdmin, UserRole.Admin]
    },
    {
      labelKey: 'nav.auditLogs',
      icon: 'icon-file-text',
      route: '/admin/audit-logs',
      feature: 'audit_logs',
      roles: [UserRole.SuperAdmin, UserRole.Admin]
    },
    {
      labelKey: 'nav.integrations',
      icon: 'icon-link',
      route: '/admin/integrations',
      feature: 'api_access',
      roles: [UserRole.SuperAdmin]
    }
  ];

  canShowNavItem(item: NavItem): boolean {
    // Check role-based access
    if (item.roles && item.roles.length > 0) {
      if (!this.authState.hasAnyRole(item.roles)) {
        return false;
      }
    }

    // Check feature-based access
    if (item.feature) {
      if (!this.featureFlags.isFeatureEnabled(item.feature)) {
        return false;
      }
    }

    // Check permission-based access
    if (item.permission) {
      if (!this.authState.hasPermission(item.permission as any)) {
        return false;
      }
    }

    return true;
  }

  isAdminOrManager(): boolean {
    return this.authState.hasAnyRole([
      UserRole.SuperAdmin,
      UserRole.Admin,
      UserRole.Manager
    ]);
  }
}
