import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards';
import { UserRole } from '../../core/models/user.model';

export const ADMIN_ROUTES: Routes = [
  { path: '', redirectTo: 'users', pathMatch: 'full' },
  { path: 'users', loadComponent: () => import('./users/users.component').then(m => m.UsersComponent) },
  { path: 'settings', loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent) },
  { path: 'audit-logs', loadComponent: () => import('./audit-logs/audit-logs.component').then(m => m.AuditLogsComponent) },
  {
    path: 'feature-flags',
    canActivate: [roleGuard],
    data: { roles: [UserRole.SuperAdmin, UserRole.Admin] },
    loadComponent: () => import('./feature-flags/feature-flags.component').then(m => m.FeatureFlagsComponent)
  },
  {
    path: 'integrations',
    canActivate: [roleGuard],
    data: { roles: [UserRole.SuperAdmin] },
    loadComponent: () => import('./integrations/integrations.component').then(m => m.IntegrationsComponent)
  },
  {
    path: 'pricing',
    canActivate: [roleGuard],
    data: { roles: [UserRole.SuperAdmin, UserRole.Admin] },
    loadComponent: () => import('./pricing/pricing.component').then(m => m.PricingComponent)
  },
  {
    path: 'targets',
    canActivate: [roleGuard],
    data: { roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager] },
    loadComponent: () => import('./targets/targets.component').then(m => m.TargetsComponent)
  }
];
