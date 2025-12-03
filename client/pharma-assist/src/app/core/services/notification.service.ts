import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';
export type NotificationCategory = 'stock' | 'order' | 'expiry' | 'system' | 'prescription';

// Toast notifications (temporary)
export interface ToastNotification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
}

// Persistent notifications (notification center)
export interface PersistentNotification {
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

export interface NotificationPreferences {
  lowStockAlerts: boolean;
  expiryAlerts: boolean;
  orderAlerts: boolean;
  prescriptionAlerts: boolean;
  soundEnabled: boolean;
  desktopNotifications: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  lowStockAlerts: true,
  expiryAlerts: true,
  orderAlerts: true,
  prescriptionAlerts: true,
  soundEnabled: true,
  desktopNotifications: false
};

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly router = inject(Router);

  // Toast notifications (temporary popups)
  private readonly _toasts = signal<ToastNotification[]>([]);
  readonly toasts = computed(() => this._toasts());

  // Persistent notifications (notification center)
  private readonly _notifications = signal<PersistentNotification[]>([]);
  readonly notifications = computed(() => this._notifications());

  // Preferences
  private readonly _preferences = signal<NotificationPreferences>(this.loadPreferences());
  readonly preferences = computed(() => this._preferences());

  // Computed values
  readonly unreadCount = computed(() =>
    this._notifications().filter(n => !n.read).length
  );

  readonly hasUnread = computed(() => this.unreadCount() > 0);

  readonly recentNotifications = computed(() =>
    this._notifications().slice(0, 10)
  );

  constructor() {
    this.loadNotifications();

    if (this._preferences().desktopNotifications) {
      this.requestDesktopPermission();
    }
  }

  private generateId(): string {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============ TOAST NOTIFICATIONS ============

  show(notification: Omit<ToastNotification, 'id'>): string {
    const id = this.generateId();
    const newNotification: ToastNotification = {
      id,
      duration: 5000,
      dismissible: true,
      ...notification
    };

    this._toasts.update(n => [...n, newNotification]);

    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => this.dismiss(id), newNotification.duration);
    }

    if (this._preferences().soundEnabled) {
      this.playSound(notification.type);
    }

