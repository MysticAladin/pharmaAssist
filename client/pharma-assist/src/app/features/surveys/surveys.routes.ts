import { Routes } from '@angular/router';

export const SURVEYS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./survey-list/survey-list.component').then(m => m.SurveyListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./survey-builder/survey-builder.component').then(m => m.SurveyBuilderComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./survey-detail/survey-detail.component').then(m => m.SurveyDetailComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./survey-builder/survey-builder.component').then(m => m.SurveyBuilderComponent)
  },
  {
    path: ':id/fill',
    loadComponent: () => import('./survey-fill/survey-fill.component').then(m => m.SurveyFillComponent)
  },
  {
    path: ':id/analytics',
    loadComponent: () => import('./survey-analytics/survey-analytics.component').then(m => m.SurveyAnalyticsComponent)
  }
];
