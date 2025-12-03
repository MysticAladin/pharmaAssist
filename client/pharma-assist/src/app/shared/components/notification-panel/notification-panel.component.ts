import { Component, inject, signal, computed, OnDestroy, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NotificationService, Notification } from '../../../core/services/notification.service';
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
  template: `
    <div class="notification-panel" [class.open]="isOpen()">
      <!-- Panel Header -->
      <div class="panel-header">
        <h3>{{ 'notifications.title' | translate }}</h3>
        <div class="header-actions">
          @if (unreadCount() > 0) {
            <button class="btn-text" (click)="markAllRead()">
              {{ 'notifications.markAllRead' | translate }}
            </button>
          }
          <button class="btn-icon" (click)="close()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="panel-tabs">
        <button
          class="tab"
          [class.active]="activeTab() === 'all'"
          (click)="setTab('all')">
          {{ 'notifications.tabs.all' | translate }}
          @if (totalCount() > 0) {
            <span class="tab-badge">{{ totalCount() }}</span>
          }
        </button>
        <button
          class="tab"
          [class.active]="activeTab() === 'unread'"
          (click)="setTab('unread')">
          {{ 'notifications.tabs.unread' | translate }}
          @if (unreadCount() > 0) {
            <span class="tab-badge urgent">{{ unreadCount() }}</span>
          }
        </button>
        <button
          class="tab"
          [class.active]="activeTab() === 'alerts'"
          (click)="setTab('alerts')">
          {{ 'notifications.tabs.alerts' | translate }}
          @if (alertsCount() > 0) {
            <span class="tab-badge warning">{{ alertsCount() }}</span>
          }
        </button>
      </div>

      <!-- Content -->
      <div class="panel-content">
        @if (loading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>{{ 'common.loading' | translate }}</p>
          </div>
        } @else if (filteredNotifications().length === 0) {
          <div class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <h4>{{ 'notifications.empty.title' | translate }}</h4>
            <p>{{ 'notifications.empty.message' | translate }}</p>
          </div>
        } @else {
          <div class="notification-list">
            @for (notification of filteredNotifications(); track notification.id) {
              <div
                class="notification-item"
                [class.unread]="!notification.read"
                [class]="'notification-' + notification.type"
                (click)="handleClick(notification)">

                <div class="notification-icon">
                  @switch (notification.type) {
                    @case ('success') {
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    }
                    @case ('danger') {
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                    }
                    @case ('warning') {
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    }
                    @default {
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                    }
                  }
                </div>

                <div class="notification-content">
                  <h5 class="notification-title">{{ notification.title }}</h5>
                  <p class="notification-message">{{ notification.message }}</p>
                  <span class="notification-time">{{ formatTime(notification.timestamp) }}</span>
                </div>

                <button class="btn-dismiss" (click)="dismiss(notification.id, $event)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            }
          </div>
        }
      </div>

      <!-- Footer -->
      @if (filteredNotifications().length > 0) {
        <div class="panel-footer">
          <button class="btn-text danger" (click)="clearAll()">
            {{ 'notifications.clearAll' | translate }}
          </button>
        </div>
      }
    </div>

    <!-- Backdrop -->
    @if (isOpen()) {
      <div class="backdrop" (click)="close()"></div>
    }
  `,
  styles: [`
    .notification-panel {
      position: fixed;
      top: 0;
      right: -400px;
      width: 400px;
      height: 100vh;
      background: #fff;
      box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
      z-index: 1001;
      display: flex;
      flex-direction: column;
      transition: right 0.3s ease;
    }

    .notification-panel.open {
      right: 0;
    }

    .backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      z-index: 1000;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #e5e7eb;
    }

    .panel-header h3 {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary, #1e293b);
      margin: 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-text {
      background: none;
      border: none;
      color: var(--primary, #3b82f6);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      padding: 6px 10px;
      border-radius: 6px;
      transition: background 0.2s;
    }

    .btn-text:hover {
      background: #f1f5f9;
    }

    .btn-text.danger {
      color: #ef4444;
    }

    .btn-text.danger:hover {
      background: #fef2f2;
    }

    .btn-icon {
      background: none;
      border: none;
      color: var(--text-muted, #64748b);
      cursor: pointer;
      padding: 8px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .btn-icon:hover {
      background: #f1f5f9;
      color: var(--text-primary, #1e293b);
    }

    .panel-tabs {
      display: flex;
      border-bottom: 1px solid #e5e7eb;
    }

    .tab {
      flex: 1;
      padding: 12px 16px;
      background: none;
      border: none;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-muted, #64748b);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }

    .tab:hover {
      color: var(--text-primary, #1e293b);
      background: #f8fafc;
    }

    .tab.active {
      color: var(--primary, #3b82f6);
      border-bottom-color: var(--primary, #3b82f6);
    }

    .tab-badge {
      background: #e5e7eb;
      color: var(--text-primary, #1e293b);
      font-size: 11px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 10px;
    }

    .tab-badge.urgent {
      background: #ef4444;
      color: white;
    }

    .tab-badge.warning {
      background: #f59e0b;
      color: white;
    }

    .panel-content {
      flex: 1;
      overflow-y: auto;
    }

    .notification-list {
      padding: 8px;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 4px;
      position: relative;
    }

    .notification-item:hover {
      background: #f8fafc;
    }

    .notification-item.unread {
      background: #f0f9ff;
    }

    .notification-item.unread::before {
      content: '';
      position: absolute;
      left: 4px;
      top: 50%;
      transform: translateY(-50%);
      width: 6px;
      height: 6px;
      background: var(--primary, #3b82f6);
      border-radius: 50%;
    }

    .notification-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .notification-success .notification-icon { background: #f0fdf4; color: #10b981; }
    .notification-danger .notification-icon { background: #fef2f2; color: #ef4444; }
    .notification-warning .notification-icon { background: #fffbeb; color: #f59e0b; }
    .notification-info .notification-icon { background: #eff6ff; color: #3b82f6; }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary, #1e293b);
      margin: 0 0 4px 0;
    }

    .notification-message {
      font-size: 13px;
      color: var(--text-muted, #64748b);
      margin: 0 0 6px 0;
      line-height: 1.4;
    }

    .notification-time {
      font-size: 11px;
      color: #94a3b8;
    }

    .btn-dismiss {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      opacity: 0;
      transition: all 0.2s;
    }

    .notification-item:hover .btn-dismiss {
      opacity: 1;
    }

    .btn-dismiss:hover {
      background: #e5e7eb;
      color: #64748b;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
      color: var(--text-muted, #64748b);
    }

    .empty-state svg {
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-state h4 {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary, #1e293b);
      margin: 0 0 8px 0;
    }

    .empty-state p {
      font-size: 14px;
      margin: 0;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top-color: var(--primary, #3b82f6);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .panel-footer {
      padding: 16px 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
    }

    @media (max-width: 480px) {
      .notification-panel {
        width: 100%;
        right: -100%;
      }
    }
  `]
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
