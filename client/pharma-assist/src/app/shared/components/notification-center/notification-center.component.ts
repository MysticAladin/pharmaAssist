import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { NotificationService, PersistentNotification, NotificationCategory } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="notification-center" [class.open]="isOpen()">
      <!-- Trigger Button -->
      <button class="notification-trigger" (click)="toggle()" [attr.aria-label]="'notifications.title' | translate">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        @if (unreadCount() > 0) {
          <span class="notification-badge">{{ unreadCount() > 99 ? '99+' : unreadCount() }}</span>
        }
      </button>

      <!-- Dropdown Panel -->
      @if (isOpen()) {
        <div class="notification-panel" (click)="$event.stopPropagation()">
          <div class="panel-header">
            <h3>{{ 'notifications.title' | translate }}</h3>
            <div class="header-actions">
              @if (hasUnread()) {
                <button class="action-btn" (click)="markAllRead()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {{ 'notifications.markAllRead' | translate }}
                </button>
              }
              @if (notifications().length > 0) {
                <button class="action-btn text-danger" (click)="clearAll()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                  {{ 'notifications.clearAll' | translate }}
                </button>
              }
            </div>
          </div>

          <!-- Category Tabs -->
          <div class="category-tabs">
            <button
              class="tab-btn"
              [class.active]="activeCategory() === 'all'"
              (click)="setCategory('all')">
              {{ 'notifications.categories.all' | translate }}
              @if (unreadCount() > 0) {
                <span class="tab-badge">{{ unreadCount() }}</span>
              }
            </button>
            <button
              class="tab-btn"
              [class.active]="activeCategory() === 'stock'"
              (click)="setCategory('stock')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </button>
            <button
              class="tab-btn"
              [class.active]="activeCategory() === 'order'"
              (click)="setCategory('order')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
              </svg>
            </button>
            <button
              class="tab-btn"
              [class.active]="activeCategory() === 'expiry'"
              (click)="setCategory('expiry')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </button>
            <button
              class="tab-btn"
              [class.active]="activeCategory() === 'prescription'"
              (click)="setCategory('prescription')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </button>
          </div>

          <!-- Notifications List -->
          <div class="notifications-list">
            @if (filteredNotifications().length === 0) {
              <div class="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <p>{{ 'notifications.empty' | translate }}</p>
              </div>
            } @else {
              @for (notification of filteredNotifications(); track notification.id) {
                <div
                  class="notification-item"
                  [class.unread]="!notification.read"
                  [class.type-success]="notification.type === 'success'"
                  [class.type-error]="notification.type === 'error'"
                  [class.type-warning]="notification.type === 'warning'"
                  [class.type-info]="notification.type === 'info'"
                  (click)="handleClick(notification)">

                  <div class="notification-icon">
                    @switch (notification.type) {
                      @case ('success') {
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                          <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                      }
                      @case ('error') {
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="15" y1="9" x2="9" y2="15"/>
                          <line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                      }
                      @case ('warning') {
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                          <line x1="12" y1="9" x2="12" y2="13"/>
                          <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                      }
                      @default {
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="16" x2="12" y2="12"/>
                          <line x1="12" y1="8" x2="12.01" y2="8"/>
                        </svg>
                      }
                    }
                  </div>

                  <div class="notification-content">
                    <div class="notification-title">{{ notification.title }}</div>
                    <div class="notification-message">{{ notification.message }}</div>
                    <div class="notification-time">{{ formatTime(notification.timestamp) }}</div>
                  </div>

                  <button
                    class="delete-btn"
                    (click)="deleteNotification($event, notification.id)"
                    [attr.aria-label]="'common.delete' | translate">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              }
            }
          </div>
        </div>
      }
    </div>

    <!-- Backdrop -->
    @if (isOpen()) {
      <div class="backdrop" (click)="close()"></div>
    }
  `,
  styles: [`
    .notification-center {
      position: relative;
    }

    .notification-trigger {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      border-radius: 8px;
      cursor: pointer;
      color: var(--text-secondary, #6b7280);
      transition: all 0.2s;
    }

    .notification-trigger:hover {
      background: var(--bg-hover, #f3f4f6);
      color: var(--text-primary, #1a1a2e);
    }

    .notification-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      font-size: 0.7rem;
      font-weight: 600;
      color: white;
      background: #ef4444;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .notification-panel {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 380px;
      max-height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      border: 1px solid var(--border-color, #e5e7eb);
      z-index: 1001;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid var(--border-color, #e5e7eb);
    }

    .panel-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary, #1a1a2e);
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.35rem 0.5rem;
      border: none;
      background: transparent;
      font-size: 0.75rem;
      color: var(--pharma-teal, #0d9488);
      cursor: pointer;
      border-radius: 4px;
      transition: background 0.15s;
    }

    .action-btn:hover {
      background: var(--bg-hover, #f3f4f6);
    }

    .action-btn.text-danger {
      color: #ef4444;
    }

    .category-tabs {
      display: flex;
      gap: 0.25rem;
      padding: 0.5rem;
      border-bottom: 1px solid var(--border-color, #e5e7eb);
      background: var(--bg-secondary, #f9fafb);
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.4rem 0.6rem;
      border: none;
      background: transparent;
      font-size: 0.8rem;
      color: var(--text-secondary, #6b7280);
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.15s;
    }

    .tab-btn:hover {
      background: white;
      color: var(--text-primary, #1a1a2e);
    }

    .tab-btn.active {
      background: white;
      color: var(--pharma-teal, #0d9488);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }

    .tab-badge {
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      font-size: 0.65rem;
      font-weight: 600;
      color: white;
      background: #ef4444;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .notifications-list {
      flex: 1;
      overflow-y: auto;
      max-height: 350px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1rem;
      color: var(--text-secondary, #6b7280);
    }

    .empty-state svg {
      opacity: 0.4;
      margin-bottom: 0.75rem;
    }

    .empty-state p {
      margin: 0;
      font-size: 0.875rem;
    }

    .notification-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border-bottom: 1px solid var(--border-color, #e5e7eb);
      cursor: pointer;
      transition: background 0.15s;
      position: relative;
    }

    .notification-item:hover {
      background: var(--bg-hover, #f9fafb);
    }

    .notification-item:last-child {
      border-bottom: none;
    }

    .notification-item.unread {
      background: rgba(13, 148, 136, 0.04);
    }

    .notification-item.unread::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: var(--pharma-teal, #0d9488);
    }

    .notification-icon {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .type-success .notification-icon {
      background: #d1fae5;
      color: #059669;
    }

    .type-error .notification-icon {
      background: #fee2e2;
      color: #dc2626;
    }

    .type-warning .notification-icon {
      background: #fef3c7;
      color: #d97706;
    }

    .type-info .notification-icon {
      background: #dbeafe;
      color: #2563eb;
    }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-title {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary, #1a1a2e);
      margin-bottom: 0.15rem;
    }

    .notification-message {
      font-size: 0.8rem;
      color: var(--text-secondary, #6b7280);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 0.25rem;
    }

    .notification-time {
      font-size: 0.7rem;
      color: var(--text-tertiary, #9ca3af);
    }

    .delete-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      color: var(--text-tertiary, #9ca3af);
      cursor: pointer;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: all 0.15s;
    }

    .notification-item:hover .delete-btn {
      opacity: 1;
    }

    .delete-btn:hover {
      background: #fee2e2;
      color: #dc2626;
    }

    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 1000;
    }

    @media (max-width: 480px) {
      .notification-panel {
        position: fixed;
        top: 60px;
        right: 0.5rem;
        left: 0.5rem;
        width: auto;
      }
    }
  `]
})
export class NotificationCenterComponent {
  private readonly notificationService = inject(NotificationService);

  isOpen = signal(false);
  activeCategory = signal<NotificationCategory | 'all'>('all');

  notifications = this.notificationService.notifications;
  unreadCount = this.notificationService.unreadCount;
  hasUnread = this.notificationService.hasUnread;

  filteredNotifications = computed(() => {
    const category = this.activeCategory();
    if (category === 'all') {
      return this.notifications();
    }
    return this.notifications().filter(n => n.category === category);
  });

  toggle(): void {
    this.isOpen.update(v => !v);
  }

  close(): void {
    this.isOpen.set(false);
  }

  setCategory(category: NotificationCategory | 'all'): void {
    this.activeCategory.set(category);
  }

  markAllRead(): void {
    this.notificationService.markAllAsRead();
  }

  clearAll(): void {
    this.notificationService.clearAllNotifications();
  }

  handleClick(notification: PersistentNotification): void {
    this.notificationService.handleNotificationAction(notification);
    this.close();
  }

  deleteNotification(event: Event, id: string): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(id);
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  }
}
