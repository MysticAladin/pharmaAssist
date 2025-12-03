export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationCategory = 'stock' | 'order' | 'expiry' | 'system' | 'prescription';

export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  data?: Record<string, unknown>;
}

export interface ToastNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
}

export interface NotificationPreferences {
  lowStockAlerts: boolean;
  expiryAlerts: boolean;
  orderAlerts: boolean;
  prescriptionAlerts: boolean;
  soundEnabled: boolean;
  desktopNotifications: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  lowStockAlerts: true,
  expiryAlerts: true,
  orderAlerts: true,
  prescriptionAlerts: true,
  soundEnabled: true,
  desktopNotifications: false
};
