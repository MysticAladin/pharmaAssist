import { Injectable, signal, computed } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly _notifications = signal<Notification[]>([]);

  readonly notifications = computed(() => this._notifications());

  private generateId(): string {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  show(notification: Omit<Notification, 'id'>): string {
    const id = this.generateId();
    const newNotification: Notification = {
      id,
      duration: 5000,
      dismissible: true,
      ...notification
    };

    this._notifications.update(n => [...n, newNotification]);

    // Auto-dismiss after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => this.dismiss(id), newNotification.duration);
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
    this._notifications.update(n => n.filter(notif => notif.id !== id));
  }

  dismissAll(): void {
    this._notifications.set([]);
  }
}
