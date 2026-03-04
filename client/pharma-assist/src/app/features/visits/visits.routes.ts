import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards';
import { UserRole } from '../../core/models/user.model';

export const VISITS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./visits-home.component').then(m => m.VisitsHomeComponent) },

  {
    path: 'today',
    canActivate: [roleGuard],
    data: { roles: [UserRole.SalesRep] },
    loadComponent: () => import('./visits-today.component').then(m => m.VisitsTodayComponent)
  },
  {
    path: 'check-in',
    canActivate: [roleGuard],
    data: { roles: [UserRole.SalesRep] },
    loadComponent: () => import('./visit-check-in.component').then(m => m.VisitCheckInComponent)
  },
  {
    path: 'planner',
    canActivate: [roleGuard],
    data: { roles: [UserRole.SalesRep] },
    loadComponent: () => import('./visit-planner.component').then(m => m.VisitPlannerComponent)
  },
  {
    path: 'calendar',
    canActivate: [roleGuard],
    data: { roles: [UserRole.SalesRep] },
    loadComponent: () => import('./visit-calendar.component').then(m => m.VisitCalendarComponent)
  },
  {
    path: 'planning-hierarchy',
    canActivate: [roleGuard],
    data: { roles: [UserRole.SalesRep, UserRole.Manager] },
    loadComponent: () => import('./planning-hierarchy.component').then(m => m.PlanningHierarchyComponent)
  },
  {
    path: 'history',
    canActivate: [roleGuard],
    data: { roles: [UserRole.SalesRep] },
    loadComponent: () => import('./visit-history.component').then(m => m.VisitHistoryComponent)
  },

  {
    path: 'team',
    canActivate: [roleGuard],
    data: { roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager] },
    loadComponent: () => import('./visits-team.component').then(m => m.VisitsTeamComponent)
  },
  {
    path: 'team-activity',
    canActivate: [roleGuard],
    data: { roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager] },
    loadComponent: () => import('./team-activity-dashboard.component').then(m => m.TeamActivityDashboardComponent)
  },
  {
    path: 'audit',
    canActivate: [roleGuard],
    data: { roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager] },
    loadComponent: () => import('./visit-audit.component').then(m => m.VisitAuditComponent)
  },
  {
    path: 'plans/:planId',
    canActivate: [roleGuard],
    data: { roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager] },
    loadComponent: () => import('./visit-plan-detail.component').then(m => m.VisitPlanDetailComponent)
  },

  {
    path: ':id',
    canActivate: [roleGuard],
    data: { roles: [UserRole.SalesRep, UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager] },
    loadComponent: () => import('./visit-detail.component').then(m => m.VisitDetailComponent)
  }
];
