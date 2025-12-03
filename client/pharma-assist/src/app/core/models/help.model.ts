// Help System Models

export interface HelpTip {
  id: string;
  title: string;
  content: string;
  targetSelector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  category?: string;
}

export interface TourStep {
  id: string;
  title: string;
  content: string;
  targetSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  highlightPadding?: number;
  action?: 'click' | 'input' | 'none';
  nextOnAction?: boolean;
}

export interface GuidedTour {
  id: string;
  name: string;
  description: string;
  steps: TourStep[];
  requiredRoute?: string;
}

export interface HelpArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  relatedArticles?: string[];
}

export const DASHBOARD_TOUR: GuidedTour = {
  id: 'dashboard-tour',
  name: 'help.tours.dashboard.name',
  description: 'help.tours.dashboard.description',
  requiredRoute: '/dashboard',
  steps: [
    {
      id: 'welcome',
      title: 'help.tours.dashboard.welcome.title',
      content: 'help.tours.dashboard.welcome.content',
      targetSelector: '.dashboard-header',
      position: 'bottom'
    },
    {
      id: 'stats',
      title: 'help.tours.dashboard.stats.title',
      content: 'help.tours.dashboard.stats.content',
      targetSelector: '.stats-grid',
      position: 'bottom'
    },
    {
      id: 'charts',
      title: 'help.tours.dashboard.charts.title',
      content: 'help.tours.dashboard.charts.content',
      targetSelector: '.charts-section',
      position: 'top'
    },
    {
      id: 'activity',
      title: 'help.tours.dashboard.activity.title',
      content: 'help.tours.dashboard.activity.content',
      targetSelector: '.activity-feed',
      position: 'left'
    }
  ]
};

export const PRODUCTS_TOUR: GuidedTour = {
  id: 'products-tour',
  name: 'help.tours.products.name',
  description: 'help.tours.products.description',
  requiredRoute: '/products',
  steps: [
    {
      id: 'search',
      title: 'help.tours.products.search.title',
      content: 'help.tours.products.search.content',
      targetSelector: '.search-input',
      position: 'bottom'
    },
    {
      id: 'filters',
      title: 'help.tours.products.filters.title',
      content: 'help.tours.products.filters.content',
      targetSelector: '.filters-section',
      position: 'bottom'
    },
    {
      id: 'table',
      title: 'help.tours.products.table.title',
      content: 'help.tours.products.table.content',
      targetSelector: '.products-table',
      position: 'top'
    },
    {
      id: 'actions',
      title: 'help.tours.products.actions.title',
      content: 'help.tours.products.actions.content',
      targetSelector: '.bulk-actions',
      position: 'bottom'
    }
  ]
};

export const ALL_TOURS: GuidedTour[] = [
  DASHBOARD_TOUR,
  PRODUCTS_TOUR
];

export const CONTEXTUAL_TIPS: Record<string, HelpTip> = {
  'low-stock': {
    id: 'low-stock',
    title: 'help.tips.lowStock.title',
    content: 'help.tips.lowStock.content',
    category: 'inventory'
  },
  'expiring-soon': {
    id: 'expiring-soon',
    title: 'help.tips.expiringSoon.title',
    content: 'help.tips.expiringSoon.content',
    category: 'inventory'
  },
  'bulk-actions': {
    id: 'bulk-actions',
    title: 'help.tips.bulkActions.title',
    content: 'help.tips.bulkActions.content',
    category: 'products'
  },
  'keyboard-shortcuts': {
    id: 'keyboard-shortcuts',
    title: 'help.tips.shortcuts.title',
    content: 'help.tips.shortcuts.content',
    category: 'general'
  }
};