    return id;
  }

  success(title: string, message?: string, duration = 5000): string {
    return this.show({ type: 'success', title, message, duration });
  }

  error(title: string, message?: string, duration = 8000): string {
    return this.show({ type: 'error', title, message, duration });
  }

  warning(title: string, message?: string, duration = 6000): string {
    return this.show({ type: 'warning', title, message, duration });
  }

  info(title: string, message?: string, duration = 5000): string {
    return this.show({ type: 'info', title, message, duration });
  }

  dismiss(id: string): void {
    this._toasts.update(n => n.filter(notif => notif.id !== id));
  }

  dismissAll(): void {
    this._toasts.set([]);
  }

  // ============ PERSISTENT NOTIFICATIONS ============

  addNotification(
    type: NotificationType,
    category: NotificationCategory,
    title: string,
    message: string,
    options?: {
      actionUrl?: string;
      actionLabel?: string;
      data?: Record<string, unknown>;
      showToast?: boolean;
    }
  ): PersistentNotification {
    const notification: PersistentNotification = {
      id: this.generateId(),
      type,
      category,
      title,
      message,
      timestamp: new Date(),
      read: false,
      actionUrl: options?.actionUrl,
      actionLabel: options?.actionLabel,
      data: options?.data
    };

    this._notifications.update(notifications => [notification, ...notifications]);
    this.saveNotifications();

    if (options?.showToast !== false) {
      this.show({ type, title, message });
    }

    if (this._preferences().desktopNotifications) {
      this.showDesktopNotification(title, message);
    }

    return notification;
  }

  // Stock Alerts
  notifyLowStock(productName: string, currentStock: number, minStock: number, productId: string): void {
    if (!this._preferences().lowStockAlerts) return;

    this.addNotification(
      'warning',
      'stock',
      'Low Stock Alert',
      `${productName} is running low (${currentStock}/${minStock} units)`,
      {
        actionUrl: `/products/${productId}`,
        actionLabel: 'View Product',
        data: { productId, currentStock, minStock }
      }
    );
  }

  notifyOutOfStock(productName: string, productId: string): void {
    if (!this._preferences().lowStockAlerts) return;

    this.addNotification(
      'error',
      'stock',
      'Out of Stock',
      `${productName} is out of stock`,
      {
        actionUrl: `/products/${productId}`,
        actionLabel: 'Restock Now',
        data: { productId }
      }
    );
  }

  // Expiry Alerts
  notifyExpiringProduct(productName: string, expiryDate: Date, productId: string): void {
    if (!this._preferences().expiryAlerts) return;

    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    this.addNotification(
      daysUntilExpiry <= 7 ? 'error' : 'warning',
      'expiry',
      'Product Expiring Soon',
      `${productName} expires in ${daysUntilExpiry} days`,
      {
        actionUrl: `/products/${productId}`,
        actionLabel: 'View Product',
        data: { productId, expiryDate: expiryDate.toISOString(), daysUntilExpiry }
      }
    );
  }

  notifyExpiredProduct(productName: string, productId: string): void {
    if (!this._preferences().expiryAlerts) return;

    this.addNotification(
      'error',
      'expiry',
      'Product Expired',
      `${productName} has expired and should be removed`,
      {
        actionUrl: `/products/${productId}`,
        actionLabel: 'View Product',
        data: { productId }
      }
    );
  }

  // Order Alerts
  notifyNewOrder(orderNumber: string, customerName: string, orderId: string): void {
    if (!this._preferences().orderAlerts) return;

    this.addNotification(
      'info',
      'order',
      'New Order Received',
      `Order ${orderNumber} from ${customerName}`,
      {
        actionUrl: `/orders/${orderId}`,
        actionLabel: 'View Order',
        data: { orderId, orderNumber }
      }
    );
  }

  notifyOrderStatusChange(orderNumber: string, newStatus: string, orderId: string): void {
    if (!this._preferences().orderAlerts) return;

    this.addNotification(
      'success',
      'order',
      'Order Status Updated',
      `Order ${orderNumber} is now ${newStatus}`,
      {
        actionUrl: `/orders/${orderId}`,
        actionLabel: 'View Order',
        data: { orderId, orderNumber, status: newStatus }
      }
    );
  }

  // Prescription Alerts
  notifyNewPrescription(prescriptionNumber: string, patientName: string, prescriptionId: string): void {
    if (!this._preferences().prescriptionAlerts) return;

    this.addNotification(
      'info',
      'prescription',
      'New Prescription',
      `Prescription ${prescriptionNumber} for ${patientName}`,
      {
        actionUrl: `/prescriptions/${prescriptionId}`,
        actionLabel: 'View Prescription',
        data: { prescriptionId, prescriptionNumber }
      }
    );
  }

  // Notification Management
  markAsRead(id: string): void {
    this._notifications.update(notifications =>
      notifications.map(n => n.id === id ? { ...n, read: true } : n)
    );
    this.saveNotifications();
  }

  markAllAsRead(): void {
    this._notifications.update(notifications =>
      notifications.map(n => ({ ...n, read: true }))
    );
    this.saveNotifications();
  }

  deleteNotification(id: string): void {
    this._notifications.update(notifications =>
      notifications.filter(n => n.id !== id)
    );
    this.saveNotifications();
  }

  clearAllNotifications(): void {
    this._notifications.set([]);
    this.saveNotifications();
  }

  handleNotificationAction(notification: PersistentNotification): void {
    this.markAsRead(notification.id);
    if (notification.actionUrl) {
      this.router.navigateByUrl(notification.actionUrl);
    }
  }

  // Preferences
  updatePreferences(preferences: Partial<NotificationPreferences>): void {
    this._preferences.update(current => ({ ...current, ...preferences }));
    this.savePreferences();

    if (preferences.desktopNotifications) {
      this.requestDesktopPermission();
    }
  }

  // Private methods
  private loadNotifications(): void {
    try {
      const stored = localStorage.getItem('pharma_notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        const notifications = parsed.map((n: PersistentNotification) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        this._notifications.set(notifications);
      }
    } catch {
      console.warn('Failed to load notifications');
    }
  }

  private saveNotifications(): void {
    try {
      const toSave = this._notifications().slice(0, 100);
      localStorage.setItem('pharma_notifications', JSON.stringify(toSave));
    } catch {
      console.warn('Failed to save notifications');
    }
  }

  private loadPreferences(): NotificationPreferences {
    try {
      const stored = localStorage.getItem('pharma_notification_prefs');
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch {
      console.warn('Failed to load notification preferences');
    }
    return DEFAULT_PREFERENCES;
  }

  private savePreferences(): void {
    try {
      localStorage.setItem('pharma_notification_prefs', JSON.stringify(this._preferences()));
    } catch {
      console.warn('Failed to save notification preferences');
    }
  }

  private playSound(type: NotificationType): void {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const frequencies: Record<NotificationType, number> = {
        success: 800,
        info: 600,
        warning: 400,
        error: 300
      };

      oscillator.frequency.value = frequencies[type];
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
    } catch {
      // Audio not supported
    }
  }

  private requestDesktopPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  private showDesktopNotification(title: string, body: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/assets/icons/icon-192x192.png' });
    }
  }
}
