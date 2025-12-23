import { Component, inject, signal, computed, OnDestroy, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NotificationService } from '../../../core/services/notification.service';
import { DashboardService, DashboardAlert, DashboardData } from '../../../core/services/dashboard.service';
import { Subject, takeUntil, timer } from 'rxjs';

interface AlertNotification {
  id: string;
  type: 'warning' | 'danger' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
}

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './notification-panel-component/notification-panel.component.html',
  styleUrls: ['./notification-panel-component/notification-panel.component.scss']
})
export class NotificationPanelComponent implements OnDestroy {
  private readonly notificationService = inject(NotificationService);
  private readonly dashboardService = inject(DashboardService);
  private readonly destroy$ = new Subject<void>();

  // Input/Output for external control
  isOpenInput = input(false, { alias: 'isOpen' });
  closed = output<void>();

  // State
  isOpen = signal(false);
  loading = signal(false);
  activeTab = signal<'all' | 'unread' | 'alerts'>('all');
  notifications = signal<AlertNotification[]>([]);
  alerts = signal<DashboardAlert[]>([]);

  constructor() {
    // Sync input to internal signal
    effect(() => {
      const open = this.isOpenInput();
      if (open && !this.isOpen()) {
        this.open();
      } else if (!open && this.isOpen()) {
        this.isOpen.set(false);
      }
    });
  }

  // Computed
  unreadCount = computed(() => this.notifications().filter(n => !n.read).length);
  alertsCount = computed(() => this.alerts().length);
  totalCount = computed(() => this.notifications().length);

  filteredNotifications = computed(() => {
    const tab = this.activeTab();
    const allNotifications = this.getAllNotifications();

    switch (tab) {
      case 'unread':
        return allNotifications.filter(n => !n.read);
      case 'alerts':
        return allNotifications.filter(n => n.type === 'warning' || n.type === 'danger');
      default:
        return allNotifications;
    }
  });

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  open(): void {
    this.isOpen.set(true);
    this.loadAlerts();
  }

  close(): void {
    this.isOpen.set(false);
    this.closed.emit();
  }

  toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  setTab(tab: 'all' | 'unread' | 'alerts'): void {
    this.activeTab.set(tab);
  }

  markAllRead(): void {
    this.notifications.update(notifications =>
      notifications.map(n => ({ ...n, read: true }))
    );
  }

  dismiss(id: string, event?: Event): void {
    event?.stopPropagation();
    this.notifications.update(notifications =>
      notifications.filter(n => n.id !== id)
    );
    this.alerts.update(alerts =>
      alerts.filter(a => a.id !== id)
    );
  }

  clearAll(): void {
    this.notifications.set([]);
    this.alerts.set([]);
  }

  handleClick(notification: AlertNotification): void {
    // Mark as read
    this.notifications.update(notifications =>
      notifications.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );

    // Navigate if link exists
    if (notification.link) {
      this.close();
      // Router navigation would go here
    }
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  }

  private loadAlerts(): void {
    this.loading.set(true);
    this.dashboardService.getDashboardData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.alerts.set(data.alerts);
          // Convert alerts to notifications
          const alertNotifications: AlertNotification[] = data.alerts.map(alert => ({
            id: alert.id,
            type: alert.type,
            title: alert.title,
            message: alert.description,
            timestamp: new Date(),
            read: false,
            link: alert.link
          }));
          this.notifications.update(current => {
            const existingIds = new Set(current.map(n => n.id));
            const newOnes = alertNotifications.filter(n => !existingIds.has(n.id));
            return [...newOnes, ...current];
          });
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }

  private getAllNotifications(): AlertNotification[] {
    return this.notifications();
  }
}
