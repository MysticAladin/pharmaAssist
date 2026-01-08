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
  templateUrl: './sidebar-component/sidebar.component.html',
  styleUrls: ['./sidebar-component/sidebar.component.scss']
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
        { labelKey: 'nav.claims', route: '/orders/claims' },
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
      labelKey: 'nav.visits',
      icon: 'icon-map-pin',
      route: '/visits',
      roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager, UserRole.SalesRep]
    },
    {
      labelKey: 'nav.reports',
      icon: 'icon-bar-chart',
      route: '/reports',
      feature: 'basic_reports',
      children: [
        { labelKey: 'nav.salesReport', route: '/reports/sales' },
        { labelKey: 'nav.customerSalesReport', route: '/reports/customers' },
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
      labelKey: 'nav.salesReps',
      icon: 'icon-users',
      route: '/admin/sales-reps',
      roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager]
    },
    {
      labelKey: 'nav.featureFlags',
      icon: 'icon-toggle-left',
      route: '/admin/feature-flags',
      roles: [UserRole.SuperAdmin]
    },
    {
      labelKey: 'nav.pricing',
      icon: 'icon-tag',
      route: '/admin/pricing',
      roles: [UserRole.SuperAdmin, UserRole.Admin]
    },
    {
      labelKey: 'nav.targets',
      icon: 'icon-target',
      route: '/admin/targets',
      roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager]
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
