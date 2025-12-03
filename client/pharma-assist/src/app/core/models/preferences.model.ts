// User Preferences Models

export interface UserPreferences {
  // Appearance
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'bs';
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;

  // Dashboard
  dashboardLayout: DashboardWidget[];
  defaultDashboardPeriod: 'today' | 'week' | 'month' | 'year';

  // Notifications
  notificationSettings: NotificationPreferences;

  // Table/List preferences
  tableSettings: TablePreferences;

  // Accessibility
  accessibilitySettings: AccessibilityPreferences;
}

export interface DashboardWidget {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
  size: 'small' | 'medium' | 'large';
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  categories: {
    stock: boolean;
    orders: boolean;
    expiry: boolean;
    prescriptions: boolean;
    system: boolean;
  };
}

export interface TablePreferences {
  defaultPageSize: 10 | 25 | 50 | 100;
  showGridLines: boolean;
  striped: boolean;
  compact: boolean;
}

export interface AccessibilityPreferences {
  reduceMotion: boolean;
  highContrast: boolean;
  keyboardNavigation: boolean;
  screenReaderOptimized: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  language: 'en',
  fontSize: 'medium',
  compactMode: false,

  dashboardLayout: [
    { id: 'revenue', name: 'Revenue Overview', enabled: true, order: 1, size: 'large' },
    { id: 'orders', name: 'Recent Orders', enabled: true, order: 2, size: 'medium' },
    { id: 'stock', name: 'Low Stock Alerts', enabled: true, order: 3, size: 'medium' },
    { id: 'expiry', name: 'Expiring Products', enabled: true, order: 4, size: 'medium' },
    { id: 'activity', name: 'Activity Feed', enabled: true, order: 5, size: 'medium' },
    { id: 'customers', name: 'Top Customers', enabled: false, order: 6, size: 'small' }
  ],
  defaultDashboardPeriod: 'month',

  notificationSettings: {
    emailNotifications: true,
    pushNotifications: true,
    soundEnabled: false,
    categories: {
      stock: true,
      orders: true,
      expiry: true,
      prescriptions: true,
      system: true
    }
  },

  tableSettings: {
    defaultPageSize: 25,
    showGridLines: false,
    striped: true,
    compact: false
  },

  accessibilitySettings: {
    reduceMotion: false,
    highContrast: false,
    keyboardNavigation: true,
    screenReaderOptimized: false
  }
};
