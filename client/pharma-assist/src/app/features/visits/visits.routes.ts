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
    path: 'team',
    canActivate: [roleGuard],
    data: { roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager] },
    loadComponent: () => import('./visits-team.component').then(m => m.VisitsTeamComponent)
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
