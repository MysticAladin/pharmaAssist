import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, ToastNotification } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-container">
      @for (notification of toasts(); track notification.id) {
        <div
          class="notification"
          [class]="'notification-' + notification.type">
          <div class="notification-icon">
            @switch (notification.type) {
              @case ('success') {
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              }
              @case ('error') {
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              }
              @case ('warning') {
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              }
              @default {
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              }
            }
          </div>
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            @if (notification.message) {
              <div class="notification-message">{{ notification.message }}</div>
            }
          </div>
          @if (notification.dismissible !== false) {
            <button
              class="notification-close"
              (click)="dismiss(notification.id)"
              aria-label="Dismiss notification">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .notifications-container {
      position: fixed;
      top: 80px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 400px;
      width: 100%;
      pointer-events: none;
    }

    .notification {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background-color: #fff;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      pointer-events: auto;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .notification-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .notification-icon i {
      font-size: 20px;
      color: #fff;
    }

    .notification-success .notification-icon {
      background-color: #10b981;
    }

    .notification-error .notification-icon {
      background-color: #ef4444;
    }

    .notification-warning .notification-icon {
      background-color: #f59e0b;
    }

    .notification-info .notification-icon {
      background-color: #3b82f6;
    }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-title {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 4px;
    }

    .notification-message {
      font-size: 13px;
      color: #64748b;
      line-height: 1.4;
    }

    .notification-close {
      background: none;
      border: none;
      padding: 4px;
      color: #94a3b8;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .notification-close:hover {
      background-color: #f1f5f9;
      color: #475569;
    }

    /* Dark mode */
    :host-context(.dark) .notification {
      background-color: #1e293b;
    }

    :host-context(.dark) .notification-title {
      color: #f8fafc;
    }

    :host-context(.dark) .notification-message {
      color: #94a3b8;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .notifications-container {
        right: 16px;
        left: 16px;
        max-width: none;
      }
    }
  `]
})
export class NotificationsComponent {
  private readonly notificationService = inject(NotificationService);

  toasts = this.notificationService.toasts;

  dismiss(id: string): void {
    this.notificationService.dismiss(id);
  }
}
